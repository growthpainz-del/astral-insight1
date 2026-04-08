import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Sparkles, RefreshCw, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AudioOrb from "@/components/reading/AudioOrb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

// 50 Cards of the Rooted Crescent Oracle Deck
const ROOTED_CARDS_DATA = [
  { id: "1", name: "The Rooted Journey", symbol: "Minimalist tree root curling into a tight spiral circle.", meaning: "Grounded wisdom balances intuition and strength for growth." },
  { id: "2", name: "The Endless Storm", symbol: "Stylized swirling storm lines inside a sturdy circle.", meaning: "Resilience shines through challenges, finding wisdom in scars." },
  { id: "3", name: "Guardian of the Desert", symbol: "Simple saguaro cactus with three balanced arms.", meaning: "Thrive in adversity, balancing protection and nurturing." },
  { id: "4", name: "Petals of Resilience", symbol: "Single open flower with five strong petals and solid center.", meaning: "Blend strength and softness to grow through challenges." },
  { id: "5", name: "Emergence from Chaos", symbol: "Cracked circle with a butterfly breaking free.", meaning: "Clarity transforms struggles into opportunities." },
  { id: "6", name: "The Jaws of Time", symbol: "Open jaws formed by clock hands around a small circle.", meaning: "Cherish the present to align with your purpose." },
  { id: "7", name: "The Seer's Gaze", symbol: "Open eye with three concentric circles in the pupil.", meaning: "Intuition reveals hidden truths for spiritual growth." },
  { id: "8", name: "The Guardian of Reflection", symbol: "Still pond circle with three gentle ripple lines.", meaning: "Deep reflection uncovers transformative wisdom." },
  { id: "9", name: "The Silent Observer", symbol: "Closed eye with soft arched brow above.", meaning: "Silence fosters empathy and profound insight." },
  { id: "10", name: "Between the Folds", symbol: "Simple folded layers unfolding into a smooth curve.", meaning: "Patience reveals hidden truths and clarity." },
  { id: "11", name: "The Veil of Solitude", symbol: "Teardrop-shaped veil or curtain with soft folds.", meaning: "Solitude heals and transforms pain into wisdom." },
  { id: "12", name: "Shielding Embrace", symbol: "Two curved arms forming a protective circle.", meaning: "Quiet support offers comfort without control." },
  { id: "13", name: "The Wild Embrace", symbol: "Stylized flame inside a leaf-shaped heart.", meaning: "Unleash passion and instincts for authentic connection." },
  { id: "14", name: "Ghostly Patrons", symbol: "Two faint overlapping ethereal figures in a circle.", meaning: "Past connections offer strength and wisdom." },
  { id: "15", name: "In-Tan-Demoiselles", symbol: "Two figures back-to-back holding hands in a circle.", meaning: "Shared joy uplifts through collaboration." },
  { id: "16", name: "The Alchemist's Cauldron", symbol: "Small cauldron with three flames underneath.", meaning: "Transform talents into new possibilities." },
  { id: "17", name: "The Muse's Morning Star", symbol: "Bright star rising above a simple horizon line.", meaning: "Inspiration guides dreams to reality." },
  { id: "18", name: "Starweaver's Embrace", symbol: "Two interlocking crescents forming a star.", meaning: "Weave cosmic inspiration for bold creation." },
  { id: "19", name: "Visionary Journey", symbol: "Winding path leading toward an open horizon.", meaning: "Expand consciousness through exploration." },
  { id: "20", name: "Illuminating Insight", symbol: "Bright star with radiating light beams.", meaning: "Brilliance lights new creative paths." },
  { id: "21", name: "Luna Duala", symbol: "Two overlapping crescents (one light, one dark).", meaning: "Harmonize opposites for wholeness." },
  { id: "22", name: "The Comfort Paradox", symbol: "Soft cushion shape merging into sharp upward arrow.", meaning: "Balance comfort with growth for progress." },
  { id: "23", name: "The 4 Shadows", symbol: "Four small triangles arranged in a diamond.", meaning: "Embrace shadows for freedom and unity." },
  { id: "24", name: "The Eye of Siren", symbol: "Stylized eye merged with a simple star or wave.", meaning: "Discern truth from illusion in relationships." },
  { id: "25", name: "The Cosmic Vision", symbol: "Swirling cosmic circle with tiny stars inside.", meaning: "Universal truths bring inner peace." },
  { id: "26", name: "The Weaver of Truth", symbol: "Simple loom or interwoven threads forming a web.", meaning: "Gently embrace truth for acceptance." },
  { id: "27", name: "The Deflected", symbol: "Shield shape with arrows bouncing off.", meaning: "Reflect on defenses to embrace vulnerability." },
  { id: "28", name: "The Day Moon's Grip", symbol: "Crescent moon gently holding a small sun disk.", meaning: "Forgiveness releases burdens for harmony." },
  { id: "29", name: "Echoes of the Mind", symbol: "Concentric sound waves or ripples from a center point.", meaning: "Inner guidance offers protection and clarity." },
  { id: "30", name: "The Heart Full Foundress", symbol: "Sturdy heart shape with roots at the base.", meaning: "Nurture with love and strength for growth." },
  { id: "31", name: "Guardian of In-Essence", symbol: "Small glowing inner flame or child-like spark.", meaning: "Protect your inner joy and essence." },
  { id: "32", name: "The Sureline of Purpose", symbol: "Straight arrow piercing a solid circle.", meaning: "Stand firm in purpose through introspection." },
  { id: "33", name: "Nis Puk's Whisper", symbol: "Playful small creature silhouette with speech swirl.", meaning: "Playful wisdom guides subtly." },
  { id: "34", name: "The Patient Feminine", symbol: "Gentle curved feminine figure in seated pose.", meaning: "Patience and grounded strength lead to growth." },
  { id: "35", name: "The Garden Portal", symbol: "Simple arch or gate with upward flowing lines.", meaning: "Courage opens gateways to new dimensions." },
  { id: "36", name: "With Chains Unbound", symbol: "Broken chain links forming an open circle.", meaning: "Break free from patterns for new paths." },
  { id: "37", name: "Nature's Whisper", symbol: "Leaf or tree branch with subtle wind lines.", meaning: "Nature’s cycles guide wisdom and vitality." },
  { id: "38", name: "Back Road Whispers", symbol: "Winding road path disappearing into distance.", meaning: "Winding paths lead to wisdom through exploration." },
  { id: "39", name: "Veins of the Void", symbol: "Cracked dark circle with light veins flowing in.", meaning: "Emerge from shadows to claim your true self." },
  { id: "40", name: "The Triad of Synergy", symbol: "Three interlocking circles or triangles.", meaning: "Harmonize mind, body, spirit for strength." },
  { id: "41", name: "The Fun Gus In Us", symbol: "Mushroom with connected mycelium threads at base.", meaning: "Community and reciprocity foster joy." },
  { id: "42", name: "The Voyage of Shadows", symbol: "Small boat on stylized wavy lines.", meaning: "Navigate inner darkness for growth." },
  { id: "43", name: "Fringe Fusions", symbol: "Two different shapes (circle + triangle) merging.", meaning: "Blend unconventional ideas for growth." },
  { id: "44", name: "Cascading Illumination", symbol: "Waterfall of light dots or lines flowing down.", meaning: "Insights flow to light new paths." },
  { id: "45", name: "In-Tan-Demoiselles II", symbol: "Two figures back-to-back holding hands in circle.", meaning: "Shared joy uplifts through collaboration." },
  { id: "46", name: "Blabbergaster", symbol: "Explosive speech bubble with chaotic energy lines.", meaning: "Embrace chaos for bold expression." },
  { id: "47", name: "The Mountain's Keeper", symbol: "Triangular mountain peak with strong flat base.", meaning: "Ascend with clear vision and strength." },
  { id: "48", name: "Harmonic Gates of Ascension", symbol: "Simple arch or gate with upward flowing lines.", meaning: "Align with cosmic flow for transformation." },
  { id: "49", name: "The Humble Huntress", symbol: "Small bow and arrow pointing upward.", meaning: "Pursue goals with quiet determination." },
  { id: "50", name: "The Jealous-Eye", symbol: "Eye with a small heart or trust symbol inside.", meaning: "Acknowledge jealousy to build trust." }
];

