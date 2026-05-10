import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SigilForgeComponent from '@/components/reading/SigilForge';

import DisablePullToRefresh from '@/components/common/DisablePullToRefresh';

export default function SigilForge() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 md:p-8 font-serif" style={{ backgroundColor: '#07050f' }}>
      <DisablePullToRefresh targetSelector="body" />
      <style>{`
        .mode-tabs {
          display: flex; gap: 0; background: rgba(22,15,42,0.8); border-bottom: 1px solid rgba(160,120,255,0.16);
          position: sticky; top: 0; z-index: 90; backdrop-filter: blur(10px); margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .mode-tabs { margin: 0; margin-bottom: 24px; }
        }
        .mode-tab {
          flex: 1; padding: 14px 0; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.16em;
          text-transform: uppercase; color: rgba(180,160,220,0.6); border: none; background: none; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.25s; text-align: center;
        }
        .mode-tab.on { color: #c9a84c; border-bottom-color: #c9a84c; background: rgba(201,168,76,0.05); }
        .mode-tab:hover:not(.on) { color: rgba(201,168,76,0.8); background: rgba(201,168,76,0.02); }
      `}</style>
      <div className="mode-tabs">
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SpiritWheel`))}>Spin</button>
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SpiritWheel?tab=config`))}>Configure</button>
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SpiritWheelDesigner`))}>Designer</button>
        <button className="mode-tab on">Forge</button>
      </div>

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