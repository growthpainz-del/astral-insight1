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
import SpiritWheelThemeSelector from "@/components/reading/SpiritWheelThemeSelector";

const DEFAULT_SEGMENT = { label: "", meaning: "", type: "custom", icon: "", card_id: "" };



function WheelThemePreview({ activeTheme }) {
  if (!activeTheme) return null;
  return (
    <div className="relative w-full aspect-square max-w-[200px] mx-auto my-4 pointer-events-none rounded-full" style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.15)" }}>
      {/* Outer Ring 1 */}
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

      {/* Outer Ring 2 */}
      <div 
        className={`absolute inset-[11%] rounded-full ${activeTheme.isTiles ? 'shadow-[0_0_20px_rgba(0,255,204,0.3)]' : 'overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.4),0_5px_15px_rgba(0,0,0,0.6)]'}`}
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
        className={`absolute inset-[22%] rounded-full ${activeTheme.isTiles ? '' : 'overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.4)]'}`}
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
        className={`absolute inset-[35%] rounded-full ${activeTheme.isTiles ? '' : 'overflow-hidden shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]'}`}
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
    { label: "Earth", meaning: "Home, manifestation, stability", type: "symbol", icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6d17720e6_B65A5B34-095D-4CE1-A14C-4033955928C5.png", card_id: "" },
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
    { label: "The Heart Full Foundress", meaning: "Nurture with love and strength for growth.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/5319f3900_TheHeartFullFoundress.JPEG", card_id: "" },
    { label: "Guardian of In-Essence", meaning: "Protect your inner joy and essence.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/c2f7036a0_GuardianofIn_Essence.JPEG", card_id: "" },
    { label: "The Sureline of Purpose", meaning: "Stand firm in purpose through introspection.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/b54f9a3ea_TheSurelineofPurpose.jpg", card_id: "" },
    { label: "Nis Puk's Whisper", meaning: "Playful wisdom guides subtly.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/9b9fbb6cd_NisPuksWhisper.JPEG", card_id: "" },
    { label: "The Patient Feminine", meaning: "Patience and grounded strength lead to growth.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/8a2e2ba64_ThePatientFeminine.JPEG", card_id: "" },
    { label: "With Chains Unbound", meaning: "Break free from patterns for new paths.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/3a8d9a486_WithChainsUnbound.JPEG", card_id: "" },
    { label: "Nature's Whisper", meaning: "Nature’s cycles guide wisdom and vitality.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/a6e9a6e13_NaturesWhisper.JPEG", card_id: "" },
    { label: "Back Road Whispers", meaning: "Winding paths lead to wisdom through exploration.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/9b9f93976_BackRoadWhispers.JPEG", card_id: "" },
    { label: "The Silent Observer", meaning: "Silence fosters empathy and profound insight.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/267d3a013_TheSilentObserver.JPEG", card_id: "" },
    { label: "Between the Folds", meaning: "Patience reveals hidden truths and clarity.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/dddf28b9c_BetweentheFolds.jpg", card_id: "" },
    { label: "The Veil of Solitude", meaning: "Solitude heals and transforms pain into wisdom.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/231ad8895_TheVeilofSolitude.JPEG", card_id: "" },
    { label: "Shielding Embrace", meaning: "Quiet support offers comfort without control.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/726871ecb_ShieldingEmbrace.jpg", card_id: "" },
    { label: "Starweaver's Embrace", meaning: "Weave cosmic inspiration for bold creation.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/12ef7e0c4_StarweaversEmbrace.JPEG", card_id: "" },
    { label: "Visionary Journey", meaning: "Expand consciousness through exploration.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/b254924a4_VisionaryJourney.jpg", card_id: "" },
    { label: "Illuminating Insight", meaning: "Brilliance lights new creative paths.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/9b977ca3e_IlluminatingInsight.JPEG", card_id: "" },
    { label: "Luna Duala", meaning: "Harmonize opposites for wholeness.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/8470a7550_LunaDuala.JPEG", card_id: "" },
    { label: "The Comfort Paradox", meaning: "Balance comfort with growth for progress.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/46eb24e4c_TheComfortParadox.JPEG", card_id: "" },
    { label: "The 4 Shadows", meaning: "Embrace shadows for freedom and unity.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/be1633f89_The4Shadows.jpg", card_id: "" },
    { label: "The Eye of Siren", meaning: "Discern truth from illusion in relationships.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/e4b4455de_TheEyeofSiren.JPEG", card_id: "" },
    { label: "The Cosmic Vision", meaning: "Universal truths bring inner peace.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/2e60bd52d_TheCosmicVision.JPEG", card_id: "" },
    { label: "The Weaver of Truth", meaning: "Gently embrace truth for acceptance.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/64e83f3f2_TheWeaverofTruth.jpg", card_id: "" },
    { label: "The Deflected", meaning: "Reflect on defenses to embrace vulnerability.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/3c1d977bd_TheDeflected.jpg", card_id: "" },
    { label: "The Day Moon's Grip", meaning: "Forgiveness releases burdens for harmony.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/1785dfda0_TheDayMoonsGrip.jpg", card_id: "" },
    { label: "Echoes of the Mind", meaning: "Inner guidance offers protection and clarity.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/72688009c_EchoesoftheMind.JPEG", card_id: "" },
    { label: "The Odd Pair", meaning: "Unlikely combinations yield surprising strength.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/b545f4df2_TheOddPair.JPEG", card_id: "" },
    { label: "The Crescent Moon", meaning: "Embrace cycles of waxing and waning energy.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/1085ba443_TheCrescentMoon.JPEG", card_id: "" },
    { label: "The Rooted Tree", meaning: "Grounded wisdom balances intuition and strength for growth.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/dd1c9186e_D0009B98-FAD8-4CC4-BADF-A7DC8D7178F3.png", card_id: "" },
    { label: "The Final Knot", meaning: "Endings bring closure and tie loose threads.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/3a8d8e202_TheFinalKnot.jpg", card_id: "" },
    { label: "Harmonic Gates of Ascension", meaning: "Align with cosmic flow for transformation.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/1785f67b8_HarmonicGatesofAscension.JPEG", card_id: "" },
    { label: "The Mountain's Keeper", meaning: "Ascend with clear vision and strength.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/e4b44535e_TheMountainsKeeper.JPEG", card_id: "" },
    { label: "The Humble Huntress", meaning: "Pursue goals with quiet determination.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/be1620a23_TheHumbleHuntress.JPEG", card_id: "" },
    { label: "The Jealous-Eye", meaning: "Acknowledge jealousy to build trust.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/dddf35492_TheJealous_Eye.JPEG", card_id: "" },
    { label: "Fringe Fusions", meaning: "Blend unconventional ideas for growth.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/ceb1be5b8_FringeFusions.JPEG", card_id: "" },
    { label: "Cascading Illumination", meaning: "Insights flow to light new paths.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/0fc218413_CascadingIllumination.JPEG", card_id: "" },
    { label: "In-Tan-Demoiselles", meaning: "Shared joy uplifts through collaboration.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/2d887a024_In_Tan_Demoiselles.jpg", card_id: "" },
    { label: "Blabbergaster", meaning: "Embrace chaos for bold expression.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/d7daba7ec_Blabbergaster.JPEG", card_id: "" },
    { label: "Veins of the Void", meaning: "Emerge from shadows to claim your true self.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/a6e9a5da1_VeinsoftheVoid.JPEG", card_id: "" },
    { label: "The Triad of Synergy", meaning: "Harmonize mind, body, spirit for strength.", type: "symbol", icon: "https://base44.app/api/apps/68d2a300021f94d0f312c039/files/public/68d2a300021f94d0f312c039/7268ad86b_TheTriadofSynergy.JPEG", card_id: "" }
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
    <div className="p-[14px] mb-[12px] rounded-[14px] border border-[rgba(201,168,76,0.18)] mx-[18px] md:mx-0" style={{ background: "linear-gradient(135deg, rgba(61,32,8,0.5), rgba(15,11,30,0.8))" }}>
      <div className="flex items-start justify-between mb-[10px]">
        <div>
          <div className="text-[13px] tracking-[0.1em] text-[#c9a84c]" style={{ fontFamily: "'Cinzel', serif" }}>
            {meta.label}
          </div>
          <div className="text-[12px] text-[rgba(180,160,220,0.42)] mt-[3px] leading-[1.4]" style={{ fontFamily: "'Crimson Text', serif" }}>
            {meta.hint}<br/>— {segments.length} segments
          </div>
        </div>
        <div className="flex flex-col gap-[6px] items-end">
          <select 
            key={themePackSelectKey} 
            onChange={(e) => {
              const v = e.target.value;
              if(v && v !== "none" && THEME_PACKS[v]) {
                setSegments([...segments, ...THEME_PACKS[v]]);
                setTimeout(() => setThemePackSelectKey(Date.now()), 10);
              }
            }}
            className="text-[8px] tracking-[0.1em] uppercase px-[11px] py-[6px] rounded-[8px] border border-[rgba(201,168,76,0.2)] text-[rgba(201,168,76,0.7)] cursor-pointer whitespace-nowrap transition-all duration-200 outline-none appearance-none"
            style={{ 
              fontFamily: "'Cinzel', serif",
              background: "rgba(22,15,42,0.8)", // fallback to match var(--surface2)
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none'%3E%3Cpath d='M1 1l3 3L7 1' stroke='rgba(201,168,76,0.7)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              paddingRight: "22px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
              e.currentTarget.style.color = "#c9a84c";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
              e.currentTarget.style.color = "rgba(201,168,76,0.7)";
            }}
          >
            <option value="none" style={{ background: "#160f2a" }}>Add Theme Pack ▾</option>
            <option value="yes_no" style={{ background: "#160f2a" }}>Yes / No / Maybe</option>
            <option value="elements" style={{ background: "#160f2a" }}>Elements</option>
            <option value="timing" style={{ background: "#160f2a" }}>Timing</option>
            <option value="directions" style={{ background: "#160f2a" }}>Directions</option>
            <option value="zodiac" style={{ background: "#160f2a" }}>Zodiac Signs</option>
            <option value="planets" style={{ background: "#160f2a" }}>Planets</option>
            <option value="chakras" style={{ background: "#160f2a" }}>Chakras</option>
            <option value="seven_sisters" style={{ background: "#160f2a" }}>7 Sisters</option>
            <option value="spiritual_emoticons" style={{ background: "#160f2a" }}>Spiritual Emoticons</option>
            <option value="moon_emblems" style={{ background: "#160f2a" }}>Moon Emblems</option>
            <option value="animal_spirits" style={{ background: "#160f2a" }}>Animal Spirits</option>
            <option value="rooted_crescent" style={{ background: "#160f2a" }}>Rooted Crescent</option>
          </select>
          
          <div className="flex gap-[6px]">
             {deckCards && deckCards.length > 0 && (
              <button 
                onClick={addAllCards}
                className="text-[8px] tracking-[0.1em] uppercase px-[12px] py-[7px] rounded-[8px] border-[1px] border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] text-[#c9a84c] cursor-pointer transition-all duration-200"
                style={{ fontFamily: "'Cinzel', serif" }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(201,168,76,0.15)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
              >
                + Cards
              </button>
            )}
            <button 
              onClick={() => setShowBulkModal(true)}
              className="text-[8px] tracking-[0.1em] uppercase px-[12px] py-[7px] rounded-[8px] border-[1px] border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.15)] text-[#c9a84c] cursor-pointer transition-all duration-200"
              style={{ fontFamily: "'Cinzel', serif" }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(201,168,76,0.25)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(201,168,76,0.15)"}
            >
              Bulk Add
            </button>
            <button 
              onClick={addSegment}
              className="text-[8px] tracking-[0.1em] uppercase px-[12px] py-[7px] rounded-[8px] border-[1px] border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.1)] text-[#34d399] cursor-pointer transition-all duration-200"
              style={{ fontFamily: "'Cinzel', serif" }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(52,211,153,0.2)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(52,211,153,0.1)"}
            >
              + Add Custom
            </button>
          </div>
          
           {segments.length > 0 && (
             <div className="flex gap-[6px] mt-1">
              <button 
                onClick={handleHarvestSymbols} disabled={isHarvesting}
                className="text-[7.5px] tracking-[0.1em] uppercase px-[8px] py-[5px] rounded-[6px] border-[1px] border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] text-[#c9a84c] cursor-pointer transition-all duration-200"
                style={{ fontFamily: "'Cinzel', serif" }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(201,168,76,0.15)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
              >
                {isHarvesting ? 'Harvesting...' : 'Harvest Symbols'}
              </button>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all segments in this ring?")) {
                    setSegments([]);
                  }
                }}
                className="text-[7.5px] tracking-[0.1em] uppercase px-[8px] py-[5px] rounded-[6px] border-[1px] border-red-900/40 bg-red-900/20 text-red-400 cursor-pointer transition-all duration-200 hover:bg-red-900/40"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Clear
              </button>
             </div>
           )}

          <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
            <DialogContent className="max-w-xl bg-slate-900 border-amber-600/30 text-amber-100 max-h-[90dvh] overflow-y-auto p-4 md:p-6">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "'Cinzel', serif" }}>Bulk Add Segments</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-amber-200/60" style={{ fontFamily: "'Crimson Text', serif" }}>
                Paste your segments below. Each line is a segment. Separate Label, Meaning, and Icon with a Tab or Pipe (|).
              </p>
              <Textarea 
                value={bulkText} 
                onChange={e => setBulkText(e.target.value)} 
                placeholder="Label | Meaning | Icon URL or Emoji"
                className="h-64 bg-black/40 border-amber-500/20 text-sm focus:border-amber-500/50 font-mono"
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowBulkModal(false)} className="text-amber-200/60 hover:text-amber-200" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>Cancel</Button>
                <Button onClick={handleBulkImport} className="bg-[#c9a84c] hover:bg-[#a07030] text-[#1a0f05] font-bold" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>Import Segments</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="relative mb-[12px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${segments.length} segments by name, symbol or meaning...`}
            className="w-full pl-9 bg-black/40 border border-[#c9a84c]/20 rounded-[8px] text-[13px] text-[#c9a84c] py-[8px] px-[12px] outline-none focus:border-[#c9a84c]/50 transition-colors"
            style={{ fontFamily: "'Crimson Text', serif" }}
          />
        </div>
      )}

      <div className="space-y-[8px] max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {segments.length === 0 && (
          <div className="text-center py-[16px] text-[13px] text-[rgba(201,168,76,0.25)] italic" style={{ fontFamily: "'IM Fell English', serif" }}>
            No segments yet. Add one or import JSON.
          </div>
        )}
        {filteredSegments.length === 0 && segments.length > 0 && (
          <div className="text-center py-[16px] text-[13px] text-[rgba(201,168,76,0.25)] italic" style={{ fontFamily: "'IM Fell English', serif" }}>
            No segments match your search.
          </div>
        )}
        {filteredSegments.map((seg) => {
          const i = seg.originalIndex;
          return (
          <motion.div
            key={seg.originalIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-[8px] p-[10px] space-y-[8px] border border-white/5"
          >
            <div className="flex items-center gap-[8px]">
              <span className="text-white/40 text-[10px] w-[20px] shrink-0 font-mono">#{i + 1}</span>
              <div className="flex flex-col gap-[4px] shrink-0 w-[110px]">
                <div className="flex gap-[4px] items-center w-full">
                  <div className="relative flex-1 shrink-0">
                    <input
                      value={seg.icon}
                      onChange={e => updateSegment(i, "icon", e.target.value)}
                      placeholder="Icon"
                      title={typeof seg.icon === 'string' ? seg.icon : ""}
                      className={`w-full bg-black/40 border border-white/10 rounded-[6px] py-[4px] peer transition-all h-[28px] outline-none focus:border-[#c9a84c]/50 ${isImageSymbol(seg.icon) ? 'text-transparent text-center focus:text-white focus:text-[10px] focus:text-left px-[4px]' : 'text-center text-[16px]'}`}
                    />
                    {isImageSymbol(seg.icon) && (
                      <img 
                        src={getThumbnailUrl(getImageUrl(seg.icon), 100)} 
                        alt="icon" 
                        loading="lazy"
                        onError={(e) => { e.target.style.opacity = '0'; }}
                        onLoad={(e) => { e.target.style.opacity = '1'; }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] object-contain pointer-events-none peer-focus:opacity-0 transition-opacity rounded-full" 
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => onOpenGallery && onOpenGallery(i, 'icon')} className="w-[28px] h-[28px] rounded-[6px] bg-black/40 border border-white/10 text-[#c9a84c] hover:text-white hover:bg-white/10 shrink-0 flex items-center justify-center cursor-pointer transition-colors" title="Icon Gallery">
                    <ImageIcon className="w-[14px] h-[14px]" />
                  </button>
                </div>
                <div className="flex gap-[4px] items-center w-full">
                   <input 
                     value={seg.bgImage || ""} onChange={e => updateSegment(i, "bgImage", e.target.value)} 
                     placeholder="Bg Texture URL" 
                     className="flex-1 text-[9px] h-[22px] px-[6px] bg-black/40 border border-white/10 rounded-[6px] outline-none focus:border-[#c9a84c]/50" 
                   />
                   <button type="button" onClick={() => onOpenGallery && onOpenGallery(i, 'bgImage')} className="w-[22px] h-[22px] rounded-[6px] bg-black/40 border border-white/10 text-[#c9a84c] hover:text-white hover:bg-white/10 shrink-0 flex items-center justify-center cursor-pointer transition-colors" title="Section Background Gallery">
                     <ImageIcon className="w-[10px] h-[10px]" />
                   </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-[4px] flex-1">
                <input
                  value={seg.label}
                  onChange={e => updateSegment(i, "label", e.target.value)}
                  placeholder="Name / Label"
                  className="w-full bg-black/40 border border-white/10 rounded-[6px] px-[8px] py-[4px] h-[28px] text-[13px] text-[#e1d7ff] outline-none focus:border-[#c9a84c]/50"
                  style={{ fontFamily: "'Crimson Text', serif" }}
                />
                <select 
                  value={seg.type} onChange={e => updateSegment(i, "type", e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-[6px] px-[8px] py-[2px] h-[22px] text-[11px] text-[#e1d7ff] outline-none appearance-none cursor-pointer focus:border-[#c9a84c]/50"
                  style={{ 
                    fontFamily: "'Crimson Text', serif",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none'%3E%3Cpath d='M1 1l3 3L7 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    paddingRight: "20px"
                  }}
                >
                  <option value="custom" style={{ background: "#160f2a" }}>Custom</option>
                  <option value="symbol" style={{ background: "#160f2a" }}>Symbol</option>
                  <option value="card" style={{ background: "#160f2a" }}>Card</option>
                </select>
              </div>

              <button type="button" onClick={() => removeSegment(i)} className="w-[28px] h-[28px] rounded-[6px] bg-red-900/20 border border-red-900/40 text-red-400 hover:text-red-300 hover:bg-red-900/40 shrink-0 flex items-center justify-center cursor-pointer transition-colors">
                <Trash2 className="w-[14px] h-[14px]" />
              </button>
            </div>

            {seg.type === "card" && deckCards.length > 0 && (
              <select 
                value={seg.card_id || ""} onChange={e => updateSegment(i, "card_id", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-[6px] px-[8px] py-[6px] text-[12px] text-[#e1d7ff] outline-none appearance-none cursor-pointer focus:border-[#c9a84c]/50"
                style={{ 
                  fontFamily: "'Crimson Text', serif",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none'%3E%3Cpath d='M1 1l3 3L7 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center"
                }}
              >
                <option value="" disabled style={{ background: "#160f2a", color: "rgba(180,160,220,0.42)" }}>Select a card...</option>
                {deckCards.map(c => (
                  <option key={c.id} value={c.id} style={{ background: "#160f2a" }}>{c.name}</option>
                ))}
              </select>
            )}

            {seg.type === "symbol" && (
              <div className="flex flex-wrap gap-[6px] max-h-[160px] overflow-y-auto p-[8px] border border-white/5 rounded-[6px] bg-black/20 custom-scrollbar">
                {PRESET_SYMBOLS.map(p => (
                  <button
                    key={p.icon}
                    onClick={() => applyPreset(i, p)}
                    title={`${p.label}: ${p.meaning}`}
                    className="flex flex-col items-center justify-start p-[4px] rounded-[4px] hover:bg-white/10 transition-colors w-[60px] shrink-0 border-none bg-transparent cursor-pointer"
                  >
                    {isImageSymbol(p.icon) ? (
                      <img src={getImageUrl(p.icon)} className="w-[28px] h-[28px] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40 rounded-full border border-white/10" alt={p.label} />
                    ) : (
                      <span className="text-[22px] h-[28px] flex items-center leading-none">{p.icon}</span>
                    )}
                    <span className="text-[9px] text-[#c9a84c] opacity-70 text-center mt-[4px] w-full truncate leading-tight" style={{ fontFamily: "'Crimson Text', serif" }}>{p.label}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              value={seg.meaning}
              onChange={e => updateSegment(i, "meaning", e.target.value)}
              placeholder="Full meaning (revealed after spin)"
              className="w-full bg-black/40 border border-white/10 rounded-[6px] px-[8px] py-[6px] text-[13px] text-[#e1d7ff] outline-none focus:border-[#c9a84c]/50"
              style={{ fontFamily: "'Crimson Text', serif" }}
            />
          </motion.div>
          );
        })}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.5); }
      `}</style>
    </div>
  );
}

import { ROOTED_CARDS_DATA, WHEEL_MIDDLE, WHEEL_INNER } from "@/lib/spiritWheelData";
import { WHEEL_THEMES } from "@/lib/spiritWheelThemes";



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
  const [activeTab, setActiveTab] = useState('designer');

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
    <div className="min-h-screen bg-[#07050f] text-[#e1d7ff] p-0 md:p-8 font-serif" style={{ fontFamily: "'Crimson Text', serif" }}>
      <style>{`
        .mode-tabs {
          display: flex; gap: 0; background: rgba(22,15,42,0.8); border-bottom: 1px solid rgba(160,120,255,0.16);
          position: sticky; top: 0; z-index: 90; backdrop-filter: blur(10px); margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .mode-tabs { margin: 0; }
        }
        .mode-tab {
          flex: 1; padding: 14px 0; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 0.16em;
          text-transform: uppercase; color: rgba(180,160,220,0.6); border: none; background: none; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.25s; text-align: center;
        }
        .mode-tab.on { color: #c9a84c; border-bottom-color: #c9a84c; background: rgba(201,168,76,0.05); }
        .mode-tab:hover:not(.on) { color: rgba(201,168,76,0.8); background: rgba(201,168,76,0.02); }
      `}</style>
      
      <div className="mode-tabs">
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SpiritWheel${editId ? "?id=" + editId : ""}`))}>Spin</button>
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SpiritWheel?tab=config${editId ? "&id=" + editId : ""}`))}>Configure</button>
        <button className="mode-tab on">Designer</button>
      </div>

      <div className="max-w-[430px] md:max-w-5xl mx-auto space-y-0 md:space-y-6">
        
        {/* Designer Header */}
        {editingMode && (
        <div 
          className="px-[18px] py-[16px] pb-[14px] border-b border-[rgba(160,120,255,0.16)] mb-0 md:mb-6"
          style={{ background: "linear-gradient(160deg, #1a0f35, #0e0823)" }}
        >
          <div className="flex items-start justify-between mb-[14px]">
            <div>
              <div 
                className="text-[16px] tracking-[0.1em] text-[#c9a84c] mb-[3px]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ⊙ Designer
              </div>
              <div 
                className="text-[13px] text-[rgba(180,160,220,0.42)] leading-[1.4]"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Build your custom oracle wheel — form-based with JSON import/export
              </div>
            </div>
            
            <div className="flex flex-col gap-[7px] items-end">
              <button 
                onClick={handleCopyJson}
                className="px-[13px] py-[7px] rounded-[8px] border-[1px] border-[rgba(160,120,255,0.16)] bg-[rgba(255,255,255,0.06)] text-[rgba(225,215,255,0.9)] whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-[5px]"
                style={{ fontFamily: "'Cinzel', serif", fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                📋 Copy JSON
              </button>
              <button 
                onClick={() => handleSave("draft")} disabled={isSaving}
                className="px-[13px] py-[7px] rounded-[8px] border-[1px] border-[rgba(160,120,255,0.16)] bg-[rgba(255,255,255,0.06)] text-[rgba(225,215,255,0.9)] whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-[5px]"
                style={{ fontFamily: "'Cinzel', serif", fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                💾 Save Draft
              </button>
              <button 
                onClick={() => handleSave("published")} disabled={isSaving}
                className="px-[13px] py-[7px] rounded-[8px] border-none text-[#1a0f05] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-[5px]"
                style={{ 
                  fontFamily: "'Cinzel', serif", fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase",
                  background: "linear-gradient(135deg, #8B6914, #c9a84c)"
                }}
              >
                ✦ Publish
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2 border-t border-[rgba(160,120,255,0.16)] pt-3">
             <div className="flex items-center gap-2">
              <Label className="text-[#c9a84c] text-xs font-semibold cursor-pointer" style={{ fontFamily: "'Cinzel', serif" }} htmlFor="editing-mode-switch">Editing Mode</Label>
              <Switch id="editing-mode-switch" checked={editingMode} onCheckedChange={(v) => {
                if (!v && !editId) {
                  alert("Please save the wheel first to preview it.");
                  return;
                }
                setEditingMode(v);
              }} className="data-[state=checked]:bg-[#c9a84c] scale-75" />
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowJsonPanel(!showJsonPanel)} className="h-6 text-[9px] border border-[rgba(160,120,255,0.16)] text-[#c9a84c] hover:bg-[#c9a84c]/20 rounded" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
                  JSON IN
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportJson} className="h-6 text-[9px] border border-[rgba(160,120,255,0.16)] text-[#c9a84c] hover:bg-[#c9a84c]/20 rounded" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
                  JSON OUT
                </Button>
                 {editId && (
                  <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isSaving} className="h-6 text-[9px] border border-red-900/40 text-red-400 hover:bg-red-900/40 rounded" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
                    DEL
                  </Button>
                )}
            </div>
          </div>
        </div>
        )}

        {/* Back to full app header when NOT editing on desktop to match rest of app, hidden on mobile since tabs take over */}
        {!editingMode && (
          <div className="hidden md:flex items-center gap-4 mb-6">
             <div className="flex items-center gap-2 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] px-3 py-1.5 rounded-md shadow-inner">
                <Label className="text-[#c9a84c] text-sm font-semibold cursor-pointer" style={{ fontFamily: "'Cinzel', serif" }} htmlFor="editing-mode-switch-desk">Editing Mode</Label>
                <Switch id="editing-mode-switch-desk" checked={editingMode} onCheckedChange={(v) => {
                  if (!v && !editId) {
                    alert("Please save the wheel first to preview it.");
                    return;
                  }
                  setEditingMode(v);
                }} className="data-[state=checked]:bg-[#c9a84c]" />
              </div>
          </div>
        )}

        {!editingMode ? (
          <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,0.16)] rounded-none md:rounded-[14px] overflow-hidden shadow-2xl h-[100vh] md:h-[85vh] -mx-4 md:mx-0">
            <iframe src={`${createPageUrl("SpiritWheel")}?id=${editId}`} className="w-full h-full border-0" />
          </div>
        ) : (
          <div className="space-y-0 md:space-y-6">

        {/* JSON Import Panel */}
        {showJsonPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0b1e] border border-[rgba(160,120,255,0.16)] rounded-[14px] p-[15px] mb-[13px] mx-[18px] md:mx-0"
          >
            <h3 className="font-semibold text-[#c9a84c] mb-2" style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" }}>JSON Import</h3>
            <Textarea
              value={jsonImportText}
              onChange={e => setJsonImportText(e.target.value)}
              placeholder='{"name": "My Wheel", "outer_ring": [...], "middle_ring": [...], "inner_ring": [...]}'
              className="min-h-[180px] bg-[#160f2a] border-[rgba(160,120,255,0.16)] text-[#e1d7ff] font-mono text-xs rounded-[9px] mb-3"
            />
            {jsonError && <p className="text-[#ef4444] text-xs mb-3">{jsonError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleImportJson} className="bg-[#3d2008] border border-[rgba(201,168,76,0.3)] hover:bg-[#5c3310] text-[rgba(240,220,170,0.9)] rounded-[12px] h-8 text-[10px]" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>Import</Button>
              <Button variant="ghost" onClick={() => setShowJsonPanel(false)} className="text-[rgba(180,160,220,0.42)] hover:bg-white/5 hover:text-white rounded-[12px] h-8 text-[10px]" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Basic Info & Theme Preview */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-0 md:gap-6 px-[18px] md:px-0">
        
        <div className="md:col-span-2 bg-[#0f0b1e] border border-[rgba(160,120,255,0.16)] rounded-[14px] p-[15px] mb-[13px] md:mb-0">
          <div 
            className="text-[11px] tracking-[0.14em] uppercase text-[#c9a84c] mb-[13px]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Wheel Info
          </div>
          
          <div className="space-y-[11px]">
            <div>
              <div 
                className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[5px]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Wheel Name <span className="text-[#ef4444] ml-[2px]">*</span>
              </div>
              <input 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[9px] px-[13px] py-[10px] text-[15px] text-[rgba(225,215,255,0.9)] outline-none transition-colors duration-250 placeholder-[rgba(180,160,220,0.42)] focus:border-[rgba(201,168,76,0.4)]"
                style={{ fontFamily: "'Crimson Text', serif" }}
                value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Love Reading Wheel" 
              />
            </div>
            
            <div>
              <div 
                className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[5px]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Source Deck (for card segments)
              </div>
              <select 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[9px] px-[13px] py-[10px] text-[15px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer"
                style={{ 
                  fontFamily: "'Crimson Text', serif",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 13px center"
                }}
                value={deckId} onChange={e => setDeckId(e.target.value)}
              >
                <option value="none" style={{ background: "#160f2a" }}>None</option>
                {decks.map(d => <option key={d.id} value={d.id} style={{ background: "#160f2a" }}>{d.name}</option>)}
              </select>
            </div>
            
            <div>
              <div 
                className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[5px]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Description
              </div>
              <textarea 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[9px] px-[13px] py-[10px] text-[15px] text-[rgba(225,215,255,0.9)] outline-none transition-colors duration-250 placeholder-[rgba(180,160,220,0.42)] focus:border-[rgba(201,168,76,0.4)] min-h-[68px] resize-none leading-[1.5]"
                style={{ fontFamily: "'Crimson Text', serif" }}
                value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this wheel for?" 
              />
            </div>
            
            <div>
              <div 
                className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[5px]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Default Visual Theme
              </div>
              <select 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[9px] px-[13px] py-[10px] text-[15px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer mb-[12px]"
                style={{ 
                  fontFamily: "'Crimson Text', serif",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 13px center"
                }}
                value={themeId} onChange={e => setThemeId(e.target.value)}
              >
                <option value="wood" style={{ background: "#160f2a" }}>Classic Wood</option>
                <option value="galaxy" style={{ background: "#160f2a" }}>Cosmic Galaxy</option>
                <option value="neon" style={{ background: "#160f2a" }}>Cyber Neon</option>
                <option value="parchment" style={{ background: "#160f2a" }}>Ancient Parchment</option>
                <option value="stone_led" style={{ background: "#160f2a" }}>Stone + LED</option>
                <option value="metatron" style={{ background: "#160f2a" }}>Sacred Geometry</option>
                <option value="custom" style={{ background: "#160f2a" }}>Custom Build...</option>
              </select>
            </div>
            
            {/* Theme Colors Section matching the new design */}
            <div className="mt-4 pt-4 border-t border-[rgba(160,120,255,0.16)]">
              <div className="flex items-center gap-2 mb-[12px]">
                <div 
                  className="text-[11px] tracking-[0.14em] uppercase text-[#c9a84c]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Theme Colors & Textures
                </div>
                <span 
                  className="text-[rgba(180,160,220,0.42)] text-[11px]" 
                  style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}
                >
                  Editing will switch to Custom theme
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Outer Ring</div>
                  <div className="flex gap-[6px] mb-[6px]">
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.outerBg }}>
                      <input type="color" value={customTheme.outerBg} onChange={e => setCustomTheme({...customTheme, outerBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Background" />
                    </div>
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.outerGrad }}>
                      <input type="color" value={customTheme.outerGrad} onChange={e => setCustomTheme({...customTheme, outerGrad: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Gradient" />
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-[6px]">
                    <input 
                      value={customTheme.outerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, outerTextureUrl: e.target.value})} 
                      placeholder="https://www.transparenttex…" 
                      className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none flex-1"
                      style={{ fontFamily: "'Crimson Text', serif" }}
                    />
                    <button type="button" onClick={() => setLibraryTargetField('outerTextureUrl')} className="shrink-0 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] w-[30px] h-[30px] flex items-center justify-center text-[rgba(180,160,220,0.8)] cursor-pointer hover:border-[rgba(167,139,250,0.5)] transition-colors">
                      🖼
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Middle Ring</div>
                  <div className="flex gap-[6px] mb-[6px]">
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.middleBg }}>
                      <input type="color" value={customTheme.middleBg} onChange={e => setCustomTheme({...customTheme, middleBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" />
                    </div>
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.middleGrad }}>
                      <input type="color" value={customTheme.middleGrad} onChange={e => setCustomTheme({...customTheme, middleGrad: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-[6px]">
                    <input 
                      value={customTheme.middleTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, middleTextureUrl: e.target.value})} 
                      placeholder="https://www.transparenttex…" 
                      className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none flex-1"
                      style={{ fontFamily: "'Crimson Text', serif" }}
                    />
                    <button type="button" onClick={() => setLibraryTargetField('middleTextureUrl')} className="shrink-0 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] w-[30px] h-[30px] flex items-center justify-center text-[rgba(180,160,220,0.8)] cursor-pointer hover:border-[rgba(167,139,250,0.5)] transition-colors">
                      🖼
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Inner Ring</div>
                  <div className="flex gap-[6px] mb-[6px]">
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.innerBg }}>
                      <input type="color" value={customTheme.innerBg} onChange={e => setCustomTheme({...customTheme, innerBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" />
                    </div>
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.innerGrad }}>
                      <input type="color" value={customTheme.innerGrad} onChange={e => setCustomTheme({...customTheme, innerGrad: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-[6px]">
                    <input 
                      value={customTheme.innerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, innerTextureUrl: e.target.value})} 
                      placeholder="https://www.transparenttex…" 
                      className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none flex-1"
                      style={{ fontFamily: "'Crimson Text', serif" }}
                    />
                    <button type="button" onClick={() => setLibraryTargetField('innerTextureUrl')} className="shrink-0 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] w-[30px] h-[30px] flex items-center justify-center text-[rgba(180,160,220,0.8)] cursor-pointer hover:border-[rgba(167,139,250,0.5)] transition-colors">
                      🖼
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Text & Dots</div>
                  <div className="flex gap-[6px] mb-[6px]">
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.textOuter || "#2a1505" }}>
                      <input type="color" value={customTheme.textOuter || "#2a1505"} onChange={e => setCustomTheme({...customTheme, textOuter: e.target.value, textMiddle: e.target.value, textInner: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Text Color" />
                    </div>
                    <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.pin || "#f5f5f5" }}>
                      <input type="color" value={customTheme.pin || "#f5f5f5"} onChange={e => setCustomTheme({...customTheme, pin: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Pin Color" />
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-[12px]">
                <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Borders</div>
                <div className="flex gap-[8px] items-center">
                  <div className="w-[32px] h-[32px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(201,168,76,0.2)] overflow-hidden relative" style={{ background: customTheme.outerBorder || "#2a1505" }}>
                    <input type="color" value={customTheme.outerBorder || "#2a1505"} onChange={e => setCustomTheme({...customTheme, outerBorder: e.target.value, middleBorder: e.target.value, innerBorder: e.target.value, hubBorder: e.target.value, divider: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Border Color" />
                  </div>
                  <input 
                    type="number" min="0" max="20" 
                    value={customTheme.borderThickness ?? 6} 
                    onChange={e => setCustomTheme({...customTheme, borderThickness: Number(e.target.value)})} 
                    className="w-[52px] bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[9px] py-[7px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none text-center"
                    style={{ fontFamily: "'Crimson Text', serif" }}
                  />
                  <select 
                    value={customTheme.borderStyle || "solid"} 
                    onChange={e => setCustomTheme({...customTheme, borderStyle: e.target.value})}
                    className="flex-1 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[10px] py-[7px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer"
                    style={{ 
                      fontFamily: "'Crimson Text', serif",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center"
                    }}
                  >
                    <option value="solid" style={{ background: "#160f2a" }}>Solid</option>
                    <option value="dashed" style={{ background: "#160f2a" }}>Dashed</option>
                    <option value="dotted" style={{ background: "#160f2a" }}>Dotted</option>
                    <option value="double" style={{ background: "#160f2a" }}>Double</option>
                  </select>
                  
                  <div className="flex-1"></div>
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Page Bg</div>
                    <div className="w-[32px] h-[32px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] overflow-hidden relative" style={{ background: customTheme.pageBg || "#0d0e1a" }}>
                      <input type="color" value={customTheme.pageBg || "#0f172a"} onChange={e => setCustomTheme({...customTheme, pageBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Page Background Color" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-[12px]">
                <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Layer & Blending Options</div>
                <div className="flex gap-[8px] items-center flex-wrap">
                  <select 
                    value={customTheme.layerOrder || 'texture_top'} 
                    onChange={e => setCustomTheme({...customTheme, layerOrder: e.target.value})}
                    className="bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[10px] py-[7px] text-[13px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer"
                    style={{ 
                      fontFamily: "'Crimson Text', serif",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      paddingRight: "28px"
                    }}
                  >
                    <option value="texture_top" style={{ background: "#160f2a" }}>Texture on Top</option>
                    <option value="color_top" style={{ background: "#160f2a" }}>Color on Top</option>
                  </select>
                  
                  <span className="text-[8.5px] tracking-[0.1em] text-[rgba(180,160,220,0.42)] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>TOP OPACITY:</span>
                  
                  <input 
                    type="number" min="0" max="100" 
                    value={customTheme.topLayerOpacity !== undefined ? Math.round(customTheme.topLayerOpacity * 100) : 100} 
                    onChange={e => setCustomTheme({...customTheme, topLayerOpacity: Number(e.target.value)/100})} 
                    className="w-[60px] bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[9px] py-[7px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none text-center"
                    style={{ fontFamily: "'Crimson Text', serif" }}
                  />
                  <span className="text-[10px] text-[rgba(180,160,220,0.42)]" style={{ fontFamily: "'Cinzel', serif" }}>%</span>
                  
                  <select 
                    value={customTheme.blendMode || 'multiply'} 
                    onChange={e => setCustomTheme({...customTheme, blendMode: e.target.value})}
                    className="bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[10px] py-[7px] text-[13px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer"
                    style={{ 
                      fontFamily: "'Crimson Text', serif",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      paddingRight: "28px"
                    }}
                  >
                    <option value="normal" style={{ background: "#160f2a" }}>Normal</option>
                    <option value="multiply" style={{ background: "#160f2a" }}>Multiply</option>
                    <option value="overlay" style={{ background: "#160f2a" }}>Overlay</option>
                    <option value="screen" style={{ background: "#160f2a" }}>Screen</option>
                    <option value="soft-light" style={{ background: "#160f2a" }}>Soft Light</option>
                    <option value="hard-light" style={{ background: "#160f2a" }}>Hard Light</option>
                    <option value="color-burn" style={{ background: "#160f2a" }}>Color Burn</option>
                  </select>
                </div>
              </div>

              <div className="mt-[12px]">
                <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Page Background Image URL</div>
                <div className="flex gap-[8px] mt-[6px]">
                  <input 
                    className="flex-1 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[9px] px-[12px] py-[9px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none"
                    style={{ fontFamily: "'Crimson Text', serif" }}
                    value={customTheme.pageBgImage || ""} onChange={e => setCustomTheme({...customTheme, pageBgImage: e.target.value})} placeholder="https://..." 
                  />
                  <button 
                    type="button" onClick={() => setLibraryTargetField('pageBgImage')}
                    className="px-[14px] py-[9px] rounded-[9px] border-[1px] border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.08)] text-[#c9a84c] cursor-pointer hover:bg-[rgba(201,168,76,0.15)] transition-colors whitespace-nowrap flex items-center gap-[5px]"
                    style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" }}
                  >
                    🖼 Gallery
                  </button>
                </div>
              </div>

              <div className="mt-[12px]">
                <div className="text-[9px] tracking-[0.18em] uppercase text-[#c9a84c] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Advanced Optical Effects</div>
                <div className="flex items-center gap-[10px] py-[10px]">
                  <input 
                    type="checkbox" 
                    checked={customTheme.stroboscopic || false} onChange={e => setCustomTheme({...customTheme, stroboscopic: e.target.checked})}
                    className="w-[18px] h-[18px] accent-[#c9a84c] cursor-pointer" 
                  />
                  <span className="text-[10px] tracking-[0.07em] text-[rgba(225,215,255,0.9)]" style={{ fontFamily: "'Cinzel', serif" }}>Stroboscopic Mode (Persistence of Vision Flicker)</span>
                </div>
              </div>
              
              <div className="flex items-center gap-[10px] py-[10px] pb-[4px]">
                <input 
                  type="checkbox" id="public-check" 
                  checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
                  className="w-[20px] h-[20px] accent-[#c9a84c] cursor-pointer" 
                />
                <span className="text-[11px] tracking-[0.07em] text-[#c9a84c]" style={{ fontFamily: "'Cinzel', serif" }}>Make this wheel publicly available</span>
              </div>
              <div className="text-[12px] text-[rgba(180,160,220,0.42)] leading-[1.4] pl-[30px] -mt-[2px]" style={{ fontFamily: "'Crimson Text', serif", fontStyle: "italic" }}>
                (Changes are saved automatically as a Draft while Editing Mode is on)
              </div>
            </div>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="bg-[#0f0b1e] border border-[rgba(160,120,255,0.16)] rounded-[14px] p-[16px] mb-[13px] text-center mx-[18px] md:mx-0 px-[18px] md:px-[16px]">
          <div 
            className="text-[11px] tracking-[0.14em] uppercase text-[#c9a84c] mb-[14px] text-left"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Visual Preview
          </div>
          <div className="flex justify-center my-4">
             <WheelThemePreview activeTheme={themeId === 'custom' ? customTheme : WHEEL_THEMES[themeId]} />
          </div>
          <div 
            className="text-[12px] text-[rgba(180,160,220,0.42)] mt-[10px] leading-[1.5]"
            style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}
          >
            Preview of colors, textures, and borders.<br/>Segments and icons are populated during the reading.
          </div>
        </div>
        </div>

        <div className="px-[18px] md:px-0 space-y-[12px]">
        {/* Ring Editors */}
        <RingEditor ringKey="outer_ring" segments={outerRing} setSegments={setOuterRing} deckCards={deckCards} onOpenGallery={(idx, field = 'icon') => setLibraryTargetField({ring: 'outer_ring', index: idx, field})} />
        <RingEditor ringKey="middle_ring" segments={middleRing} setSegments={setMiddleRing} deckCards={deckCards} onOpenGallery={(idx, field = 'icon') => setLibraryTargetField({ring: 'middle_ring', index: idx, field})} />
        <RingEditor ringKey="inner_ring" segments={innerRing} setSegments={setInnerRing} deckCards={deckCards} onOpenGallery={(idx, field = 'icon') => setLibraryTargetField({ring: 'inner_ring', index: idx, field})} />

        {/* Bottom save */}
        <div className="flex gap-[10px] pb-[20px] md:pb-[30px] px-[18px] md:px-0 mt-4">
          <button 
            onClick={() => handleSave("draft")} disabled={isSaving}
            className="flex-1 py-[13px] rounded-[50px] border border-[rgba(160,120,255,0.16)] bg-[#160f2a] text-[rgba(225,215,255,0.9)] cursor-pointer flex items-center justify-center gap-[7px] transition-all duration-200 uppercase tracking-[0.14em] text-[10px]"
            style={{ fontFamily: "'Cinzel', serif" }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}
            onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(160,120,255,0.16)"}
          >
            💾 Save Draft
          </button>
          <button 
            onClick={() => handleSave("published")} disabled={isSaving}
            className="flex-[1.4] py-[13px] rounded-[50px] border-none text-[#1a0f05] font-bold cursor-pointer flex items-center justify-center gap-[7px] transition-transform duration-200 uppercase tracking-[0.14em] text-[10px]"
            style={{ 
              fontFamily: "'Cinzel', serif",
              background: "linear-gradient(135deg, #6b4a0a, #c9a84c)",
              boxShadow: "0 4px 16px rgba(201,168,76,0.35)"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            ✦ Publish Wheel
          </button>
        </div>
        
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