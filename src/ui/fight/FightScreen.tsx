import '@/ui/fight/fight.css';
import { type ReactNode, useEffect, useState } from 'react';
import { lairs } from '@/content/lairs';
import { hr } from '@/content/text/hr';
import { blowRange, blowsAffordable, placedValues, SLOTS } from '@/fight/fight';
import { type GuideStep, guideDice } from '@/fight/guide';
import type { FightAction, FightState, Slot } from '@/fight/types';
import { formatNumber } from '@/math/format';
import type { FightEnd } from '@/store/fight-end';
import { useGame } from '@/store/store';
import { PartsCounterView, partsFlightMs } from '@/ui/common/PartsCounter';
import { FightEndPanel, LeaveConfirm, StrikeBanner } from '@/ui/fight/FightEnd';
import { FightGuide, guideMark } from '@/ui/fight/FightGuide';
import { Automaton, DieFace, PunchedTape } from '@/ui/fight/fight-art';
import { StrikeGuess } from '@/ui/fight/StrikeGuess';
import { type Tap, tapDie, tapLeave, tapSlot } from '@/ui/fight/taps';

/** As a · x + b reads, left to right: the blade, the reach that sets x, the charge. */
const SHOWN_SLOTS: readonly Slot[] = ['blade', 'reach', 'charge'];

import { PageReturned } from '@/ui/pages/TornPages';

/**
 * The fight screen (story 3.1; GDD, Automaton fights): the automaton and its armour on the
 * left, his bench on the right. He rolls, taps a die and then a slot to place it as blade
 * `a`, charge `b` or reach, and sets his blows on the dial, seeing `a · x + b` with his
 * numbers but never the total. HTML and SVG like the map, so every control is a real
 * button at least 48 CSS px. Every stat and slot carries a one-line caption, and the first
 * fight is guided by Nikola (fight/guide.ts).
 */
export function FightScreen() {
  const fight = useGame((s) => s.fight);
  const end = useGame((s) => s.ui.fightEnd);
  const guide = useGame((s) => s.ui.fightGuide);
  const parts = useGame((s) => s.save.economy.parts);
  const piles = useGame((s) => s.save.economy.piles);
  const beatenOne = useGame((s) => Object.keys(s.save.economy.lairs).length > 0);
  const dispatch = useGame((s) => s.dispatch);
  if (!fight) return null;
  return (
    <FightBoard
      fight={fight}
      end={end}
      guide={guide}
      guess={beatenOne}
      pile={fight.strikes === 0 ? (piles[fight.lairId] ?? 0) : 0}
      onAction={dispatch}
    >
      <FightParts parts={parts} end={end} />
    </FightBoard>
  );
}

/**
 * The parts counter on the fight screen (story 3.3). A win's parts rise from the end and
 * land on the counter, which then ticks up; that is the only reward signal (NFR13).
 */
function FightParts({ parts, end }: { parts: number; end: FightEnd | null }) {
  const amount = end?.won ? end.reward + end.recovered : 0;
  // The end whose parts have landed. Until this fight's end lands, the counter shows his
  // parts without them, so it ticks once, when they arrive.
  const [landedFor, setLandedFor] = useState<FightEnd | null>(end);
  useEffect(() => {
    if (!end || end === landedFor) return;
    const timer = setTimeout(() => setLandedFor(end), partsFlightMs);
    return () => clearTimeout(timer);
  }, [end, landedFor]);
  const flying = amount > 0 && end !== landedFor;
  return (
    <PartsCounterView
      shown={flying ? parts - amount : parts}
      visible={parts > 0 || amount > 0}
      flight={null}
    />
  );
}

type BoardAction = FightAction | { type: 'fight/close' } | { type: 'fight/guide-next' };

interface BoardProps {
  fight: FightState;
  /** Parts he left at this lair by losing before, waiting to be won back (story 3.3). */
  pile?: number;
  /** The parts counter, which sits in the fight's top-right corner. */
  children?: ReactNode;
  /** How the fight ended, once it has (store/fight-end.ts). */
  end?: FightEnd | null;
  /** The guided first fight's step, or null with no guide (fight/guide.ts). */
  guide?: GuideStep | null;
  /** He must work out how big a strike will be before it lands (once he has beaten one). */
  guess?: boolean;
  onAction(action: BoardAction): void;
}

