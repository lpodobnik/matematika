// Number-pad tokens (architecture Pattern 1). One token per key: a number is a run of
// digit tokens, so `5 905` is four tokens and the space is never stored. The minus and
// times tokens are the school signs themselves: − (U+2212) and · (U+00B7).

export const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
export type Digit = (typeof DIGITS)[number];

export const TOKENS = [...DIGITS, 'x', '+', '−', '·', ':', '=', '(', ')'] as const;
export type Token = (typeof TOKENS)[number];

// Each pad token stands for itself. The physical keyboard and content strings may also use
// ASCII stand-ins (architecture, Consistency Rules: Physical keyboard).
const charToToken: ReadonlyMap<string, Token> = new Map<string, Token>([
  ...TOKENS.map((token): [string, Token] => [token, token]),
  ['X', 'x'],
  ['-', '−'],
  ['*', '·'],
  ['/', ':'],
]);

/** The token a typed character stands for, or null if it has none. */
export function tokenFromChar(char: string): Token | null {
  return charToToken.get(char) ?? null;
}

export function isDigit(token: Token | undefined): token is Digit {
  return token !== undefined && (DIGITS as readonly string[]).includes(token);
}

export type TokenizeResult =
  | { ok: true; tokens: Token[] }
  | { ok: false; reason: 'unknown-symbol' };

/**
 * Turns text in school notation into pad tokens. Whitespace of any kind is ignored,
 * including the U+202F thousands separator that `format` writes.
 */
export function tokenize(text: string): TokenizeResult {
  const tokens: Token[] = [];
  for (const char of text) {
    if (/\s/u.test(char)) continue;
    const token = tokenFromChar(char);
    if (token === null) return { ok: false, reason: 'unknown-symbol' };
    tokens.push(token);
  }
  return { ok: true, tokens };
}
