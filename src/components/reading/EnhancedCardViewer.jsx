import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
  const [showVideo, setShowVideo] = useState(!!card?.video_url);
  const rightPaneRef = useRef(null);

  useEffect(() => {
    setShowVideo(!!card?.video_url);
    // Always default to Overview when opening or switching cards
    if (isOpen) setActiveTab('overview');
  }, [card?.id, isOpen]);

  const handleImageClick = () => {
    setActiveTab('overview');
    try {
      rightPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
  };

  // Lock background scroll while viewer is open (keep internal scroll working)
  useEffect(() => {
    if (!isOpen) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    return () => {
      try {
        document.documentElement.style.overflow = prevHtml || '';
        document.body.style.overflow = prevBody || '';
      } catch (_) {}
    };
  }, [isOpen]);

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
    <div className="fixed inset-0 z-[2000] md:z-[2000] bg-black/70 backdrop-blur-sm" onClick={() => onClose(false)}>
      <div className="bg-slate-900 text-white border border-purple-500/30 p-0 pointer-events-auto z-[2001] absolute bottom-0 left-0 right-0 h-[85dvh] rounded-t-2xl md:relative md:max-w-5xl md:h-[95vh] md:mx-auto md:mt-4 md:rounded-lg" role="dialog" aria-modal="true" aria-label={`${card?.name || 'Card'} details`} onClick={(e) => e.stopPropagation()}>
        <div className="grid h-full overflow-y-auto md:overflow-hidden md:grid-cols-[400px,1fr] grid-rows-[auto,1fr] md:grid-rows-1 pb-[env(safe-area-inset-bottom)]" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Left: Card Image */}
          <div className="relative bg-black/40 flex items-center justify-center p-2 md:p-6 border-b md:border-b-0 md:border-r border-white/10 max-h-[50dvh] md:max-h-none overflow-auto md:overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            <button
                                onClick={(e)=>{ e.stopPropagation?.(); onClose(false); }}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all z-10"
                                aria-label="Close and return to reading"
                              >
                                <X className="w-5 h-5" />
                              </button>

                              {/* Mobile overlay header (matches the second screenshot style) */}
                              <div className="md:hidden absolute inset-0 pointer-events-none">
                                <div className="absolute top-14 left-4 right-12">
                                  <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 drop-shadow-lg">
                                    {card.name}
                                  </h2>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Array.isArray(card.keywords) && card.keywords.slice(0,4).map((kw, i) => (
                                      <span key={i} className="px-2 py-1 text-[11px] rounded-full bg-black/50 border border-white/20 text-white/90 shadow">
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

            <div onClick={handleImageClick} onTouchEnd={(e)=>{ e.preventDefault(); handleImageClick(); }} className="relative w-full max-w-[min(92vw,420px)] mx-auto cursor-pointer select-none" role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); handleImageClick(); } }} style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
              {/* Glow effect */}
              <div className={`absolute -inset-4 ${isReversed ? 'bg-purple-600' : 'bg-cyan-600'} opacity-20 blur-3xl rounded-full pointer-events-none`}></div>
              
              <div className={`relative transform transition-transform ${isReversed ? 'rotate-180' : ''}`}>
                {showVideo && card.video_url ? (
                  <video
                    src={card.video_url}
                    autoPlay
                    muted
                    playsInline
                    loop={false}
                    onEnded={() => setShowVideo(false)}
                    onError={() => setShowVideo(false)}
                    className="max-h-[52vh] md:max-h-[70vh] w-full rounded-lg shadow-2xl border-0 object-contain"
                  />
                ) : card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="max-h-[52vh] md:max-h-[70vh] w-full rounded-lg shadow-2xl border-0 object-contain"
                  />
                ) : (
                  <div className="aspect-[2/3] max-h-[60vh] md:max-h-[70vh] w-auto bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl flex items-center justify-center">
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

              {/* Hint: tap to return to summary when video ends */}
              {card.video_url && !showVideo && (
               <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-white/60">
                 Video ended – showing image. Close to return.
               </div>
              )}
              {activeTab !== 'overview' && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full border border-white/20">
                  Tap image to view Overview
                </div>
              )}
            </div>
          </div>

          {/* Right: Card Information */}
          <div ref={rightPaneRef} className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="hidden md:block p-6 border-b border-white/10 flex-shrink-0">
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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onClose(false)}
                    className="hidden md:inline-flex bg-purple-600/30 hover:bg-purple-600/40 border-white/10 text-white"
                  >
                    Return to Reading
                  </Button>
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
              </div>

              {/* Quick Info Badges */}
              <div className="hidden md:flex flex-wrap gap-2">
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
            {/* Mobile content: collapsible sections with sticky chips */}
            <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-slate-900/80 backdrop-blur border-b border-white/10">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button onClick={() => scrollToRef(overviewRef, 'overview')} className={`px-3 py-1 rounded-full border text-xs ${mobileOpen==='overview' ? 'bg-white/10 border-white/25' : 'bg-transparent border-white/15'}`}>Overview</button>
                  <button onClick={() => scrollToRef(guidanceRef, 'guidance')} className={`px-3 py-1 rounded-full border text-xs ${mobileOpen==='guidance' ? 'bg-white/10 border-white/25' : 'bg-transparent border-white/15'}`}>Guidance</button>
                  <button onClick={() => scrollToRef(relatedRef, 'related')} className={`px-3 py-1 rounded-full border text-xs ${mobileOpen==='related' ? 'bg-white/10 border-white/25' : 'bg-transparent border-white/15'}`}>Related</button>
                </div>
              </div>

              <Accordion type="single" collapsible value={mobileOpen} onValueChange={setMobileOpen} className="space-y-3">
                <div ref={overviewRef} />
                <AccordionItem value="overview" className="border border-white/15 rounded-lg bg-transparent">
                  <AccordionTrigger className="px-4 py-2 text-left">Overview</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    <div className={`rounded-lg p-4 ${isReversed ? 'bg-purple-900/10 border border-purple-500/30' : 'bg-cyan-900/10 border border-cyan-500/30'}`}>
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
                    {card.overall_meaning && (
                      <div className="bg-transparent border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-blue-400" />
                          <h3 className="font-bold text-blue-300">Core Essence</h3>
                        </div>
                        <p className="text-white/90 leading-relaxed">{card.overall_meaning}</p>
                      </div>
                    )}
                    {card.keywords && card.keywords.length > 0 && (
                      <div className="bg-transparent border border-white/10 rounded-lg p-4">
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
                  </AccordionContent>
                </AccordionItem>

                <div ref={guidanceRef} />
                <AccordionItem value="guidance" className="border border-white/15 rounded-lg bg-transparent">
                  <AccordionTrigger className="px-4 py-2 text-left">Guidance</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    <div className="bg-transparent border border-emerald-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-emerald-300">Insight</h3>
                      </div>
                      <p className="text-white/90 leading-relaxed">{getInsightText()}</p>
                    </div>
                    <div className="bg-transparent border border-amber-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <h3 className="font-bold text-amber-300">Suggested Action</h3>
                      </div>
                      <p className="text-white/90 leading-relaxed">{getActionText()}</p>
                    </div>
                    {position && (
                      <div className="bg-transparent border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-5 h-5 text-purple-400" />
                          <h3 className="font-bold text-purple-300">In This Position</h3>
                        </div>
                        <p className="text-white/90 leading-relaxed">
                          As the <strong>{position}</strong> in your reading, this card speaks to the energies and influences present in this specific area of your question.
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <div ref={relatedRef} />
                <AccordionItem value="related" className="border border-white/15 rounded-lg bg-transparent">
                  <AccordionTrigger className="px-4 py-2 text-left">Related</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {relatedCards && relatedCards.length > 0 ? (
                      <div className="space-y-3">
                        {relatedCards.map((relCard, idx) => (
                          <div key={idx} className="bg-transparent border border-white/12 rounded-lg p-4 hover:bg-white/5 transition-colors">
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
                      <div className="text-center py-8 text-white/60">
                        <Link2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p>No related cards in this reading</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

                    {/* Desktop content with tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:flex flex-1 flex-col min-h-0">
              <TabsList className="hidden md:grid sticky top-0 z-10 bg-slate-900/70 backdrop-blur border-b border-white/10 rounded-none grid-cols-4 h-auto p-1 flex-shrink-0">
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

              <div className="flex-1 overflow-y-auto p-6 pb-40 md:pb-10 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
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
      </div>
    </div>
  );
}