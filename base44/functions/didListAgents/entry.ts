import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const authHeader = 'Basic ' + btoa(apiKey);

    const res = await fetch('https://api.d-id.com/agents', {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data?.error || 'Failed to list agents', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});