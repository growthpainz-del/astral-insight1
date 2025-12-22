import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let { numCards = 3, readingType = 'General', theme = '', includeRotations = true } = body || {};

    if (typeof numCards !== 'number' || isNaN(numCards)) numCards = 3;
    numCards = Math.max(1, Math.min(15, Math.round(numCards)));

    // Build a clear system instruction for structured output
    const prompt = `You are an expert tarot/oracle spread designer.
Design a custom spread tailored to the user's intent.

Requirements:
- Exactly ${numCards} positions.
- Reading type/category: ${readingType}.
- User theme/hints: ${theme || 'None provided'}.
- Provide distinctive, evocative position names and concise meanings (1 sentence each).
- Provide suggested visual coordinates for each position as percentages of the canvas (0-100 where (50,50) is center). Keep cards within 10-90% range to avoid clipping.
- Propose a clear, balanced layout (lines, arcs, crosses, circles, paths) that fits the reading type.
- Rotations are optional: 0 for normal; 90 can indicate crossing if the structure makes sense.

Output must follow the JSON schema strictly.`;

    const schema = {
      type: 'object',
      properties: {
        spread_name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              meaning: { type: 'string' },
              x: { type: 'number', minimum: 0, maximum: 100 },
              y: { type: 'number', minimum: 0, maximum: 100 },
              rotation: { type: 'number' }
            },
            required: ['name', 'meaning', 'x', 'y']
          }
        }
      },
      required: ['spread_name', 'description', 'positions']
    };

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      add_context_from_internet: false,
    });

    // Ensure structure and clamp coordinates just in case
    const out = llmRes || {};
    const positions = Array.isArray(out.positions) ? out.positions.map((p, i) => {
      const x = Math.max(10, Math.min(90, Number(p?.x ?? 50)));
      const y = Math.max(10, Math.min(90, Number(p?.y ?? 50)));
      const rotation = includeRotations ? Number(p?.rotation ?? 0) : 0;
      const name = String(p?.name || `Position ${i + 1}`);
      const meaning = String(p?.meaning || '');
      return { name, meaning, x, y, rotation };
    }) : [];

    if (positions.length !== numCards) {
      // If model returned a different count, adjust by truncating or filling
      const needed = numCards - positions.length;
      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          positions.push({ name: `Position ${positions.length + 1}`, meaning: '', x: 50, y: 50, rotation: 0 });
        }
      } else if (needed < 0) {
        positions.length = numCards;
      }
    }

    const suggestion = {
      spread_name: String(out.spread_name || `${readingType} Spread (${numCards})`).slice(0, 80),
      description: String(out.description || `An AI-generated ${readingType.toLowerCase()} spread with ${numCards} positions.`),
      category: String(out.category || readingType || 'General'),
      positions,
    };

    return Response.json({ suggestion });
  } catch (error) {
    return Response.json({ error: error?.message || 'Failed to generate suggestion' }, { status: 500 });
  }
});