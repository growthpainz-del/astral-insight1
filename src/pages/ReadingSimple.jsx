import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { composeReading, composeCardQuick, buildCardPromptByMode, buildFullReadingPromptByMode } from "@/utils/interpretationComposer";
import CosMosisModePicker from "@/components/cosmosis/CosMosisModePicker";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Hand, Shuffle, Eye, Sparkles, Settings2, Save } from "lucide-react";
import SpreadLayout, { SYSTEM_SPREADS } from "@/components/reading/CompactSpread";
import BottomCardShelf from "@/components/reading/BottomCardShelf";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";
import { base44 } from "@/api/base44Client";

const FreeformCard = ({ card, canvasRef, toggleFlip, deck, openInterpretation }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(card.rotation || 0);
  const initialPinch = useRef(null);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, scale, x: card.x, y: card.y, rotate: rotation + (card.isReversed ? 180 : 0), transition: { type: "spring", stiffness: 200, damping: 20 } });
  }, []);

  useEffect(() => {
    controls.start({ scale, rotate: rotation + (card.isReversed ? 180 : 0), transition: { type: "spring", stiffness: 300, damping: 30 } });
  }, [scale, rotation, card.isReversed, controls]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const angle = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * (180 / Math.PI);
      initialPinch.current = { dist, scale, angle, rotation };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinch.current) {
      e.preventDefault(); e.stopPropagation();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(Math.min(Math.max(0.4, initialPinch.current.scale * (dist / initialPinch.current.dist)), 3));
      const angle = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * (180 / Math.PI);
      let angleDiff = angle - initialPinch.current.angle;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      setRotation(initialPinch.current.rotation + angleDiff);
    }
  };

  const handleTouchEnd = () => { initialPinch.current = null; };

  return (
    <motion.div
      drag dragConstraints={canvasRef} dragMomentum={false} dragElastic={0.1}
      initial={{ opacity: 0, scale: 0.5, x: card.x, y: card.y + 300 }}
      animate={controls}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ scale: scale * 1.05, zIndex: 50 }}
      whileDrag={{ scale: scale * 1.1, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
      onClick={() => { if (!card.isFlipped) toggleFlip(card.id); else if (openInterpretation) openInterpretation(card); }}
      onDoubleClick={() => toggleFlip(card.id)}
      onWheel={(e) => { e.stopPropagation(); setScale(s => Math.min(Math.max(0.4, s + (-e.deltaY * 0.002)), 3)); }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}
      className="absolute left-1/2 top-1/2 -ml-[60px] -mt-[95px] cursor-grab active:cursor-grabbing touch-none"
      style={{ zIndex: card.zIndex || 10 }}
    >
      <div className="relative w-[120px] h-[190px] rounded-xl" style={{ transformStyle: "preserve-3d", transform: card.isFlipped ? "rotateY(0deg)" : "rotateY(180deg)" }}>
        <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900" style={{ backfaceVisibility: "hidden" }}>
          {card.cardData.image_url
            ? <img src={card.cardData.image_url} alt={card.cardData.name} className="w-full h-full object-cover pointer-events-none" draggable="false" />
            : <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 to-purple-900"><p className="text-purple-50 text-center font-bold pointer-events-none">{card.cardData.name}</p></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <button type="button" className="absolute top-2 right-2 p-2 bg-black/60 rounded-full backdrop-blur-sm pointer-events-auto hover:bg-purple-600 transition-colors shadow-lg border border-purple-500/40"
            onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (openInterpretation) openInterpretation(card); }}>
            <Sparkles className="w-4 h-4 text-purple-300" />
          </button>
        </div>
        <div className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 pointer-events-none"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "radial-gradient(circle at center, #4c1d95 0%, #1e1b4b 100%)" }}>
          {deck?.back_image_url
            ? <img src={deck.back_image_url} alt="Card Back" className="w-full h-full object-cover opacity-80 pointer-events-none" draggable="false" />
            : <div className="w-full h-full flex items-center justify-center opacity-50"><Sparkles className="w-8 h-8 text-purple-400" /></div>
          }
        </div>
      </div>
    </motion.div>
  );
};

