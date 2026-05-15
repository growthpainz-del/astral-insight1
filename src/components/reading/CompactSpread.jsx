import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

// ─── Spread Definitions ────────────────────────────────────────────────────────

export const SYSTEM_SPREADS = [
  {
    id: "single",
    name: "Single Card",
    description: "One clear message from the universe",
    icon: "✦",
    cardCount: 1,
    layout: "single",
    positions: [
      { name: "The Message", meaning: "What the universe wants you to know right now" }
    ]
  },
  {
    id: "past_present_future",
    name: "Past · Present · Future",
    description: "The arc of your current situation",
    icon: "◈",
    cardCount: 3,
    layout: "row",
    positions: [
      { name: "Root",      meaning: "What has shaped this situation" },
      { name: "Now",       meaning: "The energy present in this moment" },
      { name: "Emergence", meaning: "What is being called forward" },
    ]
  },
  {
    id: "business_diamond",
    name: "Business Diamond",
    description: "Clarity for your path as a creator and builder",
    icon: "◇",
    cardCount: 5,
    layout: "diamond",
    positions: [
      { name: "Foundation",  meaning: "What your business is built on" },
      { name: "Challenge",   meaning: "What is blocking growth" },
      { name: "Core",        meaning: "The heart of your vision" },
      { name: "Opportunity", meaning: "What wants to emerge" },
      { name: "Outcome",     meaning: "Where this path leads" },
    ]
  },
  {
    id: "path_forward",
    name: "Path Forward",
    description: "A roadmap through uncertainty",
    icon: "→",
    cardCount: 7,
    layout: "path",
    positions: [
      { name: "Where You Stand", meaning: "Your current position" },
      { name: "What to Release", meaning: "What is holding you back" },
      { name: "Hidden Strength", meaning: "What you're not seeing in yourself" },
      { name: "The Next Step",   meaning: "The immediate action" },
      { name: "The Obstacle",    meaning: "What will test you" },
      { name: "The Ally",        meaning: "What or who supports you" },
      { name: "The Destination", meaning: "Where this path leads" },
    ]
  },
  {
    id: "twin_flames",
    name: "Twin Flames",
    description: "The mirror and the mystery of deep connection",
    icon: "♾",
    cardCount: 6,
    layout: "twin",
    positions: [
      { name: "Your Flame",  meaning: "Your current energy" },
      { name: "Their Flame", meaning: "Their current energy" },
      { name: "The Mirror",  meaning: "What you reflect in each other" },
      { name: "The Shadow",  meaning: "What is unresolved between you" },
      { name: "The Wound",   meaning: "What is asking to be healed" },
      { name: "The Union",   meaning: "The potential of this connection" },
    ]
  },
  {
    id: "crescent_moon",
    name: "Crescent Moon",
    description: "From shadow into light — a reading of becoming",
    icon: "🌙",
    cardCount: 7,
    layout: "crescent",
    positions: [
      { name: "The Dark",    meaning: "What lives in your shadow right now" },
      { name: "The Turning", meaning: "What is beginning to shift" },
      { name: "The Sliver",  meaning: "The first light of new awareness" },
      { name: "The Heart",   meaning: "What you are growing toward" },
      { name: "The Glow",    meaning: "Your emerging strength" },
      { name: "The Pull",    meaning: "What the moon is calling you to release" },
      { name: "The Promise", meaning: "What is being born in you" },
    ]
  },
  {
    id: "seven_sisters",
    name: "7 Sisters",
    description: "The Pleiades — ancient starlight for the modern seeker",
    icon: "✦",
    cardCount: 7,
    layout: "pleiades",
    positions: [
      { name: "Alcyone", meaning: "The calm at the center — your core truth" },
      { name: "Maia",    meaning: "The nurturer — what needs tending" },
      { name: "Electra", meaning: "The spark — where your power lives" },
      { name: "Taygete", meaning: "The chase — what you are pursuing" },
      { name: "Celaeno", meaning: "The veil — what is hidden from you" },
      { name: "Sterope", meaning: "The flame — your creative fire" },
      { name: "Merope",  meaning: "The whisper — the quiet wisdom you're missing" },
    ]
  },
  {
    id: "celtic_cross",
    name: "Celtic Cross",
    description: "The classic deep reading — ten windows into your situation",
    icon: "✛",
    cardCount: 10,
    layout: "celtic",
    positions: [
      { name: "The Present",    meaning: "What surrounds you now" },
      { name: "The Cross",      meaning: "What challenges or supports you" },
      { name: "The Crown",      meaning: "What you aspire to" },
      { name: "The Root",       meaning: "What grounds this situation" },
      { name: "The Past",       meaning: "What is passing away" },
      { name: "The Future",     meaning: "What is approaching" },
      { name: "Your Power",     meaning: "How you see yourself" },
      { name: "Outside Forces", meaning: "How others see you" },
      { name: "Hopes & Fears",  meaning: "What you hold inside" },
      { name: "The Outcome",    meaning: "Where this is heading" },
    ]
  },
];

