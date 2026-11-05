import { hr } from '@/content/text/hr';

// Shown only in portrait, by the media query in app.css; no script decides it.
export function PortraitOverlay() {
  return (
    <div className="portrait-overlay" role="status">
      <div className="portrait-overlay__device" aria-hidden="true" />
      <p className="portrait-overlay__text">{hr.app.turnToLandscape}</p>
    </div>
  );
}