/** The fight from props only. */
export function FightBoard({
  fight,
  end = null,
  guide = null,
  guess = false,
  pile = 0,
  onAction,
  children,
}: BoardProps) {
  const lair = lairs[fight.lairId];
  // Leaving after a strike loses the fight, so he is asked first (story 3.2).
  const [askLeave, setAskLeave] = useState(false);
  const [guessing, setGuessing] = useState(false);
  // A torn page a win returned shows over the end until he closes it (story 3.4).
  const [pageRead, setPageRead] = useState<FightEnd | null>(null);
  // ...after the win's parts have landed on the counter, the only reward signal (NFR13).
  const [pageDue, setPageDue] = useState<FightEnd | null>(null);
  useEffect(() => {
    if (!end?.page) return;
    const timer = setTimeout(() => setPageDue(end), pageDelayMs);
    return () => clearTimeout(timer);
  }, [end]);
  // The question goes with the moment it was asked in: a new round or the end closes it.
  const moment = `${fight.round}:${fight.phase}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new round or phase closes it
  useEffect(() => {
    setAskLeave(false);
    setGuessing(false);
  }, [moment]);
  // The die he has picked up, waiting for a slot. A new roll puts it down.
  const [heldDie, setHeld] = useState<number | null>(null);
  const rollKey = `${fight.round}:${fight.dice.join(',')}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new roll puts the held die down
  useEffect(() => setHeld(null), [rollKey]);

  const placing = fight.phase === 'place' || fight.phase === 'set';
  // A die is held only while placing: a strike or a new roll puts it down at once.
  const held = placing ? heldDie : null;
  const over = fight.phase === 'won' || fight.phase === 'lost';
  // Leaving after a strike ends the fight without one: its banner is the last round's.
  const leftEarly = fight.outcome?.won === false && fight.outcome.reason === 'left';
  const leave = () => {
    if (tapLeave(fight) === 'ask') setAskLeave(true);
    else onAction({ type: 'fight/leave' });
  };
  const slotOf = (die: number): Slot | null => SLOTS.find((s) => fight.slots[s] === die) ?? null;

  const apply = ({ held: next, action }: Tap) => {
    setHeld(next);
    if (action) onAction(action);
  };
  const onDie = (die: number) => apply(tapDie(held, die));
  const onSlot = (slot: Slot) => apply(tapSlot(held, slot, fight.slots));
  // While the guide shows, only what its step asks for can be tapped (fight/guide.ts).
  const guideLets = (step: GuideStep) => guide === null || guide === step;
  const guidedDice = guide === null ? null : guideDice(guide, fight);

  return (
    <main
      className="fight"
      aria-label={hr.fight.title(lair.armour)}
      data-guide={guide ?? undefined}
    >
      <section className="fight__foe">
        {!over && (
          <button type="button" className="fight__leave" onClick={leave}>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M20 6 L10 16 L20 26" />
            </svg>
            {hr.fight.leave}
          </button>
        )}
        {fight.round > 0 && <p className="fight__round">{hr.fight.round(fight.round)}</p>}
        <Automaton
          armour={lair.armour}
          className={
            fight.phase === 'won' ? 'fight__automaton fight__automaton--down' : 'fight__automaton'
          }
        />
        {fight.phase === 'won' && <PunchedTape className="fight__tape" />}
        <Armour armour={fight.armour} full={lair.armour} guide={guide} />
        {pile > 0 && <p className="fight__pile">{hr.fight.pileHere(pile)}</p>}
        {guide && <FightGuide step={guide} onNext={() => onAction({ type: 'fight/guide-next' })} />}
      </section>
      <section className="fight__bench">
        <Gauges key={`hull-${fight.hull}`} fight={fight} guide={guide} />
        {fight.lastStrike && (fight.phase === 'strike' || (over && !leftEarly)) && (
          <StrikeBanner
            key={fight.strikes}
            strike={fight.lastStrike}
            mark={guideMark(guide, 'banner')}
          />
        )}
        {over ? (
          <FightEndPanel
            fight={fight}
            end={end}
            locked={guide !== null}
            onClose={() => onAction({ type: 'fight/close' })}
          />
        ) : (
          bench()
        )}
      </section>
      {children}
      {over && end?.page && showsPage(end, pageDue, pageRead) && (
        <PageReturned page={end.page} onClose={() => setPageRead(end)} />
      )}
      {guessing && fight.phase === 'set' && (
        <StrikeGuess
          blade={placedValues(fight).blade ?? 0}
          blows={fight.blows}
          charge={placedValues(fight).charge ?? 0}
          armour={fight.armour}
          onBack={() => setGuessing(false)}
          onStrike={() => onAction({ type: 'fight/strike' })}
        />
      )}
      {askLeave && !over && (
        <LeaveConfirm
          onStay={() => setAskLeave(false)}
          onLeave={() => {
            setAskLeave(false);
            onAction({ type: 'fight/leave' });
          }}
        />
      )}
    </main>
  );

  /** The dice, the slots, a · x + b, the blows dial and the strike, while the fight is on. */
  function bench() {
    return (
      <>
        <div className="fight__dice">
          {fight.phase === 'roll' || fight.phase === 'strike' ? (
            <button
              type="button"
              className="fight__roll"
              disabled={!guideLets('roll')}
              {...guideMark(guide, 'roll')}
              onClick={() => onAction({ type: 'fight/roll' })}
            >
              {hr.fight.roll}
            </button>
          ) : (
            fight.dice.map((value, die) => {
              const slot = slotOf(die);
              // The guide lets him pick up only the die it asks for, and lights it.
              const guided = guidedDice === null || guidedDice.includes(die);
              const mark =
                guidedDice === null || guidedDice.length === 0
                  ? guideMark(guide, 'dice')
                  : guided
                    ? { 'data-focus': true as const }
                    : { 'data-dim': true as const };
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: a die is its place in the roll
                  key={die}
                  type="button"
                  className="fight__die"
                  data-die={die}
                  data-held={held === die || undefined}
                  data-placed={slot !== null || undefined}
                  aria-pressed={held === die}
                  disabled={!placing || !guided}
                  {...mark}
                  aria-label={
                    slot ? hr.fight.dieIn(value, hr.fight.slots[slot]) : hr.fight.die(value)
                  }
                  onClick={() => onDie(die)}
                >
                  <DieFace value={value} />
                </button>
              );
            })
          )}
        </div>
        {placing && fight.slots.blade === null && held === null && guide === null && (
          <p className="fight__tag">
            {fight.dice.length > 3 ? hr.fight.placeTagFour : hr.fight.placeTag}
          </p>
        )}
        <div className="fight__slots">
          {SHOWN_SLOTS.map((slot) => {
            const value = placedValues(fight)[slot];
            return (
              <button
                key={slot}
                type="button"
                className="fight__slot"
                data-slot={slot}
                data-filled={value !== null || undefined}
                data-ready={held !== null || undefined}
                data-off={!placing || undefined}
                disabled={
                  !placing ||
                  (held === null && value === null) ||
                  (guide !== null && (guide !== slot || held === null))
                }
                {...guideMark(guide, slot)}
                aria-label={`${hr.fight.slots[slot]}: ${value === null ? hr.fight.emptySlot : value}`}
                onClick={() => onSlot(slot)}
              >
                <span className="fight__slot-name">{hr.fight.slots[slot]}</span>
                <span className="fight__slot-die">
                  {value === null ? (
                    <span className="fight__slot-empty" />
                  ) : (
                    <DieFace value={value} />
                  )}
                </span>
                <span className="fight__slot-hint">{hr.fight.slotHints[slot]}</span>
              </button>
            );
          })}
        </div>
        {fight.phase !== 'strike' && (
          <>
            <Formula fight={fight} guide={guide} />
            <Blows
              fight={fight}
              guide={guide}
              onBlows={(x) => onAction({ type: 'fight/blows', x })}
            />
            <button
              type="button"
              className="fight__strike"
              disabled={fight.phase !== 'set' || !guideLets('strike')}
              {...guideMark(guide, 'strike')}
              onClick={() => {
                setHeld(null);
                if (guess) setGuessing(true);
                else onAction({ type: 'fight/strike' });
              }}
            >
              {hr.fight.strike}
            </button>
          </>
        )}
      </>
    );
  }
}

