// A lead as data (architecture, Pattern 6): rule 10 extends, with content tests and no per-lead
// code. A new scene type joins `SceneSpec` as a new kind.

import type { LeadId } from '@/hunt/ids';
import type { KnockSpec } from '@/hunt/knock';
import type { ObjectGoal, ObjectState } from '@/hunt/objects';
import type { SToken } from '@/math/statement-tokens';

/** One step of a showing: what the object looks like, and up to 2 short lines. */
export interface LessonStep {
  object: ObjectState;
  say: readonly string[];
}

export interface LessonSpec {
  /** Where the cylinder is found. */
  found: string;
  steps: readonly LessonStep[];
}

/** A line he has to write, judged against what's accepted: `start` is already on the line. */
export interface LineTask {
  say: string;
  start: string;
  accepts: readonly string[];
  /** Keys beyond the digits: only what the line needs. */
  keys: readonly SToken[];
}

export type TryTask =
  | { kind: 'object'; say: string; object: ObjectState; goal: ObjectGoal }
  | ({ kind: 'line' } & LineTask);

/** The little one's wrong working, and how he shows it right. */
export interface MistakeSpec {
  /** Stored in `companion.taught`: stable, like all ids in saves. */
  id: string;
  say: string;
  lines: readonly string[];
  /** Which of `lines` is the wrong one. */
  wrong: number;
  /** What a tap on a right line gets. */
  nudge: string;
  /** He shows it right with the object. */
  show: { say: string; object: ObjectState; goal: ObjectGoal };
  /** Then he writes the right line. */
  write: LineTask;
  /** It nods. */
  thanks: string;
}

export type SceneSpec = KnockSpec;

export interface LeadSpec {
  id: LeadId;
  act: 1 | 2 | 3 | 4 | 'last';
  street: string;
  title: string;
  lesson: LessonSpec;
  tries: readonly TryTask[];
  mistake: MistakeSpec;
  scenes: readonly SceneSpec[];
  /** The school form, with fading: blanks first, then whole lines. */
  writeUp: readonly LineTask[];
  /** What it yields: a line, and the explanation card that answers "Kako to radi?". */
  find: { say: string; title: string; card: readonly string[] };
}
