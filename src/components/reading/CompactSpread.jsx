import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

// ─── Spread Definitions ────────────────────────────────────────────────────────
// cx/cy = center position as % of container width/height

export const SYSTEM_SPREADS = [
  {
    id: "single",
    name: "Single Card",
    description: "One clear message from the universe",
    icon: "✦",
    cardCount: 1,
    heightRatio: 1.777,
    cardSizeW: 52,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/2f5109427_IMG_0153.jpg",
    positions: [
      { name: "The Message", meaning: "What the universe wants you to know right now", cx: 50, cy: 50 }
    ]
  },
  {
    id: "past_present_future",
    name: "Past · Present · Future",
    description: "The arc of your current situation",
    icon: "◈",
    cardCount: 3,
    heightRatio: 1.777,
    cardSizeW: 24,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/85781bbdb_IMG_0148.jpg",
    positions: [
      { name: "Root",      meaning: "What has shaped this situation",    cx: 19, cy: 51 },
      { name: "Now",       meaning: "The energy present in this moment", cx: 50, cy: 51 },
      { name: "Emergence", meaning: "What is being called forward",      cx: 81, cy: 51 },
    ]
  },
  {
    id: "business_diamond",
    name: "Business Diamond",
    description: "Clarity for your path as a creator and builder",
    icon: "◇",
    cardCount: 5,
    heightRatio: 1.777,
    cardSizeW: 21,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/5fab2f0d2_IMG_0155.jpg",
    positions: [
      { name: "Foundation",  meaning: "What your business is built on", cx: 50,   cy: 28.5 },
      { name: "Challenge",   meaning: "What is blocking growth",        cx: 21.5, cy: 52 },
      { name: "Core",        meaning: "The heart of your vision",       cx: 50,   cy: 52 },
      { name: "Opportunity", meaning: "What wants to emerge",           cx: 78.5, cy: 52 },
      { name: "Outcome",     meaning: "Where this path leads",          cx: 50,   cy: 75.5 },
    ]
  },
  {
    id: "path_forward",
    name: "Path Forward",
    description: "A roadmap through uncertainty",
    icon: "→",
    cardCount: 7,
    heightRatio: 1.777,
    cardSizeW: 18.5,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/0c8652d82_IMG_0147.jpg",
    positions: [
      { name: "Where You Stand", meaning: "Your current position",              cx: 11.5, cy: 50 },
      { name: "What to Release", meaning: "What is holding you back",           cx: 31,   cy: 35 },
      { name: "Hidden Strength", meaning: "What you're not seeing in yourself", cx: 31,   cy: 65 },
      { name: "The Next Step",   meaning: "The immediate action",               cx: 50,   cy: 50 },
      { name: "The Obstacle",    meaning: "What will test you",                 cx: 69,   cy: 35 },
      { name: "The Ally",        meaning: "What or who supports you",           cx: 69,   cy: 65 },
      { name: "The Destination", meaning: "Where this path leads",              cx: 88.5, cy: 50 },
    ]
  },
  {
    id: "twin_flames",
    name: "Twin Flames",
    description: "The mirror and the mystery of deep connection",
    icon: "♾",
    cardCount: 6,
    heightRatio: 1.777,
    cardSizeW: 24,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/354dfaeb3_IMG_0149.jpg",
    positions: [
      { name: "Your Flame",  meaning: "Your current energy",                cx: 29.5, cy: 28 },
      { name: "Their Flame", meaning: "Their current energy",               cx: 70.5, cy: 28 },
      { name: "The Mirror",  meaning: "What you reflect in each other",     cx: 29.5, cy: 53.5 },
      { name: "The Shadow",  meaning: "What is unresolved between you",     cx: 70.5, cy: 53.5 },
      { name: "The Wound",   meaning: "What is asking to be healed",        cx: 29.5, cy: 79 },
      { name: "The Union",   meaning: "The potential of this connection",   cx: 70.5, cy: 79 },
    ]
  },
  {
    id: "crescent_moon",
    name: "Crescent Moon",
    description: "From shadow into light — a reading of becoming",
    icon: "🌙",
    cardCount: 7,
    heightRatio: 1.777,
    cardSizeW: 19.5,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/f88fb4ca6_IMG_0151.jpg",
    positions: [
      { name: "The Dark",    meaning: "What lives in your shadow right now",     cx: 28.5, cy: 73 },
      { name: "The Turning", meaning: "What is beginning to shift",              cx: 17.5, cy: 54 },
      { name: "The Sliver",  meaning: "The first light of new awareness",        cx: 28.5, cy: 35 },
      { name: "The Heart",   meaning: "What you are growing toward",             cx: 50,   cy: 26 },
      { name: "The Glow",    meaning: "Your emerging strength",                  cx: 71.5, cy: 29 },
      { name: "The Pull",    meaning: "What the moon is calling you to release", cx: 50,   cy: 82.5 },
      { name: "The Promise", meaning: "What is being born in you",               cx: 83,   cy: 41 },
    ]
  },
  {
    id: "seven_sisters",
    name: "7 Sisters",
    description: "The Pleiades — ancient starlight for the modern seeker",
    icon: "✦",
    cardCount: 7,
    heightRatio: 1.777,
    cardSizeW: 20,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/e3b6028b2_IMG_0152.jpg",
    positions: [
      { name: "Alcyone", meaning: "The calm at the center — your core truth",      cx: 50, cy: 53.5 },
      { name: "Maia",    meaning: "The nurturer — what needs tending",             cx: 27, cy: 34 },
      { name: "Electra", meaning: "The spark — where your power lives",            cx: 73, cy: 34 },
      { name: "Taygete", meaning: "The chase — what you are pursuing",             cx: 16, cy: 53.5 },
      { name: "Celaeno", meaning: "The veil — what is hidden from you",            cx: 84, cy: 53.5 },
      { name: "Sterope", meaning: "The flame — your creative fire",                cx: 29, cy: 73 },
      { name: "Merope",  meaning: "The whisper — the quiet wisdom you're missing", cx: 71, cy: 73 },
    ]
  },
  {
    id: "celtic_cross",
    name: "Celtic Cross",
    description: "The classic deep reading — ten windows into your situation",
    icon: "✛",
    cardCount: 10,
    heightRatio: 1.777,
    cardSizeW: 18.5,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d8574faca_IMG_0154.jpg",
    positions: [
      { name: "The Present",    meaning: "What surrounds you now",         cx: 39, cy: 52.5 },
      { name: "The Cross",      meaning: "What challenges or supports you", cx: 39, cy: 52.5, rotation: 90 },
      { name: "The Crown",      meaning: "What you aspire to",             cx: 39, cy: 31 },
      { name: "The Root",       meaning: "What grounds this situation",    cx: 39, cy: 74 },
      { name: "The Past",       meaning: "What is passing away",           cx: 14.5, cy: 52.5 },
      { name: "The Future",     meaning: "What is approaching",            cx: 63.5, cy: 52.5 },
      { name: "Your Power",     meaning: "How you see yourself",           cx: 85, cy: 83.5 },
      { name: "Outside Forces", meaning: "How others see you",             cx: 85, cy: 62.5 },
      { name: "Hopes & Fears",  meaning: "What you hold inside",           cx: 85, cy: 42 },
      { name: "The Outcome",    meaning: "Where this is heading",          cx: 85, cy: 21.5 },
    ]
  },
];

