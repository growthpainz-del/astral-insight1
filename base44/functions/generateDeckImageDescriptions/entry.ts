import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper: chunk an array
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Helper: RGB to hex
function rgbToHex(rgb) {
  const r = Math.round(rgb.red || 0);
  const g = Math.round(rgb.green || 0);
  const b = Math.round(rgb.blue || 0);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function visionAnnotate(imageUrl, apiKey) {
  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
  const body = {
    requests: [
      {
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'IMAGE_PROPERTIES', maxResults: 1 },
          { type: 'WEB_DETECTION', maxResults: 5 },
        ],
      },
    ],
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Vision API error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json?.responses?.[0] || {};
}

function buildVisionSummary(v) {
  if (!v) return '';
  const labels = (v.labelAnnotations || []).slice(0, 6).map(l => l.description).filter(Boolean);
  const objects = (v.localizedObjectAnnotations || []).slice(0, 6).map(o => o.name).filter(Boolean);
  const colors = (v.imagePropertiesAnnotation?.dominantColors?.colors || [])
    .slice(0, 4)
    .map(c => rgbToHex(c.color || {}));
  const web = (v.webDetection?.bestGuessLabels || []).slice(0, 2).map(w => w.label).filter(Boolean);

  const parts = [];
  if (labels.length) parts.push(`Labels: ${labels.join(', ')}`);
  if (objects.length) parts.push(`Objects: ${objects.join(', ')}`);
  if (web.length) parts.push(`Web guesses: ${web.join(', ')}`);
  if (colors.length) parts.push(`Colors: ${colors.join(', ')}`);
  return parts.join(' | ');
}

async function generateAltTextBatch(base44, items) {
  // items = [{ id, name, keywords, visionSummary }]
  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['id', 'description'],
        },
      },
    },
    required: ['items'],
  };

  const prompt = [
    'You are an expert alt-text writer for accessibility.',
    'For each card image below, write a neutral, objective 1-2 sentence description (max 35 words).',
    'Mention subject, composition, notable elements, style, and key colors. Do NOT include interpretations, tarot meanings, feelings, or text not visible. Avoid \'appears to\' hedging.',
    '',
    'Return JSON with { items: [{ id, description }] } using the provided schema.',
    '',
    'Cards:',
    ...items.map(i => `- id: ${i.id}\n  name: ${i.name || ''}\n  keywords: ${(i.keywords || []).join(', ')}\n  vision: ${i.visionSummary || ''}`),
  ].join('\n');

  const resp = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
  });

  // May return object directly when schema is used
  return resp;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const deckName = body.deck_name || body.deckName || 'Rooted Crescent';
    const deckId = body.deck_id || body.deckId || null;

    // Find deck
    let deck = null;
    if (deckId) {
      try {
        deck = await base44.entities.Deck.get(deckId);
      } catch (_) {}
    }
    if (!deck) {
      const decks = await base44.entities.Deck.filter({ name: deckName }, '-created_date', 5);
      deck = decks?.find(d => String(d.name || '').toLowerCase() === String(deckName).toLowerCase()) || decks?.[0] || null;
    }
    if (!deck) {
      return Response.json({ error: `Deck not found: ${deckName}` }, { status: 404 });
    }

    // Load cards
    const cards = await base44.entities.Card.filter({ deck_id: deck.id }, '-created_date', 500);
    if (!cards?.length) {
      const payload = {
        deck: deck,
        generated_at: new Date().toISOString(),
        cards: [],
      };
      return new Response(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${(deck.name || 'deck').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}-image-descriptions.json"`,
        },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Missing GOOGLE_CLOUD_VISION_API_KEY' }, { status: 500 });
    }

    // Annotate with Vision (sequential with small concurrency to avoid quotas)
    const annotated = [];
    for (const card of cards) {
      const url = card.image_url || card.thumbnail_url || null;
      if (!url) {
        annotated.push({ card, vision: null, visionSummary: '' });
        continue;
      }
      try {
        const vision = await visionAnnotate(url, apiKey);
        const visionSummary = buildVisionSummary(vision);
        annotated.push({ card, vision, visionSummary });
      } catch (e) {
        // Log but continue
        console.error('Vision failed for card', card.id, e?.message || e);
        annotated.push({ card, vision: null, visionSummary: '' });
      }
    }

    // Build items for LLM in chunks to keep prompt size reasonable
    const allItems = annotated.map(({ card, visionSummary }) => ({
      id: String(card.id),
      name: card.name || '',
      keywords: Array.isArray(card.keywords) ? card.keywords : [],
      visionSummary,
    }));

    const chunks = chunk(allItems, 20);
    const descriptionsMap = new Map();

    for (const group of chunks) {
      try {
        const llmRes = await generateAltTextBatch(base44, group);
        const items = llmRes?.items || llmRes?.data?.items || [];
        for (const it of items) {
          if (it && it.id) {
            descriptionsMap.set(String(it.id), String(it.description || '').trim());
          }
        }
      } catch (e) {
        console.error('LLM generation failed for a chunk:', e?.message || e);
        // Fallback: use visionSummary directly trimmed to ~30 words
        for (const it of group) {
          const words = (it.visionSummary || '').split(/\s+/).slice(0, 30).join(' ');
          descriptionsMap.set(String(it.id), words || 'Illustrated card with symbolic elements.');
        }
      }
    }

    const result = {
      deck: {
        id: deck.id,
        name: deck.name,
        category: deck.category,
        created_by: deck.created_by,
        created_date: deck.created_date,
        updated_date: deck.updated_date,
      },
      generated_at: new Date().toISOString(),
      cards: cards.map((c) => ({
        id: c.id,
        created_date: c.created_date,
        updated_date: c.updated_date,
        deck_id: c.deck_id,
        name: c.name,
        subtitle: c.subtitle,
        image_url: c.image_url,
        number: c.number,
        keywords: c.keywords || [],
        image_description: descriptionsMap.get(String(c.id)) || null,
      })),
    };

    const filename = `${(deck.name || 'deck').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}-image-descriptions.json`;
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('generateDeckImageDescriptions error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});