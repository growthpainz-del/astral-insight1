import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch (_) {}

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const { agentId } = await req.json().catch(() => ({}));
    if (!agentId) {
      return Response.json({ error: 'agentId is required' }, { status: 400 });
    }

    const authHeader = 'Basic ' + btoa(apiKey);
    const url = `https://api.d-id.com/agents/${encodeURIComponent(agentId)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data?.error || 'Failed to fetch agent', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
});