import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { createPortal } from "react-dom";
import {
  Shuffle,
  Save,
  Sparkles,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  BookOpen,
  Eye,
  X,
  RefreshCw,
  FileText,
  Bug, // NEW: Bug icon for debug panel
  Share2,
} from "lucide-react";

// Import components
import AIReading from "@/components/reading/AIReading";
import IdeomotorCanvas from "@/components/reading/IdeomotorCanvas";
import SpreadLayout from "@/components/reading/SpreadLayout";
import CompactSpread from "@/components/reading/CompactSpread";
import RootedCrescentStage from "@/components/reading/RootedCrescentStage";
import { queueApiCall } from "@/components/utils/apiQueue";
import CardRelationshipVisualizer from "@/components/deck/CardRelationshipVisualizer";
import { Badge } from "@/components/ui/badge";
import ReadingSessionManager from "@/components/reading/ReadingSessionManager";
import EnhancedCardViewer from "@/components/reading/EnhancedCardViewer";
import DisablePullToRefresh from "@/components/common/DisablePullToRefresh";
import ShuffleAnimation from "@/components/reading/ShuffleAnimation";
import AudioOrb from "@/components/reading/AudioOrb";
import StructuredReading from "@/components/reading/StructuredReading";
import ReadingShareModal from "@/components/reading/ReadingShareModal";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Built-in spreads with proper position structure for SpreadLayout
const BUILT_IN_SPREADS = [
  {
    id: "single",
    name: "Single Card",
    positions: [{ name: "Guidance", meaning: "Your guidance for today", x: 50, y: 50, rotation: 0 }],
    isBuiltIn: true,
  },
  {
    id: "three_card",
    name: "Past, Present, Future",
    positions: [
      { name: "Past", meaning: "What has brought you here", x: 25, y: 50, rotation: 0 },
      { name: "Present", meaning: "Where you are now", x: 50, y: 50, rotation: 0 },
      { name: "Future", meaning: "Where you are heading", x: 75, y: 50, rotation: 0 }
    ],
    isBuiltIn: true,
  },
  {
    id: "diamond",
    name: "Diamond Ring",
    positions: [
      // Top
      { name: "North", meaning: "Overarching theme", x: 50, y: 14, rotation: 0 },
      // Upper-right
      { name: "North-East", meaning: "What supports you", x: 74, y: 30, rotation: 35 },
      // Right
      { name: "East", meaning: "External influences", x: 88, y: 50, rotation: 90 },
      // Lower-right
      { name: "South-East", meaning: "What to release", x: 74, y: 70, rotation: -35 },
      // Bottom
      { name: "South", meaning: "Hidden factor", x: 50, y: 86, rotation: 0 },
      // Lower-left
      { name: "South-West", meaning: "Challenge", x: 26, y: 70, rotation: 35 },
      // Left
      { name: "West", meaning: "Internal influences", x: 12, y: 50, rotation: 90 }
    ],
    isBuiltIn: true,
  }
  ,{
    id: "celtic_cross",
    name: "Celtic Cross",
    positions: [
      { name: "Present", meaning: "Your current situation" },
      { name: "Challenge", meaning: "What crosses you" },
      { name: "Foundation", meaning: "The basis of the situation" },
      { name: "Recent Past", meaning: "What is behind you" },
      { name: "Crown", meaning: "Your goal or destiny" },
      { name: "Near Future", meaning: "What lies ahead" },
      { name: "Self", meaning: "Your attitude" },
      { name: "Environment", meaning: "External influences" },
      { name: "Hopes/Fears", meaning: "Your hopes and fears" },
      { name: "Outcome", meaning: "The final outcome" }
    ],
    isBuiltIn: true,
  },
  {
    id: "horseshoe",
    name: "Horseshoe",
    positions: [
      { name: "Past", meaning: "Background", x: 15, y: 70, rotation: -10 },
      { name: "Present", meaning: "Current state", x: 30, y: 58, rotation: -5 },
      { name: "Hidden", meaning: "Unseen factors", x: 45, y: 52, rotation: 0 },
      { name: "Obstacle", meaning: "What blocks you", x: 60, y: 52, rotation: 0 },
      { name: "Advice", meaning: "Guidance", x: 75, y: 58, rotation: 5 },
      { name: "Near Future", meaning: "Next step", x: 90, y: 70, rotation: 10 },
      { name: "Outcome", meaning: "Likely result", x: 52, y: 80, rotation: 0 }
    ],
    isBuiltIn: true,
  },
  {
    id: "relationship",
    name: "Relationship",
    positions: [
      { name: "You (Conscious)", meaning: "Your surface stance", x: 30, y: 30, rotation: 0 },
      { name: "You (Subconscious)", meaning: "Deeper driver", x: 30, y: 50, rotation: 0 },
      { name: "You (Lesson)", meaning: "What to learn", x: 30, y: 70, rotation: 0 },
      { name: "Partner (Conscious)", meaning: "Their surface stance", x: 70, y: 30, rotation: 0 },
      { name: "Partner (Subconscious)", meaning: "Their deeper driver", x: 70, y: 50, rotation: 0 },
      { name: "Partner (Lesson)", meaning: "What they learn", x: 70, y: 70, rotation: 0 }
    ],
    isBuiltIn: true,
  },
  {
    id: "decision",
    name: "Decision",
    positions: [
      { name: "Choice A", meaning: "Path A", x: 30, y: 35, rotation: -6 },
      { name: "Choice B", meaning: "Path B", x: 70, y: 35, rotation: 6 },
      { name: "Pros", meaning: "What helps", x: 30, y: 65, rotation: -6 },
      { name: "Cons", meaning: "What hinders", x: 70, y: 65, rotation: 6 },
      { name: "Outcome", meaning: "Best alignment", x: 50, y: 50, rotation: 0 }
    ],
    isBuiltIn: true,
  },
  {
    id: "weekly_forecast",
    name: "Weekly Forecast",
    positions: [
      { name: "Mon", meaning: "Monday", x: 10, y: 50, rotation: 0 },
      { name: "Tue", meaning: "Tuesday", x: 24, y: 50, rotation: 0 },
      { name: "Wed", meaning: "Wednesday", x: 38, y: 50, rotation: 0 },
      { name: "Thu", meaning: "Thursday", x: 52, y: 50, rotation: 0 },
      { name: "Fri", meaning: "Friday", x: 66, y: 50, rotation: 0 },
      { name: "Sat", meaning: "Saturday", x: 80, y: 50, rotation: 0 },
      { name: "Sun", meaning: "Sunday", x: 94, y: 50, rotation: 0 }
    ],
    isBuiltIn: true,
  },
  {
    id: "star",
    name: "Star",
    positions: [
      { name: "Theme", meaning: "Central theme", x: 50, y: 50, rotation: 0 },
      { name: "North", meaning: "Guidance", x: 50, y: 15, rotation: 0 },
      { name: "NE", meaning: "Support", x: 72, y: 32, rotation: 18 },
      { name: "SE", meaning: "Action", x: 68, y: 72, rotation: -18 },
      { name: "South", meaning: "Shadow", x: 50, y: 85, rotation: 0 },
      { name: "SW", meaning: "Challenge", x: 32, y: 72, rotation: 18 },
      { name: "NW", meaning: "Insight", x: 28, y: 32, rotation: -18 }
    ],
    isBuiltIn: true,
  },
  {
    id: "chakra",
    name: "Chakra Alignment",
    positions: [
      { name: "Crown", meaning: "Spiritual connection", x: 50, y: 15, rotation: 0 },
      { name: "Third Eye", meaning: "Intuition", x: 50, y: 27, rotation: 0 },
      { name: "Throat", meaning: "Expression", x: 50, y: 39, rotation: 0 },
      { name: "Heart", meaning: "Love & compassion", x: 50, y: 51, rotation: 0 },
      { name: "Solar Plexus", meaning: "Willpower", x: 50, y: 63, rotation: 0 },
      { name: "Sacral", meaning: "Creativity", x: 50, y: 75, rotation: 0 },
      { name: "Root", meaning: "Grounding", x: 50, y: 87, rotation: 0 }
    ],
    isBuiltIn: true,
  },
];

