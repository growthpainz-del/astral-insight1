import React, { useEffect } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";

export default function DidAgentEmbed({ mode = 'full', targetId, position = 'right', orientation = 'horizontal', name = 'did-agent', forceInPreview = false, clientKey: clientKeyProp, agentId: agentIdProp } = {}) {
  useEffect(() => {
    // If inside the Builder preview iframe, show a small hint and skip loading (3P widgets often block iframes)
    const inPreview = (() => { try { return window.top !== window.self; } catch (_) { return true; } })();
    if (inPreview && !forceInPreview) {
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

    const existing = document.getElementById("did-agent-loader");
    if (existing) existing.remove();

    (async () => {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
        const res = await getDidEmbedConfig({ allowed_domains: origin ? [origin] : [] });
        if (res?.status === 401) {
        console.warn('[D-ID] Unauthorized when fetching embed config; falling back to provided props.');
        }
        const cfg = res?.data || {};
        const clientKey = clientKeyProp || cfg.client_key;
        const agentId = agentIdProp || cfg.agent_id;
        if (!clientKey || !agentId) {
          console.warn('[D-ID] Missing client key or agent id');
          return;
        }

        const script = document.createElement("script");
        script.id = "did-agent-loader";
        script.type = "module";
        script.src = "https://agent.d-id.com/v2/index.js";

        script.setAttribute("data-mode", mode);
        script.setAttribute("data-client-key", clientKey);
        script.setAttribute("data-agent-id", agentId);
        script.setAttribute("data-name", name);
        script.setAttribute("data-monitor", "true");
        script.setAttribute("data-orientation", orientation);
        script.setAttribute("data-position", position);
        if (targetId) script.setAttribute("data-target-id", targetId);

        script.onload = () => {
          console.log("[D-ID] Agent ready");
          try { window.dispatchEvent(new CustomEvent('did-agent-ready', { detail: { name } })); } catch (_) {}
        };
        script.onerror = () => {
          console.error("[D-ID] Agent script failed to load");
          try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch (_) {}
        };

        document.body.appendChild(script);
      } catch (e) {
        console.error('[D-ID] Failed to initialize agent', e);
      }
    })();
  }, []);

  return null;
}