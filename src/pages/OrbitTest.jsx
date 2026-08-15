import React, { useState, useRef } from 'react';
import OrbitWheelDraw from '@/components/reading/OrbitWheelDraw';
import { drawLiveCard } from '@/utils/liveDraw';

// Stand-in "deck" — 22 Major Arcana. This pool starts unordered and is
// never shuffled up front; each tap draws live from whatever's left.
const DEMO_DECK = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
].map((name, i) => ({
  id: `major-${i}`,
  name,
  image_url: `https://picsum.photos/seed/${encodeURIComponent(name)}/200/300`
}));

export default function OrbitTest() {
  const [log, setLog] = useState([]);
  // The live, shrinking pool. A ref because it needs to be read-and-mutated
  // synchronously at tap time, not through a React state update cycle.
  const poolRef = useRef([...DEMO_DECK]);

  const handleCardCaptured = async (vertexIndex, captureOrderIndex, moment) => {
    setLog(prev => [...prev, `Tap registered for vertex ${vertexIndex + 1} — resolving live...`]);

    // Simulate a network/db round trip for artwork/meaning lookup. Note:
    // the draw itself already happened above, synchronously, before this
    // delay — the delay is just fetching the display data for whatever
    // was already drawn.
    const { card, remainingPool, provenance } = drawLiveCard(poolRef.current, moment);
    poolRef.current = remainingPool;

    await new Promise(r => setTimeout(r, 500));

    setLog(prev => [
      ...prev,
      `→ ${card.name} — drawn live at ring angle ${provenance?.ringAngleAtTap?.toFixed(1)}°, ` +
      `t=${provenance?.drawnAt?.toFixed(0)}ms. ${remainingPool.length} cards left in pool.`
    ]);

    return card;
  };

  const handleComplete = (capturedCards) => {
    setLog(prev => [...prev, `Sequence complete! All ${capturedCards.length} cards resolved live, no repeats.`]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2 text-purple-300">Orbit Wheel Draw Mechanic</h1>
      <p className="text-white/50 mb-8 max-w-md text-center text-sm">
        Tap cards directly from the ring. Each identity is drawn live, at the moment of the tap,
        from a shrinking 22-card pool — never pre-shuffled or pre-decided.
      </p>

      <div className="w-full max-w-lg mb-8 border border-white/10 rounded-2xl bg-black/30 backdrop-blur-sm p-4">
        <OrbitWheelDraw 
          spreadSize={5}
          orbitCount={18}
          onCardCaptured={handleCardCaptured}
          onComplete={handleComplete}
          showVertexLabels={false}
          showOrbitTrack={false}
        />
      </div>

      <div className="w-full max-w-lg bg-black/50 border border-white/10 rounded-xl p-4 h-56 overflow-y-auto">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Event Log</h3>
        {log.map((msg, i) => (
          <div key={i} className="text-sm text-white/80 font-mono mb-1">&gt; {msg}</div>
        ))}
      </div>
    </div>
  );
}
