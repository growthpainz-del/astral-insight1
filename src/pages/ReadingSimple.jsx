import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Deck as DeckEntity, Card as CardEntity, Spread as SpreadEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Hand, Shuffle, RotateCcw, Eye, Sparkles } from "lucide-react";
import SpreadLayout from "@/components/reading/SpreadLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";

const FreeformCard = ({ card, canvasRef, toggleFlip, deck }) => {
  const [scale, setScale] = useState(1);
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
      initialPinch.current = { dist, scale };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinch.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinch.current.dist;
      setScale(Math.min(Math.max(0.4, initialPinch.current.scale * ratio), 3));
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
        rotate: card.rotation
      }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ scale: scale * 1.05, zIndex: 50 }}
      whileDrag={{ scale: scale * 1.1, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
      onDoubleClick={() => toggleFlip(card.id)}
      onWheel={(e) => {
        e.stopPropagation();
        const delta = -e.deltaY * 0.002;
        setScale(s => Math.min(Math.max(0.4, s + delta), 3));
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="absolute left-1/2 top-1/2 -ml-[90px] -mt-[140px] cursor-grab active:cursor-grabbing touch-none"
      style={{ zIndex: card.zIndex || 10 }}
    >
      <div 
        className="relative w-[180px] h-[280px] rounded-xl transition-all duration-500 preserve-3d"
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

export default function ReadingSimple() {
  const [searchParams] = useSearchParams();
  const deckIdFromUrl = searchParams.get("deckId");

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [deckRemaining, setDeckRemaining] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canvasRef = React.useRef(null);
  
  const [readingMode, setReadingMode] = useState("freeform");
  const [spreads, setSpreads] = useState([]);
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

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
        setSpreads(loadedSpreads || []);
        if (loadedSpreads && loadedSpreads.length > 0) {
          setSelectedSpread(loadedSpreads[0]);
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
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 max-w-lg w-full">
          <Link to={createPageUrl("ReadingRoom")}>
            <Button variant="ghost" className="text-purple-200 hover:text-white mb-6 -ml-4">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-2 font-['Cinzel']">
            {deck?.name}
          </h1>
          <p className="text-purple-300/70 mb-8">Choose your reading style before you begin drawing cards.</p>

          <Tabs value={readingMode} onValueChange={setReadingMode} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-purple-500/30 h-12">
              <TabsTrigger value="freeform" className="data-[state=active]:bg-purple-600 text-sm">
                Freeform Canvas
              </TabsTrigger>
              <TabsTrigger value="spread" className="data-[state=active]:bg-purple-600 text-sm">
                Spread Layout
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <AnimatePresence mode="wait">
            {readingMode === "freeform" ? (
              <motion.div 
                key="freeform"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg text-center"
              >
                <Hand className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-purple-200">Draw cards one by one and freely drag them anywhere on the canvas to build your own layout.</p>
              </motion.div>
            ) : (
              <motion.div
                key="spread"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8"
              >
                <label className="block text-purple-300 text-sm mb-2">Select Spread</label>
                {spreads.length > 0 ? (
                  <Select 
                    value={selectedSpread?.id || ""} 
                    onValueChange={(val) => setSelectedSpread(spreads.find(s => s.id === val))}
                  >
                    <SelectTrigger className="w-full h-12 bg-black/40 border-purple-500/30 text-white">
                      <SelectValue placeholder="Select a spread layout" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-purple-500/30 text-white max-h-60">
                      {spreads.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-red-300 bg-red-900/20 p-3 rounded border border-red-500/30 text-sm">
                    No spreads available. Please create some in the Spread Manager or use Freeform mode.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] text-lg font-['Cinzel'] tracking-wider"
            onClick={() => setHasStarted(true)}
            disabled={readingMode === "spread" && (!spreads.length || !selectedSpread)}
          >
            Begin Reading
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/20 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setHasStarted(false)} className="text-purple-200 hover:text-white hover:bg-purple-500/20">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Modes
          </Button>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
              {deck?.name} <span className="text-sm font-normal text-purple-300/70 ml-2">({readingMode === "freeform" ? "Freeform" : selectedSpread?.name})</span>
            </h1>
            <p className="text-xs text-purple-300/70">{deckRemaining.length} cards remaining</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleDrawCard} 
            disabled={deckRemaining.length === 0 || (readingMode === "spread" && selectedSpread && drawnCards.length >= selectedSpread.positions.length)}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            <Hand className="w-4 h-4 mr-2" />
            Draw Card
          </Button>
          <Button 
            onClick={revealAll} 
            variant="outline"
            disabled={drawnCards.length === 0}
            className="border-purple-500/40 text-purple-200 hover:bg-purple-500/20"
          >
            <Eye className="w-4 h-4 mr-2 hidden sm:block" />
            Reveal All
          </Button>
          <Button 
            onClick={handleShuffle} 
            variant="outline"
            className="border-purple-500/40 text-purple-200 hover:bg-purple-500/20"
          >
            <Shuffle className="w-4 h-4 mr-2 hidden sm:block" />
            Reshuffle
          </Button>
        </div>
      </div>

      {/* Interactive Canvas / Spread */}
      {readingMode === "freeform" ? (
        <div className="flex-1 relative p-4" ref={canvasRef}>
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
                toggleFlip={toggleFlip} 
                deck={deck} 
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 relative p-4 flex flex-col items-center justify-center overflow-auto" ref={canvasRef}>
          {selectedSpread ? (
            <div className="w-full h-full flex items-center justify-center">
              <SpreadLayout 
                spread={selectedSpread}
                positions={selectedSpread.positions}
                cards={drawnCards.map(c => c.cardData)}
                deck={deck}
                revealedCards={revealedIndices}
                onCardReveal={onCardReveal}
                onCardClick={(c, idx) => onCardReveal(idx)}
              />
            </div>
          ) : (
            <div className="text-center opacity-50">
              <Sparkles className="w-12 h-12 text-purple-400 mb-4 mx-auto animate-pulse" />
              <p className="text-purple-200 text-lg font-['Cinzel'] tracking-wider">No Spreads Available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}