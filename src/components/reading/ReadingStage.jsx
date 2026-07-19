import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Hand, X, Sparkles } from 'lucide-react';
import { composeCardQuick } from '@/utils/interpretationComposer';
import { motion, AnimatePresence } from 'framer-motion';

const TableCard = ({ 
  cardData, 
  fullCard, 
  interactive,
  onUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const handlePointerDown = (e) => {
    if (!interactive) return;
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !interactive) return;
    const parent = cardRef.current.parentElement;
    const rect = parent.getBoundingClientRect();
    
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;
    
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    onUpdate({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!interactive) return;
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleFlip = () => {
    if (!interactive) return;
    onUpdate({ revealed: !cardData.revealed });
  };

  const handleClick = (e) => {
    // If it's a double click, it might trigger click too, but we handle logic in parent
    if (cardData.revealed && onUpdate) {
      onUpdate({ _action: 'click' });
    }
  };

  const renderCardFace = () => {
    if (!fullCard) return <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center text-[10px] text-center p-1 border border-slate-600 rounded shadow-lg">Unknown</div>;
    return (
      <div 
        className="w-full h-full rounded overflow-hidden bg-black shadow-lg border border-purple-500/30 flex flex-col"
        style={{ backgroundImage: `url(${fullCard.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {!fullCard.image_url && (
          <div className="flex-1 flex items-center justify-center p-1 text-center text-[10px] font-bold text-white bg-gradient-to-b from-purple-900 to-black">
            {fullCard.name}
          </div>
        )}
      </div>
    );
  };

  const renderCardBack = () => (
    <div className="w-full h-full rounded bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center">
      <div className="w-6 h-10 border border-indigo-300/30 rounded-full opacity-50"></div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`absolute w-[4.5rem] h-[7.5rem] md:w-[6rem] md:h-[10rem] transition-transform duration-200 ${isDragging ? 'z-50 scale-110 cursor-grabbing' : 'z-10 cursor-grab hover:scale-105'}`}
      style={{
        left: `${cardData.x}%`,
        top: `${cardData.y}%`,
        transform: `translate(-50%, -50%) rotate(${cardData.rotation || 0}deg)`,
        touchAction: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleFlip}
      onClick={handleClick}
    >
      <div 
        className="w-full h-full relative transition-all duration-500"
        style={{ transformStyle: 'preserve-3d', transform: cardData.revealed ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
      >
        <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          {renderCardFace()}
        </div>
        <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {renderCardBack()}
        </div>
      </div>
    </div>
  );
};

export default function ReadingStage({ session, interactive, deckCards }) {
  const [positions, setPositions] = useState(session?.card_positions || []);
  const [interpreting, setInterpreting] = useState(false);
  const [sharedInterpretation, setSharedInterpretation] = useState(session?.shared_interpretation || null);
  const [showInterpretation, setShowInterpretation] = useState(!!session?.shared_interpretation);
  const [selectedCardForInterpretation, setSelectedCardForInterpretation] = useState(null);
  const prevPositionsRef = useRef(positions);

  useEffect(() => {
    // Detect newly revealed cards
    const prev = prevPositionsRef.current;
    if (prev && positions) {
      for (let i = 0; i < positions.length; i++) {
        if (positions[i].revealed && prev[i] && !prev[i].revealed) {
          // Card was just flipped! Show interpretation.
          const cardData = deckCards?.find(c => c.id === positions[i].card_id);
          if (cardData) {
            const composed = composeCardQuick(cardData, null, false, "");
            setSelectedCardForInterpretation({ cardData, composed });
          }
          break; // Only open one at a time
        }
      }
    }
    prevPositionsRef.current = positions;
  }, [positions, deckCards]);

  const interpretReading = async () => {
    if (!positions.length) return;
    setInterpreting(true);
    try {
      const cardNames = positions.map(pos => {
        const c = deckCards?.find(dc => dc.id === pos.card_id);
        return c ? `${c.name}${!pos.revealed ? ' (Face Down)' : ''}` : 'Unknown Card';
      });
      
      const prompt = `You are a mystical tarot reader. Interpret these cards currently on the reading table: ${cardNames.join(', ')}. Provide a concise, insightful reading focusing on the combined energy of these cards. Keep it to 2-3 short paragraphs, formatted gracefully. Do not mention that they are face down unless it signifies something hidden.`;
      
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      if (session?.id) {
        await base44.entities.ReadingSession.update(session.id, { shared_interpretation: res });
      }
      setSharedInterpretation(res);
      setShowInterpretation(true);
    } catch (e) {
      console.error(e);
      alert('Failed to interpret reading.');
    } finally {
      setInterpreting(false);
    }
  };

  useEffect(() => {
    if (session?.id) {
      const unsub = base44.entities.ReadingSession.subscribe((event) => {
        if (event.id === session.id && event.type === 'update') {
          if (event.data.card_positions) {
            setPositions(event.data.card_positions);
          }
          if (event.data.shared_interpretation !== undefined) {
            setSharedInterpretation(event.data.shared_interpretation);
            if (event.data.shared_interpretation) {
               setShowInterpretation(true);
            } else {
               setShowInterpretation(false);
            }
          }
        }
      });
      return unsub;
    }
  }, [session?.id]);

  useEffect(() => {
    setPositions(session?.card_positions || []);
    if (session?.shared_interpretation !== undefined) {
      setSharedInterpretation(session?.shared_interpretation);
      if (session?.shared_interpretation) setShowInterpretation(true);
    }
  }, [session?.card_positions, session?.shared_interpretation]);

  const savePositions = async (newPos) => {
    setPositions(newPos);
    if (interactive && session?.id) {
      try {
        await base44.entities.ReadingSession.update(session.id, { card_positions: newPos });
      } catch (err) {
        console.error("Failed to sync positions", err);
      }
    }
  };

  const drawCard = () => {
    if (!interactive || !deckCards?.length) return;
    const randomCard = deckCards[Math.floor(Math.random() * deckCards.length)];
    const newCard = {
      card_id: randomCard.id,
      x: 50 + (Math.random() * 10 - 5),
      y: 50 + (Math.random() * 10 - 5),
      rotation: Math.random() * 20 - 10,
      revealed: false,
      label: ''
    };
    savePositions([...positions, newCard]);
  };

  const updateCard = (index, updates) => {
    if (updates._action === 'click') {
      const pos = positions[index];
      const cardData = deckCards?.find(c => c.id === pos.card_id);
      if (cardData && pos.revealed) {
        const composed = composeCardQuick(cardData, null, false, "");
        setSelectedCardForInterpretation({ cardData, composed });
      }
      return;
    }
    const newPos = [...positions];
    newPos[index] = { ...newPos[index], ...updates };
    savePositions(newPos);
  };

  const clearTable = () => {
    if (!interactive) return;
    if (window.confirm("Clear all cards?")) {
      savePositions([]);
      if (session?.id) {
        base44.entities.ReadingSession.update(session.id, { shared_interpretation: null });
      }
      setSharedInterpretation(null);
      setShowInterpretation(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[60vh] md:h-[70vh] bg-[#07050f] border border-[#a078ff]/30 rounded-xl overflow-hidden shadow-2xl relative mb-8">
      <div className="flex-1 relative overflow-hidden" style={{ background: 'radial-gradient(circle at center, #1a0f35 0%, #07050f 100%)' }}>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#a078ff_1px,transparent_1px),linear-gradient(to_bottom,#a078ff_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {positions.map((pos, idx) => (
          <TableCard 
            key={idx}
            cardData={pos}
            fullCard={deckCards?.find(c => c.id === pos.card_id)}
            interactive={interactive}
            onUpdate={(updates) => updateCard(idx, updates)}
          />
        ))}
        {!positions.length && interactive && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
             <span className="text-purple-300 text-lg tracking-widest font-['Cinzel']">Draw a card to begin</span>
           </div>
        )}
        {!positions.length && !interactive && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
             <span className="text-purple-300 text-lg tracking-widest font-['Cinzel']">Waiting for reader to draw...</span>
           </div>
        )}
      </div>

      <div className="p-3 sm:p-4 bg-[#1a0f35]/95 border-t border-[#a078ff]/30 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
        <div className="text-xs text-purple-300 text-center sm:text-left">
          <span className="opacity-70">{interactive ? "Drag to move • Double-click to flip" : "Watching Reader's Table"}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {interactive && (
            <>
              <Button variant="outline" size="sm" onClick={clearTable} className="border-red-500/50 text-red-300 hover:bg-red-500/20">
                Clear
              </Button>
              <Button size="sm" onClick={drawCard} className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]">
                <Hand className="w-4 h-4 mr-1" />
                Draw
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={interpretReading} disabled={interpreting || !positions.length} className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
            <Sparkles className="w-4 h-4 mr-1" />
            {interpreting ? 'Reading...' : sharedInterpretation ? 'Re-interpret' : 'Interpret'}
          </Button>
          {sharedInterpretation && !showInterpretation && (
            <Button size="sm" variant="outline" onClick={() => setShowInterpretation(true)} className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20">
              View Reading
            </Button>
          )}
        </div>
      </div>

      {showInterpretation && sharedInterpretation && (
        <div className="absolute inset-0 z-50 bg-[#07050f]/95 p-6 overflow-y-auto backdrop-blur-sm animate-in fade-in flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-[#a078ff]/20 pb-4">
            <h3 className="text-xl font-bold text-cyan-300 font-['Cinzel'] flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Table Interpretation
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowInterpretation(false)} className="text-purple-300 hover:text-white hover:bg-red-500/20 rounded-full p-2 h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-purple-100 text-sm leading-relaxed whitespace-pre-wrap max-w-2xl mx-auto">
            {sharedInterpretation}
          </div>
        </div>
      )}

      {/* Card Interpretation Panel */}
      <AnimatePresence>
        {selectedCardForInterpretation && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute inset-4 md:inset-auto md:top-4 md:right-4 md:bottom-4 md:w-[300px] z-50 flex flex-col overflow-hidden"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20, boxShadow: "0 0 40px rgba(147,51,234,0.3)" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "rgba(88,28,135,0.2)" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "Cinzel, serif", margin: 0 }}>{selectedCardForInterpretation.composed?.cardName || selectedCardForInterpretation.cardData.name}</h3>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}