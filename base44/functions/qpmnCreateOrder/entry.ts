import { createClientFromRequest } from 'npm:@base44/sdk';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    
    // Ensure the user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { deckId } = payload;
    
    if (!deckId) {
      return Response.json({ error: 'deckId is required' }, { status: 400 });
    }

    // Get full deck and card details securely with user context
    const deck = await base44.entities.Deck.get(deckId);
    if (!deck) {
      return Response.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && deck.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden: You do not own this deck' }, { status: 403 });
    }

    const cards = await base44.entities.Card.filter({ deck_id: deckId });
    
    const apiKey = secrets.get("QPMN_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'QPMN_API_KEY is not configured in secrets.' }, { status: 500 });
    }

    // Format payload based on general print-on-demand API patterns
    const qpmnPayload = {
      order_type: "custom_deck",
      deck_name: deck.name,
      cover_image: deck.cover_image,
      back_image: deck.back_image_url,
      quantity: 1,
      cards: cards.map(c => ({
        name: c.name,
        image_url: c.image_url,
        quantity: 1
      }))
    };

    // Call QPMN API (Using standard pattern, adjust base URL if necessary per QPMN docs)
    const response = await fetch('https://api.qpmn.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(qpmnPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: `QPMN API error: ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ success: true, order: result });

  } catch (error) {
    return Response.json({ error: `Failed to submit order to QPMN: ${error.message}` }, { status: 500 });
  }
}