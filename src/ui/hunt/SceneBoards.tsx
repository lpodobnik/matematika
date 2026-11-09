import { useEffect, useRef } from 'react';
import { tuning } from '@/config/tuning';
import { huntUiText, sceneGuideText } from '@/content/text/hunt-leads';
import type { AloneSpec, AloneState } from '@/hunt/alone';
import type { LeadAction } from '@/hunt/lead';
import type { SceneGuide, SceneKind } from '@/hunt/scene';
import {
  lineStartOf,
  nextSafeMove,
  patrolAt,
  type SneakSpec,
  type SneakState,
  standing,
  stopValue,
} from '@/hunt/sneak';
import type { UnmaskSpec, UnmaskState } from '@/hunt/unmask';
import { formatNumber, formatStatementLine } from '@/math/format';
import { readLine, type SLineToken, type SToken } from '@/math/statement-tokens';
import { HintControl } from '@/ui/common/HintButton';
import { LittleOneArt } from '@/ui/hunt/LittleOne';
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

function DraftLine({
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

/** Help rises for nothing, with a minute of nothing done. The rules don't keep time. */
function useIdle(act: Act, key: string, done: boolean) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer starts over with each move
  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => act({ kind: 'idle' }), tuning.hunt.idleMs);
    return () => window.clearTimeout(timer);
  }, [key, done]);
}

/** What the first time's guide says, for whichever kind of scene. */
export function GuideCard({
  kind,
  guide,
  onRead,
}: {
  kind: SceneKind;
  guide: SceneGuide;
  onRead(): void;
}) {
  const lines = sceneGuideText[kind] as Readonly<Record<string, string>>;
  return (
    <div className="guide-card">
      <p>{lines[guide.say]}</p>
      {guide.allows === 'read' && <Dalje onNext={onRead} />}
    </div>
  );
}

