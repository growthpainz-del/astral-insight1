
import React from "react";
import { Eye, RotateCcw } from "lucide-react";

export default function CensorReveal({
  src,
  alt = "",
  mode = "click", // 'click' | 'scratch'
  blurAmount = 20,
  overlayColor = "rgba(0,0,0,0.9)",
  className = "",
  rounded = "",
  fillParent = false,
  onRevealedTap, // callback when fully revealed (used to open quick preview)
}) {
  const containerRef = React.useRef(null);

  // For both modes
  const [isRevealed, setIsRevealed] = React.useState(false);

  // Scratch-specific
  const canvasRef = React.useRef(null);
  const isDrawingRef = React.useRef(false);
  const [hasScratched, setHasScratched] = React.useState(false);
  const [canvasReady, setCanvasReady] = React.useState(false);
  const lastPointRef = React.useRef({ x: 0, y: 0 });
  const [clearedPercent, setClearedPercent] = React.useState(0);

  // Helper: schedule a task with requestIdleCallback if available, otherwise setTimeout
  const scheduleIdle = (fn) => {
    const ric = typeof globalThis !== "undefined" && typeof globalThis.requestIdleCallback === "function"
      ? globalThis.requestIdleCallback
      : null;
    if (ric) {
      ric(fn);
    } else {
      setTimeout(fn, 0);
    }
  };

  const initCanvas = React.useCallback(() => {
    if (mode !== "scratch") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Match canvas size to container box
    const rect = container.getBoundingClientRect();
    canvas.width = Math.max(2, Math.floor(rect.width));
    canvas.height = Math.max(2, Math.floor(rect.height));

    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setHasScratched(false);
    setClearedPercent(0);
    setCanvasReady(true);
  }, [overlayColor, mode]);

  React.useEffect(() => {
    if (mode === "scratch") {
      initCanvas();
      const onResize = () => {
        initCanvas();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [initCanvas, mode]);

  const handleRevealClick = () => {
    if (isRevealed) {
      onRevealedTap?.();
      return;
    }
    setIsRevealed(true);
    // Immediately open quick preview after reveal for click mode UX
    onRevealedTap?.();
  };

  // Scratch handlers
  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: cx, y: cy };
  };

  const drawTo = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = Math.max(16, Math.floor(canvas.width * 0.04)); // adaptive brush
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  };

  const startScratch = (e) => {
    if (mode !== "scratch" || !canvasReady) return;
    e.preventDefault();
    setHasScratched(true);
    const { x, y } = getPos(e);
    lastPointRef.current = { x, y };
    isDrawingRef.current = true;
  };

  const moveScratch = (e) => {
    if (mode !== "scratch" || !isDrawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    drawTo(x, y);
  };

  const stopScratch = () => {
    if (mode !== "scratch") return;
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Use safe scheduling (works on Safari/iOS too)
    scheduleIdle(() => computeClearedPercent());
  };

  const computeClearedPercent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    try {
      const { width, height } = canvas;
      const img = ctx.getImageData(0, 0, width, height);
      const total = width * height;
      let cleared = 0;
      // Count mostly transparent pixels
      for (let i = 3; i < img.data.length; i += 4) {
        if (img.data[i] < 15) cleared++;
      }
      const percent = (cleared / total) * 100;
      setClearedPercent(percent);

      if (percent > 55 && !isRevealed) {
        setIsRevealed(true);
        // Once enough is revealed, remove the canvas and open quick preview
        onRevealedTap?.();
      }
    } catch {
      // If cross-origin issues, just ignore coverage calc
    }
  };

  const resetScratch = () => {
    if (mode !== "scratch") return;
    setIsRevealed(false);
    initCanvas();
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${rounded} ${fillParent ? "w-full h-full" : ""} overflow-hidden`}
    >
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${className}`}
        draggable={false}
      />

      {/* Click-to-reveal overlay */}
      {mode === "click" && !isRevealed && (
        <button
          type="button"
          onClick={handleRevealClick}
          className="absolute inset-0 w-full h-full"
          style={{
            background: overlayColor,
            backdropFilter: `blur(${Math.max(0, Number(blurAmount) || 0)}px)`,
          }}
          aria-label="Click to reveal"
        />
      )}

      {/* Scratch-to-reveal overlay */}
      {mode === "scratch" && !isRevealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onMouseDown={startScratch}
          onMouseMove={moveScratch}
          onMouseUp={stopScratch}
          onMouseLeave={stopScratch}
          onTouchStart={startScratch}
          onTouchMove={moveScratch}
          onTouchEnd={stopScratch}
          style={{ touchAction: "none" }}
        />
      )}

      {/* Compact controls: bottom-right (do not obstruct image) */}
      {!isRevealed && (
        <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2 pointer-events-auto">
          {mode === "scratch" ? (
            <>
              <span className="bg-black/60 text-white/80 text-[10px] px-2 py-1 rounded-full border border-white/20">
                Rub to reveal
              </span>
              <button
                type="button"
                onClick={resetScratch}
                className="btn-dark-outline text-[10px] px-2 py-1 rounded-full"
                aria-label="Reset cover"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRevealClick}
              className="btn-dark-outline text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
              aria-label="Reveal"
            >
              <Eye className="w-3 h-3" />
              Reveal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
