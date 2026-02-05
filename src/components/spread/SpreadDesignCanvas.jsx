import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw, X } from "lucide-react";
import { CARD_ASPECT_RATIO } from "@/components/utils/cardSizing";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function SpreadDesignCanvas({
  positions = [],
  onChange,
  backgroundImage = "",
  showGrid = true,
  aspectRatio = "4 / 3",
  className = "",
  lockScrollWhileDragging = true,
}) {
  const ref = React.useRef(null);
  const draggingRef = React.useRef({ idx: -1, startX: 0, startY: 0, startedAt: 0, moved: false });
  const [selectedCard, setSelectedCard] = React.useState(null);
  const [fineAdjustIdx, setFineAdjustIdx] = React.useState(null);
  const longPressTimerRef = React.useRef(null);
  const preTouchMoveHandlerRef = React.useRef(null);
  const LONG_PRESS_MS = 450;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const degNorm = (d) => ((d % 360) + 360) % 360;
  const presetOptions = [315, 0, 45];
  const cyclePreset = (idx) => {
    const curr = degNorm(positions[idx]?.rotation || 0);
    let curIndex = presetOptions.findIndex((p) => Math.abs(p - curr) <= 10);
    if (curIndex === -1) {
      let minDist = 999, minIdx = 0;
      for (let i = 0; i < presetOptions.length; i++) {
        const a = presetOptions[i];
        let diff = Math.abs(a - curr);
        diff = Math.min(diff, 360 - diff);
        if (diff < minDist) { minDist = diff; minIdx = i; }
      }
      curIndex = minIdx;
    }
    const next = presetOptions[(curIndex + 1) % presetOptions.length];
    updateRotation(idx, next);
  };

  React.useEffect(() => {
    return () => clearLongPressTimer();
  }, []);

  const updatePos = (idx, px, py) => {
    const el = ref.current;
    if (!el || !positions || !Array.isArray(positions)) return;
    
    const rect = el.getBoundingClientRect();
    const rawX = ((px - rect.left) / rect.width) * 100;
    const rawY = ((py - rect.top) / rect.height) * 100;
    const xPct = clamp(rawX, 5, 95);
    const yPct = clamp(rawY, 5, 95);
    const step = 5;
    const xSnap = clamp(Math.round(xPct / step) * step, 5, 95);
    const ySnap = clamp(Math.round(yPct / step) * step, 5, 95);
    const next = positions.map((p, i) => (i === idx ? { ...p, x: xSnap, y: ySnap } : p));
    
    if (onChange && typeof onChange === 'function') {
      onChange(next);
    }
  };

  const updateRotation = (idx, newRotation) => {
    if (!positions || !Array.isArray(positions)) return;
    const normalized = ((newRotation % 360) + 360) % 360;
    const next = positions.map((p, i) => (i === idx ? { ...p, rotation: normalized } : p));
    
    if (onChange && typeof onChange === 'function') {
      onChange(next);
    }
  };

  const onDown = (e, idx) => {
    const isTouch = !!e.touches;
    setSelectedCard(idx);

    const point = isTouch ? e.touches[0] : e;
    draggingRef.current.startX = point.clientX;
    draggingRef.current.startY = point.clientY;
    draggingRef.current.startedAt = Date.now();
    draggingRef.current.moved = false;

    const beginDrag = () => {
      draggingRef.current.idx = idx;
      document.addEventListener("mousemove", onMove, { passive: false });
      document.addEventListener("mouseup", onUp, { passive: false });
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp, { passive: false });
    };

    if (isTouch) {
      // Don't block scrolling unless user long-presses to drag
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        beginDrag();
      }, 300);

      const preMove = (te) => {
        const p = te.touches ? te.touches[0] : te;
        const dx = Math.abs(p.clientX - draggingRef.current.startX);
        const dy = Math.abs(p.clientY - draggingRef.current.startY);
        if (dx > 8 || dy > 8) {
          // user is scrolling, cancel drag
          clearLongPressTimer();
          if (ref.current && preTouchMoveHandlerRef.current) {
            ref.current.removeEventListener("touchmove", preTouchMoveHandlerRef.current);
            preTouchMoveHandlerRef.current = null;
          }
        }
      };
      preTouchMoveHandlerRef.current = preMove;
      if (ref.current) {
        ref.current.addEventListener("touchmove", preMove, { passive: true });
      }
    } else {
      // Mouse: start dragging immediately
      e.preventDefault();
      e.stopPropagation();
      beginDrag();
    }
  };

  const onMove = (e) => {
    const idx = draggingRef.current.idx;
    if (idx < 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const point = e.touches ? e.touches[0] : e;
    draggingRef.current.moved = true;
    updatePos(idx, point.clientX, point.clientY);
  };

  const onUp = () => {
    const idx = draggingRef.current.idx;

    clearLongPressTimer();
    if (ref.current && preTouchMoveHandlerRef.current) {
      ref.current.removeEventListener("touchmove", preTouchMoveHandlerRef.current);
      preTouchMoveHandlerRef.current = null;
    }

    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);

    draggingRef.current.idx = -1;
    draggingRef.current.moved = false;
  };

  const handleRotate = (idx, degrees) => {
    const currentRotation = positions[idx]?.rotation || 0;
    const newRotation = currentRotation + degrees;
    updateRotation(idx, newRotation);
  };

  const handleResetRotation = (idx) => {
    updateRotation(idx, 0);
  };

  const safePositions = React.useMemo(() => {
    return Array.isArray(positions) ? positions : [];
  }, [positions]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const cardWidth = isMobile ? 80 : 60;
  const cardHeight = Math.round(cardWidth * CARD_ASPECT_RATIO);

  return (
    <div
      ref={ref}
      className={`relative w-full border border-white/20 rounded-xl overflow-visible ${className}`}
      style={{
         aspectRatio,
         backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
         backgroundSize: "cover",
         backgroundPosition: "center",
         touchAction: "pan-y",
         userSelect: "none",
       }}
      onClick={() => setSelectedCard(null)}
    >
      {/* Grid background */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <svg width="100%" height="100%">
            {[...Array(10)].map((_, i) => (
              <line key={`v-${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="white" strokeWidth="0.5" />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="white" strokeWidth="0.5" />
            ))}
          </svg>
        </div>
      )}

      {/* Position cards */}
      {safePositions.map((p, i) => {
        const rotation = p?.rotation || 0;
        const isSelected = selectedCard === i;

        return (
          <div
            key={i}
            className="absolute"
            style={{ 
              left: `${p?.x || 50}%`, 
              top: `${p?.y || 50}%`, 
              transform: `translate(-50%, -50%)`,
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              zIndex: isSelected ? 100 : 10,
            }}
          >
            {/* Card */}
            <div
              onMouseDown={(e) => onDown(e, i)}
              onTouchStart={(e) => onDown(e, i)}
              onClick={(e) => {
                e.stopPropagation();
                // Tap rotation handled onUp; selection managed onDown
              }}
              className={`relative w-full h-full cursor-move transition-all duration-200 group ${
                isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-2xl' : 'hover:shadow-xl'
              }`}
              style={{ 
                touchAction: "pan-y", 
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-indigo-600/80 rounded-lg border-2 border-purple-400/60 shadow-xl backdrop-blur-sm">
                <div className="absolute inset-0 rounded-lg opacity-20" style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255,255,255,0.1) 10px,
                    rgba(255,255,255,0.1) 20px
                  )`
                }} />
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 rounded-full bg-white/90 border-2 border-purple-300 flex items-center justify-center shadow-lg">
                    <span className="text-purple-900 font-bold text-sm">{i + 1}</span>
                  </div>
                </div>

                {rotation !== 0 && (
                  <div className="absolute top-1 right-1 bg-cyan-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                    {rotation}°
                  </div>
                )}
              </div>
            </div>

            {/* Card name below */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none"
              style={{ top: '100%' }}
            >
              <Badge className="bg-purple-600/90 border-purple-400/60 text-white text-[10px] px-2 py-0.5 shadow-lg">
                {p?.name || `Position ${i + 1}`}
              </Badge>
            </div>

            {/* Rotation controls - Long-press fine adjust */}
            {isSelected && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 mt-2 bg-slate-900/95 backdrop-blur-sm rounded-xl p-2 shadow-2xl border border-cyan-400/40"
                style={{ top: 'calc(100% + 26px)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="lg"
                  className="h-10 px-4 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate(i, -15);
                  }}
                  title="Rotate -15°"
                >
                  <RotateCcw className="w-4 h-4 mr-1" /> -15°
                </Button>
                
                <div className="px-3 py-1 bg-slate-800 rounded text-sm font-bold text-cyan-300 min-w-[56px] text-center">
                  {rotation}°
                </div>
                
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => updateRotation(i, parseInt(e.target.value, 10))}
                  className="w-28 sm:w-40 accent-cyan-500"
                />
                
                <Button
                  size="lg"
                  className="h-10 px-4 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate(i, 15);
                  }}
                  title="Rotate +15°"
                >
                  +15° <RotateCw className="w-4 h-4 ml-1" />
                </Button>

                {rotation !== 0 && (
                  <Button
                    size="lg"
                    className="h-10 w-10 p-0 bg-slate-700 hover:bg-slate-600 text-white ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetRotation(i);
                    }}
                    title="Reset rotation"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Instructions */}
      {safePositions.length > 0 && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80 pointer-events-none shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold">Drag to move • Tap to select • Use rotate buttons</span>
          </div>
        </div>
      )}
    </div>
  );
}