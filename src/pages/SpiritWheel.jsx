import React, { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, RefreshCw, Eye, ChevronLeft, Save, Plus, ZoomIn, ZoomOut, Download, Octagon, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AudioOrb from "@/components/reading/AudioOrb";
import html2canvas from 'html2canvas';

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
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dd1c9186e_D0009B98-FAD8-4CC4-BADF-A7DC8D7178F3.png", name: "The Heart Full Foundress", symbol: "Sturdy heart shape with roots at the base.", meaning: "Nurture with love and strength for growth." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6ae050f51_C3C1871F-D9A3-42AB-AAE1-915196101169.png", name: "Guardian of In-Essence", symbol: "Small glowing inner flame or child-like spark.", meaning: "Protect your inner joy and essence." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/03b87e7d6_526B0A26-D804-4C5C-B5A7-4C76D815ABD9.png", name: "The Sureline of Purpose", symbol: "Straight arrow piercing a solid circle.", meaning: "Stand firm in purpose through introspection." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b386bf4cf_AC082A3F-8854-4DD6-BB68-AA607E096D32.png", name: "Nis Puk's Whisper", symbol: "Playful small creature silhouette with speech swirl.", meaning: "Playful wisdom guides subtly." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/ecbdd2d58_25846904-F95B-423D-8E9D-8AE04265078D.png", name: "The Patient Feminine", symbol: "Gentle curved feminine figure in seated pose.", meaning: "Patience and grounded strength lead to growth." },
  { id: "35", name: "The Garden Portal", symbol: "Simple arch or gate with upward flowing lines.", meaning: "Courage opens gateways to new dimensions." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/2cac99471_EFF38B3A-F3E0-4611-93E1-E949278C22CE.png", name: "With Chains Unbound", symbol: "Broken chain links forming an open circle.", meaning: "Break free from patterns for new paths." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b6d9980ac_B3AA33A1-5B09-4A8A-BDB1-8630A70EE9C1.png", name: "Nature's Whisper", symbol: "Leaf or tree branch with subtle wind lines.", meaning: "Nature’s cycles guide wisdom and vitality." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/93218ad8d_113EAF8F-46EF-4D0E-8BEE-505B08576E0F.png", name: "Back Road Whispers", symbol: "Winding road path disappearing into distance.", meaning: "Winding paths lead to wisdom through exploration." },
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

const WHEEL_MIDDLE = [
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

const WHEEL_INNER = [
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
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/88ee8ec8d_32DB718D-EFA1-4827-8AEC-6AB91A8BF329.png", label: "Maia's Root", meaning: "Quiet care grounds wild growth. Nurture the seed; steady support arrives. Keywords: nurture, foundation, patience, care." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/3bd854cd9_6381CF9C-029F-4D2C-84BA-81168C947FE3.png", label: "Electra's Spark", meaning: "Sudden brilliance demands action. Flash of insight — move fast and true. Keywords: brilliance, leadership, speed, clarity." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a28758f63_8501F496-2B70-4F65-B2BA-FAFEA987F484.png", label: "Alcyone's Calm", meaning: "Tranquility after the storm. Rest in the eye of change; peace restores. Keywords: peace, reflection, restoration, balance." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d7e717c9b_3F39BC02-39E5-47A7-AC4D-3DD487C9C369.png", label: "Taygete's Chase", meaning: "Pursuit with grace and speed. Chase the goal lightly; momentum is yours. Keywords: pursuit, freedom, momentum, grace." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/20d73f158_1387F872-F65F-4474-B013-E85675780EFE.png", label: "Celaeno's Veil", meaning: "What is hidden holds power. Embrace the unknown; mystery teaches. Keywords: shadow, mystery, hidden truth, depth." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/cb94d92f2_FB6DDABB-8BD8-4659-9B0B-E96D754A7AF0.png", label: "Sterope's Flame", meaning: "Inspiration strikes like starfire. Creative lightning — capture it now. Keywords: inspiration, creativity, fire, suddenness." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/91325776e_C924B138-EE3C-4992-A912-B0D1598F9C16.png", label: "Merope's Echo", meaning: "The missing voice still whispers wisdom. Listen for the subtle return; integration awaits. Keywords: return, integration, quiet wisdom, wholeness." }
];

const SPIRITUAL_EMOTICONS_MODIFIERS = [
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fda52ec6b_emojiscomsymbol_-crescent-with-faint-echoing-ripples-turning-into-roots-meaning_-listen-to-inner-or-ancestral-guidance.png", label: "Grounded Moon", meaning: "Instant grounding and presence." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/38c1faf8f_emojiscom1-inner-eye-symbol_-crescent-framing-a-simple-open-eye-with-soft-root-like-lashes-meaning_-trust-intuition-and-inner-sight.png", label: "Inner Eye", meaning: "Trust intuition and inner sight." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/cc4ec511c_emojiscomsymbol_-crescent-with-a-leaf-breaking-free-from-tangled-roots-meaning_-let-go-of-what-no-longer-serves.png", label: "Shadow Release", meaning: "Let go of what no longer serves." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/537236bca_emojiscomheart-root-symbol_-crescent-cradling-a-small-heart-with-roots-growing-from-its-base-meaning_-love-anchored-in-self.png", label: "Heart Root", meaning: "Love anchored in self." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fa6e4de90_emojiscomsymbol_-crescent-turning-into-gentle-flowing-water_leaf-veins-meaning_-move-with-natural-cycles.png", label: "Flow Crescent", meaning: "Move with natural cycles." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4fe466777_emojiscomspark-seed-symbol_-tiny-glowing-spark-inside-a-crescent-with-sprouting-leaves-meaning_-creative-or-spiritual-ignition.png", label: "Spark Seed", meaning: "Creative or spiritual ignition." },
  { id: "✨", label: "Veil Lift", meaning: "Gentle revelation and clarity." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/773fddf77_emojiscom8-balance-wings-symbol_-two-symmetrical-crescents-forming-open-wings-with-central-root-meaning_-harmony-between-light-and-shadow.png", label: "Balance Wings", meaning: "Harmony between light and shadow." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/0773b3cdd_emojiscomsymbol_-crescent-with-faint-echoing-ripples-turning-into-roots-meaning_-listen-to-inner-or-ancestral-guidance.png", label: "Wisdom Echo", meaning: "Listen to inner or ancestral guidance." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/de13c89f0_emojiscom10-ascension-flame-symbol_-crescent-rising-with-a-small-flame-merging-into-upward-leaves-meaning_-spiritual-growth-and-elevation.png", label: "Ascension Flame", meaning: "Spiritual growth and elevation." }
];

const MOON_EMBLEMS_MODIFIERS = [
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/79456c147_emojiscommoon--bloom-symbol_-crescent-moon-with-delicate-vines-and-leaves-growing-upward-from-its-base-gently-wrapping-around-the-curve-meaning_-deep-reconnection-with-natures-cycles-and-living-wisdom.png", label: "Moon & Bloom", meaning: "Deep reconnection with nature's cycles and living wisdom." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fe23fac12_emojiscommoon-chakra-symbol_-crescent-moon-with-a-vertical-column-of-7-small-glowing-dots-the-chakras-aligned-perfectly-down-its-center-softly-radiating-outward.png", label: "Moon Chakra", meaning: "Energy alignment and chakra activation." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/e7a4d3c6d_emojiscommoon--third-eye-symbol_-crescent-moon-with-a-single-glowing-eye-centered-in-the-curve-framed-by-a-subtle-lotus-like-mandala-of-leaves-and-roots.png", label: "Moon & Third Eye", meaning: "Intuition, spiritual vision, and inner sight." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/8ec22eb41_emojiscommoon--balance-symbol_-two-symmetrical-crescents-facing-each-other-like-open-wings-with-a-single-vertical-line-of-energy-running-down-the-center-connecting-them.png", label: "Moon & Balance", meaning: "Harmony between opposites and inner equilibrium." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/02859be58_emojiscom1-moon--flame-symbol_-crescent-moon-with-a-small-flame-rising-from-its-curve-meaning_-passionate-intuition-or-creative-fire.png", label: "Moon & Flame", meaning: "Passionate intuition and creative spiritual fire." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a1041b66f_emojiscom2-moon--feather-symbol_-crescent-moon-with-a-single-feather-gently-resting-inside-its-curve-meaning_-lightness-messages-or-spiritual-surrender.png", label: "Moon & Feather", meaning: "Lightness, spiritual messages, and surrender." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6a3be91fd_emojiscom3-moon--spiral-symbol_-crescent-moon-with-a-tight-spiral-growing-from-its-base-like-a-shell-meaning_-inner-journey-cycles-and-unfolding-wisdom.png", label: "Moon & Spiral", meaning: "Inner journey, cycles, and unfolding wisdom." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d3c8c8191_emojiscom4-moon--lotus-symbol_-crescent-moon-with-a-lotus-flower-blooming-from-its-lower-curve-meaning_-spiritual-awakening-and-rising-above-challenges.png", label: "Moon & Lotus", meaning: "Spiritual awakening and rising above challenges." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/7ac2566d5_emojiscom5-moon--hand-symbol_-crescent-moon-cradled-by-an-open-palm-from-below-meaning_-divine-support-receiving-or-surrender.png", label: "Moon & Hand", meaning: "Divine support, receiving, and surrender." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/baa05bcd9_emojiscom6-moon--butterfly-symbol_-crescent-moon-with-butterfly-wings-emerging-from-its-sides-meaning_-transformation-and-soul-evolution.png", label: "Moon & Butterfly", meaning: "Transformation and soul evolution." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/eab249185_emojiscom9-moon--key-symbol_-crescent-moon-with-an-ornate-key-hanging-from-its-inner-curve-meaning_-unlocking-hidden-knowledge-or-soul-purpose.png", label: "Moon & Key", meaning: "Unlocking hidden knowledge or soul purpose." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/546cc87f8_emojiscom7-moon--antlers-symbol_-crescent-moon-with-elegant-antlers-branching-upward-from-its-tips-meaning_-wild-instinct-protection-and-natural-power.png", label: "Moon & Antlers", meaning: "Wild instinct, protection, and natural power." },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d5b1347eb_emojiscom8-moon--drop-symbol_-crescent-moon-with-a-single-water-drop-falling-from-its-curve-meaning_-emotional-release-cleansing-or-divine-tears.png", label: "Moon & Drop", meaning: "Emotional release, cleansing, or divine tears." }
];

const ANIMAL_SPIRITS_MODIFIERS = [
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4b5e817e8_5E5C0F6F-C063-42EF-A81D-13620A8794F8.png", label: "Bear", meaning: "strength, courage, healing" },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/f9166d16a_4872CE13-DAF7-4DB3-B49C-550EF9313D11.png", label: "Wolf", meaning: "loyalty, community, wisdom" },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/1313d2e5a_EEB98506-2E8A-4DC4-9718-014B240314E3.png", label: "Eagle", meaning: "vision, spiritual messenger, freedom" },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dcf97cc36_C736DB82-E6FB-4D19-89B5-A2EFB8678D87.png", label: "Buffalo", meaning: "abundance, gratitude, sacred life" },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6b8c8d2fa_B47D7EAA-5DB6-4144-B5D9-04F527CAD0BE.png", label: "Owl", meaning: "wisdom, intuition, seeing the unseen" },
  { id: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/5986da740_5D416A3A-09D1-4E52-AA69-2C761DFBD8ED.png", label: "Deer", meaning: "gentleness, grace, renewal" }
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

export default function SpiritWheel() {
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
        deck_id: selectedDeckId !== "none" ? selectedDeckId : "spirit_wheel",
        cards_drawn: drawnCard ? [{
          card_id: drawnCard.id || "0",
          position: "1",
          is_reversed: false,
          card_name: drawnCard.name,
          image_url: drawnCard.image_url
        }] : [],
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
  const [selectedWheelId, setSelectedWheelId] = useState("default");

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
    custom: {
      name: "Custom Build"
    }
  };

  const activeTheme = themeId === 'custom' ? customTheme : WHEEL_THEMES[themeId];

  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("none");
  const [deckCards, setDeckCards] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);

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

    if (selectedDeckId !== "none" && deckCards.length > 0) {
      outer = deckCards.map((c, i) => ({
        id: c.spirit_wheel_icon_url || (c.number != null ? String(c.number) : String(i + 1)),
        name: c.name,
        general: `${c.name}: ${c.overall_meaning || c.upright_meaning || (c.keywords ? c.keywords.join(', ') : "Mystical energy")}`
      }));
    }

    return {
      outer,
      middle: WHEEL_MIDDLE,
      inner: selectedWheelId === "default" && selectedDeckId !== "none" ? [...SEVEN_SISTERS_MODIFIERS, ...SPIRITUAL_EMOTICONS_MODIFIERS, ...MOON_EMBLEMS_MODIFIERS, ...ANIMAL_SPIRITS_MODIFIERS] : WHEEL_INNER
    };
  }, [deckCards, selectedDeckId, selectedWheelId, customWheels]);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const publicDecks = await base44.entities.Deck.filter({ is_public: true, publish_status: 'published' }, '-created_date', 100);
        const user = await base44.auth.me().catch(() => null);
        setCurrentUser(user);
        let myDecks = [];
        let myWheels = [];
        let publicWheelsRes = await base44.entities.SpiritWheelConfiguration.filter({ is_public: true }, '-updated_date', 100);
        let publicWheels = (publicWheelsRes || []).filter(w => w.publish_status !== 'draft');
        
        if (user?.email) {
          const mine = await base44.entities.Deck.filter({ created_by: user.email }, '-updated_date', 100);
          myDecks = Array.isArray(mine) ? mine.filter(d => d.publish_status !== 'draft' && d.publish_status !== 'pending_review') : [];
          myWheels = await base44.entities.SpiritWheelConfiguration.filter({ created_by: user.email }, '-updated_date', 100) || [];
        }
        
        const allDecksMap = new Map();
        [...(publicDecks || []), ...myDecks].forEach(d => allDecksMap.set(d.id, d));
        setDecks(Array.from(allDecksMap.values()));

        const allWheelsMap = new Map();
        [...(publicWheels || []), ...(myWheels || [])].forEach(w => allWheelsMap.set(w.id, w));
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
      if (w?.deck_id) setSelectedDeckId(w.deck_id);
      if (w?.custom_theme) setCustomTheme(w.custom_theme);
    }
  }, [selectedWheelId, customWheels]);

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
    if (spinState !== "idle") return;
    setSpinState("spinning");
    setIsRevealed(false);
    setAiInterpretation("");
    spinStartTime.current = Date.now();
    startRotations.current = rotations;
    
    if (selectedDeckId !== "none" && deckCards.length > 0) {
      const randomCard = deckCards[Math.floor(Math.random() * deckCards.length)];
      setDrawnCard(randomCard);
    } else {
      setDrawnCard(null);
    }

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

      let cardName = "";
      if (drawnCard) {
        cardName = drawnCard.name;
      }

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
      
      if (drawnCard && selectedWheelId === "default") {
        staticReading += `\nThe ${cardName} card has revealed itself: ${drawnCard.overall_meaning || drawnCard.upright_meaning || "Embrace its mystical energy."} `;
      }
      
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

        <div data-html2canvas-ignore="true">
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
                  <div>
                    <Label className="text-amber-200/80 text-xs">Page Background</Label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={customTheme.pageBg || "#0f172a"} onChange={e => setCustomTheme({...customTheme, pageBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-amber-200/80 text-xs">Wheel Texture URL</Label>
                    <Input value={customTheme.textureUrl} onChange={e => setCustomTheme({...customTheme, textureUrl: e.target.value})} className="bg-black/40 border-white/10 mt-1 text-xs h-8" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-amber-200/80 text-xs">Page Background Image URL</Label>
                    <Input value={customTheme.pageBgImage || ""} onChange={e => setCustomTheme({...customTheme, pageBgImage: e.target.value})} className="bg-black/40 border-white/10 mt-1 text-xs h-8" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Custom Wheel Configuration</Label>
              <Select value={selectedWheelId} onValueChange={setSelectedWheelId}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 max-h-64 overflow-y-auto">
                  <SelectItem value="default">Default Spirit Wheel</SelectItem>
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
                {selectedWheelId !== "default" && customWheels.find(w => w.id === selectedWheelId)?.created_by === currentUser?.email && (
                  <Link to={`${createPageUrl("SpiritWheelDesigner")}?id=${selectedWheelId}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
                      <Sparkles className="w-4 h-4 mr-2" /> Edit Wheel
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

              <Label className="text-amber-200 mb-2 block font-semibold text-lg">Accompanying Deck (Optional)</Label>
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
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
                {wheelData.outer.length > 0 && (
                  <div className="p-4 bg-[#1c0f05] rounded-lg border border-[#5c3a21]">
                    <div className="text-sm text-amber-500/70 uppercase font-semibold mb-1 flex justify-between items-center">
                      <span>Outer Ring</span>
                      {isImageSymbol(wheelData.outer[selectedIndices.outer]?.id) ? (
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={getImageUrl(wheelData.outer[selectedIndices.outer]?.id)} alt="" className="w-full h-full object-contain mix-blend-screen filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
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
                          <img src={getImageUrl(wheelData.middle[selectedIndices.middle]?.id)} alt="" className="w-full h-full object-contain mix-blend-screen filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
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
                          <img src={getImageUrl(wheelData.inner[selectedIndices.inner]?.id)} alt="" className="w-full h-full object-contain mix-blend-screen filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
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
                
                <div data-html2canvas-ignore="true">
                  <Button onClick={getInterpretation} disabled={isAiLoading} className="w-full mt-6 bg-[#3b2313] hover:bg-[#4a2c18] border border-[#8b5a2b] text-lg py-6">
                    {isAiLoading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin text-amber-400" /> : <Eye className="w-5 h-5 mr-2 text-amber-400" />}
                    Reveal Instant Reading
                  </Button>

                  <Link to={aiInterpretation ? `${createPageUrl("AgentChat")}?initialMessage=${encodeURIComponent(`I just did a Spirit Wheel reading. Here are the results:\n\n${aiInterpretation}\n\nPlease acknowledge receipt of this reading and ask me exactly this question: "Would you like to discuss your spiritual reading further?" Do not provide a deep dive interpretation yet until I answer.`)}` : createPageUrl("AgentChat")} className="block mt-4">
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
                      <div data-html2canvas-ignore="true">
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
              className="absolute inset-0 cursor-pointer"
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
              <svg className="w-10 h-12 md:w-14 md:h-16 lg:w-16 lg:h-20" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 48L0 0H40L20 48Z" fill="url(#pointer-gradient)" />
                <defs>
                  <linearGradient id="pointer-gradient" x1="20" y1="0" x2="20" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f59e0b" />
                    <stop offset="1" stopColor="#b45309" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Outer Ring */}
            <motion.div 
              className={`absolute inset-0 rounded-full ${activeTheme.isTiles ? 'shadow-[0_0_80px_rgba(0,255,204,0.3)]' : 'border-[6px] overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)]'}`}
              style={activeTheme.isTiles ? {
                backgroundColor: 'transparent'
              } : {
                borderColor: activeTheme.outerBorder,
                background: `url("${activeTheme.textureUrl}"), radial-gradient(circle, ${activeTheme.outerBg} 0%, ${activeTheme.outerGrad} 100%)`,
                backgroundBlendMode: 'multiply',
              }}
              animate={{ rotate: rotations.outer }}
              transition={spinState === "spinning" ? { duration: 10000, ease: "linear" } : { duration: 3.5, type: "tween", ease: "circOut" }}
            >
              {wheelData.outer.map((item, i) => {
                const angle = 360 / wheelData.outer.length;
                return (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[50%] origin-bottom"
                  style={{ transform: `rotate(${i * angle}deg)` }}
                >
                  <div 
                    className={`absolute -translate-x-1/2 flex items-center justify-center font-bold whitespace-nowrap transition-all duration-300 ${
                      activeTheme.isTiles 
                        ? 'w-[22px] h-[22px] sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 top-[-11px] sm:top-[-16px] md:top-[-20px]' 
                        : 'top-2 sm:top-3 md:top-4 lg:top-5 text-sm md:text-xl lg:text-2xl xl:text-3xl'
                    }`} 
                    style={{ 
                      color: activeTheme.textOuter,
                      backgroundColor: activeTheme.isTiles ? activeTheme.outerBg : 'transparent',
                      borderColor: activeTheme.isTiles ? (i === selectedIndices.outer && !isSpinning ? activeTheme.ledColor : activeTheme.outerBorder) : 'transparent',
                      boxShadow: activeTheme.isTiles && i === selectedIndices.outer && !isSpinning ? `0 0 15px ${activeTheme.ledColor}, inset 0 0 8px ${activeTheme.ledColor}` : 'none',
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      textShadow: !activeTheme.isTiles && (themeId === 'wood' || themeId === 'parchment') ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : (!activeTheme.isTiles ? '0 0 5px currentColor' : 'none'),
                      fontFamily: activeTheme.fontFamily,
                      animation: isSpinning && activeTheme.isTiles ? `stoneBounce 0.3s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.05}s`,
                      fontSize: activeTheme.isTiles ? '0.75em' : undefined
                    }}
                  >
                    {isImageSymbol(item.id) ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={getImageUrl(item.id)} alt="" className="w-full h-full object-contain mix-blend-screen filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]" />
                      </div>
                    ) : item.id}
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
              className={`absolute inset-[14%] rounded-full ${activeTheme.isTiles ? '' : 'border-[5px] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]'}`}
              style={activeTheme.isTiles ? {
                backgroundColor: 'transparent'
              } : {
                borderColor: activeTheme.middleBorder,
                background: `url("${activeTheme.textureUrl}"), radial-gradient(circle, ${activeTheme.middleBg} 0%, ${activeTheme.middleGrad} 100%)`,
                backgroundBlendMode: 'multiply',
              }}
              animate={{ rotate: rotations.middle }}
              transition={spinState === "spinning" ? { duration: 10000, ease: "linear" } : { duration: 3.5, type: "tween", ease: "circOut" }}
            >
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
                      activeTheme.isTiles 
                        ? 'w-[24px] h-[24px] sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-full border-2 top-[-12px] sm:top-[-18px] md:top-[-24px]' 
                        : 'top-2 sm:top-3 md:top-4 lg:top-5 text-base md:text-2xl lg:text-3xl xl:text-4xl'
                    }`} 
                    style={{ 
                      color: activeTheme.textMiddle,
                      backgroundColor: activeTheme.isTiles ? activeTheme.middleBg : 'transparent',
                      borderColor: activeTheme.isTiles ? (i === selectedIndices.middle && !isSpinning ? activeTheme.ledColor : activeTheme.middleBorder) : 'transparent',
                      boxShadow: activeTheme.isTiles && i === selectedIndices.middle && !isSpinning ? `0 0 15px ${activeTheme.ledColor}, inset 0 0 8px ${activeTheme.ledColor}` : 'none',
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      textShadow: !activeTheme.isTiles && (themeId === 'wood' || themeId === 'parchment') ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : (!activeTheme.isTiles ? '0 0 5px currentColor' : 'none'),
                      fontFamily: activeTheme.fontFamily,
                      animation: isSpinning && activeTheme.isTiles ? `stoneBounce 0.35s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.05}s`
                    }}
                  >
                    {['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Black', 'White', 'Brown', 'LightBlue', 'Grey', 'Orange'].includes(item.id) ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full shadow-inner border border-black/30" style={{ backgroundColor: item.id === 'LightBlue' ? '#add8e6' : item.id.toLowerCase() }}></div>
                    ) : isImageSymbol(item.id) ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={getImageUrl(item.id)} alt="" className="w-full h-full object-contain mix-blend-screen filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]" />
                      </div>
                    ) : (
                      <span className={activeTheme.isTiles ? "text-[10px] md:text-sm" : ""}>{item.id}</span>
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
              className={`absolute inset-[30%] rounded-full ${activeTheme.isTiles ? '' : 'border-[4px] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]'}`}
              style={activeTheme.isTiles ? {
                backgroundColor: 'transparent'
              } : {
                borderColor: activeTheme.innerBorder,
                background: `url("${activeTheme.textureUrl}"), radial-gradient(circle, ${activeTheme.innerBg} 0%, ${activeTheme.innerGrad} 100%)`,
                backgroundBlendMode: 'multiply',
              }}
              animate={{ rotate: rotations.inner }}
              transition={spinState === "spinning" ? { duration: 10000, ease: "linear" } : { duration: 3.5, type: "tween", ease: "circOut" }}
            >
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
                      activeTheme.isTiles 
                        ? 'w-[28px] h-[28px] sm:w-11 sm:h-11 md:w-[60px] md:h-[60px] rounded-full border-2 top-[-14px] sm:top-[-22px] md:top-[-30px]' 
                        : 'top-2 sm:top-3 md:top-5 lg:top-8 text-lg md:text-3xl lg:text-4xl xl:text-5xl'
                    }`} 
                    style={{ 
                      color: activeTheme.textInner,
                      backgroundColor: activeTheme.isTiles ? activeTheme.innerBg : 'transparent',
                      borderColor: activeTheme.isTiles ? (i === selectedIndices.inner && !isSpinning ? activeTheme.ledColor : activeTheme.innerBorder) : 'transparent',
                      boxShadow: activeTheme.isTiles && i === selectedIndices.inner && !isSpinning ? `0 0 15px ${activeTheme.ledColor}, inset 0 0 8px ${activeTheme.ledColor}` : 'none',
                      opacity: blankMode && !isRevealed ? 0 : 1, 
                      textShadow: !activeTheme.isTiles && (themeId === 'wood' || themeId === 'parchment') ? '0.5px 0.5px 0 rgba(255,255,255,0.4)' : (!activeTheme.isTiles ? '0 0 5px currentColor' : 'none'),
                      fontFamily: activeTheme.fontFamily,
                      animation: isSpinning && activeTheme.isTiles ? `stoneBounce 0.4s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.05}s`,
                      fontSize: activeTheme.isTiles ? '1.2em' : undefined
                    }}
                  >
                    {isImageSymbol(item.id) ? (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 shrink-0 flex items-center justify-center overflow-hidden">
                        <img src={getImageUrl(item.id)} alt="" className="w-full h-full object-contain mix-blend-screen filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]" />
                      </div>
                    ) : item.id}
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
              className={`absolute inset-[46%] sm:inset-[42%] md:inset-[43%] rounded-full ${activeTheme.isTiles ? 'border-[3px]' : 'border-[5px]'} shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 overflow-hidden flex items-center justify-center`}
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
    </div>
  );
}