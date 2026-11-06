import '@/ui/fight/fight.css';
import { useEffect, useState } from 'react';
import { lairs } from '@/content/lairs';
import { hr } from '@/content/text/hr';
import { blowRange, blowsAffordable, placedValues, SLOTS } from '@/fight/fight';
import type { FightAction, FightState, Slot } from '@/fight/types';
import { formatNumber } from '@/math/format';
import type { FightEnd } from '@/store/fight-end';
import { useGame } from '@/store/store';
import { FightEndPanel, LeaveConfirm, StrikeBanner } from '@/ui/fight/FightEnd';
import { Automaton, DieFace } from '@/ui/fight/fight-art';
import { type Tap, tapDie, tapLeave, tapSlot } from '@/ui/fight/taps';

/**
 * The fight screen (story 3.1; GDD, Automaton fights): the automaton and its armour on the
 * left, his bench on the right. He rolls, taps a die and then a slot to place it as blade
 * `a`, charge `b` or reach, and sets his blows on the dial, seeing `a · x + b` with his
 * numbers but never the total. HTML and SVG like the map, so every control is a real
 * button at least 48 CSS px.
 */
export function FightScreen() {
  const fight = useGame((s) => s.fight);
  const end = useGame((s) => s.ui.fightEnd);
  const dispatch = useGame((s) => s.dispatch);
  if (!fight) return null;
  return <FightBoard fight={fight} end={end} onAction={dispatch} />;
}

interface BoardProps {
  fight: FightState;
  /** How the fight ended, once it has (store/fight-end.ts). */
  end?: FightEnd | null;
  onAction(action: FightAction | { type: 'fight/close' }): void;
}

/** The fight from props only. */
export function FightBoard({ fight, end = null, onAction }: BoardProps) {
  const lair = lairs[fight.lairId];
  // Leaving after a strike loses the fight, so he is asked first (story 3.2).
  const [askLeave, setAskLeave] = useState(false);
  // The question goes with the moment it was asked in: a new round or the end closes it.
  const moment = `${fight.round}:${fight.phase}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new round or phase closes it
  useEffect(() => setAskLeave(false), [moment]);
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

  return (
    <main className="fight" aria-label={hr.fight.title(lair.armour)}>
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
          className={
            fight.phase === 'won' ? 'fight__automaton fight__automaton--down' : 'fight__automaton'
          }
        />
        <Armour armour={fight.armour} full={lair.armour} />
      </section>
      <section className="fight__bench">
        <Gauges key={`hull-${fight.hull}`} fight={fight} />
        {fight.lastStrike && (fight.phase === 'strike' || (over && !leftEarly)) && (
          <StrikeBanner key={fight.strikes} strike={fight.lastStrike} />
        )}
        {over ? (
          <FightEndPanel
            fight={fight}
            end={end}
            onClose={() => onAction({ type: 'fight/close' })}
          />
        ) : (
          bench()
        )}
      </section>
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
              onClick={() => onAction({ type: 'fight/roll' })}
            >
              {hr.fight.roll}
            </button>
          ) : (
            fight.dice.map((value, die) => {
              const slot = slotOf(die);
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
                  disabled={!placing}
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
        {placing && fight.slots.blade === null && held === null && (
          <p className="fight__tag">{hr.fight.placeTag}</p>
        )}
        <div className="fight__slots">
          {SLOTS.map((slot) => {
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
                disabled={!placing || (held === null && value === null)}
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
            <Formula fight={fight} />
            <Blows fight={fight} onBlows={(x) => onAction({ type: 'fight/blows', x })} />
            <button
              type="button"
              className="fight__strike"
              disabled={fight.phase !== 'set'}
              onClick={() => {
                setHeld(null);
                onAction({ type: 'fight/strike' });
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

/** The automaton's armour: what is left, as a number and a bar. */
function Armour({ armour, full }: { armour: number; full: number }) {
  return (
    <div className="fight__armour" role="status">
      <span className="fight__armour-label">{hr.fight.armour}</span>
      <span className="fight__armour-number">{formatNumber(armour)}</span>
      <span className="fight__armour-bar" aria-hidden="true">
        <span style={{ width: `${(armour / full) * 100}%` }} />
      </span>
    </div>
  );
}

/** His hull (a plate for each dent he can take) and steam (a pip for each blow). */
function Gauges({ fight }: { fight: FightState }) {
  const { limits } = fight;
  const hit = fight.phase === 'strike' && fight.lastStrike?.dented === true;
  return (
    <div className="fight__gauges" data-hit={hit || undefined}>
      <div
        className="fight__gauge"
        role="img"
        aria-label={hr.fight.left(hr.fight.hull, fight.hull, limits.hull)}
      >
        <span className="fight__gauge-label">{hr.fight.hull}</span>
        {Array.from({ length: limits.hull }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: plates are places, not items
          <span key={i} className="fight__plate" data-dented={i >= fight.hull || undefined} />
        ))}
      </div>
      <div
        className="fight__gauge"
        role="img"
        aria-label={hr.fight.left(hr.fight.steam, fight.steam, limits.steam)}
      >
        <span className="fight__gauge-label">{hr.fight.steam}</span>
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
 * Never the total: that comes only with the strike (story 3.2).
 */
function Formula({ fight }: { fight: FightState }) {
  const { blade, charge } = placedValues(fight);
  const set = fight.phase === 'set';
  const part = (value: number | null, letter: string) =>
    value === null ? <var>{letter}</var> : <b>{value}</b>;
  return (
    <p className="fight__formula" data-testid="formula">
      {part(blade, 'a')} · {set ? <b>{fight.blows}</b> : <var>x</var>} + {part(charge, 'b')}
    </p>
  );
}

/**
 * The blows dial: a notch for each blow up to the reach die, past what steam pays for
 * shown off. Open only once all three slots are filled.
 */
function Blows({ fight, onBlows }: { fight: FightState; onBlows(x: number): void }) {
  const range = blowRange(fight);
  const reach = placedValues(fight).reach;
  const notches = reach ?? 6;
  const affordable = blowsAffordable(fight.steam);
  return (
    <fieldset className="fight__blows" aria-label={hr.fight.blows}>
      <span className="fight__blows-label">
        {hr.fight.blows} <var>x</var>
      </span>
      {Array.from({ length: notches }, (_, i) => {
        const x = i + 1;
        const open = range !== null && x >= range.min && x <= range.max;
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
    </fieldset>
  );
}
