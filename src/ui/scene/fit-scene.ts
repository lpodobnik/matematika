// Architecture, Consistency Rules: one logical scene of 1600 × 1000, scaled to fit the
// area beside the notebook and centred in it.

export const sceneSize = { width: 1600, height: 1000 } as const;

export interface SceneFit {
  scale: number;
  x: number;
  y: number;
}

export function fitScene(
  viewWidth: number,
  viewHeight: number,
  size: { width: number; height: number } = sceneSize,
): SceneFit {
  const width = Number.isFinite(viewWidth) ? Math.max(0, viewWidth) : 0;
  const height = Number.isFinite(viewHeight) ? Math.max(0, viewHeight) : 0;
  const scale = Math.min(width / size.width, height / size.height);
  return {
    scale,
    x: (width - size.width * scale) / 2,
    y: (height - size.height * scale) / 2,
  };
}
