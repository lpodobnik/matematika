import type { RendererPreference } from 'pixi.js';

/**
 * Architecture, Error Handling: WebGL only (WebGL 2, then WebGL 1), never WebGPU or Canvas2D.
 * The array form limits Pixi to this list; a plain string would only put WebGL first. Without
 * WebGL, init rejects with "No available renderer" and the crash screen shows.
 */
export const rendererPreference: RendererPreference[] = ['webgl'];
