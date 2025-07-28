import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div style={{
            padding: '20px',
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24',
            margin: '20px'
          }}>
            <h3>⚠️ Something went wrong</h3>
            <p>An error occurred in the PDF viewer component.</p>
            {this.state.error && (
              <details style={{ marginTop: '10px', fontSize: '14px' }}>
                <summary>Error details</summary>
                <pre style={{ 
                  background: '#fff', 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && '\n' + this.state.error.stack}
                </pre>
              </details>
            )}
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;