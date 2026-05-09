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
        const { category_id, category: providedCategory, deck_id, drawnCards, spread, includeMoonPhase, question_category } = await req.json();

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
        // Branch 1: The Core Energy (Based on the spread positions and drawn cards)
        let branch1Content = "No cards drawn.";
        if (drawnCards.length > 0) {
            branch1Content = drawnCards.map((card, idx) => {
                const posText = card.position ? `[${card.position}${card.position_meaning ? ` - ${card.position_meaning}` : ''}]` : `[Card ${idx + 1}]`;
                const meaning = card.is_reversed || card.isReversed ? (card.reversed_meaning || card.overall_meaning) : (card.upright_meaning || card.overall_meaning);
                return `**${posText}**\nThe ${card.name}: ${meaning}`;
            }).join('\n\n');
        }
        const branch1 = {
            title: (category.branch_1_title || "The Core Energy") + (spread ? ` (${spread.name})` : ""),
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

        // Branch 3: The Supporting Action
        let branch3Content = "Rely on your boosters and core energy to determine your next steps.";
        if (drawnCards.length > 0) {
            branch3Content = drawnCards.map((card, idx) => {
                const posText = card.position ? `[${card.position}]` : `[Card ${idx + 1}]`;
                const action = card.is_reversed || card.isReversed ? (card.reversed_action || card.reversed_insight || card.reversed_meaning) : (card.upright_action || card.upright_insight || card.upright_meaning);
                return `**${posText}** ${card.name}: ${action || 'Reflect on this energy.'}`;
            }).join('\n\n');
            branch3Content = `Actionable steps based on your spread positions:\n\n${branch3Content}`;
        }

        let relationshipsText = "";
        if (drawnCards.length > 1) {
            const relationshipPromises = [];
            const pairs = [];
            const relationshipDescriptions = [];

            for (let i = 0; i < drawnCards.length; i++) {
                for (let j = i + 1; j < drawnCards.length; j++) {
                    const c1 = drawnCards[i];
                    const c2 = drawnCards[j];
                    
                    // Basic auto-detection
                    const sharedKeywords = (c1.keywords || []).filter(k => (c2.keywords || []).includes(k));
                    const sameElement = (c1.element && c2.element && c1.element.toLowerCase() !== 'none' && c1.element.toLowerCase() === c2.element.toLowerCase());
                    if (sharedKeywords.length > 0 || sameElement) {
                        let notes = [];
                        if (sharedKeywords.length > 0) notes.push(`Shared themes: ${sharedKeywords.join(', ')}`);
                        if (sameElement) notes.push(`Both share the ${c1.element} element`);
                        relationshipDescriptions.push(`• ${c1.name} & ${c2.name} (Auto-detected): ${notes.join('; ')}`);
                    }

                    // Database lookup
                    const id1 = c1.id || c1.card_id;
                    const id2 = c2.id || c2.card_id;
                    if (id1 && id2) {
                        const minId = id1 < id2 ? id1 : id2;
                        const maxId = id1 > id2 ? id1 : id2;
                        const relKey = `${minId}|${maxId}`;
                        pairs.push({ name1: c1.name, name2: c2.name, relKey });
                        relationshipPromises.push(
                            base44.asServiceRole.entities.CardRelationship.filter({ deck_id: deck_id, relationship_key: relKey })
                        );
                    }
                }
            }
            const relResults = await Promise.all(relationshipPromises);
            
            relResults.forEach((rels, index) => {
                if (rels && rels.length > 0) {
                    const pair = pairs[index];
                    const rel = rels[0];
                    const type = rel.relationship_type !== 'custom' ? rel.relationship_type : 'connected';
                    const notes = rel.custom_notes ? ` (${rel.custom_notes})` : '';
                    const shared = rel.shared_keywords && rel.shared_keywords.length > 0 ? ` [Shared: ${rel.shared_keywords.join(', ')}]` : '';
                    relationshipDescriptions.push(`• ${pair.name1} & ${pair.name2} (Saved): ${type} relationship${notes}${shared}.`);
                }
            });

            // Unique descriptions
            const uniqueRels = [...new Set(relationshipDescriptions)];
            if (uniqueRels.length > 0) {
                relationshipsText = uniqueRels.join('\n');
            }
        }
        
        const synergy = relationshipsText ? {
            title: "Card Synergies",
            content: relationshipsText
        } : null;

        const branch3 = {
            title: category.branch_3_title || "The Action / Outcome",
            content: branch3Content
        };

        return Response.json({
            reading: {
                branch_1: branch1,
                branch_2: branch2,
                branch_3: branch3,
                synergy: synergy,
                instructions: category.interpretation_instructions,
                boosters_used: selectedBoosters,
                cosmic_symbol: cosmic_symbol
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});