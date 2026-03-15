import * as React from 'react';
import ErrorScreen from '../components/ErrorScreen/ErrorScreen';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen 
          error={this.state.error?.message || 'Erro desconhecido na renderização'} 
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