/** How long a returned page waits: the win's parts land first (`partsFlightMs`), then a beat. */
export const pageDelayMs = partsFlightMs + 400;

/** Whether the torn page a win returned shows now: once it is due, until he has read it. */
export function showsPage(
  end: FightEnd | null,
  due: FightEnd | null,
  read: FightEnd | null,
): boolean {
  return end?.page != null && due === end && read !== end;
}

/** The automaton's armour: what is left, as a number and a bar, and what it means. */
function Armour({
  armour,
  full,
  guide,
}: {
  armour: number;
  full: number;
  guide: GuideStep | null;
}) {
  return (
    <div className="fight__armour" role="status" {...guideMark(guide, 'armour')}>
      <span className="fight__armour-label">{hr.fight.armour}</span>
      <span className="fight__armour-number">{formatNumber(armour)}</span>
      <span className="fight__armour-bar" aria-hidden="true">
        <span style={{ width: `${(armour / full) * 100}%` }} />
      </span>
      <span className="fight__caption fight__armour-caption">{hr.fight.captions.armour}</span>
    </div>
  );
}

/** A stat's or control's name, with its one-line caption under it. */
function Named({ name, caption }: { name: ReactNode; caption: string }) {
  return (
    <span className="fight__named">
      <span className="fight__gauge-label">{name}</span>
      <span className="fight__caption">{caption}</span>
    </span>
  );
}

