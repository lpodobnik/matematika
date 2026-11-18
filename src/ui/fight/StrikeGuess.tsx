import { useState } from 'react';
import { hr } from '@/content/text/hr';
import { strikeDamage } from '@/fight/fight';
import type { StrikeForm } from '@/fight/types';
import { powerMark } from '@/math/format';

// Level 3 with brackets runs to five digits.
const MAX_DIGITS = 6;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/** Where he is: still working it out, just got it wrong, or got it right. */
type Stage = 'asking' | 'wrong' | 'right';

/**
 * Once he has beaten an automaton, a strike asks first how big it will be. He works out
 * `a · x + b`; a wrong answer costs nothing and he tries again. A right one sets the strike
 * beside the armour, so he can still go back and move his dice before he commits.
 */
export function StrikeGuess({
  blade,
  blows,
  charge,
  form = 'plain',
  level = 1,
  armour,
  onStrike,
  onBack,
}: {
  blade: number;
  blows: number;
  charge: number;
  /** With part 2's brackets, `a · (x + b)`. */
  form?: StrikeForm;
  /** The automaton's level: the power blade and charge are raised to. */
  level?: number;
  armour: number;
  onStrike(): void;
  onBack(): void;
}) {
  const damage = strikeDamage(blade, blows, charge, form, level);
  const power = powerMark(level);
  const raised = (value: number) => (
    <>
      <b>{value}</b>
      {power && <sup className="fight__power">{power}</sup>}
    </>
  );
  const [typed, setTyped] = useState('');
  const [stage, setStage] = useState<Stage>('asking');

  const press = (digit: number) => {
    setStage('asking');
    setTyped((now) => (stage === 'wrong' ? `${digit}` : `${now}${digit}`.slice(0, MAX_DIGITS)));
  };
  const erase = () => {
    setStage('asking');
    setTyped((now) => now.slice(0, -1));
  };
  const check = () => setStage(Number(typed) === damage ? 'right' : 'wrong');

  return (
    <div className="fight__backdrop">
      <div
        className="fight__confirm fight__guess"
        role="dialog"
        aria-modal="true"
        aria-label={hr.fight.guess.ask}
      >
        <p className="fight__guess-ask">{hr.fight.guess.ask}</p>
        <p className="fight__formula" data-testid="guess-formula">
          {form === 'brackets' ? (
            <>
              {raised(blade)} · (<b>{blows}</b> + {raised(charge)}) ={' '}
            </>
          ) : (
            <>
              {raised(blade)} · <b>{blows}</b> + {raised(charge)} ={' '}
            </>
          )}
          <output className="fight__guess-answer">{typed === '' ? '?' : typed}</output>
        </p>
        {stage === 'right' ? (
          <>
            <p className="fight__guess-note" role="status">
              {hr.fight.guess.right(damage, armour)}
            </p>
            <div className="fight__confirm-buttons">
              <button type="button" className="fight__go" onClick={onBack}>
                {hr.fight.guess.change}
              </button>
              <button type="button" className="fight__stay" onClick={onStrike}>
                {hr.fight.strike}
              </button>
            </div>
          </>
        ) : (
          <>
            {stage === 'wrong' && (
              <p className="fight__guess-note" role="status">
                {level > 1
                  ? form === 'brackets'
                    ? hr.fight.guess.wrongPowerBrackets
                    : hr.fight.guess.wrongPower
                  : form === 'brackets'
                    ? hr.fight.guess.wrongBrackets
                    : hr.fight.guess.wrong}
              </p>
            )}
            <div className="fight__guess-pad">
              {DIGITS.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  className="fight__guess-key"
                  onClick={() => press(digit)}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                className="fight__guess-key fight__guess-erase"
                aria-label={hr.fight.guess.erase}
                disabled={typed === ''}
                onClick={erase}
              >
                <svg viewBox="0 0 32 24" aria-hidden="true">
                  <path d="M10 3h19v18H10L2 12z" />
                  <path d="M15 8l8 8M23 8l-8 8" />
                </svg>
              </button>
            </div>
            <div className="fight__confirm-buttons">
              <button type="button" className="fight__go" onClick={onBack}>
                {hr.fight.guess.change}
              </button>
              <button
                type="button"
                className="fight__stay"
                disabled={typed === '' || stage === 'wrong'}
                onClick={check}
              >
                {hr.fight.guess.check}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
