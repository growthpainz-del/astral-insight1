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

        const apiKey = Deno.env.get('Gemini_api_key');
        if (!apiKey) {
            return Response.json({ error: 'Gemini_api_key not configured' }, { status: 500 });
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

        // Use Base44 built-in image generation
        const result = await base44.integrations.Core.GenerateImage({
            prompt: fullPrompt
        });

        if (!result || !result.url) {
            return Response.json({ error: 'Failed to generate image' }, { status: 500 });
        }

        return Response.json({
            url: result.url,
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