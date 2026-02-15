import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { encodeBase64 } from 'jsr:@std/encoding@1.0.5/base64';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isPro = ['oracle_pro', 'creator'].includes(String(user?.subscription_tier || '').toLowerCase());
    if (!(user.role === 'admin' || isPro)) {
      return Response.json({ error: 'Forbidden: Requires Pro or Admin' }, { status: 403 });
    }

    let payload = {};
    try { payload = await req.json(); } catch (_) {}

    const agentId = payload?.id || payload?.agent_id || null;
    const method = agentId ? 'PATCH' : 'POST';

    // Prepare body for D-ID: don't send id fields inside the body
    const bodyToSend = { ...payload };
    delete bodyToSend.id;
    delete bodyToSend.agent_id;

    const username = Deno.env.get('API_USERNAME') || Deno.env.get('DID_API_KEY');
    const password = Deno.env.get('API_PASSWORD') || Deno.env.get('DID_API_SECRET');
    if (!username || !password) {
      return Response.json({ error: 'Missing API credentials: set API_USERNAME and API_PASSWORD (or DID_API_KEY and DID_API_SECRET)' }, { status: 500 });
    }

    const basicAuth = 'Basic ' + encodeBase64(new TextEncoder().encode(`${username}:${password}`));
    const url = agentId
      ? `https://api.d-id.com/agents/${encodeURIComponent(agentId)}`
      : 'https://api.d-id.com/agents';

    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: basicAuth,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(bodyToSend || {}),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[upsertDidAgent] D-ID error', resp.status, data);
      return Response.json({ error: data?.message || 'D-ID API error', status: resp.status, details: data }, { status: resp.status });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('[upsertDidAgent] Fatal error', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});