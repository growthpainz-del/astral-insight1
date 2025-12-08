import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Analyzes an image using Google Cloud Vision API
 * Extracts: colors, labels, objects, image properties for deck consistency
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, analysis_type = 'full' } = await req.json();
    
    if (!image_url) {
      return Response.json({ error: 'image_url is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        error: 'Google Cloud Vision API key not configured. Please add GOOGLE_CLOUD_VISION_API_KEY to environment variables.' 
      }, { status: 500 });
    }

    // Build Cloud Vision API request
    const features = [];
    
    if (analysis_type === 'full' || analysis_type === 'colors') {
      features.push({ type: 'IMAGE_PROPERTIES', maxResults: 10 });
    }
    if (analysis_type === 'full' || analysis_type === 'labels') {
      features.push({ type: 'LABEL_DETECTION', maxResults: 20 });
    }
    if (analysis_type === 'full' || analysis_type === 'objects') {
      features.push({ type: 'OBJECT_LOCALIZATION', maxResults: 15 });
    }
    if (analysis_type === 'full' || analysis_type === 'safe_search') {
      features.push({ type: 'SAFE_SEARCH_DETECTION' });
    }

    const visionRequest = {
      requests: [{
        image: { source: { imageUri: image_url } },
        features: features
      }]
    };

    // Call Google Cloud Vision API
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visionRequest)
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Vision API error:', errorData);
      return Response.json({ 
        error: 'Vision API request failed', 
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    const result = data.responses?.[0];

    if (result.error) {
      return Response.json({ 
        error: 'Vision API error', 
        details: result.error 
      }, { status: 400 });
    }

    // Extract and format the useful data
    const analysis = {
      colors: [],
      labels: [],
      objects: [],
      safe_search: null,
      dominant_palette: [],
      style_keywords: []
    };

    // Extract dominant colors
    if (result.imagePropertiesAnnotation?.dominantColors?.colors) {
      analysis.colors = result.imagePropertiesAnnotation.dominantColors.colors
        .slice(0, 5)
        .map(c => ({
          hex: rgbToHex(c.color.red || 0, c.color.green || 0, c.color.blue || 0),
          rgb: {
            r: Math.round(c.color.red || 0),
            g: Math.round(c.color.green || 0),
            b: Math.round(c.color.blue || 0)
          },
          score: c.score,
          pixel_fraction: c.pixelFraction
        }));
      
      analysis.dominant_palette = analysis.colors.map(c => c.hex);
    }

    // Extract labels (themes, concepts)
    if (result.labelAnnotations) {
      analysis.labels = result.labelAnnotations
        .filter(l => l.score > 0.6)
        .map(l => ({
          description: l.description,
          score: l.score,
          confidence: Math.round(l.score * 100)
        }));
      
      analysis.style_keywords = analysis.labels
        .slice(0, 10)
        .map(l => l.description.toLowerCase());
    }

    // Extract objects
    if (result.localizedObjectAnnotations) {
      analysis.objects = result.localizedObjectAnnotations
        .map(o => ({
          name: o.name,
          confidence: Math.round(o.score * 100)
        }));
    }

    // Safe search (NSFW detection)
    if (result.safeSearchAnnotation) {
      const ss = result.safeSearchAnnotation;
      analysis.safe_search = {
        adult: ss.adult,
        violence: ss.violence,
        racy: ss.racy,
        is_safe: ss.adult !== 'VERY_LIKELY' && ss.adult !== 'LIKELY'
      };
    }

    return Response.json({
      status: 'success',
      image_url,
      analysis
    });

  } catch (error) {
    console.error('Error in analyzeImageStyle:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});

// Helper function to convert RGB to HEX
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}