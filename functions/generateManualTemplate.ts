import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deckId, deckName, deckDescription, deckCategory } = await req.json();
    if (!deckId) {
      return Response.json({ error: 'Deck ID is required' }, { status: 400 });
    }

    const deck = await base44.entities.Deck.get(deckId);
    const cards = await base44.entities.Card.filter({ deck_id: deckId }, 'number', 78);

    // Generate comprehensive manual text
    const manualSections = [
      `# ${deckName} - Manual Reading Guide`,
      ``,
      `## Introduction`,
      `This guide teaches you how to read the ${deckName} deck without AI assistance.`,
      deckDescription ? `\n${deckDescription}\n` : '',
      ``,
      `## How to Do a Reading Manually`,
      ``,
      `### Step 1: Prepare Your Space`,
      `- Find a quiet, comfortable space`,
      `- Clear your mind and focus on your question`,
      `- Shuffle the deck while concentrating on what you want to know`,
      ``,
      `### Step 2: Draw Your Cards`,
      `- Choose a spread that fits your question (single card, 3-card, etc.)`,
      `- Draw cards intuitively - trust your instincts`,
      `- Lay them out in the spread pattern`,
      ``,
      `### Step 3: Interpret the Cards`,
      `- Look at each card's imagery and symbolism`,
      `- Consider the position meaning in your spread`,
      `- Note if cards are reversed (upside down)`,
      `- Reflect on how the cards relate to your question`,
      ``,
      `## Card Meanings`,
      ``
    ];

    // Add card meanings
    cards.forEach((card, idx) => {
      manualSections.push(`### ${card.number || idx + 1}. ${card.name}`);
      if (card.overall_meaning) {
        manualSections.push(`**Overall:** ${card.overall_meaning}`);
      }
      if (card.upright_meaning) {
        manualSections.push(`**Upright:** ${card.upright_meaning}`);
      }
      if (card.reversed_meaning) {
        manualSections.push(`**Reversed:** ${card.reversed_meaning}`);
      }
      if (card.keywords?.length) {
        manualSections.push(`**Keywords:** ${card.keywords.join(', ')}`);
      }
      manualSections.push('');
    });

    // Add spread guidance
    manualSections.push(`## Common Spreads`);
    manualSections.push(``);
    manualSections.push(`### Single Card Draw`);
    manualSections.push(`Perfect for daily guidance or quick questions.`);
    manualSections.push(``);
    manualSections.push(`### Three Card Spread (Past-Present-Future)`);
    manualSections.push(`- Position 1: Past influences`);
    manualSections.push(`- Position 2: Current situation`);
    manualSections.push(`- Position 3: Future outcome`);
    manualSections.push(``);

    const manual_content = manualSections.join('\n');

    return Response.json({ 
      manual_content,
      success: true 
    });

  } catch (error) {
    console.error('Error generating manual:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});