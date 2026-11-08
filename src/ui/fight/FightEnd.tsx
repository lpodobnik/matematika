import { hr } from '@/content/text/hr';
import type { FightState, StrikeRecord } from '@/fight/types';
import { formatNumber } from '@/math/format';
import type { FightEnd } from '@/store/fight-end';

/**
 * The strike's banner (story 3.2; GDD: "the banner shows the sum, such as 6 · 3 + 2 = 20"):
 * his `a · x + b` with the total, and what it did: a clean cut, the armour it took, or the
 * automaton denting him back. `mark` lights or dims it for the guided first fight.
 */
export function StrikeBanner({
  strike,
  mark = {},
}: {
  strike: StrikeRecord;
  mark?: { 'data-focus'?: true; 'data-dim'?: true };
}) {
  const { blade, blows, charge, damage, armourBefore, armourAfter, clean, dented } = strike;
  return (
    <div className="fight__banner" role="status" data-clean={clean || undefined} {...mark}>
      <p className="fight__sum">
        {blade} · {blows} + {charge} = <b>{formatNumber(damage)}</b>
      </p>
      <p className="fight__effect">
        {hr.fight.armourFell(armourBefore, armourAfter)}
        {clean && <span className="fight__clean"> {hr.fight.clean}</span>}
      </p>
      {dented && <p className="fight__dent">{hr.fight.dented}</p>}
    </div>
  );
}

/**
 * How the fight ended, and the way back to the map (story 3.2; parts join in story 3.3).
 * `locked` while the guided first fight still has lines to say: the way back waits for it.
 */
export function FightEndPanel({
  fight,
  end,
  locked = false,
  onClose,
}: {
  fight: FightState;
  end: FightEnd | null;
  locked?: boolean;
  onClose(): void;
}) {
  const won = fight.phase === 'won';
  const reason = end?.reason ?? (fight.outcome && !fight.outcome.won ? fight.outcome.reason : null);
  return (
    <section
      className="fight__end"
      aria-label={won ? hr.fight.won : hr.fight.lost}
      data-dim={locked || undefined}
    >
      <h2 className="fight__end-title">{won ? hr.fight.won : hr.fight.lost}</h2>
      {!won && reason && <p className="fight__end-reason">{hr.fight.reasons[reason]}</p>}
      {end && won && (
        <div className="fight__pay">
          <p className="fight__paid">{hr.fight.paid(end.reward + end.recovered)}</p>
          <p className="fight__pay-line">{hr.fight.paidHow(fight.baseParts, fight.steam)}</p>
          {end.clean && <p className="fight__pay-line">{hr.fight.doubled}</p>}
          {end.recovered > 0 && (
            <p className="fight__pay-line">{hr.fight.recovered(end.recovered)}</p>
          )}
          {fight.lairId === 'lair-60' ? (
            <>
              <p className="fight__pay-line">{hr.fight.finale}</p>
              <p className="fight__notice">{hr.fight.finaleNote}</p>
            </>
          ) : (
            <p className="fight__pay-line">{hr.fight.spend}</p>
          )}
        </div>
      )}
      {!won && fight.lairId === 'lair-60' && <p className="fight__pay-line">{hr.fight.bossLost}</p>}
      {end && !won && (
        <p className="fight__pay-line">
          {end.dropped > 0 ? hr.fight.dropped(end.dropped) : hr.fight.droppedNone}
        </p>
      )}
      <button type="button" className="fight__close" disabled={locked} onClick={onClose}>
        {hr.fight.back}
      </button>
    </section>
  );
}

/** Leaving after a strike counts as losing: he is told, and chooses (story 3.2). */
export function LeaveConfirm({ onLeave, onStay }: { onLeave(): void; onStay(): void }) {
  return (
    <div className="fight__backdrop">
      <div
        className="fight__confirm"
        role="alertdialog"
        aria-modal="true"
        aria-label={hr.fight.leave}
      >
        <p>{hr.fight.leaveLoses}</p>
        <div className="fight__confirm-buttons">
          <button type="button" className="fight__stay" onClick={onStay}>
            {hr.fight.stay}
          </button>
          <button type="button" className="fight__go" onClick={onLeave}>
            {hr.fight.leaveConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
