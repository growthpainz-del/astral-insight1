import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export const SYSTEM_SPREADS = [
  {
    id: "single",
    name: "Single Card",
    description: "One clear message from the universe",
    icon: "✦",
    cardCount: 1,
    heightRatio: 1.5,
    cardSizeW: 42,
    positions: [
      { name: "The Message", meaning: "What the universe wants you to know right now", cx: 50, cy: 45 }
    ]
  },
  {
    id: "past_present_future",
    name: "Past · Present · Future",
    description: "The arc of your current situation",
    icon: "◈",
    cardCount: 3,
    heightRatio: 1.4,
    cardSizeW: 26,
    positions: [
      { name: "Root",      meaning: "What has shaped this situation",    cx: 19, cy: 58 },
      { name: "Now",       meaning: "The energy present in this moment", cx: 50, cy: 58 },
      { name: "Emergence", meaning: "What is being called forward",      cx: 81, cy: 58 },
    ]
  },
  {
    id: "business_diamond",
    name: "Business Diamond",
    description: "Clarity for your path as a creator and builder",
    icon: "◇",
    cardCount: 5,
    heightRatio: 1.5,
    cardSizeW: 22,
    positions: [
      { name: "Foundation",  meaning: "What your business is built on", cx: 50, cy: 13 },
      { name: "Challenge",   meaning: "What is blocking growth",        cx: 16, cy: 50 },
      { name: "Core",        meaning: "The heart of your vision",       cx: 50, cy: 50 },
      { name: "Opportunity", meaning: "What wants to emerge",           cx: 84, cy: 50 },
      { name: "Outcome",     meaning: "Where this path leads",          cx: 50, cy: 85 },
    ]
  },
  {
    id: "path_forward",
    name: "Path Forward",
    description: "A roadmap through uncertainty",
    icon: "→",
    cardCount: 7,
    heightRatio: 1.2,
    cardSizeW: 13,
    positions: [
      { name: "Where You Stand", meaning: "Your current position",              cx: 16, cy: 62 },
      { name: "What to Release", meaning: "What is holding you back",           cx: 33, cy: 28 },
      { name: "Hidden Strength", meaning: "What you're not seeing in yourself", cx: 33, cy: 75 },
      { name: "The Next Step",   meaning: "The immediate action",               cx: 50, cy: 62 },
      { name: "The Obstacle",    meaning: "What will test you",                 cx: 67, cy: 28 },
      { name: "The Ally",        meaning: "What or who supports you",           cx: 67, cy: 75 },
      { name: "The Destination", meaning: "Where this path leads",              cx: 84, cy: 62 },
    ]
  },
  {
    id: "twin_flames",
    name: "Twin Flames",
    description: "The mirror and the mystery of deep connection",
    icon: "♾",
    cardCount: 6,
    heightRatio: 1.48,
    cardSizeW: 28,
    positions: [
      { name: "Your Flame",  meaning: "Your current energy",              cx: 27, cy: 18 },
      { name: "Their Flame", meaning: "Their current energy",             cx: 73, cy: 18 },
      { name: "The Mirror",  meaning: "What you reflect in each other",   cx: 27, cy: 52 },
      { name: "The Shadow",  meaning: "What is unresolved between you",   cx: 73, cy: 52 },
      { name: "The Wound",   meaning: "What is asking to be healed",      cx: 27, cy: 83 },
      { name: "The Union",   meaning: "The potential of this connection",  cx: 73, cy: 83 },
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
    positions: [
      { name: "The Heart",   meaning: "What you are growing toward",             cx: 50, cy: 12 },
      { name: "The Glow",    meaning: "Your emerging strength",                  cx: 78, cy: 25 },
      { name: "The Promise", meaning: "What is being born in you",               cx: 82, cy: 68 },
      { name: "The Pull",    meaning: "What the moon is calling you to release", cx: 50, cy: 85 },
      { name: "The Dark",    meaning: "What lives in your shadow right now",     cx: 18, cy: 68 },
      { name: "The Turning", meaning: "What is beginning to shift",              cx: 12, cy: 35 },
      { name: "The Sliver",  meaning: "The first light of new awareness",        cx: 28, cy: 18 },
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
    positions: [
      { name: "Alcyone", meaning: "The calm at the center — your core truth",      cx: 50, cy: 52 },
      { name: "Maia",    meaning: "The nurturer — what needs tending",             cx: 50, cy: 13 },
      { name: "Taygete", meaning: "The chase — what you are pursuing",             cx: 16, cy: 33 },
      { name: "Electra", meaning: "The spark — where your power lives",            cx: 84, cy: 33 },
      { name: "Sterope", meaning: "The flame — your creative fire",                cx: 16, cy: 72 },
      { name: "Celaeno", meaning: "The veil — what is hidden from you",            cx: 84, cy: 72 },
      { name: "Merope",  meaning: "The whisper — the quiet wisdom you're missing", cx: 50, cy: 90 },
    ]
  },
  {
    id: "celtic_cross",
    name: "Celtic Cross",
    description: "A 9-card overlap-free reading into your situation",
    icon: "✛",
    cardCount: 9,
    heightRatio: 1.48,
    cardSizeW: 16,
    positions: [
      { name: "The Present",    meaning: "What surrounds you now",      cx: 39, cy: 50 },
      { name: "The Crown",      meaning: "What you aspire to",          cx: 39, cy: 25 },
      { name: "The Past",       meaning: "What is passing away",        cx: 18, cy: 50 },
      { name: "The Future",     meaning: "What is approaching",         cx: 60, cy: 50 },
      { name: "The Root",       meaning: "What grounds this situation", cx: 39, cy: 75 },
      { name: "The Outcome",    meaning: "Where this is heading",       cx: 85, cy: 10 },
      { name: "Hopes & Fears",  meaning: "What you hold inside",        cx: 85, cy: 35 },
      { name: "Outside Forces", meaning: "How others see you",          cx: 85, cy: 62 },
      { name: "Your Power",     meaning: "How you see yourself",        cx: 85, cy: 85 },
    ]
  },
];

const EMPTY_SLOT_STYLE = {
  background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0414 100%)",
  border: "2px dashed rgba(201,168,76,0.3)",
  boxShadow: "0 0 12px rgba(147,51,234,0.2), inset 0 0 12px rgba(100,50,200,0.15)",
  borderRadius: 10,
};

const CARD_BACK_STYLE = {
  background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0414 100%)",
  border: "2px solid rgba(201,168,76,0.7)",
  boxShadow: "0 0 18px rgba(201,168,76,0.3), 0 0 30px rgba(147,51,234,0.3), inset 0 0 10px rgba(100,50,200,0.2)",
  borderRadius: 10,
  cursor: "pointer",
};

