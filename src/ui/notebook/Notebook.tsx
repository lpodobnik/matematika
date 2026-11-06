import '@/ui/notebook/notebook.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { hr } from '@/content/text/hr';
import type { LineSegment } from '@/math/format';
import type { LineToken, Token } from '@/math/tokens';
import { handoverView } from '@/room/handover';
import {
  draftDisplay,
  type LineDisplay,
  lineDisplays,
  type NotebookKey,
  notebookWrites,
} from '@/room/notebook';
import { pinOffered } from '@/room/pin';
import type { NotebookLine, Refusal } from '@/room/types';
import { useGame } from '@/store/store';
import {
  helpExample,
  helpStructure,
  hintKey,
  hintOf,
  hintPlace,
  notebookHint,
  notebookRefusal,
} from '@/ui/common/hint-text';
import {
  HandoverNote,
  isNotebookHandover,
  type NotebookHandover,
  RefusalNote,
} from '@/ui/notebook/HandoverNote';
import { HelpNote } from '@/ui/notebook/HelpNote';
import { HintNote } from '@/ui/notebook/HintNote';
import { watchKeyboard } from '@/ui/notebook/keyboard';
import { LineView, textLine } from '@/ui/notebook/LineView';
import { NumberPad } from '@/ui/notebook/NumberPad';
import { pressHandle, shownAside } from '@/ui/notebook/notebook-aside';
import { keyAction, primaryPress } from '@/ui/notebook/pad-keys';

const noLines: readonly NotebookLine[] = [];
const noTokens: Token[] = [];
const noTemplates: LineToken[][] = [];

/**
 * The notebook beside the scale (FR15): the stage equation as line 0, the committed lines,
 * the draft and the number pad. It reads the stage through selectors and acts only through
 * dispatch; what a key does is decided in `room/notebook.ts`. A computer's keys work too.
 * On a phone it shows pushed aside while a pin waits to be confirmed (notebook-aside.ts).
 * When the next step is in the notebook (story 1.15: `write` or `check`; 1.16: `answer`;
 * room/handover.ts), the line to write pulses and its handover tag hangs under the lines.
 * When it is on the scene, with its tag there, the phone's notebook shows pushed aside
 * as for a waiting pin, so it never hides the tag; he can bring it back as then. While the
 * hint button's hint shows (story 1.16), its tag takes the handover's place: at the
 * notebook, with the draft pulsing, when it is about writing; else in the scene, with the
 * phone's notebook pushed aside again on each press. When enter refuses an answer before
 * the pans are simplified (story 1.16), the refusal's tag hangs in the same place, ahead
 * of a handover's; the scene hangs none while it does, and it stays up only until his next
 * action, a press of the hint button included: a hint pressed after it takes its place
 * (story 1.16 review). While the machine is jammed, the hint's tag pulses the delete key.
 */
export function Notebook() {
  const lines = useGame((s) => s.room?.stage.lines ?? noLines);
  const draft = useGame((s) => s.room?.stage.draft ?? noTokens);
  const templates = useGame((s) => s.room?.stage.templates ?? noTemplates);
  const wrong = useGame((s) => s.room?.stage.jam?.kind === 'line');
  const refused = useGame((s) => s.room?.stage.refused ?? 0);
  const refusal = useGame(notebookRefusal);
  const writes = useGame((s) => (s.room ? notebookWrites(s.room.stage) : false));
  const choice = useGame((s) => s.ui.notebookAside);
  const step = useGame((s) =>
    handoverView(s.room, s.save.progress.firstUse, s.save.progress.tools),
  );
  const stageAt = useGame((s) => (s.room ? `${s.room.spec.id}.${s.room.stageIndex}` : null));
  const pinWaits = useGame((s) => (s.room ? pinOffered(s.room) : false));
  const hinting = useGame((s) => hintOf(s) !== null);
  const hintNote = useGame(notebookHint);
  const structure = useGame(helpStructure);
  const example = useGame(helpExample);
  const hintPadKey = useGame(hintKey);
  const hintOnScene = useGame((s) => hintPlace(s) === 'scene');
  const presses = useGame((s) => s.ui.hint?.presses ?? 0);
  const onScene = hinting ? hintOnScene : step !== null && !isNotebookHandover(step);
  const shownStep = hinting ? `hint-${presses}` : step;
  const waiting = pinWaits ? stageAt : onScene && stageAt ? `${stageAt}:${shownStep}` : null;
  const [broughtBack, setBroughtBack] = useState<string | null>(null);
  const aside = shownAside(choice, waiting, broughtBack);
  const dispatch = useGame((s) => s.dispatch);

  const shown = useMemo(() => lineDisplays(lines), [lines]);
  const display = useMemo(() => draftDisplay({ draft, templates }), [draft, templates]);
  const send = useCallback((key: NotebookKey) => dispatch(keyAction(key)), [dispatch]);
  // The page asks for the opposite of what it shows; the waiting pin (or the scene's
  // handover tag) decides what that means.
  const slide = useCallback(() => {
    const next = pressHandle({ choice, broughtBack }, waiting);
    setBroughtBack(next.broughtBack);
    if (next.choice !== choice) dispatch({ type: 'notebook/slide', aside: next.choice });
  }, [choice, broughtBack, waiting, dispatch]);

  useEffect(() => watchKeyboard(window, send), [send]);

  return (
    <NotebookPage
      lines={shown}
      draft={display.draft}
      upcoming={display.upcoming}
      blank={templates.length > 0}
      wrong={wrong}
      refused={refused}
      writes={writes}
      aside={aside}
      handover={!hinting && isNotebookHandover(step) ? step : null}
      hint={hintNote === null ? null : { text: hintNote, presses, key: hintPadKey }}
      refusal={refusal}
      help={structure || example ? { structure, example } : null}
      onKey={send}
      onSlide={slide}
    />
  );
}

