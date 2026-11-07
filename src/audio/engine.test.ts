import { describe, expect, it } from 'vitest';
import { createAudioEngine, LOOKAHEAD, MASTER_LEVEL } from '@/audio/engine';
import { asAudioContext, createFakeContext, manualTimers } from '@/audio/fake-context';
import { loops, type VoiceKind } from '@/audio/loops';
import { barSeconds, stepSeconds } from '@/audio/music';
import { playSound, type SoundId, voice } from '@/audio/voices';

function rig(state: 'running' | 'suspended' = 'running') {
  const ctx = createFakeContext(state);
  const clock = manualTimers();
  let made = 0;
  const engine = createAudioEngine({
    makeContext: () => {
      made += 1;
      return asAudioContext(ctx);
    },
    timers: clock.timers,
  });
  /** Moves the audio clock on, running the scheduler every 25 ms as the timer would. */
  const run = (seconds: number) => {
    const end = ctx.currentTime + seconds;
    while (ctx.currentTime < end - 1e-9) {
      ctx.currentTime = Math.min(end, ctx.currentTime + 0.025);
      clock.tick();
    }
  };
  return { ctx, clock, engine, run, made: () => made };
}

describe('the audio engine without Web Audio', () => {
  it('does nothing, and never throws, where there is no AudioContext', () => {
    const clock = manualTimers();
    const engine = createAudioEngine({ makeContext: () => null, timers: clock.timers });
    engine.setMuted(true);
    engine.setLoops({ r01: 1 });
    engine.unlock();
    engine.play('tick');
    engine.setHidden(true);
    engine.dispose();
    expect(engine.running).toBe(false);
    expect(clock.active).toBe(false);
  });

  it('does nothing in node with the real factory', () => {
    const engine = createAudioEngine();
    engine.unlock();
    engine.play('thunk');
    expect(engine.running).toBe(false);
    engine.dispose();
  });
});

describe('the audio engine (story 6.2)', () => {
  it('makes one context on the first tap, not before, and resumes a sleeping one', async () => {
    const r = rig('suspended');
    r.engine.play('tick');
    expect(r.made()).toBe(0);
    r.engine.unlock();
    r.engine.unlock();
    expect(r.made()).toBe(1);
    expect(r.clock.active).toBe(true);
    await Promise.resolve();
    expect(r.ctx.state).toBe('running');
    expect(r.engine.running).toBe(true);
  });

  it('plays an effect once unlocked, and none while muted', () => {
    const r = rig();
    r.engine.unlock();
    const before = r.ctx.nodes.length;
    r.engine.play('tick');
    expect(r.ctx.nodes.length).toBeGreaterThan(before);
    r.engine.setMuted(true);
    const muted = r.ctx.nodes.length;
    r.engine.play('thunk');
    expect(r.ctx.nodes.length).toBe(muted);
  });

  it('starts muted when the save said so before the first tap', () => {
    const r = rig();
    r.engine.setMuted(true);
    r.engine.unlock();
    const master = r.ctx.nodes[0];
    expect(master?.kind).toBe('gain');
    expect(master?.gain.value).toBe(0);
    expect(master?.connected).toContain(r.ctx.destination);
    r.engine.setMuted(false);
    expect(master?.gain.calls.at(-1)).toEqual(['linear', MASTER_LEVEL, expect.any(Number)]);
  });

  it('joins a loop on the next bar and plays its pattern on the grid', () => {
    const r = rig();
    r.engine.unlock();
    r.run(0.4);
    r.engine.setLoops({ r01: 1 });
    r.run(barSeconds * 2);
    const origin = 0.05;
    const joinAt = origin + barSeconds;
    // Nothing before the bar line it joins on.
    expect(r.ctx.sourcesBetween(0, joinAt - 1e-6)).toEqual([]);
    // Room 1's ratchet sounds on every eighth: steps 0, 2, 4… of the bar.
    const starts = new Set(
      r.ctx.sourcesBetween(joinAt - 1e-6, joinAt + barSeconds - 1e-6).map((n) => n.started),
    );
    const eighths = [...Array(8).keys()].map((i) => joinAt + i * 2 * stepSeconds);
    for (const t of eighths) {
      expect(
        [...starts].some((s) => Math.abs((s ?? -1) - t) < 1e-6),
        `at ${t}`,
      ).toBe(true);
    }
    // Never on an odd step.
    const odd = joinAt + stepSeconds;
    expect([...starts].some((s) => Math.abs((s ?? -1) - odd) < 1e-6)).toBe(false);
  });

  it('schedules only a lookahead ahead of the clock', () => {
    const r = rig();
    r.engine.setLoops({ r07: 1 });
    r.engine.unlock();
    r.run(1);
    const latest = Math.max(...r.ctx.nodes.map((n) => n.started ?? 0));
    expect(latest).toBeLessThan(r.ctx.currentTime + LOOKAHEAD + 1e-9);
  });

  it('fades a loop out and lets it go, and schedules nothing while muted or hidden', () => {
    const r = rig();
    r.engine.unlock();
    r.engine.setLoops({ r08: 1 });
    r.run(barSeconds * 2);
    r.engine.setLoops({});
    r.run(2);
    const after = r.ctx.nodes.length;
    r.run(barSeconds);
    expect(r.ctx.nodes.length).toBe(after);

    r.engine.setLoops({ r08: 1 });
    r.run(barSeconds * 2);
    r.engine.setMuted(true);
    const muted = r.ctx.nodes.length;
    r.run(barSeconds);
    expect(r.ctx.nodes.length).toBe(muted);
    r.engine.setMuted(false);
    r.engine.setHidden(true);
    r.run(barSeconds);
    expect(r.ctx.nodes.length).toBe(muted);
  });

  it('suspends the context while the page is hidden and resumes it when shown', async () => {
    const r = rig();
    r.engine.unlock();
    r.engine.setHidden(true);
    await Promise.resolve();
    expect(r.ctx.state).toBe('suspended');
    r.engine.setHidden(false);
    await Promise.resolve();
    expect(r.ctx.state).toBe('running');
  });

  it('stops its scheduler when disposed', () => {
    const r = rig();
    r.engine.unlock();
    r.engine.dispose();
    expect(r.clock.active).toBe(false);
    expect(r.ctx.state).toBe('closed');
  });
});

