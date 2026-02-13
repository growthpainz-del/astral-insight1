import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Optional auth check (allow public access)
    const authed = await base44.auth.isAuthenticated().catch(() => false);
    // Proceed regardless of auth state

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // Throttled fetch with retry/backoff to handle 429/5xx from ElevenLabs
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    async function fetchWithRetry(url, options = {}, cfg = {}) {
      const attempts = cfg.attempts ?? 5;
      const baseDelay = cfg.baseDelay ?? 400;
      for (let i = 1; i <= attempts; i++) {
        const res = await fetch(url, options);
        if (res.ok) return res;
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || i === attempts) return res;
        const ra = parseInt(res.headers.get('retry-after') || '0', 10);
        const jitter = Math.floor(Math.random() * 150);
        const delay = ra ? ra * 1000 : (baseDelay * Math.pow(2, i - 1)) + jitter;
        await sleep(delay);
      }
    }

    const res = await fetchWithRetry('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey, 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('ElevenLabs voices error:', text);
      return Response.json({ 
        error: 'Failed to fetch ElevenLabs voices', 
        status: res.status,
        rate_limited: res.status === 429,
        retry_after: res.headers.get('retry-after') || null
      }, { status: res.status });
    }

    const json = await res.json();
    let voices = Array.isArray(json?.voices)
      ? json.voices.map(v => ({ id: v.voice_id || v.id, name: v.name || 'Unknown Voice' }))
      : [];


    return Response.json({ voices });
  } catch (error) {
    console.error('Error listing ElevenLabs voices:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});