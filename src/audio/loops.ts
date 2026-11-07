// Each restored machine's loop (GDD, Audio and Music: "the city's sound is the music").
// A loop is data: a few voices, each a 16-step pattern on the shared grid (audio/music.ts)
// with the scale degrees its hits play, in turn. The voices are synthesised by
// audio/voices.ts. Every loop is short and sparse, so all thirteen together still sound
// like one machine-town band rather than noise. Pure: no Web Audio here.

import { STEPS } from '@/audio/music';
import type { RoomId } from '@/room/types';

/** What a loop's hit sounds like (audio/voices.ts). */
export type VoiceKind =
  /** A short filtered click: a ratchet, a rail joint, a typebar. */
  | 'click'
  /** A metallic clank: a few inharmonic partials, quickly damped. */
  | 'clank'
  /** A low soft hum held for `length` steps: a boiler, a dynamo, a gas main. */
  | 'hum'
  /** A pitched gear whirr that rises over `length` steps. */
  | 'whirr'
  /** A wooden knock with a falling pitch: a paddle, a peg, a clock's tock. */
  | 'wood'
  /** A small bell or chime that rings on. */
  | 'bell'
  /** A puff of steam or a splash of water: filtered noise. */
  | 'puff';

export interface Voice {
  kind: VoiceKind;
  /** 16 characters: `x` sounds on that step, `.` rests. */
  steps: string;
  /** The scale degrees its hits play, in turn, carrying on across bars. */
  notes: readonly number[];
  /** Its loudness inside the loop, 0–1. */
  gain: number;
  /** For `hum` and `whirr`: how many steps each hit holds. */
  length?: number;
}

export interface Loop {
  /** What it is, for the dev notes (never shown). */
  sound: string;
  voices: readonly Voice[];
}

/** Every room's loop, keyed by room. */
export const loops: Record<RoomId, Loop> = {
  r01: {
    sound: 'Door lift: a chain ratchet on the eighths, a heavy clank every half bar.',
    voices: [
      { kind: 'click', steps: 'x.x.x.x.x.x.x.x.', notes: [10, 11], gain: 0.35 },
      { kind: 'clank', steps: 'x.......x.......', notes: [0, -2], gain: 0.55 },
    ],
  },
  r02: {
    sound: 'Street lamps: a soft gas hum under two high lamp chimes.',
    voices: [
      { kind: 'hum', steps: 'x...............', notes: [-5], gain: 0.4, length: 16 },
      { kind: 'bell', steps: '......x.......x.', notes: [9, 11, 9, 12], gain: 0.25 },
    ],
  },
  r03: {
    sound: 'Sluice gate: water rushing through on the beats, the gate creaking off them.',
    voices: [
      { kind: 'puff', steps: 'x...x...x...x...', notes: [0], gain: 0.4 },
      { kind: 'wood', steps: '..x.......x..x..', notes: [2, 1, 2], gain: 0.35 },
    ],
  },
  r04: {
    sound: 'Water wheel: paddles knocking in a lilting three-against-four, a splash twice a bar.',
    voices: [
      { kind: 'wood', steps: 'x..x..x.x..x..x.', notes: [0, 2, 4, 2, 0, 2, 4, 7], gain: 0.45 },
      { kind: 'puff', steps: '....x.......x...', notes: [3], gain: 0.25 },
    ],
  },
  r05: {
    sound: 'Bridge: a deep winch hum on D and A, a girder clank between.',
    voices: [
      { kind: 'hum', steps: 'x.......x.......', notes: [-5, -2], gain: 0.45, length: 8 },
      { kind: 'clank', steps: '....x.......x...', notes: [5, 4], gain: 0.4 },
    ],
  },
  r06: {
    sound: 'Weighing yard: weights clanking down on the pans, a pointer clicking.',
    voices: [
      { kind: 'clank', steps: 'x.....x...x.....', notes: [3, 2, 0], gain: 0.45 },
      { kind: 'click', steps: '..x...x...x...x.', notes: [8], gain: 0.3 },
    ],
  },
  r07: {
    sound: 'Old logbook: a typebar rhythm, and a page turning at the end of each half bar.',
    voices: [
      { kind: 'click', steps: '..x.xx..x.x.xx..', notes: [12, 13], gain: 0.3 },
      { kind: 'wood', steps: '.......x.......x', notes: [7, 6], gain: 0.3 },
    ],
  },
  r08: {
    sound: 'Tram: the ding-ding of its bell, rail joints clacking under it.',
    voices: [
      { kind: 'bell', steps: 'x.x.............', notes: [9, 9], gain: 0.3 },
      { kind: 'click', steps: 'x..x....x..x....', notes: [6, 5], gain: 0.4 },
    ],
  },
  r09: {
    sound: 'Steam lift: steam chuffing in a lopsided rhythm over a low boiler hum.',
    voices: [
      { kind: 'puff', steps: 'x.....x.x.....x.', notes: [1, 1, 2, 1], gain: 0.4 },
      { kind: 'hum', steps: 'x...............', notes: [-2], gain: 0.35, length: 16 },
    ],
  },
  r10: {
    sound:
      'Market scales: brass pans chiming up and down the scale off the beat, a peg ticking on it.',
    voices: [
      { kind: 'bell', steps: '..x...x...x...x.', notes: [5, 7, 9, 7], gain: 0.22 },
      { kind: 'wood', steps: 'x...x...x...x...', notes: [4], gain: 0.25 },
    ],
  },
  r11: {
    sound: 'Great wheel: a big gear whirring round twice a bar over a low hum, one clank.',
    voices: [
      { kind: 'whirr', steps: 'x.......x.......', notes: [0, 2], gain: 0.3, length: 6 },
      { kind: 'hum', steps: 'x...............', notes: [-5], gain: 0.3, length: 16 },
      { kind: 'clank', steps: '...........x....', notes: [7], gain: 0.35 },
    ],
  },
  r12: {
    sound: 'Junction: points clacking in a syncopated rhythm, small gears whirring.',
    voices: [
      { kind: 'click', steps: '.x..x..x...x..x.', notes: [8, 7], gain: 0.7 },
      { kind: 'whirr', steps: '....x.......x...', notes: [7, 5], gain: 0.45, length: 3 },
    ],
  },
  r13: {
    sound: 'Clock tower: tick-tock on the beats, a low bell on the bar, a high one halfway.',
    voices: [
      { kind: 'wood', steps: 'x...x...x...x...', notes: [10, 8], gain: 0.35 },
      { kind: 'bell', steps: 'x...............', notes: [-5], gain: 0.4 },
      { kind: 'bell', steps: '........x.......', notes: [4, 5], gain: 0.2 },
    ],
  },
};

/**
 * The degree a voice plays on grid step `index`, or null when it rests there. Its hits take
 * its notes in turn, carrying on from bar to bar, so a voice with more notes than hits
 * plays a phrase longer than a bar.
 */
export function noteAt(voice: Voice, index: number): number | null {
  const position = index % STEPS;
  if (voice.steps[position] !== 'x') return null;
  const perBar = [...voice.steps].filter((step) => step === 'x').length;
  const before = [...voice.steps.slice(0, position)].filter((step) => step === 'x').length;
  const bar = Math.floor(index / STEPS);
  const hit = bar * perBar + before;
  return voice.notes[hit % voice.notes.length] ?? null;
}
