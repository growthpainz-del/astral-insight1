import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public app: proceed even if unauthenticated
    try { await base44.auth.me(); } catch (_) {}

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      console.error('[didCreateKnowledge] Missing D_ID_API_KEY');
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const { name, description } = await req.json().catch(() => ({}));
    if (!name) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }

    const res = await fetch('https://api.d-id.com/knowledge', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey),
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[didCreateKnowledge] Error', res.status, data);
      return Response.json({ error: data?.error || 'Failed to create knowledge', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[didCreateKnowledge] Unexpected', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});