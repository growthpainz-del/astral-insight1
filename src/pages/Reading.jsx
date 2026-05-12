import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
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
} from "lucide-react";

// Import components
import AIReading from "@/components/reading/AIReading";
import IdeomotorCanvas from "@/components/reading/IdeomotorCanvas";
import SpreadLayout from "@/components/reading/SpreadLayout";
import CompactSpread from "@/components/reading/CompactSpread";
import { queueApiCall } from "@/components/utils/apiQueue";
import CardRelationshipVisualizer from "@/components/deck/CardRelationshipVisualizer";
import { Badge } from "@/components/ui/badge";
import ReadingSessionManager from "@/components/reading/ReadingSessionManager";
import EnhancedCardViewer from "@/components/reading/EnhancedCardViewer";
import DisablePullToRefresh from "@/components/common/DisablePullToRefresh";
import ShuffleAnimation from "@/components/reading/ShuffleAnimation";
import DidAgentEmbed from "@/components/integrations/DidAgentEmbed";
import VoiceAvatarBubble from "@/components/avatar/VoiceAvatarBubble";

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
  
  const sp = new URLSearchParams(location.search);
  const [selectedSpreadId, setSelectedSpreadId] = useState(sp.get("spread") || "three_card");
  const [question, setQuestion] = useState(sp.get("question") || "");
  const [autoDrawn, setAutoDrawn] = useState(false);
  // Cards in the "bottom shelf" waiting area
  const [drawnCards, setDrawnCards] = useState([]);
  // Cards assigned to spread positions (index-aligned with readingPositions)
  const [placedCards, setPlacedCards] = useState([]);
  // Derived: cards still available to place
  // (shelf disabled)
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");

  const [showSessionManager, setShowSessionManager] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showEnhancedViewer, setShowEnhancedViewer] = useState(false);
  const [viewerCard, setViewerCard] = useState(null);
  const [showRelationshipsOverlay, setShowRelationshipsOverlay] = useState(false);