/** Sneak: a line of stops, the patrols on it, and the moves. */
export function SneakBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: SneakSpec;
  state: SneakState;
  guide: SceneGuide | null;
  act: Act;
}) {
  const board = spec.boards[state.board];
  const onKey = (key: HuntKey) => act(keyAction(key));
  useHuntKeys(onKey);
  useIdle(act, `${state.tick},${state.at},${state.draft.length},${state.help}`, state.opened);
  const row = useRef<HTMLOListElement>(null);
  const at = board ? standing(board, state) : 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: it follows him along the line
  useEffect(() => {
    const here = row.current?.querySelector('[data-here="true"]');
    here?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [at]);
  if (!board) return null;
  const line = board.line;
  const ask = line?.asks[state.ask % line.asks.length];
  const safe = state.help >= 1 ? nextSafeMove(board, state) : null;
  const writing = line !== null && state.lit === null && !state.opened;
  const stops = Array.from({ length: board.stops }, (_, i) => i);
  const ahead = (patrol: (typeof board.patrols)[number]) =>
    [1, 2, 3].map((steps) => patrolAt(patrol, state.tick + steps));
  return (
    <main className="hunt">
      <section className="hunt__scene sneak">
        <HintControl
          works={!state.opened}
          shown={state.hintLevel > 0}
          onPress={() => act({ kind: 'hint' })}
        />
        <p className="knock__intro sneak__intro">{spec.intro}</p>
        <ol ref={row} className="stops">
          {stops.map((stop) => {
            const patrols = board.patrols.filter((patrol) => patrolAt(patrol, state.tick) === stop);
            const drawn =
              state.help >= 2 && board.patrols.some((patrol) => ahead(patrol).includes(stop));
            return (
              <li
                key={stop}
                className="stop"
                data-stop={stop}
                data-lit={state.lit === stop || board.exit === stop}
                data-here={at === stop}
                data-drawn={drawn}
              >
                <span className="stop__label">
                  {line?.labelled.includes(stop)
                    ? formatNumber(stopValue(line, stop))
                    : ask?.at === stop
                      ? ask.label
                      : ''}
                </span>
                <span className="stop__tick" />
                <span className="stop__who">
                  {at === stop && (
                    <span className="stop__me" role="img" aria-label={huntUiText.me} />
                  )}
                  {patrols.length > 0 && (
                    <span className="stop__patrol" role="img" aria-label={huntUiText.patrol} />
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="sneak__moves">
          <button
            type="button"
            className="object__button"
            data-move="back"
            data-help={safe === -1 || undefined}
            onClick={() => act({ kind: 'step', by: -1 })}
          >
            ←
          </button>
          <button
            type="button"
            className="object__button sneak__wait"
            data-move="wait"
            data-help={safe === 0 || undefined}
            onClick={() => act({ kind: 'step', by: 0 })}
          >
            {huntUiText.wait}
          </button>
          <button
            type="button"
            className="object__button"
            data-move="on"
            data-help={safe === 1 || undefined}
            onClick={() => act({ kind: 'step', by: 1 })}
          >
            →
          </button>
        </div>
        {state.notice && (
          <div className="knock__bubble" role="status">
            <p>{state.notice}</p>
            <Dalje onNext={() => act({ kind: 'dismiss' })} label={huntUiText.ok} />
          </div>
        )}
        {state.opened && (
          <div className="knock__bubble" role="status">
            <p>{spec.opened}</p>
            <Dalje onNext={() => act({ kind: 'next' })} />
          </div>
        )}
        {guide && <GuideCard kind="sneak" guide={guide} onRead={() => act({ kind: 'next' })} />}
      </section>
      <section className="hunt__notebook" data-refused={state.shakes > 0 && writing}>
        <div className="hunt__page">
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
        {writing && (
          <>
            <DraftLine
              key={`line-${state.shakes}`}
              start={lineStartOf(board, state)}
              draft={state.draft}
              wiggle={state.shakes > 0}
            />
            <StatementPad signs={[]} onKey={onKey} />
          </>
        )}
      </section>
    </main>
  );
}

/** Unmask: their working, side by side, on the cards he has asked. */
export function UnmaskBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: UnmaskSpec;
  state: UnmaskState;
  guide: SceneGuide | null;
  act: Act;
}) {
  const onKey = (key: HuntKey) => act(keyAction(key));
  useHuntKeys(onKey);
  useIdle(act, `${state.asked.length},${state.accused.length},${state.help}`, state.opened);
  const asked = spec.cards.filter((card) => state.asked.includes(card.id));
  const nextCard = spec.cards.find((card) => !state.asked.includes(card.id));
  return (
    <main className="hunt">
      <section className="hunt__scene unmask">
        <HintControl
          works={!state.opened}
          shown={state.hintLevel > 0}
          onPress={() => act({ kind: 'hint' })}
        />
        <p className="knock__intro sneak__intro">{spec.intro}</p>
        <div className="suspects">
          {spec.suspects.map((suspect) => (
            <div key={suspect.id} className="suspect" data-suspect={suspect.id}>
              <button
                type="button"
                className="suspect__name"
                data-accused={state.accused.includes(suspect.id)}
                disabled={state.phase !== 'ask'}
                onClick={() => act({ kind: 'accuse', suspect: suspect.id })}
              >
                {suspect.name}
              </button>
              <ol className="suspect__working">
                {asked.map((card) => (
                  <li key={card.id}>
                    {formatStatementLine(readLine(card.answers[suspect.id] ?? '') ?? [])
                      .map((segment) => segment.text)
                      .join('')}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        {state.shown && (
          <div className="knock__bubble" role="status">
            <p>{state.shown}</p>
            <Dalje onNext={() => act({ kind: 'dismiss' })} label={huntUiText.ok} />
          </div>
        )}
        {state.opened && (
          <div className="knock__bubble" role="status">
            <p>{spec.opened}</p>
            <Dalje onNext={() => act({ kind: 'next' })} />
          </div>
        )}
        {guide && <GuideCard kind="unmask" guide={guide} onRead={() => act({ kind: 'next' })} />}
      </section>
      <section className="hunt__notebook" data-refused={state.bounced}>
        <div className="hunt__page">
          {state.phase === 'ask' ? (
            <ol className="clues">
              {spec.cards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    className="clue"
                    data-card={card.id}
                    data-used={state.asked.includes(card.id)}
                    data-point={(state.help >= 1 && card === nextCard) || undefined}
                    disabled={state.asked.includes(card.id)}
                    onClick={() => act({ kind: 'ask', card: card.id })}
                  >
                    {card.ask}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <p className="thread__find">{spec.reveal}</p>
              <p className="hunt__task">{spec.fix.say}</p>
            </>
          )}
          {state.tooSoon && <p className="hunt__note">{huntUiText.askMore(spec.required)}</p>}
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
        {state.phase === 'write' && (
          <>
            <DraftLine
              key={state.bounced || state.refused ? 'wiggle' : 'still'}
              start={readLine(spec.fix.start) ?? []}
              draft={state.draft}
              wiggle={state.bounced || Boolean(state.refused)}
            />
            <StatementPad signs={spec.fix.keys} onKey={onKey} />
          </>
        )}
      </section>
    </main>
  );
}

/** What a dead end's plate shows: the number his route means so far, with the places left open. */
export function plateText(taken: string, places: number): string {
  return taken.padEnd(places, '_').replace(/\B(?=(.{3})+$)/g, ' ');
}

/** Little one alone: a small dark board, by its built-in lamp. */
export function AloneBoardView({
  spec,
  state,
  guide,
  act,
}: {
  spec: AloneSpec;
  state: AloneState;
  guide: SceneGuide | null;
  act: Act;
}) {
  useIdle(act, `${state.taken.length},${state.deadEnds},${state.help}`, state.opened);
  const junction = spec.junctions[state.taken.length];
  const places = spec.junctions.length;
  return (
    <main className="hunt hunt--dark">
      <section className="hunt__scene alone">
        <HintControl
          works={!state.opened}
          shown={state.hintLevel > 0}
          onPress={() => act({ kind: 'hint' })}
        />
        <p className="alone__route">{spec.route}</p>
        <ol className="alone__trail">
          {spec.junctions.map((step, i) => (
            <li key={step.sign} className="alone__step" data-here={i === state.taken.length}>
              <span className="alone__sign">{step.sign}</span>
              <span className="alone__digit">{state.taken[i] ?? ''}</span>
            </li>
          ))}
        </ol>
        <div className="alone__little" key={state.deadEnds} data-shake={state.deadEnds > 0}>
          <LittleOneArt />
        </div>
        {junction && !state.opened && (
          <div className="alone__pipes" data-help={state.help >= 1 || undefined}>
            {junction.pipes.map((pipe) => (
              <button
                key={pipe}
                type="button"
                className="alone__pipe"
                data-pipe={pipe}
                onClick={() => act({ kind: 'pipe', pipe })}
              >
                {pipe}
              </button>
            ))}
          </div>
        )}
        {state.help >= 2 && junction && !state.opened && (
          <p className="hunt__note alone__help">{huntUiText.aloneHelp(junction.sign)}</p>
        )}
        {state.hintLevel > 0 && (
          <p className="hunt__note alone__help">
            {state.hintLevel === 1 ? spec.hint.step : spec.hint.move}
          </p>
        )}
        {state.help >= 3 && (
          <ol className="hunt__example alone__help">
            {spec.example.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
        )}
        {state.plate && (
          <div className="knock__bubble" role="status">
            <p>{spec.deadEnd}</p>
            <p className="alone__plate">{plateText(state.plate, places)}</p>
            <Dalje onNext={() => act({ kind: 'dismiss' })} label={huntUiText.ok} />
          </div>
        )}
        {state.opened && (
          <div className="knock__bubble" role="status">
            <p>{spec.opened}</p>
            <Dalje onNext={() => act({ kind: 'next' })} />
          </div>
        )}
        {guide && <GuideCard kind="alone" guide={guide} onRead={() => act({ kind: 'next' })} />}
      </section>
    </main>
  );
}
