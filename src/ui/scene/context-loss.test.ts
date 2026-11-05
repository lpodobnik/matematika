import { describe, expect, it, vi } from 'vitest';
import { type VisibilitySource, watchContextLoss } from '@/ui/scene/context-loss';

class FakePage extends EventTarget implements VisibilitySource {
  visibilityState: DocumentVisibilityState = 'visible';

  show(state: DocumentVisibilityState) {
    this.visibilityState = state;
    this.dispatchEvent(new Event('visibilitychange'));
  }
}

function setup() {
  const canvas = new EventTarget();
  const page = new FakePage();
  const remount = vi.fn();
  const stop = watchContextLoss(canvas, page, remount);
  const fire = (type: 'webglcontextlost' | 'webglcontextrestored') =>
    canvas.dispatchEvent(new Event(type));
  return { canvas, page, remount, stop, fire };
}

describe('watchContextLoss', () => {
  it('remounts when the lost context is restored', () => {
    const { remount, fire } = setup();
    fire('webglcontextlost');
    expect(remount).not.toHaveBeenCalled();
    fire('webglcontextrestored');
    expect(remount).toHaveBeenCalledOnce();
  });

  it('remounts when the page is visible again while the context is still lost', () => {
    const { page, remount, fire } = setup();
    page.show('hidden');
    fire('webglcontextlost');
    expect(remount).not.toHaveBeenCalled();
    page.show('visible');
    expect(remount).toHaveBeenCalledOnce();
  });

  it('does nothing on a visibility change while the context is fine', () => {
    const { page, remount } = setup();
    page.show('hidden');
    page.show('visible');
    expect(remount).not.toHaveBeenCalled();
  });

  it('remounts at most once', () => {
    const { page, remount, fire } = setup();
    fire('webglcontextlost');
    page.show('visible');
    fire('webglcontextrestored');
    expect(remount).toHaveBeenCalledOnce();
  });

  it('ignores events after it is stopped, such as the loss Pixi causes when destroying', () => {
    const { page, remount, stop, fire } = setup();
    stop();
    fire('webglcontextlost');
    fire('webglcontextrestored');
    page.show('visible');
    expect(remount).not.toHaveBeenCalled();
  });
});
