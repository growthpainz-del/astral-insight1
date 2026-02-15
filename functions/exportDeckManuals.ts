import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load decks (fetch up to 200)
    const allDecks = await base44.entities.Deck.list('-created_date', 200);

    const normalize = (s) => String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Target names: Rooted Crescent, I Ching, Rune(s)/Rune My Day (user wrote "ruine/ruins")
    const wantedMatchers = [
      (n) => normalize(n).includes('rootedcrescent') || (normalize(n).includes('rooted') && normalize(n).includes('crescent')),
      (n) => normalize(n).includes('iching') || normalize(n).includes('iching') || normalize(n).includes('iiching') || normalize(n).includes('ichingoracle') || normalize(n).includes('ichinghexagram') || normalize(n).includes('ichingdeck') || normalize(n).includes('ichingcards') || normalize(n).includes('ichinghexagrams') || normalize(n).includes('ichingbook') || normalize(n).includes('ichingyijing') || normalize(n).includes('yijing') || normalize(n).includes('iiching'),
      (n) => normalize(n).includes('rune') || normalize(n).includes('ruin') || normalize(n).includes('ruins') || normalize(n).includes('runemyday') || normalize(n).includes('runecards')
    ];

    const matchedDecks = (Array.isArray(allDecks) ? allDecks : []).filter((d) => {
      const name = d?.name || '';
      return wantedMatchers.some((fn) => fn(name));
    });

    const decksPayload = [];

    for (const deck of matchedDecks) {
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
      const combined_text = sections
        .map((s) => `## ${s.name}\n${String(s.content || '').trim()}`)
        .join('\n\n');

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
      });
    }

    const payload = {
      version: '1.0',
      generated_at: new Date().toISOString(),
      decks: decksPayload,
      notes: 'Pruned for agent usage: includes deck names and manual texts only (redundant fields removed).',
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