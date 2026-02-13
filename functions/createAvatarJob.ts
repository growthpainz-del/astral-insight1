import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { readingId, overrideScript, voiceId: voiceOverride, resolution } = await req.json();
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
    const agentId = Deno.env.get('DID_AGENT_ID');
    const defaultVoice = Deno.env.get('ELEVENLABS_VOICE_ID');
    if (!apiKey || !apiSecret || !agentId) {
      return Response.json({ error: 'Missing D-ID secrets (DID_API_KEY, DID_API_SECRET, DID_AGENT_ID)' }, { status: 500 });
    }
    const voiceId = voiceOverride || defaultVoice;
    if (!voiceId) return Response.json({ error: 'Missing ElevenLabs voice (ELEVENLABS_VOICE_ID)' }, { status: 500 });

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // Create DB record first (queued)
    const job = await base44.entities.AvatarJob.create({
      reading_id: readingId,
      agent_id: agentId,
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

    const resAgents = await fetch(`https://api.d-id.com/agents/${agentId}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(bodyAgents)
    });

    let didData = await resAgents.json().catch(() => null);

    // If Agents endpoint unsupported, return explicit error for now
    if (!resAgents.ok) {
      await base44.entities.AvatarJob.update(job.id, {
        status: 'failed',
        error: `D-ID error (${resAgents.status}): ${didData?.message || didData?.error || 'Unknown'}`
      });
      return Response.json({ error: 'D-ID pre-render failed', details: didData }, { status: resAgents.status });
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