import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Deck as DeckEntity, Card as CardEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Hand, Shuffle, RotateCcw, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";

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
        
        const [loadedDeck, loadedCards] = await Promise.all([
          queueApiCall(() => DeckEntity.get(deckIdFromUrl), 3, 1500),
          queueApiCall(() => CardEntity.filter({ deck_id: deckIdFromUrl }), 3, 1500)
        ]);

        if (cancelled) return;

        setDeck(loadedDeck);
        setCards(loadedCards);
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
    
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.pop();
    
    // Add to center roughly
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
    const allCards = [...cards].sort(() => Math.random() - 0.5);
    setDeckRemaining(allCards);
    setDrawnCards([]);
  };

  const toggleFlip = (id) => {
    setDrawnCards(drawnCards.map(c => 
      c.id === id ? { ...c, isFlipped: !c.isFlipped } : c
    ));
  };

  const revealAll = () => {
    setDrawnCards(drawnCards.map(c => ({ ...c, isFlipped: true })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-black/40 backdrop-blur-md border-b border-purple-500/20 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("ReadingRoom")}>
            <Button variant="ghost" className="text-purple-200 hover:text-white hover:bg-purple-500/20">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Reading Room
            </Button>
          </Link>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
              {deck?.name}
            </h1>
            <p className="text-xs text-purple-300/70">{deckRemaining.length} cards remaining</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleDrawCard} 
            disabled={deckRemaining.length === 0}
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

      {/* Interactive Canvas */}
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
            <motion.div
              key={drawnCard.id}
              drag
              dragConstraints={canvasRef}
              dragMomentum={false}
              dragElastic={0.1}
              initial={{ opacity: 0, scale: 0.5, x: 0, y: 300 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: drawnCard.x, 
                y: drawnCard.y,
                rotate: drawnCard.rotation
              }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              whileHover={{ scale: 1.05, zIndex: 50 }}
              whileDrag={{ scale: 1.1, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
              onDoubleClick={() => toggleFlip(drawnCard.id)}
              className="absolute left-1/2 top-1/2 -ml-[90px] -mt-[140px] cursor-grab active:cursor-grabbing"
              style={{ zIndex: index + 10 }}
            >
              <div 
                className="relative w-[180px] h-[280px] rounded-xl transition-all duration-500 preserve-3d"
                style={{ 
                  transformStyle: "preserve-3d",
                  transform: drawnCard.isFlipped ? "rotateY(0deg)" : "rotateY(180deg)"
                }}
              >
                {/* Front of card */}
                <div 
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900 backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {drawnCard.cardData.image_url ? (
                    <img 
                      src={drawnCard.cardData.image_url} 
                      alt={drawnCard.cardData.name}
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 to-purple-900">
                      <p className="text-white text-center font-bold">{drawnCard.cardData.name}</p>
                    </div>
                  )}
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-0 right-0 px-3">
                    <p className="text-white text-sm font-semibold text-center drop-shadow-md truncate">
                      {drawnCard.cardData.name}
                    </p>
                  </div>
                </div>

                {/* Back of card */}
                <div 
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 backface-hidden"
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
                      className="w-full h-full object-cover opacity-80"
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}