import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Pendulum() {
  const [isSwinging, setIsSwinging] = useState(false);
  const [answer, setAnswer] = useState(null);

  const swingPendulum = () => {
    if (isSwinging) return;
    setIsSwinging(true);
    setAnswer(null);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([20, 50, 20]); } catch (e) {}
    }

    setTimeout(() => {
      const answers = ["YES", "NO", "MAYBE", "UNCLEAR"];
      const chosen = answers[Math.floor(Math.random() * answers.length)];
      setAnswer(chosen);
      setIsSwinging(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(50); } catch (e) {}
      }
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-black text-white p-4 md:p-8 overflow-hidden">
      <Link to={createPageUrl("Dashboard")}>
        <Button variant="ghost" className="mb-4 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-900/30">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </Link>
      
      <div className="max-w-md mx-auto flex flex-col items-center pt-10">
        <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2">Mystic Pendulum</h1>
        <p className="text-indigo-200/60 text-sm mb-12">Ask a yes or no question</p>
        
        {/* Pendulum Container */}
        <div className="relative h-[350px] w-full flex justify-center" style={{ perspective: '800px' }}>
          {/* Anchor point */}
          <div className="absolute top-0 w-4 h-4 bg-slate-400 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10" />
          
          <motion.div
            className="origin-top flex flex-col items-center z-0"
            style={{ transformStyle: 'preserve-3d', transformOrigin: 'top center' }}
            animate={
              isSwinging 
                ? { 
                    rotateZ: [0, 40, -30, 20, -10, 5, 0], 
                    rotateX: [0, 20, -15, 10, -5, 0] 
                  } 
                : answer === "YES" 
                  ? { rotateX: [0, 35, -35, 0], rotateZ: 0 } // Forward/Back for YES
                : answer === "NO"
                  ? { rotateZ: [0, 25, -25, 0], rotateX: 0 } // Left/Right for NO
                : answer === "MAYBE" || answer === "UNCLEAR"
                  ? { rotateZ: [0, 15, 0, -15, 0], rotateX: [15, 0, -15, 0, 15] } // Circular
                : { rotateZ: [0, 2, -2, 0], rotateX: [0, 2, -2, 0] } // idle
            }
            transition={
              isSwinging 
                ? { duration: 4.5, ease: "easeInOut" }
                : answer === "YES" || answer === "NO" || answer === "MAYBE" || answer === "UNCLEAR"
                  ? { duration: 2.5, ease: "easeInOut", repeat: Infinity }
                : { duration: 4, ease: "easeInOut", repeat: Infinity }
            }
          >
            {/* Chain */}
            <div className="w-[2px] h-[220px] bg-gradient-to-b from-slate-300 to-amber-600 shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
            
            {/* Crystal / Bob */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-amber-500 blur-xl opacity-40 rounded-full scale-150" />
              
              {/* Crystal shape */}
              <svg width="40" height="60" viewBox="0 0 40 60" className="relative drop-shadow-[0_10px_15px_rgba(245,158,11,0.6)]">
                <path d="M20 0 L40 20 L20 60 L0 20 Z" fill="url(#crystalGrad)" stroke="#fbbf24" strokeWidth="1"/>
                <path d="M20 0 L20 60 M0 20 L40 20" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5"/>
                <defs>
                  <linearGradient id="crystalGrad" x1="0" y1="0" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="40%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Board underneath - Flat Spirit Wheel */}
          <div 
            className="absolute bottom-[-100px] w-[350px] h-[350px] rounded-full border-4 border-amber-900/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex justify-center items-center pointer-events-none"
            style={{ transform: 'rotateX(70deg) translateZ(-80px)', transformStyle: 'preserve-3d' }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-[8px] border-amber-800/40 bg-black/60 backdrop-blur-md" />
            {/* Middle ring */}
            <div className="absolute inset-[15%] rounded-full border-2 border-amber-700/30 bg-indigo-950/40" />
            {/* Inner ring */}
            <div className="absolute inset-[35%] rounded-full border border-amber-600/30 bg-purple-950/30" />
            {/* Center hub */}
            <div className="absolute inset-[45%] rounded-full border-2 border-amber-500/40 bg-black/80 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] overflow-hidden">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg" 
                alt="Center Logo" 
                className="w-full h-full object-cover opacity-90" 
              />
            </div>
            
            {/* Letters/Numbers on outer ring */}
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").map((char, i, arr) => (
              <div 
                key={i}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                style={{ transform: `rotate(${(i * 360) / arr.length}deg)` }}
              >
                <div className="absolute top-1 -translate-x-1/2 text-amber-500/70 text-[12px] font-bold" style={{ transform: 'rotateX(-70deg)' }}>
                  {char}
                </div>
              </div>
            ))}

            {/* Answer Areas inside middle ring */}
            <div className="absolute top-[22%] text-amber-400/80 font-serif font-bold tracking-widest text-xl" style={{ transform: 'rotateX(-70deg)' }}>YES</div>
            <div className="absolute bottom-[22%] text-amber-400/80 font-serif font-bold tracking-widest text-xl" style={{ transform: 'rotateX(-70deg)' }}>YES</div>
            <div className="absolute left-[15%] text-amber-400/80 font-serif font-bold tracking-widest text-xl" style={{ transform: 'rotateX(-70deg)' }}>NO</div>
            <div className="absolute right-[15%] text-amber-400/80 font-serif font-bold tracking-widest text-xl" style={{ transform: 'rotateX(-70deg)' }}>NO</div>
          </div>
        </div>

        <div className="mt-8 h-16 flex items-center justify-center">
          {answer && !isSwinging && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className="text-3xl font-bold text-amber-400 tracking-wider font-serif"
            >
              {answer}
            </motion.div>
          )}
        </div>

        <Button 
          onClick={swingPendulum} 
          disabled={isSwinging}
          className="mt-6 bg-gradient-to-r from-amber-700 to-amber-500 hover:from-amber-600 hover:to-amber-400 text-white font-bold text-lg py-6 px-12 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95"
        >
          {isSwinging ? "Consulting the Spirits..." : "Release Pendulum"}
        </Button>
      </div>
    </div>
  );
}