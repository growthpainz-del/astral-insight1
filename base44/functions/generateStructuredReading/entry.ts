import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { category_id, drawnCards, includeMoonPhase } = await req.json();

        // 1. Get the category definition from the database
        const category = await base44.asServiceRole.entities.ReadingCategory.get(category_id);
        if (!category) {
            return Response.json({ error: "Category not found in database." }, { status: 404 });
        }

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
        // Branch 1: The Core Energy (Based on the first card drawn)
        const primaryCard = drawnCards[0] || null;
        const branch1 = {
            title: category.branch_1_title || "The Core Energy",
            content: primaryCard ? 
                `The ${primaryCard.name} brings the primary focus: ${primaryCard.overall_meaning || primaryCard.upright_meaning}` : 
                "No card drawn for core energy."
        };

        // Branch 2: The Modifiers (Based on Moon Phase and Category Booster Symbols)
        const branch2 = {
            title: category.branch_2_title || "The Modifiers",
            content: `Moon Phase: ${moonPhase} - ${moonMeaning}\n` + 
                     `Booster Symbols: \n` + 
                     selectedBoosters.map(b => `${b.symbol} : ${b.meaning}`).join('\n')
        };

        // Branch 3: The Supporting Action (Based on subsequent cards or generalized guidance)
        const secondaryCard = drawnCards[1] || null;
        const branch3 = {
            title: category.branch_3_title || "The Action / Outcome",
            content: secondaryCard ? 
                `The ${secondaryCard.name} provides supporting guidance: ${secondaryCard.upright_action || secondaryCard.upright_insight || secondaryCard.overall_meaning}` : 
                "Rely on your boosters and core energy to determine your next steps."
        };

        return Response.json({
            reading: {
                branch_1: branch1,
                branch_2: branch2,
                branch_3: branch3,
                instructions: category.interpretation_instructions,
                boosters_used: selectedBoosters
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});