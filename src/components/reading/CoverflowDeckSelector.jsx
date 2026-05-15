import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function CoverflowDeckSelector({ publicDecks, myDecks, onDrawCards }) {
  const [deckMode, setDeckMode] = useState("personal"); // "personal" or "public"
  const [searchQuery, setSearchQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(0);
  


  // Determine current deck list
  const currentDecks = (deckMode === "personal" ? myDecks : publicDecks)
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Ensure focusIdx is valid
  useEffect(() => {
    if (focusIdx >= currentDecks.length) setFocusIdx(Math.max(0, currentDecks.length - 1));
  }, [currentDecks.length, focusIdx]);

  const focusedDeck = currentDecks[focusIdx];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in the search input
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
        return;
      }
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusIdx((prev) => Math.min(currentDecks.length - 1, prev + 1));
      } else if (e.key === "Enter" && focusedDeck) {
        e.preventDefault();
        onDrawCards(focusedDeck);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDecks.length, focusedDeck, onDrawCards]);

  // Drag handling
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const endX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const diff = endX - startX;
    if (Math.abs(diff) > 30) {
      if (diff < 0 && focusIdx < currentDecks.length - 1) setFocusIdx(focusIdx + 1);
      if (diff > 0 && focusIdx > 0) setFocusIdx(focusIdx - 1);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-6 animate-in fade-in zoom-in duration-300">
      
      <div className="flex items-center gap-2 mb-3 px-5">
        <div className="text-xs font-semibold tracking-widest uppercase text-purple-300/60">Choose Your Deck</div>
        <div className="flex-1 h-[1px] bg-[#a078ff]/15"></div>
      </div>

      {/* Deck Controls */}
      <div className="flex items-center gap-2 px-[18px] mb-[18px]">
        <div className="flex-1 flex items-center gap-2 bg-[#160f2a] border border-[#a078ff]/20 rounded-full px-4 py-2 transition-colors focus-within:border-[#a78bfa]/45">
          <Search className="w-4 h-4 text-[#b4a0dc]/45" />
          <input 
            type="text" 
            placeholder="Search decks..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-[#e1d7ff]/90 w-full placeholder:text-[#b4a0dc]/45 font-sans"
          />
        </div>
        <div className="flex items-center bg-[#160f2a] border border-[#a078ff]/15 rounded-full p-[3px] gap-[2px]">
          <button 
            onClick={() => setDeckMode("personal")}
            className={`text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${deckMode === 'personal' ? 'bg-[#7c3aed] text-white shadow-[0_0_14px_rgba(167,139,250,0.4)]' : 'text-purple-300/60'}`}
          >
            Mine
          </button>
          <button 
            onClick={() => setDeckMode("public")}
            className={`text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${deckMode === 'public' ? 'bg-[#7c3aed] text-white shadow-[0_0_14px_rgba(167,139,250,0.4)]' : 'text-purple-300/60'}`}
          >
            Public
          </button>
        </div>
      </div>

      {/* Coverflow */}
      <div 
        className="w-full overflow-hidden relative py-2"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 20%, #000 80%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 20%, #000 80%, transparent 100%)'
        }}
      >
        <div 
          ref={trackRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          onMouseLeave={() => setIsDragging(false)}
          className="flex items-center gap-[12px] px-[calc(50%-60px)] transition-transform duration-[380ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] cursor-grab active:cursor-grabbing select-none"
          style={{ transform: `translateX(${-focusIdx * 132}px)` }}
        >
          {currentDecks.length === 0 ? (
            <div className="w-[120px] h-[170px] flex items-center justify-center text-purple-300/60 text-sm italic text-center">
              No decks found
            </div>
          ) : (
            currentDecks.map((d, i) => {
              const diff = Math.abs(i - focusIdx);
              let className = "flex-shrink-0 w-[120px] flex flex-col items-center gap-[9px] transition-all duration-[380ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] ";
              if (diff === 0) className += "scale-100 translate-y-0 opacity-100 z-10";
              else if (diff === 1) className += "scale-[0.86] translate-y-[5px] opacity-[0.66] z-0";
              else className += "scale-[0.74] translate-y-[10px] opacity-[0.42] z-0";

              return (
                <div key={d.id} className={className} onClick={() => setFocusIdx(i)}>
                  <div className={`w-[120px] h-[170px] rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-[380ms] flex items-center justify-center bg-[#160f2a] text-4xl ${diff === 0 ? 'border-[#a78bfa]/55 shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_10px_35px_rgba(100,50,200,0.5),0_0_60px_rgba(100,50,200,0.12)]' : 'border-[#a078ff]/15'}`}>
                    {d.cover_image ? (
                      <img src={d.cover_image} alt={d.name} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <BookOpen className="w-8 h-8 text-white/40" />
                    )}
                  </div>
                  <div className={`text-[10px] font-bold tracking-wider uppercase text-center max-w-[110px] leading-snug transition-colors ${diff === 0 ? 'text-purple-300' : 'text-purple-300/50'}`}>
                    {d.name}
                  </div>
                  <div className={`italic text-xs transition-colors ${diff === 0 ? 'text-purple-300/80' : 'text-purple-300/40'}`}>
                    {d.category || "Oracle"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dots */}
      {currentDecks.length > 0 && (
        <div className="flex justify-center gap-[5px] pt-[10px] pb-[4px]">
          {currentDecks.map((_, i) => (
            <div 
              key={i} 
              onClick={() => setFocusIdx(i)}
              className={`h-[5px] transition-all duration-300 cursor-pointer ${i === focusIdx ? 'w-[16px] rounded-[3px] bg-[#a78bfa]' : 'w-[5px] rounded-full bg-[#a078ff]/25'}`}
            />
          ))}
        </div>
      )}

      {/* Selected strip */}
      {focusedDeck && (
        <div className="m-[12px_18px_6px] p-[13px_16px] bg-[#160f2a] border border-[#a78bfa]/20 rounded-[13px] flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
          <div>
            <div className="font-bold text-sm tracking-wide text-white truncate max-w-[200px]">{focusedDeck.name}</div>
            <div className="italic text-xs text-purple-300/60 mt-[2px]">{focusedDeck.category || "Oracle"}</div>
          </div>
          <div className="w-[28px] h-[28px] rounded-full bg-[#a78bfa]/15 border border-[#a78bfa]/35 flex items-center justify-center text-[13px]">✦</div>
        </div>
      )}

      {/* Select Deck Button */}
      <div className="m-[14px_18px]">
        <button 
          onClick={() => focusedDeck && onDrawCards(focusedDeck)}
          disabled={!focusedDeck}
          className="w-full p-[14px] rounded-[50px] border-none cursor-pointer font-bold text-sm tracking-widest uppercase text-white bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-[0_4px_20px_rgba(124,58,237,0.45)] flex items-center justify-center gap-[9px] transition-all hover:-translate-y-[2px] hover:shadow-[0_6px_28px_rgba(124,58,237,0.6)] active:scale-[0.97] disabled:opacity-50 disabled:animate-none"
        >
          <span className="text-[16px]">✦</span> Select Deck
        </button>
      </div>

      <div className="text-center italic text-xs text-purple-300/40 p-[8px_24px_4px] leading-[1.5]">
        Readings are for entertainment purposes only and do not constitute professional advice.
      </div>

    </div>
  );
}