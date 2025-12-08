import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error Boundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-900/20 border-2 border-red-500/40 rounded-xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              App Failed to Load
            </h1>
            <p className="text-red-200 mb-6">
              {this.state.error?.message || "An unexpected error occurred while loading the app."}
            </p>

            {this.state.error?.message?.toLowerCase().includes('network') && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-amber-200 mb-2">
                  <strong>Network Error Detected:</strong>
                </p>
                <ul className="text-xs text-amber-200 space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>The server may be temporarily down</li>
                  <li>Clear your browser cache and try again</li>
                  <li>Try disabling VPN or ad blockers</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReload}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload App
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home Page
              </Button>
            </div>

            {this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-red-300 hover:text-red-200 mb-2">
                  Show technical details
                </summary>
                <div className="bg-black/30 rounded p-3 mt-2">
                  <pre className="text-xs text-red-200 whitespace-pre-wrap font-mono overflow-x-auto">
                    {this.state.error?.stack || String(this.state.error)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;