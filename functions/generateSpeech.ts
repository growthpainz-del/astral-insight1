import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Optional Auth Check (allow public access)
        const isAuthed = await base44.auth.isAuthenticated().catch(() => false);
        // Proceed regardless of auth
        // Deprecated notice removed to enable ElevenLabs TTS

        // 2. Parse Payload
        const { text, voiceId = "X8Na0RDzhqa1gJFsWu5a" } = await req.json();

        if (!text) {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
        }

        // 3. Call ElevenLabs API
        const RACHEL_ID = "21m00Tcm4TlvDq8ikWAM";
        const GYPSY_ID = "X8Na0RDzhqa1gJFsWu5a";

        const buildRequest = (vid) => {
            const isGypsy = vid === GYPSY_ID;
            const modelId = isGypsy ? "eleven_multilingual_v2" : "eleven_monolingual_v1";
            const voiceSettings = isGypsy
                ? { stability: 0.25, similarity_boost: 0.95, style: 0.85, use_speaker_boost: true }
                : { stability: 0.5, similarity_boost: 0.75 };
            return {
                url: `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
                body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings })
            };
        };

        let usedVoiceId = voiceId || GYPSY_ID;
        let response = await fetch(buildRequest(usedVoiceId).url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
            },
            body: buildRequest(usedVoiceId).body
        });

        if (!response.ok && (response.status === 401 || response.status === 403) && usedVoiceId !== RACHEL_ID) {
            // Fallback to public Rachel voice if unauthorized (401)
            const fallbackVid = RACHEL_ID;
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

        return Response.json({ audioContent: base64Audio });

    } catch (error) {
        console.error("Error generating speech:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});