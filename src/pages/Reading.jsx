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
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">Loading deck...</p>
        </div>
      </div>
    );
  }



  // If no deck chosen, show an in-page deck picker
  if (!deckIdFromUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 text-white">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="text-purple-200">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold">Choose a deck</h1>
              <p className="text-purple-300 text-sm mt-1">Pick a deck to start your reading</p>
            </div>
            <div className="w-[84px]" />
          </div>

          {pickerLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-10">
              {pickerDecks.myDecks?.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">My Decks</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {pickerDecks.myDecks.map((d) => (
                      <div key={d.id} className="group">
                        <Button asChild variant="ghost" className="p-0 h-auto">
                          <Link to={createPageUrl(`Reading?deckId=${d.id}`)}>
                            <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 hover:border-purple-400/60 transition">
                            {d.cover_image ? (
                              <img src={d.cover_image} alt={d.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40">
                                <BookOpen className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                        </Link>
                        </Button>
                        <div className="mt-2 text-sm truncate">{d.name}</div>
                        <Button asChild size="sm" className="mt-2 w-full bg-purple-600 hover:bg-purple-700">
                          <Link to={createPageUrl(`Reading?deckId=${d.id}`)}>Use Deck</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-3">Official Decks</h2>
                {pickerDecks.publicDecks?.length === 0 ? (
                  <div className="text-white/70 text-sm">No public decks available.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {pickerDecks.publicDecks.map((d) => (
                      <div key={d.id} className="group">
                        <Button asChild variant="ghost" className="p-0 h-auto">
                          <Link to={createPageUrl(`Reading?deckId=${d.id}`)}>
                            <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 hover:border-purple-400/60 transition">
                            {d.cover_image ? (
                              <img src={d.cover_image} alt={d.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40">
                                <BookOpen className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                        </Link>
                        </Button>
                        <div className="mt-2 text-sm truncate">{d.name}</div>
                        <Button asChild size="sm" className="mt-2 w-full bg-purple-600 hover:bg-purple-700">
                          <Link to={createPageUrl(`Reading?deckId=${d.id}`)}>Use Deck</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && !deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-200 mb-4">{error}</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-red-500 text-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DisablePullToRefresh targetSelector="main" threshold={30} />
      <div className="min-h-screen pb-32 md:pb-24 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
      {/* Exit button (hidden/disabled when overlays open) */}
      <div className={`fixed top-3 left-3 md:hidden z-[100] ${showEnhancedViewer || showRelationshipsOverlay || showCompactSpreadOverlay || showSessionManager ? 'pointer-events-none opacity-60' : 'pointer-events-auto'}`}>
        <Link to={createPageUrl("Dashboard")}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { navigate(createPageUrl('Dashboard')); }}
            className="bg-black/60 text-white border-white/30 hover:bg-black/80"
            disabled={showEnhancedViewer || showRelationshipsOverlay || showCompactSpreadOverlay || showSessionManager}
          >
            Exit
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-6 relative z-50">
          <Button asChild variant="ghost" className="text-purple-200">
            <Link to={createPageUrl("Dashboard")}> 
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          
          {deck && deck?.name?.toLowerCase().includes('rooted crescent') ? (
            <div className="text-center flex-1">
              <h1 
                className="text-xl md:text-3xl font-bold uppercase tracking-[0.1em] mx-auto"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: "linear-gradient(90deg, #c8a8ff, #fff, #a0c8ff)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 4s linear infinite",
                  maxWidth: "300px"
                }}
              >
                {deck.name}
              </h1>
              <p className="mt-1" style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "rgba(180,160,220,0.6)" }}>
                {selectedSpread?.name}
              </p>
            </div>
          ) : deck && (
            <div className="text-center flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-white">{deck.name}</h1>
            </div>
          )}

          {/* NEW: Debug Toggle Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Bug className="w-4 h-4" />
          </Button>
        </div>

        {/* NEW: Debug Panel - Mobile Friendly */}
        {showDebugPanel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cyan-900/20 border-2 border-cyan-500/50 rounded-xl p-4 text-xs space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-cyan-300" />
                <span className="font-bold text-cyan-200 text-sm">Debug Panel</span>
              </div>
              <button onClick={() => setShowDebugPanel(false)} className="text-cyan-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black/30 rounded p-3 space-y-2 text-cyan-100">
              <div className="font-semibold text-cyan-200">📦 Data Loaded:</div>
              <div>• Deck: {deck?.name || '❌ Not loaded'}</div>
              <div>• Cards in deck: {cards?.length || 0}</div>
              <div>• Selected spread: {selectedSpread?.name}</div>
              <div>• Spread positions: {selectedSpread?.positions?.length || 0}</div>
            </div>

            {drawnCards.length > 0 && (
              <div className="bg-black/30 rounded p-3 space-y-2 text-cyan-100">
                <div className="font-semibold text-cyan-200">🎴 Drawn Cards:</div>
                <div>• Total drawn: {drawnCards.length}</div>
                <div>• Cards with data: {drawnCards.filter(c => c && c.name).length}</div>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {drawnCards.map((card, idx) => (
                    <div key={idx} className="text-[10px] border-l-2 border-cyan-500/30 pl-2">
                      {idx + 1}. {card?.name || '❌ No name'} 
                      {card?.position && ` (${card.position})`}
                      {card?.image_url ? ' ✅ Has image' : ' ⚠️ No image'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-black/30 rounded p-3 space-y-2 text-cyan-100">
              <div className="font-semibold text-cyan-200">🔍 Component State:</div>
              <div>• isLoading: {isLoading ? '⏳ Yes' : '✅ No'}</div>
              <div>• isDrawing: {isDrawing ? '⏳ Yes' : '✅ No'}</div>
              <div>• showAI: {showAI ? '✅ Yes' : '❌ No'}</div>
              <div>• Error: {error || '✅ None'}</div>
            </div>

            <div className="text-cyan-300 text-[10px] italic">
              💡 If cards show here but not on screen, the issue is in SpreadLayout rendering
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-300">✕</button>
          </div>
        )}

        {/* Doodle Canvas During Drawing */}
        {isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-6"
          >
            <div className="rounded-xl border border-purple-400/40 overflow-hidden bg-black/30">
              {!disableHeavyAnimations && deck?.shuffle_animation_url && (
                <div className="relative w-full h-[320px] md:h-[420px]">
                  <ShuffleAnimation
                    url={deck.shuffle_animation_url}
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="px-4 md:px-6 py-4">
                <h3 className="text-center text-purple-200 mb-4 font-semibold">
                  ✨ Channeling cosmic energy while shuffling...
                </h3>
                <div className="mx-auto w-full max-w-sm">
                  <IdeomotorCanvas
                    question={question || "What guidance do you seek?"}
                    onComplete={() => {}}
                    autoCompleteAfter={2500}
                    showInstructions={true}
                    instructionText="Draw or doodle while the cards are being shuffled"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Question & Spread Selection (when no cards drawn) */}
        {!drawnCards.length && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-6"
          >
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Your Question</Label>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What guidance do you seek?"
                  className="bg-black/30 border-white/20 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">
                  Spread
                  {spreadsLoading && <span className="text-xs text-purple-300 ml-2">(Loading custom spreads...)</span>}
                </Label>
                <Select value={selectedSpreadId} onValueChange={setSelectedSpreadId}>
                  <SelectTrigger className="bg-black/30 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white max-h-[400px] overflow-y-auto">
                    {BUILT_IN_SPREADS.map(spread => (
                      <SelectItem key={spread.id} value={spread.id}>
                        {spread.name} - {spread.positions.length} cards
                      </SelectItem>
                    ))}
                    

                  </SelectContent>
                </Select>
                
 
              </div>

              <Button
                onClick={handleDrawCards}
                disabled={isDrawing || cards.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
              >
                {isDrawing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Drawing...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-5 h-5 mr-2" />
                    Draw Cards {cards.length > 0 && `(${cards.length} available)`}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Display for Drawn Cards */}
        {drawnCards.length > 0 && (
          <div className="space-y-6">
            {/* Compact preview removed — using a single main compact view */}

             {/* Enhanced Spread Visualization */}
             <div className="bg-white/5 border border-white/10 rounded-xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                   Your Reading
                 </h2>
                 <div className="flex gap-2 flex-wrap justify-end">
                   {/* Compact-only: removed view toggle */}
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => {
                       console.log('🔄 Clearing drawn cards');
                       setDrawnCards([]);
                     }}
                     className="border-white/20 text-white hover:bg-white/10"
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     New Reading
                   </Button>
                   <Button
                     size="sm"
                     onClick={handleSaveReading}
                     className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                   >
                     <Save className="w-4 h-4 mr-2" />
                     Save Session
                   </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => setShowShareModal(true)}
                     className="border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
                   >
                     <Share2 className="w-4 h-4 mr-2" />
                     Share
                   </Button>
                   <Button
                       size="sm"
                       variant="outline"
                       onClick={() => setShowRelationshipsOverlay(true)}
                       className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                     >
                       <Sparkles className="w-4 h-4 mr-2" />
                       Relationships
                     </Button>
                     {/* Compact-only: removed extra overlay button */}
                     {selectedSpread?.isCustom && selectedSpread?.id ? (
                       <Link to={createPageUrl(`SpreadDesigner?id=${selectedSpread.id}`)}>
                         <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">
                           Edit Spread
                         </Button>
                       </Link>
                     ) : (
                       <Link to={createPageUrl('SpreadManager')}>
                         <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">
                           Edit Spread
                         </Button>
                       </Link>
                     )}
                 </div>
               </div>

               {selectedSpread?.isCustom && (
                 <div className="mb-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-200">
                   <div className="font-semibold mb-1">Custom Spread: {selectedSpread.name}</div>
                   <div className="text-cyan-300/80">
                     {selectedSpread.positions.length} positions • 
                     {selectedSpread.positions.filter(p => typeof p.x === 'number').length} with coordinates
                   </div>
                 </div>
               )}

               <div className="mt-2">
                 {deck?.name?.toLowerCase().includes('rooted crescent') ? (
                   <RootedCrescentStage 
                     spread={selectedSpread}
                     positions={readingPositions}
                     cards={placedCards}
                     deck={deck}
                     onCardClick={handleCardClick}
                     revealedCards={revealedCards}
                   />
                 ) : (
                  <CompactSpread
                    spread={selectedSpread}
                    positions={readingPositions}
                    cards={placedCards}
                    deck={deck}
                    viewMode={viewMode}
                    revealedCards={revealedCards}
                    onCardClick={handleCardClick}
                    onCardReveal={handleCardReveal}
                  />
                 )}
                </div>

               </div>

            {/* Session Notes - Quick Input */}
            {!disableHeavyAnimations && (
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">

              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-300" />
                <h3 className="text-xl font-bold text-purple-300">Session Notes</h3>
              </div>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Jot down your thoughts, feelings, and insights as you go through this reading..."
                className="min-h-[120px] bg-slate-900/80 border-purple-500/30 text-white"
              />
              <p className="text-xs text-purple-300/70 mt-2">
                💡 These notes will be saved with your reading session
              </p>
            </div>
            )}

            {/* Reference manual link */}
            {deck?.name === 'Rooted Crescent Oracle Deck' && (
              <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-sm mb-3">
                <a
                  href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/63b9fd985_agentcosmicchronicles.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:underline"
                >
                  Reference: Rooted Crescent Oracle Knowledge
                </a>
              </div>
            )}

            {/* AI Insight Button */}
            {!showAI && !showStructuredReading && deck?.name?.toLowerCase().includes('rooted crescent') ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center px-4"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <button
                  onClick={() => setShowAI(true)}
                  className="w-full max-w-[280px] p-4 rounded-[13px] border-none cursor-pointer flex items-center justify-center gap-3 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(135deg, #5b21b6, #7c3aed, #a78bfa)",
                    boxShadow: "0 4px 22px rgba(124,58,237,0.4)",
                    color: "#fff"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <span className="text-lg shrink-0">✦</span>
                  <div className="text-left">
                    <div className="text-[13px] tracking-[0.12em] uppercase font-bold">Unlock Deep Insight</div>
                    <div className="text-[11px] opacity-75 mt-0.5" style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>
                      AI-powered interpretation
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShowStructuredReading(true)}
                  className="w-full max-w-[280px] p-4 rounded-[13px] cursor-pointer flex items-center justify-center gap-3 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(103,232,249,0.08))",
                    border: "1px solid rgba(103,232,249,0.3)",
                    color: "#67e8f9",
                    boxShadow: "0 4px 16px rgba(6,182,212,0.15)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <span className="text-lg shrink-0">📖</span>
                  <div className="text-left">
                    <div className="text-[13px] tracking-[0.12em] uppercase font-bold">Structured Reading</div>
                    <div className="text-[11px] opacity-65 mt-0.5" style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>
                      Rules-based interpretation
                    </div>
                  </div>
                </button>
              </motion.div>
            ) : !showAI && !showStructuredReading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center"
              >
                <div className="flex flex-col items-center">
                  <Button
                    onClick={() => setShowAI(true)}
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-6 px-8 text-lg shadow-lg shadow-purple-500/50 w-full sm:w-auto"
                  >
                    <Sparkles className="w-6 h-6 mr-3" />
                    Unlock Deep Insight
                    <Sparkles className="w-6 h-6 ml-3" />
                  </Button>
                  <p className="text-purple-300 text-sm mt-3">
                    Get AI-powered interpretation of your reading
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <Button
                    onClick={() => setShowStructuredReading(true)}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 px-8 text-lg shadow-lg shadow-cyan-500/50 w-full sm:w-auto"
                  >
                    <BookOpen className="w-6 h-6 mr-3" />
                    Structured Reading
                  </Button>
                  <p className="text-cyan-300 text-sm mt-3">
                    Deterministic rules-based interpretation
                  </p>
                </div>
              </motion.div>
            )}

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

            {/* Card Relationships Section */}
            {(placedCards.filter(Boolean).length >= 2 || drawnCards.length >= 2) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-purple-600/80 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Card Relationships
                  </Badge>
                  <span className="text-purple-200 text-sm">
                    Discover connections in your reading
                  </span>
                </div>
                
                <CardRelationshipVisualizer
                  deckId={deck.id}
                  cards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
                  selectedCards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
                />
              </div>
            )}
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
      <div className="mt-8 text-center text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg p-3">
        Disclaimer: The readings and guidance provided are for entertainment purposes only and do not constitute professional advice.
      </div>
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