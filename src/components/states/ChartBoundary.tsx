import { Component, type ReactNode } from 'react';

interface Props {
  message: string;
  retryLabel: string;
  children: ReactNode;
}

/**
 * Keeps a chart failure inside its own frame: one sentence and a retry,
 * while the rest of the screen keeps working.
 */
export class ChartBoundary extends Component<Props, { failed: boolean; key: number }> {
  state = { failed: false, key: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[chart]', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full flex-col items-start justify-center gap-3 p-4">
          <p className="text-[15px] text-text">{this.props.message}</p>
          <button
            type="button"
            onClick={() => this.setState((s) => ({ failed: false, key: s.key + 1 }))}
            className="h-11 rounded-full border border-control px-4 text-sm font-medium text-text hover:bg-active lg:h-9"
          >
            {this.props.retryLabel}
          </button>
        </div>
      );
    }
    return <div key={this.state.key} className="h-full">{this.props.children}</div>;
  }
}
