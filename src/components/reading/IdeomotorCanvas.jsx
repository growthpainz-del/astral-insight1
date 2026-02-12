import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IdeomotorCanvas({ question, onComplete = () => {}, onCancel = () => {}, autoCompleteAfter = null, showInstructions = false, instructionText = "" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState([]);
  const [drawStart, setDrawStart] = useState(null);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    setCtx(context);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Style the drawing
    context.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Purple glow
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowBlur = 10;
    context.shadowColor = 'rgba(168, 85, 247, 0.5)';
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
        t: performance.now()
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: performance.now()
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setDrawStart(performance.now());
    const coords = getCoordinates(e);
    setPath([coords]);
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !ctx) return;

    const coords = getCoordinates(e);
    setPath(prev => [...prev, coords]);

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const endDrawing = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    setIsDrawing(false);
    
    // Calculate seed from path
    const duration = performance.now() - drawStart;
    const seed = calculateSeed(path, duration);
    
    // Call onComplete with the seed
    setTimeout(() => {
      onComplete(seed);
    }, 300); // Small delay for visual feedback
  };

  const calculateSeed = (pathData, duration) => {
    if (!pathData || pathData.length < 2) {
      return Date.now(); // Fallback to timestamp
    }

    // Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < pathData.length; i++) {
      const dx = pathData[i].x - pathData[i-1].x;
      const dy = pathData[i].y - pathData[i-1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate curvature (changes in direction)
    let curvature = 0;
    for (let i = 2; i < pathData.length; i++) {
      const dx1 = pathData[i-1].x - pathData[i-2].x;
      const dy1 = pathData[i-1].y - pathData[i-2].y;
      const dx2 = pathData[i].x - pathData[i-1].x;
      const dy2 = pathData[i].y - pathData[i-1].y;
      
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      curvature += Math.abs(angle2 - angle1);
    }

    // Calculate velocity variation (emotional intensity)
    let velocitySum = 0;
    for (let i = 1; i < pathData.length; i++) {
      const dx = pathData[i].x - pathData[i-1].x;
      const dy = pathData[i].y - pathData[i-1].y;
      const dt = pathData[i].t - pathData[i-1].t;
      if (dt > 0) {
        velocitySum += Math.sqrt(dx * dx + dy * dy) / dt;
      }
    }

    // Combine all factors into seed
    const seed = Math.floor(
      totalLength * 1000 + 
      curvature * 10000 + 
      duration * 100 + 
      velocitySum * 5000 +
      Date.now()
    );

    console.log('🎨 Ideomotor Seed Calculation:', {
      totalLength: totalLength.toFixed(2),
      curvature: curvature.toFixed(2),
      duration: duration.toFixed(2),
      velocitySum: velocitySum.toFixed(2),
      finalSeed: seed
    });

    return seed;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-purple-900/50 rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
        {/* Close button */}
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Channel Your Energy</h2>
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-purple-200 text-sm">
            Draw any shape or symbol without lifting your finger
          </p>
          <p className="text-purple-300/60 text-xs mt-1">
            Your subconscious movements will guide the cards
          </p>
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="w-full h-64 md:h-96 bg-black/40 rounded-xl border-2 border-purple-500/30 cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
          
          {/* Instruction overlay (shows when no path drawn) */}
          {path.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-purple-300/40 text-lg font-semibold">
                <div className="mb-2">✨</div>
                <div>Draw here to begin...</div>
              </div>
            </div>
          )}

          {/* Drawing feedback */}
          {isDrawing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-2 left-2 bg-purple-600/80 text-white text-xs px-3 py-1 rounded-full"
            >
              Channeling your energy...
            </motion.div>
          )}

          {/* Completion feedback */}
          {!isDrawing && path.length > 10 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-2 left-2 bg-green-600/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Energy captured!
            </motion.div>
          )}
        </div>

        {/* Stats display (optional, for debugging/transparency) */}
        {path.length > 0 && (
          <div className="mt-4 text-center text-xs text-purple-300/60">
            {path.length} points captured • {isDrawing ? 'Drawing...' : 'Complete'}
          </div>
        )}

        {/* Help text */}
        <div className="mt-4 text-center text-xs text-purple-300/40">
          💡 Tip: Draw slowly and intentionally, or quick and chaotic—your style matters
        </div>
      </div>
    </motion.div>
  );
}