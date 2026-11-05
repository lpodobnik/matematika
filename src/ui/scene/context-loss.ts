// Architecture, Error Handling: Android drops the WebGL context when the app is in the
// background. The scene remounts when the context comes back, or when the page is visible
// again while it is still lost, because the restore event may never come.

export interface VisibilitySource extends EventTarget {
  readonly visibilityState: DocumentVisibilityState;
}

/**
 * Calls `remount` at most once, then stops watching. Returns a function that stops
 * watching; call it before the old app is destroyed, since Pixi's destroy loses the
 * context on purpose.
 */
export function watchContextLoss(
  canvas: EventTarget,
  page: VisibilitySource,
  remount: () => void,
): () => void {
  let lost = false;
  let watching = true;

  const onLost = () => {
    lost = true;
  };
  const onRestored = () => trigger();
  const onVisibility = () => {
    if (lost && page.visibilityState === 'visible') trigger();
  };

  function stop() {
    if (!watching) return;
    watching = false;
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    page.removeEventListener('visibilitychange', onVisibility);
  }

  function trigger() {
    if (!watching) return;
    stop();
    remount();
  }

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  page.addEventListener('visibilitychange', onVisibility);
  return stop;
}
