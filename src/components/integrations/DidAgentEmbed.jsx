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
        const pickValid = (k) => (typeof k === 'string' && k.length >= 40 && !k.includes('google-oauth2'));
        const resolvedClientKey =
          (pickValid(clientKeyProp) ? clientKeyProp : null) ||
          (pickValid(cfg.client_key) ? cfg.client_key : null);
        const agentId = agentIdProp || cfg.agent_id;
        if (!resolvedClientKey || !agentId) {
          console.warn('[D-ID] Invalid/missing client key or agent id', {
            origin,
            topOrigin: (function(){ try { return window.top?.location?.origin; } catch(_) { return 'cross-origin'; }})(),
            providedClientKey: clientKeyProp,
            cfgClientKeyLen: typeof cfg?.client_key === 'string' ? cfg.client_key.length : null
          });
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
      data-client-key="${resolvedClientKey}"
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
        const onReady = () => send('did-agent-ready');
        const onError = () => send('did-agent-error');
        s.addEventListener('load', onReady);
        s.addEventListener('error', onError);
        // Safety: notify parent if nothing renders after 6s
        setTimeout(() => {
          const hasIframeContent = !!document.querySelector('#agent-root iframe, #agent-root video, #agent-root canvas');
          if (!hasIframeContent) onError();
        }, 6000);
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

  // Render inside an iframe (frame mode)
  return (
    <iframe
      ref={frameRef}
      title={name}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation allow-downloads"
      allow="autoplay; microphone; camera; clipboard-write; encrypted-media; fullscreen; picture-in-picture; display-capture"
      style={{ width: '100%', height: '100%', border: '0', display: srcDoc ? 'block' : 'none', backgroundColor: '#000' }}
      allowFullScreen
    />
  );
}