const WHEEL_DATA = {
  outer: ROOTED_CARDS_DATA.map(c => ({
    id: c.id,
    name: c.name,
    general: `${c.name} (${c.symbol}): ${c.meaning}`
  })),
  middle: [
    { id: "🍷", meaning: "Drink" },
    { id: "✈️", meaning: "Travel" },
    { id: "♂️", meaning: "Male" },
    { id: "♀️", meaning: "Female" },
    { id: "☹️", meaning: "Unhappy" },
    { id: "😊", meaning: "Happy" },
    { id: "😠", meaning: "Mad" },
    { id: "👂", meaning: "Listen" },
    { id: "⏪", meaning: "Look to the past" },
    { id: "⏩", meaning: "Look to the future" },
    { id: "⚖️", meaning: "Law" },
    { id: "⏳", meaning: "Time" },
    { id: "🔬", meaning: "Microscope (zoom in / examine)" },
    { id: "🔭", meaning: "Telescope (big picture / far vision)" },
    { id: "💨", meaning: "Smoke" },
    { id: "🤝", meaning: "Together" },
    { id: "Black", meaning: "Hidden / unconscious mind" },
    { id: "White", meaning: "Purity / truth" },
    { id: "Blue", meaning: "Water / communication / inspiration / peace" },
    { id: "Yellow", meaning: "Air / mental activity" },
    { id: "Green", meaning: "Nature / fertility / growth" },
    { id: "Brown", meaning: "Earth / soil" },
    { id: "Red", meaning: "Fire / passion / sex" },
    { id: "Grey", meaning: "Stability / neutral" },
    { id: "Orange", meaning: "Attraction / friendship" },
    { id: "Purple", meaning: "Intuition / psychic / spirit contact" }
  ],
  inner: [
    { id: "🚪", meaning: "Option closed / path shut for now" },
    { id: "🔓", meaning: "Option open / path is clear" },
    { id: "❤️", meaning: "Love / heart connection" },
    { id: "💰", meaning: "Money / financial flow" },
    { id: "♫", meaning: "Music / creative harmony" },
    { id: "⚠️", meaning: "Bad / warning / evil" },
    { id: "✅", meaning: "Yes" },
    { id: "❌", meaning: "No" },
    { id: "⏹", meaning: "Stop" },
    { id: "▶", meaning: "Go" },
    { id: "❓", meaning: "What? / Clarify" },
    { id: "👋", meaning: "Hi!!! I’m here / positive presence" },
    { id: "✌️", meaning: "Bye... until next time" },
    { id: "📖", meaning: "Knowledge" },
    { id: "💍", meaning: "Marriage" },
    { id: "🔥", meaning: "Nothing" },
    { id: "⬆️", meaning: "North / that way" },
    { id: "➡️", meaning: "East / that way" },
    { id: "⬇️", meaning: "South / that way" },
    { id: "⬅️", meaning: "West / that way" }
  ]
};

