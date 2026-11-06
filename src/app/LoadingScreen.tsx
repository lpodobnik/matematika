import { gearPath } from '@/app/gear';
import { hr } from '@/content/text/hr';

/**
 * The loading screen (story 2.1; architecture, Asset Management): from launch until the
 * save is read and the assets are loaded. index.html shows the same gear before the code
 * has loaded, so the screen is there at once and doesn't change as React takes over. A
 * gear turns (still under reduced motion), and a bar fills as the assets load; epic 2 has
 * no image bundles yet, so it fills at once. Paper and grey ink, no text but the bar's
 * label for screen readers.
 */
export function LoadingScreen({ loaded }: { loaded: number }) {
  const percent = Math.round(Math.min(1, Math.max(0, loaded)) * 100);
  return (
    <main className="loading">
      <svg className="loading__gear" viewBox="-50 -50 100 100" aria-hidden="true">
        <path d={gearPath} />
        <circle r="12" />
      </svg>
      <div
        className="loading__bar"
        role="progressbar"
        aria-label={hr.app.loading}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="loading__fill" style={{ width: `${percent}%` }} />
      </div>
    </main>
  );
}