// ─── Card Slot ─────────────────────────────────────────────────────────────────

function CardSlot({ spread, position, index, card, deck, isRevealed, onReveal, onCardClick, animateIn, containerW, containerH }) {
  const cardW    = Math.round(containerW * (spread.cardSizeW || 22) / 100);
  const cardH    = Math.round(cardW * 1.58);
  const rotation = position.rotation || 0;

  return (
    <motion.div
      className="absolute"
      style={{
        left:      `${position.cx}%`,
        top:       `${position.cy}%`,
        transform: "translate(-50%, -50%)",
        width:     cardW,
        zIndex:    isRevealed ? 10 : 5,
      }}
      initial={animateIn ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: animateIn ? index * 0.1 : 0, duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="flex flex-col items-center">

        {/* ── Empty slot ── */}
        {!card && (
          <>
            {spread.bgImage ? (
              <div
                className="rounded-xl"
                style={{ width: cardW, height: cardH, transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <>
                <div
                  className="rounded-xl border-2 border-dashed border-purple-400/35 bg-purple-900/10 flex items-center justify-center"
                  style={{ width: cardW, height: cardH, transform: `rotate(${rotation}deg)` }}
                >
                  <span className="text-purple-300/40 text-[9px] font-['Cinzel'] font-bold">{index + 1}</span>
                </div>
                <p className="text-purple-300/55 text-[8px] font-semibold text-center leading-tight mt-1"
                   style={{ maxWidth: cardW + 16 }}>
                  {position.name}
                </p>
              </>
            )}
          </>
        )}

        {/* ── Card back ── */}
        {card && !isRevealed && (
          <>
            <button
              type="button"
              onClick={() => { onReveal(index); onCardClick?.(card, index); }}
              className="rounded-xl overflow-hidden shadow-lg border border-amber-400/25 hover:border-amber-400/55 hover:scale-105 active:scale-95 transition-all"
              style={{ width: cardW, height: cardH, transform: `rotate(${rotation}deg)` }}
            >
              {deck?.back_image_url ? (
                <img src={deck.back_image_url} alt="Card back" className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-300/40" />
                </div>
              )}
            </button>
            {!spread.bgImage && (
              <p className="text-purple-200/55 text-[8px] font-semibold text-center leading-tight mt-1"
                 style={{ maxWidth: cardW + 16 }}>
                {position.name}
              </p>
            )}
          </>
        )}

        {/* ── Revealed card ── */}
        {card && isRevealed && (
          <>
            <motion.button
              type="button"
              onClick={() => onCardClick?.(card, index)}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="rounded-xl overflow-hidden shadow-xl border border-amber-400/45 hover:border-amber-400/75 hover:scale-105 active:scale-95 transition-all"
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

            {!spread.bgImage && (
              <div className="text-center mt-1" style={{ maxWidth: cardW + 16 }}>
                <p className="text-white/90 text-[8px] font-semibold leading-tight truncate">{card.name}</p>
                <Badge className="bg-purple-600/80 text-white text-[7px] px-1.5 py-0 mt-0.5 leading-tight">
                  {position.name}
                </Badge>
              </div>
            )}
          </>
        )}

      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SpreadLayout({
  spread,
  cards         = [],
  deck,
  revealedCards = new Set(),
  onCardReveal  = () => {},
  onCardClick   = () => {},
  animateSpread = true,
}) {
  const containerRef = React.useRef(null);
  const [containerW, setContainerW] = React.useState(320);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width || el.clientWidth || 320);
        setContainerW(Math.min(w, 380));
      }
    });
    ro.observe(el);
    setContainerW(Math.min(Math.round(el.clientWidth || 320), 380));
    return () => ro.disconnect();
  }, []);

  // Resolve spread definition
  const spreadDef =
    typeof spread === "string"
      ? SYSTEM_SPREADS.find(s => s.id === spread)
      : SYSTEM_SPREADS.find(s => s.id === spread?.id) ||
        (spread?.positions ? {
          id: spread.id || "custom",
          name: spread.name || "Custom Spread",
          positions: spread.positions,
          cardCount: spread.positions.length,
          heightRatio: 1.5,
          cardSizeW: 22,
        } : null);

  if (!spreadDef) {
    return (
      <div className="w-full flex items-center justify-center p-8 text-center">
        <div>
          <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse text-purple-400" />
          <p className="text-sm font-['Cinzel'] text-purple-200">No spread selected</p>
        </div>
      </div>
    );
  }

  const containerH = Math.round(containerW * (spreadDef.heightRatio || 1.5));

  return (
    <div className="w-full flex flex-col items-center px-4">

      {/* Spread title */}
      {!spreadDef.bgImage && (
        <p className="font-['Cinzel'] text-xs text-purple-300/60 tracking-widest uppercase mb-2 text-center">
          {spreadDef.name}
        </p>
      )}

      {/* Mat */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          width:      "100%",
          maxWidth:   380,
          height:     containerH,
          background: spreadDef.bgImage 
            ? `url(${spreadDef.bgImage}) center/cover no-repeat` 
            : "radial-gradient(ellipse at 50% 40%, rgba(88,28,135,0.22) 0%, rgba(8,4,18,0.75) 100%)",
          border:     spreadDef.bgImage ? "none" : "1px solid rgba(168,85,247,0.18)",
          boxShadow:  spreadDef.bgImage ? "none" : "0 0 40px rgba(100,50,200,0.08) inset",
        }}
      >
        {/* Grid overlay */}
        {!spreadDef.bgImage && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.06 }}
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="rg3" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(200,150,255,1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rg3)" />
          </svg>
        )}

        {/* Cards */}
        <AnimatePresence>
          {spreadDef.positions.map((position, idx) => (
            <CardSlot
              key={idx}
              index={idx}
              spread={spreadDef}
              position={position}
              card={cards[idx] || null}
              deck={deck}
              isRevealed={revealedCards.has(idx)}
              onReveal={onCardReveal}
              onCardClick={onCardClick}
              animateIn={animateSpread}
              containerW={containerW}
              containerH={containerH}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Position guide */}
      <div className="w-full max-w-sm mt-3 space-y-1 px-1">
        {spreadDef.positions.map((pos, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-purple-400/60 text-[10px] font-bold shrink-0 w-4 text-right pt-px">{idx + 1}</span>
            <span className="text-purple-100/80 text-[10px] font-semibold shrink-0">{pos.name}</span>
            <span className="text-purple-400/45 text-[10px] leading-tight">— {pos.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Spread Selector ──────────────────────────────────────────────────────────

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
          <div className="text-purple-300/55 text-[9px]">
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