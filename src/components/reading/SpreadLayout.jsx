import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CARD_ASPECT_RATIO } from "@/components/utils/cardSizing";
import { Move } from "lucide-react";
import ScratchRevealCard from "@/components/reading/ScratchRevealCard";
import { getThumbnailUrl } from "@/lib/utils";
import CardRevealEffect from "@/components/reading/CardRevealEffect";

const DEFAULT_CARD_WIDTH = 100;

// ─── Position Normalization ────────────────────────────────────────────────────

function normalizeSpreadPositions(spread, positions, cards) {
  const count = Array.isArray(positions) ? positions.length : 0;
  if (count === 0) return [];

  // Helper: ensure position name has a number prefix
  const withNumber = (name, idx) => {
    if (!name) return `Position ${idx + 1}`;
    return name.match(/\d/) ? name : `${idx + 1}. ${name}`;
  };

  const toPos = (raw, idx, x, y, rotation = 0) => ({
    name: withNumber(typeof raw === "string" ? raw : raw?.name, idx),
    meaning: typeof raw === "string" ? "" : (raw?.meaning || ""),
    x,
    y,
    rotation,
    position_number: idx + 1,
  });

  // PRIORITY 1: Use x/y coordinates already saved in the spread positions array
  const hasCoords = positions.some(
    (p) => p && typeof p === "object" && (typeof p.x === "number" || typeof p.y === "number")
  );

  if (hasCoords) {
    const cols = Math.min(5, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    const fallback = (i) => ({
      fx: 15 + ((i % cols) * (70 / (cols - 1 || 1))),
      fy: 20 + (Math.floor(i / cols) * (60 / (rows - 1 || 1))),
    });

    const mapped = positions.map((pos, idx) => {
      const { fx, fy } = fallback(idx);
      const x = typeof pos?.x === "number" ? Math.min(100, Math.max(0, pos.x)) : fx;
      const y = typeof pos?.y === "number" ? Math.min(100, Math.max(0, pos.y)) : fy;
      const rotation = typeof pos?.rotation === "number" ? pos.rotation : 0;
      return toPos(pos, idx, x, y, rotation);
    });

    // Compress "Path Forward" spreads that are too wide
    const isPathForward =
      mapped.length === 7 &&
      spread?.name?.toLowerCase().includes("path") &&
      spread?.name?.toLowerCase().includes("forward");

    if (isPathForward) {
      const xs = mapped.map((p) => p.x);
      const range = Math.max(...xs) - Math.min(...xs);
      if (range > 42) {
        const center = (Math.min(...xs) + Math.max(...xs)) / 2;
        const scale = 42 / range;
        for (const p of mapped) p.x = Math.round(center + (p.x - center) * scale);
      }
    }

    return mapped;
  }

  // PRIORITY 2: Named built-in fallback layouts

  // Single card — centered
  if (count === 1) return [toPos(positions[0], 0, 50, 50)];

  // Three cards — horizontal row
  if (count === 3) {
    return positions.map((pos, idx) => toPos(pos, idx, 20 + idx * 30, 50));
  }

  // Celtic Cross (10)
  if (count === 10 && spread?.name?.toLowerCase().includes("celtic cross")) {
    const cc = [
      [50, 50, 0], [50, 50, 90], [50, 25, 0], [50, 75, 0],
      [25, 50, 0], [75, 50, 0], [85, 80, 0], [85, 60, 0],
      [85, 40, 0], [85, 20, 0],
    ];
    return positions.map((pos, idx) =>
      toPos(pos, idx, cc[idx]?.[0] ?? 50, cc[idx]?.[1] ?? 50, cc[idx]?.[2] ?? 0)
    );
  }

  // Diamond Ring (7)
  if (count === 7 && spread?.name?.toLowerCase().includes("diamond")) {
    const ring = [
      [50, 14, 0], [74, 30, 35], [88, 50, 90], [74, 70, -35],
      [50, 86, 0], [26, 70, 35], [12, 50, 90],
    ];
    return positions.map((pos, idx) =>
      toPos(pos, idx, ring[idx]?.[0] ?? 50, ring[idx]?.[1] ?? 50, ring[idx]?.[2] ?? 0)
    );
  }

  // Path Forward (7) — arrow shape
  if (
    count === 7 &&
    spread?.name?.toLowerCase().includes("path") &&
    spread?.name?.toLowerCase().includes("forward")
  ) {
    const arrow = [
      [10, 30], [32, 40], [54, 50], [80, 50], [54, 60], [32, 70], [10, 80],
    ];
    return positions.map((pos, idx) =>
      toPos(pos, idx, arrow[idx]?.[0] ?? 50, arrow[idx]?.[1] ?? 50)
    );
  }

  // Default: grid layout
  const cols = Math.min(5, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  return positions.map((pos, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return toPos(
      pos, idx,
      15 + col * (70 / (cols - 1 || 1)),
      20 + row * (60 / (rows - 1 || 1))
    );
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SpreadLayout(props) {
  const {
    spread,
    positions = [],
    cards = [],
    requiresPositions = true,
    showPositionLabels = true,
    hideEmptySlots = false,
    revealMode = "instant",
    animateSpread = true,
    onCardClick = () => {},
    deck,
    containerMinH = null,
    defaultCardWidth = DEFAULT_CARD_WIDTH,
    allowReposition = false,
    onPositionUpdate = () => {},
    revealedCards = new Set(),
    onCardReveal = () => {},
    useScratchReveal = false,
    viewMode = "normal",
    sizeScale = 1,
    enableExternalDrops = false,
    onExternalDrop = () => {},
  } = props;

  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.round(entry.contentRect?.width || el.clientWidth || 0));
        setContainerHeight(Math.round(entry.contentRect?.height || el.clientHeight || 0));
      }
    });
    ro.observe(el);
    setContainerWidth(Math.round(el.clientWidth || 0));
    setContainerHeight(Math.round(el.clientHeight || 0));
    return () => ro.disconnect();
  }, []);

  // Animation state
  const [showPositions, setShowPositions] = React.useState(false);
  const [showCards, setShowCards] = React.useState(false);

  // Pinch-to-zoom / pan state
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const gestureRef = React.useRef({
    pinching: false, startDistance: 0, startScale: 1,
    lastCenter: { x: 0, y: 0 }, panning: false, lastPoint: { x: 0, y: 0 },
  });

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const getCenter = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
  const getDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const handleTouchStartZoom = (e) => {
    if (e.touches.length === 2) {
      gestureRef.current = { ...gestureRef.current, pinching: true, startDistance: getDist(e.touches), startScale: zoom, lastCenter: getCenter(e.touches) };
      e.preventDefault();
    } else if (e.touches.length === 1 && zoom > 1) {
      gestureRef.current = { ...gestureRef.current, panning: true, lastPoint: { x: e.touches[0].clientX, y: e.touches[0].clientY } };
      e.preventDefault();
    }
  };

  const handleTouchMoveZoom = (e) => {
    if (gestureRef.current.pinching && e.touches.length === 2) {
      const newZoom = clamp(gestureRef.current.startScale * (getDist(e.touches) / gestureRef.current.startDistance), 0.7, 2.8);
      setZoom(newZoom);
      const c = getCenter(e.touches);
      setPan((p) => ({ x: p.x + c.x - gestureRef.current.lastCenter.x, y: p.y + c.y - gestureRef.current.lastCenter.y }));
      gestureRef.current.lastCenter = c;
      e.preventDefault();
    } else if (gestureRef.current.panning && e.touches.length === 1) {
      const pt = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPan((p) => ({ x: p.x + pt.x - gestureRef.current.lastPoint.x, y: p.y + pt.y - gestureRef.current.lastPoint.y }));
      gestureRef.current.lastPoint = pt;
      e.preventDefault();
    }
  };

  const handleTouchEndZoom = () => {
    gestureRef.current.pinching = false;
    gestureRef.current.panning = false;
  };

  // Card repositioning state
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = React.useState(null);
  const [cardPositionsTemp, setCardPositionsTemp] = React.useState([]);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const dragTimeoutRef = React.useRef(null);

  // Scroll lock
  const scrollLockRef = React.useRef({ body: "", html: "" });
  const preventScroll = React.useRef((e) => { try { e.preventDefault(); } catch (_) {} });

  const lockScroll = React.useCallback(() => {
    scrollLockRef.current = { body: document.body.style.overflow, html: document.documentElement.style.overflow };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    window.addEventListener("wheel", preventScroll.current, { passive: false, capture: true });
    window.addEventListener("touchmove", preventScroll.current, { passive: false, capture: true });
  }, []);

  const unlockScroll = React.useCallback(() => {
    document.body.style.overflow = scrollLockRef.current.body || "";
    document.documentElement.style.overflow = scrollLockRef.current.html || "";
    document.body.style.touchAction = "";
    window.removeEventListener("wheel", preventScroll.current, { capture: true });
    window.removeEventListener("touchmove", preventScroll.current, { capture: true });
  }, []);

  React.useEffect(() => () => unlockScroll(), [unlockScroll]);

  // Normalized data
  const normalizedPositions = React.useMemo(
    () => normalizeSpreadPositions(spread, positions, cards),
    [spread, positions, cards]
  );

  const cardsByIndex = React.useMemo(() => (Array.isArray(cards) ? cards : []), [cards]);

  const visibleCount = hideEmptySlots
    ? normalizedPositions.filter((_, i) => cardsByIndex[i]).length
    : normalizedPositions.length;

  // Responsive card width
  const sizeMultiplier = viewMode === "compact" ? 0.75 : viewMode === "detailed" ? 1.2 : 1;
  let computedWidth = defaultCardWidth || DEFAULT_CARD_WIDTH;
  if (containerWidth) {
    const isMobile = containerWidth < 600;
    const maxW = isMobile ? 100 : 160;
    computedWidth = Math.max(65, Math.min(containerWidth / 3.5, maxW));
  }
  if (visibleCount >= 7 && containerWidth && containerWidth < 520) {
    computedWidth = Math.min(computedWidth, 80);
  }
  const defaultSlot = Math.round(computedWidth * sizeMultiplier * sizeScale);

  const renderItems = React.useMemo(() => {
    return normalizedPositions.map((pos, i) => {
      const card = cardsByIndex[i] || null;
      if (draggedCardIndex === i && cardPositionsTemp[i]) {
        return { pos: { ...pos, x: cardPositionsTemp[i].x, y: cardPositionsTemp[i].y }, card };
      }
      return { pos, card };
    });
  }, [normalizedPositions, cardsByIndex, draggedCardIndex, cardPositionsTemp]);

  // Animation sequence
  React.useEffect(() => {
    if (!animateSpread || cardsByIndex.filter(Boolean).length === 0) {
      setShowPositions(true);
      setShowCards(true);
      return;
    }
    setShowPositions(true);
    setShowCards(false);
    const t = setTimeout(() => setShowCards(true), 1200);
    return () => clearTimeout(t);
  }, [animateSpread, cardsByIndex.length]);

  // Drag handlers
  const handleCardDragMove = React.useCallback((e) => {
    if (draggedCardIndex === null || !allowReposition) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const x = clamp(((point.clientX - dragOffsetRef.current.x - rect.left) / rect.width) * 100, 5, 95);
    const y = clamp(((point.clientY - dragOffsetRef.current.y - rect.top) / rect.height) * 100, 5, 95);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => handleCardDragEnd(), 5000);
    setCardPositionsTemp((prev) => { const next = [...prev]; next[draggedCardIndex] = { x, y }; return next; });
    if (e.preventDefault) e.preventDefault();
  }, [draggedCardIndex, allowReposition]);

  const handleCardDragEnd = React.useCallback(() => {
    if (draggedCardIndex === null) return;
    unlockScroll();
    const updatedPositions = normalizedPositions.map((pos, idx) =>
      idx === draggedCardIndex && cardPositionsTemp[idx]
        ? { ...pos, x: cardPositionsTemp[idx].x, y: cardPositionsTemp[idx].y }
        : pos
    );
    onPositionUpdate(updatedPositions);
    setIsDragging(false);
    setDraggedCardIndex(null);
    setCardPositionsTemp([]);
    document.removeEventListener("mousemove", handleCardDragMove, { capture: true });
    document.removeEventListener("mouseup", handleCardDragEnd, { capture: true });
    document.removeEventListener("touchmove", handleCardDragMove, { capture: true });
    document.removeEventListener("touchend", handleCardDragEnd, { capture: true });
    document.removeEventListener("touchcancel", handleCardDragEnd, { capture: true });
    if (dragTimeoutRef.current) { clearTimeout(dragTimeoutRef.current); dragTimeoutRef.current = null; }
  }, [draggedCardIndex, cardPositionsTemp, normalizedPositions, onPositionUpdate, unlockScroll, handleCardDragMove]);

  const handleCardDragStart = React.useCallback((e, idx) => {
    if (!allowReposition) return;
    e.stopPropagation();
    setIsDragging(true);
    setDraggedCardIndex(idx);
    lockScroll();
    const container = containerRef.current;
    if (!container || !renderItems[idx]) { setIsDragging(false); setDraggedCardIndex(null); unlockScroll(); return; }
    const rect = container.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const currentPos = renderItems[idx].pos;
    dragOffsetRef.current = {
      x: point.clientX - (rect.left + (rect.width * (currentPos?.x || 50) / 100)),
      y: point.clientY - (rect.top + (rect.height * (currentPos?.y || 50) / 100)),
    };
    if (e.preventDefault) e.preventDefault();
    document.addEventListener("mousemove", handleCardDragMove, { passive: false, capture: true });
    document.addEventListener("mouseup", handleCardDragEnd, { passive: false, capture: true });
    document.addEventListener("touchmove", handleCardDragMove, { passive: false, capture: true });
    document.addEventListener("touchend", handleCardDragEnd, { passive: false, capture: true });
    document.addEventListener("touchcancel", handleCardDragEnd, { passive: false, capture: true });
    dragTimeoutRef.current = setTimeout(() => handleCardDragEnd(), 5000);
  }, [allowReposition, renderItems, lockScroll, unlockScroll, handleCardDragMove, handleCardDragEnd]);

  // Vertical spread detection
  const isVerticalSpread = React.useMemo(() => {
    if (normalizedPositions.length <= 3) return false;
    const xs = normalizedPositions.map((p) => p.x);
    return Math.max(...xs) - Math.min(...xs) < 15;
  }, [normalizedPositions]);

  const minHeight = containerMinH || `${Math.max(420, defaultSlot * 3.5)}px`;

  if (!normalizedPositions.length) {
    return (
      <div className="w-full p-8 text-center text-purple-300 opacity-60">
        <p>No spread positions defined.</p>
      </div>
    );
  }

  // ─── Shared card slot renderer ────────────────────────────────────────────────
  const renderCardSlot = (pos, card, idx, isAbsolute = false) => {
    const isCurrentDragged = draggedCardIndex === idx;
    const cardH = Math.round(defaultSlot * CARD_ASPECT_RATIO);

    const slotStyle = isAbsolute
      ? {
          position: "absolute",
          left: `${Math.max(5, Math.min(95, pos.x))}%`,
          top: `${Math.max(5, Math.min(95, pos.y))}%`,
          transform: "translate(-50%, -50%)",
          width: defaultSlot,
          height: cardH,
          zIndex: isCurrentDragged ? 100 : 10,
          cursor: allowReposition ? (isCurrentDragged ? "grabbing" : "grab") : "default",
        }
      : {
          width: defaultSlot,
          height: cardH,
          maxWidth: "90vw",
          cursor: allowReposition ? "grab" : "pointer",
          zIndex: isCurrentDragged ? 100 : 10,
        };

    return (
      <motion.div
        key={`slot-${idx}`}
        style={slotStyle}
        className={isAbsolute ? `p-1` : `relative flex flex-col items-center justify-center z-10 p-2`}
        initial={animateSpread ? { scale: 0, opacity: 0 } : false}
        animate={{ scale: showPositions ? 1 : 0, opacity: showPositions ? 1 : 0 }}
        transition={{ delay: animateSpread ? idx * 0.12 : 0, duration: 0.5, type: "spring", stiffness: 180, damping: 22 }}
        data-spread-slot
      >
        {/* Empty slot */}
        {!card && showPositions && (
          <div
            className="absolute inset-0 rounded-lg border-2 border-dashed border-purple-500/40 bg-purple-900/10 flex items-center justify-center backdrop-blur-sm"
            onDragOver={(e) => { if (enableExternalDrops) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } }}
            onDrop={(e) => {
              if (!enableExternalDrops) return;
              e.preventDefault();
              try {
                const payload = JSON.parse(e.dataTransfer.getData("application/json"));
                if (payload?.source === "bottom-shelf" && typeof payload.cardIndex === "number") {
                  onExternalDrop({ targetIndex: idx, source: "bottom-shelf", cardIndex: payload.cardIndex });
                }
              } catch (_) {}
            }}
          >
            {showPositionLabels && (
              <div className="text-center p-2">
                <div className="text-purple-300 font-semibold text-xs">{pos.name}</div>
                {pos.meaning && <div className="text-purple-400 text-[10px] opacity-70 mt-1">{pos.meaning}</div>}
              </div>
            )}
          </div>
        )}

        {/* Card */}
        <AnimatePresence>
          {card && showCards && (
            <motion.div
              className="w-full h-full flex flex-col"
              initial={animateSpread ? { scale: 0.1, opacity: 0, rotateY: 180 } : false}
              animate={{ scale: 1, opacity: 1, rotateY: 0, rotateZ: pos.rotation || 0 }}
              transition={{ delay: animateSpread ? 1.2 + idx * 0.2 : 0, duration: 0.9, type: "spring", stiffness: 120, damping: 18 }}
            >
              <CardRevealEffect
                card={card}
                isRevealed={revealedCards.has(idx)}
                delay={0.1}
                className="w-full h-full rounded-lg"
                backContent={
                  useScratchReveal ? (
                    <div className="relative w-full h-full rounded-lg group">
                      <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] group-hover:ring-amber-400/40 transition-all" />
                      <ScratchRevealCard
                        frontImage={card.image_url}
                        backImage={deck?.back_image_url}
                        cardName={card.name}
                        isReversed={card.isReversed || card.is_reversed}
                        onReveal={() => onCardReveal(idx)}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                      onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                      onTouchEnd={(e) => { if (allowReposition) return; e.preventDefault(); onCardReveal(idx); setTimeout(() => onCardClick(card, idx), 300); }}
                      onClick={() => { if (allowReposition && isDragging) return; onCardReveal(idx); setTimeout(() => onCardClick(card, idx), 300); }}
                      className="relative w-full h-full rounded-lg overflow-hidden ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:ring-amber-400/40 hover:scale-110 transition-all"
                      style={{ touchAction: "manipulation" }}
                    >
                      {deck?.back_image_url ? (
                        <img src={deck.back_image_url} alt="Card back" className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-800 flex items-center justify-center">
                          <span className="text-white/70 text-[10px]">Tap to reveal</span>
                        </div>
                      )}
                    </button>
                  )
                }
              >
                {/* Revealed card face */}
                <button
                  type="button"
                  onClick={() => onCardClick(card, idx)}
                  onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                  onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                  className={`relative w-full h-full rounded-lg overflow-hidden ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all duration-300 group ${isCurrentDragged ? "scale-105 shadow-purple-500/80" : "hover:ring-amber-400/40 hover:scale-110"}`}
                  style={{
                    transform: `rotate(${pos.rotation || 0}deg)`,
                    cursor: allowReposition ? (isCurrentDragged ? "grabbing" : "grab") : "pointer",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all" />
                  {card.image_url ? (
                    <img
                      src={getThumbnailUrl(card.image_url, 400)}
                      alt={card.name}
                      className={`w-full h-full object-contain ${card.isReversed || card.is_reversed ? "rotate-180" : ""}`}
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                      <span className="text-white/90 text-center px-1 font-semibold text-[10px]">{card.name}</span>
                    </div>
                  )}
                  {allowReposition && (
                    <div className="absolute top-2 right-2 bg-purple-500/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Move className="w-3 h-3" />
                    </div>
                  )}
                </button>
              </CardRevealEffect>

              {/* Position label — rendered ONCE */}
              {showPositionLabels && (
                <div className={`${isAbsolute ? "absolute pointer-events-none" : "mt-2"} left-1/2 -translate-x-1/2 text-center`}
                  style={isAbsolute ? { top: "100%", marginTop: 4 } : {}}>
                  {card?.name && <div className="text-[11px] md:text-sm font-semibold text-white mb-1 whitespace-nowrap">{card.name}</div>}
                  <Badge className="bg-purple-600/90 text-white text-xs px-2 py-1 whitespace-nowrap">{pos.name}</Badge>
                  {pos?.meaning && <div className="mt-1 text-[10px] text-purple-200/80">{pos.meaning}</div>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty slot fallback when cards are shown */}
        {!card && !hideEmptySlots && showCards && (
          <div className="w-full h-full rounded-lg border-2 border-dashed border-purple-500/20 bg-purple-900/5 flex items-center justify-center text-purple-300 text-xs">
            {showPositionLabels ? pos?.name : "Empty Slot"}
          </div>
        )}
      </motion.div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full" ref={containerRef}>
      {allowReposition && (
        <div className="mb-3 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-400/40 rounded-lg px-3 py-2 text-xs text-purple-300">
            <Move className="w-4 h-4" />
            <span>Drag cards to reposition them</span>
          </div>
        </div>
      )}

      <div
        className="relative w-full rounded-xl mystical-grid-container"
        style={{
          minHeight,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: isDragging ? "none" : zoom > 1 ? "none" : "pan-x pan-y",
          padding: visibleCount === 1 ? "3rem 2rem" : "2rem 1rem",
        }}
      >
        {/* Reading mat background */}
        <div aria-hidden="true" className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full shadow-[0_0_40px_rgba(251,191,36,0.25)]"
            style={{
              width: Math.max(120, Math.round(Math.min(containerWidth || 600, 900) * 0.9)),
              height: Math.max(120, Math.round(Math.min(containerWidth || 600, 900) * 0.9)),
              maxWidth: "95%", maxHeight: "95%",
              backgroundImage: "url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/1ae9dba83_E9BB4507-45F8-4ECD-991B-74E57C0ECC6D.png)",
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.72, filter: "saturate(1.05) drop-shadow(0 8px 30px rgba(251,191,36,0.25))",
            }}
          />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-15 z-0">
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
            <defs>
              <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="0.5" />
              </pattern>
              <pattern id="lg" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#sg)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lg)" />
          </svg>
        </div>

        {/* Zoom/pan wrapper */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          onTouchStart={handleTouchStartZoom}
          onTouchMove={handleTouchMoveZoom}
          onTouchEnd={handleTouchEndZoom}
          onTouchCancel={handleTouchEndZoom}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            willChange: "transform",
            touchAction: zoom > 1 ? "none" : "manipulation",
          }}
        >
          {visibleCount === 1 ? (
            // Single card — flex centered
            renderItems.map(({ pos, card }, idx) =>
              hideEmptySlots && !card ? null : renderCardSlot(pos, card, idx, false)
            )
          ) : (
            // Multi-card — absolute positioned
            <div
              className="relative z-10 w-full h-full"
              style={{ maxWidth: isVerticalSpread ? "400px" : "100%", padding: "1rem" }}
            >
              {renderItems.map(({ pos, card }, idx) =>
                hideEmptySlots && !card ? null : renderCardSlot(pos, card, idx, true)
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .mystical-grid-container {
          background: linear-gradient(135deg, rgba(88,28,135,0.1) 0%, rgba(59,130,246,0.1) 100%);
          border: 1px solid rgba(168,85,247,0.2);
          box-shadow: 0 0 20px rgba(168,85,247,0.1) inset;
        }
      `}</style>
    </div>
  );
}