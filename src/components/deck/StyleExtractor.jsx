import React, { useState, useEffect } from "react";
import { Card as CardEntity } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Palette, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  Copy,
  Wand2,
  Image as ImageIcon,
  Info
} from "lucide-react";

export default function StyleExtractor({ deckId, onStyleExtracted }) {
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [styleProfile, setStyleProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiConfigured, setApiConfigured] = useState(true);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  const loadCards = async () => {
    try {
      const allCards = await CardEntity.filter({ deck_id: deckId });
      const withImages = allCards.filter(c => c.image_url);
      setCards(withImages);
      
      // Auto-select up to 5 cards with images by default
      const autoSelected = withImages.slice(0, Math.min(5, withImages.length)).map(c => c.id);
      setSelectedCards(autoSelected);
    } catch (err) {
      setError("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (cardId) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else if (prev.length < 5) {
        return [...prev, cardId];
      }
      return prev;
    });
  };

  const handleSelectAll = () => {
    const allIds = cards.slice(0, 5).map(c => c.id); // Max 5
    setSelectedCards(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedCards([]);
  };

  const analyzeStyle = async () => {
    if (selectedCards.length < 3) {
      setError("Please select at least 3 reference cards");
      return;
    }

    setAnalyzing(true);
    setError("");
    setApiConfigured(true);

    try {
      const { data } = await base44.functions.invoke('extractDeckStyle', {
        card_ids: selectedCards,
        deck_id: deckId
      });

      console.log("[StyleExtractor] Response:", data);

      if (data.status === 'error') {
        if (data.details?.includes('Vision API not configured')) {
          setApiConfigured(false);
          setError("Style extraction is an optional feature that requires Google Cloud Vision API setup. You can still use the Bulk AI Image Generator without it!");
        } else {
          setError(data.error || "Failed to extract style");
        }
      } else if (data.status === 'success' && data.style_profile) {
        setStyleProfile(data.style_profile);
        if (onStyleExtracted) {
          onStyleExtracted(data.style_profile);
        }
      } else {
        throw new Error("Unexpected response format");
      }

    } catch (err) {
      console.error("Style extraction error:", err);
      const errorMsg = err.message || err.response?.data?.error || "Failed to analyze images";
      
      if (errorMsg.includes('Vision API') || errorMsg.includes('not configured')) {
        setApiConfigured(false);
        setError("Style extraction is optional - you can skip this and use AI Image Generator directly!");
      } else {
        setError(errorMsg);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const copyPromptTemplate = () => {
    if (!styleProfile?.ai_prompt_suggestions?.full_prompt_template) return;
    
    navigator.clipboard.writeText(styleProfile.ai_prompt_suggestions.full_prompt_template);
    alert("✅ Prompt template copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center p-8 bg-amber-900/20 border border-amber-500/30 rounded-lg">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-amber-400" />
        <p className="text-amber-200">No cards with images found in this deck.</p>
        <p className="text-sm text-amber-300 mt-2">Upload some card images first, then come back here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-xl font-bold text-purple-200 mb-2 flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Extract Deck Style DNA (Optional)
        </h3>
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded p-3 mt-2">
          <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            <strong>This is optional!</strong> Style extraction helps create consistent images by analyzing your existing cards. 
            You can skip this and use the Bulk AI Image Generator directly if you prefer.
          </p>
        </div>
        <p className="text-sm text-purple-300 mt-2">
          Select 3-5 of your best reference cards. The AI will analyze colors, themes, and visual style 
          to create a "Style DNA" profile for consistent image generation.
        </p>
      </div>

      {/* Card Selection Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">
            Select Reference Cards ({selectedCards.length}/5)
          </h4>
          <div className="flex gap-2">
            {selectedCards.length >= 3 && (
              <Badge className="bg-emerald-600">Ready to analyze!</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={analyzing}
              className="border-purple-400/40 text-purple-300 hover:bg-purple-500/10"
            >
              Select 5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={analyzing}
              className="border-purple-400/40 text-purple-300 hover:bg-purple-500/10"
            >
              Clear
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] border border-white/10 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card) => {
              const isSelected = selectedCards.includes(card.id);
              const isMaxed = selectedCards.length >= 5 && !isSelected;
              
              return (
                <div
                  key={card.id}
                  onClick={() => !isMaxed && !analyzing && toggleCard(card.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-purple-400 shadow-lg shadow-purple-500/50 ring-2 ring-purple-400/50' 
                      : isMaxed
                        ? 'border-white/10 opacity-40 cursor-not-allowed'
                        : 'border-white/20 hover:border-purple-300/60 hover:shadow-md'
                  }`}
                >
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1.5 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {selectedCards.indexOf(card.id) + 1}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                    <p className="text-xs text-white font-semibold truncate">{card.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {selectedCards.length < 3 && selectedCards.length > 0 && (
          <p className="text-xs text-amber-300 mt-2">
            ⚠️ Select at least 3 cards to analyze (currently {selectedCards.length}/3)
          </p>
        )}
        
        {selectedCards.length >= 5 && (
          <p className="text-xs text-green-300 mt-2">
            ✅ Maximum of 5 reference cards selected
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${
          !apiConfigured 
            ? 'bg-blue-900/20 border-blue-500/30' 
            : 'bg-red-900/20 border-red-500/30'
        }`}>
          {!apiConfigured ? (
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-semibold ${!apiConfigured ? 'text-blue-300' : 'text-red-300'}`}>
              {!apiConfigured ? 'Feature Not Configured' : 'Error'}
            </p>
            <p className={`text-sm ${!apiConfigured ? 'text-blue-200' : 'text-red-200'}`}>{error}</p>
            {!apiConfigured && (
              <p className="text-xs text-blue-300 mt-2">
                💡 You can still generate amazing AI images! Just use the "Bulk AI Image Generator" tool directly.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <Button
        onClick={analyzeStyle}
        disabled={selectedCards.length < 3 || analyzing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing {selectedCards.length} Cards...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Extract Style DNA from {selectedCards.length} Card{selectedCards.length !== 1 ? 's' : ''}
          </>
        )}
      </Button>

      {/* Results */}
      {styleProfile && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                Style Profile Extracted!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Palette */}
              {styleProfile.color_palette?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-purple-200 mb-2">Dominant Color Palette</h5>
                  <div className="flex gap-2 flex-wrap">
                    {styleProfile.color_palette.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-12 h-12 rounded border-2 border-white/30"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-white/80 font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Keywords */}
              {styleProfile.style_keywords?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-purple-200 mb-2">Style Keywords</h5>
                  <div className="flex gap-2 flex-wrap">
                    {styleProfile.style_keywords.slice(0, 10).map((keyword, idx) => (
                      <Badge key={idx} className="bg-purple-600/40 border-purple-400/40">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Themes */}
              {styleProfile.common_themes?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-purple-200 mb-2">Common Themes</h5>
                  <div className="flex gap-2 flex-wrap">
                    {styleProfile.common_themes.slice(0, 8).map((theme, idx) => (
                      <Badge key={idx} className="bg-pink-600/40 border-pink-400/40">
                        {theme.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Prompt Template */}
              {styleProfile.ai_prompt_suggestions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-purple-200">AI Prompt Template</h5>
                    <Button
                      onClick={copyPromptTemplate}
                      size="sm"
                      variant="outline"
                      className="border-purple-400/40 text-purple-300 hover:bg-purple-500/10"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={styleProfile.ai_prompt_suggestions.full_prompt_template}
                    readOnly
                    className="bg-black/40 border-purple-500/30 text-white font-mono text-sm"
                    rows={6}
                  />
                  <p className="text-xs text-purple-300 mt-2">
                    💡 Use this template in Bulk AI Image Generator to create perfectly matched cards!
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="bg-black/30 rounded p-3 text-sm text-white/70">
                <p>📊 Analyzed {styleProfile.reference_card_count} reference cards</p>
                <p>🎨 Extracted {styleProfile.dominant_colors?.length || 0} dominant colors</p>
                <p>🏷️ Found {styleProfile.style_keywords?.length || 0} style keywords</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}