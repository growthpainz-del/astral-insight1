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
      console.error('[didCreateKnowledgeDocument] Missing D_ID_API_KEY');
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const { knowledgeId, title, text } = await req.json().catch(() => ({}));
    if (!knowledgeId) return Response.json({ error: 'knowledgeId is required' }, { status: 400 });
    if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

    const auth = 'Basic ' + btoa(apiKey);

    // Preferred endpoint path (per docs): singular 'document'
    const url1 = `https://api.d-id.com/knowledge/${encodeURIComponent(knowledgeId)}/document`;
    const url2 = `https://api.d-id.com/knowledge/${encodeURIComponent(knowledgeId)}/documents`;

    const payload = {
      // Common JSON shape for raw text documents
      name: title || 'Document',
      type: 'text',
      content: text
    };

    const tryCreate = async (url) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return { r, data: await r.json().catch(() => ({})) };
    };

    let { r, data } = await tryCreate(url1);
    if (!r.ok && (r.status === 404 || r.status === 405)) {
      ({ r, data } = await tryCreate(url2));
    }

    if (!r.ok) {
      console.error('[didCreateKnowledgeDocument] Error', r.status, data);
      return Response.json({ error: data?.error || 'Failed to create document', details: data }, { status: r.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[didCreateKnowledgeDocument] Unexpected', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});