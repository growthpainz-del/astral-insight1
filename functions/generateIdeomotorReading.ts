import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { entropyData, cardId, question } = await req.json();

        // 1. Fetch the card to get its base vibrational metadata
        const card = await base44.entities.Card.get(cardId);
        if (!card) {
             return Response.json({ error: 'Card not found' }, { status: 404 });
        }

        // 2. Fetch user's current vibrational profile
        const userProfile = user.vibrational_profile || { current_frequency: 0, entropy_history: [] };

        // 3. Calculate new frequency based on this capture's entropy
        const newFrequency = (userProfile.current_frequency * 0.7) + (entropyData.entropy * 0.3);
        const dominancePattern = newFrequency > 5 ? "Chaotic/Active" : "Stable/Grounded";

        // Update user profile in background
        base44.entities.User.update(user.id, {
            vibrational_profile: {
                current_frequency: newFrequency,
                entropy_history: [...(userProfile.entropy_history || []), entropyData.entropy].slice(-10),
                last_reading_sync: new Date().toISOString(),
                dominance_pattern: dominancePattern
            }
        }).catch(console.error);

        // 4. Construct prompt for InvokeLLM incorporating the psychoacoustic entropy
        const prompt = `
You are the Astral-Insight Ideomotor Core.
The user has drawn the card "${card.name}".
Their touch entropy during the draw was measured at ${entropyData.entropy.toFixed(2)} (Dwell time: ${entropyData.dwellTime}ms).
Their current vibrational frequency is ${newFrequency.toFixed(2)} (${dominancePattern}).

Based on this specific energetic signature, provide a highly personalized reading.
If the entropy is high, the reading should be dynamic, urgent, and focused on shifting energies.
If the entropy is low, the reading should be grounded, steady, and focused on deep reflection.

Question asked: ${question || "General guidance"}

Provide the reading in two short paragraphs.
        `;

        const llmRes = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false
        });

        return Response.json({
            reading: typeof llmRes === 'string' ? llmRes : llmRes.text || "Insight channeled.",
            vibrationalSync: {
                entropy: entropyData.entropy,
                newFrequency,
                dominancePattern
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});