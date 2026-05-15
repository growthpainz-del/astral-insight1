import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Deck as DeckEntity, Card as CardEntity, Spread as SpreadEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Hand, Shuffle, RotateCcw, Eye, Sparkles, Settings2, Save } from "lucide-react";
import SpreadLayout from "@/components/reading/SpreadLayout";
import BottomCardShelf from "@/components/reading/BottomCardShelf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";

const FreeformCard = ({ card, canvasRef, toggleFlip, deck, openInterpretation }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(card.rotation || 0);
  const initialPinch = useRef(null);

  const handleWheel = (e) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.002;
    setScale(s => Math.min(Math.max(0.4, s + 3), 3));
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const angle = Math.atan2(
        e.touches[1].clientY - e.touches[0].clientY,
        e.touches[1].clientX - e.touches[0].clientX
      ) * (180 / Math.PI);
      initialPinch.current = { dist, scale, angle, rotation };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinch.current) {
      e.preventDefault();
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinch.current.dist;
      setScale(Math.min(Math.max(0.4, initialPinch.current.scale * ratio), 3));

      const angle = Math.atan2(
        e.touches[1].clientY - e.touches[0].clientY,
        e.touches[1].clientX - e.touches[0].clientX
      ) * (180 / Math.PI);
      
      let angleDiff = angle - initialPinch.current.angle;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      
      setRotation(initialPinch.current.rotation + angleDiff);
    }
  };

  const handleTouchEnd = () => {
    initialPinch.current = null;
  };

  return (
    <motion.div
      drag
      dragConstraints={canvasRef}
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, scale: 0.5, x: 0, y: 300 }}
      animate={{ 
        opacity: 1, 
        scale: scale,
        x: card.x, 
        y: card.y,
        rotate: rotation
      }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ scale: scale * 1.05, zIndex: 50 }}
      whileDrag={{ scale: scale * 1.1, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
      onDoubleClick={() => toggleFlip(card.id)}
      onClick={() => {
        if (card.isFlipped && openInterpretation) {
          openInterpretation(card);
        }
      }}
      onWheel={(e) => {
        e.stopPropagation();
        const delta = -e.deltaY * 0.002;
        setScale(s => Math.min(Math.max(0.4, s + delta), 3));
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="absolute left-1/2 top-1/2 -ml-[60px] -mt-[95px] cursor-grab active:cursor-grabbing touch-none"
      style={{ zIndex: card.zIndex || 10 }}
    >
      <div 
        className="relative w-[120px] h-[190px] rounded-xl transition-all duration-500 preserve-3d"
        style={{ 
          transformStyle: "preserve-3d",
          transform: card.isFlipped ? "rotateY(0deg)" : "rotateY(180deg)"
        }}
      >
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {card.cardData.image_url ? (
            <img 
              src={card.cardData.image_url} 
              alt={card.cardData.name}
              className="w-full h-full object-cover pointer-events-none"
              draggable="false"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 to-purple-900">
              <p className="text-white text-center font-bold pointer-events-none">{card.cardData.name}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-0 right-0 px-3 pointer-events-none">
            <p className="text-white text-sm font-semibold text-center drop-shadow-md truncate">
              {card.cardData.name}
            </p>
          </div>
        </div>

        <div 
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 backface-hidden pointer-events-none"
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(180deg)",
            background: "radial-gradient(circle at center, #4c1d95 0%, #1e1b4b 100%)"
          }}
        >
          {deck?.back_image_url ? (
            <img 
              src={deck.back_image_url} 
              alt="Card Back"
              className="w-full h-full object-cover opacity-80 pointer-events-none"
              draggable="false"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-50">
              <div className="w-24 h-32 border border-purple-400/30 rounded flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import { base44 } from "@/api/base44Client";
import { composeCardQuick, composeReading } from "@/utils/interpretationComposer";

export default function ReadingSimple() {
  const [searchParams] = useSearchParams();
  const deckIdFromUrl = searchParams.get("deckId");
  const spreadParam = searchParams.get("spread");
  const questionParam = searchParams.get("question");

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [deckRemaining, setDeckRemaining] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canvasRef = React.useRef(null);
  
  const [readingMode, setReadingMode] = useState(spreadParam === "freeform" ? "freeform" : "spread");
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [isShuffling, setIsShuffling] = useState(false);
  const [isEditingSpread, setIsEditingSpread] = useState(false);
  const [spreadScale, setSpreadScale] = useState(1);
  const [isSavingSpread, setIsSavingSpread] = useState(false);
  
  // Interpretation state
  const [selectedCardForInterpretation, setSelectedCardForInterpretation] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [composedCardOutput, setComposedCardOutput] = useState(null);

  const [spreadInterpretation, setSpreadInterpretation] = useState(null);
  const [isSpreadAiLoading, setIsSpreadAiLoading] = useState(false);
  const [showSpreadInterpretation, setShowSpreadInterpretation] = useState(false);
  
  const [composedReadingOutput, setComposedReadingOutput] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);

  // Load history for personal patterns
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await queueApiCall(() => base44.entities.Reading.list(), 3, 1000);
        setReadingHistory(history || []);
      } catch (err) {
        console.error("Failed to load history for learning layer", err);
      }
    };
    loadHistory();
  }, []);

  const handleSaveSpread = async () => {
    if (!selectedSpread?.id) return;
    setIsSavingSpread(true);
    try {
      await base44.entities.Spread.update(selectedSpread.id, { positions: selectedSpread.positions });
      setIsEditingSpread(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSpread(false);
    }
  };

  const handlePositionUpdate = (newPositions) => {
    if (selectedSpread) {
      setSelectedSpread({ ...selectedSpread, positions: newPositions });
    }
  };

  const getSpreadInsight = async () => {
    if (drawnCards.length === 0 || isSpreadAiLoading) return;
    
    // Deterministic composition first
    const fullReadingOutput = composeReading(
      drawnCards, 
      selectedSpread, 
      questionParam, 
      readingHistory, 
      deck?.id
    );
    setComposedReadingOutput(fullReadingOutput);
    
    setIsSpreadAiLoading(true);
    setShowSpreadInterpretation(true);
    try {
      if (fullReadingOutput?.aiPrompts?.fullReading) {
        const res = await base44.integrations.Core.InvokeLLM({ prompt: fullReadingOutput.aiPrompts.fullReading });
        setSpreadInterpretation(res);
        
        // Asynchronously save the enriched reading data
        try {
          await base44.entities.Reading.create({
            ...fullReadingOutput.saveData,
            interpretation: res,
            date: new Date().toISOString().split('T')[0]
          });
        } catch (saveErr) {
          console.error("Failed to save enriched reading", saveErr);
        }
      }
    } catch (e) {
      setSpreadInterpretation("The spirits are currently unreachable. Please try again later.");
    } finally {
      setIsSpreadAiLoading(false);
    }
  };

  useEffect(() => {
    if (!deckIdFromUrl) {
      setError("No deck selected");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Loading timeout. Please try again.");
      }
    }, 20000);

    const loadDeck = async () => {
      try {
        
        const [loadedDeck, loadedCards, loadedSpreads] = await Promise.all([
          queueApiCall(() => DeckEntity.get(deckIdFromUrl), 3, 1500),
          queueApiCall(() => CardEntity.filter({ deck_id: deckIdFromUrl }), 3, 1500),
          queueApiCall(() => SpreadEntity.list(), 3, 1500)
        ]);

        if (cancelled) return;

        setDeck(loadedDeck);
        setCards(loadedCards);
        if (spreadParam && spreadParam !== "freeform") {
          const spread = loadedSpreads?.find(s => s.id === spreadParam);
          setSelectedSpread(spread || null);
        }
        
        const shuffled = [...loadedCards].sort(() => Math.random() - 0.5);
        setDeckRemaining(shuffled);
        setError("");
      } catch (err) {
        if (cancelled) return;
        
        if (isNetworkError(err)) {
          setError("Network error. Check your connection.");
        } else if (err.response?.status === 404) {
          setError("Deck not found.");
        } else {
          setError("Failed to load deck.");
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    loadDeck();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [deckIdFromUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-200 mb-4">{error}</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="text-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDrawCard = () => {
    if (deckRemaining.length === 0) return;
    
    if (readingMode === "spread" && selectedSpread && drawnCards.length >= selectedSpread.positions.length) {
      return;
    }
    
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.pop();
    
    const x = Math.floor(Math.random() * 60) - 30;
    const y = Math.floor(Math.random() * 60) - 30;
    const rotation = Math.floor(Math.random() * 10) - 5;
    
    setDrawnCards([...drawnCards, {
      id: Date.now().toString() + Math.random(),
      cardData,
      x,
      y,
      rotation,
      isFlipped: false
    }]);
    
    setDeckRemaining(newRemaining);
  };

  const handleDrawSpecificCard = (cardIndex) => {
    if (readingMode === "spread" && selectedSpread && drawnCards.length >= selectedSpread.positions.length) {
      return;
    }
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.splice(cardIndex, 1)[0];
    
    const x = Math.floor(Math.random() * 60) - 30;
    const y = Math.floor(Math.random() * 60) - 30;
    const rotation = Math.floor(Math.random() * 10) - 5;
    
    setDrawnCards([...drawnCards, {
      id: Date.now().toString() + Math.random(),
      cardData,
      x,
      y,
      rotation,
      isFlipped: false
    }]);
    
    setDeckRemaining(newRemaining);
  };

  const handleExternalDrop = ({ targetIndex, cardIndex }) => {
    if (readingMode !== "spread" || !selectedSpread) return;
    // Don't allow dropping on a slot that already has a card
    if (drawnCards[targetIndex]) return;
    
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.splice(cardIndex, 1)[0];
    
    // We need to place this card exactly at targetIndex
    const newDrawnCards = [...drawnCards];
    // Pad array with nulls if needed so targetIndex exists
    while (newDrawnCards.length < targetIndex) {
      newDrawnCards.push(null);
    }
    
    newDrawnCards[targetIndex] = {
      id: Date.now().toString() + Math.random(),
      cardData,
      x: 0,
      y: 0,
      rotation: 0,
      isFlipped: false
    };
    
    setDrawnCards(newDrawnCards);
    setDeckRemaining(newRemaining);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const allCards = [...cards].sort(() => Math.random() - 0.5);
      setDeckRemaining(allCards);
      setDrawnCards([]);
      setRevealedIndices(new Set());
      setIsShuffling(false);
    }, 1200);
  };

  const toggleFlip = (id) => {
    setDrawnCards(drawnCards.map(c => 
      c.id === id ? { ...c, isFlipped: !c.isFlipped } : c
    ));
  };

  const revealAll = () => {
    if (readingMode === "freeform") {
      setDrawnCards(drawnCards.map(c => ({ ...c, isFlipped: true })));
    } else {
      const allIndices = new Set(drawnCards.map((_, i) => i));
      setRevealedIndices(allIndices);
    }
  };

  const onCardReveal = (idx) => {
    const newRevealed = new Set(revealedIndices);
    newRevealed.add(idx);
    setRevealedIndices(newRevealed);
    
    if (drawnCards[idx]) {
      openInterpretation(drawnCards[idx], idx);
    }
  };

  const openInterpretation = (cardWrapper, positionIndex = null) => {
    const position = selectedSpread && positionIndex !== null ? selectedSpread.positions[positionIndex] : null;
    setSelectedCardForInterpretation({ ...cardWrapper, position });
    setAiInterpretation(null);
    
    // Build deterministic output immediately
    const output = composeCardQuick(cardWrapper.cardData, position, cardWrapper.isReversed, questionParam);
    setComposedCardOutput(output);
  };

  const getDeeperInsight = async () => {
    if (!selectedCardForInterpretation || !composedCardOutput || isAiLoading) return;
    setIsAiLoading(true);
    try {
      // Use the pre-built prompt from the composer
      const res = await base44.integrations.Core.InvokeLLM({ prompt: composedCardOutput.aiPrompt });
      setAiInterpretation(res);
    } catch (e) {
      setAiInterpretation("The spirits are currently unreachable. Please try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleFlip = (id) => {
    const newDrawn = drawnCards.map(c => {
      if (c.id === id) {
        if (!c.isFlipped) { 
          openInterpretation(c);
        }
        return { ...c, isFlipped: !c.isFlipped };
      }
      return c;
    });
    setDrawnCards(newDrawn);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col overflow-hidden">
      {/* Shuffling Overlay */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="relative w-32 h-48">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, i % 2 === 0 ? 80 : -80, 0],
                    y: [0, (i % 2 === 0 ? 1 : -1) * 20, 0],
                    rotate: [0, i % 2 === 0 ? 15 : -15, 0],
                    zIndex: [0, 10, 0]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.1
                  }}
                  className="absolute inset-0 rounded-xl border-2 border-purple-500/50 bg-slate-900 shadow-2xl"
                  style={{
                    background: "radial-gradient(circle at center, #4c1d95 0%, #1e1b4b 100%)"
                  }}
                >
                  {deck?.back_image_url ? (
                    <img 
                      src={deck.back_image_url} 
                      alt="Card Back"
                      className="w-full h-full object-cover rounded-xl opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            <p className="absolute mt-72 text-purple-300 font-['Cinzel'] text-xl tracking-widest animate-pulse">Shuffling Deck...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/20 p-2 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-4 shrink-0 px-2 w-full md:w-auto justify-between md:justify-start">
          <Link to={createPageUrl("ReadingRoom")}>
            <Button variant="ghost" className="text-purple-200 hover:text-white hover:bg-purple-500/20 h-8 px-2 md:h-10 md:px-4">
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              <span className="text-sm md:text-base">Room</span>
            </Button>
          </Link>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
              {deck?.name} <span className="text-sm font-normal text-purple-300/70 ml-2">({readingMode === "freeform" ? "Freeform" : selectedSpread?.name})</span>
            </h1>
            <p className="text-xs text-purple-300/70">{deckRemaining.length} cards remaining</p>
          </div>
          {/* Mobile minimal title */}
          <div className="md:hidden text-right">
            <div className="text-xs font-bold text-purple-300 truncate max-w-[150px]">{deck?.name}</div>
            <div className="text-[10px] text-purple-400/70">{deckRemaining.length} cards</div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0 px-2 flex-nowrap w-full justify-start md:justify-end">
          {readingMode === "spread" && selectedSpread && (
            isEditingSpread ? (
              <Button size="sm" onClick={handleSaveSpread} disabled={isSavingSpread} variant="outline" className="shrink-0 border-purple-500/40 text-purple-200 hover:bg-purple-500/20">
                {isSavingSpread ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save Layout
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsEditingSpread(true)} variant="outline" className="shrink-0 border-purple-500/40 text-purple-200 hover:bg-purple-500/20">
                <Settings2 className="w-4 h-4 mr-1" /> Edit Layout
              </Button>
            )
          )}
          <Button 
            size="sm"
            onClick={handleDrawCard} 
            disabled={deckRemaining.length === 0 || (readingMode === "spread" && selectedSpread && drawnCards.length >= selectedSpread.positions.length)}
            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            <Hand className="w-4 h-4 mr-1" />
            Draw
          </Button>
          <Button 
            size="sm"
            onClick={revealAll} 
            variant="outline"
            disabled={drawnCards.length === 0}
            className="shrink-0 border-purple-500/40 text-purple-200 hover:bg-purple-500/20"
          >
            <Eye className="w-4 h-4 mr-1" />
            Reveal All
          </Button>
          <Button 
            size="sm"
            onClick={getSpreadInsight} 
            variant="outline"
            disabled={drawnCards.length === 0}
            className="shrink-0 border-purple-500/40 text-purple-200 hover:bg-purple-500/20"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Interpret
          </Button>
          <Button 
            size="sm"
            onClick={handleShuffle} 
            variant="outline"
            className="shrink-0 border-purple-500/40 text-purple-200 hover:bg-purple-500/20"
          >
            <Shuffle className="w-4 h-4 mr-1" />
            Reshuffle
          </Button>
        </div>
      </div>

      {/* Interactive Canvas / Spread */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {readingMode === "freeform" ? (
          <div 
            className="flex-1 relative p-4 overflow-hidden" 
            ref={canvasRef}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(e) => {
              e.preventDefault();
              try {
                const data = e.dataTransfer.getData('application/json');
                const payload = JSON.parse(data);
                if (payload && payload.source === 'bottom-shelf' && typeof payload.cardIndex === 'number') {
                  handleDrawSpecificCard(payload.cardIndex);
                }
              } catch (err) { console.error('Drop parse error:', err); }
            }}
          >
            {/* Subtle instructions */}
            {drawnCards.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50">
                <Sparkles className="w-12 h-12 text-purple-400 mb-4 animate-pulse" />
                <p className="text-purple-200 text-lg font-['Cinzel'] tracking-wider">Draw a card to begin</p>
                <p className="text-purple-300/60 text-sm mt-2">Drag to arrange · Double-click to reveal</p>
              </div>
            )}

            <AnimatePresence>
              {drawnCards.map((drawnCard, index) => (
                <FreeformCard 
                  key={drawnCard.id} 
                  card={{...drawnCard, zIndex: index + 10}} 
                  canvasRef={canvasRef} 
                  toggleFlip={handleToggleFlip} 
                  deck={deck} 
                  openInterpretation={openInterpretation}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 relative flex flex-col overflow-auto" ref={canvasRef}>
            {isEditingSpread && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-purple-500/40 flex items-center gap-3">
                <span className="text-xs text-purple-200 whitespace-nowrap font-semibold">Card Size</span>
                <input 
                  type="range" min="0.5" max="2" step="0.1" value={spreadScale} 
                  onChange={(e) => setSpreadScale(parseFloat(e.target.value))} 
                  className="w-24 accent-purple-500" 
                />
                <Button variant="ghost" size="sm" onClick={() => setIsEditingSpread(false)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-6 px-2 text-xs">Cancel</Button>
              </div>
            )}
            {selectedSpread ? (
              <div className="w-full min-h-full flex items-center justify-center pb-8">
                <SpreadLayout 
                  spread={selectedSpread}
                  positions={selectedSpread.positions}
                  cards={drawnCards.map(c => c ? c.cardData : null)}
                  deck={deck}
                  revealedCards={revealedIndices}
                  onCardReveal={onCardReveal}
                  onCardClick={(c, idx) => onCardReveal(idx)}
                  enableExternalDrops={true}
                  onExternalDrop={handleExternalDrop}
                  allowReposition={isEditingSpread}
                  onPositionUpdate={handlePositionUpdate}
                  sizeScale={spreadScale}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50">
                <Sparkles className="w-12 h-12 text-purple-400 mb-4 mx-auto animate-pulse" />
                <p className="text-purple-200 text-lg font-['Cinzel'] tracking-wider">No Spreads Available</p>
              </div>
            )}
          </div>
        )}
        
        {/* Universal Bottom Carousel */}
        <div className="w-full bg-black/60 backdrop-blur-md border-t border-purple-500/20 p-4 shrink-0 z-40">
          <BottomCardShelf 
            cards={deckRemaining.map(c => ({...c, image_url: deck?.back_image_url || null, name: "Hidden Card"}))} 
            onCardClick={(c, idx) => handleDrawSpecificCard(idx)} 
          />
        </div>
      </div>

      {/* Interpretation Panel */}
      <AnimatePresence>
        {selectedCardForInterpretation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-black/80 backdrop-blur-xl border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-purple-500/30 flex justify-between items-center bg-purple-900/20">
              <div>
                <h3 className="text-lg font-bold text-white font-['Cinzel']">{selectedCardForInterpretation.cardData.name}</h3>
                {selectedCardForInterpretation.position && (
                  <p className="text-xs text-purple-300">Position: {selectedCardForInterpretation.position.name}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCardForInterpretation(null)} className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0">✕</Button>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {composedCardOutput ? (
                <>
                  <div className="text-sm text-purple-100">
                    <p className="font-semibold text-purple-300 mb-1">Basic Interpretation:</p>
                    <p>{composedCardOutput.summary || "A mysterious force is at play. The meaning is hidden."}</p>
                  </div>

                  {composedCardOutput.positionNote && (
                    <div className="text-sm text-purple-100">
                      <p className="font-semibold text-purple-300 mb-1">Position:</p>
                      <p>{composedCardOutput.positionNote}</p>
                    </div>
                  )}

                  {composedCardOutput.ancientNote && (
                    <div className="text-sm text-purple-100">
                      <p className="font-semibold text-amber-300 mb-1">Ancient Wisdom:</p>
                      <p>{composedCardOutput.ancientNote}</p>
                    </div>
                  )}
                  
                  {composedCardOutput.actionNote && (
                    <div className="text-sm text-purple-100">
                      <p className="font-semibold text-emerald-300 mb-1">Action:</p>
                      <p>{composedCardOutput.actionNote}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-purple-100">
                  <p className="font-semibold text-purple-300 mb-1">Basic Interpretation:</p>
                  <p>{selectedCardForInterpretation.cardData.overall_meaning || selectedCardForInterpretation.cardData.upright_meaning || "A mysterious force is at play. The meaning is hidden."}</p>
                </div>
              )}

              <div className="pt-4 border-t border-purple-500/20">
                {!aiInterpretation && !isAiLoading ? (
                  <Button 
                    onClick={getDeeperInsight} 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Deeper Insight (AI)
                  </Button>
                ) : isAiLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    <span className="ml-2 text-purple-300 text-sm">Consulting the spirits...</span>
                  </div>
                ) : (
                  <div className="text-sm text-white/90 bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30">
                    <p className="font-semibold text-cyan-300 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2" /> AI Insight:</p>
                    <div className="whitespace-pre-wrap leading-relaxed">{aiInterpretation}</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Spread Interpretation Modal */}
      <AnimatePresence>
        {showSpreadInterpretation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
              <div className="p-4 border-b border-purple-500/30 flex justify-between items-center bg-purple-900/40">
                <h3 className="text-xl font-bold text-white font-['Cinzel'] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Reading Interpretation
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSpreadInterpretation(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0">✕</Button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {isSpreadAiLoading ? (
                   <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
                     <p className="text-purple-300 text-lg">The spirits are synthesizing your reading...</p>
                   </div>
                ) : (
                  <div className="text-purple-100 whitespace-pre-wrap leading-relaxed text-lg">
                    {spreadInterpretation}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}