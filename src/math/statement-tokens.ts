// The tokens of part 2's notebook (architecture, Pattern 5). A language of its own beside the
// rooms': `TOKENS` is the room links' wire format, and a new token there would start typing into
// room notebooks. One token per key, named by what it writes, so `ost.`, `x̄` and `N₀` are one key
// each. The power sign is a token too: the digits after it are written small.

import { BLANK, DIGITS, type Digit } from '@/math/tokens';

export const STATEMENT_TOKENS = [
  ...DIGITS,
  '+',
  '−',
  '·',
  ':',
  '=',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  ',',
  '<',
  '>',
  '≤',
  '≥',
  '≠',
  '≈',
  '∈',
  '∉',
  'N',
  'N₀',
  'x',
  'n',
  'x̄',
  'ost.',
  '^',
  'A',
  'B',
  'C',
  'D',
] as const;
export type SToken = (typeof STATEMENT_TOKENS)[number];
/** A token of a line that may have a blank in it, for him to fill. */
export type SLineToken = SToken | typeof BLANK;

const known: ReadonlySet<string> = new Set(STATEMENT_TOKENS);

export function isSToken(value: unknown): value is SToken {
  return typeof value === 'string' && known.has(value);
}

export function isSDigit(token: string | undefined): token is Digit {
  return token !== undefined && (DIGITS as readonly string[]).includes(token);
}

const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
// Longest first, so that `N₀` isn't read as `N`, and `x̄` isn't read as `x`.
const words = [...STATEMENT_TOKENS].filter((token) => token.length > 1) as SToken[];

/**
 * A line of content text as tokens: `7 · 2 + 1 = 15`, `10⁶`, `☐ ∉ N`. Spaces don't count, the
 * thousands separator included. Null if it holds anything the notebook can't write: content tests
 * catch that, and his own lines come from keys and never reach this.
 */
export function readLine(text: string): SLineToken[] | null {
  const tokens: SLineToken[] = [];
  let inPower = false;
  for (let i = 0; i < text.length; ) {
    const char = text[i] as string;
    if (/\s/.test(char) || char === ' ') {
      i += 1;
      continue;
    }
    const small = superscripts.indexOf(char);
    if (small >= 0) {
      if (!inPower) tokens.push('^');
      inPower = true;
      tokens.push(String(small) as SToken);
      i += 1;
      continue;
    }
    inPower = false;
    const word = words.find((candidate) => text.startsWith(candidate, i));
    if (word) {
      tokens.push(word);
      i += word.length;
      continue;
    }
    if (char === BLANK) {
      tokens.push(BLANK);
    } else if (known.has(char)) {
      tokens.push(char as SToken);
    } else {
      return null;
    }
    i += 1;
  }
  return tokens;
}

/** A line of content text that has no blank in it, as tokens, or null. */
export function readTokens(text: string): SToken[] | null {
  const tokens = readLine(text);
  return tokens?.every(isSToken) ? tokens : null;
}

/**
 * Where a blank's fill goes, or at the end of the line where it has none: `7 · 2 + 1 =` with `15`
 * is `7 · 2 + 1 = 15`, and `☐ ∉ N` with `0` is `0 ∉ N`.
 */
export function fillLine(start: readonly SLineToken[], typed: readonly SToken[]): SToken[] {
  const at = start.indexOf(BLANK);
  if (at < 0) return [...(start as readonly SToken[]), ...typed];
  return [...start.slice(0, at), ...typed, ...start.slice(at + 1)].filter(isSToken);
}
