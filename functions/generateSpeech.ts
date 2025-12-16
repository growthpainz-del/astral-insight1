import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Auth Check
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Payload
        const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await req.json();

        if (!text) {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
        }

        // 3. Call ElevenLabs API
        const isGypsy = voiceId === "X8Na0RDzhqa1gJFsWu5a";
        const modelId = isGypsy ? "eleven_multilingual_v2" : "eleven_monolingual_v1";
        const voiceSettings = isGypsy
            ? { stability: 0.25, similarity_boost: 0.95, style: 0.85, use_speaker_boost: true }
            : { stability: 0.5, similarity_boost: 0.75 };

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text,
                model_id: modelId,
                voice_settings: voiceSettings
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API Error:", errorText);
            return Response.json({ error: `ElevenLabs API Error: ${response.statusText}` }, { status: response.status });
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