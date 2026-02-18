import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function LiveAgent() {
  useEffect(() => {
    // Inject D-ID Agent script on mount
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";
    script.setAttribute("data-mode", "full");
    script.setAttribute(
      "data-client-key",
      "Z29vZ2xlLW9hdXRoMnwxMTU4Mjg4NTQ2NzM5OTExMjUyOTQ6UXpvMjZoZWFxd3ZSa3lXSmpvMHlM"
    );
    script.setAttribute("data-agent-id", "v2_agt_hF1S2XwN");
    script.setAttribute("data-name", "did-agent");
    script.setAttribute("data-monitor", "true");
    script.setAttribute("data-target-id", "did-agent-container");

    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (_) {
        // no-op
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Live Agent</h1>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Back
            </Button>
          </Link>
        </div>

        <div className="text-white/70 text-sm">
          If prompted, allow microphone and camera access so the agent can interact with you.
        </div>

        {/* Target container for D-ID Agent embed */}
        <div
          id="did-agent-container"
          className="w-full aspect-video bg-black/30 border border-white/10 rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}