const [showCompactSpreadOverlay, setShowCompactSpreadOverlay] = useState(false);

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
      try {
        setIsLoading(true);
        
        const [currentUser, loadedDeck, deckCards] = await Promise.all([
          queueApiCall(() => base44.auth.me(), 3, 1000),
          queueApiCall(() => base44.entities.Deck.get(deckIdFromUrl), 3, 1000),
          queueApiCall(() => base44.entities.Card.filter({ deck_id: deckIdFromUrl }), 3, 1000)
        ]);

        if (cancelled) return;

        
        setUser(currentUser);
        setDeck(loadedDeck);
        setCards(deckCards || []);
        setError("");
        

        
      } catch (err) {
        if (cancelled) return;
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
    
    if (!cards.length || !selectedSpread) {
      setError("Cannot draw cards. Deck has no cards.");
      return;
    }

    setIsDrawing(true);
    
    const shuffled = [...cards].sort(() => Math.random() - 0.5); // Single shuffle per reading

    const positionsCount = selectedSpread.positions.length;



    // Default (other spreads): draw exactly as many as positions
    const drawn = selectedSpread.positions.map((position, idx) => {
      const card = shuffled[idx];
      if (!card) {
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

    const shuffleDurationMs = disableHeavyAnimations ? 2500 : (deck?.shuffle_animation_url ? 8000 : 3000);
    setTimeout(() => {
      setDrawnCards(drawn);
      setPlacedCards(drawn);
      setRevealedCards(new Set());
      setIsDrawing(false);
    }, shuffleDurationMs);
  };

  useEffect(() => {
    if (sp.has("spread") && cards.length > 0 && selectedSpread && !autoDrawn && drawnCards.length === 0 && !isDrawing) {
      setAutoDrawn(true);
      handleDrawCards();
    }
  }, [cards.length, selectedSpread, autoDrawn, drawnCards.length, isDrawing]);

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
    setShowSessionManager(false);
  };

  const handleCardClick = (drawnCard, cardIndex) => {
    
    // Choose active set for relations/viewer context
    const activeCards = (placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean);

    // The drawnCard already contains all card data since we spread {...card} when drawing
    // We should find it in the `cards` array to ensure we have the most complete original card data.
    // `drawnCard.id` contains the original ID of the card.
    const fullCard = cards.find(c => c.id === drawnCard.id);
    
    
    if (drawnCard) {
      setViewerCard({
        card: fullCard || drawnCard, // Use fullCard if found, otherwise use drawnCard itself (it's already enriched)
        position: drawnCard.position,
        isReversed: drawnCard.isReversed,
        relatedCards: activeCards.filter(dc => dc.id !== drawnCard.id)
      });
      setShowEnhancedViewer(true);
    } else {
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
            <Link to={createPageUrl("CosmicHub")}>
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
          <Link to={createPageUrl("CosmicHub")}>
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
      {/* Top Navigation Bar (replaces old Back/Exit buttons) */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-[17px] py-[11px] bg-[#07050f]/95 border-b border-[#a078ff]/15 backdrop-blur-[16px] -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6">
        <button onClick={() => navigate(createPageUrl("ReadingRoom"))} className="font-['Cinzel'] text-[10px] tracking-[0.14em] uppercase text-purple-200/70 flex items-center gap-[5px] cursor-pointer transition-colors bg-transparent border-none hover:text-purple-400">
          ‹ Back
        </button>
        <div className="flex items-center gap-[9px] text-decoration-none">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#1a0f35] to-[#0a0618] flex items-center justify-center text-[16px] shadow-[0_0_10px_rgba(167,139,250,0.25)]">
            🌙
          </div>
          <span className="font-['Cinzel'] text-[10px] tracking-[0.22em] uppercase text-purple-200/45">
            Reading Room
          </span>
        </div>
        <div className="flex gap-2">
          {/* Debug Toggle Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="p-1 h-8 w-8 text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            <Bug className="w-4 h-4" />
          </Button>
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#67e8f9] flex items-center justify-center font-['Cinzel'] text-[10px] text-white font-bold shadow-[0_0_10px_rgba(103,232,249,0.2)]">
            {user ? (user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase() : 'GR'}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-0 pb-12">
        {/* Top bar (Replaces old header) */}
        <div className="flex items-center justify-between p-[14px_18px_10px]">
          <div>
            <div className="font-['Cinzel'] text-[14px] tracking-[0.1em] bg-gradient-to-r from-[#c8a8ff] via-[#fff] to-[#a0c8ff] bg-[length:200%_auto] text-transparent bg-clip-text animate-[shimmer_4s_linear_infinite]">
              {deck?.name || "Reading"}
            </div>
            <div className="font-['IM_Fell_English'] italic text-[12px] text-[#b4a0dc]/45 mt-[2px]">
              {selectedSpread?.name || "Custom Spread"}
            </div>
          </div>
          <div className="flex gap-[7px]">
            <button 
              onClick={() => {
                setDrawnCards([]);
                setPlacedCards([]);
              }}
              className="font-['Cinzel'] text-[8.5px] tracking-[0.12em] uppercase p-[7px_12px] rounded-full border border-[#a078ff]/25 bg-[#160f2a] text-[#e1d7ff]/90 cursor-pointer transition-all hover:border-[#a78bfa] hover:text-[#a78bfa] flex items-center gap-[5px] whitespace-nowrap"
            >
              ↺ New
            </button>
            <button 
              onClick={handleSaveReading}
              className="font-['Cinzel'] text-[8.5px] tracking-[0.12em] uppercase p-[7px_12px] rounded-full border border-[#34d399]/35 bg-[#34d399]/10 text-[#34d399] cursor-pointer transition-all hover:bg-[#34d399]/20 flex items-center gap-[5px] whitespace-nowrap"
            >
              ⬡ Save
            </button>
          </div>
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

             {/* Moon Stage with Cards */}
             <div className="relative mx-[12px] rounded-[18px] overflow-hidden bg-gradient-to-br from-[#0d0822] via-[#1a0f35] to-[#0a0618] border border-[#a078ff]/15 min-h-[280px] flex items-center justify-center mb-6">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                 <div className="absolute w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.06),transparent_70%)] animate-[moonGlow_6s_1s_ease-in-out_infinite]" />
                 <div className="w-[240px] h-[240px] rounded-full border border-[#c9a84c]/10 bg-[radial-gradient(circle_at_40%_35%,rgba(201,168,76,0.18),rgba(120,80,200,0.08)_55%,transparent_75%)] animate-[moonGlow_5s_ease-in-out_infinite]" />
               </div>
               
               <div className="relative z-10 flex items-end justify-center gap-[10px] p-[28px_16px_24px] w-full flex-wrap">
                 {(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean).map((card, idx) => (
                   <div 
                     key={idx} 
                     className="flex-1 max-w-[110px] flex flex-col items-center gap-[8px] animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-both"
                     style={{ animationDelay: `${idx * 0.18}s` }}
                   >
                     <div 
                       onClick={() => handleCardClick(card, idx)}
                       className="w-full aspect-[2/3] rounded-[10px] bg-gradient-to-br from-[#1e1438] to-[#0d0822] border-[1.5px] border-[#a78bfa]/35 flex items-center justify-center text-[28px] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(100,50,200,0.2)] hover:-translate-y-2 transition-transform duration-300 cursor-pointer relative"
                     >
                       {card.image_url ? (
                         <img src={card.image_url} alt={card.name} className="w-full h-full object-cover rounded-[8px]" />
                       ) : (
                         <span className="text-white/40 font-['IM_Fell_English']">Card</span>
                       )}
                       <div className="absolute inset-0 rounded-[8px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                     </div>
                     <div className="font-['Cinzel'] text-[7.5px] tracking-[0.1em] uppercase text-[#dcd2ff]/80 text-center leading-[1.4] line-clamp-2">
                       {card.name}
                     </div>
                     <div className="font-['Cinzel'] text-[7px] tracking-[0.1em] uppercase p-[3px_8px] rounded-full bg-[#a78bfa]/15 border border-[#a78bfa]/30 text-[#a78bfa]">
                       {idx + 1}. {card.position || "Card"}
                     </div>
                     <div className="font-['IM_Fell_English'] italic text-[10px] text-[#b4a0dc]/45 text-center leading-[1.4] line-clamp-2">
                       {card.position_meaning || "Guidance"}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             <div className="text-center font-['IM_Fell_English'] italic text-[11px] text-[#a78bfa]/35 p-[4px_0_10px]">
               Tap a card to explore its meaning
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

            {/* Insight buttons */}
            <div className="p-[6px_18px_0]">
              {!showAI && (
                <button 
                  onClick={() => setShowAI(true)}
                  className="w-full p-[14px_18px] rounded-[13px] border-none cursor-pointer flex items-center justify-center gap-[10px] mb-[10px] transition-all hover:-translate-y-[2px] active:scale-[0.97] bg-gradient-to-br from-[#5b21b6] via-[#7c3aed] to-[#a78bfa] shadow-[0_4px_22px_rgba(124,58,237,0.4)] text-white font-['Cinzel']"
                >
                  <span className="text-[18px] shrink-0">✦</span>
                  <div className="text-left">
                    <div className="text-[13px] tracking-[0.12em] uppercase font-bold">Unlock Deep Insight</div>
                    <div className="font-['IM_Fell_English'] italic text-[11px] opacity-75 mt-[1px]">AI-powered interpretation of your reading</div>
                  </div>
                </button>
              )}
            </div>

            {/* AI Reading Section */}
            <AIReading
              isOpen={showAI}
              drawnCards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
              deck={deck}
              spread={selectedSpread}
              question={question}
              onClose={() => setShowAI(false)}
              onInterpretationReady={() => setShowAgent(true)}
            />

            {/* Card Relationships Section */}
            {(placedCards.filter(Boolean).length >= 2 || drawnCards.length >= 2) && (
              <div className="m-[6px_18px_0]">
                <div className="flex items-center gap-[10px] p-[10px_0_12px]">
                  <div className="font-['Cinzel'] text-[8.5px] tracking-[0.12em] uppercase p-[5px_12px] rounded-full bg-[#a78bfa]/15 border border-[#a78bfa]/30 text-[#a78bfa] flex items-center gap-[5px]">
                    ✦ Card Relationships
                  </div>
                  <div className="font-['Crimson_Text'] text-[14px] text-[#b4a0dc]/45">
                    Discover connections
                  </div>
                </div>
                
                <div className="bg-[#0f0b1e] border border-[#a078ff]/15 rounded-[14px] overflow-hidden">
                  <div className="p-[14px_16px] flex items-center justify-between border-b border-[#a078ff]/15">
                    <div className="font-['Cinzel'] text-[13px] tracking-[0.08em] text-white flex items-center gap-[8px]">
                      <span>⬡</span> Connections
                    </div>
                  </div>
                  <div className="p-[16px]">
                    <CardRelationshipVisualizer
                      deckId={deck.id}
                      cards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
                      selectedCards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
                    />
                  </div>
                </div>
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
      {showRelationshipsOverlay && (
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
        </div>
      )}

{/* Compact view only: removed overlay */}

       {/* Enhanced Card Viewer Modal - MOVED TO TOP LEVEL WITH HIGHER Z-INDEX */}
      {viewerCard && showEnhancedViewer && (
        <div className="fixed inset-0 z-[9999]">
          <EnhancedCardViewer
            card={viewerCard.card}
            position={viewerCard.position}
            isReversed={viewerCard.isReversed}
            relatedCards={viewerCard.relatedCards}
            isOpen={showEnhancedViewer}
            onClose={() => {
              setShowEnhancedViewer(false);
              setViewerCard(null);
            }}
          />
        </div>
      )}

      {/* Session Manager Modal */}
      <div className="mt-8 text-center text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg p-3">
        Disclaimer: The readings and guidance provided are for entertainment purposes only and do not constitute professional advice.
      </div>
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
      />
      </div>
      <VoiceAvatarBubble
        deck={deck}
        spread={selectedSpread}
        cards={(placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean)}
        question={question}
      />
      {showAgent && <DidAgentEmbed />}
      </>
      );
}