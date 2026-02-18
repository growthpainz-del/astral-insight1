import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LiveAgent() {
  const [agentId, setAgentId] = useState("");
  const scriptRef = useRef(null);

  const mountScript = () => {
    // Clean previous script if exists
    try {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    } catch (_) {}

     // Clear previous embed container content to avoid duplicates
     try {
       const target = document.getElementById("did-agent-container");
       if (target) target.innerHTML = "";
     } catch (_) {}

     const id = agentId || "v2_agt_hF1S2XwN";
     const key = "Z29vZ2xlLW9hdXRoMnwxMTU4Mjg4NTQ2NzM5OTExMjUyOTQ6UXpvMjZoZWFxd3ZSa3lXSmpvMHlM";

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";
    script.setAttribute("data-mode", "full");
    script.setAttribute("data-client-key", key);
    script.setAttribute("data-agent-id", id);
    script.setAttribute("data-name", "did-agent");
    script.setAttribute("data-monitor", "true");
    script.setAttribute("data-target-id", "did-agent-container");

    document.body.appendChild(script);
    scriptRef.current = script;
  };

  useEffect(() => {
    // Load saved agent ID and mount on first render
    try {
      const savedId = localStorage.getItem("did_live_agent_id");
      if (savedId) {
        setAgentId(savedId);
      } else {
        const fallback = "v2_agt_hF1S2XwN";
        setAgentId(fallback);
        localStorage.setItem("did_live_agent_id", fallback);
      }
    } catch (_) {}
    mountScript();

    return () => {
      try {
        if (scriptRef.current) {
          document.body.removeChild(scriptRef.current);
        }
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-mount when agent ID changes (e.g., after saving)
    if (scriptRef.current) {
      mountScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const handleSave = () => {
    try {
      if (agentId) localStorage.setItem("did_live_agent_id", agentId);
    } catch (_) {}
    mountScript();
  };

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

        <div className="bg-white/10 border border-white/20 rounded-lg p-3 flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-white/70 mb-1">Agent ID</label>
            <Input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="v2_agt_..."
              className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
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