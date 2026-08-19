import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Hand, X, Sparkles, Palette } from 'lucide-react';
import { composeCardQuick } from '@/utils/interpretationComposer';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const MAT_STYLES = {
  nebula: {
    label: 'Nebula',
    swatch: 'radial-gradient(circle at 30% 30%, #4c2a8a, #07050f)',
    background: 'radial-gradient(circle at center, #1a0f35 0%, #07050f 100%)',
    gridColor: '#a078ff',
    gridOpacity: 0.1
  },
  midnight_velvet: {
    label: 'Midnight Velvet',
    swatch: 'radial-gradient(circle at 30% 30%, #1e1033, #05030a)',
    background: 'radial-gradient(ellipse at center, #150a28 0%, #030106 100%)',
    gridColor: '#6d4fc9',
    gridOpacity: 0.05
  },
  rose_gold: {
    label: 'Rose Gold',
    swatch: 'radial-gradient(circle at 30% 30%, #7a3b4a, #2a1015)',
    background: 'radial-gradient(circle at center, #3a1a24 0%, #180a0e 100%)',
    gridColor: '#e8b4a0',
    gridOpacity: 0.08
  },
  moonlit_linen: {
    label: 'Moonlit Linen',
    swatch: 'radial-gradient(circle at 30% 30%, #4a4a5a, #26262f)',
    background: 'radial-gradient(circle at center, #3a3a48 0%, #1c1c24 100%)',
    gridColor: '#c9c9d9',
    gridOpacity: 0.07
  },
  forest_moss: {
    label: 'Forest Moss',
    swatch: 'radial-gradient(circle at 30% 30%, #1f3a2a, #0a1710)',
    background: 'radial-gradient(circle at center, #16281c 0%, #070d0a 100%)',
    gridColor: '#7fb896',
    gridOpacity: 0.08
  },
  starfield_black: {
    label: 'Starfield',
    swatch: 'radial-gradient(circle at 30% 30%, #0d0d12, #000000)',
    background: 'radial-gradient(circle at center, #0a0a10 0%, #000000 100%)',
    gridColor: '#ffffff',
    gridOpacity: 0.04
  }
};

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
  const [isShuffling, setIsShuffling] = useState(false);
  const [matStyleKey, setMatStyleKey] = useState(session?.mat_style || 'nebula');
  const [showMatPicker, setShowMatPicker] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 320, height: 380 });
  const prevPositionsRef = useRef(positions);
  const tableContainerRef = useRef(null);
  const dragControls = useDragControls();
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const activeMat = MAT_STYLES[matStyleKey] || MAT_STYLES.nebula;

  const chooseMatStyle = async (key) => {
    setMatStyleKey(key);
    setShowMatPicker(false);
    if (interactive && session?.id) {
      try {
        await base44.entities.ReadingSession.update(session.id, { mat_style: key });
      } catch (err) {
        console.error('Failed to save mat style', err);
      }
    }
  };

  // Trigger shuffle animation on new session load if table is empty
  useEffect(() => {
    if (interactive && positions.length === 0) {
      setIsShuffling(true);
      const timer = setTimeout(() => setIsShuffling(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [session?.id, interactive]);

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
          if (event.data.mat_style) {
            setMatStyleKey(event.data.mat_style);
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
    if (session?.mat_style) {
      setMatStyleKey(session.mat_style);
    }
  }, [session?.card_positions, session?.shared_interpretation, session?.mat_style]);

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
    
    const drawnCardIds = new Set(positions.map(p => p.card_id));
    const availableCards = deckCards.filter(c => !drawnCardIds.has(c.id));
    
    if (availableCards.length === 0) {
      alert("No more cards left in the deck!");
      return;
    }

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
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

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: panelSize.width,
      height: panelSize.height
    };
    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', stopResize);
  };

  const handleResizeMove = (e) => {
    if (!resizingRef.current) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;
    setPanelSize({
      width: Math.max(260, Math.min(560, resizeStartRef.current.width + dx)),
      height: Math.max(220, Math.min(700, resizeStartRef.current.height + dy))
    });
  };

  const stopResize = () => {
    resizingRef.current = false;
    window.removeEventListener('pointermove', handleResizeMove);
    window.removeEventListener('pointerup', stopResize);
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
    <div ref={tableContainerRef} className="flex flex-col w-full h-[60vh] md:h-[70vh] bg-[#07050f] border border-[#a078ff]/30 rounded-xl overflow-hidden shadow-2xl relative mb-8">
      <div className="flex-1 relative overflow-hidden" style={{ background: activeMat.background }}>
        <div
          className="absolute inset-0 bg-[size:4rem_4rem]"
          style={{
            opacity: activeMat.gridOpacity,
            backgroundImage: `linear-gradient(to right, ${activeMat.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${activeMat.gridColor} 1px, transparent 1px)`
          }}
        ></div>

        {interactive && (
          <div className="absolute top-3 right-3 z-30">
            <button
              onClick={() => setShowMatPicker((v) => !v)}
              className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-purple-200 hover:text-cyan-300 hover:border-cyan-400/50 transition-colors backdrop-blur-sm"
              title="Change mat style"
            >
              <Palette className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMatPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  className="absolute right-0 mt-2 p-3 rounded-xl bg-[#0c081c]/95 border border-purple-500/40 backdrop-blur-md shadow-xl w-[220px]"
                >
                  <p className="text-[10px] uppercase tracking-widest text-purple-300/60 mb-2">Mat Style</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(MAT_STYLES).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => chooseMatStyle(key)}
                        className={`flex flex-col items-center gap-1 group`}
                        title={style.label}
                      >
                        <span
                          className={`w-9 h-9 rounded-full border-2 transition-all ${matStyleKey === key ? 'border-cyan-400 scale-110' : 'border-white/20 group-hover:border-white/50'}`}
                          style={{ background: style.swatch }}
                        />
                        <span className="text-[9px] text-purple-200/70 text-center leading-tight">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {isShuffling ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-40">
             <div className="w-32 h-48 relative perspective-1000">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
                    }}
                    initial={{ x: 0, y: 0, rotateZ: 0, scale: 1 }}
                    animate={{
                      x: [0, (i % 2 === 0 ? 1 : -1) * (50 + i * 5), 0],
                      y: [0, -10 + i * 3, 0],
                      rotateZ: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 2), 0],
                      scale: [1, 1.05, 1],
                      zIndex: [1, i % 2 === 0 ? 10 : 5, 1]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: 4,
                      ease: "easeInOut",
                      delay: i * 0.05
                    }}
                  />
                ))}
             </div>
             <p className="mt-8 text-cyan-300 tracking-widest uppercase font-bold animate-pulse" style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 10px rgba(6,182,212,0.5)" }}>
               Shuffling Deck...
             </p>
          </div>
        ) : null}

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

      <div className="p-2 sm:p-4 bg-[#1a0f35]/95 border-t border-[#a078ff]/30 flex flex-col sm:flex-row items-center justify-between gap-2 backdrop-blur-md relative z-20 shrink-0">
        <div className="text-[10px] sm:text-xs text-purple-300 text-center sm:text-left shrink-0">
          <span className="opacity-70">{interactive ? "Drag • Double-click flip" : "Watching Reader's Table"}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide justify-start sm:justify-end shrink-0">
          {interactive && (
            <>
              <Button variant="outline" size="sm" onClick={clearTable} className="border-red-500/50 text-red-300 hover:bg-red-500/20 whitespace-nowrap px-2">
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                if (!interactive) return;
                if (positions.length > 0) {
                  if (window.confirm("Clear table and reshuffle deck?")) {
                    savePositions([]);
                    if (session?.id) base44.entities.ReadingSession.update(session.id, { shared_interpretation: null });
                    setSharedInterpretation(null);
                    setShowInterpretation(false);
                  } else {
                    return;
                  }
                }
                setIsShuffling(true);
                setTimeout(() => setIsShuffling(false), 2400);
              }} className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 whitespace-nowrap px-2">
                Shuffle
              </Button>
              <Button size="sm" onClick={drawCard} className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)] whitespace-nowrap px-3">
                <Hand className="w-4 h-4 mr-1 hidden sm:block" />
                Draw
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={interpretReading} disabled={interpreting || !positions.length} className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 whitespace-nowrap px-2">
            <Sparkles className="w-4 h-4 mr-1 hidden sm:block" />
            {interpreting ? 'Reading...' : sharedInterpretation ? 'Re-interpret' : 'Interpret'}
          </Button>
          {sharedInterpretation && !showInterpretation && (
            <Button size="sm" variant="outline" onClick={() => setShowInterpretation(true)} className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 whitespace-nowrap px-2">
              View
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

      {/* Card Interpretation Panel — floating, draggable, resizable, anchored left by default */}
      <AnimatePresence>
        {selectedCardForInterpretation && (
          <motion.div
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={tableContainerRef}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute z-50 flex flex-col overflow-hidden shadow-2xl"
            style={{
              left: 16,
              top: 16,
              width: panelSize.width,
              height: panelSize.height,
              maxWidth: 'calc(100% - 32px)',
              maxHeight: 'calc(100% - 32px)',
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 16, boxShadow: "0 0 40px rgba(147,51,234,0.3)"
            }}>
            <div
              className="p-4 pr-12 border-b border-[#c9a84c]/20 flex justify-between items-start bg-purple-900/30 relative shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <h3 className="text-base font-bold text-white font-['Cinzel'] m-0 leading-tight break-words w-full">
                {selectedCardForInterpretation.composed?.cardName || selectedCardForInterpretation.cardData.name}
              </h3>
              <button 
                onClick={() => setSelectedCardForInterpretation(null)} 
                className="absolute top-3 right-3 text-white/60 hover:text-white bg-black/40 hover:bg-black/80 rounded-full border border-white/10 cursor-pointer p-1.5 z-10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedCardForInterpretation.composed?.sections
                ? selectedCardForInterpretation.composed.sections.map((sec, idx) => (
                    <div key={idx} className="break-words" style={{ fontSize: 13, ...(sec.isPersonal ? { background: "rgba(49,46,129,0.3)", padding: 12, borderRadius: 12, border: "1px solid rgba(99,102,241,0.3)" } : {}) }}>
                      <p style={{ fontWeight: 600, color: "rgba(192,132,252,0.9)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><span>{sec.icon}</span>{sec.label}</p>
                      <p className="break-words" style={{ color: "rgba(233,213,255,0.9)", lineHeight: 1.6, margin: 0 }}>{sec.content}</p>
                    </div>
                  ))
                : <p className="break-words" style={{ color: "rgba(233,213,255,0.9)", fontSize: 13 }}>{selectedCardForInterpretation.composed?.summary || selectedCardForInterpretation.cardData?.overall_meaning || "A mysterious force is at play."}</p>
              }
            </div>
            {/* Resize handle */}
            <div
              onPointerDown={startResize}
              className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1.5 text-white/30 hover:text-cyan-300 transition-colors touch-none"
              title="Drag to resize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}