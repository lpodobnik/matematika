import { useState } from 'react';
import { huntUiText } from '@/content/text/hunt-leads';
import { formatStatementLine } from '@/math/format';
import type { SToken } from '@/math/statement-tokens';
import { Pad, type PadKey } from '@/ui/notebook/Pad';
import type { KeyKind } from '@/ui/notebook/pad-keys';

export type HuntKey = SToken | 'delete' | 'enter';
type Slot = HuntKey | 'more' | `empty-${number}`;

const digitRows: readonly (readonly SToken[])[] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];
/** A page has 8 places for signs, around the digits, as the rooms' pad has. */
const signsPerPage = 8;

function kindOf(key: HuntKey | 'more'): KeyKind {
  if (key === 'delete' || key === 'enter') return key;
  if (key === 'more') return 'operator';
  if (/^[0-9]$/.test(key)) return 'digit';
  if (key === 'x' || key === 'n' || key === 'x̄') return 'x';
  if ('()[]{}'.includes(key)) return 'bracket';
  return 'operator';
}

const faceOf = (key: SToken) =>
  key === '^'
    ? 'ⁿ'
    : formatStatementLine([key])
        .map((segment) => segment.text)
        .join('');

/** The signs on this page: with more than fit, the last place turns the page. */
export function signsOnPage(signs: readonly SToken[], page: number): (SToken | 'more')[] {
  if (signs.length <= signsPerPage) return [...signs];
  const each = signsPerPage - 1;
  const pages = Math.ceil(signs.length / each);
  const from = (page % pages) * each;
  return [...signs.slice(from, from + each), 'more'];
}

/** The pad's layout: digits where they always are, and the signs around them. */
export function padLayout(signs: readonly (SToken | 'more')[]): Slot[] {
  const sign = (i: number): Slot => signs[i] ?? (`empty-${i}` as const);
  const [row1, row2, row3] = digitRows as [readonly SToken[], readonly SToken[], readonly SToken[]];
  return [
    ...row1,
    sign(0),
    sign(1),
    ...row2,
    sign(2),
    sign(3),
    ...row3,
    sign(4),
    sign(5),
    '0',
    sign(6),
    sign(7),
    'delete',
    'enter',
  ];
}

/**
 * Part 2's pad: the rooms' `Pad`, with the signs this line needs (GDD, Notebook). Keys stay at
 * least 48 px, so that more signs than fit go on another page. Never an `<input>` (rule 8).
 */
export function StatementPad({
  signs,
  onKey,
}: {
  signs: readonly SToken[];
  onKey(key: HuntKey): void;
}) {
  const [page, setPage] = useState(0);
  const keys = padLayout(signsOnPage(signs, page)).map((slot): PadKey<Slot> => {
    if (slot.startsWith('empty-')) {
      return { key: slot, kind: 'operator', label: '', face: null, empty: true };
    }
    if (slot === 'delete' || slot === 'enter' || slot === 'more') {
      return {
        key: slot,
        kind: kindOf(slot),
        label: huntUiText.keys[slot],
        face: slot === 'more' ? '…' : slot === 'enter' ? '↵' : '⌫',
      };
    }
    const face = faceOf(slot as SToken);
    return { key: slot, kind: kindOf(slot as SToken), label: face, face };
  });
  return (
    <Pad
      keys={keys}
      onKey={(key) => {
        if (key === 'more') setPage((current) => current + 1);
        else if (!key.startsWith('empty-')) onKey(key as HuntKey);
      }}
    />
  );
}
