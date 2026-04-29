import React, { useState } from 'react';
import CanvasSpiritWheel from '@/components/reading/CanvasSpiritWheel';
import { Button } from '@/components/ui/button';

export default function SpiritWheelCanvasTest() {
  const [rotations, setRotations] = useState({ outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0 });
  const [isSpinning, setIsSpinning] = useState(false);

  const wheelData = {
    outer1: [
      { id: '1', label: 'Card 1', color: '#8b5cf6' },
      { id: '2', label: 'Card 2', color: '#c084fc' }
    ],
    outer2: [
      { id: '3', label: 'Card 3', color: '#a855f7' },
      { id: '4', label: 'Card 4', color: '#d8b4fe' }
    ],
    middle: [
      { id: '5', label: 'Timing', color: '#06b6d4' },
      { id: '6', label: 'Action', color: '#22d3ee' }
    ],
    inner: [
      { id: '7', label: 'Yes', color: '#ec4899' },
      { id: '8', label: 'No', color: '#f472b6' }
    ],
    rune: [
      { id: 'Fehu', label: 'Fehu' },
      { id: 'Uruz', label: 'Uruz' }
    ]
  };

  const activeTheme = {
    outerBg: '#0f172a',
    outerBorder: '#d4af37',
    textOuter: '#fff',
    middleBg: '#1e1b4b',
    middleBorder: '#d4af37',
    textMiddle: '#fff',
    innerBg: '#3b0764',
    innerBorder: '#d4af37',
    textInner: '#fff',
    hubBg: '#000',
    hubBorder: '#d4af37',
    hubIcon: '👁️',
    fontFamily: 'serif',
    borderThickness: 2
  };

  const spin = () => {
    setIsSpinning(true);
    setRotations({
      outer1: rotations.outer1 + 1080 + Math.random() * 360,
      outer2: rotations.outer2 - 1080 - Math.random() * 360,
      middle: rotations.middle + 720 + Math.random() * 360,
      inner: rotations.inner - 720 - Math.random() * 360,
      rune: rotations.rune + 1440 + Math.random() * 360
    });
    setTimeout(() => setIsSpinning(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl text-amber-500 font-bold mb-8">Canvas Engine Test</h1>
      <div className="w-full max-w-2xl aspect-square relative mb-8">
        <CanvasSpiritWheel 
          wheelData={wheelData}
          rotations={rotations}
          activeTheme={activeTheme}
          metatron={{ enabled: true, color: 'rgba(212, 175, 55, 0.4)', rotation: 0 }}
          zoomLevel={1}
          isSpinning={isSpinning}
        />
      </div>
      <Button onClick={spin} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-4">
        Test Canvas Spin
      </Button>
    </div>
  );
}