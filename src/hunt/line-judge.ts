// How a line he has to write is judged (architecture, Pattern 5, working lines). What's asked is
// ink, and so is the same thing said another way: `15 = 7 · 2 + 1` for `7 · 2 + 1 = 15`. A false line
// bounces. A true line that isn't what's asked isn't called unreadable, because it isn't.

import { parseStatement } from '@/math/statement';
import { fillLine, isSDigit, readLine, readTokens, type SToken } from '@/math/statement-tokens';
import { isTrue, type TruthContext } from '@/math/truth';

export type LineVerdict = 'right' | 'false' | 'off-task' | 'unreadable';

/** The numbers a line holds, digit run by digit run. */
function numbersOf(tokens: readonly SToken[]): string[] {
  const numbers: string[] = [];
  let run = '';
  for (const token of tokens) {
    if (isSDigit(token)) {
      run += token;
    } else if (run !== '') {
      numbers.push(run);
      run = '';
    }
  }
  if (run !== '') numbers.push(run);
  return numbers;
}

/** Whether every number in `wanted` is in `line`, as many times. */
function holdsAll(line: readonly string[], wanted: readonly string[]): boolean {
  const left = [...line];
  return wanted.every((number) => {
    const at = left.indexOf(number);
    if (at < 0) return false;
    left.splice(at, 1);
    return true;
  });
}

/** What a typed line comes to, against what the task accepts. */
export function judgeLine(
  start: string,
  accepts: readonly string[],
  draft: readonly SToken[],
  context?: TruthContext,
): { verdict: LineVerdict; tokens: SToken[] } {
  const tokens = fillLine(readLine(start) ?? [], draft);
  const wanted = accepts.flatMap((line) => readTokens(line) ?? []);
  const exact = accepts.some((line) => {
    const accepted = readTokens(line);
    return (
      accepted !== null &&
      accepted.length === tokens.length &&
      accepted.every((token, i) => token === tokens[i])
    );
  });
  if (exact && wanted.length > 0) return { verdict: 'right', tokens };
  const parsed = parseStatement(tokens);
  if (!parsed.ok) return { verdict: 'unreadable', tokens };
  if (!isTrue(parsed.statement, context)) return { verdict: 'false', tokens };
  // Only a sum can be said another way: a sign changes what a range or a belonging says.
  const { k } = parsed.statement;
  if (k !== 'sum' && k !== 'mean') return { verdict: 'off-task', tokens };
  const same = accepts.some((line) => {
    const accepted = readTokens(line);
    const asked = accepted && parseStatement(accepted);
    return (
      asked?.ok === true &&
      asked.statement.k === k &&
      holdsAll(numbersOf(tokens), numbersOf(accepted ?? []))
    );
  });
  return { verdict: same ? 'right' : 'off-task', tokens };
}

/** What a verdict leaves on a state that has these two flags. */
export function flagsOf(verdict: LineVerdict): { bounced: boolean; refused: boolean | 'off' } {
  return {
    bounced: verdict === 'false',
    refused: verdict === 'unreadable' ? true : verdict === 'off-task' ? 'off' : false,
  };
}
