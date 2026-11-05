import { autoDetectRenderer } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { rendererPreference } from '@/ui/scene/renderer';

describe('renderer preference', () => {
  it('lists WebGL alone, so Pixi never falls back to WebGPU or Canvas2D', () => {
    expect(rendererPreference).toEqual(['webgl']);
  });

  it('fails to start where there is no WebGL, instead of falling back', async () => {
    // Node has neither WebGL nor WebGPU, like a browser without them.
    await expect(autoDetectRenderer({ preference: rendererPreference })).rejects.toThrow(
      'No available renderer for the current environment',
    );
  });
});
