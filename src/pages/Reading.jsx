import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  Shuffle, Save, Sparkles, ChevronLeft, Loader2, AlertTriangle,
  BookOpen, Eye, X, RefreshCw, FileText, History,
  ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import AIReading           from "@/components/reading/AIReading";
import IdeomotorCanvas     from "@/components/reading/IdeomotorCanvas";
import CompactSpread       from "@/components/reading/CompactSpread";
import { queueApiCall }    from "@/components/utils/apiQueue";
import CardRelationshipVisualizer from "@/components/deck/CardRelationshipVisualizer";
import ReadingSessionManager     from "@/components/reading/ReadingSessionManager";
import EnhancedCardViewer        from "@/components/reading/EnhancedCardViewer";
import DisablePullToRefresh      from "@/components/common/DisablePullToRefresh";
import ShuffleAnimation          from "@/components/reading/ShuffleAnimation";
import VoiceAvatarBubble         from "@/components/avatar/VoiceAvatarBubble";
import DidAgentEmbed             from "@/components/integrations/DidAgentEmbed";

// ─── Spreads ──────────────────────────────────────────────────────────────────
const BUILT_IN_SPREADS = [
  { id:"single",         name:"Single Card",           positions:[{name:"Guidance",       meaning:"Your guidance for today",       x:50,y:50,rotation:0}], isBuiltIn:true },
  { id:"three_card",     name:"Past · Present · Future",positions:[{name:"Past",meaning:"What brought you here",x:25,y:50,rotation:0},{name:"Present",meaning:"Where you are now",x:50,y:50,rotation:0},{name:"Future",meaning:"Where you are heading",x:75,y:50,rotation:0}], isBuiltIn:true },
  { id:"diamond",        name:"Diamond",               positions:[{name:"Theme",meaning:"Overarching theme",x:50,y:14,rotation:0},{name:"Support",meaning:"What supports you",x:74,y:30,rotation:35},{name:"External",meaning:"External influences",x:88,y:50,rotation:90},{name:"Release",meaning:"What to release",x:74,y:70,rotation:-35},{name:"Hidden",meaning:"Hidden factor",x:50,y:86,rotation:0},{name:"Challenge",meaning:"Challenge",x:26,y:70,rotation:35},{name:"Internal",meaning:"Internal influences",x:12,y:50,rotation:90}], isBuiltIn:true },
  { id:"celtic_cross",   name:"Celtic Cross",          positions:[{name:"Present",meaning:"Current situation"},{name:"Challenge",meaning:"What crosses you"},{name:"Foundation",meaning:"The basis"},{name:"Recent Past",meaning:"What is behind you"},{name:"Crown",meaning:"Goal or destiny"},{name:"Near Future",meaning:"What lies ahead"},{name:"Self",meaning:"Your attitude"},{name:"Environment",meaning:"External influences"},{name:"Hopes/Fears",meaning:"Hopes and fears"},{name:"Outcome",meaning:"Final outcome"}], isBuiltIn:true },
  { id:"horseshoe",      name:"Horseshoe",             positions:[{name:"Past",meaning:"Background",x:15,y:70,rotation:-10},{name:"Present",meaning:"Current state",x:30,y:58,rotation:-5},{name:"Hidden",meaning:"Unseen factors",x:45,y:52,rotation:0},{name:"Obstacle",meaning:"What blocks you",x:60,y:52,rotation:0},{name:"Advice",meaning:"Guidance",x:75,y:58,rotation:5},{name:"Near Future",meaning:"Next step",x:90,y:70,rotation:10},{name:"Outcome",meaning:"Likely result",x:52,y:80,rotation:0}], isBuiltIn:true },
  { id:"relationship",   name:"Relationship",          positions:[{name:"You (Conscious)",meaning:"Your surface stance",x:30,y:30,rotation:0},{name:"You (Subconscious)",meaning:"Deeper driver",x:30,y:50,rotation:0},{name:"You (Lesson)",meaning:"What to learn",x:30,y:70,rotation:0},{name:"Partner (Conscious)",meaning:"Their surface stance",x:70,y:30,rotation:0},{name:"Partner (Subconscious)",meaning:"Their deeper driver",x:70,y:50,rotation:0},{name:"Partner (Lesson)",meaning:"What they learn",x:70,y:70,rotation:0}], isBuiltIn:true },
  { id:"decision",       name:"Decision",              positions:[{name:"Choice A",meaning:"Path A",x:30,y:35,rotation:-6},{name:"Choice B",meaning:"Path B",x:70,y:35,rotation:6},{name:"Pros",meaning:"What helps",x:30,y:65,rotation:-6},{name:"Cons",meaning:"What hinders",x:70,y:65,rotation:6},{name:"Outcome",meaning:"Best alignment",x:50,y:50,rotation:0}], isBuiltIn:true },
  { id:"weekly_forecast",name:"Weekly Forecast",       positions:[{name:"Mon",meaning:"Monday",x:10,y:50},{name:"Tue",meaning:"Tuesday",x:24,y:50},{name:"Wed",meaning:"Wednesday",x:38,y:50},{name:"Thu",meaning:"Thursday",x:52,y:50},{name:"Fri",meaning:"Friday",x:66,y:50},{name:"Sat",meaning:"Saturday",x:80,y:50},{name:"Sun",meaning:"Sunday",x:94,y:50}], isBuiltIn:true },
  { id:"star",           name:"Star",                  positions:[{name:"Theme",meaning:"Central theme",x:50,y:50,rotation:0},{name:"North",meaning:"Guidance",x:50,y:15,rotation:0},{name:"NE",meaning:"Support",x:72,y:32,rotation:18},{name:"SE",meaning:"Action",x:68,y:72,rotation:-18},{name:"South",meaning:"Shadow",x:50,y:85,rotation:0},{name:"SW",meaning:"Challenge",x:32,y:72,rotation:18},{name:"NW",meaning:"Insight",x:28,y:32,rotation:-18}], isBuiltIn:true },
  { id:"chakra",         name:"Chakra Alignment",      positions:[{name:"Crown",meaning:"Spiritual connection",x:50,y:15,rotation:0},{name:"Third Eye",meaning:"Intuition",x:50,y:27,rotation:0},{name:"Throat",meaning:"Expression",x:50,y:39,rotation:0},{name:"Heart",meaning:"Love & compassion",x:50,y:51,rotation:0},{name:"Solar Plexus",meaning:"Willpower",x:50,y:63,rotation:0},{name:"Sacral",meaning:"Creativity",x:50,y:75,rotation:0},{name:"Root",meaning:"Grounding",x:50,y:87,rotation:0}], isBuiltIn:true },
];

