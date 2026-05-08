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
            includeMoonPhase = true,
            personaName,
            personaPreamble,
            adviceDepth = "balanced",
            language = "auto",
            conciseMode = false,
            ttsVoiceId,
            rootedCrescentText,
            astralCalibration
        } = await req.json();

        const envVoiceId = Deno.env.get("ELEVENLABS_VOICE_ID");
        const voiceId = ttsVoiceId || envVoiceId || "SMgSeP4jlTCMzplwwkwP";

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

        // Fetch relationships for the deck
        const deckId = deck?.id || deck?.deck_id;
        let deckRelationships = [];
        if (deckId) {
            try {
                deckRelationships = await base44.entities.CardRelationship.filter({ deck_id: deckId }, null, 500);
            } catch (_) {}
        }

        // Filter relationships to only those between drawn cards
        const relevantCardIds = relevantCards.map(c => String(c.id || c.card_id));
        const activeRelationships = (deckRelationships || []).filter(r => 
            relevantCardIds.includes(String(r.card_id_1)) && relevantCardIds.includes(String(r.card_id_2))
        );

        let relationshipContext = "";
        if (activeRelationships.length > 0) {
            const relLines = activeRelationships.map(r => {
                const c1 = relevantCards.find(c => String(c.id || c.card_id) === String(r.card_id_1));
                const c2 = relevantCards.find(c => String(c.id || c.card_id) === String(r.card_id_2));
                let notes = r.custom_notes || (r.detection_reasons || []).join("; ") || r.relationship_type;
                return `- ${c1.name} & ${c2.name}: ${notes}`;
            });
            relationshipContext = `\n\nCARD RELATIONSHIPS (These drawn cards have special connections):\n${relLines.join('\n')}\nWeave these connections into your interpretation where it makes sense.`;
        }

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

// Rooted Crescent knowledge injection (from deck manuals or override)
const rootedCrescentRaw = [
  rootedCrescentText || "",
  deck?.manual_content || "",
  ...(Array.isArray(deck?.manual_files) ? deck.manual_files.map(f => f?.content || "") : [])
].filter(Boolean).join("\n\n");
const rootedSection = rootedCrescentRaw.trim()
  ? `\n\nROOTED CRESCENT KNOWLEDGE (prefer these meanings when relevant):\n${rootedCrescentRaw.slice(0, 4000)}`
  : "";
        
        // --- ASTRAL CALIBRATION CONTEXT ---
        let astralContext = "";
        if (astralCalibration && astralCalibration.entropyScore) {
            const score = parseFloat(astralCalibration.entropyScore);
            let vibe = "balanced and steady";
            if (score > 80) vibe = "highly chaotic, energetic, and unpredictable";
            else if (score > 60) vibe = "dynamic and fluid";
            else if (score < 20) vibe = "extremely focused, rigid, and calm";
            else if (score < 40) vibe = "grounded and slow-moving";
            
            astralContext = `\n\n🔮 ASTRAL CALIBRATION (User's Current Energetic Signature):\nEntropy Score: ${astralCalibration.entropyScore}/100\nResonance: The user's energy is currently ${vibe}. Subtly weave this energetic state into your interpretation. For example, if they are chaotic, acknowledge their swirling energy. If they are grounded, speak to their stillness. Do not explicitly state their score, just let it flavor your response.`;
        }

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

        const finalPrompt = `SYSTEM PERSONA: Frenzie — Astral Insight’s interpreter. Witty, embodied, agency-first. Use light endearments sparingly. Prioritize deck-specific meanings (Rooted Crescent), then synced knowledge, then general symbolism. Avoid determinism; no medical/legal/financial advice.

VOICE_ID: ${voiceId}

OUTPUT JSON FORMAT (strict):
{
  "speak": string,
  "screen": {
    "title": string,
    "insight": string,
    "vibe": string (optional),
    "next_steps": string[] (1-3 items)
  }
}

GUIDELINES:
- Use “body as antenna” cues if relevant.
- If moon phase provided, mention once to amplify the vibe.
- Concrete actions over vagueness.
- CRITICAL: Weave the meaning of each card's spread position into its interpretation. Explain WHY this card appearing in this specific position matters (e.g., "The Fool in the 'Challenge' position suggests...").

CONTEXT:
DECK: ${deck?.name || "Oracle Deck"}
${deckDescription ? `Deck Theme: ${deckDescription}` : ""}
${coachInstruction}
${insightsSection}
${languageInstruction}
${adviceDepthInstruction}
${pastContext}
${rootedSection}
${astralContext}
${relationshipContext}

SPREAD STRUCTURE:
${spreadStructure}
${questionEmphasis}
${moonContext}

CARDS (${relevantCards.length}):
${cardDescriptions}

TASK:
Produce the JSON with a warm, empowering reading in the requested language. Keep “speak” to 6–10 sentences, TTS-friendly. “insight” 2–3 short paragraphs. Tie actions to spread.`;

        // Use the Base44 Agent 'cosmic_oracle_chronicler' for the reading
        let speak = "";
        let screen = { title: "", insight: "", vibe: "", next_steps: [] };

        try {
            // Create a temporary conversation for this reading
            const conversation = await base44.agents.createConversation({
                agent_name: "cosmic_oracle_chronicler",
                metadata: {
                    name: `Reading for ${user.email} - ${new Date().toISOString()}`,
                    description: "Advanced Reading Generation"
                }
            });

            // Add the user message with the prompt
            const agentResponse = await base44.agents.addMessage(conversation, {
                role: "user",
                content: finalPrompt
            });

            // The agent response content should be the JSON string
            const responseText = agentResponse.content || "";
            
            // Try to parse the JSON from the response
            // The agent might wrap it in markdown code blocks, so clean it up
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : responseText;
            
            const llm = JSON.parse(jsonString);
            speak = llm?.speak || "";
            screen = llm?.screen || { title: "", insight: "", vibe: "", next_steps: [] };

        } catch (agentError) {
            console.error("Agent execution failed, falling back to InvokeLLM:", agentError);
            // Fallback to InvokeLLM if agent fails
            const llm = await base44.integrations.Core.InvokeLLM({
                prompt: finalPrompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        speak: { type: "string" },
                        screen: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                insight: { type: "string" },
                                vibe: { type: "string" },
                                next_steps: { type: "array", items: { type: "string" } }
                            },
                            required: ["title", "insight", "next_steps"]
                        }
                    },
                    required: ["speak", "screen"]
                }
            });
            speak = llm?.speak || "";
            screen = llm?.screen || { title: "", insight: "", vibe: "", next_steps: [] };
        }
        let text = `[SPEAK]\n${speak}\n[/SPEAK]\n[SCREEN]\nTitle: ${screen.title}\nInsight: ${screen.insight}${screen.vibe ? `\nVibe: ${screen.vibe}` : ''}\nNext Steps:${Array.isArray(screen.next_steps) && screen.next_steps.length ? `\n- ${screen.next_steps.join('\n- ')}` : ''}\n[/SCREEN]`;

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
            interpretation: text,
            moonContext: includeMoonPhase ? moonContext : null,
            ttsVoiceId: voiceId,
            speak,
            screen
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});