// ─── Layout Coordinate Maps ────────────────────────────────────────────────────
// x/y as percentages of container width/height
// Designed for portrait mobile — max 380px wide

const LAYOUTS = {
  single: [
    { x: 50, y: 50 },
  ],
  row: [
    { x: 18, y: 50 },
    { x: 50, y: 50 },
    { x: 82, y: 50 },
  ],
  diamond: [
    { x: 50, y: 10 },  // Foundation — top
    { x: 15, y: 50 },  // Challenge — left
    { x: 50, y: 50 },  // Core — center
    { x: 85, y: 50 },  // Opportunity — right
    { x: 50, y: 90 },  // Outcome — bottom
  ],
  path: [
    { x: 12, y: 50 },  // Where You Stand
    { x: 30, y: 25 },  // What to Release
    { x: 30, y: 75 },  // Hidden Strength
    { x: 50, y: 50 },  // The Next Step — center
    { x: 70, y: 25 },  // The Obstacle
    { x: 70, y: 75 },  // The Ally
    { x: 88, y: 50 },  // The Destination
  ],
  twin: [
    { x: 25, y: 18 },  // Your Flame
    { x: 75, y: 18 },  // Their Flame
    { x: 50, y: 40 },  // The Mirror
    { x: 50, y: 60 },  // The Shadow
    { x: 25, y: 82 },  // The Wound
    { x: 75, y: 82 },  // The Union
  ],
  crescent: [
    { x: 25, y: 82 },  // The Dark — bottom left
    { x: 12, y: 58 },  // The Turning
    { x: 15, y: 30 },  // The Sliver
    { x: 35, y: 12 },  // The Heart — top
    { x: 60, y: 15 },  // The Glow
    { x: 78, y: 35 },  // The Pull
    { x: 82, y: 60 },  // The Promise — right
  ],
  pleiades: [
    { x: 50, y: 38 },  // Alcyone — center
    { x: 28, y: 20 },  // Maia — upper left
    { x: 72, y: 18 },  // Electra — upper right
    { x: 18, y: 52 },  // Taygete — left
    { x: 80, y: 50 },  // Celaeno — right
    { x: 33, y: 75 },  // Sterope — lower left
    { x: 67, y: 73 },  // Merope — lower right
  ],
  celtic: [
    { x: 32, y: 50 },  // 1 Present
    { x: 32, y: 50 },  // 2 Cross (overlaid, rotated)
    { x: 32, y: 22 },  // 3 Crown
    { x: 32, y: 78 },  // 4 Root
    { x: 12, y: 50 },  // 5 Past
    { x: 52, y: 50 },  // 6 Future
    { x: 78, y: 82 },  // 7 Your Power
    { x: 78, y: 62 },  // 8 Outside Forces
    { x: 78, y: 40 },  // 9 Hopes & Fears
    { x: 78, y: 18 },  // 10 Outcome
  ],
};

// Celtic Cross card 2 is rotated 90 degrees (crossing card)
const SLOT_ROTATIONS = {
  celtic: { 1: 90 },
};