describe('the synthesised sounds', () => {
  const sounds: SoundId[] = [
    'tick',
    'thunk',
    'hiss',
    'latch',
    'restart',
    'tap',
    'rattle',
    'clank',
    'chime',
  ];

  it.each(sounds)('builds %s without an exponential ramp to 0, and stops every source', (sound) => {
    const ctx = createFakeContext();
    const out = ctx.createGain();
    playSound(asAudioContext(ctx), out as unknown as AudioNode, sound, 1);
    const sources = ctx.nodes.filter((n) => n.kind === 'oscillator' || n.kind === 'noise');
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) {
      expect(s.started).toBeGreaterThanOrEqual(1);
      // Short effects end within a second; the restart chord within about four.
      expect(s.stopped).toBeLessThan(sound === 'restart' ? 5.2 : 2.6);
    }
  });

  it('builds every loop voice in every loop', () => {
    const kinds = new Set<VoiceKind>();
    const ctx = createFakeContext();
    const out = ctx.createGain() as unknown as AudioNode;
    for (const loop of Object.values(loops)) {
      for (const v of loop.voices) {
        kinds.add(v.kind);
        for (const degree of v.notes)
          voice(asAudioContext(ctx), out, v.kind, degree, 2, v.gain, v.length);
      }
    }
    expect([...kinds].sort()).toEqual(['bell', 'clank', 'click', 'hum', 'puff', 'whirr', 'wood']);
    expect(
      ctx.nodes.every((n) => n.kind === 'gain' || n.kind === 'filter' || n.stopped !== null),
    ).toBe(true);
  });

  it('keeps every envelope at or under unity gain inside a sound', () => {
    const ctx = createFakeContext();
    const out = ctx.createGain() as unknown as AudioNode;
    for (const sound of sounds) playSound(asAudioContext(ctx), out, sound, 0);
    const peaks = ctx.nodes
      .filter((n) => n.kind === 'gain')
      .flatMap((n) => n.gain.calls.map((call) => call[1]));
    expect(Math.max(...peaks)).toBeLessThanOrEqual(1);
  });
});
