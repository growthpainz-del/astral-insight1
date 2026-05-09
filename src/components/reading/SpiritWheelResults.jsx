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
    <div className="bg-slate-900/90 p-6 rounded-xl border border-[#8b5a2b] min-h-[250px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <h2 className="text-xl font-bold text-amber-400 mb-4 border-b border-[#5c3a21] pb-3">Reading Results</h2>
      
      {isSpinning ? (
        <div className="flex items-center justify-center h-48 text-amber-200/50 animate-pulse text-lg">
          The wheel turns, seeking answers...
        </div>
      ) : blankMode && !isRevealed && !isSpinning && (rotations.outer1 > 0) ? (
        <div className="text-center space-y-6 py-10">
          <p className="text-amber-200 italic text-lg">Focus on the shapes and letters.<br/>Take 3 seconds to imagine the meaning...</p>
          <Button onClick={handleReveal} className="bg-[#4a331a] hover:bg-[#5c3a21] border border-[#8b5a2b] text-lg px-8 py-6">
            <Eye className="w-5 h-5 mr-2" /> Reveal Truth
          </Button>
        </div>
      ) : isRevealed ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {wheelData.outer1.length > 0 && (
            <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
              <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                <span>Outer Ring 1</span>
                {isImageSymbol(wheelData.outer1[selectedIndices.outer1]?.id) ? (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getThumbnailUrl(getImageUrl(wheelData.outer1[selectedIndices.outer1]?.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] rounded-full" />
                  </div>
                ) : (
                  <span className="text-amber-300 bg-black/20 px-2 py-0.5 rounded">
                    {wheelData.outer1[selectedIndices.outer1]?.id || 'N/A'}
                  </span>
                )}
              </div>
              <div className="text-xl text-amber-50">{getSegmentText('outer1', selectedIndices.outer1)}</div>
            </div>
          )}

          {wheelData.outer2.length > 0 && (
            <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
              <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                <span>Outer Ring 2</span>
                {isImageSymbol(wheelData.outer2[selectedIndices.outer2]?.id) ? (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getThumbnailUrl(getImageUrl(wheelData.outer2[selectedIndices.outer2]?.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] rounded-full" />
                  </div>
                ) : (
                  <span className="text-amber-300 bg-black/20 px-2 py-0.5 rounded">
                    {wheelData.outer2[selectedIndices.outer2]?.id || 'N/A'}
                  </span>
                )}
              </div>
              <div className="text-xl text-amber-50">{getSegmentText('outer2', selectedIndices.outer2)}</div>
            </div>
          )}
          
          {wheelData.middle.length > 0 && (
            <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
              <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                <span>Middle Ring</span>
                {isImageSymbol(wheelData.middle[selectedIndices.middle]?.id) ? (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getThumbnailUrl(getImageUrl(wheelData.middle[selectedIndices.middle]?.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] rounded-full" />
                  </div>
                ) : (
                  <span className="text-amber-300 bg-black/20 px-2 py-0.5 rounded">
                    {wheelData.middle[selectedIndices.middle]?.id || 'N/A'}
                  </span>
                )}
              </div>
              <div className="text-xl text-amber-50">{getSegmentText('middle', selectedIndices.middle)}</div>
            </div>
          )}
          
          {wheelData.inner.length > 0 && (
            <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
              <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                <span>Inner Ring</span>
                {isImageSymbol(wheelData.inner[selectedIndices.inner]?.id) ? (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getThumbnailUrl(getImageUrl(wheelData.inner[selectedIndices.inner]?.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] rounded-full" />
                  </div>
                ) : (
                  <span className="text-amber-300 bg-black/20 px-2 py-0.5 rounded">
                    {wheelData.inner[selectedIndices.inner]?.id || 'N/A'}
                  </span>
                )}
              </div>
              <div className="text-xl text-amber-50">{getSegmentText('inner', selectedIndices.inner)}</div>
            </div>
          )}
          
          {wheelData.rune && wheelData.rune.length > 0 && (
            <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#ea580c] shadow-[0_0_10px_rgba(234,88,12,0.2)]">
              <div className="text-sm text-orange-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                <span>Rune Ring</span>
                {isImageSymbol(wheelData.rune[selectedIndices.rune]?.id) ? (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getThumbnailUrl(getImageUrl(wheelData.rune[selectedIndices.rune]?.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] rounded-full" />
                  </div>
                ) : (
                  <span className="text-orange-300 bg-black/20 px-2 py-0.5 rounded">
                    {wheelData.rune[selectedIndices.rune]?.id || 'N/A'}
                  </span>
                )}
              </div>
              <div className="text-xl text-amber-50">{getSegmentText('rune', selectedIndices.rune)}</div>
            </div>
          )}

          {metatronResult && activeTheme.metatron?.enabled && (
            <div className="p-4 bg-gradient-to-r from-[#1c0f05] to-[#2d1b0d] rounded-lg border border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <div className="text-sm text-[#d4af37]/80 uppercase font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Sacred Geometry Alignment
              </div>
              <div className="text-lg text-amber-50">
                Zone: <span className="font-bold text-[#d4af37]">{metatronResult.zone}</span> 
                <span className="text-sm text-amber-200/50 ml-2">({Math.round(metatronResult.sectorAngle)}°)</span>
              </div>
              <div className="text-sm text-amber-200/80 italic mt-1">{metatronResult.description}</div>
            </div>
          )}
          
          <div data-html2canvas-ignore="true">
            <Button onClick={getInterpretation} disabled={isAiLoading} className="w-full mt-6 bg-[#3b2313] hover:bg-[#4a2c18] border border-[#8b5a2b] text-lg py-6">
              {isAiLoading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin text-amber-400" /> : <Eye className="w-5 h-5 mr-2 text-amber-400" />}
              Reveal Instant Reading
            </Button>

            <Link to={aiInterpretation ? `${createPageUrl("AgentChat")}?initialMessage=${encodeURIComponent(`I just did a Spirit Wheel reading. Here are the results:\n\n${aiInterpretation}\n\nPlease provide a deeper insight into these results and discuss this reading with me.`)}` : createPageUrl("AgentChat")} className="block mt-4">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border border-purple-400/50 text-lg py-6 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Sparkles className="w-5 h-5 mr-2 text-purple-200" />
                Deep Dive with Oracle Chat (Premium)
              </Button>
            </Link>
          </div>

          {aiInterpretation && (
            <div className="mt-6 p-5 bg-[#0a0502] rounded-lg border border-[#8b5a2b] whitespace-pre-wrap text-base text-amber-100 leading-relaxed shadow-inner relative">
              <div className="flex justify-between items-center mb-2">
                <div className="text-amber-500 text-sm font-bold uppercase">Oracle Interpretation</div>
                <div data-html2canvas-ignore="true" className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowReportDialog(true)}
                    className="bg-red-900/20 hover:bg-red-900/40 border-red-500/30 text-red-400 h-8"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowShareModal(true)}
                    className="bg-[#3b2313] hover:bg-[#4a2c18] border-[#8b5a2b] text-amber-400 h-8"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleSaveReading}
                    disabled={isSaving}
                    className="bg-[#3b2313] hover:bg-[#4a2c18] border-[#8b5a2b] text-amber-400 h-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Reading"}
                  </Button>
                </div>
              </div>
              {aiInterpretation}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-amber-200/30 text-lg">
          Spin the wheel to consult the oracle
        </div>
      )}
    </div>
  );
}