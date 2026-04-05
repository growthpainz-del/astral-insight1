import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, RefreshCw, Eye, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Generate A-Z and 0-9
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const numbers = '0123456789'.split('');
const outerIds = [...alphabet, ...numbers];

const WHEEL_DATA = {
  outer: outerIds.map(id => {
    const special = {
      "A": { general: "New beginning / fresh start", Age: "Spirit Form", Height: "4'10\" - 6'10\"", "Lost Items": "Family member has it / High place", Time: "Morning (9-12am)" },
      "B": { general: "Communication / Inspiration", Age: "New Embryo - 9 Months", Height: "4'11\" - 6'11\"", "Lost Items": "Pocket / In xmas things" },
      "G": { general: "Growth", Age: "15-20 yrs", Height: "5'3\"", "Lost Items": "Bathroom", "Body Parts": "Groin", Colors: "Gold / Green / Grey / Glow", constellation: "Ursa Minor" },
      "J": { Time: "2:00 PM" },
      "N": { general: "Top center-right (handbook letter N in chosen category)" },
      "W": { general: "Wisdom", time_modifier: true },
      "0": { general: "Reset / blank slate" },
      "1": { general: "Direct number meaning (1)" },
      "2": { general: "Bottom left (Numbers category) - Direct number meaning (2)" },
      "3": { general: "Direct number meaning (3)" },
      "4": { general: "Direct number meaning (4)" },
      "5": { general: "Direct number meaning (5)" },
      "6": { general: "Direct number meaning (6)" },
      "7": { general: "Direct number meaning (7)" },
      "8": { general: "Direct number meaning (8)" },
      "9": { general: "Direct number meaning (9)" },
    };
    return { id, general: `Mystery of ${id}`, ...(special[id] || {}) };
  }),
  middle: [
    { id: "🚪", meaning: "Closed Door → Option closed / path shut" },
    { id: "♫", meaning: "Music Note → Creative flow & harmony" },
    { id: "11m", meaning: "November (11m) → Power month" },
    { id: "SP", meaning: "Spring" },
    { id: "FA", meaning: "Fall" },
    { id: "WI", meaning: "Winter" },
    { id: "SU", meaning: "Summer" },
    { id: "Purple", meaning: "Intuition / psychic download" },
    { id: "Red", meaning: "Fire / passion / sex" },
    { id: "Black", meaning: "Hidden / unconscious mind" },
    { id: "Square", meaning: "Window / Television / Computer" },
    { id: "Spiral", meaning: "Spinning / galaxy / space" },
    ...Array.from({length: 12}).map((_, i) => ({ id: `M${i}`, meaning: "Unknown depth" }))
  ],
  inner: [
    { id: "↑", meaning: "Go → Yes / forward motion" },
    { id: "?", meaning: "What? → Clarify the question" },
    { id: "😊", meaning: "Hi! → Positive energy is here" },
    { id: "BYE", meaning: "Until next time." },
    { id: "LOVE", meaning: "Heart connection, romance, deep feeling." },
    { id: "STOP", meaning: "Stop / Nothing." },
    ...Array.from({length: 6}).map((_, i) => ({ id: `I${i}`, meaning: "Inner voice" }))
  ]
};

const CATEGORIES = ["General", "Age", "Body Parts", "Colors", "Lost Items", "Height", "Time", "Zapped", "X-Rated"];

