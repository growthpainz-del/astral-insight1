import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { card_id_1, card_id_2 } = await req.json();

    if (!card_id_1 || !card_id_2) {
      return Response.json({ error: 'Both card_id_1 and card_id_2 are required' }, { status: 400 });
    }

    // Fetch both cards
    const [card1, card2] = await Promise.all([
      base44.entities.Card.get(card_id_1),
      base44.entities.Card.get(card_id_2)
    ]);

    if (!card1 || !card2) {
      return Response.json({ error: 'One or both cards not found' }, { status: 404 });
    }

    // Build analysis prompt
    const prompt = `You are an expert in tarot, oracle cards, and symbolic systems. Analyze the relationship between these two cards and suggest potential relationship types.

Card 1: "${card1.name}"
${card1.number ? `Number: ${card1.number}` : ''}
${card1.element ? `Element: ${card1.element}` : ''}
${card1.keywords?.length ? `Keywords: ${card1.keywords.join(', ')}` : ''}
${card1.overall_meaning ? `Meaning: ${card1.overall_meaning}` : ''}
${card1.upright_meaning ? `Upright: ${card1.upright_meaning}` : ''}
${card1.reversed_meaning ? `Reversed: ${card1.reversed_meaning}` : ''}

Card 2: "${card2.name}"
${card2.number ? `Number: ${card2.number}` : ''}
${card2.element ? `Element: ${card2.element}` : ''}
${card2.keywords?.length ? `Keywords: ${card2.keywords.join(', ')}` : ''}
${card2.overall_meaning ? `Meaning: ${card2.overall_meaning}` : ''}
${card2.upright_meaning ? `Upright: ${card2.upright_meaning}` : ''}
${card2.reversed_meaning ? `Reversed: ${card2.reversed_meaning}` : ''}

Analyze their relationship and suggest up to 3 potential relationship types from:
- complement: Cards that enhance or complete each other
- contrast: Cards that represent opposing forces or perspectives
- elemental: Cards connected through elemental associations
- thematic: Cards sharing common themes or archetypes
- sequence: Cards that follow a progression or journey
- custom: Unique relationships not covered by other types

For each suggested relationship, provide:
1. The relationship type
2. A strength score (0-1, where 1 is strongest)
3. A brief explanation (2-3 sentences)
4. Shared themes or keywords
5. Element relationship (if applicable): same, complementary, opposing, or none

Return your analysis as a JSON array of suggestions.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                relationship_type: {
                  type: "string",
                  enum: ["complement", "contrast", "elemental", "thematic", "sequence", "custom"]
                },
                strength: {
                  type: "number",
                  minimum: 0,
                  maximum: 1
                },
                explanation: {
                  type: "string"
                },
                shared_themes: {
                  type: "array",
                  items: { type: "string" }
                },
                element_relationship: {
                  type: "string",
                  enum: ["same", "complementary", "opposing", "none"]
                }
              },
              required: ["relationship_type", "strength", "explanation"]
            }
          }
        }
      }
    });

    return Response.json({
      card1: { id: card1.id, name: card1.name },
      card2: { id: card2.id, name: card2.name },
      suggestions: response.suggestions || []
    });

  } catch (error) {
    console.error('Error suggesting card relationships:', error);
    return Response.json({ 
      error: error.message || 'Failed to suggest relationships' 
    }, { status: 500 });
  }
});