export default function ReadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const deckIdFromUrl = React.useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("deckId");
  }, [location.search]);

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [customSpreads, setCustomSpreads] = useState([]);
  const [allSpreads, setAllSpreads] = useState(BUILT_IN_SPREADS);
  const [spreadsLoading, setSpreadsLoading] = useState(false);
  
  const [selectedSpreadId, setSelectedSpreadId] = useState("three_card");
  const [question, setQuestion] = useState("");
  // Cards in the "bottom shelf" waiting area
  const [drawnCards, setDrawnCards] = useState([]);
  // Cards assigned to spread positions (index-aligned with readingPositions)
  const [placedCards, setPlacedCards] = useState([]);
  // Derived: cards still available to place
  // (shelf disabled)
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showStructuredReading, setShowStructuredReading] = useState(false);
  const [audioText, setAudioText] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");

  const [showSessionManager, setShowSessionManager] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showEnhancedViewer, setShowEnhancedViewer] = useState(false);
  const [viewerCard, setViewerCard] = useState(null);
  const [showRelationshipsOverlay, setShowRelationshipsOverlay] = useState(false);
const [showCompactSpreadOverlay, setShowCompactSpreadOverlay] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);

        // Mobile-safe: detect iOS and reduced motion to reduce heavy animations
        const isIOS = typeof navigator !== 'undefined' && (/iP(ad|hone|od)/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document));
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const disableHeavyAnimations = isIOS || prefersReducedMotion;

        // Drag-to-position state (live, per reading)
        const [readingPositions, setReadingPositions] = useState([]);

  // NEW: Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [viewMode, setViewMode] = useState('compact');
  
  // NEW: Card reveal states
  const [revealedCards, setRevealedCards] = useState(new Set());


  // Deck picker state when no deck is selected
  const [pickerDecks, setPickerDecks] = useState({ publicDecks: [], myDecks: [] });
  const [pickerLoading, setPickerLoading] = useState(false);

  // Load curated spreads only (disable custom spreads for now)
  useEffect(() => {
    setCustomSpreads([]);
    setAllSpreads(BUILT_IN_SPREADS);
    setSpreadsLoading(false);
  }, []);

  // When no deck is selected, load decks for in-page picker
  useEffect(() => {
    if (deckIdFromUrl) return;
    let cancelled = false;
    const loadPicker = async () => {
      try {
        setPickerLoading(true);
        const [publicDecks, user] = await Promise.all([
          queueApiCall(() => base44.entities.Deck.filter({ is_public: true, publish_status: 'published' }, '-created_date', 100), 3, 800),
          queueApiCall(() => base44.auth.me(), 1, 500).catch(() => null),
        ]);
        let myDecks = [];
        if (user?.email) {
          const mine = await queueApiCall(() => base44.entities.Deck.filter({ created_by: user.email }, '-updated_date', 100), 2, 800);
          myDecks = Array.isArray(mine) ? mine.filter(d => d.publish_status !== 'draft' && d.publish_status !== 'pending_review') : [];
        }
        if (!cancelled) setPickerDecks({ publicDecks: publicDecks || [], myDecks });
      } catch (e) {
        if (!cancelled) setPickerDecks({ publicDecks: [], myDecks: [] });
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    };
    loadPicker();
    return () => { cancelled = true; };
  }, [deckIdFromUrl]);

  // Load deck and cards - MAIN LOAD
  useEffect(() => {
    if (!deckIdFromUrl) {
      // No deck chosen: show deck picker instead of error
      setError("");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setIsLoading(false);
        setError("Loading timeout. Please refresh and try again.");
      }
    }, 20000);

    const loadData = async () => {
      console.log('🔎 ReadingPage: deckIdFromUrl =', deckIdFromUrl);
      try {
        setIsLoading(true);
        console.log('📚 Loading deck and cards for deckId:', deckIdFromUrl);
        
        const [currentUser, loadedDeck, deckCards] = await Promise.all([
          queueApiCall(() => base44.auth.me(), 3, 1000),
          queueApiCall(() => base44.entities.Deck.get(deckIdFromUrl), 3, 1000),
          queueApiCall(() => base44.entities.Card.filter({ deck_id: deckIdFromUrl }), 3, 1000)
        ]);

        if (cancelled) return;

        console.log('✅ Loaded:', loadedDeck?.name, deckCards?.length || 0, 'cards');
        console.log('📋 Cards loaded:', deckCards);
        
        setUser(currentUser);
        setDeck(loadedDeck);
        setCards(deckCards || []);
        setError("");
        

        
      } catch (err) {
        if (cancelled) return;
        console.error("❌ Failed to load:", err);
        setError("Failed to load reading. Please try again.");
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [deckIdFromUrl]);



  const selectedSpread = allSpreads.find(s => s.id === selectedSpreadId) || BUILT_IN_SPREADS[1];

  // Keep local editable positions in sync with the selected spread
  useEffect(() => {
    setReadingPositions(selectedSpread?.positions || []);
  }, [selectedSpread]);

  const handleDrawCards = () => {
    console.log('🎴 handleDrawCards called');
    console.log('Cards available:', cards.length);
    console.log('Selected spread:', selectedSpread?.name);
    
    if (!cards.length || !selectedSpread) {
      console.error('❌ Cannot draw - no cards or no spread selected');
      setError("Cannot draw cards. Deck has no cards.");
      return;
    }

    setIsDrawing(true);
    
    const shuffled = [...cards].sort(() => Math.random() - 0.5); // Single shuffle per reading
    console.log('🔀 Shuffled', shuffled.length, 'cards');

    const positionsCount = selectedSpread.positions.length;



    // Default (other spreads): draw exactly as many as positions
    const drawn = selectedSpread.positions.map((position, idx) => {
      const card = shuffled[idx];
      if (!card) {
        console.warn(`⚠️ No card available for position ${idx}`);
      }
      const positionData = typeof position === 'string'
        ? { name: position, meaning: '', x: null, y: null, rotation: 0 }
        : {
            name: position.name || `Position ${idx + 1}`,
            meaning: position.meaning || '',
            x: typeof position.x === 'number' ? position.x : null,
            y: typeof position.y === 'number' ? position.y : null,
            rotation: typeof position.rotation === 'number' ? position.rotation : 0,
          };
      return {
        ...card,
        card_id: card?.id,
        position: positionData.name,
        position_meaning: positionData.meaning,
        position_x: positionData.x,
        position_y: positionData.y,
        position_rotation: positionData.rotation,
        isReversed: deck?.category === 'tarot' && Math.random() > 0.5,
      };
    });

    console.log('🎴 Drawing cards with spread:', selectedSpread.name, {
      isCustom: selectedSpread.isCustom,
      positionCount: drawn.length,
      drawnCards: drawn.length,
      sampleCard: drawn[0] ? {
        name: drawn[0].name,
        position: drawn[0].position,
        x: drawn[0].position_x,
        y: drawn[0].position_y,
      } : null,
    });

    const shuffleDurationMs = disableHeavyAnimations ? 2500 : (deck?.shuffle_animation_url ? 8000 : 3000);
    setTimeout(() => {
      console.log('✅ Setting drawn cards:', drawn.length);
      setDrawnCards(drawn);
      setPlacedCards(drawn);
      setRevealedCards(new Set());
      setIsDrawing(false);
    }, shuffleDurationMs);
  };

  const handleCardReveal = (cardIndex) => {
    setRevealedCards(prev => {
      const newSet = new Set(prev);
      newSet.add(cardIndex);
      return newSet;
    });
  };

  const handleSaveReading = async () => {
    if (!drawnCards.length || !deck) return;
    setShowSessionManager(true);
  };

  const handleSessionSaved = (reading) => {
    console.log("Reading session saved:", reading);
    setShowSessionManager(false);
  };

  const handleCardClick = (drawnCard, cardIndex) => {
    console.log('🎴 Card clicked!', {
      drawnCard: drawnCard,
      cardIndex,
      cardId: drawnCard?.id,
      card_id: drawnCard?.card_id,
      name: drawnCard?.name
    });
    
    // Choose active set for relations/viewer context
    const activeCards = (placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean);

    // The drawnCard already contains all card data since we spread {...card} when drawing
    // We should find it in the `cards` array to ensure we have the most complete original card data.
    // `drawnCard.id` contains the original ID of the card.
    const fullCard = cards.find(c => c.id === drawnCard.id);
    
    console.log('🔍 Found full card:', fullCard?.name);
    
    if (drawnCard) {
      setViewerCard({
        card: fullCard || drawnCard, // Use fullCard if found, otherwise use drawnCard itself (it's already enriched)
        position: drawnCard.position,
        isReversed: drawnCard.isReversed,
        relatedCards: activeCards.filter(dc => dc.id !== drawnCard.id)
      });
      setShowEnhancedViewer(true);
      console.log('✅ Opening EnhancedCardViewer');
    } else {
      console.error('❌ No card data to display');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07050f' }}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#a78bfa] mx-auto mb-4 animate-pulse" />
          <div className="text-[rgba(225,215,255,.9)] font-serif">Channeling deck energies...</div>
        </div>
      </div>
    );
  }

  // If no deck chosen, show an in-page deck picker
  if (!deckIdFromUrl) {
    navigate(createPageUrl('Dashboard'));
    return null;
  }

  if (error && !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07050f' }}>
        <div className="max-w-md w-full bg-[#160f2a] border border-[#ef4444] rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[rgba(225,215,255,.9)] font-serif mb-2">Cosmic Interference</h2>
          <p className="text-[rgba(180,160,220,.42)] mb-6">{error}</p>
          <Link to={createPageUrl("Dashboard")}>
            <button className="w-full p-[14px] rounded-full border border-[rgba(160,120,255,.3)] bg-[#160f2a] text-[rgba(225,215,255,.9)] text-[11.5px] tracking-[0.18em] uppercase cursor-pointer transition-all hover:bg-[rgba(160,120,255,.2)]" style={{ fontFamily: "'Cinzel', serif" }}>
              Return to Reading Room
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DisablePullToRefresh targetSelector="body" />
      <div className="min-h-screen font-serif flex flex-col" style={{ background: '#07050f', color: 'rgba(225,215,255,.9)', paddingBottom: '72px' }}>
      
      {/* Header */}
      {!drawnCards.length && (
        <div className="flex items-center justify-between px-[18px] py-[13px] sticky top-0 z-50 bg-[#07050f]/80 backdrop-blur-md border-b border-[rgba(160,120,255,.16)]">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-[6px] text-[rgba(180,160,220,.6)] hover:text-[#a78bfa] transition-colors" style={{ textDecoration: 'none' }}>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-[14px] tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#c8a8ff] via-[#fff] to-[#a0c8ff] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              {deck?.name || 'Reading'}
            </h1>
          </div>
          <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(160,120,255,.3)] text-[rgba(180,160,220,.6)] hover:text-[#a78bfa] hover:border-[#a78bfa] transition-colors bg-transparent cursor-pointer"
          >
            <Bug className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[430px] mx-auto flex flex-col">
        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mx-[18px] mt-[14px] p-[14px] bg-[#160f2a] border border-[#67e8f9] rounded-[14px] text-[12px] text-[rgba(180,160,220,.8)] font-sans">
            <div className="flex justify-between items-center mb-2 text-[#67e8f9] font-bold">
              <span className="flex items-center gap-2"><Bug className="w-4 h-4"/> Debug Info</span>
              <button onClick={() => setShowDebugPanel(false)} className="text-[#67e8f9] bg-transparent border-none cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-1 opacity-80">
              <div>Cards loaded: {cards.length}</div>
              <div>Selected spread: {selectedSpread?.name} ({selectedSpread?.positions?.length} pos)</div>
              <div>Drawn cards: {drawnCards.length}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-[18px] mt-[14px] p-[14px] bg-[#1a0f14] border border-[#ef4444] rounded-[14px] text-[#ef4444] text-[13px] flex items-center gap-[10px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="flex-1 leading-[1.4]">{error}</div>
            <button onClick={() => setError("")} className="text-[#ef4444] bg-transparent border-none cursor-pointer"><X className="w-4 h-4"/></button>
          </div>
        )}

        {/* Pre-Draw State */}
        {!drawnCards.length && !isDrawing && (
          <div className="flex-1 flex flex-col pt-[18px]">
            {/* Deck Header Card */}
            {deck && (
              <div className="mx-[18px] mb-[20px] p-[14px] bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] flex items-center gap-[14px]">
                <div className="w-[50px] h-[75px] rounded-[6px] overflow-hidden border border-[rgba(160,120,255,.3)] shrink-0 bg-[#160f2a]">
                  {deck.cover_image ? <img src={deck.cover_image} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[20px]">📖</div>}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] tracking-[0.14em] uppercase text-[#a78bfa] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Selected Deck</div>
                  <div className="text-[14px] text-[rgba(225,215,255,.9)] leading-[1.3]">{deck.name}</div>
                  <div className="text-[11px] italic text-[rgba(180,160,220,.42)] mt-[4px]" style={{ fontFamily: "'IM Fell English', serif" }}>{deck.category || 'Oracle'}</div>
                </div>
              </div>
            )}

            <div className="mx-[18px] p-[17px] bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] flex flex-col gap-[16px] mb-[24px]">
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(180,160,220,.42)] mb-[8px]" style={{ fontFamily: "'Cinzel', serif" }}>Your Intent</div>
                <textarea 
                  className="w-full bg-[#160f2a] border border-[rgba(160,120,255,.16)] rounded-[10px] p-[14px] text-[16px] text-[rgba(225,215,255,.9)] font-serif resize-none outline-none min-h-[90px] leading-[1.5] transition-colors focus:border-[rgba(167,139,250,.45)] placeholder:text-[rgba(180,160,220,.3)]"
                  placeholder="What guidance do you seek?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(180,160,220,.42)] mb-[8px]" style={{ fontFamily: "'Cinzel', serif" }}>Spread Selection</div>
                <div className="relative">
                  <select 
                    className="w-full bg-[#160f2a] border border-[rgba(160,120,255,.16)] rounded-[10px] py-[13px] px-[14px] text-[15px] text-[rgba(225,215,255,.9)] font-serif outline-none cursor-pointer appearance-none transition-colors focus:border-[rgba(167,139,250,.45)]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23a78bfa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center'
                    }}
                    value={selectedSpreadId}
                    onChange={(e) => setSelectedSpreadId(e.target.value)}
                  >
                    {BUILT_IN_SPREADS.map(spread => (
                      <option key={spread.id} value={spread.id}>
                        {spread.name} — {spread.positions.length} card{spread.positions.length !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-[18px] mt-auto pb-[20px]">
              <button 
                onClick={handleDrawCards}
                disabled={isDrawing || cards.length === 0}
                className="w-full p-[16px] rounded-full border-none cursor-pointer text-[13px] tracking-[0.18em] uppercase text-white flex items-center justify-center gap-[10px] transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: 'linear-gradient(135deg,#6d28d9,#7c3aed,#a78bfa)', 
                  boxShadow: '0 6px 24px rgba(124,58,237,.35)',
                  fontFamily: "'Cinzel', serif"
                }}
              >
                ✦ Channel Cards
              </button>
              <div className="text-center italic text-[11px] text-[rgba(160,140,200,.3)] mt-[14px]" style={{ fontFamily: "'Crimson Text', serif" }}>
                {cards.length} cards available in this deck.
              </div>
            </div>
          </div>
        )}

        {/* Shuffling State */}
        {isDrawing && (
          <div className="flex-1 flex flex-col items-center justify-center px-[18px] pt-[20px]">
            <div className="w-full bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[18px] overflow-hidden">
              {!disableHeavyAnimations && deck?.shuffle_animation_url && (
                <div className="relative w-full aspect-square border-b border-[rgba(160,120,255,.16)]">
                  <ShuffleAnimation
                    url={deck.shuffle_animation_url}
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b1e] to-transparent" />
                </div>
              )}

              <div className="p-[20px] text-center flex flex-col items-center">
                <Sparkles className="w-8 h-8 text-[#a78bfa] mb-[12px] animate-pulse" />
                <div className="text-[12px] tracking-[0.14em] uppercase text-[rgba(225,215,255,.9)] mb-[8px]" style={{ fontFamily: "'Cinzel', serif" }}>
                  Channeling Energies
                </div>
                <div className="text-[13px] italic text-[rgba(180,160,220,.6)] leading-[1.5]" style={{ fontFamily: "'IM Fell English', serif" }}>
                  The cards are aligning to your intent...
                </div>
                
                <div className="w-[180px] h-[180px] mx-auto mt-[20px] rounded-full border border-[rgba(160,120,255,.16)] bg-[#160f2a] overflow-hidden relative" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                  <IdeomotorCanvas
                    question={question || "Focus on your intent..."}
                    onComplete={() => {}}
                    autoCompleteAfter={2500}
                    showInstructions={true}
                    instructionText="Doodle to focus intent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display for Drawn Cards */}
        {!viewerCard && drawnCards.length > 0 && (
          <div className="w-full">
            <style>{`
              @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
              @keyframes moonGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.85; } }
              @keyframes cardReveal { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <div className="flex items-center justify-between px-[18px] py-[13px]">
              <div>
                <div 
                  className="text-[14px] tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#c8a8ff] via-[#fff] to-[#a0c8ff]"
                  style={{ fontFamily: "'Cinzel', serif", backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}
                >
                  {deck?.name || 'Reading'}
                </div>
                <div className="mt-[2px] text-[12px] italic text-[rgba(180,160,220,.42)]" style={{ fontFamily: "'IM Fell English', serif" }}>
                  {selectedSpread?.name}
                </div>
              </div>
              <div className="flex gap-[6px]">
                <button 
                  className="px-[11px] py-[7px] rounded-full border border-[rgba(160,120,255,.3)] bg-[#160f2a] text-[rgba(225,215,255,.9)] text-[8px] tracking-[0.1em] uppercase cursor-pointer flex items-center gap-[4px] transition-all hover:border-[#a78bfa] hover:text-[#a78bfa]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                >
                  ↺ New
                </button>
                <button 
                  className="px-[11px] py-[7px] rounded-full border border-[rgba(52,211,153,.3)] bg-[rgba(52,211,153,.1)] text-[#34d399] text-[8px] tracking-[0.1em] uppercase cursor-pointer flex items-center gap-[4px] transition-all hover:border-[#a78bfa] hover:text-[#a78bfa]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                  onClick={handleSaveReading}
                >
                  ⬡ Save
                </button>
                <button 
                  className="px-[11px] py-[7px] rounded-full border border-[rgba(160,120,255,.3)] bg-[#160f2a] text-[rgba(225,215,255,.9)] text-[8px] tracking-[0.1em] uppercase cursor-pointer flex items-center gap-[4px] transition-all hover:border-[#a78bfa] hover:text-[#a78bfa]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                  onClick={() => setShowShareModal(true)}
                >
                  ↑ Share
                </button>
              </div>
            </div>

            <div className="relative mx-[14px] rounded-[18px] overflow-hidden border border-[rgba(160,120,255,.16)] min-h-[270px] flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#0d0822,#1a0f35,#0a0618)' }}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-[310px] h-[310px] rounded-full opacity-[0.6] mix-blend-screen" style={{ background: 'radial-gradient(circle,rgba(167,139,250,.05),transparent 70%)', animation: 'moonGlow 6s 1s ease-in-out infinite' }} />
                <div className="w-[230px] h-[230px] rounded-full border border-[rgba(201,168,76,.08)] opacity-[0.6]" style={{ background: 'radial-gradient(circle at 40% 35%,rgba(201,168,76,.15),rgba(120,80,200,.07) 55%,transparent 75%)', animation: 'moonGlow 5s ease-in-out infinite' }} />
              </div>
              <div className="relative z-10 flex flex-wrap items-end justify-center gap-[10px] w-full px-[14px] pt-[26px] pb-[22px]">
                {drawnCards.map((c, i) => (
                  <div 
                    key={i} 
                    className="flex-1 max-w-[108px] flex flex-col items-center gap-[7px] cursor-pointer"
                    style={{ animation: `cardReveal 0.5s ease ${i * 0.18}s both` }}
                    onClick={() => handleCardClick(c, i)}
                  >
                    <div className="w-full aspect-[2/3] rounded-[10px] border-[1.5px] border-[rgba(167,139,250,.3)] flex items-center justify-center text-[28px] overflow-hidden relative group hover:border-[rgba(167,139,250,.6)] hover:shadow-[0_8px_28px_rgba(0,0,0,.6),0_0_28px_rgba(100,50,200,.3)] transition-all duration-200" style={{ background: 'linear-gradient(135deg,#1e1438,#0d0822)', boxShadow: '0 6px 20px rgba(0,0,0,.5),0 0 18px rgba(100,50,200,.18)' }}>
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="w-full h-full object-cover rounded-[8px]" />
                      ) : (
                        <span>{c.icon || '✨'}</span>
                      )}
                      <div className="absolute inset-0 rounded-[8px] pointer-events-none" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,.07) 0%,transparent 50%)' }} />
                    </div>
                    <div className="text-[7.5px] tracking-[0.1em] uppercase text-[rgba(220,210,255,.8)] text-center leading-[1.3]" style={{ fontFamily: "'Cinzel', serif" }}>{c.name}</div>
                    <div className="text-[7px] tracking-[0.1em] uppercase py-[3px] px-[8px] rounded-full bg-[rgba(167,139,250,.12)] border border-[rgba(167,139,250,.25)] text-[#a78bfa]" style={{ fontFamily: "'Cinzel', serif" }}>{i+1}. {c.position || 'Card'}</div>
                    <div className="text-[10px] italic text-[rgba(180,160,220,.42)] text-center leading-[1.3]" style={{ fontFamily: "'IM Fell English', serif" }}>{c.position_meaning || ''}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center italic text-[11px] text-[rgba(167,139,250,.3)] py-[4px] pb-[8px]" style={{ fontFamily: "'IM Fell English', serif" }}>Tap a card to explore its meaning</div>

            <div className="px-[18px] pt-[4px]">
              <button 
                className="w-full p-[13px] px-[17px] rounded-[13px] border-none cursor-pointer flex items-center gap-[11px] mb-[9px] transition-all hover:-translate-y-[2px] active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)', boxShadow: '0 4px 20px rgba(109,40,217,.4)', color: '#fff', fontFamily: "'Cinzel', serif" }}
                onClick={() => setShowAI(true)}
              >
                <span className="text-[17px] shrink-0">✦</span>
                <div className="text-left">
                  <div className="text-[12px] tracking-[0.12em] uppercase">Unlock Deep Insight</div>
                  <div className="italic text-[11px] opacity-[0.65] mt-[1px]" style={{ fontFamily: "'IM Fell English', serif" }}>AI-powered interpretation of your reading</div>
                </div>
              </button>
              
              <button 
                className="w-full p-[13px] px-[17px] rounded-[13px] cursor-pointer flex items-center gap-[11px] mb-[9px] transition-all hover:-translate-y-[2px] active:scale-[0.97]"
                style={{ background: 'rgba(6,182,212,.08)', border: '1px solid rgba(103,232,249,.25)', color: '#67e8f9', boxShadow: '0 3px 14px rgba(6,182,212,.1)', fontFamily: "'Cinzel', serif" }}
                onClick={() => setShowStructuredReading(true)}
              >
                <span className="text-[17px] shrink-0">📖</span>
                <div className="text-left">
                  <div className="text-[12px] tracking-[0.12em] uppercase">Structured Reading</div>
                  <div className="italic text-[11px] opacity-[0.65] mt-[1px]" style={{ fontFamily: "'IM Fell English', serif" }}>Deterministic rules-based interpretation</div>
                </div>
              </button>
            </div>

            <div className="mx-[18px] mt-[4px]">
              <div className="flex items-center gap-[10px] py-[10px] pb-[11px]">
                <div className="text-[8.5px] tracking-[0.12em] uppercase px-[12px] py-[5px] rounded-full bg-[rgba(167,139,250,.12)] border border-[rgba(167,139,250,.28)] text-[#a78bfa] flex items-center gap-[5px]" style={{ fontFamily: "'Cinzel', serif" }}>
                  ✦ Card Relationships
                </div>
                <div className="text-[14px] text-[rgba(180,160,220,.42)]" style={{ fontFamily: "'Crimson Text', serif" }}>Discover connections</div>
              </div>
              <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] overflow-hidden">
                <div className="p-[13px] px-[15px] flex items-center justify-between border-b border-[rgba(160,120,255,.16)]">
                  <div className="text-[12px] tracking-[0.08em] text-white flex items-center gap-[7px]" style={{ fontFamily: "'Cinzel', serif" }}>⬡ Connections</div>
                  <div className="flex gap-[6px]">
                    <button className="text-[7.5px] tracking-[0.09em] uppercase px-[10px] py-[5px] rounded-full border border-[rgba(160,120,255,.3)] bg-[#160f2a] text-[rgba(225,215,255,.9)] cursor-pointer flex items-center gap-[3px] transition-colors hover:border-[#a78bfa] hover:text-[#a78bfa]" style={{ fontFamily: "'Cinzel', serif" }} onClick={() => setShowRelationshipsOverlay(true)}>✦ Auto</button>
                  </div>
                </div>
                <div className="p-[18px] px-[15px] text-center italic text-[13px] text-[rgba(180,160,220,.42)] leading-[1.6]" style={{ fontFamily: "'IM Fell English', serif" }}>
                  Click "Auto" to detect visual or thematic similarities across drawn cards.
                </div>
              </div>
            </div>
            
            <div className="text-center italic text-[11px] text-[rgba(160,140,200,.3)] py-[14px]" style={{ fontFamily: "'Crimson Text', serif" }}>Readings are for entertainment purposes only.</div>
            
            {/* AI Reading Section */}
            {typeof document !== 'undefined' ? createPortal(
              <AIReading
                isOpen={showAI}
                drawnCards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
                deck={deck}
                spread={selectedSpread}
                question={question}
                onClose={() => setShowAI(false)}
                onInterpretationReady={(text) => setAudioText(text)}
              />,
              document.body
            ) : null}

            {/* Structured Reading Modal */}
            {typeof document !== 'undefined' ? createPortal(
              <StructuredReading
                isOpen={showStructuredReading}
                drawnCards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
                deck={deck}
                spread={selectedSpread}
                onClose={() => setShowStructuredReading(false)}
              />,
              document.body
            ) : null}
          </div>
        )}
        
        {/* Display for Selected Card Details (Screen 3) */}
        {viewerCard && (
          <div className="w-full pt-[18px] pb-[10px]">
            <div className="w-[170px] mx-auto aspect-[2/3] rounded-[16px] border-[2px] border-[rgba(167,139,250,.38)] flex items-center justify-center text-[56px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1e1438,#0d0822)', boxShadow: '0 12px 38px rgba(0,0,0,.6),0 0 38px rgba(100,50,200,.22)' }}>
              {viewerCard.card?.image_url ? (
                <img src={viewerCard.card.image_url} alt={viewerCard.card.name} className="w-full h-full object-cover" />
              ) : (
                <span>{viewerCard.card?.icon || '🌙'}</span>
              )}
            </div>
            
            <div className="text-center px-4">
              <div 
                className="text-[19px] tracking-[0.12em] uppercase text-center mt-[16px] mb-[4px] text-transparent bg-clip-text bg-gradient-to-r from-[#c8a8ff] via-[#fff] to-[#a0c8ff]"
                style={{ fontFamily: "'Cinzel', serif", backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}
              >
                {viewerCard.card?.name || 'Unknown Card'}
              </div>
              <div className="text-[9px] tracking-[0.14em] uppercase py-[4px] px-[13px] rounded-full bg-[rgba(167,139,250,.12)] border border-[rgba(167,139,250,.28)] text-[#a78bfa] inline-block mb-[16px]" style={{ fontFamily: "'Cinzel', serif" }}>
                {viewerCard.position || 'Selected'}
              </div>
            </div>

            <div className="px-[18px] flex flex-col gap-[11px]">
              {viewerCard.card?.upright_meaning && (
                <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] p-[15px]">
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(180,160,220,.42)] mb-[7px] flex items-center gap-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>↑ Upright</div>
                  <div className="text-[16px] text-[rgba(225,215,255,.9)] leading-[1.65]" style={{ fontFamily: "'Crimson Text', serif" }}>{viewerCard.card.upright_meaning}</div>
                  {viewerCard.card?.upright_insight && (
                    <div className="italic text-[14px] text-[rgba(200,180,255,.6)] mt-[7px] leading-[1.55]" style={{ fontFamily: "'IM Fell English', serif" }}>{viewerCard.card.upright_insight}</div>
                  )}
                  {viewerCard.card?.upright_action && (
                    <div className="mt-[9px] p-[9px] px-[12px] rounded-[9px] bg-[rgba(167,139,250,.07)] border border-[rgba(167,139,250,.14)] text-[14px] text-[rgba(225,215,255,.9)] leading-[1.55]" style={{ fontFamily: "'Crimson Text', serif" }}>
                      ✦ {viewerCard.card.upright_action}
                    </div>
                  )}
                </div>
              )}

              {viewerCard.card?.reversed_meaning && (
                <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] p-[15px]">
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(180,160,220,.42)] mb-[7px] flex items-center gap-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>↓ Reversed</div>
                  <div className="text-[16px] text-[rgba(225,215,255,.9)] leading-[1.65]" style={{ fontFamily: "'Crimson Text', serif" }}>{viewerCard.card.reversed_meaning}</div>
                </div>
              )}

              {viewerCard.card?.keywords && viewerCard.card.keywords.length > 0 && (
                <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] p-[15px]">
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(180,160,220,.42)] mb-[7px] flex items-center gap-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>◈ Keywords</div>
                  <div className="flex flex-wrap gap-[6px] mt-[9px]">
                    {viewerCard.card.keywords.map((kw, i) => (
                      <span key={i} className="text-[7.5px] tracking-[0.09em] uppercase py-[4px] px-[10px] rounded-full bg-[rgba(167,139,250,.09)] border border-[rgba(167,139,250,.18)] text-[rgba(200,180,255,.65)]" style={{ fontFamily: "'Cinzel', serif" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewerCard.card?.ancient_wisdom && (
                <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] p-[15px]">
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(180,160,220,.42)] mb-[7px] flex items-center gap-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>🌙 Ancient Wisdom</div>
                  <div className="italic text-[15px] text-[rgba(225,215,255,.9)]" style={{ fontFamily: "'Crimson Text', serif" }}>{viewerCard.card.ancient_wisdom}</div>
                </div>
              )}

              <button 
                className="w-full mt-2 p-[13px] rounded-full border border-[rgba(160,120,255,.3)] bg-[rgba(160,120,255,.1)] text-[rgba(225,215,255,.9)] text-[11.5px] tracking-[0.18em] uppercase cursor-pointer transition-all hover:bg-[rgba(160,120,255,.2)]"
                style={{ fontFamily: "'Cinzel', serif" }}
                onClick={() => setViewerCard(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        )}

        {/* No Cards Message */}
        {!isLoading && cards.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
            <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Cards Available</h3>
            <p className="text-purple-200">This deck doesn't have any cards yet.</p>
            <p className="text-purple-300 text-sm mt-2">Deck ID: {deckIdFromUrl}</p>
          </div>
        )}
      </div>

      {/* Relationships Overlay */}
      {showRelationshipsOverlay && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="relative max-w-6xl mx-auto bg-slate-900 rounded-xl border border-purple-500/30 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Card Relationships</h3>
              <button onClick={() => setShowRelationshipsOverlay(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CardRelationshipVisualizer deckId={deck.id} cards={drawnCards} selectedCards={drawnCards} />
          </div>
        </div>,
        document.body
      ) : null}

{/* Compact view only: removed overlay */}

       {/* Enhanced Card Viewer Modal - MOVED TO TOP LEVEL WITH HIGHER Z-INDEX */}
      {viewerCard && showEnhancedViewer && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[9999]">
          <EnhancedCardViewer
            card={viewerCard.card}
            position={viewerCard.position}
            isReversed={viewerCard.isReversed}
            relatedCards={viewerCard.relatedCards}
            isOpen={showEnhancedViewer}
            onClose={() => {
              console.log('🚪 Closing EnhancedCardViewer');
              setShowEnhancedViewer(false);
              setViewerCard(null);
            }}
          />
        </div>,
        document.body
      ) : null}

      {/* Session Manager Modal */}
      {typeof document !== 'undefined' ? createPortal(
        <ReadingSessionManager
          isOpen={showSessionManager}
          onClose={() => setShowSessionManager(false)}
          deckId={deck?.id}
          deckName={deck?.name}
          spreadType={selectedSpread?.name}
          question={question}
          drawnCards={drawnCards}
          interpretation={sessionNotes}
          onSaved={handleSessionSaved}
        />,
        document.body
      ) : null}
      </div>
      <AudioOrb 
        textToSpeak={audioText} 
        autoPlay={!!audioText} 
        variant="mat"
        onComplete={() => console.log('Audio orb playback complete')} 
      />
      <ReadingShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reading={{
          title: question ? `Reading: ${question}` : "My Reading",
          deck_id: deck?.id,
          interpretation: sessionNotes
        }}
        deckName={deck?.name}
        spreadName={selectedSpread?.name}
        drawnCards={drawnCards}
        question={question}
      />
      </>
      );
}