// ─── Single Card Slot ─────────────────────────────────────────────────────────

function CardSlot({
  spreadLayout,
  position,
  coords,
  index,
  card,
  deck,
  isRevealed,
  onReveal,
  onCardClick,
  animateIn,
  cardW,
}) {
  const cardH    = Math.round(cardW * 1.58);
  const rotation = SLOT_ROTATIONS[spreadLayout]?.[index] || 0;

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${coords.x}%`, top: `${coords.y}%`, zIndex: isRevealed ? 10 : 5 }}
      initial={animateIn ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay:     animateIn ? index * 0.08 : 0,
        duration:  0.4,
        type:      "spring",
        stiffness: 200,
        damping:   20,
      }}
    >
      <div className="flex flex-col items-center" style={{ width: cardW + 16 }}>
        {!card ? (
          // ── Empty slot ───────────────────────────────────────────────────────
          <>
            <div
              className="rounded-lg border-2 border-dashed border-purple-500/35 bg-purple-900/10 flex items-center justify-center"
              style={{ width: cardW, height: cardH, transform: `rotate(${rotation}deg)` }}
            >
              <span className="text-purple-400/40 text-[10px] font-['Cinzel']">{index + 1}</span>
            </div>
            <p className="text-purple-300/50 text-[8px] font-semibold text-center leading-tight mt-1 truncate w-full">
              {position.name}
            </p>
          </>
        ) : !isRevealed ? (
          // ── Card back ────────────────────────────────────────────────────────
          <>
            <button
              type="button"
              onClick={() => { onReveal(index); onCardClick?.(card, index); }}
              className="rounded-lg overflow-hidden shadow-lg border-2 border-amber-400/25 hover:border-amber-400/55 hover:scale-105 active:scale-95 transition-all"
              style={{ width: cardW, height: cardH, transform: `rotate(${rotation}deg)` }}
            >
              {deck?.back_image_url ? (
                <img src={deck.back_image_url} alt="Card back" className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400/50" />
                </div>
              )}
            </button>
            <p className="text-purple-300/60 text-[8px] font-semibold text-center leading-tight mt-1 truncate w-full">
              {position.name}
            </p>
          </>
        ) : (
          // ── Revealed card ────────────────────────────────────────────────────
          <>
            <motion.button
              type="button"
              onClick={() => onCardClick?.(card, index)}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0,   opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="rounded-lg overflow-hidden shadow-xl border-2 border-amber-400/40 hover:border-amber-400/70 hover:scale-105 active:scale-95 transition-all"
              style={{ width: cardW, height: cardH, transform: `rotate(${rotation}deg)` }}
            >
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className={`w-full h-full object-cover ${card.is_reversed ? "rotate-180" : ""}`}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-1">
                  <span className="text-white text-[8px] text-center font-semibold leading-tight">{card.name}</span>
                </div>
              )}
            </motion.button>

            {/* Label */}
            <div className="text-center w-full mt-1">
              <p className="text-white text-[8px] font-semibold leading-tight truncate">{card.name}</p>
              <Badge className="bg-purple-600/75 text-white text-[7px] px-1 py-0 mt-0.5 leading-tight">
                {position.name}
              </Badge>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main SpreadLayout ────────────────────────────────────────────────────────

export default function SpreadLayout({
  spread,
  cards = [],
  deck,
  revealedCards = new Set(),
  onCardReveal   = () => {},
  onCardClick    = () => {},
  animateSpread  = true,
}) {
  // Resolve spread — accepts id string, spread object, or legacy spread with positions array
  const spreadDef =
    typeof spread === "string"
      ? SYSTEM_SPREADS.find(s => s.id === spread)
      : SYSTEM_SPREADS.find(s => s.id === spread?.id) ||
        // Legacy fallback: build a minimal spread def from the spread object
        (spread?.positions
          ? {
              id:        spread.id || "custom",
              name:      spread.name || "Custom Spread",
              layout:    "row",
              positions: spread.positions,
              cardCount: spread.positions.length,
            }
          : null);

  if (!spreadDef) {
    return (
      <div className="w-full flex items-center justify-center p-8 text-purple-300/60 text-center">
        <div>
          <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p className="text-sm font-['Cinzel']">No spread selected</p>
        </div>
      </div>
    );
  }

  const coordMap  = LAYOUTS[spreadDef.layout] || LAYOUTS.row;
  const positions = spreadDef.positions;

  // Card size — scales based on how many cards and their layout
  // Larger for fewer cards, smaller for dense spreads
  const cardW = spreadDef.cardCount <= 1  ? 100
              : spreadDef.cardCount <= 3  ? 80
              : spreadDef.cardCount <= 6  ? 68
              : spreadDef.cardCount <= 7  ? 62
              : 56; // celtic cross

  // Container height ratio
  const heightRatio = ["celtic", "path", "crescent", "pleiades", "twin"].includes(spreadDef.layout)
    ? "105%"
    : spreadDef.cardCount === 1 ? "70%" : "90%";

  return (
    <div className="w-full flex flex-col items-center px-4">
      {/* Spread name */}
      <div className="text-center mb-2">
        <p className="font-['Cinzel'] text-xs text-purple-300/60 tracking-widest uppercase">
          {spreadDef.name}
        </p>
      </div>

      {/* Reading mat — self-contained, never overflows */}
      <div
        className="relative w-full"
        style={{
          maxWidth: 360,
          paddingBottom: heightRatio,
        }}
      >
        {/* Mat background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(88,28,135,0.2) 0%, rgba(10,6,20,0.55) 100%)",
            border: "1px solid rgba(168,85,247,0.18)",
            boxShadow: "0 0 30px rgba(168,85,247,0.06) inset",
          }}
        >
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="readgrid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(168,85,247,0.7)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#readgrid)" />
          </svg>
        </div>

        {/* Card slots */}
        <div className="absolute inset-0">
          <AnimatePresence>
            {positions.map((position, idx) => (
              <CardSlot
                key={idx}
                index={idx}
                spreadLayout={spreadDef.layout}
                position={position}
                coords={coordMap[idx] || { x: 50, y: 50 }}
                card={cards[idx] || null}
                deck={deck}
                cardW={cardW}
                isRevealed={revealedCards.has(idx)}
                onReveal={onCardReveal}
                onCardClick={onCardClick}
                animateIn={animateSpread}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Position guide */}
      <div className="w-full max-w-sm mt-4 space-y-1.5 px-1">
        {positions.map((pos, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-purple-500/60 text-[10px] font-bold shrink-0 w-4 text-right pt-px">
              {idx + 1}
            </span>
            <span className="text-purple-200/80 text-[10px] font-semibold shrink-0">
              {pos.name}
            </span>
            <span className="text-purple-400/45 text-[10px] leading-tight">
              — {pos.meaning}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Spread Selector ──────────────────────────────────────────────────────────
// Drop-in replacement for ReadingSetup spread picker

export function SpreadSelector({ selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {SYSTEM_SPREADS.map((spread) => (
        <button
          key={spread.id}
          type="button"
          onClick={() => onSelect(spread)}
          className={`relative p-3 rounded-xl border text-left transition-all ${
            selectedId === spread.id
              ? "border-purple-400/80 bg-purple-600/20 shadow-[0_0_14px_rgba(147,51,234,0.25)]"
              : "border-purple-500/20 bg-[#160f2a] hover:border-purple-500/40"
          }`}
        >
          <div className="text-xl mb-1 leading-none">{spread.icon}</div>
          <div className="font-['Cinzel'] text-[10px] text-white font-semibold leading-tight mb-1">
            {spread.name}
          </div>
          <div className="text-purple-400/55 text-[9px]">
            {spread.cardCount} {spread.cardCount === 1 ? "card" : "cards"}
          </div>
          {selectedId === spread.id && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-400" />
          )}
        </button>
      ))}
    </div>
  );
}