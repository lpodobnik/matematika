import { gearPath } from '@/app/gear';
import { hr } from '@/content/text/hr';

/**
 * The placeholder "to be continued" screen (story 1.13): it shows once room 4's restart
 * has played, the end of epic 1's rooms, until the map takes its place in epic 2. It is
 * not a success screen (NFR13): no stars, scores or praise, only a still gear and the line
 * from hr.ts, on paper in grey ink.
 */
export function ToBeContinued() {
  return (
    <main className="continued">
      <svg className="continued__gear" viewBox="-50 -50 100 100" aria-hidden="true">
        <path d={gearPath} />
        <circle r="12" />
      </svg>
      <p className="continued__text">{hr.app.toBeContinued}</p>
    </main>
  );
}
