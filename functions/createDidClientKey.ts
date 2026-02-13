import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Creates a new D-ID Agents client key for browser use and returns the created key
// Body: { allowedDomains: string[] }
// Notes:
// - Requires admin user
// - Uses DID_API_KEY and DID_API_SECRET from environment
// - On success, performs a GET to return { allowed_domains, client_key }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    let payload: any = {};
    try { payload = await req.json(); } catch (_) {}

    const allowedDomains: string[] = Array.isArray(payload?.allowedDomains)
      ? payload.allowedDomains.filter((d: unknown) => typeof d === 'string' && d.startsWith('http'))
      : [];

    // Best-effort fallback to request origin/referrer domain if not provided
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    if (allowedDomains.length === 0 && origin) {
      // Keep full origin (scheme + host[:port]) as required by API
      allowedDomains.push(origin.replace(/\/$/, ''));
    }

    if (allowedDomains.length === 0) {
      return Response.json({ error: 'allowedDomains is required (e.g., ["https://your-app.example"])' }, { status: 400 });
    }

    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'D-ID API credentials not set (DID_API_KEY, DID_API_SECRET)' }, { status: 500 });
    }

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // Create the client key
    const createRes = await fetch('https://api.d-id.com/agents/client-key', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ allowed_domains: allowedDomains }),
    });

    // If key already exists, surface a friendly message but continue to fetch it
    if (!createRes.ok && createRes.status !== 400) {
      const err = await createRes.json().catch(() => null);
      console.error('[createDidClientKey] D-ID create error', createRes.status, err);
      return Response.json({ error: err?.description || err?.message || 'Failed to create client key' }, { status: createRes.status });
    }

    // Fetch the key details (allowed_domains + client_key)
    const getRes = await fetch('https://api.d-id.com/agents/client-key', {
      method: 'GET',
      headers: {
        'Authorization': basicAuth,
        'accept': 'application/json',
      },
    });

    const data = await getRes.json().catch(() => null);
    if (!getRes.ok) {
      console.error('[createDidClientKey] D-ID fetch error', getRes.status, data);
      // If creation succeeded but fetch failed, still communicate partial success
      return Response.json({ error: data?.description || data?.message || 'Failed to fetch client key after creation' }, { status: getRes.status });
    }

    return Response.json({
      allowed_domains: data?.allowed_domains || allowedDomains,
      client_key: data?.client_key || null,
      note: createRes.status === 400 ? 'Client key already existed; returned existing key.' : 'Client key created successfully.',
    });
  } catch (error) {
    console.error('[createDidClientKey] Fatal error', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});