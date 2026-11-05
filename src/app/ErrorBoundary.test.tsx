import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CrashScreen, ErrorBoundary } from '@/app/ErrorBoundary';
import { hr } from '@/content/text/hr';
import { createCrashReporter } from '@/lib/crash';
import { errorLogKey, readErrors } from '@/lib/error-log';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ErrorBoundary', () => {
  it('renders the game while nothing has crashed', () => {
    const reporter = createCrashReporter(vi.fn());
    const html = renderToString(
      <ErrorBoundary reporter={reporter}>
        <p>the game</p>
      </ErrorBoundary>,
    );
    expect(html).toContain('the game');
    expect(html).not.toContain(hr.app.crash.title);
  });

  it('switches to the crash screen on a render error', () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ crashed: true });
  });

  it('writes a render error to matematika:errors', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    const boundary = new ErrorBoundary({ children: null });
    boundary.componentDidCatch(new Error('render failed'), { componentStack: '\n  at Scale' });
    expect(storage.getItem(errorLogKey)).not.toBeNull();
    expect(readErrors(storage)).toEqual([
      expect.objectContaining({
        source: 'render',
        message: 'Error: render failed',
        componentStack: '\n  at Scale',
      }),
    ]);
  });

  it('shows the crash screen when a global error was reported before it mounted', () => {
    const reporter = createCrashReporter(vi.fn());
    reporter.report('unhandledrejection', new Error('early'));
    const html = renderToString(
      <ErrorBoundary reporter={reporter}>
        <p>the game</p>
      </ErrorBoundary>,
    );
    expect(html).toContain(hr.app.crash.title);
    expect(html).toContain(hr.app.crash.tapToRestart);
    expect(html).not.toContain('the game');
  });

  it('switches to the crash screen when a global error is reported after mounting', () => {
    const reporter = createCrashReporter(vi.fn());
    const boundary = new ErrorBoundary({ children: null, reporter });
    const setState = vi.spyOn(boundary, 'setState').mockImplementation(() => {});
    boundary.componentDidMount();
    reporter.report('error', new Error('window.onerror'));
    expect(setState).toHaveBeenCalledWith({ crashed: true });

    setState.mockClear();
    boundary.componentWillUnmount();
    reporter.report('error', new Error('after unmount'));
    expect(setState).not.toHaveBeenCalled();
  });

  it('passes the reload to the crash screen', () => {
    const reload = vi.fn();
    const boundary = new ErrorBoundary({ children: null, reload });
    boundary.state = { crashed: true };
    const screen = boundary.render() as { props: { onRestart: () => void } };
    screen.props.onRestart();
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('CrashScreen', () => {
  it('shows the in-fiction text from hr.ts and restarts on a tap', () => {
    const onRestart = vi.fn();
    const html = renderToString(<CrashScreen onRestart={onRestart} />);
    expect(html).toContain(hr.app.crash.title);
    expect(html).toContain(hr.app.crash.tapToRestart);

    const element = CrashScreen({ onRestart });
    element.props.onClick();
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
