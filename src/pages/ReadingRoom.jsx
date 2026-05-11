import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Play, Clock, Sparkles, ChevronRight, Eye, Combine, Star, Heart, TrendingUp, Users, Wand2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queueApiCall } from "@/components/utils/apiQueue";
import { motion, AnimatePresence } from "framer-motion";
import PullToRefresh from "@/components/common/PullToRefresh";
import { Label } from "@/components/ui/label";
import DidAgentEmbed from "@/components/integrations/DidAgentEmbed";
import CoverflowDeckSelector from "@/components/reading/CoverflowDeckSelector";

function DeckCard({ deck, isOwned = false }) {
  return (
    <Link to={createPageUrl(`Reading?deckId=${deck.id}`)} className="group block">
      <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-white/10 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30">
        {deck.cover_image ? (
          <img
            src={deck.cover_image}
            alt={deck.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <Sparkles className="w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 text-white">
              <Play className="w-5 h-5 mr-1" />
              <span className="font-semibold">Read Now</span>
            </div>
          </div>
        </div>

        <div className="absolute top-2 left-2">
          {deck.is_premium && (
            <div className="bg-amber-500 text-xs font-bold px-2 py-1 rounded">PREMIUM</div>
          )}
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = createPageUrl(`DeckGallery?deckId=${deck.id}`); }}
            className="bg-black/70 hover:bg-black/90 backdrop-blur-sm p-2 rounded-lg border border-white/20 transition-all hover:scale-110"
            title="View Gallery"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <h4 className="text-white font-semibold truncate">{deck.name}</h4>
        <p className="text-white/60 text-sm">{deck.category || 'Oracle'}</p>
      </div>
    </Link>
  );
}

function ReadingCard({ reading, deck }) {
  return (
    <Link to={createPageUrl(`History`)} className="group">
      <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-white/10 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30">
        {deck?.cover_image ? (
          <img
            src={deck.cover_image}
            alt={reading.title}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <Clock className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white/70 text-xs mb-1">{new Date(reading.created_date).toLocaleDateString()}</p>
            <h4 className="text-white font-semibold text-sm line-clamp-2">{reading.title}</h4>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ label, icon: Icon, to, gradient }) {
  return (
    <Link to={to} className="group">
      <div className={`relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden ${gradient} border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          <Icon className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-center">{label}</span>
        </div>
      </div>
    </Link>
  );
}

// Crystal Ball Reading Component
function CrystalBallReading({ decks, onClose }) {
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [drawnCard, setDrawnCard] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [deckCards, setDeckCards] = useState([]);

  // Filter to goddess/wiccan themed decks or all if none found
  const magicalDecks = decks.filter(d => 
    d.name.toLowerCase().includes('goddess') || 
    d.name.toLowerCase().includes('wiccan') ||
    d.name.toLowerCase().includes('witch')
  );
  const availableDecks = magicalDecks.length > 0 ? magicalDecks : decks;

  useEffect(() => {
    // Auto-select first deck
    if (availableDecks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(availableDecks[0].id);
    }
  }, [availableDecks, selectedDeckId]);

  useEffect(() => {
    // Load cards when deck is selected
    if (selectedDeckId) {
      queueApiCall(() => base44.entities.Card.filter({ deck_id: selectedDeckId }))
        .then(cards => setDeckCards(cards))
        .catch(() => {});
    }
  }, [selectedDeckId]);

  const handleDrawCard = () => {
    if (!deckCards.length || isDrawing) return;

    setIsDrawing(true);
    setDrawnCard(null);

    // Shuffle and pick random card
    setTimeout(() => {
      const randomCard = deckCards[Math.floor(Math.random() * deckCards.length)];
      setDrawnCard(randomCard);
      setIsDrawing(false);
    }, 3000);
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      {/* Crystal Ball Video Background */}
      <div className="absolute inset-0 opacity-40">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/crystal-ball-bg.mp4"
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50" />
        </video>
      </div>

      {/* Mystical Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          className="absolute top-4 right-4 text-white/80 hover:text-white"
          size="lg"
        >
          ✕ Exit
        </Button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 mb-3">
            🔮 Crystal Ball Oracle
          </h1>
          <p className="text-purple-200 text-lg">Peer into the crystal and reveal your destiny</p>
        </motion.div>

        {!drawnCard && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full space-y-6"
          >
            {/* Deck Selector */}
            <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-purple-500/40 p-6">
              <Label className="text-purple-200 mb-3 block text-lg font-semibold">
                Choose Your Oracle Deck
              </Label>
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger className="bg-black/50 border-purple-500/40 text-white text-lg h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-purple-500/40 max-h-[300px]">
                  {availableDecks.map(deck => (
                    <SelectItem key={deck.id} value={deck.id} className="text-white text-base">
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDeck && (
                <p className="text-purple-300 text-sm mt-3 italic">
                  {selectedDeck.description || "Ancient wisdom awaits..."}
                </p>
              )}
            </div>

            {/* Draw Button */}
            <Button
              onClick={handleDrawCard}
              disabled={!selectedDeckId || !deckCards.length}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold py-6 text-xl shadow-2xl shadow-purple-500/50"
            >
              <Wand2 className="w-6 h-6 mr-3" />
              Reveal Your Card
              <Sparkles className="w-6 h-6 ml-3" />
            </Button>
          </motion.div>
        )}

        {/* Crystal Ball Animation During Draw */}
        {isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="relative w-96 h-96">
              {/* Glowing Crystal Ball */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-cyan-500/40 blur-2xl"
              />
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 40px rgba(168, 85, 247, 0.6)",
                    "0 0 80px rgba(236, 72, 153, 0.8)",
                    "0 0 40px rgba(168, 85, 247, 0.6)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-900/60 to-black/80 border-4 border-purple-400/50 flex items-center justify-center"
              >
                <Sparkles className="w-20 h-20 text-cyan-300 animate-pulse" />
              </motion.div>
            </div>
            <p className="text-center text-purple-200 text-xl mt-8 font-semibold animate-pulse">
              The crystal reveals your card...
            </p>
          </motion.div>
        )}

        {/* Drawn Card Display */}
        <AnimatePresence>
          {drawnCard && !isDrawing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl w-full"
            >
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl border-2 border-purple-400/50 p-8 shadow-2xl shadow-purple-500/50">
                {/* Card Image */}
                {drawnCard.image_url && (
                  <motion.div
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="mb-6 flex justify-center"
                  >
                    <img
                      src={drawnCard.image_url}
                      alt={drawnCard.name}
                      className="max-w-xs rounded-xl shadow-2xl border-4 border-purple-500/30"
                    />
                  </motion.div>
                )}

                {/* Card Info */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
                    {drawnCard.name}
                  </h2>

                  {drawnCard.subtitle && (
                    <p className="text-center text-purple-300 italic text-lg">
                      {drawnCard.subtitle}
                    </p>
                  )}

                  {drawnCard.keywords && drawnCard.keywords.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {drawnCard.keywords.map((keyword, i) => (
                        <span key={i} className="bg-purple-600/30 text-purple-200 px-3 py-1 rounded-full text-sm border border-purple-500/40">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {drawnCard.overall_meaning && (
                    <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                      <p className="text-white leading-relaxed">
                        {drawnCard.overall_meaning}
                      </p>
                    </div>
                  )}

                  {drawnCard.upright_meaning && (
                    <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-4">
                      <h3 className="text-cyan-300 font-semibold mb-2">Guidance</h3>
                      <p className="text-white/90 leading-relaxed">
                        {drawnCard.upright_meaning}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setDrawnCard(null);
                        handleDrawCard();
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Draw Another
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1 border-purple-500/40 text-purple-200 hover:bg-purple-900/30"
                    >
                      Return to Gallery
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ReadingRoom() {
  const [searchParams] = useSearchParams();
  const [publicDecks, setPublicDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [showCrystalBall, setShowCrystalBall] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      let user = null;
      try {
        user = await queueApiCall(() => base44.auth.me());
        setCurrentUser(user);
      } catch (e) {
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const allDecks = await queueApiCall(() => base44.entities.Deck.list("-created_date", 200));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const readings = await queueApiCall(() => base44.entities.Reading.list("-created_date", 10));

      const publicDecksList = (allDecks || []).filter(d => d.is_public && d.publish_status === "published");
      const myDecksList = user 
        ? (allDecks || []).filter(d => 
            d.created_by && 
            d.created_by.toLowerCase() === user.email?.toLowerCase() &&
            (d.publish_status === "published" || !d.publish_status)
          )
        : [];

      setPublicDecks(publicDecksList);
      setMyDecks(myDecksList);
      setRecentReadings(readings || []);
      
    } catch (error) {
      setError("Failed to load data. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <div className="text-white">Loading reading room...</div>
        </div>
      </div>
    );
  }

  const allAvailableDecks = [...publicDecks, ...myDecks];
  const showAllOfficial = searchParams.get('all') === '1';

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen relative bg-[#07050f] text-white font-['Crimson_Text']">
      {/* Crystal Ball Reading Modal */}
      {showCrystalBall && (
        <CrystalBallReading 
          decks={allAvailableDecks}
          onClose={() => setShowCrystalBall(false)}
        />
      )}

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-[18px] py-[11px] bg-[#07050f]/92 border-b border-[#a078ff]/15 backdrop-blur-[16px]">
        <Link to={createPageUrl("CosmicHub")} className="font-['Cinzel'] text-[10px] tracking-[0.14em] uppercase text-purple-200/45 flex items-center gap-[5px] cursor-pointer transition-colors bg-transparent border-none hover:text-purple-400">
          ‹ Back
        </Link>
        <div className="flex items-center gap-[9px] text-decoration-none">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#1a0f35] to-[#0a0618] flex items-center justify-center text-[16px] shadow-[0_0_10px_rgba(167,139,250,0.25)]">
            🌙
          </div>
          <span className="font-['Cinzel'] text-[10px] tracking-[0.22em] uppercase text-purple-200/45">
            Reading Room
          </span>
        </div>
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#67e8f9] flex items-center justify-center font-['Cinzel'] text-[10px] text-white font-bold shadow-[0_0_10px_rgba(103,232,249,0.2)]">
          {currentUser ? (currentUser.full_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase() : 'GR'}
        </div>
      </nav>

      {/* Deck Selector Coverflow Design */}
      <CoverflowDeckSelector 
        publicDecks={publicDecks} 
        myDecks={myDecks} 
        onDrawCards={(deck, spread, question) => {
          window.location.href = createPageUrl(`Reading?deckId=${deck.id}&spread=${encodeURIComponent(spread)}&question=${encodeURIComponent(question)}`);
        }} 
      />

          </div>
          </PullToRefresh>
          );
          }