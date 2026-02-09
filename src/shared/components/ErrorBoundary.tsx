import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Error capturado:', error);
    console.error('[ErrorBoundary] Error Info:', errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle size={48} className="text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Oops! Algo salió mal</h1>
            <p className="text-gray-600 mb-6">
              Ocurrió un error inesperado. No te preocupes, nuestro equipo ya está trabajando en ello.
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-lg hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reintentar
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold"
              >
                Ir a inicio
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-6">
              Si el problema persiste, intenta recargar la página o contacta al soporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
