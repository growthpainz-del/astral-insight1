import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // App may be public; try to get user but don't require auth
    try { await base44.auth.me(); } catch (_) {}

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const { preview_name, presenter_id, voice_provider, voice_id, instructions } = await req.json().catch(() => ({}));

    const body = {
      preview_name: preview_name || 'Base44 Demo Agent',
      presenter: {
        type: 'clip',
        presenter_id: presenter_id || 'v2_public_Amber@0zSz8kflCN',
        voice: {
          type: voice_provider || 'microsoft',
          voice_id: voice_id || 'en-US-JennyMultilingualV2Neural'
        }
      }
      // Intentionally omitting the `llm` block to use D-ID default/basic replies
    };

    const authHeader = 'Basic ' + btoa(apiKey);

    const res = await fetch('https://api.d-id.com/agents', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data?.error || 'Failed to create agent', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
});