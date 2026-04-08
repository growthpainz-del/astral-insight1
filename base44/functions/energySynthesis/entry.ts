import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { question_category, drawnCards, elemental_symbols } = await req.json();

        if (!drawnCards || !drawnCards.length) {
            return Response.json({ error: 'No drawn cards provided.' }, { status: 400 });
        }

        const cardsDetails = drawnCards.map(c => 
            `- ${c.name} ${c.position ? `(Position: ${c.position})` : ''}: ${c.upright_meaning || c.overall_meaning || 'No meaning provided'}`
        ).join('\n');

        const symbolsDetails = (elemental_symbols && elemental_symbols.length) 
            ? elemental_symbols.map(s => `- ${s.name}: ${s.meaning || 'No meaning'}`).join('\n')
            : 'No elemental symbols drawn.';

        const prompt = `You are a gifted oracle reader and mystic. Your task is to generate a customized 'Energy Synthesis' interpretation.

Focus Area / Question Category: "${question_category || 'General Guidance'}"

Drawn Oracle Cards:
${cardsDetails}

Elemental Symbols Drawn:
${symbolsDetails}

Cross-reference the focus area with the drawn cards and the elemental symbols. 
Write a cohesive, 2-3 paragraph "Energy Synthesis" that blends these forces together into a meaningful, empowering reading. Keep the tone mystical, insightful, and practical.`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            model: "automatic"
        });

        return Response.json({ synthesis: response });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});