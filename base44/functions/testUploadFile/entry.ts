import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Let's create a simple text file
        const fileContent = "Hello World";
        const file = new File([fileContent], "hello.txt", { type: "text/plain" });

        const res = await base44.integrations.Core.UploadFile({ file });
        
        return Response.json({ result: res });
    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});