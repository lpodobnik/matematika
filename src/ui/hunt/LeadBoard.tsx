import '@/ui/hunt/lead.css';
import { useEffect, useRef, useState } from 'react';
import { tuning } from '@/config/tuning';
import { huntUiText, knockGuideText } from '@/content/text/hunt-leads';
import type { AloneState } from '@/hunt/alone';
import {
  cluesLeft,
  doorsOf,
  type KnockSpec,
  type KnockState,
  knockGuide,
  lineStart,
  litDoors,
} from '@/hunt/knock';
import { type LeadAction, type LeadPlay, playedScene } from '@/hunt/lead';
import { sceneGuide } from '@/hunt/scene';
import type { SneakState } from '@/hunt/sneak';
import type { LeadSpec, LineTask } from '@/hunt/spec';
import type { UnmaskState } from '@/hunt/unmask';
import { formatNumber, formatStatementLine } from '@/math/format';
import { readLine, type SLineToken, type SToken } from '@/math/statement-tokens';
import { HintControl } from '@/ui/common/HintButton';
import { LittleOneArt } from '@/ui/hunt/LittleOne';
import { ObjectView } from '@/ui/hunt/objects/ObjectView';
import { AloneBoardView, SneakBoardView, UnmaskBoardView } from '@/ui/hunt/SceneBoards';
import { type HuntKey, StatementPad } from '@/ui/hunt/StatementPad';
import { useHuntKeys } from '@/ui/hunt/use-hunt-keys';
import { LineView } from '@/ui/notebook/LineView';

type Act = (action: LeadAction) => void;

/** A line of content, as school notation. */
const written = (line: string) => formatStatementLine(readLine(line) ?? []);

/** A key from the pad, as a move in the lead. */
function keyAction(key: HuntKey): LeadAction {
  if (key === 'delete') return { kind: 'delete' };
  if (key === 'enter') return { kind: 'enter' };
  return { kind: 'type', token: key };
}

function NextButton({ onNext }: { onNext(): void }) {
  return (
    <button type="button" className="hunt__next" onClick={onNext}>
      {huntUiText.next}
    </button>
  );
}

/** The lead from props: whichever step it's on. */
export function LeadBoard({ spec, play, act }: { spec: LeadSpec; play: LeadPlay; act: Act }) {
  switch (play.step) {
    case 'show':
      return <ShowBoard key={play.at} spec={spec} play={play} act={act} />;
    case 'try':
      return <TryBoard spec={spec} play={play} act={act} />;
    case 'fix':
      return <FixBoard spec={spec} play={play} act={act} />;
    case 'play': {
      const scene = spec.scenes[play.at];
      const state = playedScene(play);
      if (!scene || !state) return null;
      const guide = sceneGuide(scene, state);
      switch (scene.kind) {
        case 'knock':
          return <KnockBoard key={play.at} spec={scene} state={state as KnockState} act={act} />;
        case 'sneak':
          return (
            <SneakBoardView
              key={play.at}
              spec={scene}
              state={state as SneakState}
              guide={guide}
              act={act}
            />
          );
        case 'unmask':
          return (
            <UnmaskBoardView
              key={play.at}
              spec={scene}
              state={state as UnmaskState}
              guide={guide}
              act={act}
            />
          );
        case 'alone':
          return (
            <AloneBoardView
              key={play.at}
              spec={scene}
              state={state as AloneState}
              guide={guide}
              act={act}
            />
          );
      }
      return null;
    }
    case 'write':
      return <WriteBoard spec={spec} play={play} act={act} />;
    case 'thread':
      return <ThreadBoard spec={spec} play={play} act={act} />;
  }
}

/** The cylinder plays: up to 60 seconds, and one tap speeds it up. It has no skip the first time. */
function ShowBoard({ spec, play, act }: { spec: LeadSpec; play: LeadPlay; act: Act }) {
  const step = spec.lesson.steps[play.at];
  useEffect(() => {
    const timer = window.setTimeout(() => act({ kind: 'next' }), tuning.hunt.lessonStepMs);
    return () => window.clearTimeout(timer);
  }, [act]);
  if (!step) return null;
  return (
    <main className="hunt hunt--full">
      <button type="button" className="lesson" onClick={() => act({ kind: 'next' })}>
        {play.at === 0 && <span className="lesson__found">{spec.lesson.found}</span>}
        <span className="lesson__object">
          <span className="lesson__little">
            <LittleOneArt />
          </span>
          <ObjectView object={step.object} />
        </span>
        {step.say.map((line) => (
          <span key={line} className="lesson__line">
            {line}
          </span>
        ))}
        <span className="lesson__next">{huntUiText.next}</span>
      </button>
    </main>
  );
}

