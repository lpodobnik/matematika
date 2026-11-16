import '@/ui/hunt/hunt.css';
import type { GearId, LookPieceId } from '@/hunt/ids';
import { useGame } from '@/store/store';

/**
 * The little one, drawn in code (story 7.4): a small scrap automaton with no legs, on one wheel,
 * with two round eyes, a tiny lamp and a winding key on its back. The picture faces right.
 * `town.css` animates its hop, its wheel and its key. It wears the paint and hat he chose, and
 * shows its gear (epic 11): the hook on its back, the bright lamp, the magnet in its hand.
 */
export function LittleOneArt({
  wearing = [],
  gear = [],
}: {
  wearing?: readonly LookPieceId[];
  gear?: readonly GearId[];
} = {}) {
  const paint = wearing.find((look) => look.startsWith('paint'));
  const hat = wearing.find((look) => look.startsWith('hat'));
  return (
    <svg
      className="little-one"
      viewBox="-50 -86 100 100"
      aria-hidden="true"
      data-paint={paint}
      data-bright={gear.includes('lamp') || undefined}
    >
      <g className="little-one__body">
        {/* The grappling hook, coiled on its back; the longer one sticks up past it. */}
        {gear.includes('long-hook') ? (
          <g className="little-one__hook">
            <path d="M-24 -60 L-40 -96" />
            <path d="M-40 -96 C-48 -100 -50 -90 -44 -88" />
          </g>
        ) : (
          gear.includes('hook') && (
            <g className="little-one__hook">
              <circle cx="-31" cy="-52" r="6" />
              <path d="M-31 -58 C-38 -66 -30 -72 -26 -66" />
            </g>
          )
        )}
        {/* The winding key, on its back. */}
        <g className="little-one__key">
          <path d="M-30 -38 H-42" />
          <path d="M-42 -46 C-52 -46 -52 -30 -42 -30 C-48 -36 -48 -40 -42 -46 Z" />
        </g>
        {/* Its tiny lamp, on a stalk. */}
        <path className="little-one__stalk" d="M4 -66 C4 -72 8 -74 10 -78" />
        {gear.includes('lamp') && <circle className="little-one__glow" cx="11" cy="-79" r="11" />}
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
        {gear.includes('magnet') && (
          <g className="little-one__magnet">
            <path d="M38 -18 V-10 A5 5 0 0 0 48 -10 V-18" />
            <path className="little-one__magnet-tip" d="M38 -18 V-14 M48 -18 V-14" />
          </g>
        )}
        {hat === 'hat-cap' && (
          <g className="little-one__hat" data-hat="cap">
            <path d="M-26 -64 C-26 -82 4 -82 4 -64 Z" />
            <path d="M-30 -64 H12" />
          </g>
        )}
        {hat === 'hat-top' && (
          <g className="little-one__hat" data-hat="top">
            <rect x="-22" y="-94" width="24" height="28" rx="2" />
            <path className="little-one__hat-band" d="M-22 -72 H2" />
            <path d="M-30 -66 H10" />
          </g>
        )}
        {hat === 'hat-chef' && (
          <g className="little-one__hat" data-hat="chef">
            <path d="M-24 -64 V-76 C-34 -80 -30 -96 -18 -90 C-14 -100 0 -100 2 -90 C12 -94 16 -80 6 -76 V-64 Z" />
          </g>
        )}
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

/** The little one as he has dressed and equipped it, from the save. */
export function OurLittleOne() {
  const companion = useGame((s) => s.save.companion);
  return <LittleOneArt wearing={companion?.wearing ?? []} gear={companion?.gear ?? []} />;
}
