import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const apiKey = Deno.env.get('PRINTIFY_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing PRINTIFY_API_KEY' }, { status: 500 });
    }

    const res = await fetch(`${PRINTIFY_API_BASE}/shops.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: 'Printify API error', status: res.status, details: text }, { status: 502 });
    }

    const shops = await res.json();
    return Response.json({ shops });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});