export interface NotebookPageProps {
  /** Story 2.7: the help ladder's levels 3 and 4, a card under the tag. */
  help?: { structure: string | null; example: string | null } | null;
  lines: readonly LineDisplay[];
  /** The draft in school notation: free text, or its template with the blank filled so far. */
  draft: readonly LineSegment[];
  /** Lines with blanks still to fill after the draft (Fading, `blanks`). */
  upcoming: readonly (readonly LineSegment[])[];
  /** He is filling a blank, so only digits, delete and enter work. */
  blank: boolean;
  wrong: boolean;
  /** Counts refusals; each new one remounts the draft line, so it wiggles once. */
  refused: number;
  writes: boolean;
  /** On a phone, pushed aside off the scale; the tablet layout ignores it. */
  aside: boolean;
  /**
   * The next step is in the notebook (story 1.15): the draft line pulses, its tag hangs
   * under the lines, and on a phone the handle pulses while the notebook is pushed aside.
   */
  handover?: NotebookHandover | null;
  /**
   * Story 1.16: the hint button's tag at the notebook, in the handover's place: its text,
   * and the presses so far, so each press pops it in again. The draft line pulses with it,
   * and the pad key it names, if any (the delete key while the machine is jammed).
   */
  hint?: { text: string; presses: number; key?: 'delete' | null } | null;
  /**
   * Why enter refused the line, with a tag (story 1.16, `refusalView`): it hangs where a
   * handover's would, in its place; nothing pulses.
   */
  refusal?: Refusal | null;
  onKey(key: NotebookKey): void;
  onSlide(aside: boolean): void;
}

/**
 * The notebook's page, from props only. On the tablet it sits beside the scale; on a phone
 * in landscape (under 500 CSS px tall) notebook.css slides it over the scale, and the
 * handle pushes it aside or brings it back. The draft line always stays in view, also when
 * a handover tag takes room under the lines.
 */
export function NotebookPage({
  lines,
  draft,
  upcoming,
  blank,
  wrong,
  refused,
  writes,
  aside,
  handover = null,
  hint = null,
  refusal = null,
  help = null,
  onKey,
  onSlide,
}: NotebookPageProps) {
  const listRef = useRef<HTMLOListElement>(null);
  // A tag hangs under the lines: the refusal's, else the hint's, else the handover's. Only a
  // handover's or a hint's makes the line to write pulse; a refusal's doesn't.
  const pulsing = handover !== null || hint !== null;
  const tagged = refusal !== null || pulsing;

  // The draft stays in view as lines are added, as it grows, and as a handover tag takes
  // room: the list scrolls to its end, but never so far that the draft's top is cut off.
  // biome-ignore lint/correctness/useExhaustiveDependencies: it scrolls when any of them changes
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
    const line = list.querySelector('.line--draft');
    if (!line) return;
    const cut = list.getBoundingClientRect().top - line.getBoundingClientRect().top;
    if (cut > 0) list.scrollTop -= cut;
  }, [lines, draft, handover, hint?.text, refusal]);

  return (
    <aside className="notebook-area" data-aside={aside} aria-label={hr.notebook.label}>
      <button
        type="button"
        tabIndex={-1}
        className="notebook__handle"
        aria-label={aside ? hr.notebook.bringBack : hr.notebook.pushAside}
        aria-expanded={!aside}
        data-pulse={pulsing || help !== null}
        onPointerDown={(event) => primaryPress(event, () => onSlide(!aside))}
      >
        <svg className="notebook__chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d={aside ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>
      <div className="notebook" data-handover={tagged}>
        <ol className="notebook__lines" ref={listRef}>
          {lines.map((line) => (
            <LineView
              key={line.number}
              segments={textLine(line.text)}
              kind={line.source === 'given' ? 'given' : 'written'}
            />
          ))}
          <LineView
            key={`draft-${refused}`}
            segments={draft}
            kind="draft"
            wrong={wrong}
            wiggle={refused > 0}
            pulse={pulsing}
            caret={writes}
          />
          {upcoming.map((segments, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines to fill only ever leave from the front
            <LineView key={`upcoming-${i}`} segments={segments} kind="upcoming" />
          ))}
        </ol>
        {refusal ? (
          <RefusalNote refusal={refusal} />
        ) : hint ? (
          <HintNote key={hint.presses} text={hint.text} />
        ) : (
          handover && <HandoverNote step={handover} />
        )}
        {help && <HelpNote structure={help.structure} example={help.example} />}
        <NumberPad writes={writes} blank={blank} pulse={hint?.key ?? null} onKey={onKey} />
      </div>
    </aside>
  );
}
