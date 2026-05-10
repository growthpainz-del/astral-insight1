import React from "react";
import { motion } from "framer-motion";
import { getThumbnailUrl } from "@/lib/utils";

export default function RootedCrescentStage({
  spread,
  positions,
  cards,
  deck,
  onCardClick,
  revealedCards,
}) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes moonGlow {
          0%, 100% { opacity: .7; filter: blur(40px); }
          50% { opacity: .85; filter: blur(35px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(30px) rotateY(-15deg); }
          to { opacity: 1; transform: translateY(0) rotateY(0deg); }
        }
      `}</style>
      <div 
        className="relative mx-auto rounded-[18px] overflow-hidden border border-[#a078ff29] min-h-[360px] flex items-center justify-center w-full max-w-4xl"
        style={{
          background: "linear-gradient(160deg, #0d0822, #1a0f35, #0a0618)",
          fontFamily: "'Crimson Text', serif"
        }}
      >
        {/* Moon Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div 
            className="absolute w-[320px] h-[320px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.06), transparent 70%)",
              animation: "moonGlow 6s 1s ease-in-out infinite"
            }}
          />
          <div 
            className="w-[240px] h-[240px] rounded-full"
            style={{
              background: "radial-gradient(circle at 40% 35%, rgba(201,168,76,0.18), rgba(120,80,200,0.08) 55%, transparent 75%)",
              border: "1px solid rgba(201,168,76,0.1)",
              animation: "moonGlow 5s ease-in-out infinite"
            }}
          />
        </div>

        {/* Cards Stage */}
        <div className="relative z-10 flex items-end justify-center gap-3 sm:gap-5 p-6 md:p-10 w-full flex-wrap">
          {cards.map((card, i) => {
            if (!card) return null;
            const position = positions[i] || { name: `Position ${i+1}`, meaning: '' };
            const isRevealed = revealedCards.has(i) || true; // Assuming all revealed in this view

            return (
              <div 
                key={i} 
                className="flex-1 max-w-[120px] sm:max-w-[140px] min-w-[90px] flex flex-col items-center gap-3 cursor-pointer"
                style={{ 
                  animation: `cardReveal 0.5s ease both`,
                  animationDelay: `${i * 0.15}s`
                }}
                onClick={() => onCardClick(card, i)}
              >
                <div 
                  className="w-full aspect-[2/3] rounded-[10px] relative overflow-hidden flex items-center justify-center text-3xl"
                  style={{
                    background: "linear-gradient(135deg, #1e1438, #0d0822)",
                    border: "1.5px solid rgba(167,139,250,0.35)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.5), 0 0 20px rgba(100,50,200,0.2)",
                    animation: `float 4s ease-in-out infinite`,
                    animationDelay: `${i * 0.8}s`
                  }}
                >
                  {isRevealed && card.image_url ? (
                    <img 
                      src={getThumbnailUrl(card.image_url, 400)} 
                      alt={card.name} 
                      className="w-full h-full object-cover rounded-[8px]" 
                    />
                  ) : isRevealed ? (
                    <span className="text-white/40">{card.name.charAt(0)}</span>
                  ) : (
                    <div className="w-full h-full bg-slate-800" />
                  )}
                  <div 
                    className="absolute inset-0 rounded-[8px] pointer-events-none"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)"
                    }}
                  />
                </div>
                
                <div 
                  className="text-center"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <div className="text-[9px] sm:text-[10px] tracking-[0.1em] uppercase text-[#dcd2ffcc] leading-tight mb-1">
                    {card.name}
                  </div>
                  <div 
                    className="text-[8px] sm:text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full inline-block"
                    style={{
                      background: "rgba(167,139,250,0.15)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      color: "#a78bfa"
                    }}
                  >
                    {i + 1} · {position.name}
                  </div>
                  <div 
                    className="mt-1.5 text-center leading-tight"
                    style={{
                      fontFamily: "'IM Fell English', serif",
                      fontStyle: "italic",
                      fontSize: "12px",
                      color: "rgba(180,160,220,0.45)"
                    }}
                  >
                    {position.meaning}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}