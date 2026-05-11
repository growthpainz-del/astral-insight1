import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from "@/api/base44Client";

export default function LiveAgent() {
  const [agentId, setAgentId] = useState("");
  const [decks, setDecks] = useState([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState([]);
  const [search, setSearch] = useState("");
  const inPreview = React.useMemo(() => {
    try { return window.top !== window.self; } catch (_) { return true; }
  }, []);
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
    if (!inPreview) {
      mountScript();
    }

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
    if (!inPreview && scriptRef.current) {
      mountScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Load curated list and decks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [configs, allDecks] = await Promise.all([
          base44.entities.DidAgentConfig.list(),
          base44.entities.Deck.list("-created_date", 500)
        ]);
        if (cancelled) return;
        setDecks(Array.isArray(allDecks) ? allDecks : []);
        if (configs && configs.length) {
          const cfg = configs[0];
          if (Array.isArray(cfg.deck_ids)) setSelectedDeckIds(cfg.deck_ids);
          if (cfg.agent_id && !agentId) setAgentId(cfg.agent_id);
        }
      } catch (e) {
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    try {
      if (agentId) localStorage.setItem("did_live_agent_id", agentId);
    } catch (_) {}
    // Persist to DidAgentConfig (create or update singleton)
    try {
      const existing = await base44.entities.DidAgentConfig.list();
      if (existing && existing.length) {
        await base44.entities.DidAgentConfig.update(existing[0].id, { agent_id: agentId, deck_ids: selectedDeckIds });
      } else {
        await base44.entities.DidAgentConfig.create({ agent_id: agentId, deck_ids: selectedDeckIds });
      }
    } catch (_) {}
    mountScript();
  };

  const toggleDeck = (id) => {
    setSelectedDeckIds((prev) => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
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
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs text-white/70 mb-1">Agent ID</label>
              <Input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="v2_agt_..."
                className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Curated Decks</label>
              <Input
                placeholder="Search decks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2 bg-black/30 border-white/20 text-white placeholder:text-white/50"
              />
              <div className="rounded-md border border-white/10 bg-black/20">
                <ScrollArea className="h-56 p-2">
                  {decks
                    .filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()))
                    .map(d => (
                      <label key={d.id} className="flex items-center gap-2 py-1.5 px-1 hover:bg-white/5 rounded">
                        <Checkbox
                          checked={selectedDeckIds.includes(d.id)}
                          onCheckedChange={() => toggleDeck(d.id)}
                        />
                        <span className="text-sm truncate">{d.name || 'Untitled Deck'}</span>
                        <span className="ml-auto text-[10px] text-white/40">{String(d.id).slice(0,6)}…</span>
                      </label>
                    ))}
                  {decks.length === 0 && (
                    <div className="text-white/60 text-sm">No decks found.</div>
                  )}
                </ScrollArea>
              </div>
            </div>
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

        {/* Preview warning + Target container for D-ID Agent embed */}
        {inPreview && (
          <div className="w-full mb-3 bg-amber-500/10 border border-amber-500/40 text-amber-200 rounded-lg p-3">
            Live Agent can’t run inside the builder preview (iframe). Use the published app or open this page in a new tab.
            <div className="mt-2">
              <Button
                variant="outline"
                className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                onClick={() => window.open(window.location.href, '_blank')}
              >
                Open in new tab
              </Button>
            </div>
          </div>
        )}
        <div
          id="did-agent-container"
          className="w-full aspect-video bg-black/30 border border-white/10 rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}