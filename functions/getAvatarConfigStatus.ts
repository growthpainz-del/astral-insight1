import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
// redeploy ping v2

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isPro = ['oracle_pro', 'creator'].includes(String(user?.subscription_tier || '').toLowerCase());
    if (!(user.role === 'admin' || isPro)) return Response.json({ error: 'Forbidden: Requires Pro or Admin' }, { status: 403 });

    let expected = null;
    try {
      const body = await req.json();
      expected = body?.expectedAgentId || null;
    } catch (_) {}

    const didAgentId = Deno.env.get('DID_AGENT_ID') || '';
    const didApiKey = Deno.env.get('DID_API_KEY') || '';
    const didApiSecret = Deno.env.get('DID_API_SECRET') || '';
    const elevenKey = Deno.env.get('ELEVENLABS_API_KEY') || '';
    const elevenVoiceId = Deno.env.get('ELEVENLABS_VOICE_ID') || '';

    const payload = {
      didAgentIdExists: !!didAgentId,
      didAgentIdMatches: expected ? (didAgentId === expected) : null,
      didApiReady: !!(didApiKey && didApiSecret),
      elevenApiReady: !!elevenKey,
      elevenVoiceIdExists: !!elevenVoiceId,
      didAgentIdSuffix: didAgentId ? didAgentId.slice(-6) : null,
    };

    return Response.json({ ...payload, _ts: Date.now() });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});