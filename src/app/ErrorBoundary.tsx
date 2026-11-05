import { Component, type ErrorInfo, type ReactNode } from 'react';
import { hr } from '@/content/text/hr';
import { type CrashReporter, crashReporter } from '@/lib/crash';
import { recordError } from '@/lib/error-log';

// Architecture, Error Handling: a crash shows an in-fiction screen; the save is untouched
// and the tap reloads the game.

export function reloadPage(): void {
  window.location.reload();
}

export function CrashScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <button type="button" className="crash-screen" onClick={onRestart}>
      <span className="crash-screen__title">{hr.app.crash.title}</span>
      <span className="crash-screen__action">{hr.app.crash.tapToRestart}</span>
    </button>
  );
}

interface Props {
  children: ReactNode;
  reporter?: CrashReporter;
  reload?: () => void;
}

interface State {
  crashed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: (this.props.reporter ?? crashReporter).isCrashed() };
  private unsubscribe: (() => void) | null = null;

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    recordError(
      'render',
      error,
      info.componentStack ? { componentStack: info.componentStack } : {},
    );
  }

  componentDidMount(): void {
    const reporter = this.props.reporter ?? crashReporter;
    this.unsubscribe = reporter.subscribe(() => this.setState({ crashed: true }));
    // A global error may have fired between the first render and this subscription.
    if (reporter.isCrashed() && !this.state.crashed) this.setState({ crashed: true });
  }

  componentWillUnmount(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  render(): ReactNode {
    if (this.state.crashed) return <CrashScreen onRestart={this.props.reload ?? reloadPage} />;
    return this.props.children;
  }
}