/** A line he's writing: what's on it already, then what he's typed. */
function Draft({
  start,
  draft,
  wiggle,
}: {
  start: readonly SLineToken[];
  draft: readonly SToken[];
  wiggle: boolean;
}) {
  const segments = formatStatementLine(
    start.includes('☐') ? start : [...start, ...draft],
    start.includes('☐') ? draft : [],
  );
  return (
    <ol className="hunt__draft">
      <LineView segments={segments} kind="draft" wiggle={wiggle} caret />
    </ol>
  );
}

function TaskNote({ play }: { play: LeadPlay }) {
  if (play.bounced) return <p className="hunt__note">{huntUiText.bounce}</p>;
  if (play.refused) return <p className="hunt__note">{huntUiText.refuse}</p>;
  return null;
}

/** What he's writing right now, with its draft and pad. */
function LineTaskPanel({ task, play, act }: { task: LineTask; play: LeadPlay; act: Act }) {
  const onKey = (key: HuntKey) => act(keyAction(key));
  useHuntKeys(onKey);
  return (
    <>
      <TaskNote play={play} />
      <Draft
        key={play.bounced || play.refused ? 'wiggle' : 'still'}
        start={readLine(task.start) ?? []}
        draft={play.draft}
        wiggle={play.bounced || play.refused}
      />
      <StatementPad signs={task.keys} onKey={onKey} />
    </>
  );
}

function TryBoard({ spec, play, act }: { spec: LeadSpec; play: LeadPlay; act: Act }) {
  const task = spec.tries[play.at];
  if (!task) return null;
  return (
    <main className="hunt">
      <section className="hunt__scene hunt__scene--object">
        {task.kind === 'object' && play.object ? (
          <ObjectView object={play.object} onMove={(move) => act({ kind: 'move', move })} />
        ) : task.kind === 'line' && task.object ? (
          <ObjectView object={task.object} />
        ) : (
          <div className="hunt__little">
            <LittleOneArt />
          </div>
        )}
      </section>
      <section className="hunt__notebook">
        <p className="hunt__task">{task.say}</p>
        <div className="hunt__page">
          <ol className="hunt__ink">
            {play.written.map((line) => (
              <LineView key={line} segments={written(line)} kind="written" />
            ))}
          </ol>
        </div>
        {play.solved ? (
          <NextButton onNext={() => act({ kind: 'next' })} />
        ) : task.kind === 'line' ? (
          <LineTaskPanel task={task} play={play} act={act} />
        ) : null}
      </section>
    </main>
  );
}

/** The little one has written it wrong, in its own hand. */
function FixBoard({ spec, play, act }: { spec: LeadSpec; play: LeadPlay; act: Act }) {
  const { mistake } = spec;
  const say =
    play.fix === 'spot'
      ? play.nudged
        ? mistake.nudge
        : mistake.say
      : play.fix === 'show'
        ? mistake.show.say
        : play.fix === 'write'
          ? mistake.write.say
          : mistake.thanks;
  return (
    <main className="hunt">
      <section className="hunt__scene hunt__scene--object">
        {play.object ? (
          <ObjectView
            object={play.object}
            onMove={play.fix === 'show' ? (move) => act({ kind: 'move', move }) : undefined}
          />
        ) : null}
        <div className="hunt__little" data-nod={play.fix === 'thanks'}>
          <LittleOneArt />
        </div>
      </section>
      <section className="hunt__notebook">
        <p className="hunt__task" data-nudged={play.nudged}>
          {say}
        </p>
        <div className="hunt__page">
          <ol className="hunt__wobbly">
            {mistake.lines.map((line, index) => (
              <li key={line}>
                <button
                  type="button"
                  className="hunt__wobbly-line"
                  disabled={play.fix !== 'spot'}
                  data-wrong={play.fix !== 'spot' && index === mistake.wrong}
                  onClick={() => act({ kind: 'fix-tap', line: index })}
                >
                  {line}
                </button>
              </li>
            ))}
          </ol>
          <ol className="hunt__ink">
            {play.fix === 'thanks' && mistake.write.accepts[0] && (
              <LineView segments={written(mistake.write.accepts[0])} kind="written" />
            )}
          </ol>
        </div>
        {play.fix === 'write' && <LineTaskPanel task={mistake.write} play={play} act={act} />}
        {play.fix === 'thanks' && <NextButton onNext={() => act({ kind: 'next' })} />}
      </section>
    </main>
  );
}

