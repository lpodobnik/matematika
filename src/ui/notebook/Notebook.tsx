import '@/ui/notebook/notebook.css';
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { hr } from '@/content/text/hr';
import type { LinkOp } from '@/math/chain';
import type { LineSegment } from '@/math/format';
import type { LineToken, Token } from '@/math/tokens';
import { type ChainView, chainView } from '@/room/chain';
import { type DialView, dialView } from '@/room/dial';
import { type DrumView, drumView } from '@/room/drum';
import { handoverView } from '@/room/handover';
import { type LinkedView, linkedView } from '@/room/linked';
import { type LogbookView, logbookView } from '@/room/logbook';
import {
  draftDisplay,
  type LineDisplay,
  lineDisplays,
  type NotebookKey,
  notebookWrites,
} from '@/room/notebook';
import { pinOffered } from '@/room/pin';
import { type RangeView, rangeView } from '@/room/range';
import { type StoryView, storyView } from '@/room/story';
import type { NotebookLine, Refusal } from '@/room/types';
import { useGame } from '@/store/store';
import {
  helpExample,
  helpStructure,
  hintKey,
  hintMoveKind,
  hintOf,
  hintPlace,
  notebookHint,
  notebookRefusal,
} from '@/ui/common/hint-text';
import {
  type ChainPick,
  ChainStrip,
  pickAfterKey,
  pickedLink,
  pickFor,
} from '@/ui/notebook/ChainStrip';
import { DrumPanel } from '@/ui/notebook/DrumPanel';
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
import { LinkedPanel } from '@/ui/notebook/LinkedPanel';
import { LogbookLine } from '@/ui/notebook/LogbookLine';
import { NumberPad } from '@/ui/notebook/NumberPad';
import { pressHandle, shownAside } from '@/ui/notebook/notebook-aside';
import { keyAction, primaryPress } from '@/ui/notebook/pad-keys';
import { FineDial, RangePanel } from '@/ui/notebook/RangePanel';
import { StoryPanel } from '@/ui/notebook/StoryPanel';

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
  const pinWaits = useGame((s) =>
    // A line pin (room 7) waits in the notebook itself, so it keeps the notebook out.
    // So does a story pin (room 10, story 4.5).
    s.room
      ? pinOffered(s.room) &&
        s.room.stage.planted === null &&
        !s.room.spec.stages[s.room.stageIndex]?.story &&
        s.room.spec.stages[s.room.stageIndex]?.pin?.kind !== 'range' &&
        s.room.spec.stages[s.room.stageIndex]?.pin?.kind !== 'next-dot'
      : false,
  );
  const hinting = useGame((s) => hintOf(s) !== null);
  const hintNote = useGame(notebookHint);
  const structure = useGame(helpStructure);
  const example = useGame(helpExample);
  const hintPadKey = useGame(hintKey);
  const hintOnScene = useGame((s) => hintPlace(s) === 'scene');
  const presses = useGame((s) => s.ui.hint?.presses ?? 0);
  // Story 2.10: room 7's logbook, its lines to tap and its mistake pin, in the notebook.
  const logbook = useGame(useShallow((s) => logbookView(s.room)));
  // Story 4.5: a story stage's story, and its story pin (room 10).
  const storyKey = useGame((s) => JSON.stringify(storyView(s.room)));
  const story = useMemo(() => JSON.parse(storyKey) as StoryView | null, [storyKey]);
  // Story 4.6: room 11's range pin, and a coarse dial's single steps.
  const rangeKey = useGame((s) => JSON.stringify(rangeView(s.room)));
  const range = useMemo(() => JSON.parse(rangeKey) as RangeView | null, [rangeKey]);
  const dial = useGame(useShallow((s) => dialView(s.room)));
  const fineDial = dial?.coarse !== undefined ? dial : null;
  // Story 4.7: a linked machine (room 12).
  const linkedKey = useGame((s) => JSON.stringify(linkedView(s.room)));
  const linked = useMemo(() => JSON.parse(linkedKey) as LinkedView | null, [linkedKey]);
  // Story 4.8: the recording drum (room 13).
  const drumKey = useGame((s) => JSON.stringify(drumView(s.room)));
  const drum = useMemo(() => JSON.parse(drumKey) as DrumView | null, [drumKey]);
  const onScene = hinting ? hintOnScene : step !== null && !isNotebookHandover(step);
  const shownStep = hinting ? `hint-${presses}` : step;
  const waiting = pinWaits ? stageAt : onScene && stageAt ? `${stageAt}:${shownStep}` : null;
  const [broughtBack, setBroughtBack] = useState<string | null>(null);
  // Story 4.5 review: a story pin waits in the notebook itself, so it is always shown then.
  const aside =
    shownAside(choice, waiting, broughtBack) && !story?.asks && !range?.asks && !drum?.pin?.asks;
  const dispatch = useGame((s) => s.dispatch);
  // Story 4.1: the gear chain, and his pick for its last link while the picker is open.
  // Its links are a fresh array on every read, so the selector returns them as text.
  const chainKey = useGame((s) => JSON.stringify(chainView(s.room, s.save.progress.tools)));
  const chain = useMemo(() => JSON.parse(chainKey) as ChainView | null, [chainKey]);
  const chainHint = useGame((s) => hintMoveKind(s) === 'chain');
  const [pick, setPick] = useState<ChainPick | null>(null);
  const openFor = pickFor(chain);
  const picking = pick !== null && openFor !== null && pick.for === openFor;
  // The picker closes once the link it was opened for changes or goes (a Balance move, a
  // jam, a tapped line: story 4.1 review).
  useEffect(() => {
    if (pick !== null && pick.for !== openFor) setPick(null);
  }, [pick, openFor]);
  // A computer's Escape closes it.
  useEffect(() => {
    if (!picking) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPick(null);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [picking]);
  const runPick = useCallback(
    (current: ChainPick) => {
      const link = pickedLink(current);
      if (!link) return;
      setPick(null);
      dispatch({ type: 'chain/run', op: link.op, n: link.n });
    },
    [dispatch],
  );

  // While a story is built, his line is the stage's equation: line 0 stays hidden.
  const building = story?.build != null;
  const shown = useMemo(
    () => lineDisplays(lines).filter((line) => !building || line.source !== 'given'),
    [lines, building],
  );
  const display = useMemo(() => draftDisplay({ draft, templates }), [draft, templates]);
  const send = useCallback(
    (key: NotebookKey) => {
      // While the chain's picker is open, the pad types its number (story 4.1).
      if (picking && pick) {
        const next = pickAfterKey(pick, key);
        if (next.run) runPick(next.pick);
        else setPick(next.pick);
        return;
      }
      dispatch(keyAction(key));
    },
    [dispatch, picking, pick, runPick],
  );
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
      logbook={logbook}
      onShowLine={(line) => dispatch({ type: 'notebook/show-line', line })}
      onPinLine={(index) => dispatch({ type: 'pin/set', value: { kind: 'line', index } })}
      onConfirmPin={() => dispatch({ type: 'pin/confirm' })}
      story={story}
      onFlagStory={(index) => dispatch({ type: 'pin/set', value: { kind: 'choice', index } })}
      range={range}
      onFlagRange={(index) => dispatch({ type: 'pin/set', value: { kind: 'bucket', index } })}
      fineDial={fineDial}
      onNudge={(by) => dispatch({ type: 'dial/nudge', by })}
      linked={linked}
      drum={drum}
      chain={chain}
      pick={picking ? pick : null}
      chainPulse={chainHint}
      onChainTap={() =>
        setPick(picking || openFor === null ? null : { op: null, digits: '', for: openFor })
      }
      onChainOp={(op) => setPick((current) => (current ? { ...current, op } : current))}
      onChainRun={() => pick && runPick(pick)}
      onChainCancel={() => setPick(null)}
      onKey={send}
      onSlide={slide}
    />
  );
}

