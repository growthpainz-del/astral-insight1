/**
 * src/components/common/PageLoader.jsx
 *
 * Unified full-page loading state.
 * Replaces the 6+ different loading patterns across pages.
 *
 * Usage:
 *   import PageLoader from "@/components/common/PageLoader";
 *   if (loading) return <PageLoader />;
 *   if (loading) return <PageLoader message="Loading your decks…" icon={Sparkles} />;
 */
import React from "react";
import { Loader2 } from "lucide-react";

export default function PageLoader({
  message = "Loading…",
  icon: Icon = null,
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {Icon ? (
          <Icon className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-pulse" />
        ) : (
          <Loader2 className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-spin" />
        )}
        <p className="text-white/70 text-sm">{message}</p>
      </div>
    </div>
  );
}