import React from 'react';
import SigilForgeComponent from '@/components/reading/SigilForge';

export default function SigilForge() {
  return (
    <div className="min-h-screen pt-6 pb-24 md:p-8 font-serif" style={{ backgroundColor: '#07050f' }}>
      <div className="max-w-[100rem] mx-auto px-4 md:px-0">
        <h1 
          className="text-3xl md:text-4xl font-bold text-amber-500 mb-6 text-center"
          style={{ fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(193,122,58,0.3)' }}
        >
          Sigil Forge
        </h1>
        <p className="text-center text-[#8B7D6B] italic mb-8" style={{ fontFamily: "'IM Fell English', serif" }}>
          Draw your symbol, mirror your intent, and forge it into the ancient stone.
        </p>
        <SigilForgeComponent />
      </div>
    </div>
  );
}