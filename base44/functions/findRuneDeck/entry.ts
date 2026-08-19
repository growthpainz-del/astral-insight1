import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        let user;
        try {
            user = await base44.auth.me();
        } catch (e) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cards = await base44.entities.Card.filter({ deck_id: "68d51620b69f31157740e182" });
        
        const lines = cards.map(c => `${c.name}: ${c.image_url}`).join('\n');
        
        return new Response(lines, { headers: { "Content-Type": "text/plain" } });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});