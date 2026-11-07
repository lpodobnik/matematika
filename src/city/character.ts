// His apprentice (story 2.4; narrative design, The apprentice): the name he types after room
// 1 and the look he picks. Pure: the save keeps them, the naming screen asks for them, and
// townspeople's lines take the name.

/** The six looks of the art bible (The apprentice: six looks), always shown in grey (NFR12). */
export const lookIds = ['look-1', 'look-2', 'look-3', 'look-4', 'look-5', 'look-6'] as const;
export type LookId = (typeof lookIds)[number];

export function isLookId(value: unknown): value is LookId {
  return typeof value === 'string' && (lookIds as readonly string[]).includes(value);
}

/** Long enough for a first name and a nickname, short enough for a line of dialogue. */
export const maxNameLength = 16;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * A name as he typed it, tidied: control characters dropped, spaces collapsed and trimmed,
 * cut to `maxNameLength` characters as they show (a letter with its accent, a whole emoji,
 * never half of one). Null when nothing is left.
 */
export function cleanName(raw: string): string | null {
  const spaced = raw
    .replace(/\p{Cc}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const tidy = Array.from(graphemes.segment(spaced), (part) => part.segment)
    .slice(0, maxNameLength)
    .join('')
    .trim();
  return tidy.length > 0 ? tidy : null;
}

/**
 * He hasn't named his apprentice yet, but has seen the opening (story 5.0) or finished room
 * 1 (a save from before the opening): the naming comes next.
 */
export function needsName(
  roomsDone: readonly string[],
  name: string | null,
  introSeen = false,
): boolean {
  return (introSeen || roomsDone.includes('r01')) && name === null;
}
