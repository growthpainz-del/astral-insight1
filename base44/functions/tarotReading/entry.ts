import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const reqBody = await req.json();
    const { intention, wheelResults } = reqBody;

    // 1. Fetch 3 random tarot cards
    const tarotRes = await fetch('https://tarotapi.dev/api/v1/cards/random?n=3');
    const tarotData = await tarotRes.json();
    
    const cards = tarotData.cards.map((card: any) => {
      const isReversed = Math.random() > 0.5;
      return {
        name: card.name,
        suit: card.suit,
        type: card.type,
        meaning: isReversed ? card.meaning_rev : card.meaning_up,
        orientation: isReversed ? 'reversed' : 'upright',
        desc: card.desc
      };
    });

    // 3. Build wheel context summary
    const contextSummary = `
      Intention: ${intention || 'General Guidance'}
      Wheel Results: ${JSON.stringify(wheelResults)}
      Tarot Draw (Past/Present/Future): ${cards.map((c: any) => `${c.name} (${c.orientation})`).join(', ')}
    `;

    // 4. Send combined context to InvokeLLM
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a mystical tarot reader. Based on this wheel spin and tarot draw, provide a poetic 3-paragraph interpretation:\n\n${contextSummary}`,
      model: "automatic"
    });

    return Response.json({
      cards,
      interpretation: llmRes
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});