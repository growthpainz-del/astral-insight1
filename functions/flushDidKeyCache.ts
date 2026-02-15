import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function toggles the in-memory cache in getDidEmbedConfig by sending a control message.
// Since serverless instances may be ephemeral, we best-effort invalidate by touching getDidEmbedConfig
// and asking it to clear its map for the given origin (or all).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const origin = typeof body.origin === 'string' ? body.origin : null;

    // Call getDidEmbedConfig with a special header so it knows to clear cache
    const url = new URL(req.url);
    const base = url.origin + '/functions/getDidEmbedConfig';

    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-flush-cache': origin || '*' },
      body: JSON.stringify({ allowed_domains: [] })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return Response.json({ error: 'Failed to signal cache flush', status: res.status, details: data }, { status: res.status });
    }

    return Response.json({ success: true, flushed: origin || 'all' });
  } catch (error) {
    console.error('[flushDidKeyCache] Fatal error', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});