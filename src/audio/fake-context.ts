// Tests only: a stand-in AudioContext that records what is built and scheduled, with a
// clock the test moves by hand. Never imported by the game.

export interface FakeParam {
  value: number;
  calls: [string, number, number?][];
  setValueAtTime(value: number, t: number): FakeParam;
  linearRampToValueAtTime(value: number, t: number): FakeParam;
  exponentialRampToValueAtTime(value: number, t: number): FakeParam;
  setTargetAtTime(value: number, t: number, c: number): FakeParam;
  cancelScheduledValues(t: number): FakeParam;
}

function param(value = 0): FakeParam {
  const p: FakeParam = {
    value,
    calls: [],
    setValueAtTime(v, t) {
      p.calls.push(['set', v, t]);
      return p;
    },
    linearRampToValueAtTime(v, t) {
      p.calls.push(['linear', v, t]);
      return p;
    },
    exponentialRampToValueAtTime(v, t) {
      if (v <= 0) throw new RangeError('an exponential ramp cannot reach 0');
      p.calls.push(['exp', v, t]);
      return p;
    },
    setTargetAtTime(v, t) {
      p.calls.push(['target', v, t]);
      return p;
    },
    cancelScheduledValues(t) {
      p.calls.push(['cancel', 0, t]);
      return p;
    },
  };
  return p;
}

export interface FakeNode {
  kind: string;
  connected: FakeNode[];
  disconnected: boolean;
  started: number | null;
  stopped: number | null;
  gain: FakeParam;
  frequency: FakeParam;
  detune: FakeParam;
  Q: FakeParam;
  type: string;
  buffer: unknown;
  connect(to: FakeNode): FakeNode;
  disconnect(): void;
  start(t?: number): void;
  stop(t?: number): void;
}

export interface FakeContext {
  currentTime: number;
  sampleRate: number;
  state: 'suspended' | 'running' | 'closed';
  destination: FakeNode;
  nodes: FakeNode[];
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
  createGain(): FakeNode;
  createOscillator(): FakeNode;
  createBiquadFilter(): FakeNode;
  createBufferSource(): FakeNode;
  createBuffer(channels: number, length: number, rate: number): unknown;
  /** The sources (oscillators and noise) started in [from, to). */
  sourcesBetween(from: number, to: number): FakeNode[];
}

export function createFakeContext(state: FakeContext['state'] = 'running'): FakeContext {
  const nodes: FakeNode[] = [];
  const node = (kind: string): FakeNode => {
    const n: FakeNode = {
      kind,
      connected: [],
      disconnected: false,
      started: null,
      stopped: null,
      gain: param(1),
      frequency: param(440),
      detune: param(0),
      Q: param(1),
      type: '',
      buffer: null,
      connect(to) {
        n.connected.push(to);
        return to;
      },
      disconnect() {
        n.disconnected = true;
      },
      start(t = 0) {
        n.started = t;
      },
      stop(t = 0) {
        n.stopped = t;
      },
    };
    if (kind !== 'destination') nodes.push(n);
    return n;
  };
  const ctx: FakeContext = {
    currentTime: 0,
    sampleRate: 8000,
    state,
    destination: node('destination'),
    nodes,
    async resume() {
      ctx.state = 'running';
    },
    async suspend() {
      ctx.state = 'suspended';
    },
    async close() {
      ctx.state = 'closed';
    },
    createGain: () => node('gain'),
    createOscillator: () => node('oscillator'),
    createBiquadFilter: () => node('filter'),
    createBufferSource: () => node('noise'),
    createBuffer: (_channels, length) => {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    },
    sourcesBetween: (from, to) =>
      nodes.filter(
        (n) =>
          (n.kind === 'oscillator' || n.kind === 'noise') &&
          n.started !== null &&
          n.started >= from &&
          n.started < to,
      ),
  };
  return ctx;
}

/** The fake as the engine sees it. */
export const asAudioContext = (ctx: FakeContext) => ctx as unknown as AudioContext;

/** Timers the test runs by hand. */
export function manualTimers() {
  let run: (() => void) | null = null;
  return {
    timers: {
      setInterval: (fn: () => void) => {
        run = fn;
        return 1;
      },
      clearInterval: () => {
        run = null;
      },
    },
    /** One scheduler pass, as the 25 ms timer would run it. */
    tick: () => run?.(),
    get active() {
      return run !== null;
    },
  };
}
