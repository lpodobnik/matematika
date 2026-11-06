// The handover tag at the notebook (story 1.15): the paper tag of the 1.14 pin's question,
// in HTML, for the steps that happen in the notebook (room/handover.ts): `write`, when his
// dial first levels the pans, and `check`, after the answer line. It hangs between the
// lines and the pad, on a string up toward the line that pulses, so it covers neither.

import { hr } from '@/content/text/hr';

/** The handover steps whose tags hang at the notebook. */
export type NotebookHandover = 'write' | 'check';

export function isNotebookHandover(id: string | null): id is NotebookHandover {
  return id === 'write' || id === 'check';
}

/** The tag with the step's text from hr.ts, at least 20 CSS px (notebook.css). */
export function HandoverNote({ step }: { step: NotebookHandover }) {
  return (
    <div className="handover-note" role="note">
      <span className="handover-note__string" aria-hidden="true" />
      <div className="handover-note__edge">
        <p className="handover-note__card">
          <span className="handover-note__hole" aria-hidden="true" />
          {hr.handover[step]}
        </p>
      </div>
    </div>
  );
}
