// Little one alone (GDD, Scene types): places too small for him, so he plays as it. A small dark
// board of junctions, each with a sign saying what it chooses. A wrong pipe is a dead end, with a
// plate showing what his route means so far; it beeps and goes back one junction, so it can't be
// lost.

export interface AloneJunction {
  /** What this junction chooses: hall, row, shelf, box, folder. */
  sign: string;
  /** The pipes on offer. */
  pipes: readonly number[];
  right: number;
}

export interface AloneSpec {
  kind: 'alone';
  intro: string;
  /** The route, as it was given to him. */
  route: string;
  junctions: readonly AloneJunction[];
  /** What a dead end's plate says, around what his route means so far. */
  deadEnd: string;
  opened: string;
  example: readonly string[];
  hint: { step: string; move: string };
}

export interface AloneState {
  /** The pipes it has taken: as many as junctions it has passed. */
  taken: number[];
  /** The plate at the dead end it has just rolled into. */
  plate: string | null;
  deadEnds: number;
  help: number;
  hintLevel: number;
  exactTaken: boolean;
  guide: 'intro' | 'on' | null;
  opened: boolean;
}

export function newAlone(guided = false): AloneState {
  return {
    taken: [],
    plate: null,
    deadEnds: 0,
    help: 0,
    hintLevel: 0,
    exactTaken: false,
    guide: guided ? 'intro' : null,
    opened: false,
  };
}

/** A pipe, at the junction it has come to. */
export function alonePick(spec: AloneSpec, state: AloneState, pipe: number): AloneState {
  if (state.opened || state.plate) return state;
  const junction = spec.junctions[state.taken.length];
  if (!junction?.pipes.includes(pipe)) return state;
  if (pipe !== junction.right) {
    const meaning = [...state.taken, pipe].join('');
    return {
      ...state,
      plate: meaning,
      deadEnds: state.deadEnds + 1,
      help: Math.max(state.help, Math.min(3, state.deadEnds + 1)),
    };
  }
  const taken = [...state.taken, pipe];
  return taken.length >= spec.junctions.length
    ? { ...state, taken, opened: true, guide: null }
    : { ...state, taken };
}

/** It beeps and rolls back from the dead end. */
export function aloneDismiss(state: AloneState): AloneState {
  return state.plate ? { ...state, plate: null } : state;
}

export function aloneIdle(state: AloneState): AloneState {
  return state.opened || state.help >= 3 ? state : { ...state, help: state.help + 1 };
}

export function aloneHint(state: AloneState): AloneState {
  if (state.opened) return state;
  const hintLevel = Math.min(2, state.hintLevel + 1);
  return { ...state, hintLevel, exactTaken: state.exactTaken || hintLevel === 2 };
}

/** Reaching the end with no dead ends earns its parts. */
export function aloneEarns(state: AloneState): boolean {
  return state.opened && state.deadEnds === 0 && !state.exactTaken;
}

/** The problems with a scene: a way through, and every wrong pipe comes back. */
export function proveAlone(spec: AloneSpec): string[] {
  const problems: string[] = [];
  if (spec.junctions.length < 3 || spec.junctions.length > 8) {
    problems.push('a board has 3 to 8 junctions');
  }
  for (const [i, junction] of spec.junctions.entries()) {
    if (!junction.pipes.includes(junction.right)) problems.push(`junction ${i} has no way on`);
    if (junction.pipes.length < 2) problems.push(`junction ${i} offers no choice`);
  }
  return problems;
}

export function aloneFrom(spec: AloneSpec, value: unknown): AloneState | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Partial<AloneState>;
  if (!Array.isArray(saved.taken) || saved.taken.length > spec.junctions.length) return null;
  const fits = saved.taken.every((pipe, i) => spec.junctions[i]?.right === pipe);
  if (!fits) return null;
  return {
    ...newAlone(),
    taken: saved.taken,
    deadEnds: typeof saved.deadEnds === 'number' ? saved.deadEnds : 0,
    hintLevel: typeof saved.hintLevel === 'number' ? saved.hintLevel : 0,
    exactTaken: saved.exactTaken === true,
    guide: saved.guide === 'intro' || saved.guide === 'on' ? saved.guide : null,
    opened: saved.opened === true,
  };
}
