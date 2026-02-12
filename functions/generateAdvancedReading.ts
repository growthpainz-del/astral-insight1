import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function getMoonPhase(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 3) { year--; month += 12; }
    let c = 365.25 * year;
    let e = 30.6 * month;
    let jd = c + e + day - 694039.09; // jd is total days elapsed
    jd /= 29.5305882; // divide by the moon cycle
    let b = parseInt(jd); // int(jd) -> b, take integer part of jd
    jd -= b; // subtract integer part to leave fractional part of original jd
    b = Math.round(jd * 8); // scale fraction from 0-8 and round
    if (b >= 8) b = 0; // 0 and 8 are the same so turn 8 into 0
    switch (b) {
        case 0: return 'New Moon';
        case 1: return 'Waxing Crescent';
        case 2: return 'First Quarter';
        case 3: return 'Waxing Gibbous';
        case 4: return 'Full Moon';
        case 5: return 'Waning Gibbous';
        case 6: return 'Last Quarter';
        case 7: return 'Waning Crescent';
        default: return 'New Moon';
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            drawnCards, 
            deck, 
            spread, 
            question, 
            tier = "standard", 
            includeMoonPhase = false,
            personaName,
            personaPreamble,
            adviceDepth = "balanced",
            language = "auto",
            conciseMode = false
        } = await req.json();

        // 1. Calculate Costs
        let tokenCost = tier === "quick" ? 1 : tier === "deep" ? 4 : 2;
        if (includeMoonPhase) tokenCost += 1;

        // 2. Check Balance
        if (typeof user.token_balance === "number" && user.token_balance < tokenCost) {
            return Response.json({ error: `Insufficient tokens. This reading costs ${tokenCost} tokens.` }, { status: 402 });
        }

        // 3. Prepare Prompt Data
        const spreadPositions = spread?.positions || [];
        const numPositions = spreadPositions.length;
        // Ensure we only use the relevant cards for the spread
        const relevantCards = drawnCards.slice(0, numPositions);

        const cardDescriptions = relevantCards
            .map((card, idx) => {
                const spreadPos = spreadPositions[idx];
                const posName = spreadPos?.name || card.position || `Position ${idx + 1}`;
                const posMeaning = spreadPos?.meaning || card.position_meaning || "";
                
                const cardName = card.name || "Unknown Card";
                const reversed = (card.is_reversed || card.isReversed) ? " (Reversed)" : "";

                let positionHeader = `POSITION ${idx + 1}: ${posName} - ${cardName}${reversed}`;
                if (posMeaning) positionHeader += `\n   → Position Represents: ${posMeaning}`;

                let meanings = [];
                if (card.overall_meaning) meanings.push(`Card Meaning: ${card.overall_meaning}`);
                if ((card.is_reversed || card.isReversed) && card.reversed_meaning) {
                    meanings.push(`Reversed Meaning: ${card.reversed_meaning}`);
                } else if (card.upright_meaning) {
                    meanings.push(`Upright Meaning: ${card.upright_meaning}`);
                }

                const meaningText = meanings.length > 0 ? meanings.join("\n   ") : "No description available";
                return `${positionHeader}\n   ${meaningText}`;
            })
            .join("\n\n");

        const deckDescription = deck?.description || "";
        const spreadDescription = spread?.description || spread?.name || "General spread";
        const spreadStructure = `This is a ${numPositions}-card ${spreadDescription} spread with these positions:\n${spreadPositions.map((p, i) => `${i + 1}. ${p.name || p}${p.meaning ? ` - ${p.meaning}` : ''}`).join('\n')}`;

        // Include structured AI insights if provided on the deck
        const deckInsights = deck?.ai_deck_insights && typeof deck.ai_deck_insights === 'object'
          ? JSON.stringify(deck.ai_deck_insights, null, 2)
          : '';
        const insightsSection = deckInsights
          ? `\n\nDECK INSIGHTS (Use these themes/style cues when interpreting):\n${deckInsights}`
          : '';

        const lengthInstructions = {
            quick: "Ultra concise: 2 short paragraphs max (≈120–180 words). Each card: 1–2 sentences. Include a 2–3 sentence synthesis at the end.",
            standard: "Concise: 3 short paragraphs max (≈200–300 words). Each card: 1–2 sentences. Include a 2–3 sentence synthesis at the end.",
            deep: "Focused depth: 4–5 paragraphs max (≈320–500 words). Each card: 2 sentences max; avoid repeating points. Include a 2–3 sentence synthesis and actionable guidance."
        };

        const conciseLengthInstructions = {
            quick: "One compact paragraph (80–120 words). Each card at most one sentence. Finish with a one-sentence synthesis.",
            standard: "One concise paragraph (120–160 words). Mention each card once; avoid repetition.",
            deep: "2–3 short paragraphs (200–300 words). Tight, non-repetitive, with a brief synthesis."
        };
        const chosenLengthInstruction = (conciseMode ? conciseLengthInstructions : lengthInstructions)[tier];

        const adviceDepthInstruction = adviceDepth === "concise"
          ? "COACHING DEPTH: Keep coaching succinct and action-oriented. One concrete action per card; minimal elaboration."
          : adviceDepth === "detailed"
          ? "COACHING DEPTH: Provide deeper, step-by-step coaching with nuanced guidance and rationale. Ensure practicality."
          : "COACHING DEPTH: Provide clear, practical coaching with moderate detail. One to two actionable suggestions per theme.";

        const languageNames = { auto: "auto", en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese", it: "Italian", hi: "Hindi", ja: "Japanese", zh: "Chinese (Simplified)" };
        const languageInstruction = language === "auto"
          ? "\n\nLANGUAGE RULES:\n- Detect the user's question language if present and write the entire interpretation and coaching in that language.\n- If no question is provided, default to English."
          : `\n\nLANGUAGE RULES:\n- Write the entire interpretation and coaching in ${languageNames[language] || language}.\n- If the question is in another language, translate implicitly and respond only in ${languageNames[language] || language}.`;

        const aiCoach = deck?.ai_reading_coach || "";
        const coachInstruction = aiCoach ? `\n\nIMPORTANT DECK-SPECIFIC GUIDANCE:\n${aiCoach}` : "";
        
        // --- PAST READINGS CONTEXT (personalization) ---
        let pastContext = "";
        try {
            const recent = await base44.entities.Reading.filter({ created_by: user.email }, "-created_date", 5);
            if (Array.isArray(recent) && recent.length > 0) {
                const snippets = recent.map((r, i) => {
                    const tagStr = (r.tags && r.tags.length) ? `Tags: ${r.tags.slice(0,5).join(', ')}` : "";
                    const interp = (r.interpretation || "").replace(/\s+/g, " ").slice(0, 220);
                    return `${i+1}. ${r.title || r.spread_type || 'Reading'} — ${tagStr}${tagStr ? " | " : ""}${interp}`;
                }).join("\n");
                pastContext = `\n\nPAST READINGS CONTEXT (last ${recent.length}):\n${snippets}\n\nUse these recurring themes to personalize tone and focus. Do not repeat the same sentences; build upon them.`;
            }
        } catch (_) {
            // ignore personalization if history fetch fails
        }

        // --- PAST READINGS PERSONALIZATION ---
let pastContext = "";
try {
  const recent = await base44.entities.Reading.filter({ created_by: user.email }, "-created_date", 5);
  if (Array.isArray(recent) && recent.length > 0) {
    const snippets = recent.map((r, i) => {
      const tagStr = (r.tags && r.tags.length) ? `Tags: ${r.tags.slice(0,5).join(', ')}` : "";
      const interp = (r.interpretation || "").replace(/\s+/g, " ").slice(0, 220);
      return `${i + 1}. ${r.title || r.spread_type || 'Reading'} — ${tagStr}${tagStr ? " | " : ""}${interp}`;
    }).join("\n");
    pastContext = `\n\nPAST READINGS CONTEXT (last ${recent.length}):\n${snippets}\n\nUse these recurring themes to personalize tone and focus. Do not repeat the same sentences; build upon them.`;
  }
} catch (_) {
  // ignore personalization if history fetch fails
}

const questionEmphasis = question && question.trim() 
            ? `\n\n🎯 THE QUERENT'S QUESTION (MUST BE DIRECTLY ADDRESSED):\n"${question}"\n\nThis question is the CORE of your reading. Every card interpretation should relate back to answering this specific question.`
            : "";

        // --- SILO: MOON PHASE ANALYSIS ---
        let moonContext = "";
        if (includeMoonPhase) {
            const currentMoon = getMoonPhase(new Date());
            
            // "Silo" call - get specific moon insights
            const moonPrompt = `
                You are a master Astrologer and Moonologist.
                Current Date: ${new Date().toDateString()}
                Current Moon Phase: ${currentMoon}
                
                Analyze how the ${currentMoon} phase energy influences these cards:
                ${relevantCards.map(c => `- ${c.name} (${c.element || 'Unknown Element'})`).join('\n')}
                
                Provide a concise (2-3 sentences) insight on how the moon phase colors this specific reading. 
                Focus on themes of growth, release, action, or reflection appropriate to the phase.
            `;
            
            const moonRes = await base44.integrations.Core.InvokeLLM({
                prompt: moonPrompt,
                add_context_from_internet: false
            });
            
            if (typeof moonRes === 'string') {
                moonContext = `\n\n🌑 LUNAR INFLUENCE (Integrate this seamlessly): The reading takes place under a ${currentMoon}. ${moonRes.trim()}`;
            }
        }
        // --------------------------------

        const finalPrompt = `You are ${personaName || "Mystical Guide"}, a skilled and compassionate card reader. ${personaPreamble || "Provide insightful and empowering guidance"}

CRITICAL TONE GUIDELINES - READ CAREFULLY:
- NEVER use apocalyptic, doom-based, or catastrophic language
- AVOID words like: apocalypse, end of the world, destruction, catastrophe, disaster, collapse
- Focus on EMPOWERMENT, GROWTH, and PRACTICAL WISDOM
- Even challenging cards represent OPPORTUNITIES for growth, not disasters
- Frame obstacles as TEMPORARY and SOLVABLE with the right approach
- Use uplifting, constructive language that inspires ACTION and HOPE
- Balance realism with optimism - acknowledge difficulties but emphasize potential
- Treat "difficult" cards as wake-up calls or invitations to transform, NOT as prophecies of doom

FORMAT AND MARKUP RULES:
- Do not use the asterisk (*) character anywhere (no emphasis, bullets, or decoration).
- Avoid Markdown: no bold/italics, no bullet lists, no code blocks.
- Write in clean paragraphs and full sentences only.

${chosenLengthInstruction}
${conciseMode ? "\nCONCISE MODE: Eliminate filler and transitions. Use short, direct sentences and avoid repeating ideas." : ""}

CONCISENESS RULES:
- For each card, write at most 2 sentences specific to its position and the question.
- Avoid repeating ideas across cards; if overlap exists, acknowledge it briefly without re-explaining.
- Remove filler and small talk; be direct and concrete.
- End with a 2–3 sentence synthesis tying the spread together and answering the question directly.

DECK: ${deck?.name || "Oracle Deck"}
${deckDescription ? `Deck Theme: ${deckDescription}` : ""}
${coachInstruction}
${insightsSection}
${languageInstruction}
${adviceDepthInstruction}
${pastContext}

 SPREAD STRUCTURE:
${spreadStructure}
${questionEmphasis}
${moonContext}

CARDS IN THIS READING (${relevantCards.length} cards):
${cardDescriptions}

CRITICAL: You MUST interpret ONLY these ${relevantCards.length} cards shown above. Do not mention any other cards or positions.

READING STRUCTURE - FOLLOW THIS EXACTLY:
1. ${question && question.trim() ? `START by acknowledging their specific question: "${question}"` : 'START with a warm opening'}
2. ${includeMoonPhase ? "Weave the Lunar Influence naturally into the interpretation." : ""}
3. Interpret each card IN THE CONTEXT OF THE QUESTION. You MUST explicitly name the card you are discussing (e.g. "The [Card Name] reveals...").
4. Show how the cards work together to answer the question
5. ${question && question.trim() ? 'END with a clear, direct answer to their question based on the cards' : 'END with practical guidance'}

Provide a ${tier} reading that:
1. ${question && question.trim() ? 'DIRECTLY ANSWERS THE QUESTION in your opening paragraph' : 'Addresses the general situation'}
2. Interprets each card specifically in relation to ${question && question.trim() ? 'the question asked' : 'their path'}, always referring to cards by their full names
3. Weaves the cards into a cohesive narrative that ${question && question.trim() ? 'answers their question' : 'provides guidance'}
4. Offers practical, actionable guidance that ${question && question.trim() ? 'helps them act on the answer' : 'inspires confidence'}
5. ${tier === "deep" ? "Explores deep connections WITHOUT doom language" : tier === "standard" ? "Balances depth with clarity" : "Delivers the core answer clearly"}
6. FRAMES CHALLENGES AS OPPORTUNITIES - never as disasters
7. EMPHASIZES the querent's power to SHAPE their future through conscious choices
8. ${question && question.trim() ? 'CONCLUDES by summarizing the answer to their question' : 'Concludes with empowering guidance'}

REMEMBER: ${question && question.trim() ? `Every sentence should help answer: "${question}"` : 'Focus on empowerment and growth'}

Write in a ${personaPreamble ? personaPreamble.toLowerCase() : "warm"} tone that is UPLIFTING and CONSTRUCTIVE. Begin your interpretation:`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: finalPrompt,
            add_context_from_internet: false
        });

        if (!response || typeof response !== "string") {
            throw new Error("Invalid response from interpretation service");
        }

        // 4. Deduct Tokens
        if (user && typeof user.token_balance === "number") {
            const newBalance = Math.max(0, user.token_balance - tokenCost);
            // Use service role to update if needed, but user.update is fine for self
            // We use base44.auth.me() user so we can update it directly via entity call usually
            // But let's use the standard update
             await base44.entities.User.update(user.id, {
                token_balance: newBalance,
                lifetime_tokens_used: (user.lifetime_tokens_used || 0) + tokenCost
            });
        }

        return Response.json({ 
            interpretation: response.trim(),
            moonContext: includeMoonPhase ? moonContext : null
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});