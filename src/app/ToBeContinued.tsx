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

/** A 10-tooth gear outline, drawn once. */
const gearPath = (() => {
  const teeth = 10;
  const points: string[] = [];
  for (let i = 0; i < teeth * 4; i += 1) {
    const angle = (i / (teeth * 4)) * Math.PI * 2;
    const radius = i % 4 < 2 ? 44 : 34;
    points.push(
      `${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return `M ${points.join(' L ')} Z`;
})();
