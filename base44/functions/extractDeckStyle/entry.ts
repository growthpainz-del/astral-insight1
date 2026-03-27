import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Analyzes multiple reference cards and creates a unified "Style DNA" profile
 * This profile can be used to maintain consistency across deck generation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { card_ids, deck_id } = await req.json();
    
    if (!card_ids || !Array.isArray(card_ids) || card_ids.length < 2) {
      return Response.json({ 
        error: 'Please provide at least 2 card_ids to analyze' 
      }, { status: 400 });
    }

    // Check if Vision API is configured
    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        status: 'error',
        error: 'Style extraction requires Google Cloud Vision API. Please add GOOGLE_CLOUD_VISION_API_KEY to environment variables, or use the AI Image Generator without style extraction.',
        details: 'Vision API not configured'
      }, { status: 200 }); // Return 200 so it doesn't crash the UI
    }

    // Fetch cards with images
    const cards = await base44.asServiceRole.entities.Card.filter({ 
      deck_id: deck_id 
    });
    
    const referenceCards = cards.filter(c => 
      card_ids.includes(c.id) && c.image_url
    );

    if (referenceCards.length < 2) {
      return Response.json({ 
        status: 'error',
        error: 'At least 2 cards must have images',
        details: `Only ${referenceCards.length} cards with images found`
      }, { status: 200 });
    }

    // Analyze each reference card
    const analyses = [];
    const errors = [];
    
    for (const card of referenceCards.slice(0, 5)) { // Max 5 reference cards
      try {
        const response = await base44.functions.invoke('analyzeImageStyle', {
          image_url: card.image_url,
          analysis_type: 'full'
        });
        
        console.log(`[extractDeckStyle] Response for ${card.name}:`, response);
        
        // Handle different response formats
        let analysis = null;
        if (response?.data?.analysis) {
          analysis = response.data.analysis;
        } else if (response?.analysis) {
          analysis = response.analysis;
        } else if (response?.data?.status === 'success') {
          analysis = response.data;
        }
        
        if (analysis) {
          analyses.push({
            card_name: card.name,
            ...analysis
          });
        } else {
          errors.push(`${card.name}: No analysis data in response`);
        }
      } catch (err) {
        console.warn(`Failed to analyze card ${card.name}:`, err.message);
        errors.push(`${card.name}: ${err.message}`);
      }
    }

    if (analyses.length === 0) {
      return Response.json({ 
        status: 'error',
        error: 'Failed to analyze any reference cards. This may be due to invalid image URLs or Vision API quota limits.',
        details: errors.join('; ')
      }, { status: 200 });
    }

    // Aggregate style profile
    const styleProfile = {
      reference_card_count: analyses.length,
      dominant_colors: extractCommonColors(analyses),
      common_themes: extractCommonThemes(analyses),
      common_objects: extractCommonObjects(analyses),
      style_keywords: extractStyleKeywords(analyses),
      color_palette: extractColorPalette(analyses),
      ai_prompt_suggestions: null,
      analysis_errors: errors.length > 0 ? errors : null
    };

    // Generate AI prompt template
    styleProfile.ai_prompt_suggestions = generatePromptTemplate(styleProfile);

    return Response.json({
      status: 'success',
      deck_id,
      analyzed_cards: referenceCards.slice(0, analyses.length).map(c => ({ id: c.id, name: c.name })),
      style_profile: styleProfile
    });

  } catch (error) {
    console.error('Error in extractDeckStyle:', error);
    return Response.json({ 
      status: 'error',
      error: error.message || 'Internal server error',
      details: error.stack || error.toString()
    }, { status: 200 }); // Return 200 to avoid UI crash
  }
});

function extractCommonColors(analyses) {
  const allColors = analyses.flatMap(a => a.colors || []);
  const colorMap = new Map();
  
  allColors.forEach(c => {
    const existing = colorMap.get(c.hex) || { ...c, count: 0 };
    existing.count += 1;
    existing.total_score = (existing.total_score || 0) + c.score;
    colorMap.set(c.hex, existing);
  });
  
  return Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function extractCommonThemes(analyses) {
  const allLabels = analyses.flatMap(a => a.labels || []);
  const labelMap = new Map();
  
  allLabels.forEach(l => {
    const key = l.description.toLowerCase();
    const existing = labelMap.get(key) || { description: l.description, count: 0, avg_confidence: 0 };
    existing.count += 1;
    existing.avg_confidence = ((existing.avg_confidence * (existing.count - 1)) + l.confidence) / existing.count;
    labelMap.set(key, existing);
  });
  
  return Array.from(labelMap.values())
    .filter(l => l.count >= Math.ceil(analyses.length / 2)) // Appears in at least 50% of cards
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function extractCommonObjects(analyses) {
  const allObjects = analyses.flatMap(a => a.objects || []);
  const objectMap = new Map();
  
  allObjects.forEach(o => {
    const key = o.name.toLowerCase();
    const existing = objectMap.get(key) || { name: o.name, count: 0 };
    existing.count += 1;
    objectMap.set(key, existing);
  });
  
  return Array.from(objectMap.values())
    .filter(o => o.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function extractStyleKeywords(analyses) {
  const allKeywords = analyses.flatMap(a => a.style_keywords || []);
  const keywordCounts = new Map();
  
  allKeywords.forEach(k => {
    keywordCounts.set(k, (keywordCounts.get(k) || 0) + 1);
  });
  
  return Array.from(keywordCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, _]) => keyword);
}

function extractColorPalette(analyses) {
  const colors = extractCommonColors(analyses);
  return colors.slice(0, 5).map(c => c.hex);
}

function generatePromptTemplate(profile) {
  const colors = profile.color_palette.join(', ');
  const themes = profile.common_themes.slice(0, 5).map(t => t.description.toLowerCase()).join(', ');
  const keywords = profile.style_keywords.slice(0, 8).join(', ');
  
  return {
    style_prefix: `Consistent with deck style: ${keywords}`,
    color_guidance: `Use color palette: ${colors}`,
    theme_guidance: `Incorporate themes: ${themes}`,
    full_prompt_template: `[CARD CONCEPT], 
consistent with deck style featuring ${keywords},
color palette: ${colors},
themes: ${themes},
maintain visual consistency with reference cards`
  };
}