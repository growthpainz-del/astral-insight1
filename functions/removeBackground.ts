import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function removeBgFetch(imageUrl, apiKey) {
  const form = new FormData();
  form.set('image_url', imageUrl);
  form.set('size', 'auto');
  form.set('format', 'png');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`remove.bg error (${res.status}): ${txt || 'Unknown error'}`);
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  return buf;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const imageUrl = payload?.image_url;
    if (!imageUrl) {
      return Response.json({ error: 'image_url is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('REMOVE_BG_API_KEY') || '';
    if (!apiKey) {
      // Graceful: feature not enabled
      return Response.json({ status: 'disabled', message: 'Background removal not configured' }, { status: 200 });
    }

    const processed = await removeBgFetch(imageUrl, apiKey);

    // Upload processed PNG to public storage
    const file = new File([processed], 'removed-bg.png', { type: 'image/png' });
    const uploaded = await base44.asServiceRole.integrations.UploadFile({ file });
    const file_url = uploaded?.file_url || uploaded?.url;

    if (!file_url) {
      return Response.json({ error: 'Failed to upload processed image' }, { status: 500 });
    }

    return Response.json({ status: 'ok', file_url });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
});