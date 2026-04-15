import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Plus, Trash2, Download, Upload, Save, Copy, Sparkles, Loader2, Search, Image as ImageIcon, Eye } from "lucide-react";
import PhotoLibraryPicker from "@/components/media/PhotoLibraryPicker";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { getThumbnailUrl } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const DEFAULT_SEGMENT = { label: "", meaning: "", type: "custom", icon: "", card_id: "" };

function WheelThemePreview({ activeTheme }) {
  if (!activeTheme) return null;
  return (
    <div className="relative w-full aspect-square max-w-[200px] mx-auto my-4 pointer-events-none">
      {/* Outer Ring */}
      <div 
        className={`absolute inset-0 rounded-full ${activeTheme.isTiles ? 'shadow-[0_0_20px_rgba(0,255,204,0.3)]' : 'overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.4),0_5px_15px_rgba(0,0,0,0.6)]'}`}
        style={activeTheme.isTiles ? { backgroundColor: 'transparent' } : {
          borderWidth: `${(activeTheme.borderThickness ?? 6) / 2}px`,
          borderStyle: activeTheme.borderStyle || 'solid',
          borderColor: activeTheme.outerBorder,
        }}
      >
        {!activeTheme.isTiles && (
          <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden">
            {activeTheme.layerOrder === 'color_top' ? (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.outerTextureUrl ?? activeTheme.textureUrl}")`, backgroundSize: 'cover' }} />
                <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.outerBg} 0%, ${activeTheme.outerGrad} 100%)`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.outerBg} 0%, ${activeTheme.outerGrad} 100%)` }} />
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.outerTextureUrl ?? activeTheme.textureUrl}")`, backgroundSize: 'cover', opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Middle Ring */}
      <div 
        className={`absolute inset-[18%] rounded-full ${activeTheme.isTiles ? '' : 'overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.4)]'}`}
        style={activeTheme.isTiles ? { backgroundColor: 'transparent' } : {
          borderWidth: `${Math.max(1, ((activeTheme.borderThickness ?? 6) / 2) - 0.5)}px`,
          borderStyle: activeTheme.borderStyle || 'solid',
          borderColor: activeTheme.middleBorder,
        }}
      >
        {!activeTheme.isTiles && (
          <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden">
            {activeTheme.layerOrder === 'color_top' ? (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.middleTextureUrl ?? activeTheme.textureUrl}")`, backgroundSize: 'cover' }} />
                <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.middleBg} 0%, ${activeTheme.middleGrad} 100%)`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.middleBg} 0%, ${activeTheme.middleGrad} 100%)` }} />
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.middleTextureUrl ?? activeTheme.textureUrl}")`, backgroundSize: 'cover', opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Inner Ring */}
      <div 
        className={`absolute inset-[34%] rounded-full ${activeTheme.isTiles ? '' : 'overflow-hidden shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]'}`}
        style={activeTheme.isTiles ? { backgroundColor: 'transparent' } : {
          borderWidth: `${Math.max(1, ((activeTheme.borderThickness ?? 6) / 2) - 1)}px`,
          borderStyle: activeTheme.borderStyle || 'solid',
          borderColor: activeTheme.innerBorder,
        }}
      >
        {!activeTheme.isTiles && (
          <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden">
            {activeTheme.layerOrder === 'color_top' ? (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.innerTextureUrl ?? activeTheme.textureUrl}")`, backgroundSize: 'cover' }} />
                <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.innerBg} 0%, ${activeTheme.innerGrad} 100%)`, opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0 w-full h-full" style={{ background: `radial-gradient(circle, ${activeTheme.innerBg} 0%, ${activeTheme.innerGrad} 100%)` }} />
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url("${activeTheme.innerTextureUrl ?? activeTheme.textureUrl}")`, backgroundSize: 'cover', opacity: activeTheme.topLayerOpacity ?? 1, mixBlendMode: activeTheme.blendMode || 'multiply' }} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Center Hub */}
      <div 
        className={`absolute inset-[48%] rounded-full ${activeTheme.isTiles ? 'border-[2px]' : 'border-[3px]'} shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10 overflow-hidden flex items-center justify-center`}
        style={{
          borderColor: activeTheme.hubBorder,
          backgroundColor: activeTheme.hubBg
        }}
      >
      </div>
    </div>
  );
}

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
    { label: "Fire", meaning: "Passion and transformation", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/387206563_7D2B93F5-A469-4B42-9102-60976B513E97.png", card_id: "" },
    { label: "Air", meaning: "Thought, communication, movement", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/709d48740_2509E9F7-4BFD-4911-8542-6ADB93FCA886.png", card_id: "" },
    { label: "Water", meaning: "Emotion, intuition, flow", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/350e3bb17_AFEA10A9-4EB5-45E5-AE7A-68C0740BADCD.png", card_id: "" },
    { label: "Earth", meaning: "Stability, grounding, manifestation", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/edbc4dbc0_1E2F12D2-66A9-4F96-8F3E-B4A5FE85D7AF.png", card_id: "" }
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
    { label: "Taurus", meaning: "Steadfast, grounded, reliable", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/0337a2177_8348C1EC-DB3A-43E3-BCEE-94789347937F.png", card_id: "" },
    { label: "Gemini", meaning: "Versatile, expressive, curious", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a59ea86e3_A813C435-E156-426F-B831-299BCBA5B2F0.png", card_id: "" },
    { label: "Cancer", meaning: "Intuitive, protective, nurturing", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/1ca494c66_9BC8C3A0-3F12-4EC2-9C0C-1D430BB31E15.png", card_id: "" },
    { label: "Leo", meaning: "Dramatic, generous, proud", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/1cc4962e7_48A0535A-5B09-4A38-A40B-ED14A809342D.png", card_id: "" },
    { label: "Virgo", meaning: "Practical, analytical, humble", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9ef3d7d97_91167A40-B333-4028-B1BC-ED94E0A85C77.png", card_id: "" },
    { label: "Libra", meaning: "Diplomatic, harmonious, fair", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d1f0aa2b7_4A6F5BDD-7AC2-44F9-942A-031CEDA28BCC.png", card_id: "" },
    { label: "Scorpio", meaning: "Intense, transformative, passionate", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/7466ac162_CE9EBE88-D374-477E-B9A4-DA106CF0C464.png", card_id: "" },
    { label: "Sagittarius", meaning: "Adventurous, optimistic, free", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6dc054442_B30A5651-7DB9-4891-B0E4-A5B7AFD54A20.png", card_id: "" },
    { label: "Capricorn", meaning: "Ambitious, disciplined, responsible", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/996b5e42c_BEEED24E-0B54-48AC-A282-10F3E7949C8E.png", card_id: "" },
    { label: "Aquarius", meaning: "Innovative, progressive, humanitarian", type: "symbol", icon: "♒", card_id: "" },
    { label: "Pisces", meaning: "Compassionate, artistic, empathetic", type: "symbol", icon: "♓", card_id: "" }
  ],
  planets: [
    { label: "Sun", meaning: "Ego, vitality, consciousness", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/213c137b3_831F02BA-CCDF-4A3D-9B23-ABA1E0409415.png", card_id: "" },
    { label: "Moon", meaning: "Emotions, instincts, habits", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/f17944a74_E388C6E8-CD80-4F9D-9270-E9DD93658270.png", card_id: "" },
    { label: "Mercury", meaning: "Communication, intellect, reason", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/e561b7e01_A47648F8-437A-4170-B451-BFC8558D2628.png", card_id: "" },
    { label: "Venus", meaning: "Love, beauty, harmony", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d74ef49c9_0739AAAD-FCAE-4254-98B6-0FE79C9463E3.png", card_id: "" },
    { label: "Mars", meaning: "Action, desire, aggression", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dca42f5c1_BE0B3104-0129-4E8A-AAA8-6467D8B494EB.png", card_id: "" },
    { label: "Jupiter", meaning: "Expansion, luck, philosophy", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a2ffa2e05_A959156B-4F42-4556-9DC9-A33D6FD2C43A.png", card_id: "" },
    { label: "Saturn", meaning: "Restriction, discipline, structure", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/12bfd8e92_71AAFBE2-CCC2-4D68-86C4-56B5A3D021EC.png", card_id: "" },
    { label: "Uranus", meaning: "Innovation, rebellion, unpredictability", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b7cac7685_B3C6EDCD-BD11-4F23-B44E-AE1CFF50806C.png", card_id: "" },
    { label: "Neptune", meaning: "Dreams, illusion, spirituality", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/0ace0e0a7_2040CCCD-762C-462B-A8F3-F229B8ED919A.png", card_id: "" },
    { label: "Pluto", meaning: "Transformation, power, rebirth", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/9e35aa2ef_77346AF3-16D9-4CC9-861B-043E96F54407.png", card_id: "" }
  ],
  spiritual_emoticons: [
    { label: "Grounded Moon", meaning: "Instant grounding and presence.", type: "symbol", icon: "🌙", card_id: "" },
    { label: "Inner Eye", meaning: "Trust intuition and inner sight.", type: "symbol", icon: "👁️", card_id: "" },
    { label: "Shadow Release", meaning: "Let go of what no longer serves.", type: "symbol", icon: "💨", card_id: "" },
    { label: "Heart Root", meaning: "Love anchored in self.", type: "symbol", icon: "💖", card_id: "" },
    { label: "Flow Crescent", meaning: "Move with natural cycles.", type: "symbol", icon: "🌊", card_id: "" },
    { label: "Spark Seed", meaning: "Creative or spiritual ignition.", type: "symbol", icon: "🌱", card_id: "" },
    { label: "Veil Lift", meaning: "Gentle revelation and clarity.", type: "symbol", icon: "✨", card_id: "" },
    { label: "Balance Wings", meaning: "Harmony between light and shadow.", type: "symbol", icon: "🦋", card_id: "" },
    { label: "Wisdom Echo", meaning: "Listen to inner or ancestral guidance.", type: "symbol", icon: "🦉", card_id: "" },
    { label: "Ascension Flame", meaning: "Spiritual growth and elevation.", type: "symbol", icon: "🔥", card_id: "" }
  ],
  moon_emblems: [
    { label: "Moon & Bloom", meaning: "Deep reconnection with nature's cycles and living wisdom.", type: "symbol", icon: "🌸", card_id: "" },
    { label: "Moon Chakra", meaning: "Energy alignment and chakra activation.", type: "symbol", icon: "⚛️", card_id: "" },
    { label: "Moon & Third Eye", meaning: "Intuition, spiritual vision, and inner sight.", type: "symbol", icon: "👁️", card_id: "" },
    { label: "Moon & Balance", meaning: "Harmony between opposites and inner equilibrium.", type: "symbol", icon: "⚖️", card_id: "" },
    { label: "Moon & Flame", meaning: "Passionate intuition and creative spiritual fire.", type: "symbol", icon: "🔥", card_id: "" },
    { label: "Moon & Feather", meaning: "Lightness, spiritual messages, and surrender.", type: "symbol", icon: "🪶", card_id: "" },
    { label: "Moon & Spiral", meaning: "Inner journey, cycles, and unfolding wisdom.", type: "symbol", icon: "🌀", card_id: "" },
    { label: "Moon & Lotus", meaning: "Spiritual awakening and rising above challenges.", type: "symbol", icon: "🪷", card_id: "" },
    { label: "Moon & Hand", meaning: "Divine support, receiving, and surrender.", type: "symbol", icon: "🤲", card_id: "" },
    { label: "Moon & Butterfly", meaning: "Transformation and soul evolution.", type: "symbol", icon: "🦋", card_id: "" },
    { label: "Moon & Key", meaning: "Unlocking hidden knowledge or soul purpose.", type: "symbol", icon: "🗝️", card_id: "" },
    { label: "Moon & Antlers", meaning: "Wild instinct, protection, and natural power.", type: "symbol", icon: "🦌", card_id: "" },
    { label: "Moon & Drop", meaning: "Emotional release, cleansing, or divine tears.", type: "symbol", icon: "💧", card_id: "" }
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
    { icon: "🌱", label: "Maia's Root", meaning: "Quiet care grounds wild growth. Nurture the seed; steady support arrives. Keywords: nurture, foundation, patience, care.", type: "symbol", card_id: "" },
    { icon: "⚡", label: "Electra's Spark", meaning: "Sudden brilliance demands action. Flash of insight — move fast and true. Keywords: brilliance, leadership, speed, clarity.", type: "symbol", card_id: "" },
    { icon: "🕊️", label: "Alcyone's Calm", meaning: "Tranquility after the storm. Rest in the eye of change; peace restores. Keywords: peace, reflection, restoration, balance.", type: "symbol", card_id: "" },
    { icon: "🏃‍♀️", label: "Taygete's Chase", meaning: "Pursuit with grace and speed. Chase the goal lightly; momentum is yours. Keywords: pursuit, freedom, momentum, grace.", type: "symbol", card_id: "" },
    { icon: "🌫️", label: "Celaeno's Veil", meaning: "What is hidden holds power. Embrace the unknown; mystery teaches. Keywords: shadow, mystery, hidden truth, depth.", type: "symbol", card_id: "" },
    { icon: "🔥", label: "Sterope's Flame", meaning: "Inspiration strikes like starfire. Creative lightning — capture it now. Keywords: inspiration, creativity, fire, suddenness.", type: "symbol", card_id: "" },
    { icon: "🗣️", label: "Merope's Echo", meaning: "The missing voice still whispers wisdom. Listen for the subtle return; integration awaits. Keywords: return, integration, quiet wisdom, wholeness.", type: "symbol", card_id: "" }
  ],
  animal_spirits: [
    { label: "Bear", meaning: "strength, courage, healing", type: "symbol", icon: "🐻", card_id: "" },
    { label: "Wolf", meaning: "loyalty, community, wisdom", type: "symbol", icon: "🐺", card_id: "" },
    { label: "Eagle", meaning: "vision, spiritual messenger, freedom", type: "symbol", icon: "🦅", card_id: "" },
    { label: "Buffalo", meaning: "abundance, gratitude, sacred life", type: "symbol", icon: "🦬", card_id: "" },
    { label: "Owl", meaning: "wisdom, intuition, seeing the unseen", type: "symbol", icon: "🦉", card_id: "" },
    { label: "Deer", meaning: "gentleness, grace, renewal", type: "symbol", icon: "🦌", card_id: "" }
  ],
  rooted_crescent: [
    { label: "The Heart Full Foundress", meaning: "Nurture with love and strength for growth.", type: "symbol", icon: "30", card_id: "" },
    { label: "Guardian of In-Essence", meaning: "Protect your inner joy and essence.", type: "symbol", icon: "31", card_id: "" },
    { label: "The Sureline of Purpose", meaning: "Stand firm in purpose through introspection.", type: "symbol", icon: "32", card_id: "" },
    { label: "Nis Puk's Whisper", meaning: "Playful wisdom guides subtly.", type: "symbol", icon: "33", card_id: "" },
    { label: "The Patient Feminine", meaning: "Patience and grounded strength lead to growth.", type: "symbol", icon: "34", card_id: "" },
    { label: "With Chains Unbound", meaning: "Break free from patterns for new paths.", type: "symbol", icon: "36", card_id: "" },
    { label: "Nature's Whisper", meaning: "Nature’s cycles guide wisdom and vitality.", type: "symbol", icon: "37", card_id: "" },
    { label: "Back Road Whispers", meaning: "Winding paths lead to wisdom through exploration.", type: "symbol", icon: "38", card_id: "" },
    { label: "The Silent Observer", meaning: "Silence fosters empathy and profound insight.", type: "symbol", icon: "9", card_id: "" },
    { label: "Between the Folds", meaning: "Patience reveals hidden truths and clarity.", type: "symbol", icon: "10", card_id: "" },
    { label: "The Veil of Solitude", meaning: "Solitude heals and transforms pain into wisdom.", type: "symbol", icon: "11", card_id: "" },
    { label: "Shielding Embrace", meaning: "Quiet support offers comfort without control.", type: "symbol", icon: "12", card_id: "" },
    { label: "Starweaver's Embrace", meaning: "Weave cosmic inspiration for bold creation.", type: "symbol", icon: "18", card_id: "" },
    { label: "Visionary Journey", meaning: "Expand consciousness through exploration.", type: "symbol", icon: "19", card_id: "" },
    { label: "Illuminating Insight", meaning: "Brilliance lights new creative paths.", type: "symbol", icon: "20", card_id: "" },
    { label: "Luna Duala", meaning: "Harmonize opposites for wholeness.", type: "symbol", icon: "21", card_id: "" },
    { label: "The Comfort Paradox", meaning: "Balance comfort with growth for progress.", type: "symbol", icon: "22", card_id: "" },
    { label: "The 4 Shadows", meaning: "Embrace shadows for freedom and unity.", type: "symbol", icon: "23", card_id: "" },
    { label: "The Eye of Siren", meaning: "Discern truth from illusion in relationships.", type: "symbol", icon: "24", card_id: "" },
    { label: "The Cosmic Vision", meaning: "Universal truths bring inner peace.", type: "symbol", icon: "25", card_id: "" },
    { label: "The Weaver of Truth", meaning: "Gently embrace truth for acceptance.", type: "symbol", icon: "26", card_id: "" },
    { label: "The Deflected", meaning: "Reflect on defenses to embrace vulnerability.", type: "symbol", icon: "27", card_id: "" },
    { label: "The Day Moon's Grip", meaning: "Forgiveness releases burdens for harmony.", type: "symbol", icon: "28", card_id: "" },
    { label: "Echoes of the Mind", meaning: "Inner guidance offers protection and clarity.", type: "symbol", icon: "29", card_id: "" },
    { label: "The Odd Pair", meaning: "Unlikely combinations yield surprising strength.", type: "symbol", icon: "51", card_id: "" },
    { label: "The Crescent Moon", meaning: "Embrace cycles of waxing and waning energy.", type: "symbol", icon: "52", card_id: "" },
    { label: "The Rooted Tree", meaning: "Grounded wisdom balances intuition and strength for growth.", type: "symbol", icon: "53", card_id: "" },
    { label: "The Final Knot", meaning: "Endings bring closure and tie loose threads.", type: "symbol", icon: "54", card_id: "" },
    { label: "Harmonic Gates of Ascension", meaning: "Align with cosmic flow for transformation.", type: "symbol", icon: "48", card_id: "" },
    { label: "The Mountain's Keeper", meaning: "Ascend with clear vision and strength.", type: "symbol", icon: "47", card_id: "" },
    { label: "The Humble Huntress", meaning: "Pursue goals with quiet determination.", type: "symbol", icon: "49", card_id: "" },
    { label: "The Jealous-Eye", meaning: "Acknowledge jealousy to build trust.", type: "symbol", icon: "50", card_id: "" },
    { label: "Fringe Fusions", meaning: "Blend unconventional ideas for growth.", type: "symbol", icon: "43", card_id: "" },
    { label: "Cascading Illumination", meaning: "Insights flow to light new paths.", type: "symbol", icon: "44", card_id: "" },
    { label: "In-Tan-Demoiselles", meaning: "Shared joy uplifts through collaboration.", type: "symbol", icon: "15", card_id: "" },
    { label: "Blabbergaster", meaning: "Embrace chaos for bold expression.", type: "symbol", icon: "46", card_id: "" },
    { label: "Veins of the Void", meaning: "Emerge from shadows to claim your true self.", type: "symbol", icon: "39", card_id: "" },
    { label: "The Triad of Synergy", meaning: "Harmonize mind, body, spirit for strength.", type: "symbol", icon: "40", card_id: "" }
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function RingEditor({ ringKey, segments, setSegments, deckCards, onOpenGallery }) {
  const meta = RING_LABELS[ringKey];
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [themePackSelectKey, setThemePackSelectKey] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const addSegment = () => setSegments([...segments, { ...DEFAULT_SEGMENT }]);

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const newSegments = [];
    lines.forEach(l => {
      if (!l.trim()) return;
      const parts = l.split(/[\t|]/).map(p => p.trim());
      const label = parts[0] || '';
      const meaning = parts[1] || '';
      const icon = parts[2] || '';
      const type = icon && isImageSymbol(icon) ? "custom" : "symbol";
      newSegments.push({ label, meaning, icon, type, card_id: "" });
    });
    if (newSegments.length > 0) {
      setSegments([...segments, ...newSegments]);
    }
    setShowBulkModal(false);
    setBulkText("");
  };

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
          <Button size="sm" onClick={() => setShowBulkModal(true)} className="bg-amber-800 hover:bg-amber-700 text-white h-8">
            Bulk Add
          </Button>
          <Button size="sm" onClick={addSegment} className="bg-amber-700 hover:bg-amber-600 text-white h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Custom
          </Button>

          <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
            <DialogContent className="max-w-xl bg-slate-900 border-amber-600/30 text-amber-100 max-h-[90dvh] overflow-y-auto p-4 md:p-6">
              <DialogHeader>
                <DialogTitle>Bulk Add Segments</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-amber-200/60">
                Paste your segments below. Each line is a segment. Separate Label, Meaning, and Icon with a Tab or Pipe (|).
              </p>
              <Textarea 
                value={bulkText} 
                onChange={e => setBulkText(e.target.value)} 
                placeholder="Label | Meaning | Icon URL or Emoji"
                className="h-64 bg-black/40 border-amber-500/20 text-sm focus:border-amber-500/50"
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowBulkModal(false)} className="text-amber-200/60 hover:text-amber-200">Cancel</Button>
                <Button onClick={handleBulkImport} className="bg-amber-600 hover:bg-amber-500 text-white">Import Segments</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                        src={getThumbnailUrl(getImageUrl(seg.icon), 100)} 
                        alt="icon" 
                        loading="lazy"
                        onError={(e) => { e.target.style.opacity = '0'; }}
                        onLoad={(e) => { e.target.style.opacity = '1'; }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 object-contain pointer-events-none peer-focus:opacity-0 transition-opacity rounded-full" 
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
                placeholder="Name / Label"
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
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-white/5 rounded bg-black/20">
                {PRESET_SYMBOLS.map(p => (
                  <button
                    key={p.icon}
                    onClick={() => applyPreset(i, p)}
                    title={`${p.label}: ${p.meaning}`}
                    className="flex flex-col items-center justify-start p-1 rounded hover:bg-white/10 transition-colors w-16 shrink-0"
                  >
                    {isImageSymbol(p.icon) ? (
                      <img src={getImageUrl(p.icon)} className="w-8 h-8 object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40 rounded-full border border-white/10" alt={p.label} />
                    ) : (
                      <span className="text-2xl h-8 flex items-center">{p.icon}</span>
                    )}
                    <span className="text-[10px] text-amber-200/70 text-center mt-1 w-full truncate leading-tight">{p.label}</span>
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

import { ROOTED_CARDS_DATA, WHEEL_MIDDLE, WHEEL_INNER, WHEEL_THEMES } from "./SpiritWheel";

export { RingEditor };


export default function SpiritWheelDesigner() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const editId = urlParams.get("id");
  const cloneId = urlParams.get("clone");

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
  const [editingMode, setEditingMode] = useState(true);

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
        } else if (cloneId === "default") {
          setName("Custom Rooted Crescent Wheel");
          setDescription("A personalized version of the Rooted Crescent Oracle Deck");
          setThemeId("wood");
          setOuterRing(ROOTED_CARDS_DATA.map(c => ({
            label: c.name,
            meaning: c.meaning,
            icon: c.id,
            type: "symbol"
          })));
          setMiddleRing(WHEEL_MIDDLE.map(c => ({
            label: c.id,
            meaning: c.meaning,
            icon: c.id,
            type: "symbol"
          })));
          setInnerRing(WHEEL_INNER.map(c => ({
            label: c.id,
            meaning: c.meaning,
            icon: c.id,
            type: "symbol"
          })));
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

  const handleSave = async (statusToSave = publishStatus, silent = false) => {
    if (!name.trim()) { 
      if (!silent) alert("Please give this wheel a name."); 
      return; 
    }
    
    if (!silent) setIsSaving(true);

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
        if (!silent) {
          navigate(`${createPageUrl("SpiritWheelDesigner")}?id=${created.id}`);
        } else {
          navigate(`${createPageUrl("SpiritWheelDesigner")}?id=${created.id}`, { replace: true });
        }
      }
      if (!silent) alert(`Saved successfully as ${statusToSave}!`);
    } catch (e) {
      console.error(e);
      if (!silent) alert(`Failed to save: ${e.message}`);
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!editingMode || !editId || isLoading) return;
    const timeoutId = setTimeout(() => {
      handleSave("draft", true);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [name, description, deckId, themeId, customTheme, isPublic, outerRing, middleRing, innerRing, editingMode]);

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
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-md mr-2 shadow-inner">
              <Label className="text-amber-200 text-sm font-semibold cursor-pointer" htmlFor="editing-mode-switch">Editing Mode</Label>
              <Switch id="editing-mode-switch" checked={editingMode} onCheckedChange={(v) => {
                if (!v && !editId) {
                  alert("Please save the wheel first to preview it.");
                  return;
                }
                setEditingMode(v);
              }} className="data-[state=checked]:bg-amber-500" />
            </div>

            {editingMode && (
              <>
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
              </>
            )}
          </div>
        </div>

        {!editingMode ? (
          <div className="bg-slate-900 border border-white/20 rounded-xl overflow-hidden shadow-2xl h-[85vh]">
            <iframe src={`${createPageUrl("SpiritWheel")}?id=${editId}`} className="w-full h-full border-0" />
          </div>
        ) : (
          <div className="space-y-6">

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

        {/* Basic Info & Theme Preview */}
        <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/70 border border-white/10 rounded-xl p-5 space-y-4">
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
                  <SelectItem value="metatron">Sacred Geometry</SelectItem>
                  <SelectItem value="custom">Custom Build...</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 bg-black/30 p-4 rounded-lg border border-[#5c3a21]">
                <div className="col-span-2 md:col-span-4 flex justify-between items-center mb-2 pb-2 border-b border-[#5c3a21]/50">
                  <span className="text-amber-300 font-semibold text-sm">Theme Colors & Textures</span>
                  <span className="text-xs text-amber-200/50 italic">Editing these will switch to Custom theme</span>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Outer Ring</Label>
                  <div className="flex gap-2 mt-1 mb-1">
                    <input type="color" value={customTheme.outerBg} onChange={e => setCustomTheme({...customTheme, outerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Background" />
                    <input type="color" value={customTheme.outerGrad} onChange={e => setCustomTheme({...customTheme, outerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" title="Gradient" />
                  </div>
                  <div className="flex gap-1 items-center mt-1">
                    <Input value={customTheme.outerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, outerTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1 flex-1" />
                    <Button type="button" variant="ghost" className="w-6 h-6 p-0 text-amber-400 hover:text-amber-300 hover:bg-white/10 shrink-0" onClick={() => setLibraryTargetField('outerTextureUrl')} title="Gallery">
                      <ImageIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Middle Ring</Label>
                  <div className="flex gap-2 mt-1 mb-1">
                    <input type="color" value={customTheme.middleBg} onChange={e => setCustomTheme({...customTheme, middleBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    <input type="color" value={customTheme.middleGrad} onChange={e => setCustomTheme({...customTheme, middleGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                  </div>
                  <div className="flex gap-1 items-center mt-1">
                    <Input value={customTheme.middleTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, middleTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1 flex-1" />
                    <Button type="button" variant="ghost" className="w-6 h-6 p-0 text-amber-400 hover:text-amber-300 hover:bg-white/10 shrink-0" onClick={() => setLibraryTargetField('middleTextureUrl')} title="Gallery">
                      <ImageIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Inner Ring</Label>
                  <div className="flex gap-2 mt-1 mb-1">
                    <input type="color" value={customTheme.innerBg} onChange={e => setCustomTheme({...customTheme, innerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    <input type="color" value={customTheme.innerGrad} onChange={e => setCustomTheme({...customTheme, innerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                  </div>
                  <div className="flex gap-1 items-center mt-1">
                    <Input value={customTheme.innerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, innerTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1 flex-1" />
                    <Button type="button" variant="ghost" className="w-6 h-6 p-0 text-amber-400 hover:text-amber-300 hover:bg-white/10 shrink-0" onClick={() => setLibraryTargetField('innerTextureUrl')} title="Gallery">
                      <ImageIcon className="w-3 h-3" />
                    </Button>
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
                <div className="col-span-2 hidden">
                  <Label className="text-amber-200/80 text-xs">Global Texture URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={customTheme.textureUrl} onChange={e => setCustomTheme({...customTheme, textureUrl: e.target.value})} placeholder="https://..." className="bg-black/40 border-white/10 text-xs h-8 flex-1" />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-amber-200/80 text-xs block mb-1">Layer & Blending Options</Label>
                  <div className="flex gap-2">
                    <Select value={customTheme.layerOrder || 'texture_top'} onValueChange={v => setCustomTheme({...customTheme, layerOrder: v})}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-xs h-8 flex-1" title="Layer Order">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="texture_top">Texture on Top</SelectItem>
                        <SelectItem value="color_top">Color on Top</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-md px-2 h-8">
                      <span className="text-xs text-amber-200/60 whitespace-nowrap">Top Opacity:</span>
                      <Input type="number" min="0" max="100" value={customTheme.topLayerOpacity !== undefined ? Math.round(customTheme.topLayerOpacity * 100) : 100} onChange={e => setCustomTheme({...customTheme, topLayerOpacity: Number(e.target.value)/100})} className="w-12 bg-transparent border-none text-xs h-6 p-0 text-center focus-visible:ring-0 outline-none" />
                      <span className="text-xs text-amber-200/60">%</span>
                    </div>
                    <Select value={customTheme.blendMode || 'multiply'} onValueChange={v => setCustomTheme({...customTheme, blendMode: v})}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-xs h-8 flex-1" title="Blend Mode">
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
                      <input type="checkbox" checked={customTheme.stroboscopic || false} onChange={e => setCustomTheme({...customTheme, stroboscopic: e.target.checked})} className="accent-amber-500 w-4 h-4" />
                      Stroboscopic Mode (Persistence of Vision Flicker)
                    </label>
                  </div>
                </div>
              </div>
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="public-check" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                <Label htmlFor="public-check" className="text-amber-200/80 cursor-pointer">Make this wheel publicly available</Label>
              </div>
              <div className="text-amber-200/60 text-xs italic">
                (Changes are saved automatically as a Draft while Editing Mode is on)
              </div>
            </div>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="bg-slate-900/70 border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center">
          <h2 className="font-semibold text-white text-lg mb-4 self-start w-full">Visual Preview</h2>
          <WheelThemePreview activeTheme={themeId === 'custom' ? customTheme : WHEEL_THEMES[themeId]} />
          <p className="text-xs text-amber-200/50 text-center mt-4 max-w-[200px]">
            Preview of colors, textures, and borders. Segments and icons are populated during the reading.
          </p>
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
      )}
      </div>

      <PhotoLibraryPicker
        isOpen={!!libraryTargetField}
        onClose={() => setLibraryTargetField(null)}
        deckId={deckId !== "none" ? deckId : null}
        onSelect={(url) => {
          if (!libraryTargetField) return;
          if (libraryTargetField === 'textureUrl') {
            setCustomTheme(prev => ({...prev, textureUrl: url}));
          } else if (libraryTargetField === 'outerTextureUrl') {
            setCustomTheme(prev => ({...prev, outerTextureUrl: url}));
          } else if (libraryTargetField === 'middleTextureUrl') {
            setCustomTheme(prev => ({...prev, middleTextureUrl: url}));
          } else if (libraryTargetField === 'innerTextureUrl') {
            setCustomTheme(prev => ({...prev, innerTextureUrl: url}));
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