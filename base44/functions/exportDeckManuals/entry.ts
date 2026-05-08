import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional body: allow zip output with per-deck files
    let exportMode = 'json';
    try {
      const maybeBody = await req.json();
      if (maybeBody?.per_deck_zip || maybeBody?.format === 'zip') {
        exportMode = 'zip';
      }
    } catch (_) {
      // no body provided - default json
    }

    // Load all decks (increase limit to 500)
    const allDecks = await base44.entities.Deck.list('-created_date', 500);

    const decksToExport = Array.isArray(allDecks) ? allDecks : [];

    const decksPayload = [];

    for (const deck of decksToExport) {
      const sections = [];

      // Fetch cards for this deck (ordered by number if present)
      const deckCards = await base44.entities.Card.filter({ deck_id: deck.id }, 'number', 1000);

      // Fetch card relationships
      let deckRelationships = [];
      try {
        deckRelationships = await base44.entities.CardRelationship.filter({ deck_id: deck.id }, null, 1000);
      } catch(e) {}

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

      // Build per-card mapping into manual (snippets + image descriptions)
      const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const baseSections = sections.filter((s) => s.name !== 'Card Image Descriptions');
      const extractSnippetsFor = (name, maxSnippets = 2) => {
        const sources = baseSections.map((s) => String(s.content || ''));
        const text = sources.join('\n\n');
        const idxs = [];
        if (!name) return [];
        const re = new RegExp(escapeRegex(name), 'ig');
        let m;
        while ((m = re.exec(text)) && idxs.length < maxSnippets) { idxs.push(m.index); }
        return idxs.map(i => text.slice(Math.max(0, i - 240), Math.min(text.length, i + 240)).trim());
      };

      const manualCards = deckCards.map((c) => {
        const mapEntry = cardsWithDescriptions.find((x) => String(x.id) === String(c.id));
        const snippets = extractSnippetsFor(c.name || '');
        return {
          card_id: c.id,
          card_name: c.name,
          image_description: mapEntry?.image_description || null,
          manual_snippets: snippets,
        };
      });

      const perCardMd = manualCards.map((mc) => {
        const title = mc.card_name || `Card ${mc.card_id}`;
        const desc = mc.image_description ? `Image Description: ${mc.image_description}` : 'Image Description: (none)';
        const snips = (mc.manual_snippets || []).map((s) => `> ${s.replace(/\n/g, '\n> ')}`).join('\n\n');
        const snipsBlock = snips ? `\n\nExisting Manual Snippets:\n${snips}` : '';
        return `### ${title}\n${desc}${snipsBlock}`;
      }).join('\n\n');

      if (perCardMd.trim()) {
        sections.push({ name: 'Per-Card Manual (with Image Descriptions)', content: perCardMd });
        combined_text = [combined_text, `## Per-Card Manual (with Image Descriptions)\n${perCardMd}`].filter(Boolean).join('\n\n');
      }

      // Prepare agent-friendly card data (no manual parsing needed)
      const cardsForAgent = (deckCards || []).map((c) => {
        const match = cardsWithDescriptions.find((x) => String(x.id) === String(c.id));
        return {
          id: c.id,
          name: c.name,
          subtitle: c.subtitle || null,
          number: c.number ?? null,
          element: c.element || null,
          keywords: Array.isArray(c.keywords) ? c.keywords : [],
          overall_meaning: c.overall_meaning || null,
          upright_meaning: c.upright_meaning || null,
          reversed_meaning: c.reversed_meaning || null,
          upright_action: c.upright_action || null,
          reversed_action: c.reversed_action || null,
          custom_ai_notes: c.custom_ai_notes || c.custom || c.custom_notes || c.custom_ai_helper || null,
          image_url: c.image_url || null,
          image_description: match?.image_description || null,
        };
      });

      // Keep only relevant, non-redundant fields (extended with agent_cards)
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
        agent_cards: cardsForAgent,
        card_relationships: deckRelationships,
      });
    }

    const payload = {
      version: '1.1',
      generated_at: new Date().toISOString(),
      decks: decksPayload,
      notes: 'Includes manuals, per-card image descriptions, and agent_cards for each deck.'
    };

    if (exportMode === 'zip') {
      const zip = new JSZip();
      const slugify = (s) => String(s || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/\p{Diacritic}+/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'deck';

      for (const d of decksPayload) {
        const fileName = `${slugify(d.name)}-${d.id}.json`;
        zip.file(fileName, JSON.stringify(d, null, 2));
      }
      zip.file('index.json', JSON.stringify(payload, null, 2));
      const content = await zip.generateAsync({ type: 'uint8array' });
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename=deck_exports.zip'
        }
      });
    }

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