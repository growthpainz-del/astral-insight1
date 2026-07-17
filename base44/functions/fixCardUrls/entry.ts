import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }
        
        let cardUpdatedCount = 0;
        
        // fetch all decks to get all their cards
        const decks = await base44.asServiceRole.entities.Deck.filter({});
        for (const deck of decks) {
             const cards = await base44.asServiceRole.entities.Card.filter({ deck_id: deck.id });
             
             for (let i = 0; i < cards.length; i += 10) {
                 const batch = cards.slice(i, i + 10);
                 const promises = batch.map(async (card) => {
                     let changed = false;
                     let updates = {};
                     
                     if (card.image_url && card.image_url.includes('base44.app/api/apps/')) {
                         const filename = card.image_url.split('/').pop();
                         updates.image_url = `https://media.base44.com/images/public/68d2a300021f94d0f312c039/${filename}`;
                         changed = true;
                     }
                     
                     if (card.spirit_wheel_icon_url && card.spirit_wheel_icon_url.includes('base44.app/api/apps/')) {
                         const filename = card.spirit_wheel_icon_url.split('/').pop();
                         updates.spirit_wheel_icon_url = `https://media.base44.com/images/public/68d2a300021f94d0f312c039/${filename}`;
                         changed = true;
                     }
                     
                     if (changed) {
                         await base44.asServiceRole.entities.Card.update(card.id, updates);
                         cardUpdatedCount++;
                     }
                 });
                 
                 await Promise.all(promises);
                 await delay(200);
             }
        }
        
        return Response.json({ success: true, cardUpdatedCount });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
});