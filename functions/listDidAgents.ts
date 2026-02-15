import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isPro = ['oracle_pro', 'creator'].includes(String(user?.subscription_tier || '').toLowerCase());
    if (!(user.role === 'admin' || isPro)) {
      return Response.json({ error: 'Forbidden: Requires Pro or Admin' }, { status: 403 });
    }

    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'Missing DID_API_KEY or DID_API_SECRET' }, { status: 500 });
    }

    const basicAuth = 'Basic ' + btoa(`${apiKey}:${apiSecret}`);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function fetchWithRetry(url: string, options: RequestInit = {}, cfg: { attempts?: number; baseDelay?: number } = {}) {
      const attempts = cfg.attempts ?? 5;
      const baseDelay = cfg.baseDelay ?? 400;
      for (let i = 1; i <= attempts; i++) {
        const res = await fetch(url, options);
        if (res.ok) return res;
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || i === attempts) return res;
        const ra = parseInt(res.headers.get('retry-after') || '0', 10);
        const jitter = Math.floor(Math.random() * 150);
        const delay = ra ? ra * 1000 : baseDelay * Math.pow(2, i - 1) + jitter;
        await sleep(delay);
      }
      // Should not reach here; return a generic failed Response if it does
      return new Response(JSON.stringify({ error: 'Request failed after retries' }), { status: 500 });
    }

    const res = await fetchWithRetry('https://api.d-id.com/agents', {
      method: 'GET',
      headers: {
        Authorization: basicAuth,
        accept: 'application/json',
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return Response.json(
        {
          error: data?.message || data?.error || 'Failed to list agents',
          status: res.status,
          rate_limited: res.status === 429,
          retry_after: res.headers.get('retry-after') || null,
        },
        { status: res.status },
      );
    }

    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);

    const agents = items
      .map((a: any) => ({
        id: a?.id || a?._id || a?.agent_id || null,
        name: a?.preview_name || a?.name || a?.title || 'Untitled Agent',
        created_at: a?.created || a?.created_at || a?.createdAt || null,
        updated_at: a?.updated || a?.updated_at || a?.updatedAt || null,
        status: a?.status || null,
      }))
      .filter((a: any) => a.id);

    return Response.json({ count: agents.length, agents });
  } catch (error: any) {
    console.error('[listDidAgents] Fatal', error);
    return Response.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
});