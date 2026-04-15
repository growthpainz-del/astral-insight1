import React, { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, RefreshCw, Eye, ChevronLeft, Save, Plus, ZoomIn, ZoomOut, Download, Octagon, StopCircle, Share2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AudioOrb from "@/components/reading/AudioOrb";
import CelestialMapWidget from "@/components/reading/CelestialMapWidget";
import html2canvas from 'html2canvas';
import ReadingShareModal from "@/components/reading/ReadingShareModal";
import { queueApiCall } from "@/components/utils/apiQueue";
import { getThumbnailUrl } from "@/lib/utils";

// 50 Cards of the Rooted Crescent Oracle Deck
export const ROOTED_CARDS_DATA = [
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
  { id: "50", name: "The Jealous-Eye", symbol: "Eye with a small heart or trust symbol inside.", meaning: "Acknowledge jealousy to build trust." },
  { id: "51", name: "The Odd Pair", symbol: "Circle and triangle.", meaning: "Unlikely combinations yield surprising strength." },
  { id: "52", name: "The Crescent Moon", symbol: "Plain crescent.", meaning: "Embrace cycles of waxing and waning energy." },
  { id: "53", name: "The Rooted Tree", symbol: "Tree with roots.", meaning: "Grounded wisdom balances intuition and strength for growth." },
  { id: "54", name: "The Final Knot", symbol: "Celtic knot.", meaning: "Endings bring closure and tie loose threads." }
];

export const WHEEL_MIDDLE = [
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
];

export const WHEEL_INNER = [
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
];

const SEVEN_SISTERS_MODIFIERS = [
  { id: "🌱", label: "Maia's Root", meaning: "Quiet care grounds wild growth. Nurture the seed; steady support arrives. Keywords: nurture, foundation, patience, care." },
  { id: "⚡", label: "Electra's Spark", meaning: "Sudden brilliance demands action. Flash of insight — move fast and true. Keywords: brilliance, leadership, speed, clarity." },
  { id: "🕊️", label: "Alcyone's Calm", meaning: "Tranquility after the storm. Rest in the eye of change; peace restores. Keywords: peace, reflection, restoration, balance." },
  { id: "🏃‍♀️", label: "Taygete's Chase", meaning: "Pursuit with grace and speed. Chase the goal lightly; momentum is yours. Keywords: pursuit, freedom, momentum, grace." },
  { id: "🌫️", label: "Celaeno's Veil", meaning: "What is hidden holds power. Embrace the unknown; mystery teaches. Keywords: shadow, mystery, hidden truth, depth." },
  { id: "🔥", label: "Sterope's Flame", meaning: "Inspiration strikes like starfire. Creative lightning — capture it now. Keywords: inspiration, creativity, fire, suddenness." },
  { id: "🗣️", label: "Merope's Echo", meaning: "The missing voice still whispers wisdom. Listen for the subtle return; integration awaits. Keywords: return, integration, quiet wisdom, wholeness." }
];

const SPIRITUAL_EMOTICONS_MODIFIERS = [
  { id: "🌙", label: "Grounded Moon", meaning: "Instant grounding and presence." },
  { id: "👁️", label: "Inner Eye", meaning: "Trust intuition and inner sight." },
  { id: "💨", label: "Shadow Release", meaning: "Let go of what no longer serves." },
  { id: "💖", label: "Heart Root", meaning: "Love anchored in self." },
  { id: "🌊", label: "Flow Crescent", meaning: "Move with natural cycles." },
  { id: "🌱", label: "Spark Seed", meaning: "Creative or spiritual ignition." },
  { id: "✨", label: "Veil Lift", meaning: "Gentle revelation and clarity." },
  { id: "🦋", label: "Balance Wings", meaning: "Harmony between light and shadow." },
  { id: "🦉", label: "Wisdom Echo", meaning: "Listen to inner or ancestral guidance." },
  { id: "🔥", label: "Ascension Flame", meaning: "Spiritual growth and elevation." }
];

const MOON_EMBLEMS_MODIFIERS = [
  { id: "🌸", label: "Moon & Bloom", meaning: "Deep reconnection with nature's cycles and living wisdom." },
  { id: "⚛️", label: "Moon Chakra", meaning: "Energy alignment and chakra activation." },
  { id: "👁️", label: "Moon & Third Eye", meaning: "Intuition, spiritual vision, and inner sight." },
  { id: "⚖️", label: "Moon & Balance", meaning: "Harmony between opposites and inner equilibrium." },
  { id: "🔥", label: "Moon & Flame", meaning: "Passionate intuition and creative spiritual fire." },
  { id: "🪶", label: "Moon & Feather", meaning: "Lightness, spiritual messages, and surrender." },
  { id: "🌀", label: "Moon & Spiral", meaning: "Inner journey, cycles, and unfolding wisdom." },
  { id: "🪷", label: "Moon & Lotus", meaning: "Spiritual awakening and rising above challenges." },
  { id: "🤲", label: "Moon & Hand", meaning: "Divine support, receiving, and surrender." },
  { id: "🦋", label: "Moon & Butterfly", meaning: "Transformation and soul evolution." },
  { id: "🗝️", label: "Moon & Key", meaning: "Unlocking hidden knowledge or soul purpose." },
  { id: "🦌", label: "Moon & Antlers", meaning: "Wild instinct, protection, and natural power." },
  { id: "💧", label: "Moon & Drop", meaning: "Emotional release, cleansing, or divine tears." }
];

const ANIMAL_SPIRITS_MODIFIERS = [
  { id: "🐻", label: "Bear", meaning: "strength, courage, healing" },
  { id: "🐺", label: "Wolf", meaning: "loyalty, community, wisdom" },
  { id: "🦅", label: "Eagle", meaning: "vision, spiritual messenger, freedom" },
  { id: "🦬", label: "Buffalo", meaning: "abundance, gratitude, sacred life" },
  { id: "🦉", label: "Owl", meaning: "wisdom, intuition, seeing the unseen" },
  { id: "🦌", label: "Deer", meaning: "gentleness, grace, renewal" }
];

const CATEGORIES = ["General", "Relationships", "Numbers", "Age", "Body Parts", "Colors", "Lost Items", "Height", "Time", "Astrology", "Emotions", "Profiler", "Seasons and Shapes", "Traveling", "Zapped", "X-Rated"];

const isImageSymbol = (id) => {
  if (!id || typeof id !== 'string') return false;
  const s = id.trim().toLowerCase();
  return s.startsWith('http') || s.startsWith('data:image') || /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/.test(s);
};

const getImageUrl = (id) => {
  if (!id) return '';
  let url = id.trim().replace(/^['"]+|['"]+$/g, '');
  if (!url.startsWith('http') && !url.startsWith('data:image')) {
    url = 'https://' + url;
  }
  return url;
};

export const WHEEL_THEMES = {
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
  stone_led: {
    name: "Stone + LED",
    outerBg: "#d2b48c", outerGrad: "#d2b48c", outerBorder: "#a67c5d",
    middleBg: "#d2b48c", middleGrad: "#d2b48c", middleBorder: "#a67c5d",
    innerBg: "#d2b48c", innerGrad: "#d2b48c", innerBorder: "#a67c5d",
    hubBorder: "#00ffcc", hubBg: "#1a1a2e",
    textOuter: "#111111", textMiddle: "#111111", textInner: "#111111",
    divider: "transparent", pin: "transparent",
    textureUrl: "",
    fontFamily: "Arial, sans-serif",
    isTiles: true,
    ledColor: "#00ffcc",
    pageBg: "#0f0f1f",
    hubIcon: "🐱"
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
  metatron: {
    name: "Sacred Geometry",
    outerBg: "#050505", outerGrad: "#1a1a1a", outerBorder: "#cba135",
    middleBg: "#000000", middleGrad: "#0f0f0f", middleBorder: "#cba135",
    innerBg: "#1a1a1a", innerGrad: "#050505", innerBorder: "#cba135",
    hubBorder: "#cba135", hubBg: "#000000",
    textOuter: "#cba135", textMiddle: "#cba135", textInner: "#cba135",
    divider: "transparent", pin: "#cba135",
    textureUrl: "https://www.transparenttextures.com/patterns/hexellence.png",
    fontFamily: 'serif',
    pageBg: "#000000",
    pageBgImage: "https://www.transparenttextures.com/patterns/hexellence.png",
    topLayerOpacity: 0.4,
    blendMode: 'screen',
    layerOrder: 'color_top'
  },
  custom: {
    name: "Custom Build"
  }
};

export default function SpiritWheel() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const initialWheelId = urlParams.get("id");

  const [category, setCategory] = useState("General");
  const [blankMode, setBlankMode] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [spinState, setSpinState] = useState("idle"); // idle, spinning, stopping
  const [spinSpeed, setSpinSpeed] = useState(1);
  const [spinDuration, setSpinDuration] = useState(5);
  const spinStartTime = useRef(0);
  const startRotations = useRef({ outer: 0, middle: 0, inner: 0 });
  const [rotations, setRotations] = useState({ outer: 0, middle: 0, inner: 0 });
  const [selectedIndices, setSelectedIndices] = useState({ outer: 0, middle: 0, inner: 0 });

  const isSpinning = spinState !== "idle";
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleDownloadImage = async () => {
    setIsCapturing(true);
    setTimeout(async () => {
      try {
        const element = document.getElementById("spirit-wheel-capture-area");
        if (!element) return;
        
        const canvas = await html2canvas(element, {
          scale: 2, // High resolution
          useCORS: true,
          backgroundColor: activeTheme.pageBg || '#0f172a',
        });
        
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `spirit-wheel-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to capture image", err);
        alert("Failed to capture image");
      } finally {
        setIsCapturing(false);
      }
    }, 100);
  };

  const handleSaveReading = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Reading.create({
        title: `Spirit Wheel: ${category}`,
        spread_type: "custom",
        deck_id: "spirit_wheel",
        cards_drawn: [],
        interpretation: aiInterpretation,
        date: new Date().toISOString().split('T')[0],
        category: "Spirit Wheel"
      });
      alert("Reading saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save reading.");
    } finally {
      setIsSaving(false);
    }
  };

  const [customWheels, setCustomWheels] = useState([]);
  const [selectedWheelId, setSelectedWheelId] = useState(initialWheelId || "default");

  const [themeId, setThemeId] = useState("wood");
  const [customTheme, setCustomTheme] = useState({
    outerBg: "#e6b981", outerGrad: "#c48b53", outerBorder: "#2b1810",
    middleBg: "#d4a373", middleGrad: "#b57a42", middleBorder: "#2b1810",
    innerBg: "#b57a42", innerGrad: "#9c602d", innerBorder: "#2b1810",
    hubBorder: "#2b1810", hubBg: "black",
    textOuter: "#2b1810", textMiddle: "#2b1810", textInner: "#2b1810",
    divider: "#2b1810", pin: "#e2e8f0",
    textureUrl: "https://www.transparenttextures.com/patterns/wood-pattern.png",
    pageBg: "#0f172a",
    pageBgImage: "",
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
    stone_led: {
      name: "Stone + LED",
      outerBg: "#d2b48c", outerGrad: "#d2b48c", outerBorder: "#a67c5d",
      middleBg: "#d2b48c", middleGrad: "#d2b48c", middleBorder: "#a67c5d",
      innerBg: "#d2b48c", innerGrad: "#d2b48c", innerBorder: "#a67c5d",
      hubBorder: "#00ffcc", hubBg: "#1a1a2e",
      textOuter: "#111111", textMiddle: "#111111", textInner: "#111111",
      divider: "transparent", pin: "transparent",
      textureUrl: "",
      fontFamily: "Arial, sans-serif",
      isTiles: true,
      ledColor: "#00ffcc",
      pageBg: "#0f0f1f",
      hubIcon: "🐱"
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
    metatron: {
      name: "Sacred Geometry",
      outerBg: "#050505", outerGrad: "#1a1a1a", outerBorder: "#cba135",
      middleBg: "#000000", middleGrad: "#0f0f0f", middleBorder: "#cba135",
      innerBg: "#1a1a1a", innerGrad: "#050505", innerBorder: "#cba135",
      hubBorder: "#cba135", hubBg: "#000000",
      textOuter: "#cba135", textMiddle: "#cba135", textInner: "#cba135",
      divider: "transparent", pin: "#cba135",
      textureUrl: "https://www.transparenttextures.com/patterns/hexellence.png",
      fontFamily: 'serif',
      pageBg: "#000000",
      pageBgImage: "https://www.transparenttextures.com/patterns/hexellence.png",
      topLayerOpacity: 0.4,
      blendMode: 'screen',
      layerOrder: 'color_top'
    },
    custom: {
      name: "Custom Build"
    }
  };

  const activeTheme = themeId === 'custom' ? customTheme : WHEEL_THEMES[themeId];




  const wheelData = React.useMemo(() => {
    if (selectedWheelId !== "default") {
      const w = customWheels.find(cw => cw.id === selectedWheelId);
      if (w) {
        return {
          outer: (w.outer_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, general: `${r.label}: ${r.meaning}` })),
          middle: (w.middle_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` })),
          inner: (w.inner_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` }))
        };
      }
    }

    let outer = ROOTED_CARDS_DATA.map(c => ({
      id: c.id,
      name: c.name,
      general: `${c.name} (${c.symbol}): ${c.meaning}`
    }));

    return {
      outer,
      middle: WHEEL_MIDDLE,
      inner: WHEEL_INNER
    };
  }, [selectedWheelId, customWheels]);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const user = await queueApiCall(() => base44.auth.me(), 3, 1000, 10000).catch(() => null);
        setCurrentUser(user);
        
        const [publicWheelsRes, myWheelsRes] = await Promise.all([
          queueApiCall(() => base44.entities.SpiritWheelConfiguration.filter({ is_public: true, publish_status: 'published' }, '-updated_date', 200), 3, 1000, 10000).catch(() => []),
          user?.email ? queueApiCall(() => base44.entities.SpiritWheelConfiguration.filter({ created_by: user.email }, '-updated_date', 200), 3, 1000, 10000).catch(() => []) : Promise.resolve([])
        ]);
        
        const publicWheels = Array.isArray(publicWheelsRes) ? publicWheelsRes : [];
        const myWheels = Array.isArray(myWheelsRes) ? myWheelsRes : [];
        


        const allWheelsMap = new Map();
        [...publicWheels, ...myWheels].forEach(w => allWheelsMap.set(w.id, w));
        setCustomWheels(Array.from(allWheelsMap.values()));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    fetchDecks();
  }, []);

  useEffect(() => {
    if (selectedWheelId !== "default") {
      const w = customWheels.find(cw => cw.id === selectedWheelId);
      if (w?.theme_id) setThemeId(w.theme_id);
      if (w?.custom_theme) setCustomTheme(w.custom_theme);
    }
  }, [selectedWheelId, customWheels]);

  const spinWheel = () => {
    if (spinState !== "idle") return;
    setSpinState("spinning");
    setIsRevealed(false);
    setAiInterpretation("");
    spinStartTime.current = Date.now();
    startRotations.current = rotations;
    


    const degreesPerSecondOuter = 270 * spinSpeed;
    const degreesPerSecondMiddle = -270 * spinSpeed;
    const degreesPerSecondInner = 360 * spinSpeed;

    setRotations({
      outer: rotations.outer + degreesPerSecondOuter * 10000,
      middle: rotations.middle + degreesPerSecondMiddle * 10000,
      inner: rotations.inner + degreesPerSecondInner * 10000,
    });

    if (spinDuration !== "continuous") {
      window.spinTimeout = setTimeout(() => {
        stopSpin(degreesPerSecondOuter, degreesPerSecondMiddle, degreesPerSecondInner);
      }, spinDuration * 1000);
    }
  };

  const stopSpin = (degOuter = 270 * spinSpeed, degMiddle = -270 * spinSpeed, degInner = 360 * spinSpeed) => {
    setSpinState(prev => {
      if (prev !== "spinning") return prev;
      
      clearTimeout(window.spinTimeout);
      
      const elapsed = (Date.now() - spinStartTime.current) / 1000;
      const currentOuter = startRotations.current.outer + degOuter * elapsed;
      const currentMiddle = startRotations.current.middle + degMiddle * elapsed;
      const currentInner = startRotations.current.inner + degInner * elapsed;

      const newOuter = currentOuter + Math.sign(degOuter) * 360 * 1.5 + (wheelData.outer.length > 0 ? Math.floor(Math.random() * wheelData.outer.length) * (360 / wheelData.outer.length) : 0);
      const newMiddle = currentMiddle + Math.sign(degMiddle) * 360 * 1.5 - (wheelData.middle.length > 0 ? Math.floor(Math.random() * wheelData.middle.length) * (360 / wheelData.middle.length) : 0);
      const newInner = currentInner + Math.sign(degInner) * 360 * 1.5 + (wheelData.inner.length > 0 ? Math.floor(Math.random() * wheelData.inner.length) * (360 / wheelData.inner.length) : 0);

      setRotations({ outer: newOuter, middle: newMiddle, inner: newInner });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          const pattern = [];
          let delay = 30;
          for (let i = 0; i < 28; i++) {
            pattern.push(15);
            pattern.push(delay);
            delay += 10;
          }
          navigator.vibrate(pattern);
        } catch (e) {}
      }

      setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
        setSpinState("idle");
        setSelectedIndices({
          outer: wheelData.outer.length > 0 ? (wheelData.outer.length - Math.round((newOuter % 360) / (360 / wheelData.outer.length))) % wheelData.outer.length : 0,
          middle: wheelData.middle.length > 0 ? Math.round((Math.abs(newMiddle) % 360) / (360 / wheelData.middle.length)) % wheelData.middle.length : 0,
          inner: wheelData.inner.length > 0 ? (wheelData.inner.length - Math.round((newInner % 360) / (360 / wheelData.inner.length))) % wheelData.inner.length : 0
        });
        if (!blankMode) {
          // Force a micro-delay to let React apply selectedIndices before revealing
          setTimeout(() => setIsRevealed(true), 50);
        }
      }, 3500);
      
      return "stopping";
    });
  };

  const getSegmentText = (ring, index) => {
    if (ring === 'outer') {
      const item = wheelData.outer[index];
      return item?.name || item?.id || "";
    }
    if (ring === 'middle') return wheelData.middle[index]?.meaning || "";
    if (ring === 'inner') return wheelData.inner[index]?.meaning || "";
    return "";
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const getInterpretation = async () => {
    setIsAiLoading(true);
    try {
      const outerItem = wheelData.outer[selectedIndices.outer] || {};
      const middleItem = wheelData.middle[selectedIndices.middle] || {};
      const innerItem = wheelData.inner[selectedIndices.inner] || {};

      // Database-driven reading based on combinations (Bypasses AI)
      const coreTheme = outerItem.general ? outerItem.general.split(":")[0] : (outerItem.name || "Unknown theme");
      const timingModifier = middleItem.meaning || middleItem.general || "Unknown modifier";
      const actionGuidance = innerItem.meaning || innerItem.general || "Unknown guidance";
      
      const categoryName = selectedWheelId === "default" ? category : customWheels.find(w => w.id === selectedWheelId)?.name || "Custom Reading";
      
      let staticReading = `Your reading focuses on ${categoryName}. The core theme is ${coreTheme}. `;
      
      if (outerItem.meaning || outerItem.general?.includes(":")) {
        staticReading += `\n(${outerItem.meaning || outerItem.general.split(":")[1]?.trim()}) \n\n`;
      }
      
      staticReading += `Your modifier indicates "${timingModifier}", suggesting the context of your situation. `;
      staticReading += `Your action guidance is "${actionGuidance}". `;
      
      staticReading += `\n\nReflect on how ${actionGuidance.toLowerCase()} can be integrated with ${coreTheme}.`;
      
      // Wait a short moment to simulate fetching
      await new Promise(resolve => setTimeout(resolve, 800));
      setAiInterpretation(staticReading);

    } catch (e) {
      console.error(e);
      setAiInterpretation("Failed to get interpretation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div 
      id="spirit-wheel-capture-area"
      className="min-h-screen text-amber-50 p-4 md:p-8 font-serif bg-blend-multiply overflow-x-hidden transition-colors duration-500"
      style={{ 
        backgroundColor: activeTheme.pageBg || '#0f172a',
        backgroundImage: activeTheme.pageBgImage ? `url('${activeTheme.pageBgImage}')` : (activeTheme.pageBg && !activeTheme.isTiles ? 'none' : `url('https://www.transparenttextures.com/patterns/wood-pattern.png')`),
        backgroundSize: activeTheme.pageBgImage ? 'cover' : 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: activeTheme.pageBgImage ? 'no-repeat' : 'repeat'
      }}
    >
      <style>{`
        @keyframes stoneBounce {
          0% { transform: translateX(-50%) scale(1); }
          100% { transform: translateX(-50%) scale(1.3); }
        }
        @keyframes strobeFlicker {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.8; filter: brightness(0.8); }
        }
        .stroboscopic-spin {
          animation: strobeFlicker 0.08s infinite linear !important;
        }
      `}</style>
      <div className="max-w-[100rem] mx-auto mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div data-html2canvas-ignore="true">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/50 pl-2 pr-4">
                <ChevronLeft className="w-6 h-6 mr-1" />
                <span className="hidden sm:inline font-semibold">Dashboard</span>
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Spirit Wheel</h1>
            <p className="text-sm md:text-base text-amber-200/80">Astro Insights Digital Reading Room</p>
          </div>
        </div>

        <div data-html2canvas-ignore="true" className="flex flex-wrap items-center gap-2 justify-end">
          <CelestialMapWidget onApplyEnergy={() => {
            setCategory("Astrology");
            // If they are on a custom wheel, maybe switch to the default one to use categories
            setSelectedWheelId("default");
          }} />
          <Button 
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
          >
            {isCapturing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            <span className="hidden sm:inline">Download Image</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Controls & Display */}
        <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0 space-y-6 z-10 order-2 lg:order-1">

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
                {wheelData.outer.length > 0 && (
                  <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
                    <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                      <span>Outer Ring</span>
                      {isImageSymbol(wheelData.outer[selectedIndices.outer]?.id) ? (
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={getThumbnailUrl(getImageUrl(wheelData.outer[selectedIndices.outer]?.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] rounded-full" />
                        </div>
                      ) : (
                        <span className="text-amber-300 bg-black/20 px-2 py-0.5 rounded">
                          {wheelData.outer[selectedIndices.outer]?.id || 'N/A'}
                        </span>
                      )}
                    </div>
                    <div className="text-xl text-amber-50">{getSegmentText('outer', selectedIndices.outer)}</div>
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
        </div>

        {/* Right Column: The Visual Wheel */}
        <div className="flex-1 flex flex-col items-center justify-start lg:justify-center p-2 lg:p-8 relative min-h-[350px] lg:min-h-[600px] order-1 lg:order-2 overflow-hidden lg:overflow-visible">
          
          {/* Zoom Controls */}
          <div data-html2canvas-ignore="true" className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/50 p-1.5 rounded-lg border border-[#8b5a2b] shadow-lg backdrop-blur-sm">
            <Button size="icon" variant="ghost" onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))} className="text-amber-300 hover:text-amber-100 hover:bg-[#8b5a2b]/50 h-8 w-8">
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setZoomLevel(1)} className="text-amber-300 hover:text-amber-100 hover:bg-[#8b5a2b]/50 h-8 w-8 text-[10px] font-bold">
              {Math.round(zoomLevel * 100)}%
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.25))} className="text-amber-300 hover:text-amber-100 hover:bg-[#8b5a2b]/50 h-8 w-8">
              <ZoomOut className="w-5 h-5" />
            </Button>
          </div>

          <div 
            className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] xl:w-[850px] xl:h-[850px] shrink-0 mt-6 lg:mt-0 transition-transform duration-300 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <motion.div 
              className={`absolute inset-0 cursor-pointer ${isSpinning && activeTheme.stroboscopic ? 'stroboscopic-spin' : ''}`}
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
            <div className="absolute top-[-35px] md:top-[-45px] lg:top-[-55px] left-1/2 -translate-x-1/2 z-50 drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)]">
              <svg className="w-10 h-12 md:w-14 md:h-16 lg:w-16 lg:h-20 relative z-10" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 48L0 0H40L20 48Z" fill="url(#pointer-gradient)" />
                <defs>
                  <linearGradient id="pointer-gradient" x1="20" y1="0" x2="20" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f59e0b" />
                    <stop offset="1" stopColor="#b45309" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Dynamic Glow Zone for symbols passing underneath */}
              <div className="absolute top-[40px] md:top-[50px] left-1/2 -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 bg-amber-400/30 blur-xl rounded-full mix-blend-screen pointer-events-none" />
              <div className="absolute top-[40px] md:top-[50px] left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 blur-md rounded-full mix-blend-screen pointer-events-none" />
            </div>

            {/* Outer Ring */}
            <motion.div 
              className={`absolute inset-0 rounded-full ${activeTheme.isTiles ? 'shadow-[0_0_80px_rgba(0,255,204,0.3)]' : 'overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)]'}`}
              style={activeTheme.isTiles ? {
                backgroundColor: 'transparent'
              } : {
                borderWidth: `${activeTheme.borderThickness ?? 6}px`,
                borderStyle: activeTheme.borderStyle || 'solid',
                borderColor: activeTheme.outerBorder,
              }}
              animate={{ rotate: rotations.outer }}
              transition={spinState === "spinning" ? { duration: 10000, ease: "linear" } : { duration: 3.5, type: "tween", ease: "circOut" }}
            >
              {!activeTheme.isTiles && (
                <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden" style={{ zIndex: 0 }}>
                  {activeTheme.layerOrder === 'color_top' ? (
                    <>
                      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.outerTextureUrl ?? activeTheme.textureUrl}")` }} />
                      <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.outerBg} 0%, ${activeTheme.outerGrad} 100%)`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.outerBg} 0%, ${activeTheme.outerGrad} 100%)` }} />
                      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.outerTextureUrl ?? activeTheme.textureUrl}")`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
                    </>
                  )}
                </div>
              )}
              {wheelData.outer.map((item, i) => {
                const angle = 360 / wheelData.outer.length;
                const isCrowded = wheelData.outer.length > 25;
                return (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * angle}deg)` }}
                >
                  <div 
                    className={`absolute -translate-x-1/2 flex items-center justify-center font-bold whitespace-nowrap transition-all duration-300 ${
                      activeTheme.isTiles || item.bgImage
                        ? 'w-[36px] h-[36px] sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full border-2 top-[-18px] sm:top-[-24px] md:top-[-32px] shadow-lg' 
                        : (isCrowded && i % 2 === 1 ? 'top-6 sm:top-8 md:top-10 lg:top-12' : 'top-1 sm:top-2 md:top-3 lg:top-4') + ' text-base md:text-2xl lg:text-3xl xl:text-4xl'
                    }`} 
                    style={{ 
                      color: activeTheme.textOuter,
                      backgroundColor: activeTheme.isTiles ? activeTheme.outerBg : (item.bgImage ? 'rgba(0,0,0,0.5)' : 'transparent'),
                      backgroundImage: item.bgImage ? `url("${item.bgImage}")` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderColor: activeTheme.isTiles || item.bgImage ? (i === selectedIndices.outer && !isSpinning ? (activeTheme.ledColor || '#f59e0b') : activeTheme.outerBorder) : 'transparent',
                      boxShadow: (activeTheme.isTiles || item.bgImage) && i === selectedIndices.outer && !isSpinning ? `0 0 15px ${activeTheme.ledColor || '#f59e0b'}, inset 0 0 8px ${activeTheme.ledColor || '#f59e0b'}` : 'none',
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      textShadow: (!activeTheme.isTiles && !item.bgImage) && (themeId === 'wood' || themeId === 'parchment') ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : (!activeTheme.isTiles && !item.bgImage ? '0 0 5px currentColor' : 'none'),
                      fontFamily: activeTheme.fontFamily,
                      animation: isSpinning && (activeTheme.isTiles || item.bgImage) ? `stoneBounce 0.3s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.05}s`,
                      fontSize: activeTheme.isTiles ? '0.75em' : undefined
                    }}
                  >
                    {isImageSymbol(item.id) ? (
                      <div className={`shrink-0 flex items-center justify-center overflow-hidden ${isCrowded ? 'w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16' : 'w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24'}`}>
                        <img src={getThumbnailUrl(getImageUrl(item.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] rounded-full" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                        {!/^\d+$/.test(String(item.id)) && <span>{item.id}</span>}
                        {item.name && String(item.name).trim() !== String(item.id).trim() && (
                          <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm px-1 max-w-[50px] sm:max-w-[80px] whitespace-normal leading-tight text-center">
                            {item.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Segment dividers */}
                  {/* <div className="absolute top-0 -translate-x-1/2 w-[1px] h-full" style={{ transform: `rotate(${angle / 2}deg)`, backgroundColor: activeTheme.divider, opacity: 0.25 }}></div> */}
                  {/* Silver Pins */}
                  {!activeTheme.isTiles && <div className="absolute top-[2px] -translate-x-1/2 w-[3px] h-[3px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 rounded-full shadow-sm border border-black/30 z-10" style={{ transform: `rotate(${angle / 2}deg)`, backgroundColor: activeTheme.pin }}></div>}
                </div>
              )})}
            </motion.div>

            {/* Middle Ring */}
            <motion.div 
              className={`absolute inset-[18%] rounded-full ${activeTheme.isTiles ? '' : 'overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]'}`}
              style={activeTheme.isTiles ? {
                backgroundColor: 'transparent'
              } : {
                borderWidth: `${Math.max(1, (activeTheme.borderThickness ?? 6) - 1)}px`,
                borderStyle: activeTheme.borderStyle || 'solid',
                borderColor: activeTheme.middleBorder,
              }}
              animate={{ rotate: rotations.middle }}
              transition={spinState === "spinning" ? { duration: 10000, ease: "linear" } : { duration: 3.5, type: "tween", ease: "circOut" }}
            >
              {!activeTheme.isTiles && (
                <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden" style={{ zIndex: 0 }}>
                  {activeTheme.layerOrder === 'color_top' ? (
                    <>
                      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.middleTextureUrl ?? activeTheme.textureUrl}")` }} />
                      <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.middleBg} 0%, ${activeTheme.middleGrad} 100%)`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.middleBg} 0%, ${activeTheme.middleGrad} 100%)` }} />
                      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.middleTextureUrl ?? activeTheme.textureUrl}")`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
                    </>
                  )}
                </div>
              )}
              {wheelData.middle.map((item, i) => {
                const angle = 360 / wheelData.middle.length;
                return (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * angle}deg)` }}
                >
                  <div 
                    className={`absolute -translate-x-1/2 flex items-center justify-center font-bold whitespace-nowrap transition-all duration-300 ${
                      activeTheme.isTiles || item.bgImage
                        ? 'w-[32px] h-[32px] sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full border-2 top-[-16px] sm:top-[-22px] md:top-[-28px] shadow-lg' 
                        : 'top-2 sm:top-3 md:top-4 lg:top-5 text-lg md:text-3xl lg:text-4xl xl:text-5xl'
                    }`} 
                    style={{ 
                      color: activeTheme.textMiddle,
                      backgroundColor: activeTheme.isTiles ? activeTheme.middleBg : (item.bgImage ? 'rgba(0,0,0,0.5)' : 'transparent'),
                      backgroundImage: item.bgImage ? `url("${item.bgImage}")` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderColor: activeTheme.isTiles || item.bgImage ? (i === selectedIndices.middle && !isSpinning ? (activeTheme.ledColor || '#f59e0b') : activeTheme.middleBorder) : 'transparent',
                      boxShadow: (activeTheme.isTiles || item.bgImage) && i === selectedIndices.middle && !isSpinning ? `0 0 15px ${activeTheme.ledColor || '#f59e0b'}, inset 0 0 8px ${activeTheme.ledColor || '#f59e0b'}` : 'none',
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      textShadow: (!activeTheme.isTiles && !item.bgImage) && (themeId === 'wood' || themeId === 'parchment') ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : (!activeTheme.isTiles && !item.bgImage ? '0 0 5px currentColor' : 'none'),
                      fontFamily: activeTheme.fontFamily,
                      animation: isSpinning && (activeTheme.isTiles || item.bgImage) ? `stoneBounce 0.35s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.05}s`
                    }}
                  >
                    {['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Black', 'White', 'Brown', 'LightBlue', 'Grey', 'Orange'].includes(item.id) ? (
                      <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full shadow-inner border border-black/30" style={{ backgroundColor: item.id === 'LightBlue' ? '#add8e6' : item.id.toLowerCase() }}></div>
                        {item.name && String(item.name).trim() !== String(item.id).trim() && (
                          <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm px-1 max-w-[50px] sm:max-w-[80px] whitespace-normal leading-tight text-center">
                            {item.name}
                          </span>
                        )}
                      </div>
                    ) : isImageSymbol(item.id) ? (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={getThumbnailUrl(getImageUrl(item.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] rounded-full" />
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center leading-none gap-0.5 ${activeTheme.isTiles ? "text-[10px] md:text-sm" : ""}`}>
                        {!/^\d+$/.test(String(item.id)) && <span>{item.id}</span>}
                        {item.name && String(item.name).trim() !== String(item.id).trim() && (
                          <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm px-1 max-w-[50px] sm:max-w-[70px] whitespace-normal leading-tight text-center">
                            {item.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Segment dividers */}
                  {/* <div className="absolute top-0 -translate-x-1/2 w-[1px] h-full" style={{ transform: `rotate(${angle / 2}deg)`, backgroundColor: activeTheme.divider, opacity: 0.25 }}></div> */}
                  {/* Silver Pins */}
                  {!activeTheme.isTiles && <div className="absolute top-[2px] -translate-x-1/2 w-[3px] h-[3px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 rounded-full shadow-sm border border-black/30 z-10" style={{ transform: `rotate(${angle / 2}deg)`, backgroundColor: activeTheme.pin }}></div>}
                </div>
              )})}
            </motion.div>

            {/* Inner Ring */}
            <motion.div 
              className={`absolute inset-[34%] rounded-full ${activeTheme.isTiles ? '' : 'overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]'}`}
              style={activeTheme.isTiles ? {
                backgroundColor: 'transparent'
              } : {
                borderWidth: `${Math.max(1, (activeTheme.borderThickness ?? 6) - 2)}px`,
                borderStyle: activeTheme.borderStyle || 'solid',
                borderColor: activeTheme.innerBorder,
              }}
              animate={{ rotate: rotations.inner }}
              transition={spinState === "spinning" ? { duration: 10000, ease: "linear" } : { duration: 3.5, type: "tween", ease: "circOut" }}
            >
              {!activeTheme.isTiles && (
                <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden" style={{ zIndex: 0 }}>
                  {activeTheme.layerOrder === 'color_top' ? (
                    <>
                      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.innerTextureUrl ?? activeTheme.textureUrl}")` }} />
                      <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.innerBg} 0%, ${activeTheme.innerGrad} 100%)`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.innerBg} 0%, ${activeTheme.innerGrad} 100%)` }} />
                      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.innerTextureUrl ?? activeTheme.textureUrl}")`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
                    </>
                  )}
                </div>
              )}
              {wheelData.inner.map((item, i) => {
                const angle = 360 / wheelData.inner.length;
                return (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * angle}deg)` }}
                >
                  <div 
                    className={`absolute -translate-x-1/2 flex items-center justify-center font-bold whitespace-nowrap transition-all duration-300 ${
                      activeTheme.isTiles || item.bgImage
                        ? 'w-[36px] h-[36px] sm:w-14 sm:h-14 md:w-[70px] md:h-[70px] rounded-full border-2 top-[-18px] sm:top-[-28px] md:top-[-35px] shadow-lg' 
                        : 'top-2 sm:top-3 md:top-5 lg:top-8 text-xl md:text-4xl lg:text-5xl xl:text-6xl'
                    }`} 
                    style={{ 
                      color: activeTheme.textInner,
                      backgroundColor: activeTheme.isTiles ? activeTheme.innerBg : (item.bgImage ? 'rgba(0,0,0,0.5)' : 'transparent'),
                      backgroundImage: item.bgImage ? `url("${item.bgImage}")` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderColor: activeTheme.isTiles || item.bgImage ? (i === selectedIndices.inner && !isSpinning ? (activeTheme.ledColor || '#f59e0b') : activeTheme.innerBorder) : 'transparent',
                      boxShadow: (activeTheme.isTiles || item.bgImage) && i === selectedIndices.inner && !isSpinning ? `0 0 15px ${activeTheme.ledColor || '#f59e0b'}, inset 0 0 8px ${activeTheme.ledColor || '#f59e0b'}` : 'none',
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      textShadow: (!activeTheme.isTiles && !item.bgImage) && (themeId === 'wood' || themeId === 'parchment') ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : (!activeTheme.isTiles && !item.bgImage ? '0 0 5px currentColor' : 'none'),
                      fontFamily: activeTheme.fontFamily,
                      animation: isSpinning && (activeTheme.isTiles || item.bgImage) ? `stoneBounce 0.4s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.05}s`,
                      fontSize: activeTheme.isTiles ? '1.2em' : undefined
                    }}
                  >
                    {isImageSymbol(item.id) ? (
                      <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={getThumbnailUrl(getImageUrl(item.id), 400)} loading="lazy" alt="" className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] rounded-full" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center leading-none gap-0.5">
                        {!/^\d+$/.test(String(item.id)) && <span>{item.id}</span>}
                        {item.name && String(item.name).trim() !== String(item.id).trim() && (
                          <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm px-1 max-w-[60px] sm:max-w-[80px] whitespace-normal leading-tight text-center">
                            {item.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Segment dividers */}
                  {/* <div className="absolute top-0 -translate-x-1/2 w-[1px] h-full" style={{ transform: `rotate(${angle / 2}deg)`, backgroundColor: activeTheme.divider, opacity: 0.25 }}></div> */}
                  {/* Silver Pins */}
                  {!activeTheme.isTiles && <div className="absolute top-[2px] -translate-x-1/2 w-[3px] h-[3px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 rounded-full shadow-sm border border-black/30 z-10" style={{ transform: `rotate(${angle / 2}deg)`, backgroundColor: activeTheme.pin }}></div>}
                </div>
              )})}
            </motion.div>
            
            {/* Center Hub */}
            <div 
              className={`absolute inset-[48%] sm:inset-[46%] md:inset-[47%] rounded-full ${activeTheme.isTiles ? 'border-[3px]' : 'border-[5px]'} shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 overflow-hidden flex items-center justify-center`}
              style={{
                borderColor: activeTheme.hubBorder,
                backgroundColor: activeTheme.hubBg
              }}
            >
              {activeTheme.hubIcon ? (
                <div className="text-3xl md:text-5xl">{activeTheme.hubIcon}</div>
              ) : (
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4cde5ffdd_IMG_6738.jpg" 
                  alt="Center Logo" 
                  className="w-full h-full object-cover pointer-events-none" 
                />
              )}
            </div>



          </motion.div>
          </div>

          {/* Spin controls underneath the wheel */}
          <div className="w-full max-w-md mt-12 space-y-4 z-20 relative px-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-amber-200/80 text-xs">Spin Speed</Label>
                <Select value={spinSpeed.toString()} onValueChange={(v) => setSpinSpeed(parseFloat(v))} disabled={spinState !== "idle"}>
                  <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                    <SelectItem value="0.5">Slow</SelectItem>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-amber-200/80 text-xs">Duration</Label>
                <Select value={spinDuration.toString()} onValueChange={(v) => setSpinDuration(v === "continuous" ? "continuous" : parseInt(v))} disabled={spinState !== "idle"}>
                  <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                    <SelectItem value="3">3 seconds</SelectItem>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="continuous">Continuous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {spinState === "idle" ? (
              <Button 
                onClick={spinWheel} 
                className="w-full bg-[#8b5a2b] hover:bg-[#a66d35] text-amber-50 py-8 text-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.4)] border border-[#a66d35] active:scale-95 transition-transform"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Spin the Wheel
              </Button>
            ) : (
              <Button 
                onClick={() => stopSpin()} 
                disabled={spinState === "stopping"}
                className="w-full bg-red-900 hover:bg-red-800 text-red-50 py-8 text-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.4)] border border-red-700 active:scale-95 transition-transform"
              >
                {spinState === "stopping" ? (
                  <><RefreshCw className="animate-spin w-6 h-6 mr-3" /> Halting Spirits...</>
                ) : (
                  <><Octagon className="w-6 h-6 mr-3" /> Stop Wheel</>
                )}
              </Button>
            )}
            <div className="text-center text-amber-200/50 text-sm italic pt-2">
              👆 Or tap / swipe the wheel directly to spin
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto pb-12 mt-8 z-10 relative">
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
                  <SelectItem value="stone_led">Stone + LED</SelectItem>
                  <SelectItem value="metatron">Sacred Geometry</SelectItem>
                  <SelectItem value="custom">Custom Build...</SelectItem>
                </SelectContent>
              </Select>
              
              {themeId === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mb-4 bg-black/30 p-3 rounded-lg border border-[#5c3a21]">
                  <div>
                    <Label className="text-amber-200/80 text-xs">Outer Ring</Label>
                    <div className="flex gap-2 mt-1 mb-1">
                      <input type="color" value={customTheme.outerBg} onChange={e => setCustomTheme({...customTheme, outerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.outerGrad} onChange={e => setCustomTheme({...customTheme, outerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                    <Input value={customTheme.outerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, outerTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1" />
                  </div>
                  <div>
                    <Label className="text-amber-200/80 text-xs">Middle Ring</Label>
                    <div className="flex gap-2 mt-1 mb-1">
                      <input type="color" value={customTheme.middleBg} onChange={e => setCustomTheme({...customTheme, middleBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.middleGrad} onChange={e => setCustomTheme({...customTheme, middleGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                    <Input value={customTheme.middleTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, middleTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1" />
                  </div>
                  <div>
                    <Label className="text-amber-200/80 text-xs">Inner Ring</Label>
                    <div className="flex gap-2 mt-1 mb-1">
                      <input type="color" value={customTheme.innerBg} onChange={e => setCustomTheme({...customTheme, innerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                      <input type="color" value={customTheme.innerGrad} onChange={e => setCustomTheme({...customTheme, innerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                    <Input value={customTheme.innerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, innerTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1" />
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
                  <div>
                    <Label className="text-amber-200/80 text-xs">Page Background</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.pageBg || "#0f172a"} onChange={e => setCustomTheme({...customTheme, pageBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                  <div className="col-span-2 hidden">
                    <Label className="text-amber-200/80 text-xs">Global Texture URL</Label>
                    <Input value={customTheme.textureUrl} onChange={e => setCustomTheme({...customTheme, textureUrl: e.target.value})} className="bg-black/40 border-white/10 mt-1 text-xs h-8" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-amber-200/80 text-xs block mb-1">Layer & Blending Options</Label>
                    <div className="flex gap-2">
                      <Select value={customTheme.layerOrder || 'texture_top'} onValueChange={v => setCustomTheme({...customTheme, layerOrder: v})}>
                        <SelectTrigger className="bg-black/40 border-white/10 text-[10px] h-7 flex-1" title="Layer Order">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          <SelectItem value="texture_top">Texture on Top</SelectItem>
                          <SelectItem value="color_top">Color on Top</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-md px-1 h-7">
                        <span className="text-[10px] text-amber-200/60 whitespace-nowrap">Opacity:</span>
                        <Input type="number" min="0" max="100" value={customTheme.topLayerOpacity !== undefined ? Math.round(customTheme.topLayerOpacity * 100) : 100} onChange={e => setCustomTheme({...customTheme, topLayerOpacity: Number(e.target.value)/100})} className="w-10 bg-transparent border-none text-[10px] h-5 p-0 text-center focus-visible:ring-0 outline-none" />
                        <span className="text-[10px] text-amber-200/60">%</span>
                      </div>
                      <Select value={customTheme.blendMode || 'multiply'} onValueChange={v => setCustomTheme({...customTheme, blendMode: v})}>
                        <SelectTrigger className="bg-black/40 border-white/10 text-[10px] h-7 flex-1" title="Blend Mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="multiply">Multiply</SelectItem>
                          <SelectItem value="overlay">Overlay</SelectItem>
                          <SelectItem value="screen">Screen</SelectItem>
                          <SelectItem value="soft-light">Soft Light</SelectItem>
                          <SelectItem value="hard-light">Hard Light</SelectItem>
                          <SelectItem value="color-burn">Color Burn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-amber-200/80 text-xs">Page Background Image URL</Label>
                    <Input value={customTheme.pageBgImage || ""} onChange={e => setCustomTheme({...customTheme, pageBgImage: e.target.value})} className="bg-black/40 border-white/10 mt-1 text-xs h-8" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Choose Wheel</Label>
              <Select value={selectedWheelId} onValueChange={setSelectedWheelId}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 max-h-64 overflow-y-auto">
                  <SelectItem value="default">Rooted Crescent Wheel</SelectItem>
                  {customWheels.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name} {w.publish_status === 'draft' ? '(Draft)' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 mb-4">
                <Link to={createPageUrl("SpiritWheelDesigner")} className="flex-1">
                  <Button variant="outline" className="w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
                    <Plus className="w-4 h-4 mr-2" /> New Wheel
                  </Button>
                </Link>
                {selectedWheelId !== "default" && customWheels.find(w => w.id === selectedWheelId)?.created_by === currentUser?.email ? (
                  <Link to={`${createPageUrl("SpiritWheelDesigner")}?id=${selectedWheelId}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
                      <Sparkles className="w-4 h-4 mr-2" /> Edit Wheel
                    </Button>
                  </Link>
                ) : selectedWheelId === "default" && (
                  <Link to={`${createPageUrl("SpiritWheelDesigner")}?clone=default`} className="flex-1">
                    <Button variant="outline" className="w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
                      <Copy className="w-4 h-4 mr-2" /> Clone to Edit
                    </Button>
                  </Link>
                )}
              </div>

              {selectedWheelId === "default" && (
                <>
                  <Label className="text-amber-200 mb-2 block font-semibold text-lg">Category-Shift Logic</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-[#2d1b0d]/50 rounded-lg border border-[#5c3a21]">
              <div>
                <div className="font-semibold text-amber-200">"Blank Tile" Imagine Mode</div>
                <div className="text-sm text-amber-200/60">Hide meanings until you meditate on them</div>
              </div>
              <Switch checked={blankMode} onCheckedChange={setBlankMode} className="data-[state=checked]:bg-amber-600" />
            </div>
          </div>
      </div>

      <div data-html2canvas-ignore="true">
        <AudioOrb 
          textToSpeak={aiInterpretation} 
          autoPlay={!!aiInterpretation} 
          variant="player"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-12 text-center text-xs text-amber-200/50 pb-8">
        Disclaimer: The guidance provided is for entertainment purposes only and does not constitute professional advice. Client logins are secured and data can be deleted at any time.
      </div>
      
      <ReadingShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reading={{
          title: `Spirit Wheel: ${category}`,
          deck_id: "spirit_wheel",
          interpretation: aiInterpretation
        }}
        deckName="Rooted Crescent Wheel"
        spreadName="Spirit Wheel Reading"
        drawnCards={[]}
      />
    </div>
  );
}