import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const decks = await base44.entities.Deck.list();
        const matches = decks.filter(d => (d.name || '').toLowerCase().includes('tantric') || (d.name || '').toLowerCase().includes('tantrum'));
        return Response.json({ matches: matches.map(d => ({id: d.id, name: d.name})) });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});