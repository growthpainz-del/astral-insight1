import React, { useEffect, useMemo, useRef } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";

export default function DidAgentInline({ mode = 'full', position = 'right', orientation = 'horizontal', name = 'did-agent', forceInPreview = false, clientKey: clientKeyProp, agentId: agentIdProp, targetId: targetIdProp } = {}) {
  const mountIdRef = useRef(targetIdProp || `did-agent-root-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
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

    let timeoutId;
    let scriptEl;

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
          window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } }));
          return;
        }

        scriptEl = document.createElement('script');
        scriptEl.type = 'module';
        scriptEl.id = `did-agent-loader-inline-${name}`;
        scriptEl.src = 'https://agent.d-id.com/v2/index.js';
        scriptEl.setAttribute('data-mode', mode);
        scriptEl.setAttribute('data-client-key', clientKey);
        scriptEl.setAttribute('data-agent-id', agentId);
        scriptEl.setAttribute('data-name', name);
        scriptEl.setAttribute('data-monitor', 'true');
        scriptEl.setAttribute('data-orientation', orientation);
        scriptEl.setAttribute('data-position', position);
        scriptEl.setAttribute('data-target-id', mountIdRef.current);

        const onReady = () => { try { window.dispatchEvent(new CustomEvent('did-agent-ready', { detail: { name } })); } catch(_) {} };
        const onError = () => { try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch(_) {} };
        scriptEl.addEventListener('load', onReady);
        scriptEl.addEventListener('error', onError);

        document.body.appendChild(scriptEl);

        // Safety: notify error if widget didn't attach within 6s
        timeoutId = setTimeout(() => {
          const mount = document.getElementById(mountIdRef.current);
          const hasContent = !!mount?.querySelector('iframe, video, canvas');
          if (!hasContent) onError();
        }, 6000);
      } catch (e) {
        console.error('[D-ID] Failed to initialize agent', e);
        try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch (_) {}
      }
    })();

    return () => {
      try { if (timeoutId) clearTimeout(timeoutId); } catch (_) {}
      try { if (scriptEl) scriptEl.remove(); } catch (_) {}
    };
  }, [mode, position, orientation, name, forceInPreview, clientKeyProp, agentIdProp]);

  return (
    <div id={mountIdRef.current} style={{ width: '100%', height: '100%' }} />
  );
}