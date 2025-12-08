import React from "react";
import { WifiOff, RefreshCcw } from "lucide-react";

export default function NetworkBanner() {
  const [online, setOnline] = React.useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="w-full bg-amber-900/70 border-b border-amber-600/40 text-amber-100 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You’re offline. Some actions may fail. Please reconnect and retry.</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 rounded px-2 py-1 bg-amber-700/60 hover:bg-amber-700/80 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}