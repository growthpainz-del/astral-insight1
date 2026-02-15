import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { encodeBase64 } from 'jsr:@std/encoding@1.0.5/base64';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth optional: allow public embed fetch; SDK still available if needed

    let body = {};
    try { body = await req.json(); } catch (_) {}

    const origin = req.headers.get('origin') || null;
    const allowedDomains = Array.isArray(body?.allowed_domains) && body.allowed_domains.length
      ? body.allowed_domains
      : (origin ? [origin] : []);

    const agentId = Deno.env.get('DID_AGENT_ID');
    if (!agentId) {
      return Response.json({ error: 'D-ID Agent ID not set' }, { status: 500 });
    }

    // Always create a domain-scoped client key for the current origin to avoid whitelist mismatches
    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      // Fallback: if API creds are missing, try returning a pre-set client key (if provided)
      const clientKeyFromEnv = Deno.env.get('DID_CLIENT_KEY');
      if (clientKeyFromEnv) {
        return Response.json({ client_key: clientKeyFromEnv, agent_id: agentId });
      }
      return Response.json({ error: 'D-ID API credentials not set' }, { status: 500 });
    }

    if (!allowedDomains.length) {
      return Response.json({ error: 'allowed_domains is required or call from a browser so Origin can be used' }, { status: 400 });
    }

    const basicAuth = 'Basic ' + encodeBase64(new TextEncoder().encode(`${apiKey}:${apiSecret}`));

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
      return Response.json({ error: data?.message || 'Failed to create client key' }, { status: resp.status });
    }

    const clientKey = data?.client_key || data?.key || null;
    if (!clientKey) {
      return Response.json({ error: 'No client key returned' }, { status: 502 });
    }

    return Response.json({ client_key: clientKey, agent_id: agentId });
  } catch (error) {
    console.error('[getDidEmbedConfig] Fatal error', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});