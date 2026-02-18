import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DID_API = 'https://api.d-id.com';

async function ensureKnowledge({ apiKey, agentId, base44, config }) {
  const auth = 'Basic ' + btoa(apiKey);
  let knowledgeId = config.knowledge_id || null;

  if (!knowledgeId) {
    // Create knowledge
    const res = await fetch(`${DID_API}/knowledge`, {
      method: 'POST',
      headers: { 'Authorization': auth, 'accept': 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Astral Insight Knowledge', description: 'Deck manuals and JSON data synced from Astral Insight' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Failed to create knowledge: ${res.status} ${JSON.stringify(data)}`);
    }
    knowledgeId = data?.id;

    // Persist back to config
    await base44.asServiceRole.entities.DidAgentConfig.update(config.id, { knowledge_id: knowledgeId });
  }

  // Attach to agent (idempotent)
  if (agentId) {
    const attach = await fetch(`${DID_API}/agents/${encodeURIComponent(agentId)}`, {
      method: 'PATCH',
      headers: { 'Authorization': auth, 'accept': 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ knowledge: { id: knowledgeId } })
    });
    if (!attach.ok) {
      const det = await attach.json().catch(() => ({}));
      // Don't hard fail if already attached; just log
      console.warn('[didSyncKnowledge] attach response', attach.status, det);
    }
  }

  return knowledgeId;
}

function buildDeckDocumentText(deck, cards) {
  const lines = [];
  lines.push(`# Deck: ${deck.name}`);
  if (deck.description) lines.push(`Description: ${deck.description}`);
  if (deck.category) lines.push(`Category: ${deck.category}`);
  if (deck.author) lines.push(`Author: ${deck.author}`);

  // Manuals
  const manuals = [];
  if (Array.isArray(deck.manual_files)) {
    for (const m of deck.manual_files) {
      if (m?.name || m?.content) {
        manuals.push(`Manual: ${m?.name || 'Untitled'}\n${m?.content || ''}`);
      }
    }
  }
  if (deck.manual_content) {
    manuals.push(`Legacy Manual\n${deck.manual_content}`);
  }
  if (manuals.length) {
    lines.push('\n--- Manuals ---');
    lines.push(manuals.join('\n\n---\n\n'));
  }

  // Cards summary as JSON for structure + readable bullets
  if (Array.isArray(cards) && cards.length) {
    lines.push('\n--- Cards (summary) ---');
    for (const c of cards) {
      const bullets = [];
      if (c.subtitle) bullets.push(`Subtitle: ${c.subtitle}`);
      if (Array.isArray(c.keywords) && c.keywords.length) bullets.push(`Keywords: ${c.keywords.join(', ')}`);
      if (c.overall_meaning) bullets.push(`Overall: ${c.overall_meaning}`);
      if (c.upright_meaning) bullets.push(`Upright: ${c.upright_meaning}`);
      if (c.reversed_meaning) bullets.push(`Reversed: ${c.reversed_meaning}`);
      lines.push(`- ${c.name}${bullets.length ? ' | ' + bullets.join(' | ') : ''}`);
    }

    // Also include a compact JSON blob for LLM-friendly structure
    const compact = cards.map(c => ({
      id: c.id,
      name: c.name,
      number: c.number,
      keywords: c.keywords,
      overall_meaning: c.overall_meaning,
      upright_meaning: c.upright_meaning,
      reversed_meaning: c.reversed_meaning,
      custom_fields: c.custom_fields,
    }));
    lines.push('\n--- Cards JSON ---');
    lines.push(JSON.stringify(compact));
  }

  return lines.join('\n');
}

async function upsertDeckDocument({ apiKey, knowledgeId, deck, cards }) {
  const auth = 'Basic ' + btoa(apiKey);
  const text = buildDeckDocumentText(deck, cards);
  const title = `deck:${deck.id}:${deck.name}`.slice(0, 120);

  // For simplicity, append a new document version per update (D-ID lacks explicit upsert by name)
  const urlCandidates = [
    `${DID_API}/knowledge/${encodeURIComponent(knowledgeId)}/document`,
    `${DID_API}/knowledge/${encodeURIComponent(knowledgeId)}/documents`
  ];

  let lastErr = null;
  for (const url of urlCandidates) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + btoa(apiKey), 'accept': 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ name: title, type: 'text', content: text })
    });
    if (res.ok) return await res.json().catch(() => ({}));
    lastErr = { status: res.status, details: await res.json().catch(() => ({})) };
    if (res.status === 404 || res.status === 405) continue; // try next path
    break;
  }
  throw new Error(`Failed to create knowledge document for deck ${deck.id}: ${JSON.stringify(lastErr)}`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Identify caller (user or automation)
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }

    // If invoked by a user, restrict to admins
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const apiKey = Deno.env.get('D_ID_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing D_ID_API_KEY secret' }, { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));

    // Load singleton config (first record)
    const configs = await base44.asServiceRole.entities.DidAgentConfig.list();
    if (!configs || !configs.length) {
      return Response.json({ error: 'DidAgentConfig not set. Create one with agent_id and deck_ids.' }, { status: 400 });
    }
    const config = configs[0];
    const agentId = config.agent_id;

    // Ensure knowledge exists and is attached
    const knowledgeId = await ensureKnowledge({ apiKey, agentId, base44, config });

    // Decide scope: full or targeted deck
    let deckIds = config.deck_ids || [];

    // Automation delta: if event provided, narrow to affected deck
    if (payload?.event?.entity_name && (payload?.event?.type === 'create' || payload?.event?.type === 'update' || payload?.event?.type === 'delete')) {
      if (payload.event.entity_name === 'Deck') {
        const did = payload?.data?.id || payload?.event?.entity_id;
        if (did) deckIds = deckIds.filter(id => id === did);
      } else if (payload.event.entity_name === 'Card') {
        const deckId = payload?.data?.deck_id || payload?.old_data?.deck_id;
        if (deckId) deckIds = deckIds.filter(id => id === deckId);
      }
    }

    // Explicit override from request
    if (Array.isArray(payload?.deck_ids) && payload.deck_ids.length) {
      deckIds = payload.deck_ids;
    }

    if (!Array.isArray(deckIds) || deckIds.length === 0) {
      return Response.json({ error: 'No deck_ids configured to sync' }, { status: 400 });
    }

    const results = [];

    // Fetch and sync each deck
    for (const deckId of deckIds) {
      // Fetch the deck by ID via filter (SDK does not guarantee a get() method)
      const list = await base44.asServiceRole.entities.Deck.filter({ id: deckId });
      const deck = Array.isArray(list) && list[0] ? list[0] : null;
      if (!deck) {
        results.push({ deck_id: deckId, status: 'skipped', reason: 'deck not found' });
        continue;
      }
      const cards = await base44.asServiceRole.entities.Card.filter({ deck_id: deckId }, undefined, 1000).catch(() => []);

      try {
        const doc = await upsertDeckDocument({ apiKey, knowledgeId, deck, cards });
        results.push({ deck_id: deckId, status: 'ok', document_id: doc?.id || null });
      } catch (e) {
        console.error('[didSyncKnowledge] deck sync failed', deckId, e?.message);
        results.push({ deck_id: deckId, status: 'error', error: e?.message });
      }
    }

    // Update last synced timestamp on success cases
    const anyOk = results.some(r => r.status === 'ok');
    if (anyOk) {
      await base44.asServiceRole.entities.DidAgentConfig.update(config.id, { last_synced_at: new Date().toISOString() });
    }

    return Response.json({ knowledge_id: knowledgeId, agent_id: agentId, results });
  } catch (error) {
    console.error('[didSyncKnowledge] Unexpected', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});