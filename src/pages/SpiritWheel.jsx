import React, { useState, useEffect } from 'react';
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
const numbers = '123456789'.split('');
const outerIds = [...alphabet, 'ZERO', ...numbers];

const WHEEL_DATA = {
  outer: outerIds.map(id => {
    const special = {
      "A": { general: "New beginning / fresh start", Age: "Spirit Form", Height: "4'10\" - 6'10\"", "Lost Items": "Family member has it / High place", Time: "Morning (9-12am)" },
      "B": { general: "Communication / Inspiration", Age: "New Embryo - 9 Months", Height: "4'11\" - 6'11\"", "Lost Items": "Pocket / In xmas things" },
      "G": { general: "Growth", Age: "15-20 yrs", Height: "5'3\"", "Lost Items": "Bathroom", "Body Parts": "Groin", Colors: "Gold / Green / Grey / Glow", constellation: "Ursa Minor" },
      "J": { Time: "2:00 PM" },
      "N": { general: "Top center-right (handbook letter N in chosen category)" },
      "W": { general: "Wisdom", time_modifier: true },
      "ZERO": { general: "Reset / blank slate" },
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
    { id: "Blue", meaning: "Communication / Truth" },
    { id: "Green", meaning: "Growth / Healing" },
    { id: "Yellow", meaning: "Joy / Energy" },
    { id: "White", meaning: "Purity / Spirit" },
    { id: "Brown", meaning: "Grounding / Earth" },
    { id: "LightBlue", meaning: "Peace / Calm" },
    { id: "Square", meaning: "Window / Television / Computer" },
    { id: "Spiral", meaning: "Spinning / galaxy / space" },
    { id: "👁️", meaning: "Eye → Watching / awareness" },
    { id: "⛺", meaning: "Tent → Temporary shelter / camping" },
    { id: "☕", meaning: "Mug → Comfort / morning / meeting" },
    { id: "✅", meaning: "Check → Confirmed / correct" },
    { id: "☹️", meaning: "Sad → Disappointment / sorrow" },
    { id: "🔭", meaning: "Telescope → Looking far ahead / seeking" }
  ],
  inner: [
    { id: "↑", meaning: "Go → Yes / forward motion" },
    { id: "?", meaning: "What? → Clarify the question" },
    { id: "😊", meaning: "Hi! → Positive energy is here" },
    { id: "BYE", meaning: "Until next time." },
    { id: "LOVE", meaning: "Heart connection, romance, deep feeling." },
    { id: "STOP", meaning: "Stop / Nothing." },
    { id: "⏳", meaning: "Hourglass → Time is passing / wait" },
    { id: "↓", meaning: "Down Arrow → Grounding / dig deeper" },
    { id: "◬", meaning: "Triangle → Manifestation / power" },
    { id: "$", meaning: "Money → Financial focus / abundance" },
    { id: "❤️", meaning: "Heart → Deep love / affection" },
    { id: "★", meaning: "Star → Hope / guidance / fame" }
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

  const [themeId, setThemeId] = useState("wood");
  const [customTheme, setCustomTheme] = useState({
    outerBg: "#e6b981", outerGrad: "#c48b53", outerBorder: "#2b1810",
    middleBg: "#d4a373", middleGrad: "#b57a42", middleBorder: "#2b1810",
    innerBg: "#b57a42", innerGrad: "#9c602d", innerBorder: "#2b1810",
    hubBorder: "#2b1810", hubBg: "black",
    textOuter: "#2b1810", textMiddle: "#2b1810", textInner: "#2b1810",
    divider: "#2b1810", pin: "#e2e8f0",
    textureUrl: "https://www.transparenttextures.com/patterns/wood-pattern.png",
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif'
  });

  const WHEEL_THEMES = {
    wood: {
      name: "Classic Wood",
      outerBg: "#e6b981", outerGrad: "#c48b53", outerBorder: "#2b1810",
      middleBg: "#d4a373", middleGrad: "#b57a42", middleBorder: "#2b1810",
      innerBg: "#b57a42", innerGrad: "#9c602d", innerBorder: "#2b1810",
      hubBorder: "#2b1810", hubBg: "black",
      textOuter: "#2b1810", textMiddle: "#2b1810", textInner: "#2b1810",
      divider: "#2b1810", pin: "#e2e8f0",
      textureUrl: "https://www.transparenttextures.com/patterns/wood-pattern.png",
      fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif'
    },
    galaxy: {
      name: "Cosmic Galaxy",
      outerBg: "#1e1b4b", outerGrad: "#0f172a", outerBorder: "#818cf8",
      middleBg: "#2e1065", middleGrad: "#1e1b4b", middleBorder: "#818cf8",
      innerBg: "#3b0764", innerGrad: "#2e1065", innerBorder: "#818cf8",
      hubBorder: "#c084fc", hubBg: "#0f172a",
      textOuter: "#e0e7ff", textMiddle: "#e0e7ff", textInner: "#e0e7ff",
      divider: "#4f46e5", pin: "#fcd34d",
      textureUrl: "https://www.transparenttextures.com/patterns/stardust.png",
      fontFamily: 'serif'
    },
    neon: {
      name: "Cyber Neon",
      outerBg: "#000000", outerGrad: "#0a0a0a", outerBorder: "#06b6d4",
      middleBg: "#000000", middleGrad: "#0a0a0a", middleBorder: "#ec4899",
      innerBg: "#000000", innerGrad: "#0a0a0a", innerBorder: "#8b5cf6",
      hubBorder: "#10b981", hubBg: "#000000",
      textOuter: "#22d3ee", textMiddle: "#f472b6", textInner: "#c084fc",
      divider: "#333333", pin: "#ffffff",
      textureUrl: "https://www.transparenttextures.com/patterns/cubes.png",
      fontFamily: 'monospace'
    },
    parchment: {
      name: "Ancient Parchment",
      outerBg: "#fef3c7", outerGrad: "#fde68a", outerBorder: "#92400e",
      middleBg: "#fde68a", middleGrad: "#fcd34d", middleBorder: "#92400e",
      innerBg: "#fcd34d", innerGrad: "#fbbf24", innerBorder: "#92400e",
      hubBorder: "#92400e", hubBg: "#78350f",
      textOuter: "#78350f", textMiddle: "#78350f", textInner: "#78350f",
      divider: "#b45309", pin: "#78350f",
      textureUrl: "https://www.transparenttextures.com/patterns/paper.png",
      fontFamily: 'serif'
    },
    custom: {
      name: "Custom Build"
    }
  };

  const activeTheme = themeId === 'custom' ? customTheme : WHEEL_THEMES[themeId];

  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("none");
  const [deckCards, setDeckCards] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const publicDecks = await base44.entities.Deck.filter({ is_public: true, publish_status: 'published' }, '-created_date', 100);
        const user = await base44.auth.me().catch(() => null);
        let myDecks = [];
        if (user?.email) {
          const mine = await base44.entities.Deck.filter({ created_by: user.email }, '-updated_date', 100);
          myDecks = Array.isArray(mine) ? mine.filter(d => d.publish_status !== 'draft' && d.publish_status !== 'pending_review') : [];
        }
        
        const allDecksMap = new Map();
        [...(publicDecks || []), ...myDecks].forEach(d => allDecksMap.set(d.id, d));
        setDecks(Array.from(allDecksMap.values()));
      } catch (e) {
        console.error("Failed to load decks", e);
      }
    };
    fetchDecks();
  }, []);

  useEffect(() => {
    if (!selectedDeckId || selectedDeckId === "none") {
      setDeckCards([]);
      return;
    }
    const fetchCards = async () => {
      try {
        const cards = await base44.entities.Card.filter({ deck_id: selectedDeckId });
        setDeckCards(cards || []);
      } catch (e) {
        console.error("Failed to load cards", e);
      }
    };
    fetchCards();
  }, [selectedDeckId]);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsRevealed(false);
    setAiInterpretation("");
    
    if (selectedDeckId !== "none" && deckCards.length > 0) {
      const randomCard = deckCards[Math.floor(Math.random() * deckCards.length)];
      setDrawnCard(randomCard);
    } else {
      setDrawnCard(null);
    }
    
    const newOuter = rotations.outer + 360 * 3 + Math.floor(Math.random() * 36) * 10;
    const newMiddle = rotations.middle - 360 * 3 - Math.floor(Math.random() * 24) * 15;
    const newInner = rotations.inner + 360 * 4 + Math.floor(Math.random() * 12) * 30;

    setRotations({ outer: newOuter, middle: newMiddle, inner: newInner });

    // Haptic feedback simulation (slowing down ticking feel)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        const pattern = [];
        let delay = 30;
        for (let i = 0; i < 28; i++) {
          pattern.push(15); // short vibration (tick)
          pattern.push(delay); // pause
          delay += 10; // increase pause to simulate slowing down
        }
        navigator.vibrate(pattern);
      } catch (e) {}
    }

    setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]); // Final reveal vibration
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

      let cardText = "";
      if (drawnCard) {
        cardText = `- Accompanying Card: ${drawnCard.name} (${drawnCard.overall_meaning || drawnCard.upright_meaning || "A mysterious force."})`;
      }

      const prompt = `You are the official Spirit Wheel Oracle Reader for Astro Insights divination studio.

      You interpret the digital Spirit Wheel with warmth, clarity, and spiritual insight. Style: empowering, grounded, mystical but practical. Keep every reading 3–5 sentences max.

      The user has spun the wheel and received the following elements:
      - Active Category: ${category}
      - Outer Ring (Core Theme): [${outerItem.id}] ${getSegmentText('outer', selectedIndices.outer)}
      - Middle Ring (Timing/Modifier): [${middleItem.id}] ${middleItem.meaning}
      - Inner Ring (Action/Guidance): [${innerItem.id}] ${innerItem.meaning}
      ${cardText}

      Instructions:
      1. Recall the exact handbook meaning for these tiles in the chosen category.
      2. Weave them together into a natural, personal reading tied to the category.
      3. End with one clear action step or reflective question.
      4. Do NOT just echo or repeat the inputs back. Write a cohesive, mystical narrative.
      5. If the category is 'Zapped' or 'X-Rated', be direct and intense without softening the language.
      
      Official Category Guide Context:
      - General: Broad everyday guidance. Any tile gives practical advice.
      - Age: Life stage or maturity level. 
      - Body Parts: Physical body focus. 
      - Colors: Energy vibe of the color on the tile.
      - Lost Items: Finding something missing. Tile gives location, timing, or clue.
      - Height: Literal or figurative height.
      - Time: Specific timing or duration.`;

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
    <div className="min-h-screen bg-[#0f172a] text-amber-50 p-4 md:p-8 font-serif bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-blend-multiply overflow-x-hidden">
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="icon" className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/50">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Spirit Wheel</h1>
            <p className="text-sm md:text-base text-amber-200/80">Astro Insights Digital Reading Room</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Controls & Display */}
        <div className="flex-1 space-y-6 z-10 order-2 lg:order-1">
          <div className="bg-slate-900/90 p-4 md:p-6 rounded-xl border border-[#8b5a2b] shadow-[0_4px_20px_rgba(0,0,0,0.5)] space-y-5">
            <div>
              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Wheel Design Theme</Label>
              <Select value={themeId} onValueChange={setThemeId}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                  <SelectItem value="wood">Classic Wood</SelectItem>
                  <SelectItem value="galaxy">Cosmic Galaxy</SelectItem>
                  <SelectItem value="neon">Cyber Neon</SelectItem>
                  <SelectItem value="parchment">Ancient Parchment</SelectItem>
                  <SelectItem value="custom">Custom Build...</SelectItem>
                </SelectContent>
              </Select>
              
              {themeId === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mb-4 bg-black/30 p-3 rounded-lg border border-[#5c3a21]">
                  <div>
                    <Label className="text-amber-200/80 text-xs">Outer Ring</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.outerBg} onChange={e => setCustomTheme({...customTheme, outerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.outerGrad} onChange={e => setCustomTheme({...customTheme, outerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-amber-200/80 text-xs">Middle Ring</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.middleBg} onChange={e => setCustomTheme({...customTheme, middleBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.middleGrad} onChange={e => setCustomTheme({...customTheme, middleGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-amber-200/80 text-xs">Inner Ring</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.innerBg} onChange={e => setCustomTheme({...customTheme, innerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.innerGrad} onChange={e => setCustomTheme({...customTheme, innerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-amber-200/80 text-xs">Text & Dots</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.textOuter} onChange={e => setCustomTheme({...customTheme, textOuter: e.target.value, textMiddle: e.target.value, textInner: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.pin} onChange={e => setCustomTheme({...customTheme, pin: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-amber-200/80 text-xs">Borders</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.outerBorder} onChange={e => setCustomTheme({...customTheme, outerBorder: e.target.value, middleBorder: e.target.value, innerBorder: e.target.value, hubBorder: e.target.value, divider: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Category-Shift Logic</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Accompanying Deck (Optional)</Label>
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 max-h-64 overflow-y-auto">
                  <SelectItem value="none">None</SelectItem>
                  {decks.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
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

            <div className="space-y-2">
              <Button 
                onClick={spinWheel} 
                disabled={isSpinning}
                className="w-full bg-[#8b5a2b] hover:bg-[#a66d35] text-amber-50 py-8 text-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.4)] border border-[#a66d35] active:scale-95 transition-transform"
              >
                {isSpinning ? <RefreshCw className="animate-spin w-6 h-6 mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                {isSpinning ? "Channeling the Spirits..." : "Spin the Wheel"}
              </Button>
              <div className="text-center text-amber-200/50 text-sm italic pt-2">
                👆 Or tap / swipe the wheel directly to spin
              </div>
            </div>
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
                
                {drawnCard && (
                  <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21] flex flex-col md:flex-row gap-4 items-center md:items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-24 h-36 flex-shrink-0 rounded-md overflow-hidden border border-[#8b5a2b] bg-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      {drawnCard.image_url ? (
                        <img src={drawnCard.image_url} alt={drawnCard.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-500/30 text-xs text-center p-2">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-center md:justify-start">
                        <span>Accompanying Card</span>
                      </div>
                      <div className="text-xl font-bold text-amber-400 mb-1">{drawnCard.name}</div>
                      <div className="text-sm text-amber-100/80">{drawnCard.subtitle || drawnCard.overall_meaning || drawnCard.upright_meaning}</div>
                    </div>
                  </div>
                )}
                
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
        <div className="flex-1 flex items-start lg:items-center justify-center p-2 lg:p-8 relative min-h-[350px] lg:min-h-[600px] order-1 lg:order-2 overflow-visible">
          <motion.div 
            className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] shrink-0 mt-6 lg:mt-0 cursor-pointer"
            onClick={() => !isSpinning && spinWheel()}
            onPanEnd={(e, info) => {
              const velocity = Math.max(Math.abs(info.velocity.x), Math.abs(info.velocity.y));
              if (velocity > 200 && !isSpinning) {
                spinWheel();
              }
            }}
            whileTap={{ scale: 0.98 }}
            style={{ touchAction: "pan-y" }}
          >
            {/* Pointer / Indicator at top */}
            <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 z-50 drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)]">
              <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 48L0 0H40L20 48Z" fill="url(#pointer-gradient)" />
                <defs>
                  <linearGradient id="pointer-gradient" x1="20" y1="0" x2="20" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f59e0b" />
                    <stop offset="1" stopColor="#b45309" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Outer Ring (36) */}
            <motion.div 
              className="absolute inset-0 rounded-full border-[6px] overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)]"
              style={{
                borderColor: activeTheme.outerBorder,
                background: `url("${activeTheme.textureUrl}"), radial-gradient(circle, ${activeTheme.outerBg} 0%, ${activeTheme.outerGrad} 100%)`,
                backgroundBlendMode: 'multiply',
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
                  <div 
                    className="absolute top-1.5 sm:top-2 md:top-3 -translate-x-1/2 text-xs md:text-sm lg:text-base font-bold" 
                    style={{ 
                      color: activeTheme.textOuter,
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      transition: 'opacity 0.3s',
                      textShadow: themeId === 'wood' || themeId === 'parchment' ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : '0 0 5px currentColor',
                      fontFamily: activeTheme.fontFamily
                    }}
                  >
                    {item.id}
                  </div>
                  {/* Segment dividers (Burnt Wood Lines) */}
                  <div className="absolute top-0 -translate-x-1/2 w-[3px] h-full" style={{ transform: 'rotate(5deg)', backgroundColor: activeTheme.divider, opacity: 0.8 }}></div>
                  {/* Silver Pins */}
                  <div className="absolute top-[2px] -translate-x-1/2 w-[3px] h-[3px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 rounded-full shadow-sm border border-black/30 z-10" style={{ transform: 'rotate(5deg)', backgroundColor: activeTheme.pin }}></div>
                </div>
              ))}
            </motion.div>

            {/* Middle Ring (24) */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[74%] h-[74%] rounded-full border-[5px] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]"
              style={{
                borderColor: activeTheme.middleBorder,
                background: `url("${activeTheme.textureUrl}"), radial-gradient(circle, ${activeTheme.middleBg} 0%, ${activeTheme.middleGrad} 100%)`,
                backgroundBlendMode: 'multiply',
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
                  <div 
                    className="absolute top-1.5 sm:top-2 md:top-3 -translate-x-1/2 flex items-center justify-center text-[9px] md:text-sm lg:text-base font-bold whitespace-nowrap" 
                    style={{ 
                      color: activeTheme.textMiddle,
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      transition: 'opacity 0.3s',
                      textShadow: themeId === 'wood' || themeId === 'parchment' ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : '0 0 5px currentColor',
                      fontFamily: activeTheme.fontFamily
                    }}
                  >
                    {['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Black', 'White', 'Brown', 'LightBlue'].includes(item.id) ? (
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full shadow-inner border border-black/30" style={{ backgroundColor: item.id === 'LightBlue' ? '#add8e6' : item.id.toLowerCase() }}></div>
                    ) : (
                      item.id
                    )}
                  </div>
                  {/* Segment dividers */}
                  <div className="absolute top-0 -translate-x-1/2 w-[3px] h-full" style={{ transform: 'rotate(7.5deg)', backgroundColor: activeTheme.divider, opacity: 0.8 }}></div>
                  {/* Silver Pins */}
                  <div className="absolute top-[2px] -translate-x-1/2 w-[3px] h-[3px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 rounded-full shadow-sm border border-black/30 z-10" style={{ transform: 'rotate(7.5deg)', backgroundColor: activeTheme.pin }}></div>
                </div>
              ))}
            </motion.div>

            {/* Inner Ring (12) */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48%] h-[48%] rounded-full border-[4px] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
              style={{
                borderColor: activeTheme.innerBorder,
                background: `url("${activeTheme.textureUrl}"), radial-gradient(circle, ${activeTheme.innerBg} 0%, ${activeTheme.innerGrad} 100%)`,
                backgroundBlendMode: 'multiply',
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
                  <div 
                    className="absolute top-1.5 sm:top-2 md:top-4 -translate-x-1/2 text-[10px] sm:text-xs md:text-lg lg:text-xl font-bold" 
                    style={{ 
                      color: activeTheme.textInner,
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      transition: 'opacity 0.3s',
                      textShadow: themeId === 'wood' || themeId === 'parchment' ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : '0 0 5px currentColor',
                      fontFamily: activeTheme.fontFamily
                    }}
                  >
                    {item.id}
                  </div>
                  {/* Segment dividers */}
                  <div className="absolute top-0 -translate-x-1/2 w-[3px] h-full" style={{ transform: 'rotate(15deg)', backgroundColor: activeTheme.divider, opacity: 0.8 }}></div>
                  {/* Silver Pins */}
                  <div className="absolute top-[2px] -translate-x-1/2 w-[3px] h-[3px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 rounded-full shadow-sm border border-black/30 z-10" style={{ transform: 'rotate(15deg)', backgroundColor: activeTheme.pin }}></div>
                </div>
              ))}
            </motion.div>
            
            {/* Center Hub */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] h-[22%] rounded-full border-[5px] shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 overflow-hidden flex items-center justify-center"
              style={{
                borderColor: activeTheme.hubBorder,
                backgroundColor: activeTheme.hubBg
              }}
            >
              {themeId === 'wood' || themeId === 'galaxy' ? (
                <img 
                  src={themeId === 'wood' ? "https://media.base44.com/images/public/68d2a300021f94d0f312c039/c249f1513_IMG_8330.png" : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg"} 
                  alt="Center Spirit" 
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${themeId === 'wood' ? 'min-w-[350%] min-h-[350%] filter contrast-125 saturate-110' : 'min-w-[120%] min-h-[120%]'} object-cover pointer-events-none`} 
                />
              ) : (
                <div className="w-1/3 h-1/3 rounded-full" style={{ backgroundColor: activeTheme.outerBorder, boxShadow: `0 0 20px ${activeTheme.outerBorder}` }}></div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}