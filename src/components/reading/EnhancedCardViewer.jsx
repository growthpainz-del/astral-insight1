import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Link2,
  X,
  RotateCcw,
  Copy,
  Check,
  Lightbulb,
  Heart,
  Zap
} from "lucide-react";

export default function EnhancedCardViewer({ card, isOpen, onClose, position, isReversed, relatedCards = [] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const copyCardInfo = async () => {
    const text = `
🃏 ${card.name} ${isReversed ? '(Reversed)' : ''}
${position ? `Position: ${position}` : ''}

${isReversed ? card.reversed_meaning || card.upright_meaning : card.upright_meaning || card.overall_meaning || ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getMeaningText = () => {
    if (isReversed) {
      return card.reversed_meaning || card.upright_meaning || card.overall_meaning || "No meaning available";
    }
    return card.upright_meaning || card.overall_meaning || "No meaning available";
  };

  const getInsightText = () => {
    if (isReversed) {
      return card.reversed_insight || "Reflect on blocked energy or internal challenges";
    }
    return card.upright_insight || "Embrace the energy and opportunities present";
  };

  const getActionText = () => {
    if (isReversed) {
      return card.reversed_action || "Release what no longer serves you";
    }
    return card.upright_action || "Take aligned action toward your goals";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open)=>{ if(!open) onClose(false); }}>
      <DialogContent className="max-w-5xl h-[92dvh] md:h-[95vh] bg-slate-900 text-white border border-purple-500/30 p-0">
        <div className="grid h-full overflow-hidden md:grid-cols-[400px,1fr] grid-rows-[auto,1fr] md:grid-rows-1">
          {/* Left: Card Image */}
          <div className="relative bg-black/40 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/10 max-h-[48dvh] md:max-h-none overflow-auto md:overflow-y-auto">
            <button
              onClick={(e)=>{ e.stopPropagation?.(); onClose(false); }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative max-w-sm">
              {/* Glow effect */}
              <div className={`absolute -inset-4 ${isReversed ? 'bg-purple-600' : 'bg-cyan-600'} opacity-20 blur-3xl rounded-full`}></div>
              
              <div className={`relative transform transition-transform ${isReversed ? 'rotate-180' : ''}`}>
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="w-full h-auto rounded-xl shadow-2xl border-2 border-white/20"
                  />
                ) : (
                  <div className="aspect-[2/3] bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-white/40" />
                  </div>
                )}
              </div>

              {/* Card Number Badge */}
              {card.number != null && (
                <div className="absolute -top-3 -left-3 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                  {card.number}
                </div>
              )}

              {/* Reversed Badge */}
              {isReversed && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reversed
                </div>
              )}
            </div>
          </div>

          {/* Right: Card Information */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
                    {card.name}
                  </h2>
                  {position && (
                    <p className="text-purple-300 text-sm font-semibold">
                      Position: {position}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyCardInfo}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy
                </Button>
              </div>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap gap-2">
                {card.element && card.element !== 'none' && (
                  <Badge className="bg-blue-600/30 border-blue-500/40 text-blue-200">
                    {card.element}
                  </Badge>
                )}
                {card.keywords && card.keywords.length > 0 && (
                  <>
                    {card.keywords.slice(0, 3).map((kw, i) => (
                      <Badge key={i} className="bg-purple-600/30 border-purple-500/40 text-purple-200">
                        {kw}
                      </Badge>
                    ))}
                    {card.keywords.length > 3 && (
                      <Badge className="bg-white/10 border-white/20 text-white/70">
                        +{card.keywords.length - 3} more
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="bg-slate-800/50 border-b border-white/10 rounded-none grid grid-cols-4 h-auto p-1 flex-shrink-0">
                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600/30 py-2">
                  <Info className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="guidance" className="data-[state=active]:bg-purple-600/30 py-2">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Guidance
                </TabsTrigger>
                <TabsTrigger value="deep" className="data-[state=active]:bg-purple-600/30 py-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Deep Dive
                </TabsTrigger>
                <TabsTrigger value="related" className="data-[state=active]:bg-purple-600/30 py-2">
                  <Link2 className="w-4 h-4 mr-2" />
                  Related
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {/* Main Meaning */}
                  <div className={`rounded-lg p-4 ${isReversed ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-cyan-900/20 border border-cyan-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isReversed ? (
                        <TrendingDown className="w-5 h-5 text-purple-400" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                      )}
                      <h3 className={`font-bold ${isReversed ? 'text-purple-300' : 'text-cyan-300'}`}>
                        {isReversed ? 'Reversed Meaning' : 'Upright Meaning'}
                      </h3>
                    </div>
                    <p className="text-white/90 leading-relaxed">{getMeaningText()}</p>
                  </div>

                  {/* Overall Meaning */}
                  {card.overall_meaning && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold text-blue-300">Core Essence</h3>
                      </div>
                      <p className="text-white/90 leading-relaxed">{card.overall_meaning}</p>
                    </div>
                  )}

                  {/* Quick Keywords */}
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="bg-slate-800/30 border border-white/10 rounded-lg p-4">
                      <h3 className="font-bold text-white/90 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Key Themes
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {card.keywords.map((kw, i) => (
                          <Badge key={i} className="bg-white/10 text-white/90 border-white/20">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="guidance" className="mt-0 space-y-4">
                  {/* Insight */}
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-emerald-300">Insight</h3>
                    </div>
                    <p className="text-white/90 leading-relaxed">{getInsightText()}</p>
                  </div>

                  {/* Action */}
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-amber-300">Suggested Action</h3>
                    </div>
                    <p className="text-white/90 leading-relaxed">{getActionText()}</p>
                  </div>

                  {/* Context Position */}
                  {position && (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-purple-300">In This Position</h3>
                      </div>
                      <p className="text-white/90 leading-relaxed">
                        As the <strong>{position}</strong> in your reading, this card speaks to the energies and influences present in this specific area of your question.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="deep" className="mt-0 space-y-4">
                  {card.interaction && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <h3 className="font-bold text-blue-300 mb-2">Card Interactions</h3>
                      <p className="text-white/90 leading-relaxed">{card.interaction}</p>
                    </div>
                  )}

                  {card.musician_quote && (
                    <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                      <h3 className="font-bold text-pink-300 mb-2">Musical Wisdom</h3>
                      <p className="text-white/90 leading-relaxed italic">"{card.musician_quote}"</p>
                    </div>
                  )}

                  {card.facedown_meaning && (
                    <div className="bg-slate-800/40 border border-slate-600/30 rounded-lg p-4">
                      <h3 className="font-bold text-slate-300 mb-2">Hidden Meaning</h3>
                      <p className="text-white/90 leading-relaxed">{card.facedown_meaning}</p>
                    </div>
                  )}

                  {card.custom && (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="font-bold text-purple-300 mb-2">Additional Notes</h3>
                      <p className="text-white/90 leading-relaxed">{card.custom}</p>
                    </div>
                  )}
                  
                  {!card.interaction && !card.musician_quote && !card.facedown_meaning && !card.custom && (
                    <div className="text-center py-12 text-white/60">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>No additional details available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="related" className="mt-0 space-y-4">
                  {relatedCards && relatedCards.length > 0 ? (
                    <div className="space-y-3">
                      {relatedCards.map((relCard, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                          <h4 className="font-semibold text-white mb-1">{relCard.name || relCard.card_name}</h4>
                          <p className="text-sm text-white/70">{relCard.position}</p>
                          {relCard.isReversed && (
                            <Badge className="mt-2 bg-purple-600/30 border-purple-500/40 text-purple-200">
                              Reversed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/60">
                      <Link2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>No related cards in this reading</p>
                    </div>
                  )}
                </TabsContent>
              </div>
              </Tabs>
              </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}