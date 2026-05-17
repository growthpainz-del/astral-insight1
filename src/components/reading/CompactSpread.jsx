import React, { useState, useEffect, useRef } from "react";
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
    cardSizeW: 40,
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
    cardSizeW: 18,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/ff4d6e093_1BD939A4-820F-473E-97D3-A4D6E23BA11C.png",
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
    cardSizeW: 16,
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
    cardSizeW: 14,
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
    cardSizeW: 18,
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
    cardSizeW: 14.5,
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
    cardSizeW: 15,
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
    cardSizeW: 14,
    bgImage: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/7b990a5da_20560908-71DC-4542-9A8A-4417D41E721A.png",
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

function CardSlot({ spread, position, index, card, deck, isRevealed, onReveal, onCardClick, animateIn, containerW, containerH, enableExternalDrops, onExternalDrop }) {
  const cardW    = Math.round(containerW * (spread.cardSizeW || 22) / 100);
  const cardH    = Math.round(cardW * 1.58);
  const rotation = position.rotation || 0;
  const leftPos  = position.cx ?? position.x ?? 50;
  const topPos   = position.cy ?? position.y ?? 50;

  return (
    <motion.div
      className="absolute"
      style={{
        left:      `${leftPos}%`,
        top:       `${topPos}%`,
        x:         "-50%",
        y:         "-50%",
        width:     cardW,
        height:    cardH,
        zIndex:    30,   // Cards sit ABOVE the frame overlay so they are visible (until transparent PNGs are used)
      }}
      initial={animateIn ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: animateIn ? index * 0.1 : 0, duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="relative flex flex-col items-center w-full h-full">

        {/* ── Empty slot ── */}
        {!card && (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              spread.bgImage
                ? "bg-transparent"
                : "rounded-xl border-2 border-dashed border-purple-400/40 bg-purple-900/20 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.1)]"
            }`}
            style={{ transform: `rotate(${rotation}deg)` }}
            onDragOver={enableExternalDrops ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            } : undefined}
            onDrop={enableExternalDrops ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const data = e.dataTransfer.getData("application/json");
                const payload = JSON.parse(data);
                if (payload && payload.source === "bottom-shelf" && typeof payload.cardIndex === "number") {
                  onExternalDrop({ targetIndex: index, cardIndex: payload.cardIndex });
                }
              } catch (err) {
                console.error("Drop parse error:", err);
              }
            } : undefined}
          >
            {!spread.bgImage && (
              <span className="text-purple-300/60 text-[10px] font-bold">{index + 1}</span>
            )}
          </div>
        )}

        {/* ── Card back ── */}
        {card && !isRevealed && (
          <button
            type="button"
            onClick={() => { onReveal(index); }}
            className={`absolute inset-0 rounded-xl overflow-hidden transition-all ${
              spread.bgImage
                ? "shadow-lg hover:scale-105 active:scale-95"
                : "shadow-lg border border-amber-400/25 hover:border-amber-400/55 hover:scale-105 active:scale-95"
            }`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {deck?.back_image_url ? (
              <img src={deck.back_image_url} alt="Card back" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900">
                <Sparkles className="w-4 h-4 text-purple-300/40" />
              </div>
            )}
          </button>
        )}

        {/* ── Revealed card ── */}
        {card && isRevealed && (
          <motion.button
            type="button"
            onClick={() => onCardClick?.(card, index)}
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`absolute inset-0 rounded-xl overflow-hidden transition-all ${
              spread.bgImage
                ? "shadow-xl hover:scale-105 active:scale-95"
                : "shadow-xl border border-amber-400/45 hover:border-amber-400/75 hover:scale-105 active:scale-95"
            }`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className={`w-full h-full object-cover ${card.is_reversed ? "rotate-180" : ""}`}
                draggable={false}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center p-1 ${spread.bgImage ? "bg-gradient-to-br from-purple-900/80 to-indigo-900/80" : "bg-gradient-to-br from-purple-900 to-indigo-900"}`}>
                <span className="text-white text-[8px] text-center font-semibold leading-tight">{card.name}</span>
              </div>
            )}
          </motion.button>
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
  enableExternalDrops = false,
  onExternalDrop = () => {},
}) {
  const containerRef = React.useRef(null);
  const [containerW, setContainerW] = React.useState(320);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width || el.clientWidth || 320);
        setContainerW(Math.min(w, 460));
      }
    });
    ro.observe(el);
    setContainerW(Math.min(Math.round(el.clientWidth || 320), 460));
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
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 460,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Spread title — only shown when no background image */}
        {!spreadDef.bgImage && (
          <p className="font-['Cinzel'] text-xs text-purple-300/60 tracking-widest uppercase mb-2 text-center">
            {spreadDef.name}
          </p>
        )}

        {/* Mat */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width:      "100%",
            height:     containerH,
            background: spreadDef.bgImage
              ? "transparent"
              : "radial-gradient(ellipse at 50% 40%, rgba(88,28,135,0.22) 0%, rgba(8,4,18,0.75) 100%)",
            border:     spreadDef.bgImage ? "none" : "1px solid rgba(168,85,247,0.3)",
            boxShadow:  spreadDef.bgImage ? "none" : "0 0 40px rgba(100,50,200,0.15) inset",
          }}
        >
        {/* Background image — Layer 0 (very bottom, no blend mode) */}
        {spreadDef.bgImage && (
          <img
            src={spreadDef.bgImage}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              objectFit: "fill",
              zIndex: 0,
            }}
            draggable={false}
          />
        )}

        {/* Cards — Layer 10 (above bg image, below frame overlay) */}
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
              enableExternalDrops={enableExternalDrops}
              onExternalDrop={onExternalDrop}
            />
          ))}
        </AnimatePresence>

        {/* Frame overlay — Layer 20 (sits on top of cards, transparent windows reveal cards) */}
        {spreadDef.bgImage && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url('${spreadDef.bgImage}')`,
              backgroundPosition: "center",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              zIndex: 20,
            }}
          />
        )}

        {/* Grid overlay — only for spreads without bg image */}
        {!spreadDef.bgImage && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.06, zIndex: 10 }}
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

        {/* Badges — Layer 25 (always on top) */}
        {spreadDef.positions.map((position, idx) => {
          const card = cards[idx] || null;
          const isRevealed = revealedCards.has(idx);
          const leftPos  = position.cx ?? position.x ?? 50;
          const topPos   = position.cy ?? position.y ?? 50;
          const cardW    = Math.round(containerW * (spreadDef.cardSizeW || 22) / 100);
          const cardH    = Math.round(cardW * 1.58);

          return (
            <div
              key={`badge-${idx}`}
              className="absolute pointer-events-none"
              style={{
                left: `${leftPos}%`,
                top: `${topPos}%`,
                transform: "translate(-50%, -50%)",
                width: cardW,
                height: cardH,
                zIndex: 35,
              }}
            >
              {!card && (
                <div className="absolute top-full mt-1 w-max left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ writingMode: "horizontal-tb" }}>
                  <p className="text-purple-200/80 text-[9px] font-semibold text-center leading-tight bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm"
                     style={{ maxWidth: cardW + 24 }}>
                    {position.name}
                  </p>
                </div>
              )}
              {card && !isRevealed && (
                <div className="absolute top-full mt-1 w-max left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ writingMode: "horizontal-tb" }}>
                  <p className="text-purple-200/55 text-[8px] font-semibold text-center leading-tight bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm"
                     style={{ maxWidth: cardW + 24 }}>
                    {position.name}
                  </p>
                </div>
              )}
              {card && isRevealed && (
                <div className="absolute top-full mt-1 w-max left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ maxWidth: cardW + 24, writingMode: "horizontal-tb" }}>
                  <p className="text-white/90 text-[8px] font-semibold leading-tight truncate bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm mb-0.5">{card.name}</p>
                  <Badge className="bg-purple-600/90 text-white text-[7px] px-1.5 py-0 leading-tight border-purple-400/40">
                    {position.name}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
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
    </div>
  );
}

// ─── Spread Selector ──────────────────────────────────────────────────────────

export function SpreadSelector({ selectedId, onSelect, customSpreads = [] }) {
  const allSpreads = [...SYSTEM_SPREADS, ...customSpreads];

  React.useEffect(() => {
    console.log("Checking all spread background images...");
    SYSTEM_SPREADS.forEach(spread => {
      if (spread.bgImage) {
        const img = new Image();
        img.onload = () => console.log(`✅ SUCCESS: ${spread.name} image loaded`);
        img.onerror = () => console.error(`❌ ERROR: ${spread.name} image failed to load (${spread.bgImage})`);
        img.src = spread.bgImage;
      }
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {allSpreads.map((spread) => (
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