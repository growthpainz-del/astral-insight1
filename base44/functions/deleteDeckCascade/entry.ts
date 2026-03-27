import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const deckId = body.deckId;
    if (!deckId) {
      return Response.json({ error: 'deckId is required' }, { status: 400 });
    }

    const deck = await base44.entities.Deck.get(deckId);
    if (!deck) {
      return Response.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (deck.is_public) {
      return Response.json({ error: 'Cannot delete official/public decks' }, { status: 403 });
    }

    const creator = String(deck.created_by || '').toLowerCase();
    const requester = String(user.email || '').toLowerCase();
    const isOwner = creator && requester && creator === requester;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden: you can only delete your own decks' }, { status: 403 });
    }

    // Fetch all cards and delete them using service role (after verifying ownership)
    const cards = await base44.asServiceRole.entities.Card.filter({ deck_id: deckId });
    let deletedCards = 0;
    const failures = [];

    for (const c of cards) {
      try {
        await base44.asServiceRole.entities.Card.delete(c.id);
        deletedCards += 1;
      } catch (e) {
        failures.push({ id: c.id, error: e?.message || 'unknown' });
      }
    }

    // Delete the deck
    await base44.asServiceRole.entities.Deck.delete(deckId);

    return Response.json({
      deck_id: deckId,
      deck_deleted: true,
      deleted_cards: deletedCards,
      failed_cards: failures.length,
      failures
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});