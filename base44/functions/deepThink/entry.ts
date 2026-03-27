import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public app: auth optional
    try { await base44.auth.me(); } catch (_) {}

    const { prompt, context, add_web_context } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const finalPrompt = context ? `${context}\n\nUser question: ${prompt}` : prompt;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: finalPrompt,
      add_context_from_internet: add_web_context ?? true
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});