// One notebook line: the stage equation (line 0), a committed line, the draft he is
// writing, or a line still to fill. Committed lines are read-only text; only the draft
// changes, from its end, or, while he fills a blank, inside the blank.

import { Fragment } from 'react';
import type { LineSegment } from '@/math/format';

export type LineKind = 'given' | 'written' | 'draft' | 'upcoming';

interface Props {
  segments: readonly LineSegment[];
  kind: LineKind;
  /** A wrong line in the draft, marked (by shape as well as colour) until he edits it. */
  wrong?: boolean;
  /** Enter refused the draft: it wiggles once as it mounts. */
  wiggle?: boolean;
  /** The next step is to write this line (story 1.15, a handover): it pulses until he does. */
  pulse?: boolean;
  /** Where the next key goes, while the notebook takes keys: the blank, or the line's end. */
  caret?: boolean;
}

/** A line of plain text, as committed lines are. */
export function textLine(text: string): LineSegment[] {
  return [{ kind: 'text', text }];
}

function Caret() {
  return <span className="line__caret" aria-hidden="true" />;
}

export function LineView({
  segments,
  kind,
  wrong = false,
  wiggle = false,
  pulse = false,
  caret = false,
}: Props) {
  const className = [
    'line',
    `line--${kind}`,
    wrong && 'line--wrong',
    wiggle && 'line--wiggle',
    pulse && 'line--pulse',
  ]
    .filter(Boolean)
    .join(' ');
  const blankAt = segments.findIndex((segment) => segment.kind === 'blank');
  return (
    <li className={className}>
      <span className="line__text">
        {segments.map((segment, i) =>
          segment.kind === 'text' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: a line's segments never reorder
            <Fragment key={i}>{segment.text}</Fragment>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: a line's segments never reorder
            <span key={i} className="line__blank" data-empty={segment.text === ''}>
              {segment.text}
              {caret && i === blankAt && <Caret />}
            </span>
          ),
        )}
      </span>
      {caret && blankAt < 0 && <Caret />}
    </li>
  );
}
