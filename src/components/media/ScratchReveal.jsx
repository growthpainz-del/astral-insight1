import React, { useEffect, useRef, useState } from "react";

export default function ScratchReveal({
  children,
  threshold = 0.5,
  overlayOpacity = 0.85,
  blurAmount = 20,
  strokeRadius = 22,
  onRevealed,
  className = "",
  style = {},
  hintText = "Rub to reveal",
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  // Initialize canvas overlay
  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return;

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const resize = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.resetTransform?.();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Clear and fill with overlay
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
      ctx.fillRect(0, 0, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [overlayOpacity]);

  // Scratch logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let drawing = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const isTouch = e.touches && e.touches.length;
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const eraseAt = (x, y) => {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.arc(x, y, strokeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const handleDown = (e) => {
      e.preventDefault();
      drawing = true;
      const { x, y } = getPos(e);
      eraseAt(x, y);
    };

    const handleMove = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      eraseAt(x, y);
    };

    const handleUp = async () => {
      drawing = false;
      // Check revealed %
      try {
        const w = canvas.width;
        const h = canvas.height;
        const sampleStride = 6;
        const data = ctx.getImageData(0, 0, w, h).data;
        let cleared = 0;
        let total = 0;
        for (let y = 0; y < h; y += sampleStride) {
          for (let x = 0; x < w; x += sampleStride) {
            const idx = (y * w + x) * 4 + 3;
            const a = data[idx];
            total++;
            if (a < 8) cleared++;
          }
        }
        const frac = cleared / total;
        if (frac >= threshold) {
          setRevealed(true);
          onRevealed && onRevealed();
        }
      } catch {
        // ignore
      }
    };

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    canvas.addEventListener("touchstart", handleDown, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("touchstart", handleDown);
      canvas.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [onRevealed, strokeRadius, threshold]);

  // Reset when children change
  useEffect(() => {
    setRevealed(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas && ctx) {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0,0,0,${overlayOpacity})`;
      ctx.fillRect(0, 0, w, h);
    }
  }, [children, overlayOpacity]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    >
      {/* Content layer - blurred until revealed */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          filter: revealed ? "none" : `blur(${blurAmount}px)`,
          transition: "filter 220ms ease-out",
        }}
      >
        {children}
      </div>

      {/* Scratch canvas overlay - only show when NOT revealed */}
      {!revealed && (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ 
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          />
          
          {/* Hint text */}
          {hintText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-3 py-1.5 rounded-full bg-black/55 border border-white/15 text-white/90 text-xs font-semibold">
                {hintText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}