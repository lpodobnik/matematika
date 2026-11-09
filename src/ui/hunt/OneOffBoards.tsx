import { type ReactNode, useEffect } from 'react';
import { tuning } from '@/config/tuning';
import { huntUiText } from '@/content/text/hunt-leads';
import type { LeadAction } from '@/hunt/lead';
import {
  type CartsSpec,
  type CartsState,
  cartsGround,
  type LevelSpec,
  type LevelState,
  type LocksSpec,
  type LocksState,
  type LoopSpec,
  type LoopState,
  levelTilt,
  loopStart,
  type RoundLine,
  stripNumbers,
  type WindowsSpec,
  type WindowsState,
  windowNumber,
} from '@/hunt/one-offs';
import type { GuardSpec, GuardState } from '@/hunt/rule-guard';
import type { SceneGuide, SceneKind } from '@/hunt/scene';
import { formatNumber, formatStatementLine } from '@/math/format';
import { readLine, type SLineToken, type SToken } from '@/math/statement-tokens';
import { HintControl } from '@/ui/common/HintButton';
import { GuideCard } from '@/ui/hunt/SceneBoards';
import { type HuntKey, StatementPad } from '@/ui/hunt/StatementPad';
import { useHuntKeys } from '@/ui/hunt/use-hunt-keys';
import { LineView } from '@/ui/notebook/LineView';

type Act = (action: LeadAction) => void;

const keyAction = (key: HuntKey): LeadAction =>
  key === 'delete'
    ? { kind: 'delete' }
    : key === 'enter'
      ? { kind: 'enter' }
      : { kind: 'type', token: key };

function Dalje({ onNext, label = huntUiText.next }: { onNext(): void; label?: string }) {
  return (
    <button type="button" className="hunt__next" onClick={onNext}>
      {label}
    </button>
  );
}

function useIdle(act: Act, key: string, done: boolean) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer starts over with each move
  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => act({ kind: 'idle' }), tuning.hunt.idleMs);
    return () => window.clearTimeout(timer);
  }, [key, done]);
}

/** What every one-off shares: the hint, the notes, the example, and the door opening. */
interface Shell {
  state: {
    hintLevel: number;
    help: number;
    opened: boolean;
    bounced?: boolean;
    refused?: boolean | 'off';
    draft: readonly SToken[];
  };
  spec: {
    intro: string;
    opened: string;
    example: readonly string[];
    hint: { step: string; move: string };
  };
  kind: SceneKind;
  guide: SceneGuide | null;
  notice: string | null;
  act: Act;
  /** The line he's writing now, if he is. */
  line: RoundLine | null;
  say?: string;
  scene: ReactNode;
  className: string;
}

function OneOffShell({
  state,
  spec,
  kind,
  guide,
  notice,
  act,
  line,
  say,
  scene,
  className,
}: Shell) {
  const onKey = (key: HuntKey) => act(keyAction(key));
  useHuntKeys(onKey);
  const start: readonly SLineToken[] = line ? (readLine(line.start) ?? []) : [];
  const segments = formatStatementLine(
    start.includes('☐') ? start : [...start, ...state.draft],
    start.includes('☐') ? state.draft : [],
  );
  const wiggle = state.bounced === true || Boolean(state.refused);
  return (
    <main className="hunt">
      <section className={`hunt__scene ${className}`}>
        <HintControl
          works={!state.opened}
          shown={state.hintLevel > 0}
          onPress={() => act({ kind: 'hint' })}
        />
        <p className="knock__intro sneak__intro">{spec.intro}</p>
        {scene}
        {notice && (
          <div className="knock__bubble" role="status">
            <p>{notice}</p>
            <Dalje onNext={() => act({ kind: 'dismiss' })} label={huntUiText.ok} />
          </div>
        )}
        {state.opened && (
          <div className="knock__bubble" role="status">
            <p>{spec.opened}</p>
            <Dalje onNext={() => act({ kind: 'next' })} />
          </div>
        )}
        {guide && <GuideCard kind={kind} guide={guide} onRead={() => act({ kind: 'next' })} />}
      </section>
      <section className="hunt__notebook" data-refused={wiggle}>
        <div className="hunt__page">
          {say && <p className="hunt__task">{say}</p>}
          {state.bounced && <p className="hunt__note">{huntUiText.bounce}</p>}
          {state.refused && (
            <p className="hunt__note">
              {state.refused === 'off' ? huntUiText.offTask : huntUiText.refuse}
            </p>
          )}
          {state.hintLevel > 0 && (
            <p className="hunt__note">{state.hintLevel === 1 ? spec.hint.step : spec.hint.move}</p>
          )}
          {state.help >= 3 && (
            <ol className="hunt__example">
              {spec.example.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          )}
        </div>
        {line && !state.opened && (
          <>
            <ol className="hunt__draft" key={wiggle ? 'wiggle' : 'still'}>
              <LineView segments={segments} kind="draft" wiggle={wiggle} caret />
            </ol>
            <StatementPad signs={line.keys} onKey={onKey} />
          </>
        )}
      </section>
    </main>
  );
}

/** A rule guard: its tape, the tiles, and the line that breaks it. */
export function GuardBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: GuardSpec;
  state: GuardState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(act, `${state.picked.length},${state.draft.length},${state.help}`, state.opened);
  return (
    <OneOffShell
      state={state}
      spec={{ ...spec, opened: spec.jammed }}
      kind="guard"
      guide={guide}
      notice={state.said}
      act={act}
      line={state.phase === 'write' ? spec.write : null}
      say={state.phase === 'write' ? spec.write.say : undefined}
      className="guard"
      scene={
        <>
          <p className="guard__tape" data-jammed={state.opened}>
            {spec.rule}
          </p>
          <div className="guard__tiles">
            {spec.tiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                className="guard__tile"
                data-tile={tile.id}
                data-picked={state.picked.includes(tile.id)}
                disabled={state.phase !== 'pick' || state.picked.includes(tile.id)}
                onClick={() => act({ kind: 'tile', tile: tile.id })}
              >
                {tile.face}
              </button>
            ))}
          </div>
        </>
      }
    />
  );
}

