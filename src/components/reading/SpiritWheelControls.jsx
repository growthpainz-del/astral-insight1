import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function SpiritWheelControls({ intentionPhrase, setIntentionPhrase, spinSpeed, setSpinSpeed, spinState, spinWheel }) {
  return (
    <div className="w-full px-[20px] mt-[16px] z-20 relative">
      <div className="w-full">
        <div 
          className="text-center text-[8.5px] tracking-[0.2em] uppercase text-[rgba(201,168,76,0.5)] mb-[6px]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Intention Phrase (Optional Seed)
        </div>
        <input 
          value={intentionPhrase} 
          onChange={(e) => setIntentionPhrase(e.target.value)} 
          placeholder="Set your intention before spinning…" 
          disabled={spinState !== "idle"}
          className="w-full bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.2)] rounded-[50px] px-[16px] py-[9px] text-[14px] text-[rgba(220,200,160,0.8)] outline-none text-center transition-colors duration-250 placeholder-[rgba(201,168,76,0.3)] focus:border-[rgba(201,168,76,0.45)] mb-[16px]"
          style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}
        />
      </div>

      <div className="flex gap-[8px] mb-[16px]">
        <div className="flex-1">
          <div className="text-center text-[8.5px] tracking-[0.2em] uppercase text-[rgba(201,168,76,0.5)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Spin Speed</div>
          <select 
            value={spinSpeed.toString()} 
            onChange={(e) => setSpinSpeed(parseFloat(e.target.value))} 
            disabled={spinState !== "idle"}
            className="w-full bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.2)] rounded-[50px] px-[16px] py-[9px] text-[12px] text-[rgba(220,200,160,0.8)] outline-none text-center appearance-none cursor-pointer transition-colors duration-250 focus:border-[rgba(201,168,76,0.45)]"
            style={{ 
              fontFamily: "'Cinzel', serif",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none'%3E%3Cpath d='M1 1l3 3L7 1' stroke='rgba(201,168,76,0.5)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center"
            }}
          >
            <option value="0.5" style={{ background: "#0a0618" }}>Slow</option>
            <option value="1" style={{ background: "#0a0618" }}>Normal</option>
            <option value="2" style={{ background: "#0a0618" }}>Fast</option>
          </select>
        </div>
      </div>

      {spinState === "idle" ? (
        <button 
          onClick={spinWheel} 
          className="w-full py-[14px] rounded-[50px] border-none cursor-pointer flex items-center justify-center gap-[9px] transition-all duration-200 uppercase tracking-[0.18em] text-[12px] text-[rgba(255,240,200,0.95)]"
          style={{ 
            fontFamily: "'Cinzel', serif",
            background: "linear-gradient(135deg, #6b4a0a, #c9a84c, #8B6914)",
            boxShadow: "0 4px 20px rgba(201,168,76,0.4)",
            animation: "pulse 2.5s ease infinite"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(201,168,76,0.6)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.4)";
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        >
          ✦ Spin the Wheel
        </button>
      ) : (
        <button 
          disabled
          className="w-full py-[14px] rounded-[50px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.1)] flex items-center justify-center gap-[9px] uppercase tracking-[0.18em] text-[12px] text-[rgba(255,240,200,0.5)] cursor-not-allowed"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <RefreshCw className="animate-spin w-4 h-4 mr-1" />
          Channeling...
        </button>
      )}
      <div 
        className="text-center text-[rgba(201,168,76,0.35)] text-[12px] pt-[6px] pb-[2px]"
        style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}
      >
        👆 Or tap the wheel directly to spin
      </div>
    </div>
  );
}