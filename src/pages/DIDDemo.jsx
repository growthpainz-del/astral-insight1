import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DidAgentEmbed from "@/components/integrations/DidAgentEmbed";

export default function DIDDemo() {
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    try {
      const savedId = localStorage.getItem("did_live_agent_id");
      if (savedId) setAgentId(savedId);
    } catch (_) {}
  }, []);

  const handleSave = () => {
    try {
      if (agentId) localStorage.setItem("did_live_agent_id", agentId);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">D-ID Demo</h1>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Back
            </Button>
          </Link>
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

        <DidAgentEmbed agentId={agentId} targetId="did-demo-embed" name="did-agent-demo" />
      </div>
    </div>
  );
}