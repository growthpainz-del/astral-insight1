import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public app: don't require auth
    try { await base44.auth.me(); } catch (_) {}

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const { agentId, llm_provider, llm_model, llm_temperature, user_data, instructions } = await req.json().catch(() => ({}));
    if (!agentId) {
      return Response.json({ error: 'agentId is required' }, { status: 400 });
    }

    const body = {
      llm: {
        provider: llm_provider || 'openai',
        model: llm_model || 'gpt-4.1-nano',
        ...(typeof llm_temperature === 'number' ? { temperature: llm_temperature } : {})
      }
    };

    const authHeader = 'Basic ' + btoa(apiKey);

    const res = await fetch(`https://api.d-id.com/agents/${encodeURIComponent(agentId)}` , {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data?.error || 'Failed to update agent', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});