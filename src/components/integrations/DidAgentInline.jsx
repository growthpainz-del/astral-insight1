import React, { useEffect, useMemo, useRef } from "react";
import { getDidEmbedConfig } from "@/functions/getDidEmbedConfig";
import { base44 } from "@/api/base44Client";

export default function DidAgentInline({ mode = 'inline', position = 'right', orientation = 'horizontal', name = 'did-agent', forceInPreview = false, clientKey: clientKeyProp, agentId: agentIdProp, targetId: targetIdProp } = {}) {
  const mountIdRef = useRef(targetIdProp || `did-agent-root-${Math.random().toString(36).slice(2)}`);
  const [attempt, setAttempt] = React.useState(0);
  const hasFlushedRef = useRef(false);

  useEffect(() => {
    console.log('[D-ID] DidAgentInline mounted', { forceInPreview, name, mode, position, orientation });
    const inPreview = (() => { try { return window.top !== window.self; } catch (_) { return true; } })();
    console.log('[D-ID] Inline preview detection', { inPreview, forceInPreview });
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
        const payload = { allowed_domains: origin ? [origin] : [] };
        let res;
        try {
          res = await getDidEmbedConfig(payload);
        } catch (e) {
          console.warn('[D-ID] getDidEmbedConfig direct import failed, will fallback to functions.invoke', e?.message);
        }
        if (!res || res?.status >= 400 || !res?.data) {
          try {
            res = await base44.functions.invoke('getDidEmbedConfig', payload);
          } catch (e) {
            console.error('[D-ID] base44.functions.invoke(getDidEmbedConfig) failed:', e?.message);
          }
        }
        const cfg = res?.data || {};
        const clientKey = clientKeyProp || cfg.client_key;
        const agentId = agentIdProp || cfg.agent_id;
        if (!clientKey || !agentId) {
          console.warn('[D-ID] Missing client key or agent id');
          try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch(_) {}
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
        scriptEl.setAttribute('data-target', `#${mountIdRef.current}`);

        const onReady = () => {
          try {
            // Verify actual widget mount before signaling ready
            const mount = document.getElementById(mountIdRef.current);
            const hasContent = !!mount?.querySelector('iframe, video, canvas, div[id^="did-"], div[id^="agent-"]');
            if (hasContent) {
              window.dispatchEvent(new CustomEvent('did-agent-ready', { detail: { name } }));
            } else {
              // Some browsers load the script before the agent attaches; re-check shortly
              setTimeout(() => {
                const m2 = document.getElementById(mountIdRef.current);
                const ok = !!m2?.querySelector('iframe, video, canvas, div[id^="did-"], div[id^="agent-"]');
                window.dispatchEvent(new CustomEvent(ok ? 'did-agent-ready' : 'did-agent-error', { detail: { name } }));
                if (!ok && !hasFlushedRef.current) {
                  hasFlushedRef.current = true;
                  try { base44.functions.invoke('flushDidKeyCache', { origin: origin || window.location.origin }); } catch(_) {}
                  setTimeout(() => setAttempt(a => a + 1), 0);
                }
              }, 1200);
            }
          } catch(_) {}
        };
        const onError = () => {
          try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch(_) {}
          if (!hasFlushedRef.current) {
            hasFlushedRef.current = true;
            try { base44.functions.invoke('flushDidKeyCache', { origin: origin || window.location.origin }); } catch(_) {}
            setTimeout(() => setAttempt(a => a + 1), 0);
          }
        };
        scriptEl.addEventListener('load', onReady);
        scriptEl.addEventListener('error', onError);

        document.body.appendChild(scriptEl);

        // Safety: notify error if widget didn't attach within 12s (iOS Safari can be slower)
        timeoutId = setTimeout(() => {
          const mount = document.getElementById(mountIdRef.current);
          const hasContent = !!mount?.querySelector('iframe, video, canvas, div[id^="did-"], div[id^="agent-"]');
          if (!hasContent) {
            console.warn('[D-ID] Timeout waiting for widget mount; forcing retry');
            onError();
          }
        }, 12000);
      } catch (e) {
        console.error('[D-ID] Failed to initialize agent', e);
        try { window.dispatchEvent(new CustomEvent('did-agent-error', { detail: { name } })); } catch (_) {}
      }
    })();

    return () => {
      try { if (timeoutId) clearTimeout(timeoutId); } catch (_) {}
      try { if (scriptEl) scriptEl.remove(); } catch (_) {}
    };
  }, [mode, position, orientation, name, forceInPreview, clientKeyProp, agentIdProp, attempt]);

  return (
    <div id={mountIdRef.current} style={{ width: '100%', height: '100%' }} />
  );
}