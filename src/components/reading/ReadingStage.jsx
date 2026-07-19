import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Hand, X, Sparkles } from 'lucide-react';

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
    </div>
  );
}