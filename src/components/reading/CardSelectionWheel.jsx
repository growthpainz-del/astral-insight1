import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function CardSelectionWheel({ onCardSelect, isSpinning }) {
  const [illuminatedSegment, setIlluminatedSegment] = useState(null);
  const [isIlluminating, setIsIlluminating] = useState(false);

  const illuminate = () => {
    if (isIlluminating) return;
    
    setIsIlluminating(true);
    setIlluminatedSegment(null);

    // Create a dramatic illumination sequence
    let segmentIndex = 0;
    const totalSegments = 50;
    const flickerCount = 8; // Number of random flickers before final selection
    
    // First, create some random flickering
    const flickerInterval = setInterval(() => {
      if (segmentIndex < flickerCount) {
        const randomSegment = Math.floor(Math.random() * totalSegments) + 1;
        setIlluminatedSegment(randomSegment);
        segmentIndex++;
      } else {
        clearInterval(flickerInterval);
        
        // Final dramatic pause then reveal the chosen segment
        setTimeout(() => {
          setIlluminatedSegment(null);
          setTimeout(() => {
            const finalSegment = Math.floor(Math.random() * totalSegments) + 1;
            setIlluminatedSegment(finalSegment);
            
            // Call the parent with the selected card
            setTimeout(() => {
              onCardSelect(finalSegment);
              setIsIlluminating(false);
            }, 1500); // Give time to see the final illuminated segment
          }, 300);
        }, 500);
      }
    }, 200);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
      <h3 className="text-2xl font-bold text-white mb-2">Message of the Day</h3>
      <p className="text-purple-200 mb-6 max-w-sm text-center">
        Call upon the sacred Oracle wheel to illuminate your chosen segment. The spirits will guide you to your message of wisdom and insight.
      </p>
      
      <div className="relative w-80 h-80 md:w-96 md:h-96 mb-8">
        {/* Oracle Wheel Base */}
        <div className="w-full h-full rounded-full relative overflow-hidden shadow-2xl shadow-amber-500/30 border-4 border-amber-200/30">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ce2a80a3d515e4da42fa6f/38f2cc6b0_E1E4AE6C-E2FF-42BB-AD04-6F3EE9610D69.jpg"
            alt="Sacred Oracle Wheel with 50 segments"
            className="w-full h-full object-cover rounded-full"
          />
          
          {/* Illumination Overlay */}
          <AnimatePresence>
            {isIlluminating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full"
              >
                {/* Dynamic illumination effect */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "inset 0 0 50px rgba(255, 215, 0, 0.3)",
                      "inset 0 0 100px rgba(255, 215, 0, 0.6)",
                      "inset 0 0 50px rgba(255, 215, 0, 0.3)",
                    ]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full rounded-full"
                />
                
                {/* Pulsing center energy */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.9, 0.6]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-400/40 to-amber-600/40 rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Specific Segment Illumination */}
          <AnimatePresence>
            {illuminatedSegment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0, 1, 0.7, 1],
                  scale: [0.8, 1.05, 1],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 rounded-full pointer-events-none"
              >
                {/* Golden illumination for selected segment */}
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(
                      transparent ${(illuminatedSegment - 1) * (360 / 50)}deg,
                      rgba(255, 215, 0, 0.6) ${(illuminatedSegment - 1) * (360 / 50)}deg,
                      rgba(255, 215, 0, 0.8) ${illuminatedSegment * (360 / 50)}deg,
                      transparent ${illuminatedSegment * (360 / 50)}deg
                    )`,
                    filter: 'blur(2px)'
                  }}
                />
                
                {/* Sharp highlight overlay */}
                <div 
                  className="absolute inset-0 w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(
                      transparent ${(illuminatedSegment - 1) * (360 / 50)}deg,
                      rgba(255, 215, 0, 0.4) ${(illuminatedSegment - 1) * (360 / 50)}deg,
                      rgba(255, 215, 0, 0.6) ${illuminatedSegment * (360 / 50)}deg,
                      transparent ${illuminatedSegment * (360 / 50)}deg
                    )`
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <Button 
        onClick={illuminate}
        disabled={isIlluminating}
        size="lg"
        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-500/25 text-white font-bold px-8 py-3"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {isIlluminating ? "The Wheel Illuminates..." : "Illuminate the Spirit Wheel"}
      </Button>
      
      <AnimatePresence>
        {isIlluminating && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-amber-300 text-sm mt-4 text-center"
          >
            The ancient symbols awaken... your sacred message reveals itself...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}