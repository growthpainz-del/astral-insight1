import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import { calculateCardSize } from "@/components/utils/cardSizing";

export default function SpreadLayout({ 
  spread, 
  positions = [], 
  cards = [], 
  deck = null,
  revealedCards = new Set(), 
  onCardReveal = () => {},
  onCardClick = () => {},
  enableExternalDrops = false,
  onExternalDrop = () => {},
  allowReposition = false,
  onPositionUpdate = () => {},
  sizeScale = 1
}) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPinching = useRef(false);

  // Default to false unless ALL positions have x/y
  const hasCoordinates = positions && positions.length > 0 && 
    positions.every(p => p && typeof p.x === 'number' && typeof p.y === 'number');

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isFullscreen]);

  // Touch handlers for Pan/Zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isPinching.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      containerRef.current.dataset.startDist = dist;
      containerRef.current.dataset.startZoom = zoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinching.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const startDist = parseFloat(containerRef.current.dataset.startDist);
      const startZoom = parseFloat(containerRef.current.dataset.startZoom);
      const newZoom = Math.min(Math.max(0.5, startZoom * (dist / startDist)), 3);
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    isPinching.current = false;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const { cardWidth: cardW, cardHeight: cardH } = calculateCardSize(
    containerSize.width, 
    positions.length, 
    containerSize.width <= containerSize.height
  );
  
  const actualCardW = cardW * sizeScale;
  const actualCardH = cardH * sizeScale;

  const renderCardSlot = (pos, index) => {
    const cardData = cards[index];
    const isRevealed = revealedCards.has(index);
    
    // Positioning
    const isCoordinate = hasCoordinates;
    const style = isCoordinate ? {
      position: 'absolute',
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)`,
      width: actualCardW,
      height: actualCardH,
    } : {
      position: 'relative',
      width: actualCardW,
      height: actualCardH,
      flexShrink: 0
    };

    return (
      <div 
        key={index}
        style={style}
        className={`group ${allowReposition ? 'cursor-move' : ''}`}
        onDragOver={enableExternalDrops ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } : undefined}
        onDrop={enableExternalDrops ? (e) => {
          e.preventDefault();
          try {
            const data = e.dataTransfer.getData('application/json');
            if (!data) return;
            const payload = JSON.parse(data);
            if (payload.source === 'bottom-shelf') {
              onExternalDrop({ targetIndex: index, cardIndex: payload.cardIndex });
            }
          } catch(err) { console.error('Drop error', err); }
        } : undefined}
        onClick={() => {
          if (!cardData) return;
          if (!isRevealed) {
            onCardReveal(index);
          } else {
            onCardClick(cardData, index);
          }
        }}
      >
        <div className="w-full h-full relative" style={{ perspective: "1000px" }}>
          <motion.div
            initial={false}
            animate={{ rotateY: isRevealed ? 0 : 180 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* FRONT (Revealed) */}
            <div 
              className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900 backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              {cardData ? (
                cardData.image_url ? (
                  <img src={cardData.image_url} alt={cardData.name} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-indigo-900 to-purple-900 pointer-events-none">
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base leading-tight drop-shadow-md">{cardData.name}</p>
                  </div>
                )
              ) : null}
              {cardData && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              )}
            </div>

            {/* BACK (Hidden/Empty) */}
            <div 
              className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 backface-hidden"
              style={{ 
                backfaceVisibility: "hidden", 
                transform: "rotateY(180deg)",
                background: "radial-gradient(circle at center, #4c1d95 0%, #1e1b4b 100%)"
              }}
            >
              {cardData ? (
                deck?.back_image_url ? (
                  <img src={deck.back_image_url} alt="Back" className="w-full h-full object-cover opacity-80 pointer-events-none" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-50">
                    <div className="w-1/2 h-1/2 border border-purple-400/30 rounded flex items-center justify-center">
                      <Sparkles className="w-1/2 h-1/2 text-purple-400" />
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm border-2 border-dashed border-purple-500/30">
                  <span className="text-purple-300/50 font-bold text-lg">{index + 1}</span>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Position Label - Render outside the 3D card so it doesn't flip */}
          {pos?.name && spread?.requires_positions !== false && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none transition-opacity duration-300 opacity-70 group-hover:opacity-100">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/30 text-[10px] md:text-xs text-purple-200 font-medium shadow-xl">
                {pos.name}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determine wrapper class based on coordinates
  const wrapperClass = hasCoordinates 
    ? "relative w-full h-full min-h-[60vh]"
    : "flex flex-wrap items-center justify-center gap-8 w-full p-8 min-h-[60vh] max-w-5xl mx-auto";

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex flex-col bg-slate-900/50 rounded-xl border border-purple-500/20 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        <button onClick={resetView} className="p-2 bg-black/50 hover:bg-purple-900/50 rounded-lg text-purple-300 backdrop-blur-md transition-colors border border-purple-500/30">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={toggleFullscreen} className="p-2 bg-black/50 hover:bg-purple-900/50 rounded-lg text-purple-300 backdrop-blur-md transition-colors border border-purple-500/30">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-auto touch-pan-x touch-pan-y relative w-full h-full flex items-center justify-center p-4 md:p-8">
        <motion.div 
          className={wrapperClass}
          animate={{ x: pan.x, y: pan.y, scale: zoom }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {positions.map((pos, idx) => renderCardSlot(pos, idx))}
        </motion.div>
      </div>
    </div>
  );
}