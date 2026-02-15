import React, { useEffect, useState, useRef } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";

export default function DidAgentEmbed({ mode = 'full', targetId, position = 'right', orientation = 'horizontal', name = 'did-agent', forceInPreview = false, clientKey: clientKeyProp, agentId: agentIdProp } = {}) {
  const [srcDoc, setSrcDoc] = useState("");
  const frameRef = useRef(null);
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

    // Build an iframe srcDoc that loads the agent in isolation (frame mode)
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

        const html = `<!doctype html>
    <html>
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>html,body{height:100%;margin:0;background:#000}#agent-root{position:fixed;inset:0}</style>
    </head>
    <body>
    <div id="agent-root"></div>
    <script type="module" id="did-agent-loader"
      src="https://agent.d-id.com/v2/index.js"
      data-mode="${mode}"
      data-client-key="${clientKey}"
      data-agent-id="${agentId}"
      data-name="${name}"
      data-monitor="true"
      data-orientation="${orientation}"
      data-position="${position}"
      data-target-id="agent-root"
    ></script>
    <script>
      (function(){
        const s = document.getElementById('did-agent-loader');
        function send(type){ try{ parent.postMessage({ type, name: ${JSON.stringify(name)} }, '*'); } catch(_){} }
        s.addEventListener('load', () => send('did-agent-ready'));
        s.addEventListener('error', () => send('did-agent-error'));
      })();
    </script>
    </body>
    </html>`;
        setSrcDoc(html);
      } catch (e) {
        console.error('[D-ID] Failed to initialize agent', e);
        try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch (_) {}
      }
    })();
  }, []);

  return null;
}