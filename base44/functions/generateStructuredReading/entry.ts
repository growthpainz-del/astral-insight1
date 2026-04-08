import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const COSMIC_SYMBOLS = [
    {
      name: "Celestial Bodies",
      description: "light, power, visibility",
      symbols: [
        { name: "Sun", meaning: "Vitality, conscious clarity, outward success" },
        { name: "Moon", meaning: "Intuition, emotional tides, inner rhythms" },
        { name: "Star", meaning: "Hope, distant guidance, unique spark" },
        { name: "Comet", meaning: "Sudden insight, swift opportunity, fleeting message" }
      ]
    },
    {
      name: "Lunar Phases",
      description: "cycles, timing, emotional flow",
      symbols: [
        { name: "New Moon", meaning: "Fresh beginnings, hidden potential, intention setting" },
        { name: "Crescent Moon", meaning: "Building growth, subtle emergence" },
        { name: "Full Moon", meaning: "Peak illumination, culmination, emotional height" },
        { name: "Waning Moon", meaning: "Release, reflection, gentle closure" }
      ]
    },
    {
      name: "Planetary Forces",
      description: "core drives, influences",
      symbols: [
        { name: "Mercury", meaning: "Quick thought, communication, agile mind" },
        { name: "Venus", meaning: "Harmony, attraction, heart connections" },
        { name: "Mars", meaning: "Courage, drive, focused action" },
        { name: "Jupiter", meaning: "Expansion, opportunity, broader view" },
        { name: "Saturn", meaning: "Structure, endurance, karmic lessons" }
      ]
    },
    {
      name: "Crystals & Gems",
      description: "vibrational anchors, energetic tones",
      symbols: [
        { name: "Moonstone", meaning: "Gentle intuition, emotional flow, feminine rhythms" },
        { name: "Amethyst", meaning: "Calm clarity, spiritual protection, higher awareness" },
        { name: "Citrine", meaning: "Joyful expansion, personal power, bright abundance" },
        { name: "Lapis Lazuli", meaning: "Truthful vision, ancient wisdom, clear expression" },
        { name: "Rose Quartz", meaning: "Heart softening, compassionate connection, unconditional love" },
        { name: "Clear Quartz", meaning: "Pure amplification, focused energy, universal clarity" }
      ]
    },
    {
      name: "Astral Phenomena & Ether",
      description: "mystery, vastness, wonder",
      symbols: [
        { name: "Nebula", meaning: "Creative birth, swirling potential, cosmic clouds" },
        { name: "Galaxy", meaning: "Interconnected destiny, vast patterns, collective story" },
        { name: "Aurora", meaning: "Ethereal dance, shifting beauty, wonder in motion" },
        { name: "Black Hole", meaning: "Deep pull, transformation, surrender to unknown" },
        { name: "Constellation", meaning: "Soul mapping, pattern recognition, guiding stories" }
      ]
    }
];

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { category_id, category: providedCategory, deck_id, drawnCards, includeMoonPhase, question_category } = await req.json();

        // 1. Get the category definition from the database
        let category = providedCategory;
        if (category_id && category_id !== "default") {
            const dbCategory = await base44.asServiceRole.entities.ReadingCategory.get(category_id);
            if (dbCategory) category = dbCategory;
        }

        if (!category) {
            return Response.json({ error: "Category not found." }, { status: 404 });
        }

        const deck = await base44.asServiceRole.entities.Deck.get(deck_id);
        const engineConfig = deck?.engine_config || {};
        const activeCosmicSymbols = engineConfig.cosmic_symbols?.categories || COSMIC_SYMBOLS;

        // 2. Randomly select booster symbols from this specific category
        const symbols = category.booster_symbols || [];
        const selectedBoosters = [];
        
        // Let's pick 2 random boosters if available
        if (symbols.length > 0) {
            const shuffled = symbols.sort(() => 0.5 - Math.random());
            selectedBoosters.push(shuffled[0]);
            if (symbols.length > 1) {
                selectedBoosters.push(shuffled[1]);
            }
        }

        // 3. Determine Moon Phase (simple programmatic calculation, no AI needed)
        let moonPhase = "Unknown Phase";
        let moonMeaning = "Lunar energy is neutral today.";
        if (includeMoonPhase) {
            const date = new Date();
            const phaseNum = (date.getTime() / 86400000 - 6.475) % 29.53; // approximate lunar cycle
            if (phaseNum < 1 || phaseNum > 28.5) { moonPhase = "New Moon"; moonMeaning = "Initiation, planting seeds, new beginnings."; }
            else if (phaseNum < 7.4) { moonPhase = "Waxing Crescent"; moonMeaning = "Intention, taking action, growing energy."; }
            else if (phaseNum < 14.8) { moonPhase = "First Quarter"; moonMeaning = "Momentum, challenges, building momentum."; }
            else if (phaseNum < 22.1) { moonPhase = "Full Moon"; moonMeaning = "Culmination, harvest, intense emotions."; }
            else { moonPhase = "Waning Crescent"; moonMeaning = "Release, letting go, resting."; }
        }

        // 4. Construct the 3 Branches of Information
        // Branch 1: The Core Energy (Based on the first card drawn and its position)
        const primaryCard = drawnCards[0] || null;
        let branch1Content = "No card drawn for core energy.";
        if (primaryCard) {
            const positionText = primaryCard.position ? ` (in position: ${primaryCard.position} - ${primaryCard.position_meaning || "Core Focus"})` : "";
            branch1Content = `The ${primaryCard.name}${positionText} brings the primary focus: ${primaryCard.overall_meaning || primaryCard.upright_meaning}`;
        }
        const branch1 = {
            title: category.branch_1_title || "The Core Energy",
            content: branch1Content
        };

        let randomCosmicSymbolStr = "";
        let cosmic_symbol = null;
        if (question_category) {
            const allSymbols = activeCosmicSymbols.flatMap(c => c.symbols || []);
            if (allSymbols.length > 0) {
                cosmic_symbol = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                randomCosmicSymbolStr = `Cosmic Symbol (${cosmic_symbol.name}): ${cosmic_symbol.meaning}\n(Applying to Focus Area: ${question_category})`;
            }
        }

        // Branch 2: The Modifiers (Based on Moon Phase and Category Booster Symbols)
        const branch2 = {
            title: category.branch_2_title || "The Modifiers",
            content: `Moon Phase: ${moonPhase} - ${moonMeaning}\n` + 
                     `Booster Symbols: \n` + 
                     selectedBoosters.map(b => `${b.symbol} : ${b.meaning}`).join('\n')
        };

        // Branch 3: The Supporting Action (Based on subsequent cards, their positions, or generalized guidance)
        let branch3Content = "Rely on your boosters and core energy to determine your next steps.";
        if (drawnCards.length > 1) {
            const subsequentCards = drawnCards.slice(1);
            branch3Content = subsequentCards.map((card, idx) => {
                const posText = card.position ? ` (Position: ${card.position} - ${card.position_meaning || "Influence"})` : "";
                return `${idx + 1}. ${card.name}${posText}: ${card.upright_action || card.upright_insight || card.overall_meaning || card.upright_meaning}`;
            }).join('\n\n');
            branch3Content = `The following forces provide supporting guidance and outcome indicators:\n\n${branch3Content}`;
        }

        let relationshipsText = "";
        if (drawnCards.length > 1) {
            const relationshipPromises = [];
            const pairs = [];
            for (let i = 0; i < drawnCards.length; i++) {
                for (let j = i + 1; j < drawnCards.length; j++) {
                    const c1 = drawnCards[i].id || drawnCards[i].card_id;
                    const c2 = drawnCards[j].id || drawnCards[j].card_id;
                    const name1 = drawnCards[i].name;
                    const name2 = drawnCards[j].name;
                    if (c1 && c2) {
                        const minId = c1 < c2 ? c1 : c2;
                        const maxId = c1 > c2 ? c1 : c2;
                        const relKey = `${minId}|${maxId}`;
                        pairs.push({ name1, name2, relKey });
                        relationshipPromises.push(
                            base44.asServiceRole.entities.CardRelationship.filter({ deck_id: deck_id, relationship_key: relKey })
                        );
                    }
                }
            }
            const relResults = await Promise.all(relationshipPromises);
            
            const relationshipDescriptions = [];
            relResults.forEach((rels, index) => {
                if (rels && rels.length > 0) {
                    const pair = pairs[index];
                    const rel = rels[0];
                    const type = rel.relationship_type !== 'custom' ? rel.relationship_type : 'connected';
                    const notes = rel.custom_notes ? ` (${rel.custom_notes})` : '';
                    const shared = rel.shared_keywords && rel.shared_keywords.length > 0 ? ` [Shared: ${rel.shared_keywords.join(', ')}]` : '';
                    relationshipDescriptions.push(`• ${pair.name1} & ${pair.name2}: ${type} relationship${notes}${shared}.`);
                }
            });

            if (relationshipDescriptions.length > 0) {
                relationshipsText = `\n\nDetected Card Relationships:\n${relationshipDescriptions.join('\n')}`;
            }
        }
        
        const branch3 = {
            title: category.branch_3_title || "The Action / Outcome",
            content: branch3Content + relationshipsText
        };

        return Response.json({
            reading: {
                branch_1: branch1,
                branch_2: branch2,
                branch_3: branch3,
                instructions: category.interpretation_instructions,
                boosters_used: selectedBoosters,
                cosmic_symbol: cosmic_symbol
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});