// ─── Animated card back ───────────────────────────────────────────────────────
function CardBack({ onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateY: 90 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay, duration: 0.45, type: "spring", stiffness: 130 }}
      onClick={onClick}
      className="w-20 h-32 rounded-xl overflow-hidden border-2 border-purple-400/40 cursor-pointer flex-shrink-0 relative flex items-center justify-center"
      style={{ background: "radial-gradient(135% 135% at 30% 20%, rgba(124,58,237,0.4) 0%, #0f0b1e 100%)", boxShadow: "0 0 20px rgba(167,139,250,0.2), 0 4px 16px rgba(0,0,0,0.5)", transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(167,139,250,0.5)" }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="text-purple-400/60 text-3xl select-none">✦</span>
      <div className="absolute inset-0 opacity-15" style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(167,139,250,0.2) 4px,rgba(167,139,250,0.2) 5px)" }} />
    </motion.div>
  );
}

// ─── Spread selector pill ─────────────────────────────────────────────────────
function SpreadPill({ spread, selected, onClick }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border transition-all"
      style={selected
        ? { background:"rgba(124,58,237,0.3)", borderColor:"rgba(167,139,250,0.6)", color:"#a78bfa" }
        : { background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)" }}
    >
      <span className="font-semibold text-xs whitespace-nowrap">{spread.name}</span>
      <span className="text-[10px] opacity-60">{spread.positions.length} cards</span>
    </button>
  );
}

