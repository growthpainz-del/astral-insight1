import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch (_) {}

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      console.error('[didAttachKnowledgeToAgent] Missing D_ID_API_KEY');
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const { agentId, knowledgeId } = await req.json().catch(() => ({}));
    if (!agentId) return Response.json({ error: 'agentId is required' }, { status: 400 });
    if (!knowledgeId) return Response.json({ error: 'knowledgeId is required' }, { status: 400 });

    const res = await fetch(`https://api.d-id.com/agents/${encodeURIComponent(agentId)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey),
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        // Per docs: knowledge object expected
        knowledge: { id: knowledgeId }
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[didAttachKnowledgeToAgent] Error', res.status, data);
      return Response.json({ error: data?.error || 'Failed to attach knowledge', details: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[didAttachKnowledgeToAgent] Unexpected', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});