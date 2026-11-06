// The help ladder's levels 3 and 4 at the notebook (story 2.7): the line a move on the
// machine will write, with blanks, and the same kind of equation with other numbers, solved
// line by line. A card beside the hint's tag, in the notebook's own type.

import '@/ui/notebook/hint-note.css';
import { hr } from '@/content/text/hr';

export function HelpNote({
  structure,
  example,
}: {
  structure: string | null;
  example: string | null;
}) {
  return (
    <div className="help-note" role="note">
      {structure && (
        <div className="help-note__structure">
          <p className="help-note__label">{hr.hint.structure}</p>
          <p className="help-note__line">{structure}</p>
        </div>
      )}
      {example && (
        <>
          <p className="help-note__label">{hr.hint.example}</p>
          <ol className="help-note__lines">
            {example.split('\n').map((line) => (
              <li key={line} className="help-note__line">
                {line}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
