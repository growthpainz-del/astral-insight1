import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Optional Auth Check (allow public access)
        const isAuthed = await base44.auth.isAuthenticated().catch(() => false);
        // Proceed regardless of auth
        // Deprecated notice removed to enable ElevenLabs TTS

        // 2. Parse Payload
        const envVoiceId = Deno.env.get("ELEVENLABS_VOICE_ID");
        // Prioritize env var if set, otherwise fallback
        const systemDefault = "SMgSeP4jlTCMzplwwkwP";
        const defaultVoiceId = envVoiceId && envVoiceId.length > 0 ? envVoiceId : systemDefault;
        
        const payload = await req.json();
        const text = payload.text;
        // Only use payload voiceId if it's explicitly provided and not empty
        const requestedVoiceId = payload.voiceId;
        let voiceId = requestedVoiceId || defaultVoiceId;

        // Auto-fix common copy-paste errors (e.g. "email:voiceId")
        if (voiceId && voiceId.includes(':')) {
            voiceId = voiceId.split(':').pop().trim();
        }
        voiceId = voiceId.trim();

        console.log(`[generateSpeech] Voice ID resolution: Env=${envVoiceId}, Requested=${requestedVoiceId}, Final=${voiceId}`);

        if (!text) {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }

        let apiKey = Deno.env.get("ELEVENLABS_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
        }
        apiKey = apiKey.replace(/[^\x00-\x7F]/g, "").trim(); // Remove any non-ASCII hidden characters
        
        console.log(`[generateSpeech] API Key present (len=${apiKey.length})`);

        // 3. Call ElevenLabs API
        const ADAM_ID = "pNInz6obpgDQGcFmaJgB";

        const buildRequest = (vid) => {
            // Use a supported model for all voices
            const modelId = "eleven_multilingual_v2"; // universal default
            const voiceSettings = { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true };
            return {
                url: `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
                body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings })
            };
        };

        let usedVoiceId = (voiceId || defaultVoiceId).trim();
        let response = await fetch(buildRequest(usedVoiceId).url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
            },
            body: buildRequest(usedVoiceId).body
        });

        if (!response.ok && (response.status === 401 || response.status === 403 || response.status === 404) && usedVoiceId !== ADAM_ID) {
            console.warn(`[generateSpeech] Voice ${usedVoiceId} failed with ${response.status}. Falling back to Adam (${ADAM_ID})`);
            // Fallback to a widely available default (Adam) if unauthorized
            const fallbackVid = ADAM_ID;
            const req2 = buildRequest(fallbackVid);
            response = await fetch(req2.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg',
                    'xi-api-key': apiKey,
                },
                body: req2.body
            });
            usedVoiceId = fallbackVid;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API Error:", errorText);
            return Response.json({ error: `ElevenLabs API Error: ${response.status} ${response.statusText}` }, { status: response.status });
        }

        // 4. Get Audio Buffer and Convert to Base64
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
        }
        const base64Audio = btoa(binary);

        return Response.json({ audioContent: base64Audio, voiceIdUsed: usedVoiceId });

    } catch (error) {
        console.error("Error generating speech:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});