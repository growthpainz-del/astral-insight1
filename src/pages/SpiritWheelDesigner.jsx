import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Plus, Trash2, Download, Upload, Save, Copy, Sparkles, Loader2, Search, Image as ImageIcon } from "lucide-react";
import PhotoLibraryPicker from "@/components/media/PhotoLibraryPicker";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const DEFAULT_SEGMENT = { label: "", meaning: "", type: "custom", icon: "", card_id: "" };

const RING_LABELS = {
  outer_ring: { label: "Outer Ring", color: "amber", hint: "Cards, archetypes, core energies — the largest ring" },
  middle_ring: { label: "Middle Ring", color: "orange", hint: "Modifiers, context, timing symbols" },
  inner_ring: { label: "Inner Ring", color: "yellow", hint: "Action guidance, yes/no, directional symbols" },
};

const THEME_PACKS = {
  yes_no: [
    { label: "Yes", meaning: "Yes — the answer is affirmative", type: "symbol", icon: "✅", card_id: "" },
    { label: "No", meaning: "No — the answer is negative", type: "symbol", icon: "❌", card_id: "" },
    { label: "Maybe", meaning: "Unclear, ask again later", type: "symbol", icon: "🤷", card_id: "" }
  ],
  elements: [
    { label: "Fire", meaning: "Passion and transformation", type: "symbol", icon: "🔥", card_id: "" },
    { label: "Air", meaning: "Thought, communication, movement", type: "symbol", icon: "💨", card_id: "" },
    { label: "Water", meaning: "Emotion, intuition, flow", type: "symbol", icon: "🌊", card_id: "" },
    { label: "Earth", meaning: "Stability, grounding, manifestation", type: "symbol", icon: "🌍", card_id: "" }
  ],
  timing: [
    { label: "Soon", meaning: "It will happen soon", type: "symbol", icon: "⏳", card_id: "" },
    { label: "Patience", meaning: "It will take time", type: "symbol", icon: "🕰️", card_id: "" },
    { label: "Now", meaning: "Immediate action required", type: "symbol", icon: "🚀", card_id: "" }
  ],
  directions: [
    { label: "North", meaning: "Look North / move forward", type: "symbol", icon: "⬆️", card_id: "" },
    { label: "South", meaning: "Look South / retreat inward", type: "symbol", icon: "⬇️", card_id: "" },
    { label: "East", meaning: "New beginnings, the rising sun", type: "symbol", icon: "➡️", card_id: "" },
    { label: "West", meaning: "Endings, reflection, the setting sun", type: "symbol", icon: "⬅️", card_id: "" }
  ],
  zodiac: [
    { label: "Aries", meaning: "Bold, pioneering, courageous", type: "symbol", icon: "♈", card_id: "" },
    { label: "Taurus", meaning: "Steadfast, grounded, reliable", type: "symbol", icon: "♉", card_id: "" },
    { label: "Gemini", meaning: "Versatile, expressive, curious", type: "symbol", icon: "♊", card_id: "" },
    { label: "Cancer", meaning: "Intuitive, protective, nurturing", type: "symbol", icon: "♋", card_id: "" },
    { label: "Leo", meaning: "Dramatic, generous, proud", type: "symbol", icon: "♌", card_id: "" },
    { label: "Virgo", meaning: "Practical, analytical, humble", type: "symbol", icon: "♍", card_id: "" },
    { label: "Libra", meaning: "Diplomatic, harmonious, fair", type: "symbol", icon: "♎", card_id: "" },
    { label: "Scorpio", meaning: "Intense, transformative, passionate", type: "symbol", icon: "♏", card_id: "" },
    { label: "Sagittarius", meaning: "Adventurous, optimistic, free", type: "symbol", icon: "♐", card_id: "" },
    { label: "Capricorn", meaning: "Ambitious, disciplined, responsible", type: "symbol", icon: "♑", card_id: "" },
    { label: "Aquarius", meaning: "Innovative, progressive, humanitarian", type: "symbol", icon: "♒", card_id: "" },
    { label: "Pisces", meaning: "Compassionate, artistic, empathetic", type: "symbol", icon: "♓", card_id: "" }
  ],
  planets: [
    { label: "Sun", meaning: "Ego, vitality, consciousness", type: "symbol", icon: "☀️", card_id: "" },
    { label: "Moon", meaning: "Emotions, instincts, habits", type: "symbol", icon: "🌙", card_id: "" },
    { label: "Mercury", meaning: "Communication, intellect, reason", type: "symbol", icon: "☿", card_id: "" },
    { label: "Venus", meaning: "Love, beauty, harmony", type: "symbol", icon: "♀", card_id: "" },
    { label: "Mars", meaning: "Action, desire, aggression", type: "symbol", icon: "♂", card_id: "" },
    { label: "Jupiter", meaning: "Expansion, luck, philosophy", type: "symbol", icon: "♃", card_id: "" },
    { label: "Saturn", meaning: "Restriction, discipline, structure", type: "symbol", icon: "♄", card_id: "" },
    { label: "Uranus", meaning: "Innovation, rebellion, unpredictability", type: "symbol", icon: "♅", card_id: "" },
    { label: "Neptune", meaning: "Dreams, illusion, spirituality", type: "symbol", icon: "♆", card_id: "" },
    { label: "Pluto", meaning: "Transformation, power, rebirth", type: "symbol", icon: "♇", card_id: "" }
  ],
  spiritual_emoticons: [
    { label: "Grounded Moon", meaning: "Instant grounding and presence.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fda52ec6b_emojiscomsymbol_-crescent-with-faint-echoing-ripples-turning-into-roots-meaning_-listen-to-inner-or-ancestral-guidance.png", card_id: "" },
    { label: "Inner Eye", meaning: "Trust intuition and inner sight.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/38c1faf8f_emojiscom1-inner-eye-symbol_-crescent-framing-a-simple-open-eye-with-soft-root-like-lashes-meaning_-trust-intuition-and-inner-sight.png", card_id: "" },
    { label: "Shadow Release", meaning: "Let go of what no longer serves.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/cc4ec511c_emojiscomsymbol_-crescent-with-a-leaf-breaking-free-from-tangled-roots-meaning_-let-go-of-what-no-longer-serves.png", card_id: "" },
    { label: "Heart Root", meaning: "Love anchored in self.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/537236bca_emojiscomheart-root-symbol_-crescent-cradling-a-small-heart-with-roots-growing-from-its-base-meaning_-love-anchored-in-self.png", card_id: "" },
    { label: "Flow Crescent", meaning: "Move with natural cycles.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fa6e4de90_emojiscomsymbol_-crescent-turning-into-gentle-flowing-water_leaf-veins-meaning_-move-with-natural-cycles.png", card_id: "" },
    { label: "Spark Seed", meaning: "Creative or spiritual ignition.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4fe466777_emojiscomspark-seed-symbol_-tiny-glowing-spark-inside-a-crescent-with-sprouting-leaves-meaning_-creative-or-spiritual-ignition.png", card_id: "" },
    { label: "Veil Lift", meaning: "Gentle revelation and clarity.", type: "symbol", icon: "✨", card_id: "" },
    { label: "Balance Wings", meaning: "Harmony between light and shadow.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/773fddf77_emojiscom8-balance-wings-symbol_-two-symmetrical-crescents-forming-open-wings-with-central-root-meaning_-harmony-between-light-and-shadow.png", card_id: "" },
    { label: "Wisdom Echo", meaning: "Listen to inner or ancestral guidance.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/0773b3cdd_emojiscomsymbol_-crescent-with-faint-echoing-ripples-turning-into-roots-meaning_-listen-to-inner-or-ancestral-guidance.png", card_id: "" },
    { label: "Ascension Flame", meaning: "Spiritual growth and elevation.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/de13c89f0_emojiscom10-ascension-flame-symbol_-crescent-rising-with-a-small-flame-merging-into-upward-leaves-meaning_-spiritual-growth-and-elevation.png", card_id: "" }
  ],
  moon_emblems: [
    { label: "Moon & Bloom", meaning: "Deep reconnection with nature's cycles and living wisdom.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/79456c147_emojiscommoon--bloom-symbol_-crescent-moon-with-delicate-vines-and-leaves-growing-upward-from-its-base-gently-wrapping-around-the-curve-meaning_-deep-reconnection-with-natures-cycles-and-living-wisdom.png", card_id: "" },
    { label: "Moon Chakra", meaning: "Energy alignment and chakra activation.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fe23fac12_emojiscommoon-chakra-symbol_-crescent-moon-with-a-vertical-column-of-7-small-glowing-dots-the-chakras-aligned-perfectly-down-its-center-softly-radiating-outward.png", card_id: "" },
    { label: "Moon & Third Eye", meaning: "Intuition, spiritual vision, and inner sight.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/e7a4d3c6d_emojiscommoon--third-eye-symbol_-crescent-moon-with-a-single-glowing-eye-centered-in-the-curve-framed-by-a-subtle-lotus-like-mandala-of-leaves-and-roots.png", card_id: "" },
    { label: "Moon & Balance", meaning: "Harmony between opposites and inner equilibrium.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/8ec22eb41_emojiscommoon--balance-symbol_-two-symmetrical-crescents-facing-each-other-like-open-wings-with-a-single-vertical-line-of-energy-running-down-the-center-connecting-them.png", card_id: "" },
    { label: "Moon & Flame", meaning: "Passionate intuition and creative spiritual fire.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/02859be58_emojiscom1-moon--flame-symbol_-crescent-moon-with-a-small-flame-rising-from-its-curve-meaning_-passionate-intuition-or-creative-fire.png", card_id: "" },
    { label: "Moon & Feather", meaning: "Lightness, spiritual messages, and surrender.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a1041b66f_emojiscom2-moon--feather-symbol_-crescent-moon-with-a-single-feather-gently-resting-inside-its-curve-meaning_-lightness-messages-or-spiritual-surrender.png", card_id: "" },
    { label: "Moon & Spiral", meaning: "Inner journey, cycles, and unfolding wisdom.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6a3be91fd_emojiscom3-moon--spiral-symbol_-crescent-moon-with-a-tight-spiral-growing-from-its-base-like-a-shell-meaning_-inner-journey-cycles-and-unfolding-wisdom.png", card_id: "" },
    { label: "Moon & Lotus", meaning: "Spiritual awakening and rising above challenges.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d3c8c8191_emojiscom4-moon--lotus-symbol_-crescent-moon-with-a-lotus-flower-blooming-from-its-lower-curve-meaning_-spiritual-awakening-and-rising-above-challenges.png", card_id: "" },
    { label: "Moon & Hand", meaning: "Divine support, receiving, and surrender.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/7ac2566d5_emojiscom5-moon--hand-symbol_-crescent-moon-cradled-by-an-open-palm-from-below-meaning_-divine-support-receiving-or-surrender.png", card_id: "" },
    { label: "Moon & Butterfly", meaning: "Transformation and soul evolution.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/baa05bcd9_emojiscom6-moon--butterfly-symbol_-crescent-moon-with-butterfly-wings-emerging-from-its-sides-meaning_-transformation-and-soul-evolution.png", card_id: "" },
    { label: "Moon & Key", meaning: "Unlocking hidden knowledge or soul purpose.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/eab249185_emojiscom9-moon--key-symbol_-crescent-moon-with-an-ornate-key-hanging-from-its-inner-curve-meaning_-unlocking-hidden-knowledge-or-soul-purpose.png", card_id: "" },
    { label: "Moon & Antlers", meaning: "Wild instinct, protection, and natural power.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/546cc87f8_emojiscom7-moon--antlers-symbol_-crescent-moon-with-elegant-antlers-branching-upward-from-its-tips-meaning_-wild-instinct-protection-and-natural-power.png", card_id: "" },
    { label: "Moon & Drop", meaning: "Emotional release, cleansing, or divine tears.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d5b1347eb_emojiscom8-moon--drop-symbol_-crescent-moon-with-a-single-water-drop-falling-from-its-curve-meaning_-emotional-release-cleansing-or-divine-tears.png", card_id: "" }
  ],
  chakras: [
    { label: "Root", meaning: "Survival, grounding, security", type: "symbol", icon: "🔴", card_id: "" },
    { label: "Sacral", meaning: "Emotions, creativity, sexuality", type: "symbol", icon: "🟠", card_id: "" },
    { label: "Solar Plexus", meaning: "Willpower, confidence, identity", type: "symbol", icon: "🟡", card_id: "" },
    { label: "Heart", meaning: "Love, compassion, connection", type: "symbol", icon: "🟢", card_id: "" },
    { label: "Throat", meaning: "Communication, truth, expression", type: "symbol", icon: "🔵", card_id: "" },
    { label: "Third Eye", meaning: "Intuition, imagination, wisdom", type: "symbol", icon: "🟣", card_id: "" },
    { label: "Crown", meaning: "Spirituality, connection to divine", type: "symbol", icon: "⚪", card_id: "" }
  ],
  seven_sisters: [
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/88ee8ec8d_32DB718D-EFA1-4827-8AEC-6AB91A8BF329.png", label: "Maia's Root", meaning: "Quiet care grounds wild growth. Nurture the seed; steady support arrives. Keywords: nurture, foundation, patience, care.", type: "symbol", card_id: "" },
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/3bd854cd9_6381CF9C-029F-4D2C-84BA-81168C947FE3.png", label: "Electra's Spark", meaning: "Sudden brilliance demands action. Flash of insight — move fast and true. Keywords: brilliance, leadership, speed, clarity.", type: "symbol", card_id: "" },
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a28758f63_8501F496-2B70-4F65-B2BA-FAFEA987F484.png", label: "Alcyone's Calm", meaning: "Tranquility after the storm. Rest in the eye of change; peace restores. Keywords: peace, reflection, restoration, balance.", type: "symbol", card_id: "" },
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d7e717c9b_3F39BC02-39E5-47A7-AC4D-3DD487C9C369.png", label: "Taygete's Chase", meaning: "Pursuit with grace and speed. Chase the goal lightly; momentum is yours. Keywords: pursuit, freedom, momentum, grace.", type: "symbol", card_id: "" },
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/20d73f158_1387F872-F65F-4474-B013-E85675780EFE.png", label: "Celaeno's Veil", meaning: "What is hidden holds power. Embrace the unknown; mystery teaches. Keywords: shadow, mystery, hidden truth, depth.", type: "symbol", card_id: "" },
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/cb94d92f2_FB6DDABB-8BD8-4659-9B0B-E96D754A7AF0.png", label: "Sterope's Flame", meaning: "Inspiration strikes like starfire. Creative lightning — capture it now. Keywords: inspiration, creativity, fire, suddenness.", type: "symbol", card_id: "" },
    { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/91325776e_C924B138-EE3C-4992-A912-B0D1598F9C16.png", label: "Merope's Echo", meaning: "The missing voice still whispers wisdom. Listen for the subtle return; integration awaits. Keywords: return, integration, quiet wisdom, wholeness.", type: "symbol", card_id: "" }
  ],
  animal_spirits: [
    { label: "Bear", meaning: "strength, courage, healing", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4b5e817e8_5E5C0F6F-C063-42EF-A81D-13620A8794F8.png", card_id: "" },
    { label: "Wolf", meaning: "loyalty, community, wisdom", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/f9166d16a_4872CE13-DAF7-4DB3-B49C-550EF9313D11.png", card_id: "" },
    { label: "Eagle", meaning: "vision, spiritual messenger, freedom", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/1313d2e5a_EEB98506-2E8A-4DC4-9718-014B240314E3.png", card_id: "" },
    { label: "Buffalo", meaning: "abundance, gratitude, sacred life", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dcf97cc36_C736DB82-E6FB-4D19-89B5-A2EFB8678D87.png", card_id: "" },
    { label: "Owl", meaning: "wisdom, intuition, seeing the unseen", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6b8c8d2fa_B47D7EAA-5DB6-4144-B5D9-04F527CAD0BE.png", card_id: "" },
    { label: "Deer", meaning: "gentleness, grace, renewal", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/5986da740_5D416A3A-09D1-4E52-AA69-2C761DFBD8ED.png", card_id: "" }
  ],
  rooted_crescent: [
    { label: "The Heart Full Foundress", meaning: "Nurture with love and strength for growth.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dd1c9186e_D0009B98-FAD8-4CC4-BADF-A7DC8D7178F3.png", card_id: "" },
    { label: "Guardian of In-Essence", meaning: "Protect your inner joy and essence.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6ae050f51_C3C1871F-D9A3-42AB-AAE1-915196101169.png", card_id: "" },
    { label: "The Sureline of Purpose", meaning: "Stand firm in purpose through introspection.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/03b87e7d6_526B0A26-D804-4C5C-B5A7-4C76D815ABD9.png", card_id: "" },
    { label: "Nis Puk's Whisper", meaning: "Playful wisdom guides subtly.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b386bf4cf_AC082A3F-8854-4DD6-BB68-AA607E096D32.png", card_id: "" },
    { label: "The Patient Feminine", meaning: "Patience and grounded strength lead to growth.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/ecbdd2d58_25846904-F95B-423D-8E9D-8AE04265078D.png", card_id: "" },
    { label: "With Chains Unbound", meaning: "Break free from patterns for new paths.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/2cac99471_EFF38B3A-F3E0-4611-93E1-E949278C22CE.png", card_id: "" },
    { label: "Nature's Whisper", meaning: "Nature’s cycles guide wisdom and vitality.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b6d9980ac_B3AA33A1-5B09-4A8A-BDB1-8630A70EE9C1.png", card_id: "" },
    { label: "Back Road Whispers", meaning: "Winding paths lead to wisdom through exploration.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/93218ad8d_113EAF8F-46EF-4D0E-8BEE-505B08576E0F.png", card_id: "" },
    { label: "The Silent Observer", meaning: "Silence fosters empathy and profound insight.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/3026c22ab_68C4E2BF-296B-4B69-8615-CBBD7C6844EF.png", card_id: "" },
    { label: "Between the Folds", meaning: "Patience reveals hidden truths and clarity.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b93bbf618_90F1D3A2-D937-44BF-9426-81E27BCABC0E.png", card_id: "" },
    { label: "The Veil of Solitude", meaning: "Solitude heals and transforms pain into wisdom.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9a2c3041a_517E399C-CFE9-4CA2-995C-0120577D832F.png", card_id: "" },
    { label: "Shielding Embrace", meaning: "Quiet support offers comfort without control.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4b6a25115_D9ED5B33-9A8D-4DBD-9BC1-F03192A926E7.png", card_id: "" },
    { label: "Starweaver's Embrace", meaning: "Weave cosmic inspiration for bold creation.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9e3f35a3d_4EB17400-0559-455E-82FD-12CA2506A064.png", card_id: "" },
    { label: "Visionary Journey", meaning: "Expand consciousness through exploration.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/84bde06e9_51F591DC-D3DC-46AE-901F-1ABAC2403BCE.png", card_id: "" },
    { label: "Illuminating Insight", meaning: "Brilliance lights new creative paths.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fdb5c86d9_E31A717F-B1E1-4E5C-B8B8-DCC7DB2D2446.png", card_id: "" },
    { label: "Luna Duala", meaning: "Harmonize opposites for wholeness.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/430d31339_C44263A7-6EAE-4B06-AB5D-EB2CE8659FF6.png", card_id: "" },
    { label: "The Comfort Paradox", meaning: "Balance comfort with growth for progress.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/930b0feff_FA18F9BC-744E-4F98-AFAD-ADEE8E7A61A5.png", card_id: "" },
    { label: "The 4 Shadows", meaning: "Embrace shadows for freedom and unity.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dbd163c30_D363198E-FDA1-49A5-B08E-D6A2D9B82154.png", card_id: "" },
    { label: "The Eye of Siren", meaning: "Discern truth from illusion in relationships.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/ea785e3d2_BD239DA6-25D1-460B-B94B-4520F5C52666.png", card_id: "" },
    { label: "The Cosmic Vision", meaning: "Universal truths bring inner peace.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/845800934_1CA6FFD4-4716-4B16-BB67-36CE11EA693E.png", card_id: "" },
    { label: "The Weaver of Truth", meaning: "Gently embrace truth for acceptance.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/bbe0697ed_42EB2C65-EB3C-4A26-AF9E-9A61989B15F5.png", card_id: "" },
    { label: "The Deflected", meaning: "Reflect on defenses to embrace vulnerability.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/87bf9d095_2667D196-CC36-49E6-A835-2F85CDAF1C41.png", card_id: "" },
    { label: "The Day Moon's Grip", meaning: "Forgiveness releases burdens for harmony.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/25265f79f_2D46BB0A-F77D-44EE-AC5F-F96B6DB1CFC7.png", card_id: "" },
    { label: "Echoes of the Mind", meaning: "Inner guidance offers protection and clarity.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9a16ff4e1_859A3C8B-4429-43DC-86B2-1A8215D74896.png", card_id: "" },
    { label: "The Odd Pair", meaning: "Unlikely combinations yield surprising strength.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fbf8ea91c_4DF18733-AAC2-4B4B-A5BA-C7AEFDCEC351.png", card_id: "" },
    { label: "The Crescent Moon", meaning: "Embrace cycles of waxing and waning energy.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/294ef2a7f_0CF743F8-ABE4-49E1-BAA7-2D0B338AA6F5.png", card_id: "" },
    { label: "The Rooted Tree", meaning: "Grounded wisdom balances intuition and strength for growth.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/98d6e01fe_CF261451-DD7E-489F-8555-E9B4939AB3DE.png", card_id: "" },
    { label: "The Final Knot", meaning: "Endings bring closure and tie loose threads.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d4f81c51e_BB5344F2-EFA8-4D7D-8AE7-223941AB4C2D.png", card_id: "" },
    { label: "Harmonic Gates of Ascension", meaning: "Align with cosmic flow for transformation.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/808f3c369_578DAEF5-9BDB-4FD9-94D0-97CB375ED4BA.png", card_id: "" },
    { label: "The Mountain's Keeper", meaning: "Ascend with clear vision and strength.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b2892f92b_FBDC2305-0785-4E25-B56A-EB9D21BA1992.png", card_id: "" },
    { label: "The Humble Huntress", meaning: "Pursue goals with quiet determination.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/443fde6d6_535C7F51-0EC2-4FD3-B4BE-D5799FCB22D8.png", card_id: "" },
    { label: "The Jealous-Eye", meaning: "Acknowledge jealousy to build trust.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/ee7afd66f_4D905075-D42B-4CD7-AC4B-71182AD483E4.png", card_id: "" },
    { label: "Fringe Fusions", meaning: "Blend unconventional ideas for growth.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b7d4dfba5_15E45489-7BEE-4672-9087-CD959C7AA4B7.png", card_id: "" },
    { label: "Cascading Illumination", meaning: "Insights flow to light new paths.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/185e1a513_8D14CA8A-889C-4DB1-9405-75F58D1B550D.png", card_id: "" },
    { label: "In-Tan-Demoiselles", meaning: "Shared joy uplifts through collaboration.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/53140d0de_34CB40C1-B28B-4268-BB3D-50978A90739E.png", card_id: "" },
    { label: "Blabbergaster", meaning: "Embrace chaos for bold expression.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/058405bc6_3DE75CCC-79C5-460D-A2BA-04AAC7469F4F.png", card_id: "" },
    { label: "Veins of the Void", meaning: "Emerge from shadows to claim your true self.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/68bf6d4f1_38C1B733-28C7-40A9-A08A-4FD222D93B80.png", card_id: "" },
    { label: "The Triad of Synergy", meaning: "Harmonize mind, body, spirit for strength.", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/8b6efe774_E5C12A90-492E-46DD-9F15-4CA7EEE00010.png", card_id: "" }
  ]
};

const PRESET_SYMBOLS = [
  ...THEME_PACKS.yes_no,
  ...THEME_PACKS.elements,
  ...THEME_PACKS.timing,
  ...THEME_PACKS.directions,
  ...THEME_PACKS.zodiac,
  ...THEME_PACKS.planets,
  ...THEME_PACKS.chakras,
  ...THEME_PACKS.seven_sisters,
  ...THEME_PACKS.spiritual_emoticons,
  ...THEME_PACKS.moon_emblems,
  ...THEME_PACKS.animal_spirits,
  ...THEME_PACKS.rooted_crescent
];

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

function RingEditor({ ringKey, segments, setSegments, deckCards, onOpenGallery }) {
  const meta = RING_LABELS[ringKey];
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [themePackSelectKey, setThemePackSelectKey] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState("");

  const addSegment = () => setSegments([...segments, { ...DEFAULT_SEGMENT }]);

  const handleHarvestSymbols = async () => {
    if (segments.length === 0) return;
    setIsHarvesting(true);
    try {
      const items = segments.map(s => ({ label: s.label, meaning: s.meaning }));
      const res = await base44.functions.invoke("harvestSymbols", { items });
      if (res.data && res.data.emojis) {
        const updated = segments.map((seg, i) => ({
          ...seg,
          icon: seg.icon || res.data.emojis[i] || "✨"
        }));
        setSegments(updated);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to harvest symbols.");
    } finally {
      setIsHarvesting(false);
    }
  };

  const addAllCards = () => {
    if (!deckCards || deckCards.length === 0) return;
    const newSegments = deckCards.map(card => ({
      label: card.name || "",
      meaning: card.overall_meaning || card.upright_meaning || (card.keywords ? card.keywords.join(", ") : "") || card.name || "",
      type: "card",
      icon: card.spirit_wheel_icon_url || "",
      card_id: card.id
    }));
    setSegments([...segments, ...newSegments]);
  };

  const removeSegment = (i) => setSegments(segments.filter((_, idx) => idx !== i));

  const updateSegment = (i, field, value) => {
    const updated = [...segments];
    updated[i] = { ...updated[i], [field]: value };
    // If selecting a card, auto-fill label and meaning
    if (field === "card_id" && value) {
      const card = deckCards.find(c => c.id === value);
      if (card) {
        updated[i].label = card.name;
        updated[i].meaning = card.overall_meaning || card.upright_meaning || card.keywords?.join(", ") || card.name;
        updated[i].icon = card.spirit_wheel_icon_url || "";
        updated[i].type = "card";
      }
    }
    setSegments(updated);
  };

  const applyPreset = (i, preset) => {
    const updated = [...segments];
    updated[i] = { ...updated[i], icon: preset.icon, label: preset.label, meaning: preset.meaning, type: "symbol" };
    setSegments(updated);
  };

  const colorMap = {
    amber: "border-amber-500/40 bg-amber-950/20",
    orange: "border-orange-500/40 bg-orange-950/20",
    yellow: "border-yellow-500/40 bg-yellow-950/20",
  };

  const filteredSegments = segments.map((seg, i) => ({ ...seg, originalIndex: i })).filter((seg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (seg.label || "").toLowerCase().includes(q) ||
      (seg.meaning || "").toLowerCase().includes(q) ||
      (seg.icon || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${colorMap[meta.color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-amber-300">{meta.label}</h3>
          <p className="text-xs text-amber-200/60">{meta.hint} — {segments.length} segments</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {segments.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleHarvestSymbols} disabled={isHarvesting} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200 h-8">
              {isHarvesting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Harvest Symbols
            </Button>
          )}
          {deckCards && deckCards.length > 0 && (
            <Button size="sm" variant="outline" onClick={addAllCards} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200 h-8">
              <Sparkles className="w-4 h-4 mr-1" /> Add All Cards
            </Button>
          )}
          <Select key={themePackSelectKey} onValueChange={(v) => {
            if(v && THEME_PACKS[v]) {
              setSegments([...segments, ...THEME_PACKS[v]]);
              setTimeout(() => setThemePackSelectKey(Date.now()), 10);
            }
          }}>
            <SelectTrigger className="w-40 bg-amber-900/40 hover:bg-amber-800/60 border-amber-600/40 text-amber-100 h-8 text-xs focus:ring-0">
              <SelectValue placeholder="Add Theme Pack..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="yes_no">Yes / No / Maybe</SelectItem>
              <SelectItem value="elements">Elements</SelectItem>
              <SelectItem value="timing">Timing</SelectItem>
              <SelectItem value="directions">Directions</SelectItem>
              <SelectItem value="zodiac">Zodiac Signs</SelectItem>
              <SelectItem value="planets">Planets</SelectItem>
              <SelectItem value="chakras">Chakras</SelectItem>
              <SelectItem value="seven_sisters">7 Sisters</SelectItem>
              <SelectItem value="spiritual_emoticons">Spiritual Emoticons</SelectItem>
              <SelectItem value="moon_emblems">Moon Emblems</SelectItem>
              <SelectItem value="animal_spirits">Animal Spirits</SelectItem>
              <SelectItem value="rooted_crescent">Rooted Crescent</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={addSegment} className="bg-amber-700 hover:bg-amber-600 text-white h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Custom
          </Button>
          {segments.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => {
              if (window.confirm("Are you sure you want to clear all segments in this ring?")) {
                setSegments([]);
              }
            }} className="bg-slate-900 border-red-600/40 text-red-400 hover:bg-red-900/40 hover:text-red-200 h-8">
              <Trash2 className="w-4 h-4 mr-1" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {segments.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-200/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${segments.length} segments by name, symbol or meaning...`}
            className="pl-9 bg-black/40 border-amber-500/20 text-sm text-amber-100 focus:border-amber-500/50"
          />
        </div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {segments.length === 0 && (
          <div className="text-center text-amber-200/40 py-8 italic">No segments yet. Add one or import JSON.</div>
        )}
        {filteredSegments.length === 0 && segments.length > 0 && (
          <div className="text-center text-amber-200/40 py-8 italic">No segments match your search.</div>
        )}
        {filteredSegments.map((seg) => {
          const i = seg.originalIndex;
          return (
          <motion.div
            key={seg.originalIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-lg p-3 space-y-2 border border-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs w-5 shrink-0">#{i + 1}</span>
              <div className="flex flex-col gap-1 shrink-0 w-28">
                <div className="flex gap-1 items-center w-full">
                  <div className="relative flex-1 shrink-0">
                    <Input
                      value={seg.icon}
                      onChange={e => updateSegment(i, "icon", e.target.value)}
                      placeholder="Icon"
                      title={typeof seg.icon === 'string' ? seg.icon : ""}
                      className={`w-full bg-black/40 border-white/10 peer transition-all h-8 ${isImageSymbol(seg.icon) ? 'text-transparent text-center focus:text-white focus:text-[10px] focus:text-left px-1' : 'text-center text-lg'}`}
                    />
                    {isImageSymbol(seg.icon) && (
                      <img 
                        src={getImageUrl(seg.icon)} 
                        alt="icon" 
                        onError={(e) => { e.target.style.opacity = '0'; }}
                        onLoad={(e) => { e.target.style.opacity = '1'; }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 object-contain pointer-events-none mix-blend-screen peer-focus:opacity-0 transition-opacity" 
                      />
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => onOpenGallery && onOpenGallery(i, 'icon')} className="w-7 h-8 text-amber-400 hover:text-amber-300 hover:bg-white/10 shrink-0" title="Icon Gallery">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-1 items-center w-full">
                   <Input value={seg.bgImage || ""} onChange={e => updateSegment(i, "bgImage", e.target.value)} placeholder="Bg Texture URL" className="flex-1 text-[10px] h-6 px-1 bg-black/40 border-white/10" />
                   <Button size="icon" variant="ghost" onClick={() => onOpenGallery && onOpenGallery(i, 'bgImage')} className="w-7 h-6 text-amber-400 hover:text-amber-300 hover:bg-white/10 shrink-0" title="Section Background Gallery">
                     <ImageIcon className="w-3 h-3" />
                   </Button>
                </div>
              </div>
              <Input
                value={seg.label}
                onChange={e => updateSegment(i, "label", e.target.value)}
                placeholder="Label (shown on wheel)"
                className="flex-1 bg-black/40 border-white/10"
              />
              <Select value={seg.type} onValueChange={v => updateSegment(i, "type", v)}>
                <SelectTrigger className="w-28 bg-black/40 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="symbol">Symbol</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" onClick={() => removeSegment(i)} className="text-red-400 hover:text-red-300 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {seg.type === "card" && deckCards.length > 0 && (
              <Select value={seg.card_id || ""} onValueChange={v => updateSegment(i, "card_id", v)}>
                <SelectTrigger className="bg-black/40 border-white/10 text-xs">
                  <SelectValue placeholder="Select a card..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-48">
                  {deckCards.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {seg.type === "symbol" && (
              <div className="flex flex-wrap gap-1">
                {PRESET_SYMBOLS.map(p => (
                  <button
                    key={p.icon}
                    onClick={() => applyPreset(i, p)}
                    title={p.meaning}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {isImageSymbol(p.icon) ? (
                      <img src={getImageUrl(p.icon)} className="w-8 h-8 object-contain mix-blend-screen filter drop-shadow-md bg-transparent" alt={p.label} />
                    ) : (
                      p.icon
                    )}
                  </button>
                ))}
              </div>
            )}

            <Input
              value={seg.meaning}
              onChange={e => updateSegment(i, "meaning", e.target.value)}
              placeholder="Full meaning (revealed after spin)"
              className="bg-black/40 border-white/10 text-sm"
            />
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function SpiritWheelDesigner() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const editId = urlParams.get("id");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deckId, setDeckId] = useState("none");
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
  const [isPublic, setIsPublic] = useState(false);
  const [publishStatus, setPublishStatus] = useState("published");
  const [outerRing, setOuterRing] = useState([]);
  const [middleRing, setMiddleRing] = useState([]);
  const [innerRing, setInnerRing] = useState([]);
  const [decks, setDecks] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jsonImportText, setJsonImportText] = useState("");
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [libraryTargetField, setLibraryTargetField] = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const user = await base44.auth.me().catch(() => null);
        let allDecks = await base44.entities.Deck.list("-updated_date", 200);
        if (user?.email) {
          allDecks = allDecks.filter(d => d.created_by?.toLowerCase() === user.email.toLowerCase() || d.is_public);
        }
        setDecks(allDecks || []);

        if (editId) {
          const config = await base44.entities.SpiritWheelConfiguration.get(editId);
          if (config) {
            setName(config.name || "");
            setDescription(config.description || "");
            setDeckId(config.deck_id || "none");
            setThemeId(config.theme_id || "wood");
            if (config.custom_theme) setCustomTheme(config.custom_theme);
            setIsPublic(config.is_public || false);
            setPublishStatus(config.publish_status || "published");
            setOuterRing(config.outer_ring || []);
            setMiddleRing(config.middle_ring || []);
            setInnerRing(config.inner_ring || []);
            if (config.deck_id) {
              const cards = await base44.entities.Card.filter({ deck_id: config.deck_id });
              setDeckCards(cards || []);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [editId]);

  useEffect(() => {
    if (!deckId || deckId === "none") { setDeckCards([]); return; }
    base44.entities.Card.filter({ deck_id: deckId }).then(cards => setDeckCards(cards || []));
  }, [deckId]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this wheel configuration?")) {
      setIsSaving(true);
      try {
        await base44.entities.SpiritWheelConfiguration.delete(editId);
        alert("Deleted successfully!");
        navigate(createPageUrl("SpiritWheel"));
      } catch (e) {
        console.error(e);
        alert("Failed to delete.");
        setIsSaving(false);
      }
    }
  };

  const handleSave = async (statusToSave = publishStatus) => {
    if (!name.trim()) { alert("Please give this wheel a name."); return; }
    setIsSaving(true);

    const cleanSegments = (ring) => ring.map(s => ({
      ...s,
      label: s.label || "Untitled",
      meaning: s.meaning || "No meaning provided"
    }));

    try {
      const data = {
        name,
        description,
        deck_id: deckId !== "none" ? deckId : null,
        theme_id: themeId,
        custom_theme: customTheme,
        is_public: isPublic,
        publish_status: statusToSave,
        outer_ring: cleanSegments(outerRing),
        middle_ring: cleanSegments(middleRing),
        inner_ring: cleanSegments(innerRing),
      };
      if (editId) {
        await base44.entities.SpiritWheelConfiguration.update(editId, data);
        setPublishStatus(statusToSave);
      } else {
        const created = await base44.entities.SpiritWheelConfiguration.create(data);
        navigate(`/SpiritWheelDesigner?id=${created.id}`);
      }
      alert(`Saved successfully as ${statusToSave}!`);
    } catch (e) {
      console.error(e);
      alert(`Failed to save: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const config = { name, description, deck_id: deckId !== "none" ? deckId : null, theme_id: themeId, custom_theme: customTheme, is_public: isPublic, outer_ring: outerRing, middle_ring: middleRing, inner_ring: innerRing };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "spirit-wheel"}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonImportText);
      if (parsed.name) setName(parsed.name);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.deck_id) setDeckId(parsed.deck_id);
      if (parsed.theme_id) setThemeId(parsed.theme_id);
      if (parsed.custom_theme) setCustomTheme(parsed.custom_theme);
      if (parsed.publish_status) setPublishStatus(parsed.publish_status);
      if (parsed.outer_ring) setOuterRing(parsed.outer_ring);
      if (parsed.middle_ring) setMiddleRing(parsed.middle_ring);
      if (parsed.inner_ring) setInnerRing(parsed.inner_ring);
      setShowJsonPanel(false);
      setJsonImportText("");
    } catch (e) {
      setJsonError("Invalid JSON: " + e.message);
    }
  };

  const handleCopyJson = () => {
    const config = { name, description, theme_id: themeId, custom_theme: customTheme, outer_ring: outerRing, middle_ring: middleRing, inner_ring: innerRing };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert("JSON copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("SpiritWheel")}>
            <Button variant="ghost" size="icon" className="text-amber-300 hover:text-amber-100">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-6 h-6" /> Spirit Wheel Designer
              </h1>
              {editId && (
                <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${publishStatus === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                  {publishStatus}
                </span>
              )}
            </div>
            <p className="text-sm text-amber-200/60">Build your custom oracle wheel — form-based with JSON import/export</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowJsonPanel(!showJsonPanel)} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200">
              <Upload className="w-4 h-4 mr-2" /> Import JSON
            </Button>
            <Button variant="outline" onClick={handleExportJson} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200">
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            <Button variant="outline" onClick={handleCopyJson} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200">
              <Copy className="w-4 h-4 mr-2" /> Copy JSON
            </Button>
            {editId && (
              <Button variant="outline" onClick={handleDelete} disabled={isSaving} className="bg-slate-900 border-red-600/40 text-red-400 hover:bg-red-900/40 hover:text-red-200">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={isSaving} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200">
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button onClick={() => handleSave("published")} disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 text-white">
              <Sparkles className="w-4 h-4 mr-2" /> Publish
            </Button>
          </div>
        </div>

        {/* JSON Import Panel */}
        {showJsonPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-amber-600/30 rounded-xl p-5 space-y-3"
          >
            <h3 className="font-semibold text-amber-300">Paste your JSON configuration below:</h3>
            <Textarea
              value={jsonImportText}
              onChange={e => setJsonImportText(e.target.value)}
              placeholder='{"name": "My Wheel", "outer_ring": [...], "middle_ring": [...], "inner_ring": [...]}'
              className="min-h-[180px] bg-black/50 border-white/10 font-mono text-sm"
            />
            {jsonError && <p className="text-red-400 text-sm">{jsonError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleImportJson} className="bg-emerald-600 hover:bg-emerald-500">Import</Button>
              <Button variant="ghost" onClick={() => setShowJsonPanel(false)} className="text-white/60">Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Basic Info */}
        <div className="bg-slate-900/70 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-lg">Wheel Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-200/80">Wheel Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Love Reading Wheel" className="bg-black/40 border-white/10 mt-1" />
            </div>
            <div>
              <Label className="text-amber-200/80">Source Deck (for card segments)</Label>
              <Select value={deckId} onValueChange={setDeckId}>
                <SelectTrigger className="bg-black/40 border-white/10 mt-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-64">
                  <SelectItem value="none">None</SelectItem>
                  {decks.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-amber-200/80">Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this wheel for?" className="bg-black/40 border-white/10 mt-1" />
            </div>
            <div>
              <Label className="text-amber-200/80">Default Visual Theme</Label>
              <Select value={themeId} onValueChange={setThemeId}>
                <SelectTrigger className="bg-black/40 border-white/10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="wood">Classic Wood</SelectItem>
                  <SelectItem value="galaxy">Cosmic Galaxy</SelectItem>
                  <SelectItem value="neon">Cyber Neon</SelectItem>
                  <SelectItem value="parchment">Ancient Parchment</SelectItem>
                  <SelectItem value="stone_led">Stone + LED</SelectItem>
                  <SelectItem value="custom">Custom Build...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {themeId === 'custom' && (
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 bg-black/30 p-4 rounded-lg border border-white/10">
                <div>
                  <Label className="text-amber-200/80 text-xs">Outer Ring</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={customTheme.outerBg} onChange={e => setCustomTheme({...customTheme, outerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Background" />
                    <input type="color" value={customTheme.outerGrad} onChange={e => setCustomTheme({...customTheme, outerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Gradient" />
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
                    <input type="color" value={customTheme.textOuter} onChange={e => setCustomTheme({...customTheme, textOuter: e.target.value, textMiddle: e.target.value, textInner: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Text Color" />
                    <input type="color" value={customTheme.pin} onChange={e => setCustomTheme({...customTheme, pin: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Pin Color" />
                  </div>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Borders</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={customTheme.outerBorder} onChange={e => setCustomTheme({...customTheme, outerBorder: e.target.value, middleBorder: e.target.value, innerBorder: e.target.value, hubBorder: e.target.value, divider: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer shrink-0" title="Border Color" />
                    <Input type="number" min="0" max="20" value={customTheme.borderThickness ?? 6} onChange={e => setCustomTheme({...customTheme, borderThickness: Number(e.target.value)})} className="w-16 bg-black/40 border-white/10 text-xs h-8" title="Thickness (px)" />
                    <Select value={customTheme.borderStyle || "solid"} onValueChange={v => setCustomTheme({...customTheme, borderStyle: v})}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-xs h-8 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Page Bg Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={customTheme.pageBg || "#0f172a"} onChange={e => setCustomTheme({...customTheme, pageBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Page Background Color" />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-amber-200/80 text-xs">Wheel Texture URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={customTheme.textureUrl} onChange={e => setCustomTheme({...customTheme, textureUrl: e.target.value})} placeholder="https://..." className="bg-black/40 border-white/10 text-xs h-8 flex-1" />
                    <Button type="button" variant="outline" className="border-amber-500/60 text-amber-300 hover:bg-amber-500/20 shrink-0 h-8 text-xs" onClick={() => setLibraryTargetField('textureUrl')}>
                      <ImageIcon className="w-3 h-3 mr-1" /> Gallery
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-amber-200/80 text-xs">Page Background Image URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={customTheme.pageBgImage || ""} onChange={e => setCustomTheme({...customTheme, pageBgImage: e.target.value})} placeholder="https://..." className="bg-black/40 border-white/10 text-xs h-8 flex-1" />
                    <Button type="button" variant="outline" className="border-amber-500/60 text-amber-300 hover:bg-amber-500/20 shrink-0 h-8 text-xs" onClick={() => setLibraryTargetField('pageBgImage')}>
                      <ImageIcon className="w-3 h-3 mr-1" /> Gallery
                    </Button>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-4 mt-2">
                  <Label className="text-amber-200/80 text-xs block mb-2">Advanced Optical Effects</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-xs text-amber-200/80 bg-black/40 px-3 py-2 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                      <input type="checkbox" checked={customTheme.flannelOverlay || false} onChange={e => setCustomTheme({...customTheme, flannelOverlay: e.target.checked})} className="accent-amber-500 w-4 h-4" />
                      Flannel Overlay (Tactile Fabric Diffusion)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-amber-200/80 bg-black/40 px-3 py-2 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                      <input type="checkbox" checked={customTheme.stroboscopic || false} onChange={e => setCustomTheme({...customTheme, stroboscopic: e.target.checked})} className="accent-amber-500 w-4 h-4" />
                      Stroboscopic Mode (Persistence of Vision Flicker)
                    </label>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="public-check" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-amber-500 w-4 h-4" />
              <Label htmlFor="public-check" className="text-amber-200/80 cursor-pointer">Make this wheel publicly available</Label>
            </div>
          </div>
        </div>

        {/* Ring Editors */}
        <RingEditor ringKey="outer_ring" segments={outerRing} setSegments={setOuterRing} deckCards={deckCards} onOpenGallery={(idx, field = 'icon') => setLibraryTargetField({ring: 'outer_ring', index: idx, field})} />
        <RingEditor ringKey="middle_ring" segments={middleRing} setSegments={setMiddleRing} deckCards={deckCards} onOpenGallery={(idx, field = 'icon') => setLibraryTargetField({ring: 'middle_ring', index: idx, field})} />
        <RingEditor ringKey="inner_ring" segments={innerRing} setSegments={setInnerRing} deckCards={deckCards} onOpenGallery={(idx, field = 'icon') => setLibraryTargetField({ring: 'inner_ring', index: idx, field})} />

        {/* Bottom save */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={isSaving} className="bg-slate-900 border-amber-600/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200 px-8 py-6 text-lg">
            <Save className="w-5 h-5 mr-2" /> Save Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-6 text-lg">
            <Sparkles className="w-5 h-5 mr-2" /> Publish Wheel
          </Button>
        </div>
      </div>

      <PhotoLibraryPicker
        isOpen={!!libraryTargetField}
        onClose={() => setLibraryTargetField(null)}
        deckId={deckId !== "none" ? deckId : null}
        onSelect={(url) => {
          if (!libraryTargetField) return;
          if (libraryTargetField === 'textureUrl') {
            setCustomTheme(prev => ({...prev, textureUrl: url}));
          } else if (libraryTargetField === 'pageBgImage') {
            setCustomTheme(prev => ({...prev, pageBgImage: url}));
          } else if (libraryTargetField.ring) {
            const fieldName = libraryTargetField.field || 'icon';
            if (libraryTargetField.ring === 'outer_ring') {
              const updated = [...outerRing];
              updated[libraryTargetField.index][fieldName] = url;
              setOuterRing(updated);
            } else if (libraryTargetField.ring === 'middle_ring') {
              const updated = [...middleRing];
              updated[libraryTargetField.index][fieldName] = url;
              setMiddleRing(updated);
            } else if (libraryTargetField.ring === 'inner_ring') {
              const updated = [...innerRing];
              updated[libraryTargetField.index][fieldName] = url;
              setInnerRing(updated);
            }
          }
          setLibraryTargetField(null);
        }}
      />
    </div>
  );
}