export default function SpiritWheel() {
  const [category, setCategory] = useState("General");
  const [blankMode, setBlankMode] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotations, setRotations] = useState({ outer: 0, middle: 0, inner: 0 });
  const [selectedIndices, setSelectedIndices] = useState({ outer: 0, middle: 0, inner: 0 });
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsRevealed(false);
    setAiInterpretation("");
    
    const newOuter = rotations.outer + 360 * 3 + Math.floor(Math.random() * 36) * 10;
    const newMiddle = rotations.middle - 360 * 3 - Math.floor(Math.random() * 24) * 15;
    const newInner = rotations.inner + 360 * 4 + Math.floor(Math.random() * 12) * 30;

    setRotations({ outer: newOuter, middle: newMiddle, inner: newInner });

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedIndices({
        outer: (36 - Math.round((newOuter % 360) / 10)) % 36,
        middle: Math.round((Math.abs(newMiddle) % 360) / 15) % 24, // reverse direction
        inner: (12 - Math.round((newInner % 360) / 30)) % 12
      });
      if (!blankMode) {
        setIsRevealed(true);
      }
    }, 4000);
  };

  const getSegmentText = (ring, index) => {
    if (ring === 'outer') {
      const item = WHEEL_DATA.outer[index];
      if (category === 'Time') {
        if (item.Time) return item.Time;
        // Base 44 Time Logic checking for modifiers would go here, simplified for display:
        return item.general || item.id;
      }
      if (category !== 'General' && item[category]) return item[category];
      return item.general || item.id;
    }
    if (ring === 'middle') return WHEEL_DATA.middle[index].meaning;
    if (ring === 'inner') return WHEEL_DATA.inner[index].meaning;
    return "";
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const getInterpretation = async () => {
    setIsAiLoading(true);
    try {
      const outerItem = WHEEL_DATA.outer[selectedIndices.outer];
      const middleItem = WHEEL_DATA.middle[selectedIndices.middle];
      const innerItem = WHEEL_DATA.inner[selectedIndices.inner];

      const prompt = `You are the Spirit Wheel Interpreter. You must never offer personal opinions.
      Active Category: ${category}
      Outer Segment: ${outerItem.id} -> ${getSegmentText('outer', selectedIndices.outer)}
      Middle Segment: ${middleItem.id} -> ${middleItem.meaning}
      Inner Segment: ${innerItem.id} -> ${innerItem.meaning}
      
      If the user is in 'Zapped' or 'X-Rated' mode, provide the high-intensity warning results immediately without softening the language.
      Strictly use handbook text without hallucinating additional meanings.
      Always provide the response in a clean block for copy-pasting.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setAiInterpretation(response.text || response);
    } catch (e) {
      console.error(e);
      setAiInterpretation("Failed to get interpretation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-amber-50 p-4 md:p-8 font-serif bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-blend-multiply">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Controls & Display */}
        <div className="flex-1 space-y-6 z-10">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/50">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Spirit Wheel</h1>
              <p className="text-amber-200/80">Astro Insights Digital Reading Room</p>
            </div>
          </div>

          <div className="bg-slate-900/90 p-6 rounded-xl border border-[#8b5a2b] shadow-[0_4px_20px_rgba(0,0,0,0.5)] space-y-5">
            <div>
              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Category-Shift Logic</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#2d1b0d]/50 rounded-lg border border-[#5c3a21]">
              <div>
                <div className="font-semibold text-amber-200">"Blank Tile" Imagine Mode</div>
                <div className="text-sm text-amber-200/60">Hide meanings until you meditate on them</div>
              </div>
              <Switch checked={blankMode} onCheckedChange={setBlankMode} className="data-[state=checked]:bg-amber-600" />
            </div>

            <Button 
              onClick={spinWheel} 
              disabled={isSpinning}
              className="w-full bg-[#8b5a2b] hover:bg-[#a66d35] text-amber-50 py-8 text-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.4)] border border-[#a66d35]"
            >
              {isSpinning ? <RefreshCw className="animate-spin w-6 h-6 mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
              {isSpinning ? "Channeling the Spirits..." : "Spin the Wheel"}
            </Button>
          </div>

          {/* Results Area */}
          <div className="bg-slate-900/90 p-6 rounded-xl border border-[#8b5a2b] min-h-[250px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold text-amber-400 mb-4 border-b border-[#5c3a21] pb-3">Reading Results</h2>
            
            {isSpinning ? (
              <div className="flex items-center justify-center h-48 text-amber-200/50 animate-pulse text-lg">
                The wheel turns, seeking answers...
              </div>
            ) : blankMode && !isRevealed && !isSpinning && (rotations.outer > 0) ? (
              <div className="text-center space-y-6 py-10">
                <p className="text-amber-200 italic text-lg">Focus on the shapes and letters.<br/>Take 3 seconds to imagine the meaning...</p>
                <Button onClick={handleReveal} className="bg-[#4a331a] hover:bg-[#5c3a21] border border-[#8b5a2b] text-lg px-8 py-6">
                  <Eye className="w-5 h-5 mr-2" /> Reveal Truth
                </Button>
              </div>
            ) : isRevealed ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
                  <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between">
                    <span>Outer Ring</span>
                    <span className="text-amber-300">[{WHEEL_DATA.outer[selectedIndices.outer].id}]</span>
                  </div>
                  <div className="text-xl text-amber-50">{getSegmentText('outer', selectedIndices.outer)}</div>
                </div>
                
                <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
                  <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between">
                    <span>Middle Ring</span>
                    <span className="text-amber-300">[{WHEEL_DATA.middle[selectedIndices.middle].id}]</span>
                  </div>
                  <div className="text-xl text-amber-50">{getSegmentText('middle', selectedIndices.middle)}</div>
                </div>
                
                <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
                  <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between">
                    <span>Inner Ring</span>
                    <span className="text-amber-300">[{WHEEL_DATA.inner[selectedIndices.inner].id}]</span>
                  </div>
                  <div className="text-xl text-amber-50">{getSegmentText('inner', selectedIndices.inner)}</div>
                </div>
                
                <Button onClick={getInterpretation} disabled={isAiLoading} className="w-full mt-6 bg-[#3b2313] hover:bg-[#4a2c18] border border-[#8b5a2b] text-lg py-6">
                  {isAiLoading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin text-amber-400" /> : <Sparkles className="w-5 h-5 mr-2 text-amber-400" />}
                  Ask AI Oracle Engine
                </Button>

                {aiInterpretation && (
                  <div className="mt-6 p-5 bg-[#0a0502] rounded-lg border border-[#8b5a2b] whitespace-pre-wrap text-base text-amber-100 leading-relaxed shadow-inner">
                    <div className="text-amber-500 text-sm font-bold uppercase mb-2">Oracle Interpretation</div>
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
        </div>

        {/* Right Column: The Visual Wheel */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative min-h-[400px] lg:min-h-[600px]">
          <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
            {/* Pointer / Indicator at top */}
            <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-amber-500 z-50 drop-shadow-[0_2px_10px_rgba(245,158,11,0.9)]"></div>

            {/* Outer Ring (36) */}
            <motion.div 
              className="absolute inset-0 rounded-full border-[6px] border-[#5c3a21] bg-[#4a2c18] overflow-hidden"
              style={{
                background: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png"), radial-gradient(circle, #3a2818 0%, #2a1b0a 100%)',
                backgroundBlendMode: 'multiply',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.8)'
              }}
              animate={{ rotate: rotations.outer }}
              transition={{ duration: 4.5, type: "tween", ease: "circOut" }}
            >
              {WHEEL_DATA.outer.map((item, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * 10}deg)` }}
                >
                  <div className="absolute top-3 -translate-x-1/2 text-xs md:text-sm lg:text-base font-bold text-amber-200 drop-shadow-md" style={{ opacity: blankMode && !isRevealed ? 0 : 1, transition: 'opacity 0.3s' }}>
                    {item.id}
                  </div>
                  {/* Segment dividers */}
                  <div className="absolute top-0 -translate-x-1/2 w-[2px] h-full bg-[#1a0f05]/40" style={{ transform: 'rotate(5deg)' }}></div>
                </div>
              ))}
            </motion.div>

            {/* Middle Ring (24) */}
            <motion.div 
              className="absolute inset-[18%] rounded-full border-[5px] border-[#3b2313] bg-[#2d1b0d] overflow-hidden"
              style={{
                background: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png"), radial-gradient(circle, #2d1b0d 0%, #1c0f05 100%)',
                backgroundBlendMode: 'multiply',
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.9), 0 5px 20px rgba(0,0,0,0.6)'
              }}
              animate={{ rotate: rotations.middle }}
              transition={{ duration: 4.2, type: "tween", ease: "circOut" }}
            >
              {WHEEL_DATA.middle.map((item, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * 15}deg)` }}
                >
                  <div className="absolute top-3 -translate-x-1/2 text-[10px] md:text-sm lg:text-base font-bold text-amber-300 drop-shadow-md whitespace-nowrap" style={{ opacity: blankMode && !isRevealed ? 0 : 1, transition: 'opacity 0.3s' }}>
                    {item.id}
                  </div>
                  {/* Segment dividers */}
                  <div className="absolute top-0 -translate-x-1/2 w-[2px] h-full bg-[#0a0502]/50" style={{ transform: 'rotate(7.5deg)' }}></div>
                </div>
              ))}
            </motion.div>

            {/* Inner Ring (12) */}
            <motion.div 
              className="absolute inset-[38%] rounded-full border-[4px] border-[#2a180c] bg-[#1a0f05] overflow-hidden"
              style={{
                background: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png"), radial-gradient(circle, #1a0f05 0%, #0a0502 100%)',
                backgroundBlendMode: 'multiply',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.7)'
              }}
              animate={{ rotate: rotations.inner }}
              transition={{ duration: 3.8, type: "tween", ease: "circOut" }}
            >
              {WHEEL_DATA.inner.map((item, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="absolute top-4 -translate-x-1/2 text-sm md:text-lg lg:text-xl font-bold text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" style={{ opacity: blankMode && !isRevealed ? 0 : 1, transition: 'opacity 0.3s' }}>
                    {item.id}
                  </div>
                  {/* Segment dividers */}
                  <div className="absolute top-0 -translate-x-1/2 w-[2px] h-full bg-black/60" style={{ transform: 'rotate(15deg)' }}></div>
                </div>
              ))}
            </motion.div>
            
            {/* Center Hub */}
            <div className="absolute inset-[44%] rounded-full border-4 border-amber-600 bg-[#8b5a2b] shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 flex items-center justify-center"
                 style={{ background: 'radial-gradient(circle, #a66d35 0%, #5c3a21 100%)' }}>
              <div className="w-4 h-4 md:w-6 md:h-6 bg-amber-200 rounded-full shadow-[0_0_10px_rgba(253,230,138,0.8)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}