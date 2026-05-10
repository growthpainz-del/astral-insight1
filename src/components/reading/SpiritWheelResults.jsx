import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw, Sparkles, Flag, Share2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isImageSymbol, getImageUrl } from '@/lib/spiritWheelLogic';
import { getThumbnailUrl } from "@/lib/utils";

export default function SpiritWheelResults({ 
  isSpinning, blankMode, isRevealed, rotations, handleReveal, 
  wheelData, selectedIndices, metatronResult, activeTheme, 
  getInterpretation, isAiLoading, aiInterpretation, 
  setShowShareModal, handleSaveReading, isSaving, setShowReportDialog 
}) {

  const getSegmentText = (ring, index) => {
    if (ring === 'outer1') {
      const item = wheelData.outer1[index];
      return item?.name || item?.id || "";
    }
    if (ring === 'outer2') {
      const item = wheelData.outer2[index];
      return item?.name || item?.id || "";
    }
    if (ring === 'middle') return wheelData.middle[index]?.meaning || "";
    if (ring === 'inner') return wheelData.inner[index]?.meaning || "";
    if (ring === 'rune') return wheelData.rune[index]?.meaning || "";
    return "";
  };

  return (
    <div className="w-full flex flex-col pt-[16px] min-h-[250px]">
      <div className="px-[18px]">
        <div 
          className="flex items-center gap-[8px] mb-[12px] text-[13px] tracking-[0.12em] text-[#c9a84c] border-b border-[rgba(201,168,76,0.2)] pb-[8px]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Reading Results
        </div>
      </div>
      
      {isSpinning ? (
        <div className="flex items-center justify-center h-[160px] text-[rgba(201,168,76,0.5)] animate-pulse text-[16px] italic px-[18px]" style={{ fontFamily: "'IM Fell English', serif" }}>
          The wheel turns, seeking answers...
        </div>
      ) : blankMode && !isRevealed && !isSpinning && (rotations.outer1 > 0) ? (
        <div className="text-center space-y-[24px] py-[40px] px-[18px]">
          <p className="text-[rgba(240,225,190,0.95)] italic text-[16px]" style={{ fontFamily: "'IM Fell English', serif" }}>
            Focus on the shapes and letters.<br/>Take 3 seconds to imagine the meaning...
          </p>
          <button 
            onClick={handleReveal} 
            className="px-[32px] py-[16px] rounded-[12px] border border-[rgba(201,168,76,0.3)] bg-gradient-to-br from-[#3d2008] to-[#5c3310] text-[rgba(240,220,170,0.9)] text-[12px] tracking-[0.15em] uppercase shadow-[0_3px_14px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer flex items-center justify-center mx-auto gap-[8px]"
            style={{ fontFamily: "'Cinzel', serif" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
          >
            👁 Reveal Truth
          </button>
        </div>
      ) : isRevealed ? (
        <div className="px-[18px] pb-[16px]">
          <div className="space-y-[9px] animate-in fade-in slide-in-from-left-4 duration-400">
            {wheelData.outer1.length > 0 && (
              <div 
                className="flex items-center justify-between p-[13px] px-[14px] rounded-[13px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[rgba(61,32,8,0.9)] to-[rgba(30,14,5,0.95)] transition-colors duration-200"
                style={{ animation: "resultReveal 0.4s ease both", animationDelay: "0.1s" }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"}
              >
                <div>
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#c9a84c] mb-[5px] opacity-80" style={{ fontFamily: "'Cinzel', serif" }}>Outer Ring 1</div>
                  <div className="text-[13px] tracking-[0.08em] uppercase text-[rgba(240,225,190,0.95)]" style={{ fontFamily: "'Cinzel', serif" }}>
                    {getSegmentText('outer1', selectedIndices.outer1)}
                  </div>
                </div>
                <div className="text-[22px] opacity-75 shrink-0 ml-[12px]">
                  {isImageSymbol(wheelData.outer1[selectedIndices.outer1]?.id) ? (
                    <img src={getThumbnailUrl(getImageUrl(wheelData.outer1[selectedIndices.outer1]?.id), 100)} alt="" className="w-[30px] h-[30px] object-contain rounded-full" />
                  ) : (
                    wheelData.outer1[selectedIndices.outer1]?.id || '✦'
                  )}
                </div>
              </div>
            )}

            {wheelData.outer2.length > 0 && (
              <div 
                className="flex items-center justify-between p-[13px] px-[14px] rounded-[13px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[rgba(61,32,8,0.9)] to-[rgba(30,14,5,0.95)] transition-colors duration-200"
                style={{ animation: "resultReveal 0.4s ease both", animationDelay: "0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"}
              >
                <div>
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#c9a84c] mb-[5px] opacity-80" style={{ fontFamily: "'Cinzel', serif" }}>Outer Ring 2</div>
                  <div className="text-[13px] tracking-[0.08em] uppercase text-[rgba(240,225,190,0.95)]" style={{ fontFamily: "'Cinzel', serif" }}>
                    {getSegmentText('outer2', selectedIndices.outer2)}
                  </div>
                </div>
                <div className="text-[22px] opacity-75 shrink-0 ml-[12px]">
                  {isImageSymbol(wheelData.outer2[selectedIndices.outer2]?.id) ? (
                    <img src={getThumbnailUrl(getImageUrl(wheelData.outer2[selectedIndices.outer2]?.id), 100)} alt="" className="w-[30px] h-[30px] object-contain rounded-full" />
                  ) : (
                    wheelData.outer2[selectedIndices.outer2]?.id || '✦'
                  )}
                </div>
              </div>
            )}
            
            {wheelData.middle.length > 0 && (
              <div 
                className="flex items-center justify-between p-[13px] px-[14px] rounded-[13px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[rgba(61,32,8,0.9)] to-[rgba(30,14,5,0.95)] transition-colors duration-200"
                style={{ animation: "resultReveal 0.4s ease both", animationDelay: "0.3s" }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"}
              >
                <div>
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#c9a84c] mb-[5px] opacity-80" style={{ fontFamily: "'Cinzel', serif" }}>Middle Ring</div>
                  <div className="text-[14px] italic text-[rgba(180,160,130,0.8)]" style={{ fontFamily: "'IM Fell English', serif" }}>
                    {getSegmentText('middle', selectedIndices.middle)}
                  </div>
                </div>
                <div className="text-[22px] opacity-40 shrink-0 ml-[12px]">
                  {isImageSymbol(wheelData.middle[selectedIndices.middle]?.id) ? (
                    <img src={getThumbnailUrl(getImageUrl(wheelData.middle[selectedIndices.middle]?.id), 100)} alt="" className="w-[30px] h-[30px] object-contain rounded-full" />
                  ) : (
                    wheelData.middle[selectedIndices.middle]?.id || '◈'
                  )}
                </div>
              </div>
            )}
            
            {wheelData.inner.length > 0 && (
              <div 
                className="flex items-center justify-between p-[13px] px-[14px] rounded-[13px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[rgba(61,32,8,0.9)] to-[rgba(30,14,5,0.95)] transition-colors duration-200"
                style={{ animation: "resultReveal 0.4s ease both", animationDelay: "0.4s" }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"}
              >
                <div>
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#c9a84c] mb-[5px] opacity-80" style={{ fontFamily: "'Cinzel', serif" }}>Inner Ring</div>
                  <div className="text-[14px] italic text-[rgba(180,160,130,0.8)]" style={{ fontFamily: "'IM Fell English', serif" }}>
                    {getSegmentText('inner', selectedIndices.inner)}
                  </div>
                </div>
                <div className="text-[22px] opacity-40 shrink-0 ml-[12px]">
                  {isImageSymbol(wheelData.inner[selectedIndices.inner]?.id) ? (
                    <img src={getThumbnailUrl(getImageUrl(wheelData.inner[selectedIndices.inner]?.id), 100)} alt="" className="w-[30px] h-[30px] object-contain rounded-full" />
                  ) : (
                    wheelData.inner[selectedIndices.inner]?.id || '◎'
                  )}
                </div>
              </div>
            )}
            
            {wheelData.rune && wheelData.rune.length > 0 && (
              <div 
                className="flex items-center justify-between p-[13px] px-[14px] rounded-[13px] border border-[rgba(234,88,12,0.3)] bg-gradient-to-br from-[rgba(61,32,8,0.9)] to-[rgba(30,14,5,0.95)] transition-colors duration-200"
                style={{ animation: "resultReveal 0.4s ease both", animationDelay: "0.5s" }}
              >
                <div>
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#f97316] mb-[5px] opacity-80" style={{ fontFamily: "'Cinzel', serif" }}>Rune Ring</div>
                  <div className="text-[13px] tracking-[0.08em] uppercase text-[rgba(240,225,190,0.95)]" style={{ fontFamily: "'Cinzel', serif" }}>
                    {getSegmentText('rune', selectedIndices.rune)}
                  </div>
                </div>
                <div className="text-[22px] opacity-75 shrink-0 ml-[12px]">
                  {isImageSymbol(wheelData.rune[selectedIndices.rune]?.id) ? (
                    <img src={getThumbnailUrl(getImageUrl(wheelData.rune[selectedIndices.rune]?.id), 100)} alt="" className="w-[30px] h-[30px] object-contain rounded-full" />
                  ) : (
                    wheelData.rune[selectedIndices.rune]?.id || 'ᛉ'
                  )}
                </div>
              </div>
            )}

            {metatronResult && activeTheme.metatron?.enabled && (
              <div 
                className="p-[13px] px-[14px] rounded-[13px] border border-[#d4af37] bg-gradient-to-r from-[#1c0f05] to-[#2d1b0d] shadow-[0_0_15px_rgba(212,175,55,0.2)] mt-[9px]"
                style={{ animation: "resultReveal 0.4s ease both", animationDelay: "0.6s" }}
              >
                <div className="text-[8px] tracking-[0.2em] uppercase text-[#d4af37] mb-[8px] opacity-80 flex items-center gap-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>
                  <Sparkles className="w-[10px] h-[10px]" /> Sacred Geometry Alignment
                </div>
                <div className="text-[14px] text-[rgba(240,225,190,0.95)] font-bold">
                  Zone: <span className="text-[#d4af37]">{metatronResult.zone}</span> 
                  <span className="text-[12px] text-[rgba(240,225,190,0.5)] ml-[6px] font-normal">({Math.round(metatronResult.sectorAngle)}°)</span>
                </div>
                <div className="text-[13px] text-[rgba(240,225,190,0.7)] italic mt-[4px]" style={{ fontFamily: "'IM Fell English', serif" }}>
                  {metatronResult.description}
                </div>
              </div>
            )}
            
            <div data-html2canvas-ignore="true" className="pt-[14px]">
              <button 
                onClick={getInterpretation} disabled={isAiLoading} 
                className="w-full py-[13px] rounded-[12px] border border-[rgba(201,168,76,0.3)] bg-gradient-to-br from-[#3d2008] to-[#5c3310] text-[rgba(240,220,170,0.9)] text-[11px] tracking-[0.15em] uppercase shadow-[0_3px_14px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-[9px] mb-[10px]"
                style={{ fontFamily: "'Cinzel', serif" }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
              >
                {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[#c9a84c]" /> : <Eye className="w-4 h-4 text-[#c9a84c]" />}
                Reveal Instant Reading
              </button>

              <Link to={aiInterpretation ? `${createPageUrl("AgentChat")}?initialMessage=${encodeURIComponent(`I just did a Spirit Wheel reading. Here are the results:\n\n${aiInterpretation}\n\nPlease provide a deeper insight into these results and discuss this reading with me.`)}` : createPageUrl("AgentChat")} className="block">
                <button 
                  className="w-full py-[13px] rounded-[12px] border-none text-[#fff] text-[11px] tracking-[0.15em] uppercase shadow-[0_4px_18px_rgba(124,58,237,0.4)] transition-transform duration-200 cursor-pointer flex items-center justify-center gap-[9px] bg-gradient-to-br from-[#4c1d95] via-[#7c3aed] to-[#a78bfa]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  ✦ Deep Dive with Oracle Chat
                </button>
              </Link>
            </div>

            {aiInterpretation && (
              <div className="mt-[16px] p-[20px] bg-[#0a0502] rounded-[12px] border border-[#8b5a2b] whitespace-pre-wrap text-[15px] text-[rgba(240,225,190,0.9)] leading-relaxed shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative">
                <div className="flex justify-between items-center mb-[14px]">
                  <div className="text-[#c9a84c] text-[11px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: "'Cinzel', serif" }}>Oracle Interpretation</div>
                  <div data-html2canvas-ignore="true" className="flex gap-[6px]">
                    <button 
                      onClick={() => setShowReportDialog(true)}
                      className="px-[10px] py-[6px] rounded-[6px] border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#ef4444] text-[9px] tracking-[0.1em] uppercase cursor-pointer hover:bg-[rgba(239,68,68,0.2)] transition-colors flex items-center gap-[4px]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Report
                    </button>
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="px-[10px] py-[6px] rounded-[6px] border border-[#8b5a2b] bg-[#3b2313] hover:bg-[#4a2c18] text-[#c9a84c] text-[9px] tracking-[0.1em] uppercase cursor-pointer transition-colors flex items-center gap-[4px]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Share
                    </button>
                    <button 
                      onClick={handleSaveReading}
                      disabled={isSaving}
                      className="px-[10px] py-[6px] rounded-[6px] border border-[#8b5a2b] bg-[#3b2313] hover:bg-[#4a2c18] text-[#c9a84c] text-[9px] tracking-[0.1em] uppercase cursor-pointer transition-colors flex items-center gap-[4px]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: "'Crimson Text', serif" }}>
                  {aiInterpretation}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[160px] text-[rgba(201,168,76,0.3)] text-[16px] italic px-[18px]" style={{ fontFamily: "'IM Fell English', serif" }}>
          Spin the wheel to consult the oracle
        </div>
      )}
    </div>
  );
}