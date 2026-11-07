// The audio engine (architecture, Audio Architecture): one AudioContext, made on the first
// tap (browsers start sound only after a gesture), a master gain for mute, a bus for the
// effects and one for the machine loops, and a lookahead scheduler: every 25 ms it puts the
// next 100 ms of loop hits on the audio clock, so the timing never depends on the main
// thread. Where there is no Web Audio (tests, node, an old browser) every call does nothing.
// Never imports React or the store: effects and the app shell drive it.

import type { LoopLevels } from '@/audio/ambience';
import { loops, noteAt } from '@/audio/loops';
import { nextBarAt, stepsBetween } from '@/audio/music';
import { playSound, type SoundId, voice } from '@/audio/voices';
import { type RoomId, roomIds } from '@/room/types';

/** The whole game's loudness: modest, for a tablet's speaker or headphones. */
export const MASTER_LEVEL = 0.55;
/** The effects' share. */
export const EFFECTS_LEVEL = 0.8;
/** The machine loops' share: under the effects, so a tick always cuts through. */
export const LOOPS_LEVEL = 0.45;
/** How often the scheduler runs, and how far ahead it schedules (seconds). */
export const TICK_MS = 25;
export const LOOKAHEAD = 0.1;
/** A loop fading in, out or to a new level (seconds). */
const FADE = 1.5;
/** Mute and unmute (seconds). */
const MUTE_FADE = 0.06;

