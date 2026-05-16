import { createClientFromRequest } from 'npm:@base44/sdk@0.8.28';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      deckId, deckName, deckDescription, deckCategory,
      coreTheme, readingTone, targetAudience, cardDefinitionsStyle, extraContext,
      overwriteCards 
    } = await req.json();

    if (!deckId) {
      return Response.json({ error: 'Deck ID is required' }, { status: 400 });
    }

    const deck = await base44.entities.Deck.get(deckId);
    const cards = await base44.entities.Card.filter({ deck_id: deckId }, 'number', 78);

    // Prepare card list for the AI context
    const cardContext = cards.map(c => {
      const parts = [`Card: ${c.name}`];
      if (c.overall_meaning) parts.push(`Overall: ${c.overall_meaning}`);
      if (c.upright_meaning) parts.push(`Upright: ${c.upright_meaning}`);
      if (c.reversed_meaning) parts.push(`Reversed: ${c.reversed_meaning}`);
      if (c.keywords?.length) parts.push(`Keywords: ${c.keywords.join(', ')}`);
      return parts.join(' | ');
    }).join('\n');

    const prompt = `You are a professional oracle/tarot deck creator writing a comprehensive, beautifully formatted guidebook (manual) for a new deck.

DECK INFO:
Name: ${deckName}
Description: ${deckDescription}
Category: ${deckCategory}
Theme: ${coreTheme || 'General Oracle'}
Tone: ${readingTone || 'Mystical and insightful'}
Target Audience: ${targetAudience || 'Anyone'}
Definition Style: ${cardDefinitionsStyle || 'Standard Upright/Reversed'}
Extra Instructions: ${extraContext || 'None'}

EXISTING CARDS:
${cardContext}

TASK:
Write the complete Markdown manual for this deck. Do NOT output JSON, just output the raw Markdown text.

REQUIREMENTS:
1. Include an Introduction and "How to use this deck" section.
2. Include 2-3 custom reading spreads tailored to the deck's theme.
3. Include a comprehensive "Card Meanings" section. For each card in the deck, provide detailed meanings matching the requested Definition Style and Tone.
4. If "overwriteCards" is true or if existing card meanings are empty/generic, generate entirely NEW, deep, creative meanings for every card. Do NOT just copy the brief existing text. Expand on it creatively!
5. Make sure the manual is beautifully structured using Markdown headings (##, ###), bullet points, and bold text.
6. The manual should sound like a published, professional guidebook.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6" // Use a better model for writing long manuals
    });

    return Response.json({ 
      manual_content: result,
      success: true 
    });

  } catch (error) {
    console.error('Error generating manual:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});