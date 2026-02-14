import React, { useEffect } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";

export default function DidAgentEmbed() {
  useEffect(() => {
    // If inside the Builder preview iframe, show a small hint and skip loading (3P widgets often block iframes)
    const inPreview = (() => { try { return window.top !== window.self; } catch (_) { return true; } })();
    if (inPreview) {
      if (!document.getElementById('did-agent-preview-hint')) {
        const hint = document.createElement('div');
        hint.id = 'did-agent-preview-hint';
        hint.style.position = 'fixed';
        hint.style.right = '16px';
        hint.style.bottom = '96px';
        hint.style.zIndex = '2147483647';
        hint.style.background = 'rgba(0,0,0,0.75)';
        hint.style.backdropFilter = 'blur(6px)';
        hint.style.border = '1px solid rgba(255,255,255,0.2)';
        hint.style.borderRadius = '12px';
        hint.style.padding = '10px 12px';
        hint.style.color = 'white';
        hint.style.fontSize = '12px';
        hint.style.display = 'flex';
        hint.style.alignItems = 'center';
        hint.style.gap = '8px';
        hint.textContent = 'D-ID agent hidden in preview. Open app in a new tab to see it.';
        const btn = document.createElement('button');
        btn.textContent = 'Open';
        btn.style.background = '#7c3aed';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '999px';
        btn.style.padding = '6px 10px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => { try { window.open(window.location.href, '_blank'); } catch (_) {} };
        hint.appendChild(btn);
        document.body.appendChild(hint);
      }
      return;
    }

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