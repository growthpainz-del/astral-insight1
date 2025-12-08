import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  Palette,
  Brain,
  Link as LinkIcon,
  RefreshCw,
  AlertCircle,
  Eye
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import TokenCostPreview from "@/components/pricing/TokenCostPreview";

export default function DeckInsightsAnalyzer({ deckId, deck, onInsightsGenerated }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(deck?.ai_deck_insights || null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!deckId) return;

    setAnalyzing(true);
    setError("");

    try {
      console.log('🔍 Starting deck insights analysis...');

      // Load all cards
      const cards = await base44.entities.Card.filter({ deck_id: deckId });
      
      if (cards.length === 0) {
        setError("This deck has no cards yet. Add cards first before analyzing.");
        setAnalyzing(false);
        return;
      }

      console.log(`✅ Loaded ${cards.length} cards`);

      // Load relationships
      const relationships = await base44.entities.CardRelationship.filter({ deck_id: deckId });
      console.log(`✅ Loaded ${relationships.length} relationships`);

      // Prepare card summaries for AI
      const cardSummaries = cards.map(card => ({
        name: card.name,
        number: card.number,
        keywords: card.keywords || [],
        element: card.element,
        overall_meaning: card.overall_meaning?.substring(0, 200),
        upright_meaning: card.upright_meaning?.substring(0, 150),
        reversed_meaning: card.reversed_meaning?.substring(0, 150)
      }));

      // Prepare relationship summaries
      const relationshipSummaries = relationships.map(rel => {
        const card1 = cards.find(c => c.id === rel.card_id_1);
        const card2 = cards.find(c => c.id === rel.card_id_2);
        return {
          cards: [card1?.name, card2?.name].filter(Boolean),
          type: rel.relationship_type,
          reasons: rel.detection_reasons || []
        };
      });

      // Call AI for comprehensive analysis
      const prompt = `You are analyzing a divination deck to provide deep insights about its character and interpretation style.

DECK INFORMATION:
Name: ${deck.name}
Description: ${deck.description || 'No description provided'}
Category: ${deck.category}
Total Cards: ${cards.length}
Total Relationships: ${relationships.length}

CARD SUMMARIES:
${JSON.stringify(cardSummaries.slice(0, 50), null, 2)}

RELATIONSHIP PATTERNS:
${JSON.stringify(relationshipSummaries.slice(0, 30), null, 2)}

Provide a comprehensive analysis of this deck including:

1. COMMON THEMES: Identify 5-10 major recurring themes across the cards (spirituality, transformation, nature, etc.)

2. ARCHETYPAL PAIRINGS: Identify 3-5 significant archetypal pairings or progressions (e.g., "Fool's Journey", "Shadow Work Trilogy", "Elemental Balance")

3. VISUAL STYLE: Describe the visual aesthetic based on card names and themes (color palette suggestions, artistic style, symbolism, mood)

4. SEMANTIC STYLE: Analyze the language patterns, tone (mystical, practical, poetic, direct), and philosophical approach

5. DECK PERSONALITY: In 2-3 paragraphs, describe the overall personality and character of this deck. What makes it unique? What energy does it carry?

6. READING STYLE SUGGESTIONS: How should readers approach this deck? What interpretation styles work best with its nature?

7. RELATIONSHIP DYNAMICS: How do the detected relationships between cards shape the deck's overall energy and interconnectedness?

Return structured JSON following this schema.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            common_themes: {
              type: "array",
              items: { type: "string" },
              description: "5-10 major recurring themes"
            },
            archetypal_pairings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cards: { type: "array", items: { type: "string" } },
                  archetype: { type: "string" },
                  description: { type: "string" }
                }
              },
              description: "3-5 significant pairings"
            },
            visual_style: {
              type: "object",
              properties: {
                color_palette: { type: "array", items: { type: "string" } },
                artistic_style: { type: "string" },
                symbolism: { type: "array", items: { type: "string" } },
                mood: { type: "string" }
              }
            },
            semantic_style: {
              type: "object",
              properties: {
                tone: { type: "string" },
                language_patterns: { type: "array", items: { type: "string" } },
                philosophical_approach: { type: "string" }
              }
            },
            deck_personality: { type: "string" },
            reading_style_suggestions: { type: "string" },
            relationship_dynamics: { type: "string" }
          }
        },
        add_context_from_internet: false
      });

      const analysisData = response;
      
      // Add metadata
      const finalInsights = {
        ...analysisData,
        generated_date: new Date().toISOString()
      };

      console.log('✅ Analysis complete:', finalInsights);

      // Save to deck
      await base44.entities.Deck.update(deckId, {
        ai_deck_insights: finalInsights
      });

      setInsights(finalInsights);
      
      if (onInsightsGenerated) {
        onInsightsGenerated(finalInsights);
      }

    } catch (err) {
      console.error('❌ Failed to analyze deck:', err);
      setError(err.message || "Failed to analyze deck. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRegenerate = () => {
    if (confirm("This will regenerate the deck insights. Previous insights will be replaced. Continue?")) {
      handleAnalyze();
    }
  };

  if (!insights) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6 text-center">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">AI Deck Insights</h3>
          <p className="text-white/70 mb-4 max-w-2xl mx-auto">
            Let AI analyze your entire deck to discover common themes, archetypal patterns, 
            visual and semantic styles, and how card relationships shape the deck's personality. 
            This deep analysis helps you understand your deck's unique character and how to read it effectively.
          </p>
          
          <TokenCostPreview action="reading_detailed" />
          
          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-200">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}
          
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Deck...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Generate Deck Insights
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Deck Insights
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Generated {new Date(insights.generated_date).toLocaleDateString()}
          </p>
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={analyzing}
          variant="outline"
          className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      {/* Deck Personality - Featured */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/40 rounded-xl p-6"
      >
        <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Deck Personality
        </h4>
        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
          {insights.deck_personality}
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Common Themes */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Common Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.common_themes?.map((theme, i) => (
                <Badge key={i} className="bg-cyan-600/20 text-cyan-200 border border-cyan-500/30">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visual Style */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              Visual Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-white/60 text-sm">Artistic Style:</span>
              <p className="text-white">{insights.visual_style?.artistic_style}</p>
            </div>
            <div>
              <span className="text-white/60 text-sm">Mood:</span>
              <p className="text-white">{insights.visual_style?.mood}</p>
            </div>
            {insights.visual_style?.color_palette && insights.visual_style.color_palette.length > 0 && (
              <div>
                <span className="text-white/60 text-sm block mb-2">Color Palette:</span>
                <div className="flex flex-wrap gap-2">
                  {insights.visual_style.color_palette.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                      <span className="text-white/80 text-xs">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {insights.visual_style?.symbolism && insights.visual_style.symbolism.length > 0 && (
              <div>
                <span className="text-white/60 text-sm block mb-2">Symbolism:</span>
                <div className="flex flex-wrap gap-1">
                  {insights.visual_style.symbolism.map((symbol, i) => (
                    <Badge key={i} className="bg-pink-600/20 text-pink-200 text-xs">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Semantic Style */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              Semantic Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-white/60 text-sm">Tone:</span>
              <p className="text-white">{insights.semantic_style?.tone}</p>
            </div>
            <div>
              <span className="text-white/60 text-sm">Philosophical Approach:</span>
              <p className="text-white">{insights.semantic_style?.philosophical_approach}</p>
            </div>
            {insights.semantic_style?.language_patterns && insights.semantic_style.language_patterns.length > 0 && (
              <div>
                <span className="text-white/60 text-sm block mb-2">Language Patterns:</span>
                <div className="flex flex-wrap gap-1">
                  {insights.semantic_style.language_patterns.map((pattern, i) => (
                    <Badge key={i} className="bg-amber-600/20 text-amber-200 text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationship Dynamics */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-green-400" />
              Relationship Dynamics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90 leading-relaxed">
              {insights.relationship_dynamics}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Archetypal Pairings */}
      {insights.archetypal_pairings && insights.archetypal_pairings.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Archetypal Pairings & Progressions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.archetypal_pairings.map((pairing, i) => (
              <div key={i} className="bg-black/20 border border-white/10 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">{pairing.archetype}</h5>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pairing.cards?.map((card, j) => (
                    <Badge key={j} className="bg-purple-600/20 text-purple-200">
                      {card}
                    </Badge>
                  ))}
                </div>
                <p className="text-white/80 text-sm">{pairing.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reading Style Suggestions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Reading Style Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
            {insights.reading_style_suggestions}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}