/** Load the carts: bundles from the ground onto the carts. */
export function CartsBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: CartsSpec;
  state: CartsState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(
    act,
    `${state.loads.join()},${state.round},${state.draft.length},${state.help}`,
    state.opened,
  );
  const round = spec.rounds[state.round];
  if (!round) return null;
  const ground = cartsGround(round, state.loads);
  const line = state.phase === 'write' && round.kind !== 'no-carts' ? round.line : null;
  return (
    <OneOffShell
      state={state}
      spec={spec}
      kind="carts"
      guide={guide}
      notice={state.notice}
      act={act}
      line={line}
      say={line ? line.say : round.say}
      className="carts"
      scene={
        <>
          <p className="carts__ground" data-ground={ground}>
            {huntUiText.ground(ground)}
          </p>
          <ol className="carts__row" key={state.round}>
            {state.loads.map((load, cart) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: carts only get added at the end
              <li key={cart} className="cart" data-cart={cart}>
                <button
                  type="button"
                  className="cart__load"
                  onClick={() => act({ kind: 'cart', cart })}
                >
                  {formatNumber(load)}
                </button>
                <button
                  type="button"
                  className="object__button cart__off"
                  aria-label={huntUiText.remove}
                  onClick={() => act({ kind: 'uncart', cart })}
                >
                  −
                </button>
              </li>
            ))}
            {state.loads.length === 0 && <li className="cart cart--none">{huntUiText.noCarts}</li>}
          </ol>
          {state.phase === 'load' && !state.opened && (
            <button
              type="button"
              className="hunt__next carts__go"
              onClick={() => act({ kind: 'go' })}
            >
              {huntUiText.go}
            </button>
          )}
        </>
      }
    />
  );
}

/** Level the load: a crate from a tall stack to a short one, until the bar balances. */
export function LevelBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: LevelSpec;
  state: LevelState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(act, `${state.stacks.join()},${state.draft.length},${state.help}`, state.opened);
  const round = spec.rounds[state.round];
  if (!round) return null;
  // Balanced isn't level: it stays a little tilted until all the stacks match.
  const even = new Set(state.stacks).size === 1;
  const tilt = levelTilt(state.stacks) || (even ? 0 : 2);
  const line = state.phase === 'write' ? round.line : null;
  return (
    <OneOffShell
      state={state}
      spec={spec}
      kind="level"
      guide={guide}
      notice={state.notice}
      act={act}
      line={line}
      say={line?.say}
      className="level"
      scene={
        <div
          className="level__rig"
          style={{ transform: `rotate(${Math.max(-8, Math.min(8, tilt))}deg)` }}
        >
          <div className="level__stacks">
            {state.stacks.map((count, stack) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: a bar's stacks stay where they are
                key={stack}
                type="button"
                className="level__stack"
                data-stack={stack}
                data-held={state.held === stack}
                onClick={() => act({ kind: 'stack', stack })}
              >
                <span className="level__crates" style={{ height: `${count * 6}%` }} />
                <span className="level__count">{count}</span>
              </button>
            ))}
          </div>
          <div className="level__bar" />
        </div>
      }
    />
  );
}