const CARD_REVEALED_STYLE = {
  border: "2px solid rgba(201,168,76,0.9)",
  boxShadow: "0 0 25px rgba(201,168,76,0.4), 0 0 40px rgba(147,51,234,0.4)",
  borderRadius: 10,
  cursor: "pointer",
};

function CardSlot({ spread, position, index, card, deck, isRevealed, onReveal, onCardClick, animateIn, containerW, containerH, enableExternalDrops, onExternalDrop }) {
  const cardW = Math.round(containerW * (spread.cardSizeW || 22) / 100);
  const cardH = Math.round(cardW * 1.58);
  const rotation = position.rotation || 0;
  const leftPos = position.cx ?? position.x ?? 50;
  const topPos  = position.cy ?? position.y ?? 50;

  return (
    <motion.div
      className="absolute"
      style={{
        left:       `${leftPos}%`,
        top:        `${topPos}%`,
        marginLeft: -(cardW / 2),
        marginTop:  -(cardH / 2),
        width:      cardW,
        height:     cardH,
        zIndex:     10,
        transform:  `rotate(${rotation}deg)`,
      }}
      initial={animateIn ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: animateIn ? index * 0.12 : 0, duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Empty slot */}
      {!card && (
        <div
          style={{ ...EMPTY_SLOT_STYLE, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          onDragOver={enableExternalDrops ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } : undefined}
          onDrop={enableExternalDrops ? (e) => {
            e.preventDefault(); e.stopPropagation();
            try {
              const payload = JSON.parse(e.dataTransfer.getData("application/json"));
              if (payload?.source === "bottom-shelf" && typeof payload.cardIndex === "number") {
                onExternalDrop({ targetIndex: index, cardIndex: payload.cardIndex });
              }
            } catch(err) {}
          } : undefined}
        >
          <span style={{ color: "rgba(201,168,76,0.4)", fontSize: 11, fontWeight: "bold" }}>{index + 1}</span>
        </div>
      )}

      {/* Card back — unreveal */}
      {card && !isRevealed && (
        <div
          onClick={() => onReveal(index)}
          style={{ ...CARD_BACK_STYLE, width: "100%", height: "100%", overflow: "hidden" }}
        >
          {deck?.back_image_url ? (
            <img src={deck.back_image_url} alt="Card back" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} draggable={false} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center, #2d1b69 0%, #0a0414 100%)" }}>
              <Sparkles style={{ width: 20, height: 20, color: "rgba(201,168,76,0.6)" }} />
            </div>
          )}
        </div>
      )}

      {/* Revealed card */}
      {card && isRevealed && (
        <motion.div
          onClick={() => onCardClick?.(card, index)}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
          style={{ ...CARD_REVEALED_STYLE, width: "100%", height: "100%", overflow: "hidden" }}
        >
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, transform: card.is_reversed ? "rotate(180deg)" : "none" }}
              draggable={false}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, background: "radial-gradient(ellipse at center, #2d1b69 0%, #0a0414 100%)" }}>
              <span style={{ color: "white", fontSize: 9, textAlign: "center", fontWeight: 600, lineHeight: 1.3 }}>{card.name}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Position label */}
      <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 4, textAlign: "center", whiteSpace: "nowrap", pointerEvents: "none" }}>
        {!card && (
          <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(201,168,76,0.7)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
            {position.name}
          </span>
        )}
        {card && !isRevealed && (
          <span style={{ fontSize: 8, color: "rgba(201,168,76,0.5)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
            {position.name}
          </span>
        )}
        {card && isRevealed && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: "white", background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 4, maxWidth: cardW + 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {card.name}
            </span>
            <span style={{ fontSize: 7, color: "rgba(201,168,76,0.8)", background: "rgba(88,28,135,0.8)", padding: "1px 5px", borderRadius: 3 }}>
              {position.name}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
      for (const e of entries) setContainerW(Math.min(Math.round(e.contentRect.width || el.clientWidth || 320), 520));
    });
    ro.observe(el);
    setContainerW(Math.min(Math.round(el.clientWidth || 320), 520));
    return () => ro.disconnect();
  }, []);

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

  if (!spreadDef) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div>
        <Sparkles style={{ width: 32, height: 32, color: "#9333ea", margin: "0 auto 8px" }} />
        <p style={{ fontSize: 14, color: "#d8b4fe", fontFamily: "Cinzel, serif" }}>No spread selected</p>
      </div>
    </div>
  );

  const containerH = Math.round(containerW * (spreadDef.heightRatio || 1.5));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", maxWidth: 520, margin: "0 auto", position: "relative" }}>

        {/* Spread name */}
        <p style={{ fontFamily: "Cinzel, serif", fontSize: 11, color: "rgba(201,168,76,0.6)", textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
          {spreadDef.name}
        </p>

        {/* Mat */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: containerH,
            background: "radial-gradient(ellipse at 50% 40%, rgba(30,10,60,0.95) 0%, rgba(4,2,12,1) 100%)",
            borderRadius: 16,
            border: "1px solid rgba(201,168,76,0.2)",
            boxShadow: "0 0 60px rgba(147,51,234,0.15) inset, 0 0 30px rgba(201,168,76,0.05) inset",
            overflow: "visible",
          }}
        >
          {/* Connecting lines SVG */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
            viewBox={`0 0 ${containerW} ${containerH}`}
            preserveAspectRatio="none"
          >
            {spreadDef.positions.length > 1 && spreadDef.positions.map((pos, idx) => {
              if (idx === 0) return null;
              const x1 = (spreadDef.positions[0].cx / 100) * containerW;
              const y1 = (spreadDef.positions[0].cy / 100) * containerH;
              const x2 = (pos.cx / 100) * containerW;
              const y2 = (pos.cy / 100) * containerH;
              return (
                <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(201,168,76,0.15)" strokeWidth="1" strokeDasharray="4 4"
                />
              );
            })}
          </svg>

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
        </div>

        {/* Position guide */}
        <div style={{ width: "100%", maxWidth: 380, margin: "12px auto 0", padding: "0 4px" }}>
          {spreadDef.positions.map((pos, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
              <span style={{ color: "rgba(201,168,76,0.5)", fontSize: 10, fontWeight: "bold", minWidth: 16, textAlign: "right", paddingTop: 1 }}>{idx + 1}</span>
              <span style={{ color: "rgba(216,180,254,0.85)", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{pos.name}</span>
              <span style={{ color: "rgba(147,51,234,0.5)", fontSize: 10, lineHeight: 1.4 }}>— {pos.meaning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SpreadSelector({ selectedId, onSelect, customSpreads = [] }) {
  const allSpreads = [...SYSTEM_SPREADS, ...customSpreads];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {allSpreads.map((spread) => (
        <button key={spread.id} type="button" onClick={() => onSelect(spread)}
          style={{
            position: "relative",
            padding: 12,
            borderRadius: 12,
            border: selectedId === spread.id ? "1px solid rgba(201,168,76,0.8)" : "1px solid rgba(147,51,234,0.2)",
            background: selectedId === spread.id ? "rgba(147,51,234,0.2)" : "#160f2a",
            textAlign: "left",
            cursor: "pointer",
            boxShadow: selectedId === spread.id ? "0 0 14px rgba(201,168,76,0.2)" : "none",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>{spread.icon}</div>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 10, color: "white", fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{spread.name}</div>
          <div style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>{spread.cardCount} {spread.cardCount === 1 ? "card" : "cards"}</div>
          {selectedId === spread.id && <div style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "rgba(201,168,76,0.9)" }} />}
        </button>
      ))}
    </div>
  );
}