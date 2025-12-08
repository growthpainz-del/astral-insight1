import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, aspectRatio = '1:1', negativePrompt = '' } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('Gemini_api_key');
        if (!apiKey) {
            return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // Map aspect ratios to Gemini's format
        const aspectRatioMap = {
            '1:1': '1:1',
            '16:9': '16:9',
            '9:16': '9:16',
            '4:3': '4:3',
            '3:4': '3:4',
        };
        const geminiAspectRatio = aspectRatioMap[aspectRatio] || '1:1';

        // Build the full prompt
        let fullPrompt = prompt;
        if (negativePrompt) {
            fullPrompt += ` [Avoid: ${negativePrompt}]`;
        }

        // Call Gemini API (Imagen 3 via Vertex AI)
        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${Deno.env.get('GOOGLE_CLOUD_PROJECT_ID') || 'YOUR_PROJECT_ID'}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: fullPrompt,
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: geminiAspectRatio,
                    safetySetting: 'block_some',
                    personGeneration: 'allow_adult',
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            return Response.json({ 
                error: 'Image generation failed', 
                details: errorData 
            }, { status: response.status });
        }

        const data = await response.json();
        
        // Extract the base64 image from the response
        const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
        
        if (!imageBase64) {
            return Response.json({ error: 'No image generated' }, { status: 500 });
        }

        // Convert base64 to blob and upload to Base44 storage
        const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        
        // Upload to Base44 storage
        const formData = new FormData();
        formData.append('file', blob, `gemini-${Date.now()}.png`);
        
        const uploadResult = await base44.integrations.Core.UploadFile({ 
            file: blob 
        });

        return Response.json({
            url: uploadResult.file_url,
            prompt: fullPrompt,
            aspectRatio: geminiAspectRatio
        });

    } catch (error) {
        console.error('Generate image error:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate image' 
        }, { status: 500 });
    }
});