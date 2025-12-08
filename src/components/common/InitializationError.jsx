import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, Server } from "lucide-react";

export default function InitializationError({ error, onRetry }) {
  const isNetworkError = error?.message?.toLowerCase().includes('network') || 
                         error?.message?.toLowerCase().includes('fetch') ||
                         error?.code === 'ERR_NETWORK';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="text-center mb-6">
          {isNetworkError ? (
            <Wifi className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          ) : (
            <Server className="w-16 h-16 text-red-400 mx-auto mb-4" />
          )}
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {isNetworkError ? "Connection Issue" : "Initialization Failed"}
          </h1>
          
          <p className="text-white/70">
            {isNetworkError 
              ? "Unable to connect to Astral Insight servers"
              : "The app encountered an error during startup"}
          </p>
        </div>

        {error?.message && (
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-200 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-200 font-semibold mb-2">
              Try these fixes:
            </p>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>Check your internet connection</li>
              <li>Disable VPN or proxy if enabled</li>
              <li>Clear browser cache (Ctrl+Shift+Del)</li>
              <li>Try a different browser</li>
              <li>Check if your firewall is blocking the app</li>
              {!isNetworkError && <li>Contact support if the issue persists</li>}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onRetry}
            className="bg-purple-600 hover:bg-purple-700 flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 flex-1"
          >
            Hard Reload
          </Button>
        </div>

        <p className="text-xs text-white/50 text-center mt-6">
          If the problem persists, please wait a few minutes and try again.
        </p>
      </div>
    </div>
  );
}