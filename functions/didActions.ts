import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function jsonWithCors(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(JSON.stringify(body), { ...init, headers });
}

Deno.serve(async (req) => {
  // Preflight for external callers (e.g., D-ID)
  if (req.method === 'OPTIONS') {
    return jsonWithCors({}, { status: 204 });
  }

  if (req.method !== 'POST') {
    return jsonWithCors({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    let payload;
    try {
      payload = await req.json();
    } catch (_e) {
      return jsonWithCors({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const action = (payload?.action || '').toString();
    const data = payload?.data || {};

    if (!action) {
      return jsonWithCors({ error: 'Missing action' }, { status: 400 });
    }

    // Require signed-in user for write ops (keeps ownership and audit trail)
    const user = await base44.auth.me();
    if (!user) {
      return jsonWithCors({ error: 'Unauthorized' }, { status: 401 });
    }

    // Utility: today (YYYY-MM-DD)
    const today = () => new Date().toISOString().slice(0, 10);

    if (action === 'createReading') {
      const { title, deck_id, spread_type, cards_drawn = [], date, is_public, tags } = data;

      if (!title || !deck_id || !spread_type) {
        return jsonWithCors({ error: 'Missing required fields: title, deck_id, spread_type' }, { status: 400 });
      }

      // Sanitize cards
      const sanitized = Array.isArray(cards_drawn)
        ? cards_drawn.map((c) => ({
            card_id: c?.card_id ?? c?.cardId ?? c?.id ?? null,
            position: c?.position ?? null,
            is_reversed: Boolean(c?.is_reversed ?? c?.isReversed ?? false),
            card_name: c?.card_name ?? c?.cardName ?? null,
            image_url: c?.image_url ?? c?.imageUrl ?? null,
          }))
        : [];

      const readingPayload = {
        title,
        spread_type,
        deck_id,
        date: date || today(),
        cards_drawn: sanitized.filter((c) => c.card_id && c.position),
      };

      if (typeof is_public === 'boolean') readingPayload.is_public = is_public;
      if (Array.isArray(tags)) readingPayload.tags = tags;

      const reading = await base44.entities.Reading.create(readingPayload);
      return jsonWithCors({ success: true, reading });
    }

    if (action === 'saveSession') {
      const { reading_id, title, question, entry_content, date, tags } = data;
      if (!reading_id || !title) {
        return jsonWithCors({ error: 'Missing required fields: reading_id, title' }, { status: 400 });
      }

      // Load reading to snapshot details into the journal entry
      const reading = await base44.entities.Reading.get(reading_id);
      if (!reading) {
        return jsonWithCors({ error: 'Reading not found' }, { status: 404 });
      }

      const snapshotCards = Array.isArray(reading.cards_drawn)
        ? reading.cards_drawn.map((c) => ({
            card_id: c?.card_id ?? c?.cardId ?? c?.id ?? null,
            card_name: c?.card_name ?? c?.cardName ?? null,
            position: c?.position ?? null,
            is_reversed: Boolean(c?.is_reversed ?? c?.isReversed ?? false),
          })).filter((c) => c.card_id)
        : [];

      const journalPayload = {
        title,
        reading_id,
        deck_id: reading.deck_id,
        spread_type: reading.spread_type,
        cards_drawn: snapshotCards,
        question: question || undefined,
        entry_content: entry_content || undefined,
        date: date || today(),
      };
      if (Array.isArray(tags)) journalPayload.tags = tags;

      const journal = await base44.entities.JournalEntry.create(journalPayload);
      return jsonWithCors({ success: true, journal });
    }

    return jsonWithCors({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    // Log for debugging
    console.error('[didActions] Error:', error);
    return jsonWithCors({ error: error?.message || 'Internal error' }, { status: 500 });
  }
});