function WriteBoard({ spec, play, act }: { spec: LeadSpec; play: LeadPlay; act: Act }) {
  const task = spec.writeUp[play.at];
  if (!task) return null;
  return (
    <main className="hunt">
      <section className="hunt__scene hunt__scene--object">
        <div className="hunt__little hunt__little--big">
          <LittleOneArt />
        </div>
      </section>
      <section className="hunt__notebook">
        <p className="hunt__task">{task.say}</p>
        <div className="hunt__page">
          <ol className="hunt__ink">
            {play.written.map((line) => (
              <LineView key={line} segments={written(line)} kind="written" />
            ))}
          </ol>
        </div>
        <LineTaskPanel task={task} play={play} act={act} />
      </section>
    </main>
  );
}

/** The thread reaches the place, and Nikola's question gets its answer in general terms. */
function ThreadBoard({ spec, play, act }: { spec: LeadSpec; play: LeadPlay; act: Act }) {
  return (
    <main className="hunt hunt--full">
      <div className="thread" data-at={play.at}>
        {play.at === 0 ? (
          <>
            <svg className="thread__line" viewBox="0 0 400 60" aria-hidden="true">
              <path d="M10 40 C 100 10, 200 60, 390 20" />
            </svg>
            <p className="thread__say">{huntUiText.thread}</p>
            <p className="thread__find">{spec.find.say}</p>
          </>
        ) : (
          <>
            <p className="thread__how">{huntUiText.how}</p>
            <h2 className="thread__title">{spec.find.title}</h2>
            {spec.find.card.map((line) => (
              <p key={line} className="thread__card">
                {line}
              </p>
            ))}
          </>
        )}
        <NextButton onNext={() => act({ kind: 'next' })} />
      </div>
    </main>
  );
}

