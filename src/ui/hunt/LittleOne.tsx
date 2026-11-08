import '@/ui/hunt/hunt.css';

/**
 * The little one, drawn in code until the final art (story 7.4): a small scrap automaton with no
 * legs, on one wheel, with two round eyes, a tiny lamp and a winding key on its back. The picture
 * faces right. `town.css` animates its hop, its wheel and its key.
 */
export function LittleOneArt() {
  return (
    <svg className="little-one" viewBox="-50 -86 100 100" aria-hidden="true">
      <g className="little-one__body">
        {/* The winding key, on its back. */}
        <g className="little-one__key">
          <path d="M-30 -38 H-42" />
          <path d="M-42 -46 C-52 -46 -52 -30 -42 -30 C-48 -36 -48 -40 -42 -46 Z" />
        </g>
        {/* Its tiny lamp, on a stalk. */}
        <path className="little-one__stalk" d="M4 -66 C4 -72 8 -74 10 -78" />
        <circle className="little-one__lamp" cx="11" cy="-79" r="5" />
        {/* The boiler it's made of, with a patch riveted on. */}
        <rect className="little-one__boiler" x="-30" y="-66" width="60" height="50" rx="22" />
        <path className="little-one__patch" d="M-22 -30 H-6 V-20 H-20 Z" />
        <circle className="little-one__rivet" cx="-17" cy="-27" r="1.4" />
        <circle className="little-one__rivet" cx="-10" cy="-27" r="1.4" />
        <circle className="little-one__rivet" cx="20" cy="-26" r="1.4" />
        {/* Two round eyes, looking the way it goes. */}
        <circle className="little-one__eye" cx="-4" cy="-46" r="11" />
        <circle className="little-one__eye" cx="17" cy="-46" r="9" />
        <circle className="little-one__pupil" cx="-1" cy="-45" r="4.4" />
        <circle className="little-one__pupil" cx="19" cy="-45" r="3.6" />
        {/* A small arm, for knocking. */}
        <path className="little-one__arm" d="M28 -32 C38 -32 40 -28 42 -24" />
        <circle className="little-one__hand" cx="43" cy="-22" r="4" />
      </g>
      {/* One wheel. */}
      <g className="little-one__wheel-at">
        <g className="little-one__wheel">
          <circle cx="0" cy="0" r="13" />
          <path d="M-13 0 H13 M0 -13 V13 M-9 -9 L9 9 M-9 9 L9 -9" />
        </g>
      </g>
    </svg>
  );
}
