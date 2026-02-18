import React, { useEffect, useRef } from "react";

export default function DidAgentEmbed({ agentId, clientKey, mode = "full", targetId = "did-agent-embed", name = "did-agent" }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    // Remove previous script if any
    try {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    } catch (_) {}

    // Clear target container to avoid duplicate embeds
    try {
      const target = document.getElementById(targetId);
      if (target) target.innerHTML = "";
    } catch (_) {}

    const id = agentId || (typeof localStorage !== 'undefined' && localStorage.getItem('did_live_agent_id')) || "v2_agt_hF1S2XwN";
    const key = clientKey || (typeof localStorage !== 'undefined' && localStorage.getItem('did_client_key')) || "Z29vZ2xlLW9hdXRoMnwxMTU4Mjg4NTQ2NzM5OTExMjUyOTQ6UXpvMjZoZWFxd3ZSa3lXSmpvMHlM";

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";
    script.setAttribute("data-mode", mode);
    script.setAttribute("data-client-key", key);
    script.setAttribute("data-agent-id", id);
    script.setAttribute("data-name", name);
    script.setAttribute("data-monitor", "true");
    script.setAttribute("data-target-id", targetId);

    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      try {
        if (scriptRef.current) {
          document.body.removeChild(scriptRef.current);
        }
      } catch (_) {}
    };
  }, [agentId, clientKey, mode, targetId, name]);

  return (
    <div id={targetId} className="w-full aspect-video bg-black/30 border border-white/10 rounded-xl overflow-hidden" />
  );
}