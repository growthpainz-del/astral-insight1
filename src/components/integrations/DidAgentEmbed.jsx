import React, { useEffect, useState, useRef } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";
import { base44 } from "@/api/base44Client";

export default function DidAgentEmbed({ mode = 'full', targetId, position = 'right', orientation = 'horizontal', name = 'did-agent', forceInPreview = false, clientKey: clientKeyProp, agentId: agentIdProp } = {}) {
  const [srcDoc, setSrcDoc] = useState("");
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
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
      let timeoutId;
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
        console.log('[D-ID] init start', { origin });
        const payload = { allowed_domains: origin ? [origin] : [] };

        // Hard timeout as a safety net
        timeoutId = setTimeout(() => {
          console.error('[D-ID] Initialization timeout');
          setError('Live Agent timed out while initializing. Please Retry.');
        }, 8000);

        let res;
        try {
          res = await getDidEmbedConfig(payload);
        } catch (e) {
          console.warn('[D-ID] getDidEmbedConfig import call failed, falling back to functions.invoke', e?.message);
        }
        if (!res || res?.status >= 400 || !res?.data) {
          try {
            res = await base44.functions.invoke('getDidEmbedConfig', payload);
          } catch (e) {
            console.error('[D-ID] base44.functions.invoke fallback failed', e?.message);
          }
        }
        if (!res || !res.data) {
          setError('Live Agent unavailable: could not fetch embed configuration.');
          return;
        }
        const cfg = res.data || {};
        const clientKey = clientKeyProp || cfg.client_key;
        const agentId = agentIdProp || cfg.agent_id;

        const mask = (k) => (k && k.length > 12 ? (String(k).slice(0,8) + '…' + String(k).slice(-4)) : k);
        console.log('[D-ID] Embed config:', {
          origin,
          agentId,
          clientKey_masked: mask(clientKey || ''),
          from_cache: cfg?.cached === true
        });

        if (!clientKey || !agentId) {
          console.error('[D-ID] Missing client key or agent id');
          setError('Live Agent unavailable: missing configuration (client key or agent id).');
          return;
        }

        // Validate client key shape (avoid passing user IDs like google-oauth2|...)
        const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(String(clientKey));
        if (String(clientKey).includes('google-oauth2') || String(clientKey).length < 40 || !looksBase64) {
          const masked = mask(clientKey || '');
          console.error('[D-ID] Invalid client key detected:', masked, { agentId, origin });
          setError('Invalid D-ID client key detected (looks like a user/session ID). Please contact support to fix configuration.');
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
        if (timeoutId) clearTimeout(timeoutId);
      } catch (e) {
        console.error('[D-ID] Failed to initialize agent', e);
        setError('Live Agent failed to initialize. See console for details.');
        try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch (_) {}
      }
    })();
  }, [attempt]);

  // Listen for agent ready/error messages from the iframe
  useEffect(() => {
    const onMessage = (e) => {
      const d = e?.data;
      if (!d || typeof d !== 'object') return;
      if (d.name !== name) return;
      if (d.type === 'did-agent-ready') {
        console.log('[D-ID] Agent ready event received for', name);
        setError(null);
      } else if (d.type === 'did-agent-error') {
        console.error('[D-ID] Agent error event received for', name);
        setError('Live Agent failed to initialize. Please Retry or open in a new tab.');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [name]);

  // Render inside an iframe (frame mode) or an inline error UI
  if (error) {
    return (
      <div style={{
        padding: '16px',
        background: '#fff3cd',
        border: '1px solid #ffeeba',
        borderRadius: '8px',
        color: '#856404',
        textAlign: 'center'
      }}>
        <strong>Live Agent Unavailable</strong>
        <div style={{ marginTop: 6 }}>{error}</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          If you're in preview, try “Open in new tab”. Check console for details.
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            onClick={() => { try { setError(null); setSrcDoc(''); setAttempt((a) => a + 1); } catch(_) {} }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d39e00', background: '#ffe08a', color: '#7a5b00', cursor: 'pointer' }}
          >Retry</button>
          <button
            onClick={() => { try { window.open(window.location.href, '_blank'); } catch(_) {} }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #7c3aed', background: '#7c3aed', color: '#fff', cursor: 'pointer' }}
          >Open in new tab</button>
        </div>
      </div>
    );
  }

  if (!srcDoc) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0b0c10', color: '#9ca3af', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <span>Initializing Live Agent…</span>
      </div>
    );
  }

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