// The hint button's tag at the notebook (story 1.16): the handover tag's card
// (HandoverNote.tsx, notebook.css), with the hint's text, for the steps and moves that are
// written: the current step's tag on the first press (`write`, `check`), and on the second
// the line to write, as `x = 9` (ui/common/hint-text.ts). It pops in on each press.

import '@/ui/notebook/hint-note.css';

/** The tag with the hint's text from hr.ts, at least 20 CSS px (notebook.css). */
export function HintNote({ text }: { text: string }) {
  return (
    <div className="handover-note handover-note--hint" role="note">
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
