import { Component, type ErrorInfo, type ReactNode } from 'react';
import { type CrashReporter, crashReporter } from '@/lib/crash';

// @pixi/react renders <Application>'s children in a React root of its own, whose error
// callbacks only call console.error. A render error in the scene therefore never reaches
// the top-level error boundary, which lives in the DOM root. This boundary sits inside the
// Pixi root and hands the error to the crash reporter, which writes it to
// matematika:errors and makes the top-level boundary show the "tap to restart" screen.

interface Props {
  children: ReactNode;
  reporter?: CrashReporter;
}

interface State {
  failed: boolean;
}

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    (this.props.reporter ?? crashReporter).report(
      'render',
      error,
      info.componentStack ?? undefined,
    );
  }

  render(): ReactNode {
    // The crash screen replaces the whole app; until then the scene draws nothing.
    return this.state.failed ? null : this.props.children;
  }
}