const CATEGORIES = ["General", "Relationships", "Numbers", "Age", "Body Parts", "Colors", "Lost Items", "Height", "Time", "Astrology", "Emotions", "Profiler", "Seasons and Shapes", "Traveling", "Zapped", "X-Rated"];

export default function Pendulum() {
  const [category, setCategory] = useState("General");
  const [question, setQuestion] = useState("");
  const [isSwinging, setIsSwinging] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveReading = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Reading.create({
        title: `Pendulum: ${category}${question ? ` - ${question}` : ''}`,
        spread_type: "custom",
        deck_id: "pendulum",
        cards_drawn: [],
        interpretation: aiInterpretation,
        date: new Date().toISOString().split('T')[0],
        category: "Pendulum"
      });
      alert("Reading saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save reading.");
    } finally {
      setIsSaving(false);
    }
  };

  const getSegmentText = (ring, index) => {
    if (ring === 'outer') {
      const item = WHEEL_DATA.outer[index];
      return item.name || item.id;
    }
    if (ring === 'middle') return WHEEL_DATA.middle[index].meaning;
    if (ring === 'inner') return WHEEL_DATA.inner[index].meaning;
    return "";
  };

  const getInterpretation = async (selectedIndices) => {
    setIsAiLoading(true);
    try {
      const outerItem = WHEEL_DATA.outer[selectedIndices.outer];
      const middleItem = WHEEL_DATA.middle[selectedIndices.middle];
      const innerItem = WHEEL_DATA.inner[selectedIndices.inner];

      const prompt = `You are the official Spirit Wheel Oracle Reader for Astro Insights divination studio.

      You interpret the digital Pendulum with warmth, clarity, and spiritual insight. Style: empowering, grounded, mystical but practical. Keep every reading 3-5 sentences max.

      The user has swung the pendulum and received the following elements:
      - Active Category: ${category}
      - Question: ${question || "General guidance"}
      - Outer Ring (Core Theme): [${outerItem.id}] ${outerItem.general}
      - Middle Ring (Timing/Modifier): [${middleItem.id}] ${middleItem.meaning}
      - Inner Ring (Action/Guidance): [${innerItem.id}] ${innerItem.meaning}

      Instructions:
      1. Recall the exact handbook meaning for these tiles in the chosen category.
      2. Weave them together into a natural, personal reading tied to the category and the question.
      3. End with one clear action step or reflective question.
      4. Do NOT just echo or repeat the inputs back. Write a cohesive, mystical narrative.
      5. If the category is 'Zapped' or 'X-Rated', be direct and intense without softening the language.
      
      Official Category Guide Context:
      - General: Broad everyday guidance. Any tile gives practical advice.
      - Relationships: People, dynamics, or connections in your life (romance, family, daily circle).
      - Age: Life stage or maturity level (A = New spirit, Z = Spirit form, everything between maps to age brackets). 
      - Body Parts: Points to a specific physical area (head/mind, heart/chest, arms/hands, legs/feet, stomach/digestion, etc.) or health clue. 
      - Numbers: Interpret as years, quantities, counts, or specific timing clues based on the exact number.
      - Colors: Energy vibe of the color on the tile.
      - Lost Items: Finding something missing. Tile gives location, timing, or clue.
      - Height: Literal or figurative height.
      - Time: Specific timing or duration.
      - Astrology: Planetary timing and zodiac energy. The 9 planets influence Earth. Planets move at different speeds along the 12-sign Zodiac path (Aries to Pisces). Aspects strengthen or challenge energy.
      - Emotions: Emotional state or heart energy around the question. Current feeling, positive/negative emotions, emotional block or release.
      - Profiler: Personality profile of a person. Traits, strengths, weaknesses, energetic type, hidden side, or the role they play.
      - Seasons and Shapes: Seasonal energy (Spring=growth, Summer=expansion, Fall=release, Winter=rest) or symbolic shapes (Circle=wholeness, Square=stability, Triangle=change, Spiral=evolution) for timing and form.
      - Traveling: Journeys, movement, or travel energy. Physical trip, movement/progress in life, direction/destination, or safe/challenging travel.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setAiInterpretation(response.text || response);
    } catch (e) {
      console.error(e);
      setAiInterpretation("Failed to get interpretation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const swingPendulum = () => {
    if (isSwinging) return;
    setIsSwinging(true);
    setAnswer(null);
    setAiInterpretation("");

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([20, 50, 20]); } catch (e) {}
    }

    setTimeout(() => {
      const outerIndex = Math.floor(Math.random() * WHEEL_DATA.outer.length);
      const middleIndex = Math.floor(Math.random() * WHEEL_DATA.middle.length);
      const innerIndex = Math.floor(Math.random() * WHEEL_DATA.inner.length);
      
      const newAnswer = {
        outer: outerIndex,
        middle: middleIndex,
        inner: innerIndex
      };

      setAnswer(newAnswer);
      setIsSwinging(false);
      
      getInterpretation(newAnswer);
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(50); } catch (e) {}
      }
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-black text-white p-4 md:p-8 overflow-x-hidden">
      <Link to={createPageUrl("Dashboard")}>
        <Button variant="ghost" className="mb-4 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-900/30">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </Link>
      
      <div className="max-w-6xl mx-auto flex flex-col items-center pt-2">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2 text-center">Mystic Pendulum</h1>
        <p className="text-indigo-200/60 text-sm mb-6 text-center">Ask a question and channel the spirit wheel's energy</p>
        
        <div className="w-full grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side: Controls & Results */}
          <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="space-y-4">
              <div>
                <Label className="text-amber-200 mb-2 block font-semibold text-lg">Category Focus</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#2d1b0d]/80 border-[#5c3a21] text-amber-100 h-12 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-amber-200 mb-2 block font-semibold text-lg">Your Question (Optional)</Label>
                <Textarea 
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What guidance do you seek?"
                  className="bg-[#2d1b0d]/80 border-[#5c3a21] text-amber-100 min-h-[80px]"
                />
              </div>

              <Button 
                onClick={swingPendulum} 
                disabled={isSwinging}
                className="w-full bg-gradient-to-r from-amber-700 to-amber-500 hover:from-amber-600 hover:to-amber-400 text-white font-bold text-lg py-6 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95"
              >
                {isSwinging ? <RefreshCw className="animate-spin w-6 h-6 mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                {isSwinging ? "Consulting the Spirits..." : "Release Pendulum"}
              </Button>
            </div>

            {/* Results Area */}
            {answer && !isSwinging && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 border-t border-indigo-500/30 pt-6">
                <div className="p-4 bg-[#1c0f05]/80 rounded-lg border border-[#5c3a21]">
                  <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between">
                    <span>Outer Ring</span>
                    <span className="text-amber-300">[{WHEEL_DATA.outer[answer.outer].id}]</span>
                  </div>
                  <div className="text-lg text-amber-50">{getSegmentText('outer', answer.outer)}</div>
                </div>
                
                <div className="p-4 bg-[#1c0f05]/80 rounded-lg border border-[#5c3a21]">
                  <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between">
                    <span>Middle Ring</span>
                    <span className="text-amber-300">[{WHEEL_DATA.middle[answer.middle].id}]</span>
                  </div>
                  <div className="text-lg text-amber-50">{getSegmentText('middle', answer.middle)}</div>
                </div>
                
                <div className="p-4 bg-[#1c0f05]/80 rounded-lg border border-[#5c3a21]">
                  <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between">
                    <span>Inner Ring</span>
                    <span className="text-amber-300">[{WHEEL_DATA.inner[answer.inner].id}]</span>
                  </div>
                  <div className="text-lg text-amber-50">{getSegmentText('inner', answer.inner)}</div>
                </div>

                {isAiLoading ? (
                  <div className="flex items-center justify-center p-6 text-amber-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Channeling interpretation...
                  </div>
                ) : aiInterpretation && (
                  <div className="p-5 bg-indigo-950/40 rounded-lg border border-indigo-500/50 whitespace-pre-wrap text-base text-amber-100 leading-relaxed shadow-inner relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-amber-500 text-sm font-bold uppercase">Oracle Interpretation</div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleSaveReading}
                        disabled={isSaving}
                        className="bg-indigo-900/50 hover:bg-indigo-800 border-indigo-500/50 text-amber-400 h-8"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Reading"}
                      </Button>
                    </div>
                    {aiInterpretation}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Pendulum Animation */}
          <div className="flex justify-center items-start lg:sticky lg:top-8 h-[450px] overflow-visible">
            {/* Pendulum Container */}
            <div className="relative h-[400px] w-full flex justify-center mt-8" style={{ perspective: '800px' }}>
              {/* Anchor point */}
              <div className="absolute top-0 w-4 h-4 bg-slate-400 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10" />
              
              <motion.div
                className="origin-top flex flex-col items-center z-0"
                style={{ transformStyle: 'preserve-3d', transformOrigin: 'top center' }}
                animate={
                  isSwinging 
                    ? { 
                        rotateZ: [0, 45, -35, 25, -15, 8, -3, 0], 
                        rotateX: [0, 25, -20, 15, -10, 5, -2, 0] 
                      } 
                    : answer 
                      ? { rotateZ: [0, 15, 0, -15, 0], rotateX: [15, 0, -15, 0, 15] } // Circular when landed
                    : { rotateZ: [0, 2, -2, 0], rotateX: [0, 2, -2, 0] } // idle
                }
                transition={
                  isSwinging 
                    ? { duration: 4.5, ease: "easeInOut" }
                    : answer 
                      ? { duration: 4, ease: "linear", repeat: Infinity }
                    : { duration: 4, ease: "easeInOut", repeat: Infinity }
                }
              >
                {/* Chain */}
                <div className="w-[2px] h-[250px] bg-gradient-to-b from-slate-300 to-amber-600 shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                
                {/* Crystal / Bob */}
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute inset-0 bg-amber-500 blur-xl opacity-50 rounded-full scale-150" />
                  
                  {/* Crystal shape */}
                  <svg width="48" height="72" viewBox="0 0 40 60" className="relative drop-shadow-[0_10px_20px_rgba(245,158,11,0.6)]">
                    <path d="M20 0 L40 20 L20 60 L0 20 Z" fill="url(#crystalGrad)" stroke="#fbbf24" strokeWidth="1"/>
                    <path d="M20 0 L20 60 M0 20 L40 20" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5"/>
                    <defs>
                      <linearGradient id="crystalGrad" x1="0" y1="0" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="40%" stopColor="#d97706" />
                        <stop offset="100%" stopColor="#78350f" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </motion.div>

              {/* Board underneath - Flat Spirit Wheel */}
              <div 
                className="absolute bottom-[-140px] w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] rounded-full border-4 border-amber-900/50 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex justify-center items-center pointer-events-none"
                style={{ transform: 'rotateX(70deg) translateZ(-80px)', transformStyle: 'preserve-3d' }}
              >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-[8px] border-amber-800 bg-black" />
                {/* Middle ring */}
                <div className="absolute inset-[15%] rounded-full border-2 border-amber-700 bg-indigo-950" />
                {/* Inner ring */}
                <div className="absolute inset-[35%] rounded-full border border-amber-600 bg-purple-950" />
                {/* Center hub */}
                <div className="absolute inset-[45%] rounded-full border-2 border-amber-500 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] overflow-hidden">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg" 
                    alt="Center Logo" 
                    className="w-full h-full object-cover opacity-90" 
                  />
                </div>
                
                {/* Letters/Numbers on outer ring */}
                {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11m", "12"].map((char, i, arr) => (
                  <div 
                    key={i}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                    style={{ transform: `rotate(${(i * 360) / arr.length}deg)` }}
                  >
                    <div className="absolute top-1 -translate-x-1/2 text-amber-500/70 text-[12px] font-bold" style={{ transform: 'rotateX(-70deg)' }}>
                      {char}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AudioOrb 
        textToSpeak={aiInterpretation} 
        autoPlay={!!aiInterpretation} 
        variant="player"
      />
      <div className="max-w-4xl mx-auto mt-12 text-center text-xs text-indigo-200/40 pb-8 z-10 relative">
        Disclaimer: The guidance provided is for entertainment purposes only and does not constitute professional advice. Client logins are secured and data can be deleted at any time.
      </div>
    </div>
  );
}