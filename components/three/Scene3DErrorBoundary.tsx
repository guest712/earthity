import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  /** Optional label shown on the retry button. */
  retryLabel?: string;
  /** Optional custom fallback renderer. Receives error + retry handler. */
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Isolates any 3D subtree so a render/GL failure does not take the whole app
 * down. Shows a readable message with a retry action instead of a black screen.
 */
export default class Scene3DErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[Scene3DErrorBoundary] caught error:', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.handleRetry);
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>3D scene failed</Text>
        <Text style={styles.message}>{error.message || 'Unknown error'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
          <Text style={styles.retryText}>
            {this.props.retryLabel ?? 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    gap: 10,
  },
  title: {
    color: '#f08a8a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  message: {
    color: 'rgba(232,228,216,0.75)',
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2a2415',
    borderWidth: 1,
    borderColor: '#e8c97a',
  },
  retryText: {
    color: '#e8c97a',
    fontSize: 12,
    fontWeight: '600',
  },
});