export default function ReadingSimple() {
  const [searchParams] = useSearchParams();
  const deckIdFromUrl = searchParams.get("deckId") || searchParams.get("deck_id");
  const spreadParam = searchParams.get("spread");
  const questionParam = searchParams.get("question");

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [deckRemaining, setDeckRemaining] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [composedReading, setComposedReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canvasRef = React.useRef(null);

  const [readingMode] = useState(spreadParam === "freeform" ? "freeform" : "spread");
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [isShuffling, setIsShuffling] = useState(false);
  const [isEditingSpread, setIsEditingSpread] = useState(false);
  const [isSavingSpread, setIsSavingSpread] = useState(false);
  const [selectedCardForInterpretation, setSelectedCardForInterpretation] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [spreadInterpretation, setSpreadInterpretation] = useState(null);
  const [isSpreadAiLoading, setIsSpreadAiLoading] = useState(false);
  const [showSpreadInterpretation, setShowSpreadInterpretation] = useState(false);
  const [showCardModePicker, setShowCardModePicker] = useState(false);
  const [showSpreadModePicker, setShowSpreadModePicker] = useState(false);

  useEffect(() => {
    const preventDrop = (e) => e.preventDefault();
    window.addEventListener('dragover', preventDrop);
    window.addEventListener('drop', preventDrop);
    return () => { window.removeEventListener('dragover', preventDrop); window.removeEventListener('drop', preventDrop); };
  }, []);

  const handleSaveSpread = async () => {
    if (!selectedSpread) return;
    setIsSavingSpread(true);
    try {
      if (selectedSpread.id && !SYSTEM_SPREADS.find(s => s.id === selectedSpread.id))
        await base44.entities.Spread.update(selectedSpread.id, { positions: selectedSpread.positions });
      setIsEditingSpread(false);
    } catch (e) { console.error(e); } finally { setIsSavingSpread(false); }
  };

  const handlePositionUpdate = (newPositions) => {
    if (selectedSpread) setSelectedSpread({ ...selectedSpread, positions: newPositions });
  };

  const getComposedReading = () => {
    const validCards = [], validPositions = [];
    drawnCards.forEach((c, i) => {
      if (c) { validCards.push(c); if (selectedSpread?.positions[i]) validPositions.push(selectedSpread.positions[i]); }
    });
    return composeReading(validCards, selectedSpread ? { ...selectedSpread, positions: validPositions } : null, questionParam || "", readingHistory, deckIdFromUrl);
  };

  const getSpreadInsight = async () => {
    const validDrawn = drawnCards.filter(Boolean);
    if (validDrawn.length === 0 || isSpreadAiLoading) return;
    const output = getComposedReading();
    if (!output) return;
    setComposedReading(output);
    setSpreadInterpretation(null);
    setShowSpreadInterpretation(true);
    if (output.saveData) { try { await base44.entities.Reading.create(output.saveData); } catch(e) { console.error(e); } }
  };

  const handleDeepenSpread = async (mode = "interpret") => {
    if (!composedReading || isSpreadAiLoading) return;

    try {
      const user = await base44.auth.me();
      if (!user) {
        setSpreadInterpretation("CosMosis requires you to be logged in. Please log in using the button in the top right.");
        return;
      }
    } catch (e) {
      setSpreadInterpretation("CosMosis requires you to be logged in. Please log in using the button in the top right.");
      return;
    }

    setShowSpreadModePicker(false);
    setIsSpreadAiLoading(true);
    try {
      const prompt = buildFullReadingPromptByMode(composedReading._raw, composedReading.patterns || {}, composedReading.question || "", mode);
      setSpreadInterpretation(await base44.integrations.Core.InvokeLLM({ prompt }));
    } catch (e) { setSpreadInterpretation(`CosMosis is momentarily unreachable (${e.message || "Unknown error"}). Please try again.`); }
    finally { setIsSpreadAiLoading(false); }
  };

  useEffect(() => {
    if (!deckIdFromUrl) { setError("No deck selected"); setLoading(false); return; }
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setLoading(false); setError("Loading timeout."); } }, 20000);
    const loadDeck = async () => {
      try {
        const [loadedDeck, loadedCards, loadedSpreads, history] = await Promise.all([
          queueApiCall(() => base44.entities.Deck.get(deckIdFromUrl), 3, 1500),
          queueApiCall(() => base44.entities.Card.filter({ deck_id: deckIdFromUrl }), 3, 1500),
          queueApiCall(() => base44.entities.Spread.list(), 3, 1500),
          queueApiCall(() => base44.entities.Reading.list('-date', 100).catch(() => []), 3, 1500)
        ]);
        if (cancelled) return;
        setDeck(loadedDeck);
        const fixedCards = loadedCards.map(c => {
          let updated = { ...c };
          if (updated.image_url && updated.image_url.includes('base44.app/api/apps/')) {
            updated.image_url = updated.image_url.replace('https://base44.app/api/apps/68d2a300021f94d0f312c039/files/mp/public/', 'https://media.base44.com/images/public/');
          }
          return updated;
        });
        setCards(fixedCards);
        setReadingHistory(history || []);
        if (spreadParam && spreadParam !== "freeform") {
          const sysSpread = SYSTEM_SPREADS.find(s => s.id === spreadParam);
          if (sysSpread) setSelectedSpread(JSON.parse(JSON.stringify(sysSpread)));
          else {
            const customSpread = loadedSpreads?.find(s => s.id === spreadParam);
            setSelectedSpread(customSpread ? JSON.parse(JSON.stringify(customSpread)) : null);
          }
        }
        setDeckRemaining([...fixedCards].sort(() => Math.random() - 0.5));
        setError("");
      } catch (err) {
        if (cancelled) return;
        if (isNetworkError(err)) setError("Network error.");
        else if (err.response?.status === 404) setError("Deck not found.");
        else setError("Failed to load deck.");
      } finally { if (!cancelled) { clearTimeout(timeout); setLoading(false); } }
    };
    loadDeck();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [deckIdFromUrl]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e1b4b, #4c1d95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "#c084fc", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#e9d5ff" }}>Loading deck...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e1b4b, #4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: 12, padding: 24, maxWidth: 400, textAlign: "center" }}>
        <p style={{ color: "#fca5a5", marginBottom: 16 }}>{error}</p>
        <Link to={createPageUrl("DashboardHub")}>
          <Button variant="outline" className="text-red-200 border-red-500/50">
            <ChevronLeft className="w-4 h-4 mr-2" />Back
          </Button>
        </Link>
      </div>
    </div>
  );

  const handleDrawCard = () => {
    if (deckRemaining.length === 0) return;
    if (readingMode === "spread" && selectedSpread && drawnCards.filter(Boolean).length >= selectedSpread.positions.length) return;
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.pop();
    const newCard = { id: Date.now().toString() + Math.random(), cardData, x: Math.floor(Math.random() * 60) - 30, y: Math.floor(Math.random() * 60) - 30, rotation: readingMode === "spread" ? 0 : Math.floor(Math.random() * 10) - 5, isFlipped: false, isReversed: Math.random() < 0.25 };
    const newDrawnCards = [...drawnCards];
    if (readingMode === "spread" && selectedSpread) {
      const firstEmpty = newDrawnCards.findIndex(c => !c);
      if (firstEmpty !== -1) newDrawnCards[firstEmpty] = newCard;
      else newDrawnCards.push(newCard);
    } else newDrawnCards.push(newCard);
    setDrawnCards(newDrawnCards);
    setDeckRemaining(newRemaining);
  };

  const handleDrawSpecificCard = (cardIndex) => {
    if (readingMode === "spread" && selectedSpread && drawnCards.filter(Boolean).length >= selectedSpread.positions.length) return;
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.splice(cardIndex, 1)[0];
    const newCard = { id: Date.now().toString() + Math.random(), cardData, x: Math.floor(Math.random() * 60) - 30, y: Math.floor(Math.random() * 60) - 30, rotation: readingMode === "spread" ? 0 : Math.floor(Math.random() * 10) - 5, isFlipped: false, isReversed: Math.random() < 0.25 };
    const newDrawnCards = [...drawnCards];
    if (readingMode === "spread" && selectedSpread) {
      const firstEmpty = newDrawnCards.findIndex(c => !c);
      if (firstEmpty !== -1) newDrawnCards[firstEmpty] = newCard;
      else newDrawnCards.push(newCard);
    } else newDrawnCards.push(newCard);
    setDrawnCards(newDrawnCards);
    setDeckRemaining(newRemaining);
  };

  const handleExternalDrop = ({ targetIndex, cardIndex }) => {
    if (readingMode !== "spread" || !selectedSpread || drawnCards[targetIndex]) return;
    const newRemaining = [...deckRemaining];
    const cardData = newRemaining.splice(cardIndex, 1)[0];
    const newDrawnCards = [...drawnCards];
    while (newDrawnCards.length < targetIndex) newDrawnCards.push(null);
    newDrawnCards[targetIndex] = { id: Date.now().toString() + Math.random(), cardData, x: 0, y: 0, rotation: 0, isFlipped: false, isReversed: Math.random() < 0.25 };
    setDrawnCards(newDrawnCards);
    setDeckRemaining(newRemaining);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => { setDeckRemaining([...cards].sort(() => Math.random() - 0.5)); setDrawnCards([]); setRevealedIndices(new Set()); setIsShuffling(false); }, 1200);
  };

  const revealAll = () => {
    if (readingMode === "freeform") setDrawnCards(drawnCards.map(c => ({ ...c, isFlipped: true })));
    else setRevealedIndices(new Set(drawnCards.map((_, i) => i)));
  };

  const onCardReveal = (idx) => { const s = new Set(revealedIndices); s.add(idx); setRevealedIndices(s); };

  const openInterpretation = (cardWrapper, positionIndex = null) => {
    try {
      const output = getComposedReading();
      const validCards = drawnCards.filter(Boolean);
      const cardIndex = validCards.findIndex(c => c.id === cardWrapper.id);
      const position = selectedSpread && positionIndex !== null ? selectedSpread.positions[positionIndex] : null;
      const composed = output?.cards[cardIndex] || composeCardQuick(cardWrapper.cardData, position, cardWrapper.isReversed, questionParam || "");
      setSelectedCardForInterpretation({ ...cardWrapper, position, composed, _raw: output?._raw?.cardInterpretations?.[cardIndex] || composed?._raw, aiPrompt: output?.aiPrompts?.perCard[cardIndex] || composed?.aiPrompt });
      setAiInterpretation(null);
    } catch (e) { console.error(e); }
  };

  const getDeeperInsight = async (mode = "interpret") => {
    if (!selectedCardForInterpretation || isAiLoading) return;

    try {
      const user = await base44.auth.me();
      if (!user) {
        setAiInterpretation("CosMosis requires you to be logged in. Please log in using the button in the top right.");
        return;
      }
    } catch (e) {
      setAiInterpretation("CosMosis requires you to be logged in. Please log in using the button in the top right.");
      return;
    }

    setShowCardModePicker(false);
    setIsAiLoading(true);
    try {
      const prompt = buildCardPromptByMode(selectedCardForInterpretation._raw || selectedCardForInterpretation, questionParam || "", {}, mode);
      setAiInterpretation(await base44.integrations.Core.InvokeLLM({ prompt }));
    } catch (e) { setAiInterpretation(`CosMosis is momentarily unreachable (${e.message || "Unknown error"}).`); }
    finally { setIsAiLoading(false); }
  };

  const handleToggleFlip = (id) => setDrawnCards(drawnCards.map(c => c.id === id ? { ...c, isFlipped: !c.isFlipped } : c));

  const SidebarBtn = ({ onClick, disabled, icon, label, primary }) => (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
      padding: "10px 6px", borderRadius: 12, border: primary ? "none" : "1px solid rgba(201,168,76,0.3)",
      background: primary ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(0,0,0,0.3)",
      color: disabled ? "rgba(255,255,255,0.3)" : primary ? "white" : "rgba(201,168,76,0.9)",
      cursor: disabled ? "not-allowed" : "pointer", width: "100%",
      boxShadow: primary && !disabled ? "0 0 15px rgba(124,58,237,0.4)" : "none",
      transition: "all 0.2s",
    }}>
      {icon}
      <span style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>{label}</span>
    </button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99, width: "100%", height: "100vh", overflow: "hidden", background: "radial-gradient(ellipse at 30% 20%, #1e1b4b 0%, #0a0414 60%, #000 100%)", display: "flex", flexDirection: "column" }}>

      {/* Shuffling Overlay */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 120, height: 180 }}>
              {[0,1,2,3].map(i => (
                <motion.div key={i}
                  animate={{ x: [0, i%2===0?80:-80, 0], y: [0, (i%2===0?1:-1)*20, 0], rotate: [0, i%2===0?15:-15, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", delay: i*0.1 }}
                  style={{ position: "absolute", inset: 0, borderRadius: 12, border: "2px solid rgba(201,168,76,0.5)", overflow: "hidden" }}
                >
                  {deck?.back_image_url
                    ? <img src={deck.back_image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle, #4c1d95, #1e1b4b)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles style={{ width: 32, height: 32, color: "#c084fc" }} /></div>
                  }
                </motion.div>
              ))}
            </div>
            <p style={{ marginTop: 80, color: "#c084fc", fontFamily: "Cinzel, serif", fontSize: 18, letterSpacing: "0.2em", animation: "pulse 2s infinite" }}>Shuffling Deck...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* LEFT SIDEBAR */}
        <div style={{
          width: 64, flexShrink: 0, display: "flex", flexDirection: "column",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(201,168,76,0.15)", padding: "8px 6px", gap: 6, zIndex: 10,
        }}>
          {/* Back */}
          <Link to={createPageUrl("ReadingRoom")} style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", padding: "8px 4px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
          </Link>

          <div style={{ width: "100%", height: 1, background: "rgba(201,168,76,0.15)", margin: "2px 0" }} />

          {/* Deck name */}
          <div style={{ textAlign: "center", padding: "4px 2px" }}>
            <div style={{ fontSize: 8, color: "rgba(201,168,76,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.3, wordBreak: "break-word" }}>
              {deck?.name?.slice(0, 12)}{deck?.name?.length > 12 ? "…" : ""}
            </div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{deckRemaining.length} left</div>
          </div>

          <div style={{ width: "100%", height: 1, background: "rgba(201,168,76,0.15)", margin: "2px 0" }} />

          {/* Action buttons */}
          <SidebarBtn
            onClick={handleDrawCard}
            disabled={deckRemaining.length === 0 || (readingMode === "spread" && selectedSpread && drawnCards.length >= selectedSpread.positions.length)}
            icon={<Hand style={{ width: 18, height: 18 }} />}
            label="Draw"
            primary
          />
          <SidebarBtn
            onClick={revealAll}
            disabled={drawnCards.length === 0}
            icon={<Eye style={{ width: 16, height: 16 }} />}
            label="Reveal"
          />
          <SidebarBtn
            onClick={getSpreadInsight}
            disabled={drawnCards.length === 0}
            icon={<Sparkles style={{ width: 16, height: 16 }} />}
            label="Read"
          />
          <SidebarBtn
            onClick={handleShuffle}
            icon={<Shuffle style={{ width: 16, height: 16 }} />}
            label="Shuffle"
          />

          {readingMode === "spread" && selectedSpread && (
            <SidebarBtn
              onClick={isEditingSpread ? handleSaveSpread : () => setIsEditingSpread(true)}
              icon={isEditingSpread ? <Save style={{ width: 16, height: 16 }} /> : <Settings2 style={{ width: 16, height: 16 }} />}
              label={isEditingSpread ? "Save" : "Edit"}
            />
          )}
        </div>

        {/* CENTER — Spread Canvas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {readingMode === "freeform" ? (
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }} ref={canvasRef}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={(e) => { e.preventDefault(); try { const p = JSON.parse(e.dataTransfer.getData('application/json')); if (p?.source === 'bottom-shelf') handleDrawSpecificCard(p.cardIndex); } catch(err) {} }}
            >
              {drawnCards.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", opacity: 0.4 }}>
                  <Sparkles style={{ width: 48, height: 48, color: "#c084fc", marginBottom: 16 }} />
                  <p style={{ color: "#e9d5ff", fontSize: 18, fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>Draw a card to begin</p>
                  <p style={{ color: "rgba(192,132,252,0.6)", fontSize: 13, marginTop: 8 }}>Drag to arrange · Double-click to reveal</p>
                </div>
              )}
              <AnimatePresence>
                {drawnCards.map((drawnCard, index) => (
                  <FreeformCard key={drawnCard.id} card={{...drawnCard, zIndex: index + 10}} canvasRef={canvasRef} toggleFlip={handleToggleFlip} deck={deck} openInterpretation={openInterpretation} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }} ref={canvasRef}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={(e) => { e.preventDefault(); try { const p = JSON.parse(e.dataTransfer.getData('application/json')); if (p?.source === 'bottom-shelf') handleDrawSpecificCard(p.cardIndex); } catch(err) {} }}
            >
              {selectedSpread ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", margin: "auto", padding: 16 }}>
                  <SpreadLayout
                    spread={selectedSpread}
                    cards={drawnCards.map(c => c ? c.cardData : null)}
                    deck={deck}
                    revealedCards={revealedIndices}
                    onCardReveal={onCardReveal}
                    onCardClick={(c, idx) => { if (drawnCards[idx]) openInterpretation(drawnCards[idx], idx); }}
                    enableExternalDrops={true}
                    onExternalDrop={handleExternalDrop}
                    allowReposition={isEditingSpread}
                    onPositionUpdate={handlePositionUpdate}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                  <Sparkles style={{ width: 48, height: 48, color: "#c084fc", marginBottom: 16 }} />
                  <p style={{ color: "#e9d5ff", fontFamily: "Cinzel, serif" }}>No Spreads Available</p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Card Shelf */}
          <div style={{ flexShrink: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(201,168,76,0.15)", padding: "10px 14px", overflow: "hidden" }}>
            <BottomCardShelf
              cards={deckRemaining.map(c => ({...c, image_url: deck?.back_image_url || null, name: "Hidden Card"}))}
              onCardClick={(c, idx) => handleDrawSpecificCard(idx)}
            />
          </div>
        </div>
      </div>

      {/* Card Interpretation Panel */}
      <AnimatePresence>
        {selectedCardForInterpretation && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            style={{ position: "fixed", top: 16, right: 16, bottom: 16, width: 340, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20, boxShadow: "0 0 40px rgba(147,51,234,0.3)", overflow: "hidden", zIndex: 50, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "rgba(88,28,135,0.2)" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "Cinzel, serif", margin: 0 }}>{selectedCardForInterpretation.composed?.cardName || selectedCardForInterpretation.cardData.name}</h3>
                {selectedCardForInterpretation.position && <p style={{ fontSize: 11, color: "rgba(201,168,76,0.8)", margin: "4px 0 0" }}>Position: {selectedCardForInterpretation.position.name}</p>}
                {questionParam && <p style={{ fontSize: 11, color: "rgba(201,168,76,0.8)", margin: "4px 0 0", fontStyle: "italic" }}>"{questionParam}"</p>}
              </div>
              <button onClick={() => setSelectedCardForInterpretation(null)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedCardForInterpretation.composed?.sections
                ? selectedCardForInterpretation.composed.sections.map((sec, idx) => (
                    <div key={idx} style={{ fontSize: 13, ...(sec.isPersonal ? { background: "rgba(49,46,129,0.3)", padding: 12, borderRadius: 12, border: "1px solid rgba(99,102,241,0.3)" } : {}) }}>
                      <p style={{ fontWeight: 600, color: "rgba(192,132,252,0.9)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><span>{sec.icon}</span>{sec.label}</p>
                      <p style={{ color: "rgba(233,213,255,0.9)", lineHeight: 1.6, margin: 0 }}>{sec.content}</p>
                    </div>
                  ))
                : <p style={{ color: "rgba(233,213,255,0.9)", fontSize: 13 }}>{selectedCardForInterpretation.composed?.summary || selectedCardForInterpretation.cardData?.overall_meaning || "A mysterious force is at play."}</p>
              }
              <div style={{ paddingTop: 12, borderTop: "1px solid rgba(201,168,76,0.2)" }}>
                {!aiInterpretation && !isAiLoading ? (
                  !showCardModePicker
                    ? <button onClick={() => setShowCardModePicker(true)} style={{ width: "100%", padding: "10px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Cinzel, serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Sparkles style={{ width: 14, height: 14 }} /> CosMosis · Deepen
                      </button>
                    : <CosMosisModePicker visible={showCardModePicker} onSelect={(mode) => getDeeperInsight(mode)} onCancel={() => setShowCardModePicker(false)} />
                ) : isAiLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", gap: 12 }}>
                    <div style={{ width: 24, height: 24, border: "2px solid rgba(147,51,234,0.3)", borderTop: "2px solid #c084fc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <span style={{ color: "#c084fc", fontSize: 13, fontFamily: "Cinzel, serif" }}>CosMosis is listening...</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "rgba(233,213,255,0.9)", background: "rgba(49,46,129,0.3)", padding: 16, borderRadius: 12, border: "1px solid rgba(99,102,241,0.3)" }}>
                    <p style={{ fontWeight: 600, color: "#67e8f9", marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}><Sparkles style={{ width: 14, height: 14 }} />CosMosis</p>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{aiInterpretation}</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spread Interpretation Modal */}
      <AnimatePresence>
        {showSpreadInterpretation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: "#0f0a1e", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, boxShadow: "0 0 60px rgba(147,51,234,0.3)", overflow: "hidden", width: "100%", maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 16, borderBottom: "1px solid rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(88,28,135,0.3)" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", fontFamily: "Cinzel, serif", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <Sparkles style={{ width: 20, height: 20, color: "#c084fc" }} />Reading Interpretation
                </h3>
                <button onClick={() => setShowSpreadInterpretation(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {questionParam && (
                  <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 8 }}>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px 0" }}>Your Question</p>
                    <p style={{ color: "white", fontSize: 15, fontFamily: "Cinzel, serif", margin: 0 }}>{questionParam}</p>
                  </div>
                )}
                {/* Individual Cards Interpretation */}
                {composedReading && composedReading.cards && composedReading.cards.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
                    <h4 style={{ fontWeight: 700, color: "white", fontFamily: "Cinzel, serif", fontSize: 15, borderBottom: "1px solid rgba(201,168,76,0.3)", paddingBottom: 8, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles style={{ width: 16, height: 16, color: "#c084fc" }} /> The Cards
                    </h4>
                    {composedReading.cards.map((card, idx) => {
                      const positionText = card.sections?.find(s => s.type === "position")?.content;
                      return (
                        <div key={idx} style={{ padding: 16, borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)" }}>
                          <h5 style={{ color: "#e9d5ff", fontSize: 14, fontWeight: 600, fontFamily: "Cinzel, serif", margin: "0 0 4px 0" }}>
                            {idx + 1}. {card.cardName} {card.isReversed && "↩"}
                          </h5>
                          {positionText && (
                            <p style={{ color: "rgba(201,168,76,0.8)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>
                              {positionText}
                            </p>
                          )}
                          <p style={{ color: "rgba(233,213,255,0.9)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                            {card.summary || card.sections?.find(s => s.type === "meaning")?.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {composedReading && composedReading.synthesis.sections.map((sec, idx) => {
                  const bgMap = { tone: "rgba(88,28,135,0.2)", themes: "rgba(49,46,129,0.2)", synthesis: "rgba(30,27,75,0.6)", resonances: "rgba(19,78,74,0.2)", tensions: "rgba(127,29,29,0.2)", ching: "rgba(120,53,15,0.2)", personal: "rgba(49,46,129,0.3)" };
                  const colorMap = { tone: "#c084fc", themes: "#818cf8", synthesis: "#e9d5ff", resonances: "#5eead4", tensions: "#fca5a5", ching: "#fcd34d", personal: "#818cf8" };
                  return (
                    <div key={idx} style={{ padding: 16, borderRadius: 12, background: bgMap[sec.type] || "rgba(88,28,135,0.2)", border: `1px solid ${colorMap[sec.type] || "#c084fc"}33` }}>
                      <h4 style={{ fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: "Cinzel, serif", color: colorMap[sec.type] || "#c084fc" }}>
                        <span style={{ fontSize: 16 }}>{sec.icon}</span>{sec.label}
                      </h4>
                      <p style={{ color: "rgba(233,213,255,0.9)", lineHeight: 1.6, fontSize: 13, margin: 0 }}>{sec.content}</p>
                      {sec.tags && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {sec.tags.map((tag, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(88,28,135,0.4)", color: "#c084fc", border: "1px solid rgba(192,132,252,0.3)", fontFamily: "Cinzel, serif" }}>{tag}</span>)}
                      </div>}
                    </div>
                  );
                })}
                <div style={{ paddingTop: 16, borderTop: "1px solid rgba(201,168,76,0.2)" }}>
                  {!spreadInterpretation && !isSpreadAiLoading ? (
                    !showSpreadModePicker
                      ? <button onClick={() => setShowSpreadModePicker(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Cinzel, serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Sparkles style={{ width: 16, height: 16 }} /> CosMosis · Full Reading
                        </button>
                      : <CosMosisModePicker visible={showSpreadModePicker} onSelect={(mode) => handleDeepenSpread(mode)} onCancel={() => setShowSpreadModePicker(false)} />
                  ) : isSpreadAiLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 12 }}>
                      <div style={{ width: 32, height: 32, border: "2px solid rgba(147,51,234,0.3)", borderTop: "2px solid #c084fc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <p style={{ color: "#c084fc", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>CosMosis is weaving your reading...</p>
                    </div>
                  ) : (
                    <div style={{ color: "rgba(233,213,255,0.9)", whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13, background: "rgba(49,46,129,0.3)", padding: 20, borderRadius: 12, border: "1px solid rgba(99,102,241,0.3)" }}>
                      <p style={{ fontWeight: 600, color: "#67e8f9", marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}><Sparkles style={{ width: 14, height: 14 }} />CosMosis</p>
                      {spreadInterpretation}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}