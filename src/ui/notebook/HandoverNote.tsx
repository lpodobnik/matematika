// The handover tag at the notebook (story 1.15): the paper tag of the 1.14 pin's question,
// in HTML, for the steps that happen in the notebook (room/handover.ts): `write`, when his
// dial first levels the pans, `answer`, when x is alone on the pans (story 1.16), and
// `check`, after the answer line. It hangs between the lines and the pad, on a string up
// toward the line that pulses, so it covers neither. A refusal's tag (story 1.16: `Prvo
// pojednostavi vagu.`) hangs in the same place, on the same paper.

import { hr } from '@/content/text/hr';
import type { Refusal } from '@/room/types';

/** The handover steps whose tags hang at the notebook. */
export type NotebookHandover = 'write' | 'answer' | 'check' | 'rewrite' | 'chain' | 'story';

export function isNotebookHandover(id: string | null): id is NotebookHandover {
  const ids: readonly string[] = ['write', 'answer', 'check', 'rewrite', 'chain', 'story'];
  return id !== null && ids.includes(id);
}

/** The paper tag with its text, at least 20 CSS px (notebook.css). */
function NoteTag({ text }: { text: string }) {
  return (
    <div className="handover-note" role="note">
      <span className="handover-note__string" aria-hidden="true" />
      <div className="handover-note__edge">
        <p className="handover-note__card">
          <span className="handover-note__hole" aria-hidden="true" />
          {text}
        </p>
      </div>
    </div>
  );
}

/** The tag with the step's text from hr.ts. */
export function HandoverNote({ step }: { step: NotebookHandover }) {
  return <NoteTag text={hr.handover[step]} />;
}

/** The tag with why enter refused the line, from hr.ts (room/notebook.ts, `refusalView`). */
export function RefusalNote({ refusal }: { refusal: Refusal }) {
  return <NoteTag text={hr.refusal[refusal]} />;
}
