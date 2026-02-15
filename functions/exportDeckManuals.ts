import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all decks (increase limit to 500)
    const allDecks = await base44.entities.Deck.list('-created_date', 500);

    const decksToExport = Array.isArray(allDecks) ? allDecks : [];

    const decksPayload = [];

    for (const deck of decksToExport) {
      const sections = [];

      if (Array.isArray(deck.manual_files) && deck.manual_files.length > 0) {
        for (const mf of deck.manual_files) {
          const name = mf?.name || 'Manual Section';
          const content = mf?.content || '';
          if (content && content.trim().length > 0) {
            sections.push({ name, content });
          }
        }
      }

      // Fallback to legacy manual fields if no sections extracted
      if (sections.length === 0) {
        const legacyContent = deck.manual_content || '';
        if (legacyContent && legacyContent.trim().length > 0) {
          sections.push({ name: deck.manual_url ? 'Main Manual' : 'Manual', content: legacyContent });
        }
      }

      // Build a single combined text for LLM-friendly ingestion
      let combined_text = sections
        .map((s) => `## ${s.name}\n${String(s.content || '').trim()}`)
        .join('\n\n');

      // Try to append card image descriptions (Google Vision powered) to manual and deck export
      let cardsWithDescriptions = [];
      try {
        const imgRes = await base44.functions.invoke('generateDeckImageDescriptions', { deck_id: deck.id });
        const imgCards = imgRes?.data?.cards || imgRes?.cards || [];
        cardsWithDescriptions = imgCards.map((c) => ({
          id: c.id,
          name: c.name,
          image_url: c.image_url,
          image_description: c.image_description || null,
        }));
        const listMd = imgCards
          .filter((c) => (c.image_description || '').trim().length > 0)
          .map((c) => `- ${c.name || `Card ${c.id}`}: ${c.image_description}`)
          .join('\n');
        if (listMd) {
          sections.push({ name: 'Card Image Descriptions', content: listMd });
          combined_text = [combined_text, `## Card Image Descriptions\n${listMd}`].filter(Boolean).join('\n\n');
        }
      } catch (e) {
        console.warn('[exportDeckManuals] Skipped image descriptions for deck', deck.id, e?.message || e);
      }

      // Keep only relevant, non-redundant fields
      decksPayload.push({
        id: deck.id,
        name: deck.name,
        category: deck.category,
        ai_reading_coach: deck.ai_reading_coach || null,
        manual: {
          sections,
          combined_text,
        },
        cards: cardsWithDescriptions,
      });
    }

    const payload = {
      version: '1.0',
      generated_at: new Date().toISOString(),
      decks: decksPayload,
      notes: 'Includes manuals and Google Vision-based card image descriptions for every deck.',
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[exportDeckManuals] Error:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});