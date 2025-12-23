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

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error: error });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={String(this.state.error?.message)} />;
    }

    return this.props.children;
  }
}
