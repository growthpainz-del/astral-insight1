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

    const { agentId, llm_provider, llm_model, llm_temperature, user_data, instructions } = await req.json().catch(() => ({}));
    if (!agentId) {
      return Response.json({ error: 'agentId is required' }, { status: 400 });
    }

    const body = {};
    const llm = {};
    if (llm_provider) llm.provider = llm_provider;
    if (llm_model) llm.model = llm_model;
    if (typeof llm_temperature === 'number') llm.temperature = llm_temperature;
    if (instructions) llm.instructions = instructions;
    if (Object.keys(llm).length > 0) body.llm = llm;
    if (typeof user_data === 'string') body.user_data = user_data;

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