export interface NotebookPageProps {
  /** Story 4.5: a story stage's story, or null. */
  story?: StoryView | null;
  onFlagStory?(index: number): void;
  /** Story 4.6: a range pin, or null. */
  range?: RangeView | null;
  onFlagRange?(index: number): void;
  /** Story 4.6: a coarse dial, for its single steps, or null. */
  fineDial?: DialView | null;
  /** Story 4.7: a linked machine, or null. */
  linked?: LinkedView | null;
  /** Story 4.8: the recording drum, or null. */
  drum?: DrumView | null;
  onNudge?(by: 1 | -1): void;
  /** Story 4.1: the gear chain, or null in a stage without it. */
  chain?: ChainView | null;
  /** His pick for the chain's last link while its picker is open. */
  pick?: ChainPick | null;
  /** The hint points at the chain's last link. */
  chainPulse?: boolean;
  onChainTap?(): void;
  onChainOp?(op: LinkOp): void;
  onChainRun?(): void;
  onChainCancel?(): void;
  /** Story 2.10: room 7's logbook, or null in any other stage. */
  logbook?: LogbookView | null;
  onShowLine?(line: number): void;
  onPinLine?(line: number): void;
  onConfirmPin?(): void;
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
  logbook = null,
  story = null,
  onFlagStory = () => {},
  range = null,
  onFlagRange = () => {},
  fineDial = null,
  onNudge = () => {},
  linked = null,
  drum = null,
  chain = null,
  pick = null,
  chainPulse = false,
  onChainTap = () => {},
  onChainOp = () => {},
  onChainRun = () => {},
  onChainCancel = () => {},
  onShowLine = () => {},
  onPinLine = () => {},
  onConfirmPin = () => {},
  onKey,
  onSlide,
}: NotebookPageProps) {
  // A logbook line, written (by its number) or planted, tappable and flaggable (story 2.10).
  const logbookLine = (number: number, text: string, struck = false) =>
    logbook ? (
      <LogbookLine
        key={struck || number === logbook.plantedLine ? 'planted' : `logbook-${number}`}
        number={number}
        text={text}
        shown={logbook.shown === number}
        struck={struck}
        flag={!logbook.pinAsks ? 'none' : logbook.pinAt === number ? 'here' : 'offered'}
        confirmable={logbook.pinConfirmable}
        onShow={onShowLine}
        onFlag={onPinLine}
        onConfirm={onConfirmPin}
      />
    ) : null;
  // While the mistake pin is offered, its tag: first how to put a line on the scale, then
  // the pin's question.
  const logbookTag = logbook?.pinAsks
    ? logbook.tapped
      ? hr.pin.questions['wrong-line']
      : hr.logbook.tap
    : story?.asks
      ? hr.pin.questions['story-choice']
      : range?.asks
        ? hr.pin.questions.range
        : drum?.pin?.asks
          ? hr.pin.questions['next-dot']
          : null;
  const listRef = useRef<HTMLOListElement>(null);
  // A tag hangs under the lines: the refusal's, else the hint's, else the handover's. Only a
  // handover's or a hint's makes the line to write pulse; a refusal's doesn't.
  const pulsing = handover !== null || hint !== null;
  const tagged = refusal !== null || pulsing;
  // Story 4.1: a tag about the gear chain hangs at the chain, as one line under its links,
  // not as a card under the lines (the phone has no room for both).
  const chainNote =
    chain === null || refusal !== null
      ? null
      : hint && chainPulse
        ? hint.text
        : !hint && handover === 'chain'
          ? hr.handover.chain
          : null;

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
      <div
        className="notebook"
        data-handover={tagged}
        data-picking={pick !== null || undefined}
        data-choosing={story?.asks || range?.asks || drum?.pin?.asks || undefined}
      >
        {story && <StoryPanel view={story} onFlag={onFlagStory} onConfirm={onConfirmPin} />}
        {range && <RangePanel view={range} onFlag={onFlagRange} onConfirm={onConfirmPin} />}
        {linked && <LinkedPanel view={linked} />}
        {drum && <DrumPanel view={drum} onFlag={onFlagStory} onConfirm={onConfirmPin} />}
        {fineDial && <FineDial dial={fineDial} onNudge={onNudge} />}
        {chain && (
          <ChainStrip
            view={chain}
            pick={pick}
            note={chainNote}
            pulse={chainPulse || chainNote !== null}
            onTap={onChainTap}
            onOp={onChainOp}
            onRun={onChainRun}
            onCancel={onChainCancel}
          />
        )}
        <ol className="notebook__lines" ref={listRef}>
          {lines.map((line) =>
            logbook && line.source === 'logbook' ? (
              logbookLine(line.number, line.text)
            ) : (
              <Fragment key={line.number}>
                {/* The planted line, right after the logbook's own (story 2.10 review). */}
                {logbook &&
                  line.number === logbook.plantedLine &&
                  logbookLine(logbook.plantedLine, logbook.plantedText, logbook.found)}
                <LineView
                  segments={textLine(line.text)}
                  kind={line.source === 'given' ? 'given' : 'written'}
                />
              </Fragment>
            ),
          )}
          {logbook &&
            lines.length <= logbook.plantedLine &&
            logbookLine(logbook.plantedLine, logbook.plantedText, logbook.found)}
          <LineView
            key={`draft-${refused}`}
            segments={draft}
            kind="draft"
            wrong={wrong}
            wiggle={refused > 0}
            pulse={pulsing && chainNote === null}
            caret={writes}
          />
          {upcoming.map((segments, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines to fill only ever leave from the front
            <LineView key={`upcoming-${i}`} segments={segments} kind="upcoming" />
          ))}
        </ol>
        {chainNote !== null ? null : refusal ? (
          <RefusalNote refusal={refusal} />
        ) : logbookTag && !hint ? (
          <HintNote text={logbookTag} />
        ) : hint ? (
          <HintNote key={hint.presses} text={hint.text} />
        ) : (
          handover && <HandoverNote step={handover} />
        )}
        {help && <HelpNote structure={help.structure} example={help.example} />}
        <NumberPad
          writes={writes || pick !== null}
          blank={blank || pick !== null}
          pulse={hint?.key ?? null}
          onKey={onKey}
        />
      </div>
    </aside>
  );
}
