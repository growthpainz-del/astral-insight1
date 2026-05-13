import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function isExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  // Treat Base44/Supabase storage as already internal
  return !/supabase\.co\/storage\/v1\/object\/public\/base44-prod/i.test(url);
}

function inferExtFromType(type) {
  if (!type) return 'bin';
  if (type.includes('png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  return 'bin';
}

function sanitizeName(s) {
  return (s || 'file').toLowerCase().replace(/[^a-z0-9\-_.]+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

async function rehostOne(base44, sourceUrl, filenameBase) {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status})`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const buf = new Uint8Array(await res.arrayBuffer());
  const ext = (() => {
    const urlExt = (new URL(sourceUrl)).pathname.split('.').pop()?.toLowerCase();
    if (urlExt && urlExt.length <= 5 && /^[a-z0-9]+$/.test(urlExt)) return urlExt;
    return inferExtFromType(contentType);
  })();
  const filename = `${sanitizeName(filenameBase)}.${ext}`;
  const file = new File([buf], filename, { type: contentType });
  // Upload to public storage
  const uploaded = await base44.asServiceRole.integrations.UploadFile({ file });
  return uploaded?.file_url || uploaded?.url || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const deckId = payload.deckId;
    if (!deckId) {
      return Response.json({ error: 'deckId is required' }, { status: 400 });
    }

    const deck = await base44.entities.Deck.get(deckId);
    
    if (deck.created_by !== user.email) {
      return Response.json({ error: 'Forbidden: You do not own this deck' }, { status: 403 });
    }

    const cards = await base44.entities.Card.filter({ deck_id: deckId });
    const result = {
      deckId,
      updated_cover: false,
      updated_back: false,
      updated_cards: 0,
      skipped_cards: 0,
      failed_cards: 0,
      failures: [],
    };

    // Rehost deck cover/back if external
    if (deck.cover_image && isExternalUrl(deck.cover_image)) {
      try {
        const newUrl = await rehostOne(base44, deck.cover_image, `${deck.name || 'deck'}-cover`);
        if (newUrl) {
          await base44.entities.Deck.update(deckId, { cover_image: newUrl });
          result.updated_cover = true;
        }
      } catch (e) {
        result.failures.push(`cover_image: ${e.message}`);
      }
    }
    if (deck.back_image_url && isExternalUrl(deck.back_image_url)) {
      try {
        const newUrl = await rehostOne(base44, deck.back_image_url, `${deck.name || 'deck'}-back`);
        if (newUrl) {
          await base44.entities.Deck.update(deckId, { back_image_url: newUrl });
          result.updated_back = true;
        }
      } catch (e) {
        result.failures.push(`back_image_url: ${e.message}`);
      }
    }

    // Rehost each card image if external
    for (const card of cards) {
      const url = card.image_url;
      if (!url || !isExternalUrl(url)) {
        result.skipped_cards += 1;
        continue;
      }
      try {
        const base = `${deck.name || 'deck'}-${card.name || 'card'}`;
        const newUrl = await rehostOne(base44, url, base);
        if (newUrl) {
          await base44.entities.Card.update(card.id, { image_url: newUrl });
          result.updated_cards += 1;
        } else {
          result.failed_cards += 1;
          result.failures.push(`${card.name || card.id}: upload returned no url`);
        }
      } catch (e) {
        result.failed_cards += 1;
        result.failures.push(`${card.name || card.id}: ${e.message}`);
      }
    }

    return Response.json(result);
  } catch (error) {
    console.error('rehostDeckImages error:', error);
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
});