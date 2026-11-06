// The fight's placeholder skin (story 3.1), drawn in code until epic 6's art: the
// automaton, one of Kristijan's helpers, and the dice. Grey ink, since nothing in a fight is
// restored (NFR12).

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
export function Automaton({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 240" aria-hidden="true">
      <g className="automaton">
        {/* The wind-up key on its back. */}
        <path d="M100 18 V34 M84 10 Q92 2 100 10 Q108 2 116 10 Q108 18 100 18 Q92 18 84 10 Z" />
        {/* Head and eye. */}
        <rect x="70" y="34" width="60" height="44" rx="12" />
        <circle cx="100" cy="56" r="11" className="automaton__eye" />
        <circle cx="100" cy="56" r="4" className="automaton__pupil" />
        {/* Body, with rivets. */}
        <rect x="52" y="84" width="96" height="92" rx="10" />
        <circle cx="62" cy="94" r="3" className="automaton__rivet" />
        <circle cx="138" cy="94" r="3" className="automaton__rivet" />
        <circle cx="62" cy="166" r="3" className="automaton__rivet" />
        <circle cx="138" cy="166" r="3" className="automaton__rivet" />
        <rect x="74" y="104" width="52" height="40" rx="5" className="automaton__plate" />
        {/* Arms: a pincer on the left, a blade on the right. */}
        <path d="M52 100 L28 136 L36 160 M28 136 L18 158" />
        <path d="M148 100 L170 132 L176 112 M170 132 L192 92" />
        {/* Legs. */}
        <path d="M76 176 V222 H62 M124 176 V222 H138" />
      </g>
    </svg>
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
