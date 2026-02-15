import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { encodeBase64 } from 'jsr:@std/encoding@1.0.5/base64';

// In-memory per-origin client key cache (12h TTL)
const TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const clientKeyCache = new Map(); // origin => { key, expiresAt }

function normalizeOrigin(value) {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`; // exact origin incl. port
  } catch (_) {
    return null;
  }
}

function nowMs() { return Date.now(); }

function getCachedKeyFor(origin) {
  const entry = origin ? clientKeyCache.get(origin) : null;
  if (entry && entry.expiresAt > nowMs()) return entry.key;
  if (entry) clientKeyCache.delete(origin);
  return null;
}

function cacheKeyForOrigins(origins, key) {
  const expiresAt = nowMs() + TTL_MS;
  origins.forEach((o) => { if (o) clientKeyCache.set(o, { key, expiresAt }); });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth optional: allow public embed fetch; SDK still available if needed

    let body = {};
    try { body = await req.json(); } catch (_) {}

    const originHeader = req.headers.get('origin') || null;
    const primaryOrigin = originHeader ? normalizeOrigin(originHeader) : null;

    const bodyDomains = Array.isArray(body?.allowed_domains)
      ? body.allowed_domains.map(normalizeOrigin).filter(Boolean)
      : [];

    const extraOrigins = [
      primaryOrigin,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://builder.base44.app',
      'https://app.base44.app',
    ].filter(Boolean);

    const allowedDomainsSet = new Set([...bodyDomains, ...extraOrigins]);
    const allowedDomains = Array.from(allowedDomainsSet);


    const agentId = Deno.env.get('DID_AGENT_ID');
    if (!agentId) {
      return Response.json({ error: 'D-ID Agent ID not set' }, { status: 500 });
    }

    // Always create a domain-scoped client key for the current origin to avoid whitelist mismatches
    const apiKey = Deno.env.get('API_USERNAME') || Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('API_PASSWORD') || Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      // Fallback: if API creds are missing, try returning a pre-set client key (if provided)
      const clientKeyFromEnv = Deno.env.get('DID_CLIENT_KEY');
      if (clientKeyFromEnv) {
        return Response.json({ client_key: clientKeyFromEnv, agent_id: agentId });
      }
      return Response.json({ error: 'D-ID API credentials not set (API_USERNAME/API_PASSWORD or DID_API_KEY/DID_API_SECRET)' }, { status: 500 });
    }

    if (!allowedDomains.length) {
      return Response.json({ error: 'allowed_domains is required or call from a browser so Origin can be used' }, { status: 400 });
    }

    const basicAuth = 'Basic ' + encodeBase64(new TextEncoder().encode(`${apiKey}:${apiSecret}`));

    // Use cached key if available for this origin
    const cacheLookupOrigin = primaryOrigin || allowedDomains[0] || null;
    const cachedKey = getCachedKeyFor(cacheLookupOrigin);
    if (cachedKey) {
      return Response.json({ client_key: cachedKey, agent_id: agentId, cached: true });
    }

    const resp = await fetch('https://api.d-id.com/agents/client-key', {
      method: 'POST',
      headers: {
        Authorization: basicAuth,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ allowed_domains: allowedDomains }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[getDidEmbedConfig] D-ID error', resp.status, data);
      // Fallback to pre-configured client key if available
      const clientKeyFromEnv = Deno.env.get('DID_CLIENT_KEY');
      if (clientKeyFromEnv) {
        console.warn('[getDidEmbedConfig] Falling back to DID_CLIENT_KEY from env');
        return Response.json({ client_key: clientKeyFromEnv, agent_id: agentId });
      }
      return Response.json({ error: data?.message || 'Failed to create client key' }, { status: resp.status });
    }

    const clientKey = data?.client_key || data?.key || null;
    if (!clientKey) {
      return Response.json({ error: 'No client key returned' }, { status: 502 });
    }

    // Cache this key for all listed origins
    cacheKeyForOrigins(allowedDomains, clientKey);

    return Response.json({ client_key: clientKey, agent_id: agentId });
  } catch (error) {
    console.error('[getDidEmbedConfig] Fatal error', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});