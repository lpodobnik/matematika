// One notebook line: the stage equation (line 0), a committed line, or the draft he is
// writing. Committed lines are read-only text; only the draft changes, from its end.

export type LineKind = 'given' | 'written' | 'draft';

interface Props {
  text: string;
  kind: LineKind;
  /** A wrong line in the draft, marked (by shape as well as colour) until he edits it. */
  wrong?: boolean;
  /** Enter refused the draft: it wiggles once as it mounts. */
  wiggle?: boolean;
  /** Where the next key goes: the end of the draft, while the notebook takes keys. */
  caret?: boolean;
}

export function LineView({ text, kind, wrong = false, wiggle = false, caret = false }: Props) {
  const className = ['line', `line--${kind}`, wrong && 'line--wrong', wiggle && 'line--wiggle']
    .filter(Boolean)
    .join(' ');
  return (
    <li className={className}>
      <span className="line__text">{text}</span>
      {caret && <span className="line__caret" aria-hidden="true" />}
    </li>
  );
}
