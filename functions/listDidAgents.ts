import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isPro = ['oracle_pro', 'creator'].includes(String(user?.subscription_tier || '').toLowerCase());
      if (!(user.role === 'admin' || isPro)) return Response.json({ error: 'Forbidden: Requires Pro or Admin' }, { status: 403 });

    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'Missing DID_API_KEY or DID_API_SECRET' }, { status: 500 });
    }

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // Fetch agents list
    const res = await fetch('https://api.d-id.com/agents', {
      headers: {
        'Authorization': basicAuth,
        'accept': 'application/json'
      }
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Surface clear error to the UI
      return Response.json({
        error: data?.message || data?.error || 'Failed to list agents',
        status: res.status
      }, { status: res.status });
    }

    // Normalize list shape: API may return {items: [...]} or [...]
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);

    const agents = items.map((a) => ({
      id: a?.id || a?._id || a?.agent_id || null,
      name: a?.name || a?.title || 'Untitled Agent',
      created_at: a?.created_at || a?.createdAt || null,
      updated_at: a?.updated_at || a?.updatedAt || null,
      status: a?.status || null
    })).filter(a => a.id);

    return Response.json({ count: agents.length, agents });
  } catch (error) {
    console.error('[listDidAgents] Fatal', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});