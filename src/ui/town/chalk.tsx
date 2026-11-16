/**
 * Kristijan's chalk mark (epic 11, secrets): an arrow pointing at what he hid, and beside it a
 * small drawing of what the little one needs to reach it, so a 10-year-old can tell which gear
 * to bring back. Once found, it's crossed out. Drawn in code, in chalk white with an ink edge.
 * `at` is where the mark sits inside its tap area, in percent.
 */
export function ChalkMark({
  needs,
  found,
  at,
}: {
  needs: 'lamp' | 'magnet' | 'long-hook';
  found: boolean;
  at: { x: number; y: number };
}) {
  return (
    <svg
      className="town__chalk-mark"
      viewBox="-40 -40 80 80"
      style={{ left: `${at.x}%`, top: `${at.y}%` }}
      aria-hidden="true"
    >
      {/* A ring round it, as Kristijan marks things. */}
      <circle cx="0" cy="0" r="34" className="town__chalk-ring" />
      {needs === 'lamp' && (
        <g>
          <circle cx="0" cy="-4" r="10" />
          <path d="M-5 8 H5 M-4 13 H4 M0 -26 V-20 M-18 -18 L-13 -13 M18 -18 L13 -13 M-24 -4 H-17 M24 -4 H17" />
        </g>
      )}
      {needs === 'magnet' && (
        <g>
          <path d="M-12 -16 V2 A12 12 0 0 0 12 2 V-16" />
          <path d="M-12 -16 H-4 M4 -16 H12 M-12 -8 H-4 M4 -8 H12" />
        </g>
      )}
      {needs === 'long-hook' && (
        <g>
          <path d="M0 22 V-14 C0 -24 -14 -24 -14 -14 M0 -14 C0 -24 14 -24 14 -14" />
          <path d="M-6 22 H6" />
        </g>
      )}
      {found && <path className="town__chalk-cross" d="M-26 -26 L26 26 M26 -26 L-26 26" />}
    </svg>
  );
}
