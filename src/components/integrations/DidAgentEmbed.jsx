import React, { useEffect } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";

export default function DidAgentEmbed() {
  useEffect(() => {
    if (document.getElementById("did-agent-loader")) return;

    (async () => {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
        const res = await getDidEmbedConfig({ allowed_domains: origin ? [origin] : [] });
        if (res?.status === 401) {
          console.warn('[D-ID] Unauthorized when fetching embed config');
          return;
        }
        const cfg = res?.data;
        if (!cfg?.client_key || !cfg?.agent_id) {
          console.warn('[D-ID] Missing client key or agent id');
          return;
        }

        const script = document.createElement("script");
        script.id = "did-agent-loader";
        script.type = "module";
        script.src = "https://agent.d-id.com/v2/index.js";

        script.setAttribute("data-mode", "fabio");
        script.setAttribute("data-client-key", cfg.client_key);
        script.setAttribute("data-agent-id", cfg.agent_id);
        script.setAttribute("data-name", "did-agent");
        script.setAttribute("data-monitor", "true");
        script.setAttribute("data-orientation", "horizontal");
        script.setAttribute("data-position", "right");

        script.onload = () => console.log("[D-ID] Agent ready");
        script.onerror = () => console.error("[D-ID] Agent script failed to load");

        document.body.appendChild(script);
      } catch (e) {
        console.error('[D-ID] Failed to initialize agent', e);
      }
    })();
  }, []);

  return null;
}