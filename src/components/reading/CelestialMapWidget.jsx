import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Star, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CelestialMapWidget({ onApplyEnergy }) {
  const [isOpen, setIsOpen] = useState(false);
  const [todaysPlanet, setTodaysPlanet] = useState('');
  
  useEffect(() => {
    const days = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    const today = new Date().getDay();
    setTodaysPlanet(days[today]);
  }, []);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        className="bg-indigo-900/40 border-indigo-500/50 hover:bg-indigo-800/60 text-indigo-200"
      >
        <Compass className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Celestial Map</span>
        <span className="sm:hidden">Map</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 md:p-8 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.2)]"
            >
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.4)_0%,transparent_70%)]" />
                {/* SVG Star Map Background */}
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#fff">
                    <circle cx="10%" cy="20%" r="1.5" opacity="0.8">
                      <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="30%" cy="15%" r="2" opacity="0.6" />
                    <circle cx="50%" cy="40%" r="2.5" opacity="0.9">
                      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="70%" cy="25%" r="1" opacity="0.5" />
                    <circle cx="85%" cy="60%" r="2" opacity="0.8">
                      <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="20%" cy="70%" r="1.5" opacity="0.4" />
                    <circle cx="40%" cy="85%" r="2.5" opacity="0.7" />
                    <circle cx="60%" cy="75%" r="2" opacity="0.9">
                      <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="80%" cy="90%" r="1.5" opacity="0.6" />
                    <path d="M 30% 15% L 50% 40% L 70% 25%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                    <path d="M 50% 40% L 60% 75% L 40% 85% Z" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                    <path d="M 10% 20% L 30% 15%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                    <path d="M 85% 60% L 70% 25%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                  </g>
                </svg>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-white/10 z-20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="relative z-10 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/50 mb-2 shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                  <Star className="w-8 h-8 text-indigo-300" />
                </div>
                
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Today's Celestial Energy</h2>
                  <p className="text-indigo-200/80 text-sm max-w-xs mx-auto">
                    The stars align to bring specific cosmic vibrations into focus today.
                  </p>
                </div>

                <div className="bg-black/40 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-indigo-500/10">
                    <Compass className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="text-sm text-indigo-300 mb-1 uppercase tracking-wider font-semibold">Ruling Body</div>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4 drop-shadow-md">
                      {todaysPlanet}
                    </div>
                    <p className="text-slate-300 text-sm">
                      We suggest focusing your Spirit Wheel reading on Astrological or Planet themes to align with the energy of the {todaysPlanet}. Let its cosmic influence guide your inquiries today.
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 text-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  onClick={() => {
                    setIsOpen(false);
                    if (onApplyEnergy) onApplyEnergy();
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Focus on Astrology
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}