/** Bracket locks: tap where a bracket opens, then where it closes. */
export function LocksBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: LocksSpec;
  state: LocksState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(act, `${state.lock},${state.from},${state.help}`, state.opened);
  const lock = spec.locks[state.lock];
  if (!lock) return null;
  const parts = lock.strip.split(' ');
  const count = stripNumbers(lock.strip).length;
  let at = -1;
  return (
    <OneOffShell
      state={state}
      spec={spec}
      kind="locks"
      guide={guide}
      notice={state.notice}
      act={act}
      line={null}
      className="locks"
      scene={
        <>
          <p className="locks__target">
            {huntUiText.lockTarget} {formatNumber(lock.target)}
          </p>
          <p className="locks__strip" data-count={count}>
            {parts.map((part, i) => {
              if (!/^\d+$/.test(part)) {
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a strip's parts never reorder
                  <span key={i} className="locks__sign">
                    {part}
                  </span>
                );
              }
              at += 1;
              const number = at;
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: a strip's parts never reorder
                  key={i}
                  type="button"
                  className="locks__number"
                  data-number={number}
                  data-from={state.from === number}
                  onClick={() => act({ kind: 'number', number })}
                >
                  {state.from === number ? '(' : ''}
                  {part}
                </button>
              );
            })}
          </p>
          {state.tried && <p className="locks__tried">{state.tried}</p>}
        </>
      }
    />
  );
}

/** The facade: it throws the hook at a window. Windows are numbered along the rows. */
export function WindowsBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: WindowsSpec;
  state: WindowsState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(act, `${state.round},${state.slips},${state.help}`, state.opened);
  const round = spec.rounds[state.round];
  if (!round) return null;
  const rows = state.turned ? round.columns : round.rows;
  const columns = state.turned ? round.rows : round.columns;
  const numbers = Array.from({ length: rows }, (_, row) => row).flatMap((row) =>
    Array.from({ length: columns }, (_, col) => ({
      row,
      col,
      number: windowNumber(round, state.turned, row, col),
    })),
  );
  return (
    <OneOffShell
      state={state}
      spec={spec}
      kind="windows"
      guide={guide}
      notice={state.notice}
      act={act}
      line={null}
      say={round.say}
      className="windows"
      scene={
        <>
          <button
            type="button"
            className="knock__cross windows__turn"
            onClick={() => act({ kind: 'turn' })}
          >
            {huntUiText.turn}
          </button>
          <div className="facade" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {numbers.map(({ number }) => (
              <button
                key={number}
                type="button"
                className="facade__window"
                data-window={number}
                data-shown={state.shown === number}
                onClick={() => act({ kind: 'window', number })}
              >
                {state.shown === number ? number : ''}
              </button>
            ))}
          </div>
        </>
      }
    />
  );
}

/** A loop of lamps, from 0, and a patrol that sleeps where the bell finds it. */
export function LoopBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: LoopSpec;
  state: LoopState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(act, `${state.board},${state.bell},${state.draft.length},${state.help}`, state.opened);
  const board = spec.boards[state.board];
  if (!board) return null;
  const lamps = Array.from({ length: board.lamps }, (_, lamp) => lamp);
  const line: RoundLine = {
    say: huntUiText.loopSay,
    start: loopStart(board, state),
    accepts: [],
    keys: spec.keys,
  };
  return (
    <OneOffShell
      state={state}
      spec={spec}
      kind="loop"
      guide={guide}
      notice={state.notice}
      act={act}
      line={state.notice ? null : line}
      say={huntUiText.loopSay}
      className="loop"
      scene={
        <ol className="loop__ring" style={{ '--lamps': board.lamps } as React.CSSProperties}>
          {lamps.map((lamp) => (
            <li
              key={lamp}
              className="loop__lamp"
              data-lamp={lamp}
              data-pinned={state.pinned === lamp}
              data-stopped={state.stopped === lamp}
              style={{ '--at': lamp } as React.CSSProperties}
            >
              {lamp}
            </li>
          ))}
        </ol>
      }
    />
  );
}
