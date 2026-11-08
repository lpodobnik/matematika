// The fight's skin (story 3.1): the automaton, one of Kristijan's helpers, from its picture
// (story 5.2), and the dice and the punched tape, drawn in code.

import automaton20 from '@/ui/fight/art/automaton-20.webp';
import automaton30 from '@/ui/fight/art/automaton-30.webp';
import automaton45 from '@/ui/fight/art/automaton-45.webp';
import automaton60 from '@/ui/fight/art/automaton-60.webp';

/** Where the pips sit on a 60 × 60 face, for each number. */
const pips: Record<number, [number, number][]> = {
  1: [[30, 30]],
  2: [
    [18, 18],
    [42, 42],
  ],
  3: [
    [16, 16],
    [30, 30],
    [44, 44],
  ],
  4: [
    [18, 18],
    [42, 18],
    [18, 42],
    [42, 42],
  ],
  5: [
    [17, 17],
    [43, 17],
    [30, 30],
    [17, 43],
    [43, 43],
  ],
  6: [
    [18, 15],
    [42, 15],
    [18, 30],
    [42, 30],
    [18, 45],
    [42, 45],
  ],
};

/** A die's face, 1–6, as pips. */
export function DieFace({ value }: { value: number }) {
  return (
    <svg className="die" viewBox="0 0 60 60" aria-hidden="true">
      <rect x="3" y="3" width="54" height="54" rx="11" className="die__body" />
      {(pips[value] ?? []).map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="5.5" className="die__pip" />
      ))}
    </svg>
  );
}

/** The automaton: a riveted body on legs, one round eye, a wind-up key and a blade arm. */
/** Each lair's automaton, cut out of its picture (art-src/CREDITS.md, t09–t12). */
const automatons: Record<number, string> = {
  20: automaton20,
  30: automaton30,
  40: automaton45,
  60: automaton60,
};

/** Every automaton picture, for the loading screen to fetch. */
export const automatonImages: readonly string[] = Object.values(automatons);

/** The automaton of a lair with this armour, facing him (the pictures face left). */
export function Automaton({ className, armour }: { className?: string; armour: number }) {
  return (
    <img className={className} src={automatons[armour] ?? automaton20} alt="" draggable={false} />
  );
}

/** The punched tape a beaten automaton drops as it winds down (GDD, Automaton fights). */
export function PunchedTape({ className }: { className?: string }) {
  const holes = [8, 22, 36, 50, 64, 78, 92, 106, 120, 134];
  return (
    <svg className={className} viewBox="0 0 150 40" aria-hidden="true">
      <path d="M2 8 H148 L142 20 L148 32 H2 Z" className="tape" />
      {holes.map((x, i) => (
        <circle
          key={x}
          cx={x + 6}
          cy={i % 3 === 0 ? 14 : i % 3 === 1 ? 26 : 20}
          r="3"
          className="tape__hole"
        />
      ))}
    </svg>
  );
}
