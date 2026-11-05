import { describe, expect, it, vi } from 'vitest';
import { createCrashReporter } from '@/lib/crash';
import { SceneErrorBoundary } from '@/ui/scene/SceneErrorBoundary';

describe('SceneErrorBoundary', () => {
  it('reports a render error in the Pixi tree as a render crash', () => {
    const reporter = createCrashReporter(vi.fn());
    const report = vi.spyOn(reporter, 'report');
    const boundary = new SceneErrorBoundary({ children: null, reporter });
    const error = new Error('Scale failed to render');
    boundary.componentDidCatch(error, { componentStack: '\n  at Scale' });
    expect(report).toHaveBeenCalledWith('render', error, '\n  at Scale');
  });

  it('writes the error and tells the top-level boundary', () => {
    const record = vi.fn();
    const reporter = createCrashReporter(record);
    const listener = vi.fn();
    reporter.subscribe(listener);
    const boundary = new SceneErrorBoundary({ children: null, reporter });
    const error = new Error('Dial failed to render');
    boundary.componentDidCatch(error, {});
    expect(record).toHaveBeenCalledWith('render', error);
    expect(listener).toHaveBeenCalledOnce();
    expect(reporter.isCrashed()).toBe(true);
  });

  it('draws the scene until it fails, then nothing', () => {
    expect(SceneErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
    const children = 'the scene';
    const boundary = new SceneErrorBoundary({ children });
    expect(boundary.render()).toBe(children);
    boundary.state = { failed: true };
    expect(boundary.render()).toBeNull();
  });
});
