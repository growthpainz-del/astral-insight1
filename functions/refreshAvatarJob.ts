import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isPro = ['oracle_pro', 'creator'].includes(String(user?.subscription_tier || '').toLowerCase());
    if (!(user.role === 'admin' || isPro)) return Response.json({ error: 'Forbidden: Requires Pro or Admin' }, { status: 403 });

    const { jobId } = await req.json();
    if (!jobId) return Response.json({ error: 'jobId is required' }, { status: 400 });

    const jobs = await base44.entities.AvatarJob.filter({ id: jobId });
    const job = jobs?.[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (!job.did_talk_id) return Response.json({ error: 'Job missing D-ID talk id' }, { status: 400 });

    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    if (!apiKey || !apiSecret) return Response.json({ error: 'Missing D-ID secrets' }, { status: 500 });
    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // Try agents path first, then fallback to legacy talks
    let res = await fetch(`https://api.d-id.com/agents/talks/${encodeURIComponent(job.did_talk_id)}`, {
      headers: { 'Authorization': basicAuth, 'accept': 'application/json' }
    });
    let data = await res.json().catch(() => null);

    if (!res.ok) {
      const resLegacy = await fetch(`https://api.d-id.com/talks/${encodeURIComponent(job.did_talk_id)}`, {
        headers: { 'Authorization': basicAuth, 'accept': 'application/json' }
      });
      data = await resLegacy.json().catch(() => null);
      if (!resLegacy.ok) {
        await base44.entities.AvatarJob.update(job.id, { error: `D-ID status error (${resLegacy.status}): ${data?.message || data?.error || 'Unknown'}` });
        return Response.json({ error: 'Failed to fetch status', details: data }, { status: resLegacy.status });
      }
      res = resLegacy;
    }

    const status = data?.status || job.status;
    const resultUrl = data?.result_url || data?.result?.url || job.result_url;
    const finalStatus = resultUrl ? 'completed' : (status === 'done' ? 'completed' : (status || 'processing'));

    const updated = await base44.entities.AvatarJob.update(job.id, {
      status: finalStatus,
      result_url: resultUrl || undefined,
      error: null
    });

    return Response.json({ job: updated, did: data });
  } catch (error) {
    console.error('[refreshAvatarJob] Fatal', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});