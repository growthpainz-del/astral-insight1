import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function CoverflowDeckSelector({ publicDecks, myDecks, onDrawCards }) {
  const [deckMode, setDeckMode] = useState("personal"); // "personal" or "public"
  const [searchQuery, setSearchQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(0);
  
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState("Past, Present, Future — 3 cards");

  // Determine current deck list
  const currentDecks = (deckMode === "personal" ? myDecks : publicDecks)
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Ensure focusIdx is valid
  useEffect(() => {
    if (focusIdx >= currentDecks.length) setFocusIdx(Math.max(0, currentDecks.length - 1));
  }, [currentDecks.length, focusIdx]);

  const focusedDeck = currentDecks[focusIdx];

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
        <div className="font-['Cinzel'] text-[9px] tracking-[0.28em] uppercase text-[#b4a0dc]/45">Choose Your Deck</div>
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
            className="bg-transparent border-none outline-none font-['Crimson_Text'] text-[15px] text-[#e1d7ff]/90 w-full placeholder:text-[#b4a0dc]/45"
          />
        </div>
        <div className="flex items-center bg-[#160f2a] border border-[#a078ff]/15 rounded-full p-[3px] gap-[2px]">
          <button 
            onClick={() => setDeckMode("personal")}
            className={`font-['Cinzel'] text-[8.5px] tracking-[0.12em] uppercase px-[11px] py-[6px] rounded-full transition-all whitespace-nowrap ${deckMode === 'personal' ? 'bg-[#7c3aed] text-white shadow-[0_0_14px_rgba(167,139,250,0.4)]' : 'text-[#b4a0dc]/45'}`}
          >
            Mine
          </button>
          <button 
            onClick={() => setDeckMode("public")}
            className={`font-['Cinzel'] text-[8.5px] tracking-[0.12em] uppercase px-[11px] py-[6px] rounded-full transition-all whitespace-nowrap ${deckMode === 'public' ? 'bg-[#7c3aed] text-white shadow-[0_0_14px_rgba(167,139,250,0.4)]' : 'text-[#b4a0dc]/45'}`}
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
            <div className="w-[120px] h-[170px] flex items-center justify-center text-[#b4a0dc]/45 text-sm font-['IM_Fell_English'] italic text-center">
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
                  <div className={`font-['Cinzel'] text-[8.5px] tracking-[0.13em] uppercase text-center max-w-[110px] leading-[1.4] transition-colors ${diff === 0 ? 'text-[#a78bfa]' : 'text-[#b4a0dc]/45'}`}>
                    {d.name}
                  </div>
                  <div className={`font-['IM_Fell_English'] italic text-[11px] transition-colors ${diff === 0 ? 'text-[#a78bfa]/70' : 'text-[#a78bfa]/40'}`}>
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
            <div className="font-['Cinzel'] text-[13px] tracking-[0.09em] text-white truncate max-w-[200px]">{focusedDeck.name}</div>
            <div className="font-['IM_Fell_English'] italic text-[12px] text-[#b4a0dc]/45 mt-[2px]">{focusedDeck.category || "Oracle"}</div>
          </div>
          <div className="w-[28px] h-[28px] rounded-full bg-[#a78bfa]/15 border border-[#a78bfa]/35 flex items-center justify-center text-[13px]">✦</div>
        </div>
      )}

      {/* Form Card */}
      <div className="m-[14px_18px] p-[18px] bg-[#0f0b1e] border border-[#a078ff]/15 rounded-[14px] flex flex-col gap-[14px]">
        <div>
          <div className="font-['Cinzel'] text-[9.5px] tracking-[0.2em] uppercase text-[#b4a0dc]/45 mb-[6px]">Your Question</div>
          <Textarea 
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="What guidance do you seek?"
            className="w-full bg-[#160f2a] border-[#a078ff]/15 rounded-[10px] p-[12px_14px] font-['Crimson_Text'] text-[16px] text-[#e1d7ff]/90 resize-none outline-none min-h-[80px] transition-colors focus-visible:ring-0 focus-visible:border-[#a78bfa]/45 placeholder:text-[#b4a0dc]/45"
          />
        </div>
        <div>
          <div className="font-['Cinzel'] text-[9.5px] tracking-[0.2em] uppercase text-[#b4a0dc]/45 mb-[6px]">Spread</div>
          <select 
            value={spread}
            onChange={e => setSpread(e.target.value)}
            className="w-full bg-[#160f2a] border border-[#a078ff]/15 rounded-[10px] p-[11px_14px] font-['Crimson_Text'] text-[15px] text-[#e1d7ff]/90 outline-none cursor-pointer appearance-none transition-colors focus:border-[#a78bfa]/45"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a78bfa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
          >
            <option value="single">Single Card — 1 card</option>
            <option value="three_card">Past, Present, Future — 3 cards</option>
            <option value="diamond">Diamond Ring — 7 cards</option>
            <option value="celtic_cross">Celtic Cross — 10 cards</option>
          </select>
        </div>
        <button 
          onClick={() => focusedDeck && onDrawCards(focusedDeck, spread, question)}
          disabled={!focusedDeck}
          className="w-full p-[14px] rounded-[50px] border-none cursor-pointer font-['Cinzel'] text-[12px] tracking-[0.18em] uppercase text-white bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-[0_4px_20px_rgba(124,58,237,0.45)] flex items-center justify-center gap-[9px] transition-all hover:-translate-y-[2px] hover:shadow-[0_6px_28px_rgba(124,58,237,0.6)] active:scale-[0.97] animate-[pulse_2.5s_ease_infinite] disabled:opacity-50 disabled:animate-none"
        >
          <span className="text-[16px]">✦</span> Draw Cards
        </button>
      </div>

      <div className="text-center font-['Crimson_Text'] italic text-[11px] text-[#a08cc8]/35 p-[8px_24px_4px] leading-[1.5]">
        Readings are for entertainment purposes only and do not constitute professional advice.
      </div>

    </div>
  );
}