/** Knock: his lines light and darken the doors, and the door judges. */
export function KnockBoard({ spec, state, act }: { spec: KnockSpec; state: KnockState; act: Act }) {
  const lit = litDoors(spec.row, state.side, state.lines);
  const doors = doorsOf(spec.row, state.side);
  const left = cluesLeft(spec, state);
  const row = useRef<HTMLDivElement>(null);
  const guide = knockGuide(spec, state);
  const litKey = lit.join(',');
  // The row scrolls to what's lit, once there's little enough to look at.
  // biome-ignore lint/correctness/useExhaustiveDependencies: it runs when the lit doors change
  useEffect(() => {
    const first = lit[0];
    if (first === undefined || lit.length > 4) return;
    const door = row.current?.querySelector(`[data-door="${first}"]`);
    door?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [litKey]);
  // What he's just written, or the clue he's on, stays in view in the notebook.
  const page = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: it runs when the notebook changes
  useEffect(() => {
    const lines = page.current?.querySelectorAll('.his-line');
    const last = lines?.[lines.length - 1];
    const current = page.current?.querySelector('.clue[data-current="true"]');
    (last ?? current)?.scrollIntoView?.({ block: 'nearest' });
  }, [state.lines.length, state.clue]);
  // A minute with nothing done: help rises, for nothing.
  const [, setIdle] = useState(0);
  const idleKey = `${state.lines.length},${state.draft.length},${state.side},${state.help}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer starts over with each move
  useEffect(() => {
    if (state.opened || state.help >= 3) return;
    const timer = window.setTimeout(() => {
      act({ kind: 'idle' });
      setIdle((n) => n + 1);
    }, tuning.hunt.idleMs);
    return () => window.clearTimeout(timer);
  }, [idleKey, state.opened]);
  const onKey = (key: HuntKey) => act(keyAction(key));
  useHuntKeys(onKey);
  const start = lineStart(spec, state);
  const current = spec.clues.find((clue) => clue.id === state.clue);
  const help = state.help;
  const nextClue = left[0];
  const say = guide
    ? guide.kind === 'intro'
      ? knockGuideText.intro
      : guide.kind === 'cross'
        ? knockGuideText.cross
        : guide.kind === 'door'
          ? knockGuideText.door
          : guide.first
            ? knockGuideText.line
            : knockGuideText.next
    : null;
  return (
    <main className="hunt">
      <section className="hunt__scene knock" data-kind={spec.row.kind}>
        <HintControl
          works={!state.opened}
          shown={state.hintLevel > 0}
          onPress={() => act({ kind: 'hint' })}
        />
        <header className="knock__top">
          <p className="knock__intro">{spec.intro}</p>
          {state.side !== null && (
            <div className="knock__side">
              <span className="knock__side-name">{huntUiText.side[state.side]}</span>
              <button
                type="button"
                className="knock__cross"
                data-focus={guide?.kind === 'cross' || undefined}
                onClick={() => act({ kind: 'cross' })}
              >
                {huntUiText.cross}
              </button>
            </div>
          )}
        </header>
        <div
          ref={row}
          className="doors"
          data-kind={spec.row.kind}
          data-focus={guide?.kind === 'door' || undefined}
        >
          {doors.map((door) => (
            <button
              key={door}
              type="button"
              className="door"
              data-door={door}
              data-lit={lit.includes(door)}
              data-open={state.opened && door === spec.door}
              onClick={() => act({ kind: 'door', door })}
            >
              <span className="door__lamp" aria-hidden="true" />
              <span className="door__plate">{formatNumber(door)}</span>
            </button>
          ))}
        </div>
        <div
          key={state.shakes}
          className="hunt__little knock__little"
          data-shake={state.shakes > 0}
        >
          <LittleOneArt />
        </div>
        {state.shown && (
          <div className="knock__bubble" role="status">
            <p>{state.shown.say}</p>
            <button type="button" className="hunt__next" onClick={() => act({ kind: 'dismiss' })}>
              {huntUiText.ok}
            </button>
          </div>
        )}
        {state.opened && (
          <div className="knock__bubble" role="status">
            <p>{spec.opened}</p>
            <NextButton onNext={() => act({ kind: 'next' })} />
          </div>
        )}
        {say && (
          <div className="guide-card">
            <p>{say}</p>
            {guide?.kind === 'intro' && <NextButton onNext={() => act({ kind: 'next' })} />}
          </div>
        )}
      </section>
      <section className="hunt__notebook" data-refused={state.bounced}>
        <div ref={page} className="hunt__page">
          <ol className="clues">
            {spec.clues.map((clue) => {
              const used = !left.includes(clue);
              return (
                <li key={clue.id}>
                  <button
                    type="button"
                    className="clue"
                    disabled={clue.kind === 'side'}
                    data-used={used}
                    data-current={clue.id === state.clue}
                    data-point={
                      clue.id === state.pointAt || (help >= 1 && clue === nextClue) || undefined
                    }
                    onClick={() => act({ kind: 'pick-clue', clue: clue.id })}
                  >
                    {clue.say}
                  </button>
                </li>
              );
            })}
          </ol>
          {help >= 2 && current && current.kind !== 'side' && (
            <p className="hunt__note">{current.structure}</p>
          )}
          {help >= 3 && (
            <ol className="hunt__example">
              {spec.example.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          )}
          {state.hintLevel > 0 && (
            <p className="hunt__note">{state.hintLevel === 1 ? spec.hint.step : spec.hint.move}</p>
          )}
          {state.mode === 'working' && <p className="hunt__note">{huntUiText.working}</p>}
          {state.marked !== null && <p className="hunt__note">{huntUiText.marked}</p>}
          {state.bounced && <p className="hunt__note">{huntUiText.bounce}</p>}
          <ol className="hunt__ink">
            {state.lines.map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines are only ever added, and he may write one twice
              <li key={index}>
                <button
                  type="button"
                  className="his-line"
                  data-struck={line.struck}
                  data-marked={state.marked === index}
                  onClick={() => act({ kind: 'strike', line: index })}
                >
                  {formatStatementLine(line.tokens)
                    .map((segment) => segment.text)
                    .join('')}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <Draft
          key={state.bounced ? `wiggle-${state.shakes}` : 'still'}
          start={start}
          draft={state.draft}
          wiggle={state.bounced}
        />
        <StatementPad signs={spec.keys} onKey={onKey} />
      </section>
    </main>
  );
}
