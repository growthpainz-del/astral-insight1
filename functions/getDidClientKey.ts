import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional payload overrides
    let payload = {};
    try { payload = await req.json(); } catch (_) {}
    const ttlSeconds = typeof payload.ttlSeconds === 'number' ? payload.ttlSeconds : undefined; // optional per API
    const allowOrigin = payload.allowOrigin || req.headers.get('origin') || undefined;
    const allowedDomains = Array.isArray(payload.allowed_domains)
      ? payload.allowed_domains
      : (allowOrigin ? [allowOrigin] : []);

    const apiKey = Deno.env.get('API_USERNAME') || Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('API_PASSWORD') || Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'D-ID API credentials not set (API_USERNAME/API_PASSWORD or DID_API_KEY/DID_API_SECRET)' }, { status: 500 });
    }

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // Ensure we have at least one allowed domain (use Origin or provided list)
    if (!allowedDomains.length) {
      return Response.json({ error: 'allowed_domains is required: provide an array of domains, or call from a browser so Origin can be used' }, { status: 400 });
    }

    const res = await fetch('https://api.d-id.com/agents/client-key', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        allowed_domains: allowedDomains,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('[getDidClientKey] D-ID error', res.status, data);
      return Response.json({ error: data?.message || 'Failed to create client key' }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[getDidClientKey] Fatal error', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});