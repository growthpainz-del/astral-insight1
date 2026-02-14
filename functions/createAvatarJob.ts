import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isPro = ['oracle_pro', 'creator'].includes(String(user?.subscription_tier || '').toLowerCase());
    if (!(user.role === 'admin' || isPro)) return Response.json({ error: 'Forbidden: Requires Pro or Admin' }, { status: 403 });

    const { readingId, overrideScript, voiceId: voiceOverride, resolution, agentId: agentIdOverride } = await req.json();
    if (!readingId) return Response.json({ error: 'readingId is required' }, { status: 400 });

    // Fetch reading
    const readings = await base44.entities.Reading.filter({ id: readingId });
    const reading = readings?.[0];
    if (!reading) return Response.json({ error: 'Reading not found' }, { status: 404 });

    // Build concise script
    let script = overrideScript || '';
    if (!script) {
      const cards = (reading.cards_drawn || []).map(c => `${c.card_name || c.card_id}${c.is_reversed ? ' (reversed)' : ''}${c.position ? ` – ${c.position}` : ''}`).slice(0, 12);
      const prompt = `You are a warm, clear narrator. Create a concise, 120-160 word first-person guidance script summarizing this reading for spoken delivery. Avoid lists; use smooth, natural sentences. Close with one actionable affirmation.\n\nReading title: ${reading.title || ''}\nSpread: ${reading.spread_type || ''}\nCards: ${cards.join('; ')}\nUser interpretation (if any): ${reading.interpretation || 'n/a'}\nTone: compassionate, grounded, hopeful, a touch mystical but practical.`;
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { script: { type: 'string' } },
          required: ['script']
        }
      });
      script = (llm?.script || '').trim();
      if (!script) return Response.json({ error: 'Failed to generate script' }, { status: 500 });
    }

    const apiKey = Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('DID_API_SECRET');
    const envAgentId = Deno.env.get('DID_AGENT_ID');
    const defaultVoice = Deno.env.get('ELEVENLABS_VOICE_ID');
    if (!apiKey || !apiSecret || !(envAgentId || agentIdOverride)) {
      return Response.json({ error: 'Missing D-ID credentials: need DID_API_KEY, DID_API_SECRET, and an Agent ID (env DID_AGENT_ID or agentId in request)' }, { status: 500 });
    }
    const effectiveAgentId = agentIdOverride || envAgentId;
    const voiceId = voiceOverride || defaultVoice;
    if (!voiceId) return Response.json({ error: 'Missing ElevenLabs voice (ELEVENLABS_VOICE_ID)' }, { status: 500 });

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // Create DB record first (queued)
    const job = await base44.entities.AvatarJob.create({
      reading_id: readingId,
      agent_id: effectiveAgentId,
      voice_id: voiceId,
      script,
      resolution: (resolution === '1080p' ? '1080p' : '720p'),
      status: 'queued'
    });

    // Attempt Agents talks endpoint (preferred for Agent pre-render, path param form)
    const bodyAgents = {
      script: {
        type: 'text',
        input: script,
        provider: { type: 'elevenlabs', voice_id: voiceId }
      },
      config: { result_format: 'mp4', resolution: job.resolution }
    };

    const resAgents = await fetch(`https://api.d-id.com/agents/${effectiveAgentId}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(bodyAgents)
    });

    let didData = await resAgents.json().catch(() => null);

    // If Agents endpoint call failed, try legacy /talks as fallback with voice provider
    if (!resAgents.ok) {
      const legacyBody = {
        script: {
          type: 'text',
          input: script
        },
        source_url: undefined,
        presenter_id: undefined,
        provider: { type: 'elevenlabs', voice_id: voiceId },
        config: { result_format: 'mp4', resolution: job.resolution }
      };

      const resLegacy = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(legacyBody)
      });

      let legacyData = await resLegacy.json().catch(() => null);

      if (!resLegacy.ok) {
        const mappedStatus = resLegacy.status === 401 ? 502 : resLegacy.status; // Never bubble vendor 401 to client
        await base44.entities.AvatarJob.update(job.id, {
          status: 'failed',
          error: `D-ID error (${resLegacy.status}): ${legacyData?.message || legacyData?.error || 'Unknown'}`
        });
        return Response.json({ error: 'D-ID render failed', details: legacyData, vendor_status: resLegacy.status }, { status: mappedStatus });
      }

      didData = legacyData;
    }

    const didId = didData?.id || didData?.talk_id || didData?.job_id || null;
    const didStatus = didData?.status || 'processing';
    const resultUrl = didData?.result_url || didData?.result?.url || null;

    const updated = await base44.entities.AvatarJob.update(job.id, {
      did_talk_id: didId || undefined,
      status: resultUrl ? 'completed' : (didStatus === 'done' ? 'completed' : 'processing'),
      result_url: resultUrl || undefined,
      error: null
    });

    return Response.json({ job: updated, did: didData });
  } catch (error) {
    console.error('[createAvatarJob] Fatal', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});