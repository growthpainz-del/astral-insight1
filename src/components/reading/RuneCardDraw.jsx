
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const runes = [
  { name: "Fehu", symbol: "ᚠ", meaning: "Wealth, Abundance, Success" },
  { name: "Uruz", symbol: "ᚢ", meaning: "Strength, Tenacity, Courage" },
  { name: "Thurisaz", symbol: "ᚦ", meaning: "Reaction, Defense, Conflict" },
  { name: "Ansuz", symbol: "ᚨ", meaning: "Communication, Inspiration, Wisdom" },
  { name: "Raidho", symbol: "ᚱ", meaning: "Journey, Movement, Progress" },
  { name: "Kenaz", symbol: "ᚲ", meaning: "Knowledge, Creativity, Enlightenment" },
  { name: "Gebo", symbol: "ᚷ", meaning: "Gift, Partnership, Generosity" },
  { name: "Wunjo", symbol: "ᚹ", meaning: "Joy, Harmony, Success" },
  { name: "Hagalaz", symbol: "ᚺ", meaning: "Necessary Change, Upheaval" },
  { name: "Nauthiz", symbol: "ᚾ", meaning: "Need, Constraint, Lessons" },
  { name: "Isa", symbol: "ᛁ", meaning: "Stasis, Stillness, Introspection" },
  { name: "Jera", symbol: "ᛃ", meaning: "Harvest, Cycles, Reward" },
  { name: "Eihwaz", symbol: "ᛇ", meaning: "Defense, Endurance, Connection" },
  { name: "Perthro", symbol: "ᛈ", meaning: "Mystery, Fate, The Unknown" },
  { name: "Algiz", symbol: "ᛉ", meaning: "Protection, Higher Self, Trust" },
  { name: "Sowilo", symbol: "ᛋ", meaning: "Sun, Success, Vitality" },
  { name: "Tiwaz", symbol: "ᛏ", meaning: "Justice, Sacrifice, Honor" },
  { name: "Berkano", symbol: "ᛒ", meaning: "New Beginnings, Growth, Renewal" },
  { name: "Ehwaz", symbol: "ᛖ", meaning: "Movement, Progress, Partnership" },
  { name: "Mannaz", symbol: "ᛗ", meaning: "The Self, Community, Intelligence" },
  { name: "Laguz", symbol: "ᛚ", meaning: "Flow, Intuition, The Unconscious" },
  { name: "Ingwaz", symbol: "ᛜ", meaning: "Internal Growth, Potential, Fertility" },
  { name: "Dagaz", symbol: "ᛞ", meaning: "Breakthrough, Awakening, Clarity" },
  { name: "Othala", symbol: "ᛟ", meaning: "Inheritance, Legacy, Family" },
];

// I'll use a placeholder for the plain stone image. You can replace this URL.
const plainStoneImageUrl = "https://i.ibb.co/6g7pS0s/plain-stone.png";

export default function RuneCardDraw({ onRuneSelect }) {
  const [selectedRune, setSelectedRune] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEngraved, setIsEngraved] = useState(false);
  const [showInterpretationButton, setShowInterpretationButton] = useState(false);

  useEffect(() => {
    // Pick a random rune when the component mounts, but don't show it yet.
    const randomRune = runes[Math.floor(Math.random() * runes.length)];
    setSelectedRune(randomRune);
  }, []);

  const handleEngrave = () => {
    if (!isEngraved) {
      setIsEngraved(true);
      setTimeout(() => {
        setShowInterpretationButton(true);
      }, 1500); // Wait for engraving animation to feel complete
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <style>{`
        @keyframes flicker-glow {
          0%, 100% { text-shadow: 0 0 5px #fefce8, 0 0 10px #fefce8, 0 0 20px #fde047, 0 0 30px #fde047; opacity: 0.8; }
          50% { text-shadow: 0 0 10px #fefce8, 0 0 20px #fde047, 0 0 40px #fde047, 0 0 50px #fde047; opacity: 1; }
        }
        .engraved-symbol {
          animation: flicker-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl md:text-2xl font-bold text-amber-200 mb-6 md:mb-8 text-center px-4"
      >
        {!isFlipped 
          ? "Tap the stone to draw your rune." 
          : !isEngraved
          ? "Focus your energy and tap again to reveal its symbol."
          : "Your rune is revealed. What does it mean?"
        }
      </motion.h2>

      <div style={{ perspective: '1000px' }}>
        <motion.div
          className="relative w-56 h-56 md:w-64 md:h-64 cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back of the card */}
          <div
            className="absolute w-full h-full"
            style={{ backfaceVisibility: 'hidden' }}
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <img src={plainStoneImageUrl} alt="Rune Stone Back" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>

          {/* Front of the card */}
          <div
            className="absolute w-full h-full"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            onClick={handleEngrave}
          >
            <img src={plainStoneImageUrl} alt="Rune Stone Front" className="w-full h-full object-contain drop-shadow-2xl" />
            
            {isEngraved && selectedRune && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <span className="text-8xl md:text-9xl text-yellow-100 font-serif engraved-symbol">
                  {selectedRune.symbol}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      
      {showInterpretationButton && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => onRuneSelect(selectedRune)}
        >
          See Your Fused Interpretation
        </motion.button>
      )}
    </div>
  );
}