/** His hull (a plate for each dent he can take) and steam (a pip for each blow). */
function Gauges({ fight, guide }: { fight: FightState; guide: GuideStep | null }) {
  const { limits } = fight;
  const hit = fight.phase === 'strike' && fight.lastStrike?.dented === true;
  return (
    <div className="fight__gauges" data-hit={hit || undefined}>
      <div
        className="fight__gauge"
        role="img"
        aria-label={hr.fight.left(hr.fight.hull, fight.hull, limits.hull)}
        {...guideMark(guide, 'hull')}
      >
        <Named name={hr.fight.hull} caption={hr.fight.captions.hull} />
        <span className="fight__plates">
          {Array.from({ length: limits.hull }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: plates are places, not items
            <span key={i} className="fight__plate" data-dented={i >= fight.hull || undefined} />
          ))}
        </span>
      </div>
      <div
        className="fight__gauge"
        role="img"
        aria-label={hr.fight.left(hr.fight.steam, fight.steam, limits.steam)}
        {...guideMark(guide, 'steam')}
      >
        <Named name={hr.fight.steam} caption={hr.fight.captions.steam} />
        <span className="fight__pips">
          {Array.from({ length: limits.steam }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: pips are places, not items
            <span key={i} className="fight__pip" data-spent={i >= fight.steam || undefined} />
          ))}
        </span>
      </div>
    </div>
  );
}

/**
 * `a · x + b` with his numbers as he places them, and the blows for x once the dial is open.
 * Never the total: that comes only with the strike (story 3.2), and its caption says so.
 */
function Formula({ fight, guide }: { fight: FightState; guide: GuideStep | null }) {
  const { blade, charge } = placedValues(fight);
  const set = fight.phase === 'set';
  const part = (value: number | null, letter: string) =>
    value === null ? <var>{letter}</var> : <b>{value}</b>;
  return (
    <div className="fight__formula-box" {...guideMark(guide, 'formula')}>
      <p className="fight__formula" data-testid="formula">
        {part(blade, 'a')} · {set ? <b>{fight.blows}</b> : <var>x</var>} + {part(charge, 'b')}
      </p>
      <p className="fight__caption">{hr.fight.captions.formula}</p>
    </div>
  );
}

/**
 * The blows dial: a notch for each blow up to the reach die, past what steam pays for
 * shown off. Open only once all three slots are filled, and in the guided fight only from
 * the guide's blows step on.
 */
function Blows({
  fight,
  guide,
  onBlows,
}: {
  fight: FightState;
  guide: GuideStep | null;
  onBlows(x: number): void;
}) {
  const range = blowRange(fight);
  const reach = placedValues(fight).reach;
  const notches = reach ?? 6;
  const affordable = blowsAffordable(fight.steam);
  const guideOpen = guide === null || guide === 'blows' || guide === 'strike';
  return (
    <fieldset className="fight__blows" aria-label={hr.fight.blows} {...guideMark(guide, 'blows')}>
      <Named
        name={
          <>
            {hr.fight.blows} <var>x</var>
          </>
        }
        caption={hr.fight.captions.blows}
      />
      <span className="fight__notches">
        {Array.from({ length: notches }, (_, i) => {
          const x = i + 1;
          const open = guideOpen && range !== null && x >= range.min && x <= range.max;
          return (
            <button
              key={x}
              type="button"
              className="fight__notch"
              data-x={x}
              aria-pressed={range !== null && fight.blows === x}
              aria-label={hr.fight.blowsNotch(x)}
              data-unaffordable={x > affordable || undefined}
              disabled={!open}
              onClick={() => onBlows(x)}
            >
              {x}
            </button>
          );
        })}
      </span>
    </fieldset>
  );
}
