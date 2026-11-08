// Proves a lead can be played (architecture, Pattern 6): content tests run this over every lead,
// so that a clue set that leaves two doors never reaches him.

import { proveAlone } from '@/hunt/alone';
import {
  canonicalLine,
  cluesLeft,
  type KnockClue,
  type KnockLine,
  type KnockSpec,
  litDoors,
} from '@/hunt/knock';
import type { SceneSpec } from '@/hunt/scene';
import { proveSneak } from '@/hunt/sneak';
import type { LeadSpec, LineTask } from '@/hunt/spec';
import { proveUnmask } from '@/hunt/unmask';
import { parseStatement } from '@/math/statement';
import { readTokens, type SToken } from '@/math/statement-tokens';
import { isTrue } from '@/math/truth';

/** Every order of a list. */
function orders<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

export interface KnockProblem {
  problem: string;
}

/**
 * A Knock: every clue's canonical line, in any order, leaves exactly the door, on the side its
 * clue names; no line alone but the last empties the row; and striking a line relights it.
 */
export function proveKnock(spec: KnockSpec): KnockProblem[] {
  const problems: KnockProblem[] = [];
  const say = (problem: string) => problems.push({ problem });
  const written = spec.clues.filter((clue) => clue.kind !== 'side');
  const lines: KnockLine[] = written.flatMap((clue: KnockClue) => {
    const tokens = canonicalLine(clue);
    if (!tokens) say(`clue ${clue.id} has no line the notebook can write`);
    return tokens ? [{ tokens, clue: clue.id, struck: false }] : [];
  });
  const sideClue = spec.clues.find((clue) => clue.kind === 'side');
  const side = sideClue?.kind === 'side' ? sideClue.side : spec.startSide;
  if (sideClue && (spec.door % 2 === 0) !== (side === 'even')) say('the door is on the other side');
  for (const order of orders(lines)) {
    const left = litDoors(spec.row, side, order);
    if (left.length !== 1 || left[0] !== spec.door) {
      say(`the clues leave doors ${left.join(', ')}, not ${spec.door}`);
    }
  }
  for (const [i] of lines.entries()) {
    const struck = lines.map((line, j) => (j === i ? { ...line, struck: true } : line));
    const left = litDoors(spec.row, side, struck);
    if (lines.length > 1 && !left.includes(spec.door)) say('striking a clue loses the door');
  }
  if (cluesLeft(spec, { side, lines }).length > 0) say('a clue stays unused with every line in');
  if (spec.door < spec.row.from || spec.door > spec.row.to) say('the door is not in the row');
  if (spec.row.to - spec.row.from + 1 > 70) say('more than 70 doors');
  if (spec.grumpy.length === 0) say('no grumpy neighbour for a wrong door');
  return problems;
}

function lineOf(line: string): SToken[] | null {
  return readTokens(line);
}

/** A task's accepted lines read, and are true. */
export function proveLine(task: LineTask): string[] {
  const problems: string[] = [];
  for (const line of task.accepts) {
    const tokens = lineOf(line);
    const parsed = tokens && parseStatement(tokens);
    if (!parsed?.ok) problems.push(`"${line}" doesn't read`);
    else if (!isTrue(parsed.statement, task.context)) problems.push(`"${line}" isn't true`);
  }
  return problems;
}

/** A scene's own proof, whichever kind it is. */
export function proveScene(scene: SceneSpec): string[] {
  switch (scene.kind) {
    case 'knock': {
      const problems = proveKnock(scene).map(({ problem }) => problem);
      for (const line of scene.example) {
        const tokens = lineOf(line);
        const parsed = tokens && parseStatement(tokens);
        if (parsed?.ok && !isTrue(parsed.statement)) {
          problems.push(`worked example "${line}" isn't true`);
        }
      }
      return problems;
    }
    case 'sneak':
      return proveSneak(scene);
    case 'unmask':
      return proveUnmask(scene);
    case 'alone':
      return proveAlone(scene);
  }
}

/** Everything in a lead that can be checked without playing it. */
export function proveLead(lead: LeadSpec): string[] {
  const problems: string[] = [];
  for (const scene of lead.scenes) problems.push(...proveScene(scene));
  for (const task of lead.tries) {
    if (task.kind === 'line') problems.push(...proveLine(task));
  }
  problems.push(...proveLine(lead.mistake.write));
  for (const task of lead.writeUp) problems.push(...proveLine(task));
  const wrong = lead.mistake.lines[lead.mistake.wrong];
  const wrongParsed = wrong !== undefined ? parseStatement(lineOf(wrong) ?? []) : null;
  if (!wrongParsed?.ok || isTrue(wrongParsed.statement, lead.mistake.context)) {
    problems.push(`the little one's wrong line "${wrong}" isn't wrong`);
  }
  for (const [i, line] of lead.mistake.lines.entries()) {
    if (i === lead.mistake.wrong) continue;
    const parsed = parseStatement(lineOf(line) ?? []);
    if (!parsed.ok || !isTrue(parsed.statement, lead.mistake.context)) {
      problems.push(`the little one's right line "${line}" isn't right`);
    }
  }
  if (lead.lesson.steps.length === 0) problems.push('no showing');
  for (const step of lead.lesson.steps) {
    if (step.say.length > 2) problems.push('a showing has more than 2 lines to a step');
  }
  return problems;
}
