import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeName(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildNameCandidates(name = '') {
  const n = String(name || '').trim();
  const candidates = new Set([n]);
  // If name starts with "Rune ", also try without and with different spacing/hyphen
  const m = /^\s*rune\s+(.+)$/i.exec(n);
  if (m && m[1]) {
    candidates.add(m[1].trim());
    candidates.add(`Rune ${m[1].trim()}`);
  } else {
    candidates.add(`Rune ${n}`);
  }
  return Array.from(candidates);
}

function findSectionIndices(lines, cardName) {
  // Return array of indices that look like headings for this card
  const candidates = buildNameCandidates(cardName).map((c) => ({
    raw: c,
    norm: normalizeName(c),
    re: new RegExp(
      // optional markdown heading then exact name as a whole token line
      `^(?:\n|)\s{0,3}(?:#{1,6}\\s+)?(?:${escapeRegExp(c)})(?:\s*[:\-–—]?\s*)$`,
      'i'
    ),
  }));

  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln) continue;
    // quick filter: must include at least the main token words from name to be worth testing regex
    for (const cand of candidates) {
      if (normalizeName(ln).includes(cand.norm)) {
        if (cand.re.test(lines[i])) {
          hits.push(i);
          break;
        }
      }
    }
  }
  return hits;
}

function nextHeadingBoundary(lines, startIdx) {
  // Find the next likely heading after startIdx to bound the section
  for (let j = startIdx + 1; j < lines.length; j++) {
    const t = lines[j];
    if (!t) continue;
    if (/^\s{0,3}#{1,6}\s+/.test(t)) return j; // markdown heading
    // also treat an ALL CAPS short line as a heading-ish separator
    const trimmed = t.trim();
    if (trimmed.length <= 80 && /[A-Z]/.test(trimmed) && trimmed === trimmed.toUpperCase()) return j;
  }
  return lines.length;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const deckId = body.deck_id || body.deckId;
    if (!deckId) {
      return Response.json({ error: 'Missing deck_id' }, { status: 400 });
    }

    const deck = await base44.entities.Deck.get(deckId);
    if (!deck) {
      return Response.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Load cards for name matching and ordering
    const cards = await base44.entities.Card.filter({ deck_id: deckId }, 'number', 1000);

    // Get generated descriptions (invoke existing function)
    const genRes = await base44.functions.invoke('generateDeckImageDescriptions', { deck_id: deckId });
    const data = genRes?.data || {};
    const imageCards = Array.isArray(data.cards) ? data.cards : (Array.isArray(data?.data?.cards) ? data.data.cards : []);

    const descById = new Map();
    const descByNormName = new Map();

    for (const c of imageCards) {
      const desc = (c?.image_description || '').trim();
      if (!desc) continue;
      if (c?.id) descById.set(String(c.id), desc);
      if (c?.name) descByNormName.set(normalizeName(c.name), desc);
    }

    let manual = String(deck.manual_content || '');

    // If there's no manual content, create a minimal one with per-card sections
    if (!manual.trim()) {
      const sorted = [...cards].sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999) || String(a.name).localeCompare(String(b.name)));
      const parts = ['# Deck Manual', '', `Deck: ${deck.name || ''}`, ''];
      for (const c of sorted) {
        const nm = c.name || `Card ${c.id}`;
        const d = descById.get(String(c.id)) || descByNormName.get(normalizeName(nm)) || '';
        parts.push(`## ${nm}`);
        if (d) {
          parts.push(`Image Description: ${d}`);
        } else {
          parts.push('Image Description: (not available)');
        }
        parts.push('');
      }
      manual = parts.join('\n');

      await base44.entities.Deck.update(deckId, { manual_content: manual });
      return Response.json({ message: 'Manual created and populated with image descriptions.', created_new_manual: true, updated_count: sorted.length });
    }

    // Else: inject into existing manual under each matching card heading
    const lines = manual.split(/\r?\n/);
    let updatedCount = 0;

    // Build quick lookup for cards
    for (const card of cards) {
      const cardName = card?.name || '';
      if (!cardName) continue;
      const desc = descById.get(String(card.id)) || descByNormName.get(normalizeName(cardName));
      if (!desc) continue;

      const sectionHeads = findSectionIndices(lines, cardName);
      if (!sectionHeads.length) {
        continue; // no obvious section found for this card name
      }

      // Insert into the first matching section
      const hIdx = sectionHeads[0];
      const bound = nextHeadingBoundary(lines, hIdx);

      // Check if an Image Description already exists in the section
      let already = false;
      for (let k = hIdx + 1; k < Math.min(bound, hIdx + 15); k++) {
        const t = (lines[k] || '').toLowerCase();
        if (t.includes('image description')) { already = true; break; }
      }
      if (already) continue;

      // Insert after heading line, add a blank line for readability
      const insertAt = Math.min(hIdx + 1, lines.length);
      const payload = ['', `Image Description: ${desc}`];
      lines.splice(insertAt, 0, ...payload);
      updatedCount++;
    }

    const newManual = lines.join('\n');
    if (newManual !== manual) {
      await base44.entities.Deck.update(deckId, { manual_content: newManual });
    }

    return Response.json({ message: 'Image descriptions inserted into manual.', created_new_manual: false, updated_count: updatedCount });
  } catch (error) {
    console.error('mergeImageDescriptionsIntoManual error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});