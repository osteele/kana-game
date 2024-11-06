import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.error) {
      return (
        <div role="alert" className="alert alert-error m-4">
          <div>
            <h3 className="font-bold">Sorry, something went wrong</h3>
            <div className="text-sm">{this.state.error.message}</div>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => window.location.reload()}
          >
            Reload Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
