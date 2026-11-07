// The synthesised sounds (GDD, Audio and Music; architecture, Audio Architecture): no
// samples, only oscillators, filters and a buffer of noise. Each function schedules one
// short sound at time `t` on the audio clock into `out` and lets it free itself when done.
// Kept soft and rounded: a 10-year-old plays this on a tablet, often with headphones.

import type { VoiceKind } from '@/audio/loops';
import { frequency, stepSeconds } from '@/audio/music';

/** The one-shot effects the game plays (store/effects/audio.ts says when). */
export type SoundId =
  /** A dial notch. */
  | 'tick'
  /** The pans level. */
  | 'thunk'
  /** A jam: a puff of steam. */
  | 'hiss'
  /** A stage locks: the latch slides home. */
  | 'latch'
  /** A room restarts: a warm brass chord swells. */
  | 'restart'
  /** A button: a soft wooden tap. */
  | 'tap'
  /** The fight's dice tumble. */
  | 'rattle'
  /** A strike lands on armour. */
  | 'clank'
  /** Something good: a right prediction, a won fight, an upgrade. */
  | 'chime';

/** Below this a gain counts as silent (exponential ramps can't reach 0). */
const SILENT = 0.0001;

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** One second of white noise, made once per context. */
function noise(ctx: BaseAudioContext): AudioBuffer {
  const made = noiseBuffers.get(ctx);
  if (made) return made;
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // A fixed sequence, so the sound is the same every launch (and in tests).
  let seed = 22_222;
  for (let i = 0; i < data.length; i += 1) {
    seed = (seed * 16_807) % 2_147_483_647;
    data[i] = (seed / 2_147_483_647) * 2 - 1;
  }
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

/** A gain node shaped as an envelope: up to `peak` over `attack`, down over `decay`. */
function envelope(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  peak: number,
  attack: number,
  decay: number,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, SILENT), t + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, t + attack + decay);
  gain.connect(out);
  return gain;
}

interface NoiseHit {
  filter: BiquadFilterType;
  freq: number;
  /** The filter's frequency at the end, for a sweep. */
  endFreq?: number;
  q: number;
  peak: number;
  attack: number;
  decay: number;
}

/** A burst of filtered noise. */
function noiseHit(ctx: BaseAudioContext, out: AudioNode, t: number, hit: NoiseHit): void {
  const end = t + hit.attack + hit.decay;
  const source = ctx.createBufferSource();
  source.buffer = noise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = hit.filter;
  filter.frequency.setValueAtTime(hit.freq, t);
  if (hit.endFreq) filter.frequency.exponentialRampToValueAtTime(hit.endFreq, end);
  filter.Q.value = hit.q;
  source.connect(filter);
  filter.connect(envelope(ctx, out, t, hit.peak, hit.attack, hit.decay));
  // Start somewhere in the buffer, so repeated hits don't sound identical.
  source.start(t, (t * 7.31) % 0.8);
  source.stop(end + 0.02);
}

interface ToneHit {
  type: OscillatorType;
  freq: number;
  /** The pitch at the end, for a fall or a rise. */
  endFreq?: number;
  peak: number;
  attack: number;
  decay: number;
  /** A low-pass over the tone, to round it off. */
  lowpass?: number;
}

/** A short oscillator tone. */
function toneHit(ctx: BaseAudioContext, out: AudioNode, t: number, hit: ToneHit): void {
  const end = t + hit.attack + hit.decay;
  const osc = ctx.createOscillator();
  osc.type = hit.type;
  osc.frequency.setValueAtTime(hit.freq, t);
  if (hit.endFreq) osc.frequency.exponentialRampToValueAtTime(hit.endFreq, end);
  const env = envelope(ctx, out, t, hit.peak, hit.attack, hit.decay);
  if (hit.lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hit.lowpass;
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }
  osc.start(t);
  osc.stop(end + 0.02);
}

/** A metallic hit: inharmonic partials, the higher ones dying first. */
function metal(ctx: BaseAudioContext, out: AudioNode, t: number, f: number, peak: number) {
  const partials = [1, 2.76, 5.4, 8.93];
  partials.forEach((ratio, i) => {
    toneHit(ctx, out, t, {
      type: 'sine',
      freq: f * ratio,
      peak: peak / (i + 1.5),
      attack: 0.002,
      decay: 0.35 / (i + 1),
    });
  });
  noiseHit(ctx, out, t, {
    filter: 'bandpass',
    freq: f * 6,
    q: 2,
    peak: peak * 0.3,
    attack: 0.001,
    decay: 0.03,
  });
}

/** A bell: near-harmonic partials that ring on. */
function bell(ctx: BaseAudioContext, out: AudioNode, t: number, f: number, peak: number) {
  const partials: [number, number, number][] = [
    [1, 1, 1.4],
    [2, 0.5, 0.9],
    [3.01, 0.25, 0.5],
    [4.2, 0.12, 0.3],
  ];
  for (const [ratio, level, decay] of partials) {
    toneHit(ctx, out, t, {
      type: 'sine',
      freq: f * ratio,
      peak: peak * level,
      attack: 0.004,
      decay,
    });
  }
}

