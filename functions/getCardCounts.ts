import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Ensure the caller is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body safely
    let payload = {};
    try {
      payload = await req.json();
    } catch {
      // no body or invalid json; continue with defaults
      payload = {};
    }

    const deckIds = Array.isArray(payload?.deckIds) ? payload.deckIds.filter(Boolean) : [];

    // If no deckIds provided, return empty map (avoid errors/over-fetching)
    if (deckIds.length === 0) {
      return Response.json({});
    }

    const results = {};
    const errors = {};

    // Count cards per deck ID; isolate failures so we still return partial results
    for (const deckId of deckIds) {
      try {
        // Fetch cards for this deck; use a large limit to be safe
        const cards = await base44.entities.Card.filter({ deck_id: deckId }, '-updated_date', 10000);
        results[deckId] = Array.isArray(cards) ? cards.length : 0;

        // Small delay to be gentle on rate limits for very large lists
        await new Promise((r) => setTimeout(r, 50));
      } catch (e) {
        // Record error, but do not fail the whole request
        errors[deckId] = e?.message || 'unknown_error';
        results[deckId] = 0;
      }
    }

    // Return top-level mapping as expected by the frontend; include meta for diagnostics
    return Response.json({ ...results, _meta: { hadErrors: Object.keys(errors).length > 0, errors } });
  } catch (error) {
    // Final safety net
    return Response.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
});