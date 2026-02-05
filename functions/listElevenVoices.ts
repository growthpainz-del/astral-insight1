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

    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey, 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('ElevenLabs voices error:', text);
      return Response.json({ error: 'Failed to fetch ElevenLabs voices' }, { status: res.status });
    }

    const json = await res.json();
    let voices = Array.isArray(json?.voices)
      ? json.voices.map(v => ({ id: v.voice_id || v.id, name: v.name || 'Unknown Voice' }))
      : [];

    // Also include a known working fallback id so the UI isn't empty if API scoping hides voices
    if (!voices.find(v => v.id === 'X8Na0RDzhqa1gJFsWu5a')) {
      voices = [{ id: 'X8Na0RDzhqa1gJFsWu5a', name: 'Gypsy (Custom)' }, ...voices];
    }

    return Response.json({ voices });
  } catch (error) {
    console.error('Error listing ElevenLabs voices:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});