/** A warm brass chord that swells and fades: D major, low and open (about 4 s). */
function brassSwell(ctx: BaseAudioContext, out: AudioNode, t: number) {
  const chord = [frequency(0), frequency(2), frequency(3), frequency(5)];
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(280, t);
  filter.frequency.exponentialRampToValueAtTime(2000, t + 1.2);
  filter.frequency.exponentialRampToValueAtTime(700, t + 3.6);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, t);
  gain.gain.exponentialRampToValueAtTime(0.6, t + 0.9);
  gain.gain.setValueAtTime(0.6, t + 2);
  gain.gain.exponentialRampToValueAtTime(SILENT, t + 4);
  filter.connect(gain);
  gain.connect(out);
  for (const f of chord) {
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = detune;
      const level = ctx.createGain();
      level.gain.value = 0.12;
      osc.connect(level);
      level.connect(filter);
      osc.start(t);
      osc.stop(t + 4.1);
    }
  }
}

/** Ticks alternate a little in pitch, like a ratchet's tick-tock. */
let tickTock = 0;

/** Plays one of the game's effects at `t`. */
export function playSound(ctx: BaseAudioContext, out: AudioNode, sound: SoundId, t: number) {
  switch (sound) {
    case 'tick':
      tickTock = 1 - tickTock;
      noiseHit(ctx, out, t, {
        filter: 'bandpass',
        freq: tickTock ? 3200 : 2700,
        q: 5,
        peak: 1,
        attack: 0.001,
        decay: 0.025,
      });
      toneHit(ctx, out, t, {
        type: 'triangle',
        freq: tickTock ? 1500 : 1300,
        peak: 0.15,
        attack: 0.001,
        decay: 0.015,
      });
      return;
    case 'thunk':
      toneHit(ctx, out, t, {
        type: 'sine',
        freq: 120,
        endFreq: 52,
        peak: 0.55,
        attack: 0.004,
        decay: 0.35,
      });
      noiseHit(ctx, out, t, {
        filter: 'lowpass',
        freq: 500,
        q: 0.7,
        peak: 0.3,
        attack: 0.002,
        decay: 0.08,
      });
      return;
    case 'hiss':
      noiseHit(ctx, out, t, {
        filter: 'bandpass',
        freq: 5200,
        endFreq: 1600,
        q: 0.8,
        peak: 0.28,
        attack: 0.04,
        decay: 0.9,
      });
      return;
    case 'latch':
      playSound(ctx, out, 'tick', t);
      playSound(ctx, out, 'tick', t + 0.09);
      toneHit(ctx, out, t + 0.16, {
        type: 'sine',
        freq: 190,
        endFreq: 90,
        peak: 0.45,
        attack: 0.003,
        decay: 0.22,
      });
      return;
    case 'restart':
      brassSwell(ctx, out, t);
      return;
    case 'tap':
      toneHit(ctx, out, t, {
        type: 'sine',
        freq: 540,
        endFreq: 380,
        peak: 0.16,
        attack: 0.002,
        decay: 0.06,
      });
      noiseHit(ctx, out, t, {
        filter: 'bandpass',
        freq: 1400,
        q: 3,
        peak: 0.06,
        attack: 0.001,
        decay: 0.015,
      });
      return;
    case 'rattle':
      [0, 0.05, 0.11, 0.14, 0.21, 0.26].forEach((offset, i) => {
        voice(ctx, out, 'wood', 7 + (i % 3), t + offset, 0.25 - i * 0.025);
      });
      return;
    case 'clank':
      metal(ctx, out, t, frequency(0), 0.4);
      return;
    case 'chime':
      bell(ctx, out, t, frequency(14), 0.12);
      bell(ctx, out, t + 0.1, frequency(15), 0.1);
      return;
  }
}

/** Plays one hit of a machine loop's voice: scale degree `degree` at `t`, at `peak`. */
export function voice(
  ctx: BaseAudioContext,
  out: AudioNode,
  kind: VoiceKind,
  degree: number,
  t: number,
  peak: number,
  length = 1,
) {
  const f = frequency(degree);
  switch (kind) {
    case 'click':
      noiseHit(ctx, out, t, {
        filter: 'bandpass',
        freq: Math.min(f * 4, 9000),
        q: 6,
        peak: peak * 1.4,
        attack: 0.001,
        decay: 0.022,
      });
      return;
    case 'clank':
      metal(ctx, out, t, f, peak * 0.5);
      return;
    case 'hum': {
      const hold = length * stepSeconds;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(SILENT, t);
      gain.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.12);
      gain.gain.setValueAtTime(peak * 0.35, t + Math.max(0.12, hold - 0.2));
      gain.gain.exponentialRampToValueAtTime(SILENT, t + hold);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start(t);
      osc.stop(t + hold + 0.05);
      return;
    }
    case 'whirr': {
      const hold = length * stepSeconds;
      toneHit(ctx, out, t, {
        type: 'sawtooth',
        freq: f * 0.9,
        endFreq: f * 1.06,
        peak: peak * 0.18,
        attack: hold * 0.4,
        decay: hold * 0.6,
        lowpass: 900,
      });
      return;
    }
    case 'wood':
      toneHit(ctx, out, t, {
        type: 'sine',
        freq: f * 1.5,
        endFreq: f,
        peak: peak * 0.6,
        attack: 0.002,
        decay: 0.09,
      });
      return;
    case 'bell':
      bell(ctx, out, t, f, peak * 0.4);
      return;
    case 'puff':
      noiseHit(ctx, out, t, {
        filter: 'bandpass',
        freq: f * 5,
        endFreq: f * 3,
        q: 1.2,
        peak: peak * 0.5,
        attack: 0.015,
        decay: 0.2,
      });
      return;
  }
}
