import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Link2,
  X,
  RotateCcw,
  Copy,
  Check,
  Lightbulb,
  Heart,
  Zap
} from "lucide-react";

export default function EnhancedCardViewer({ card, isOpen, onClose, position, isReversed, relatedCards = [] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(!!card?.video_url);
  const rightPaneRef = useRef(null);
  const overviewRef = useRef(null);
  const guidanceRef = useRef(null);
  const relatedRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState('overview');
  const scrollToRef = (ref, value) => {
    try { setMobileOpen(value); } catch(_) {}
    setTimeout(() => { try { ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_) {} }, 10);
  };

  useEffect(() => {
    setShowVideo(!!card?.video_url);
    // Always default to Overview when opening or switching cards
    if (isOpen) setActiveTab('overview');
  }, [card?.id, isOpen]);

  const handleImageClick = () => {
    setActiveTab('overview');
    try {
      rightPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
  };

  // Lock background scroll while viewer is open (keep internal scroll working)
  useEffect(() => {
    if (!isOpen) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    return () => {
      try {
        document.documentElement.style.overflow = prevHtml || '';
        document.body.style.overflow = prevBody || '';
      } catch (_) {}
    };
  }, [isOpen]);

  if (!card) return null;

  const copyCardInfo = async () => {
    const text = `
🃏 ${card.name} ${isReversed ? '(Reversed)' : ''}
${position ? `Position: ${position}` : ''}

${isReversed ? card.reversed_meaning || card.upright_meaning : card.upright_meaning || card.overall_meaning || ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getMeaningText = () => {
    if (isReversed) {
      return card.reversed_meaning || card.upright_meaning || card.overall_meaning || "No meaning available";
    }
    return card.upright_meaning || card.overall_meaning || "No meaning available";
  };

  const getInsightText = () => {
    if (isReversed) {
      return card.reversed_insight || "Reflect on blocked energy or internal challenges";
    }
    return card.upright_insight || "Embrace the energy and opportunities present";
  };

  const getActionText = () => {
    if (isReversed) {
      return card.reversed_action || "Release what no longer serves you";
    }
    return card.upright_action || "Take aligned action toward your goals";
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#07050f]/95 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }} onClick={() => onClose(false)}>
      <div className="min-h-[100dvh] w-full max-w-[430px] mx-auto bg-[#07050f] pointer-events-auto relative pb-[100px]" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={() => onClose(false)} className="absolute top-4 left-4 p-2 bg-[#160f2a] border border-[#a078ff]/15 rounded-full text-[#b4a0dc]/70 hover:text-white transition-colors z-10 font-['Cinzel'] text-[10px] tracking-[0.14em] uppercase shadow-[0_0_10px_rgba(167,139,250,0.15)] flex items-center justify-center">
          ‹ Back
        </button>

        <div className="p-[0_18px] pt-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="w-full max-w-[200px] mx-auto mt-[20px] aspect-[2/3] rounded-[16px] bg-gradient-to-br from-[#1e1438] to-[#0d0822] border-[2px] border-[#a78bfa]/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_40px_rgba(100,50,200,0.25)] flex items-center justify-center text-[60px] animate-in slide-in-from-top-8 fade-in duration-500 overflow-hidden relative">
            {showVideo && card.video_url ? (
              <video src={card.video_url} autoPlay muted playsInline loop className="w-full h-full object-cover" />
            ) : card.image_url ? (
              <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/40 font-['IM_Fell_English']">Card</span>
            )}
            {isReversed && (
              <div className="absolute inset-0 bg-[#7c3aed]/20 pointer-events-none" />
            )}
          </div>

          <div className="text-center mt-[18px]">
            <h2 className="font-['Cinzel'] text-[20px] tracking-[0.12em] uppercase bg-gradient-to-r from-[#c8a8ff] via-[#fff] to-[#a0c8ff] bg-[length:200%_auto] text-transparent bg-clip-text animate-[shimmer_4s_linear_infinite] mb-[4px]">
              {card.name}
            </h2>
            <div className="font-['Cinzel'] text-[10px] tracking-[0.14em] uppercase p-[5px_14px] rounded-full bg-[#a78bfa]/15 border border-[#a78bfa]/30 text-[#a78bfa] inline-flex items-center gap-[6px] mb-[18px]">
              {position || 'Reading'} {isReversed ? '· Reversed' : ''}
            </div>
          </div>

          {(card.upright_meaning || card.overall_meaning) && (
            <div className="bg-[#0f0b1e] border border-[#a078ff]/15 rounded-[14px] p-[16px] mb-[12px]">
              <div className="font-['Cinzel'] text-[9px] tracking-[0.22em] uppercase text-[#b4a0dc]/45 mb-[8px] flex items-center gap-[7px]">
                <span className="text-[13px]">↑</span> {isReversed ? 'Base Meaning' : 'Upright'}
              </div>
              <div className="font-['Crimson_Text'] text-[16px] text-[#e1d7ff]/90 leading-[1.65]">
                {card.upright_meaning || card.overall_meaning}
              </div>
              {(card.upright_insight || card.overall_meaning) && (
                <div className="font-['IM_Fell_English'] italic text-[14px] text-[#c8b4ff]/65 mt-[8px] leading-[1.55]">
                  {card.upright_insight || card.overall_meaning}
                </div>
              )}
              {card.upright_action && (
                <div className="mt-[10px] p-[10px_13px] rounded-[9px] bg-[#a78bfa]/[0.08] border border-[#a78bfa]/15 font-['Crimson_Text'] text-[14px] text-[#e1d7ff]/90 leading-[1.55]">
                  ✦ {card.upright_action}
                </div>
              )}
            </div>
          )}

          {isReversed && card.reversed_meaning && (
            <div className="bg-[#0f0b1e] border border-[#a078ff]/15 rounded-[14px] p-[16px] mb-[12px]">
              <div className="font-['Cinzel'] text-[9px] tracking-[0.22em] uppercase text-[#b4a0dc]/45 mb-[8px] flex items-center gap-[7px]">
                <span className="text-[13px]">↓</span> Reversed
              </div>
              <div className="font-['Crimson_Text'] text-[16px] text-[#e1d7ff]/90 leading-[1.65]">
                {card.reversed_meaning}
              </div>
              {card.reversed_insight && (
                <div className="font-['IM_Fell_English'] italic text-[14px] text-[#c8b4ff]/65 mt-[8px] leading-[1.55]">
                  {card.reversed_insight}
                </div>
              )}
              {card.reversed_action && (
                <div className="mt-[10px] p-[10px_13px] rounded-[9px] bg-[#a78bfa]/[0.08] border border-[#a78bfa]/15 font-['Crimson_Text'] text-[14px] text-[#e1d7ff]/90 leading-[1.55]">
                  ✦ {card.reversed_action}
                </div>
              )}
            </div>
          )}

          {card.keywords && card.keywords.length > 0 && (
            <div className="bg-[#0f0b1e] border border-[#a078ff]/15 rounded-[14px] p-[16px] mb-[12px]">
              <div className="font-['Cinzel'] text-[9px] tracking-[0.22em] uppercase text-[#b4a0dc]/45 mb-[8px] flex items-center gap-[7px]">
                <span className="text-[13px]">◈</span> Keywords
              </div>
              <div className="flex flex-wrap gap-[6px] mt-[10px]">
                {card.keywords.map((kw, i) => (
                  <span key={i} className="font-['Cinzel'] text-[8px] tracking-[0.1em] uppercase p-[4px_10px] rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#c8b4ff]/70">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.ancient_wisdom && (
            <div className="bg-[#0f0b1e] border border-[#a078ff]/15 rounded-[14px] p-[16px] mb-[12px]">
              <div className="font-['Cinzel'] text-[9px] tracking-[0.22em] uppercase text-[#b4a0dc]/45 mb-[8px] flex items-center gap-[7px]">
                <span className="text-[13px]">🌙</span> Ancient Wisdom
              </div>
              <div className="font-['IM_Fell_English'] italic text-[15px] text-[#e1d7ff]/90 leading-[1.65]">
                {card.ancient_wisdom}
              </div>
            </div>
          )}
          
          <div className="mt-8 mb-4">
            <button 
              onClick={copyCardInfo}
              className="w-full font-['Cinzel'] text-[10px] tracking-[0.14em] uppercase p-[12px] rounded-full border border-[#a078ff]/25 bg-[#160f2a] text-[#e1d7ff]/90 cursor-pointer transition-all hover:border-[#a78bfa] flex items-center justify-center gap-[5px]"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy Details"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}