export interface Timers {
  setInterval(run: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

export interface EngineOptions {
  /** Makes the AudioContext; null where there is no Web Audio. */
  makeContext?: () => AudioContext | null;
  timers?: Timers;
}

export interface AudioEngine {
  /** On a user gesture: makes the context if need be, and resumes it. */
  unlock(): void;
  /** Mute everything, or bring it back. Before the first tap it is remembered. */
  setMuted(muted: boolean): void;
  /** Plays an effect now; nothing while muted or before the first tap. */
  play(sound: SoundId): void;
  /** Which machine loops play and how loud; a new one joins on the next bar. */
  setLoops(levels: LoopLevels): void;
  /** The page is hidden or shown: the context sleeps while hidden, to spare the battery. */
  setHidden(hidden: boolean): void;
  /** Stops the scheduler and closes the context (tests; play never needs it). */
  dispose(): void;
  /** For tests and the dev notes: whether sound can play now. */
  readonly running: boolean;
}

function realContext(): AudioContext | null {
  try {
    const scope = globalThis as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Context = scope.AudioContext ?? scope.webkitAudioContext;
    return Context ? new Context({ latencyHint: 'interactive' }) : null;
  } catch {
    return null;
  }
}

const realTimers: Timers = {
  setInterval: (run, ms) => globalThis.setInterval(run, ms),
  clearInterval: (id) => globalThis.clearInterval(id as ReturnType<typeof setInterval>),
};

interface PlayingLoop {
  gain: GainNode;
  /** When it joins: a bar line. */
  startAt: number;
  /** When it has faded out and stops, or null while it plays. */
  stopAt: number | null;
  level: number;
}

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  effects: GainNode;
  loopBus: GainNode;
  /** The grid's start: bar 1 of the city's music. */
  origin: number;
  /** The scheduler has put everything before this on the clock. */
  scheduledUntil: number;
  playing: Map<RoomId, PlayingLoop>;
}

export function createAudioEngine(options: EngineOptions = {}): AudioEngine {
  const makeContext = options.makeContext ?? realContext;
  const timers = options.timers ?? realTimers;
  let graph: Graph | null = null;
  let failed = false;
  let muted = false;
  let hidden = false;
  let wanted: LoopLevels = {};
  let timer: unknown = null;

  const running = () => graph !== null && graph.ctx.state === 'running' && !muted && !hidden;

  function build(): Graph | null {
    if (graph || failed) return graph;
    const ctx = makeContext();
    if (!ctx) {
      failed = true;
      return null;
    }
    try {
      const master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_LEVEL;
      master.connect(ctx.destination);
      const effects = ctx.createGain();
      effects.gain.value = EFFECTS_LEVEL;
      effects.connect(master);
      const loopBus = ctx.createGain();
      loopBus.gain.value = LOOPS_LEVEL;
      loopBus.connect(master);
      const origin = ctx.currentTime + 0.05;
      graph = { ctx, master, effects, loopBus, origin, scheduledUntil: origin, playing: new Map() };
      timer = timers.setInterval(tick, TICK_MS);
      applyLoops();
      return graph;
    } catch {
      failed = true;
      graph = null;
      return null;
    }
  }

  /** One pass of the scheduler: the loop hits of the next `LOOKAHEAD` seconds. */
  function tick() {
    if (!graph) return;
    const { ctx } = graph;
    const now = ctx.currentTime;
    for (const [id, loop] of graph.playing) {
      if (loop.stopAt !== null && loop.stopAt <= now) {
        loop.gain.disconnect();
        graph.playing.delete(id);
      }
    }
    if (!running()) {
      // Nothing is scheduled while silent; on coming back it carries on from now.
      graph.scheduledUntil = now;
      return;
    }
    const from = Math.max(graph.scheduledUntil, now);
    const to = now + LOOKAHEAD;
    try {
      for (const step of stepsBetween(graph.origin, from, to)) {
        for (const [id, loop] of graph.playing) {
          if (step.time < loop.startAt) continue;
          if (loop.stopAt !== null && step.time >= loop.stopAt) continue;
          for (const v of loops[id].voices) {
            const degree = noteAt(v, step.index);
            if (degree === null) continue;
            voice(ctx, loop.gain, v.kind, degree, step.time, v.gain, v.length);
          }
        }
      }
    } catch {
      // A sound that fails to build is skipped; the game goes on.
    }
    graph.scheduledUntil = to;
  }

  /** Brings the playing loops to the wanted levels. */
  function applyLoops() {
    if (!graph) return;
    const { ctx, playing, loopBus } = graph;
    const now = ctx.currentTime;
    for (const id of roomIds) {
      const level = wanted[id] ?? 0;
      const loop = playing.get(id);
      if (level > 0 && (!loop || loop.stopAt !== null)) {
        // Joins on the next bar (a fading one starts again cleanly there too).
        loop?.gain.disconnect();
        const startAt = nextBarAt(graph.origin, now + 0.05);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(level, startAt + 0.4);
        gain.connect(loopBus);
        playing.set(id, { gain, startAt, stopAt: null, level });
      } else if (level > 0 && loop && loop.level !== level) {
        loop.gain.gain.cancelScheduledValues(now);
        loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
        loop.gain.gain.linearRampToValueAtTime(level, now + FADE);
        loop.level = level;
      } else if (level === 0 && loop && loop.stopAt === null) {
        loop.gain.gain.cancelScheduledValues(now);
        loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
        loop.gain.gain.linearRampToValueAtTime(0, now + FADE);
        loop.stopAt = now + FADE;
      }
    }
  }

  return {
    unlock() {
      const g = build();
      if (!g || hidden) return;
      if (g.ctx.state !== 'running') void g.ctx.resume().catch(() => undefined);
    },
    setMuted(next) {
      if (next === muted) return;
      muted = next;
      if (!graph) return;
      const { ctx, master } = graph;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_LEVEL, now + MUTE_FADE);
    },
    play(sound) {
      if (!graph || !running()) return;
      try {
        playSound(graph.ctx, graph.effects, sound, graph.ctx.currentTime + 0.005);
      } catch {
        // A sound that fails to build is skipped.
      }
    },
    setLoops(levels) {
      wanted = { ...levels };
      applyLoops();
    },
    setHidden(next) {
      if (next === hidden) return;
      hidden = next;
      if (!graph) return;
      if (hidden) void graph.ctx.suspend().catch(() => undefined);
      else void graph.ctx.resume().catch(() => undefined);
    },
    dispose() {
      if (timer !== null) timers.clearInterval(timer);
      timer = null;
      if (graph) void graph.ctx.close().catch(() => undefined);
      graph = null;
    },
    get running() {
      return running();
    },
  };
}
