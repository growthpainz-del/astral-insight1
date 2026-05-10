import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const res = await base44.integrations.Core.InvokeLLM({
            prompt: "Describe this image in 1 sentence. Then provide a dummy symbol name.",
            file_urls: ["https://media.base44.com/images/public/68d2a300021f94d0f312c039/44afd9e12_IMG_9971.png"],
            model: 'gpt_5_4',
            response_json_schema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                reading: { type: "string" },
                keywords: { type: "array", items: { type: "string" } }
              },
              required: ["symbol", "reading"]
            }
        });
        
        return Response.json({ result: res });
    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});