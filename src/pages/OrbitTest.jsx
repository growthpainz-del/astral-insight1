import React, { useState } from 'react';
import OrbitWheelDraw from '@/components/reading/OrbitWheelDraw';

export default function OrbitTest() {
  const [log, setLog] = useState([]);

  const handleCardCaptured = async (vertexIndex, captureOrderIndex) => {
    setLog(prev => [...prev, `Pulse reached vertex ${vertexIndex+1}, capturing card ${captureOrderIndex+1}...`]);
    
    // Simulate network/db delay to resolve card identity
    await new Promise(r => setTimeout(r, 800));
    
    setLog(prev => [...prev, `Resolved card for vertex ${vertexIndex+1}!`]);
    return {
      name: `Card ${captureOrderIndex + 1}`,
      image_url: `https://picsum.photos/seed/${captureOrderIndex + 1}/200/300`
    };
  };

  const handleComplete = (capturedCards) => {
    setLog(prev => [...prev, `Sequence complete! All ${capturedCards.length} cards resolved.`]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2 text-purple-300">Orbit Wheel Draw Mechanic</h1>
      <p className="text-white/50 mb-8 max-w-md text-center text-sm">
        Testing the decoupled capture physics layer. Cards spin independently and capture to vertices.
      </p>

      <div className="w-full max-w-lg mb-8 border border-white/10 rounded-2xl bg-black/30 backdrop-blur-sm p-4">
        <OrbitWheelDraw 
          spreadSize={5}
          orbitCount={18}
          pulseInterval={2000}
          onCardCaptured={handleCardCaptured}
          onComplete={handleComplete}
        />
      </div>

      <div className="w-full max-w-lg bg-black/50 border border-white/10 rounded-xl p-4 h-48 overflow-y-auto">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Event Log</h3>
        {log.map((msg, i) => (
          <div key={i} className="text-sm text-white/80 font-mono mb-1">&gt; {msg}</div>
        ))}
      </div>
    </div>
  );
}