import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items } = await req.json();
        if (!items || !Array.isArray(items)) {
            return Response.json({ error: 'Items array is required' }, { status: 400 });
        }

        const prompt = `Assign a single, highly relevant emoji to each of the following items based on their label and meaning. 
        Return ONLY a JSON array of strings (the emojis), in the exact same order as the input items. Do not provide explanations.
        
Items:
${JSON.stringify(items, null, 2)}
`;

        const res = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    emojis: {
                        type: "array",
                        items: { type: "string" },
                        description: "An array of single emoji strings corresponding to the input items."
                    }
                },
                required: ["emojis"]
            }
        });

        return Response.json({ emojis: res.emojis });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});