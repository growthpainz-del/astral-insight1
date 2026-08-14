import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function OrbitWheelDraw({
  spreadSize = 3,
  orbitCount = 18,
  onCardCaptured,
  onComplete,
  deckBackImage = "https://media.base44.com/images/public/68d2a300021f94d0f312c039/87ddf47a1_2EC745CC-69B3-47EE-AC3A-6F29ABBF057F.png",
  spinSpeed = 0.08,
  pulseInterval = 2000,
}) {
  const [phase, setPhase] = useState('idle');
  const [capturedSlots, setCapturedSlots] = useState([]);
  const [orbiting, setOrbiting] = useState([]);
  const [activePulse, setActivePulse] = useState(null);

  const ringRotation = useRef(0);
  const lastTime = useRef(performance.now());
  const animRef = useRef();
  const ringRef = useRef();
  
  const orbitRef = useRef([]);
  const capturedRef = useRef([]);

  useEffect(() => {
    const initial = Array.from({ length: orbitCount }).map((_, i) => ({
      id: i,
      baseAngle: (360 / orbitCount) * i
    }));
    setOrbiting(initial);
    orbitRef.current = initial;
  }, [orbitCount]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const getShortestDistance = (a, b) => {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  };

  const getVertexPosition = (index, radius) => {
    const angle = (360 / spreadSize) * index;
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
  };

  const startSpin = () => {
    setPhase('spinning');
    lastTime.current = performance.now();
    
    const loop = (time) => {
      const dt = time - lastTime.current;
      lastTime.current = time;
      ringRotation.current = (ringRotation.current + spinSpeed * dt) % 360;
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) rotate(${ringRotation.current}deg)`;
        const children = ringRef.current.children;
        for (let i = 0; i < children.length; i++) {
          children[i].style.transform = children[i].dataset.basestyles + ` rotate(${-ringRotation.current}deg)`;
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    runPulseSequence();
  };

  const runPulseSequence = async () => {
    for (let i = 0; i < spreadSize; i++) {
      // 1. Wait for interval (minus pulse animation time)
      await new Promise(r => setTimeout(r, pulseInterval - 500));
      if (!orbitRef.current.length) break;

      // 2. Fire pulse visual
      const pos = getVertexPosition(i, 160);
      setActivePulse({ id: i, to: pos });
      
      // wait for pulse travel
      await new Promise(r => setTimeout(r, 500));
      setActivePulse(null);

      // 3. Capture logic
      const vertexAngle = (360 / spreadSize) * i;
      let closestCard = null;
      let minDistance = Infinity;
      let closestIndex = -1;

      orbitRef.current.forEach((card, idx) => {
         const currentAngle = (card.baseAngle + ringRotation.current) % 360;
         const dist = getShortestDistance(currentAngle, vertexAngle);
         if (dist < minDistance) {
           minDistance = dist;
           closestCard = card;
           closestIndex = idx;
         }
      });

      if (closestCard) {
        // Remove from orbit pool
        const newOrbit = [...orbitRef.current];
        newOrbit.splice(closestIndex, 1);
        orbitRef.current = newOrbit;
        setOrbiting(newOrbit);

        const captureIndex = i;
        const newCapture = {
          slotIndex: captureIndex,
          cardId: closestCard.id,
          isRevealed: false,
          cardData: null,
        };
        
        capturedRef.current = [...capturedRef.current, newCapture];
        setCapturedSlots([...capturedRef.current]);

        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }

        // Delegate identity resolution to parent
        if (onCardCaptured) {
          try {
            const data = await onCardCaptured(captureIndex, capturedRef.current.length - 1);
            capturedRef.current = capturedRef.current.map(c => 
              c.slotIndex === captureIndex ? { ...c, isRevealed: true, cardData: data } : c
            );
            setCapturedSlots([...capturedRef.current]);
          } catch (e) {
            console.error("Card capture resolution failed:", e);
          }
        }
      }
    }

    // Wrap up
    setTimeout(() => {
       if (animRef.current) cancelAnimationFrame(animRef.current);
       setPhase('complete');
       if (onComplete) onComplete(capturedRef.current);
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-md aspect-square mx-auto flex items-center justify-center overflow-hidden bg-transparent">
      {phase === 'idle' && (
        <div className="absolute z-50">
          <Button onClick={startSpin} className="rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 shadow-[0_0_20px_rgba(147,51,234,0.5)]">
            <Sparkles className="mr-2 w-5 h-5" /> Press to Begin
          </Button>
        </div>
      )}

      {/* Vertices (Spread Slots) */}
      {Array.from({ length: spreadSize }).map((_, i) => {
         const pos = getVertexPosition(i, 160);
         const isCaptured = capturedSlots.find(c => c.slotIndex === i);
         
         return (
           <div
             key={`vertex-${i}`}
             className="absolute top-1/2 left-1/2 w-[60px] h-[90px] -ml-[30px] -mt-[45px] rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center transition-all duration-500"
             style={{ 
               transform: `translate(${pos.x}px, ${pos.y}px)`,
               boxShadow: isCaptured ? '0 0 30px rgba(168,85,247,0.4)' : 'none'
             }}
           >
             {!isCaptured && <span className="text-white/30 font-bold">{i + 1}</span>}
             
             <AnimatePresence>
               {isCaptured && (
                 <motion.div
                   initial={{ opacity: 0, scale: 1.5, rotateY: 0 }}
                   animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      rotateY: isCaptured.isRevealed ? 180 : 0 
                   }}
                   transition={{ duration: 0.6, type: 'spring' }}
                   className="absolute inset-0"
                   style={{ transformStyle: 'preserve-3d' }}
                 >
                    <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg border border-white/10" style={{ backfaceVisibility: 'hidden' }}>
                       <img src={deckBackImage} alt="Back" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg border border-white/20 bg-slate-900" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                       {isCaptured.cardData?.image_url ? (
                          <img src={isCaptured.cardData.image_url} alt="Front" className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-[10px] text-white/80 leading-tight">
                              {isCaptured.cardData?.name || 'Revealed'}
                            </span>
                          </div>
                       )}
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
         );
      })}

      {/* Orbiting Ring */}
      <div 
        ref={ringRef}
        className="absolute top-1/2 left-1/2 w-0 h-0 transition-opacity duration-1000"
        style={{ opacity: phase === 'idle' ? 0.4 : (phase === 'complete' ? 0 : 1) }}
      >
         {orbiting.map(card => {
            const rad = (card.baseAngle - 90) * (Math.PI / 180);
            const r = 90; // Orbit radius smaller than vertices
            const x = r * Math.cos(rad);
            const y = r * Math.sin(rad);

            return (
              <div
                key={`orbit-${card.id}`}
                className="absolute w-10 h-14 -ml-5 -mt-7 rounded shadow-sm overflow-hidden"
                data-basestyles={`translate(${x}px, ${y}px)`}
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                 <img src={deckBackImage} alt="Back" className="w-full h-full object-cover opacity-70" />
              </div>
            );
         })}
      </div>

      {/* Pulse Particle */}
      <AnimatePresence>
        {activePulse && (
          <motion.div
            initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
            animate={{ x: activePulse.to.x, y: activePulse.to.y, scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]"
          />
        )}
      </AnimatePresence>

      {/* Center Emitter */}
      <div className="absolute top-1/2 left-1/2 w-6 h-6 -ml-3 -mt-3 rounded-full bg-purple-500 shadow-[0_0_20px_#a855f7] border-2 border-white/50" />
    </div>
  );
}