// ─── History entry ────────────────────────────────────────────────────────────
function HistoryEntry({ reading, onView }) {
  const [expanded, setExpanded] = useState(false);
  const date = reading.created_date
    ? new Date(reading.created_date).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })
    : "";
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background:"rgba(255,255,255,0.04)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{reading.title || reading.spread_type || "Reading"}</p>
          <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {date}
            {reading.spread_type && <span className="ml-2 text-purple-400">· {reading.spread_type}</span>}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">
              {reading.question && <p className="text-sm text-purple-200 italic">"{reading.question}"</p>}
              {reading.cards_drawn?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reading.cards_drawn.slice(0,6).map((c,i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">{c.card_name || c.position}</span>
                  ))}
                  {reading.cards_drawn.length > 6 && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">+{reading.cards_drawn.length-6} more</span>}
                </div>
              )}
              {reading.interpretation && <p className="text-xs text-white/60 line-clamp-3">{reading.interpretation}</p>}
              <Button size="sm" variant="outline" onClick={() => onView(reading)} className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl">
                <Eye className="w-3.5 h-3.5 mr-2" /> View Full Reading
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const deckIdFromUrl = React.useMemo(() => new URLSearchParams(location.search).get("deckId"), [location.search]);

  const [deck, setDeck]         = useState(null);
  const [cards, setCards]       = useState([]);
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState("");

  const [selectedSpreadId, setSelectedSpreadId] = useState("three_card");
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState([]);
  const [placedCards, setPlacedCards] = useState([]);
  const [revealedCards, setRevealedCards] = useState(new Set());
  const [readingPositions, setReadingPositions] = useState([]);

  const [showAI, setShowAI]     = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showEnhancedViewer, setShowEnhancedViewer] = useState(false);
  const [viewerCard, setViewerCard] = useState(null);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyReadings, setHistoryReadings] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pickerDecks, setPickerDecks] = useState({ publicDecks:[], myDecks:[] });
  const [pickerLoading, setPickerLoading] = useState(false);

  // phase: 'setup' | 'shuffling' | 'reveal' | 'reading'
  const [phase, setPhase] = useState("setup");

  const isIOS = typeof navigator !== "undefined" && (/iP(ad|hone|od)/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && typeof document !== "undefined" && "ontouchend" in document));
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const disableHeavyAnimations = isIOS || prefersReducedMotion;

  const selectedSpread = BUILT_IN_SPREADS.find(s => s.id === selectedSpreadId) || BUILT_IN_SPREADS[1];

  useEffect(() => { setReadingPositions(selectedSpread?.positions || []); }, [selectedSpread]);

  // Load deck
  useEffect(() => {
    if (!deckIdFromUrl) { setIsLoading(false); return; }
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setIsLoading(false); setError("Timeout. Please refresh."); } }, 20000);
    (async () => {
      try {
        setIsLoading(true);
        const [u, d, c] = await Promise.all([
          queueApiCall(() => base44.auth.me(), 3, 1000),
          queueApiCall(() => base44.entities.Deck.get(deckIdFromUrl), 3, 1000),
          queueApiCall(() => base44.entities.Card.filter({ deck_id: deckIdFromUrl }), 3, 1000),
        ]);
        if (cancelled) return;
        setUser(u); setDeck(d); setCards(c || []);
      } catch (_) { if (!cancelled) setError("Failed to load deck. Please try again."); }
      finally { if (!cancelled) { clearTimeout(timeout); setIsLoading(false); } }
    })();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [deckIdFromUrl]);

  // Load picker
  useEffect(() => {
    if (deckIdFromUrl) return;
    let cancelled = false;
    (async () => {
      try {
        setPickerLoading(true);
        const [pub, u] = await Promise.all([
          queueApiCall(() => base44.entities.Deck.filter({ is_public:true, publish_status:"published" }, "-created_date", 100), 3, 800),
          queueApiCall(() => base44.auth.me(), 1, 500).catch(() => null),
        ]);
        let mine = [];
        if (u?.email) {
          const m = await queueApiCall(() => base44.entities.Deck.filter({ created_by: u.email }, "-updated_date", 100), 2, 800);
          mine = Array.isArray(m) ? m.filter(d => !["draft","pending_review"].includes(d.publish_status)) : [];
        }
        if (!cancelled) { setUser(u); setPickerDecks({ publicDecks: pub||[], myDecks: mine }); }
      } catch (_) { if (!cancelled) setPickerDecks({ publicDecks:[], myDecks:[] }); }
      finally { if (!cancelled) setPickerLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [deckIdFromUrl]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const r = await queueApiCall(() => base44.entities.Reading.filter({ created_by: user.email }, "-created_date", 20), 3, 1000);
      setHistoryReadings(r || []);
    } catch (_) { setHistoryReadings([]); }
    finally { setHistoryLoading(false); }
  }, [user]);

  useEffect(() => { if (showHistory && user) loadHistory(); }, [showHistory, user, loadHistory]);

  const handleDrawCards = () => {
    if (!cards.length || !selectedSpread) { setError("This deck has no cards."); return; }
    setPhase("shuffling");
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const drawn = selectedSpread.positions.map((pos, idx) => {
      const card = shuffled[idx];
      const p = typeof pos === "string" ? { name:pos, meaning:"", x:null, y:null, rotation:0 } : { name:pos.name||`Position ${idx+1}`, meaning:pos.meaning||"", x:pos.x??null, y:pos.y??null, rotation:pos.rotation??0 };
      return { ...card, card_id:card?.id, position:p.name, position_meaning:p.meaning, position_x:p.x, position_y:p.y, position_rotation:p.rotation, isReversed: deck?.category==="tarot" && Math.random()>0.5 };
    });
    const ms = disableHeavyAnimations ? 2000 : (deck?.shuffle_animation_url ? 7000 : 3000);
    setTimeout(() => {
      setDrawnCards(drawn); setPlacedCards(drawn); setRevealedCards(new Set());
      setShowAI(false); setPhase("reveal");
    }, ms);
  };

  const handleCardReveal = (idx) => {
    setRevealedCards(prev => {
      const next = new Set(prev); next.add(idx);
      if (next.size === drawnCards.length) setTimeout(() => setPhase("reading"), 600);
      return next;
    });
  };

  const handleRevealAll = () => {
    setRevealedCards(new Set(drawnCards.map((_, i) => i)));
    setTimeout(() => setPhase("reading"), 600);
  };

  const handleNewReading = () => {
    setDrawnCards([]); setPlacedCards([]); setRevealedCards(new Set());
    setShowAI(false); setSessionNotes(""); setPhase("setup"); setError("");
  };

  const handleCardClick = (drawnCard) => {
    const activeCards = (placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean);
    const fullCard = cards.find(c => c.id === drawnCard.id);
    if (drawnCard) {
      setViewerCard({ card: fullCard||drawnCard, position: drawnCard.position, isReversed: drawnCard.isReversed, relatedCards: activeCards.filter(dc => dc.id !== drawnCard.id) });
      setShowEnhancedViewer(true);
    }
  };

  const activeCards = (placedCards.some(Boolean) ? placedCards : drawnCards).filter(Boolean);

  // ── Picker ──
  useEffect(() => {
    if (!deckIdFromUrl) {
      navigate(createPageUrl("ReadingRoom"), { replace: true });
    }
  }, [deckIdFromUrl, navigate]);

  if (!deckIdFromUrl) return null;

  // ── Loading ──
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" /><p className="text-purple-200">Loading deck…</p></div>
    </div>
  );

  // ── Error ──
  if (error && !deck) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white/80 mb-6">{error}</p>
        <Link to={createPageUrl("Dashboard")}><Button variant="outline" className="border-white/20 text-white"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button></Link>
      </div>
    </div>
  );

  return (
    <>
      <DisablePullToRefresh targetSelector="main" threshold={30} />

      <div className="min-h-screen text-white pb-32" style={{ background:"radial-gradient(ellipse 120% 80% at 50% 0%, rgba(49,10,84,0.6) 0%, #07050f 60%)" }}>

        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3" style={{ background:"rgba(7,5,15,0.88)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white rounded-full"><ChevronLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            {deck?.cover_image && <img src={deck.cover_image} alt="" className="w-7 h-7 rounded-md object-cover" />}
            <span className="font-bold text-white text-sm truncate max-w-[160px]">{deck?.name}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white rounded-full" onClick={() => setShowHistory(h => !h)}>
            <History className="w-4 h-4" />
          </Button>
        </div>

        {/* History panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden border-b border-white/8" style={{ background:"rgba(7,5,15,0.95)" }}>
              <div className="px-4 py-4 space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Reading History</span>
                  {historyLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
                </div>
                {historyReadings.length === 0 && !historyLoading
                  ? <p className="text-white/40 text-sm text-center py-4">No saved readings yet.</p>
                  : historyReadings.map(r => <HistoryEntry key={r.id} reading={r} onView={r => navigate(createPageUrl(`SharedReading?id=${r.id}`))} />)
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pt-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm flex-1">{error}</p>
              <button onClick={() => setError("")}><X className="w-4 h-4 text-red-300" /></button>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ─── SETUP ─── */}
            {phase === "setup" && (
              <motion.div key="setup" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }} className="space-y-6">
                <div className="rounded-2xl p-5" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Your Question</p>
                  <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="What guidance do you seek? (optional)" className="bg-transparent border-white/15 text-white placeholder:text-white/30 resize-none text-sm" rows={3} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Choose a Spread</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {BUILT_IN_SPREADS.map(s => <SpreadPill key={s.id} spread={s} selected={selectedSpreadId===s.id} onClick={() => setSelectedSpreadId(s.id)} />)}
                  </div>
                  <motion.div key={selectedSpreadId} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="mt-3 rounded-xl p-3 flex flex-wrap gap-1.5" style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)" }}>
                    {selectedSpread.positions.map((p,i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">{p.name}</span>
                    ))}
                  </motion.div>
                </div>

                <motion.button onClick={handleDrawCards} disabled={cards.length===0} className="w-full py-5 rounded-2xl font-bold text-lg text-white relative overflow-hidden disabled:opacity-50" style={{ background:"linear-gradient(135deg,#7c3aed,#be185d,#2563eb)" }} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
                  <span className="flex items-center justify-center gap-3">
                    <Shuffle className="w-5 h-5" /> Draw Cards {cards.length > 0 && <span className="text-sm opacity-70">({cards.length} in deck)</span>}
                  </span>
                </motion.button>
                {cards.length === 0 && !isLoading && <p className="text-center text-white/40 text-sm">This deck has no cards yet.</p>}
              </motion.div>
            )}

            {/* ─── SHUFFLING ─── */}
            {phase === "shuffling" && (
              <motion.div key="shuffling" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(167,139,250,0.3)", background:"rgba(0,0,0,0.3)" }}>
                {!disableHeavyAnimations && deck?.shuffle_animation_url && (
                  <div className="relative w-full h-60">
                    <ShuffleAnimation url={deck.shuffle_animation_url} className="absolute inset-0 w-full h-full" style={{ objectFit:"cover" }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                )}
                <div className="px-6 py-8 text-center">
                  <motion.div animate={{ rotate:360 }} transition={{ duration:3, repeat:Infinity, ease:"linear" }} className="w-12 h-12 mx-auto mb-4 text-3xl text-purple-400">✦</motion.div>
                  <h3 className="text-purple-200 font-semibold mb-2">Channeling cosmic energy…</h3>
                  <p className="text-white/40 text-sm mb-6">Draw or doodle below while the cards are being shuffled</p>
                  <div className="mx-auto w-full max-w-sm">
                    <IdeomotorCanvas question={question||"What guidance do you seek?"} onComplete={() => {}} autoCompleteAfter={2500} showInstructions={true} instructionText="Draw or doodle below" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── REVEAL ─── */}
            {phase === "reveal" && (
              <motion.div key="reveal" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-6">
                <div className="text-center">
                  <p className="text-purple-300 font-semibold mb-1">Your cards are ready</p>
                  <p className="text-white/40 text-sm">Tap each card to reveal, or reveal all at once</p>
                </div>

                <div className="flex gap-3 flex-wrap justify-center py-4">
                  {drawnCards.map((card, i) => {
                    const revealed = revealedCards.has(i);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        {revealed ? (
                          <motion.div
                            initial={{ rotateY:90, opacity:0 }} animate={{ rotateY:0, opacity:1 }} transition={{ duration:0.4 }}
                            onClick={() => handleCardClick(card)}
                            className="w-20 h-32 rounded-xl overflow-hidden border-2 border-purple-400/50 cursor-pointer relative"
                            style={{ boxShadow:"0 0 20px rgba(167,139,250,0.4)" }}
                            whileHover={{ scale:1.05 }}
                          >
                            {card.image_url
                              ? <img src={card.image_url} alt={card.name} className={`w-full h-full object-cover ${card.isReversed?"rotate-180":""}`} />
                              : <div className="w-full h-full flex items-center justify-center text-xs text-center p-1 text-purple-200" style={{ background:"rgba(124,58,237,0.3)" }}>{card.name}</div>
                            }
                            {card.isReversed && <div className="absolute bottom-1 right-1 bg-amber-500/80 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-[8px] font-bold">R</span></div>}
                          </motion.div>
                        ) : (
                          <CardBack onClick={() => handleCardReveal(i)} delay={i * 0.08} />
                        )}
                        <span className="text-[10px] text-white/40 text-center max-w-[80px] truncate">{card.position}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleRevealAll} className="flex-1 rounded-2xl font-semibold" style={{ background:"linear-gradient(135deg,#7c3aed,#be185d)" }}>
                    <Eye className="w-4 h-4 mr-2" /> Reveal All
                  </Button>
                  <Button variant="outline" onClick={handleNewReading} className="rounded-2xl border-white/20 text-white hover:bg-white/10"><RefreshCw className="w-4 h-4" /></Button>
                </div>
              </motion.div>
            )}

            {/* ─── READING ─── */}
            {phase === "reading" && (
              <motion.div key="reading" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-6">

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center">
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedSpread.name}</h2>
                  {question && <p className="text-purple-300 text-sm italic">"{question}"</p>}
                </div>

                {/* Spread layout */}
                <div className="rounded-2xl overflow-hidden relative" style={{ border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)" }}>
                  <CompactSpread spread={selectedSpread} positions={readingPositions} cards={placedCards} deck={deck} revealedCards={revealedCards} onCardClick={handleCardClick} onCardReveal={handleCardReveal} />
                  
                  {/* Floating Action Bar overlay on top of the spread container at the bottom */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-xl shadow-black/50 z-20">
                     <Button size="icon" variant="ghost" className="rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={handleNewReading} title="New Reading">
                       <RefreshCw className="w-5 h-5" />
                     </Button>
                     <div className="w-px h-6 bg-white/10 mx-1"></div>
                     <Button className="rounded-full font-bold px-6" style={{ background:"linear-gradient(135deg,#7c3aed,#be185d)" }} onClick={() => setShowAI(true)}>
                       <Sparkles className="w-4 h-4 mr-2" /> Insight
                     </Button>
                     <div className="w-px h-6 bg-white/10 mx-1"></div>
                     <Button size="icon" variant="ghost" className="rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={() => setShowSessionManager(true)} title="Save Reading">
                       <Save className="w-5 h-5" />
                     </Button>
                  </div>
                </div>

                <AIReading isOpen={showAI} drawnCards={activeCards} deck={deck} spread={selectedSpread} question={question} onClose={() => setShowAI(false)} onInterpretationReady={() => setShowAgent(true)} />

                {/* Session Notes & Relationships (Collapsed by default, styled minimally) */}
                <div className="space-y-3">
                  <div className="rounded-2xl p-4" style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)" }}>
                    <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-purple-400" /><p className="text-sm font-semibold text-purple-300">Session Notes</p></div>
                    <Textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Jot down your thoughts, feelings, and insights…" className="bg-transparent border-purple-500/20 text-white placeholder:text-white/30 text-sm resize-none" rows={3} />
                  </div>

                  {activeCards.length >= 2 && (
                    <div className="rounded-2xl p-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                      <button className="w-full flex items-center justify-between" onClick={() => setShowRelationships(r => !r)}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-white text-sm">Card Relationships</span>
                          <Badge className="bg-purple-600/40 text-purple-200 text-[10px]">{activeCards.length} cards</Badge>
                        </div>
                        {showRelationships ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                      </button>
                      <AnimatePresence>
                        {showRelationships && (
                          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden mt-4">
                            <CardRelationshipVisualizer deckId={deck.id} cards={activeCards} selectedCards={activeCards} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-white/25 pb-4 pt-4">Readings are for entertainment purposes only and do not constitute professional advice.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      {viewerCard && showEnhancedViewer && (
        <div className="fixed inset-0 z-[9999]">
          <EnhancedCardViewer card={viewerCard.card} position={viewerCard.position} isReversed={viewerCard.isReversed} relatedCards={viewerCard.relatedCards} isOpen={showEnhancedViewer} onClose={() => { setShowEnhancedViewer(false); setViewerCard(null); }} />
        </div>
      )}

      <ReadingSessionManager
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
        deckId={deck?.id}
        deckName={deck?.name}
        spreadType={selectedSpread?.name}
        question={question}
        drawnCards={drawnCards}
        interpretation={sessionNotes}
        onSaved={() => { setShowSessionManager(false); toast.success("Reading saved!"); if (user) loadHistory(); }}
      />

      <VoiceAvatarBubble deck={deck} spread={selectedSpread} cards={activeCards} question={question} />
      {showAgent && <DidAgentEmbed />}
    </>
  );
}