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
    const ttlSeconds = typeof payload.ttlSeconds === 'number' ? payload.ttlSeconds : 3600; // 1 hour default
    const allowOrigin = payload.allowOrigin || req.headers.get('origin') || undefined;

    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'D-ID API credentials not set' }, { status: 500 });
    }

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    const res = await fetch('https://api.d-id.com/agents/client-key', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        ttlSeconds,
        ...(allowOrigin ? { allowOrigin } : {}),
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