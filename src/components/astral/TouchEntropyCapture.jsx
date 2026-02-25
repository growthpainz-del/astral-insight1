import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Loader2, Fingerprint, Activity, Smartphone, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TouchEntropyCapture({ 
  onCaptureComplete, 
  minDuration = 3000, 
  className 
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entropyScore, setEntropyScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, pressure: 0, accel: 0 });
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const startTimeRef = useRef(0);
  const accelRef = useRef({ x: 0, y: 0, z: 0 });
  
  // Initialize permission status check
  useEffect(() => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS 13+ requires permission
      setPermissionGranted(false);
    } else {
      // Non-iOS or older devices usually don't need explicit permission for basic motion
      setPermissionGranted(true);
    }
  }, []);

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
        }
      } catch (e) {
        console.error("Motion permission error:", e);
      }
    } else {
      setPermissionGranted(true);
    }
  };

  // Accelerometer listener
  useEffect(() => {
    if (!permissionGranted) return;

    const handleMotion = (event) => {
      if (event.accelerationIncludingGravity) {
        const { x, y, z } = event.accelerationIncludingGravity;
        accelRef.current = { x: x || 0, y: y || 0, z: z || 0 };
        // Calculate magnitude of "tremor" (high pass filter concept roughly)
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        // Normalize roughly around 9.8m/s^2 gravity
        const tremor = Math.abs(magnitude - 9.8);
        
        if (isCapturing) {
           setDebugInfo(prev => ({ ...prev, accel: tremor.toFixed(2) }));
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionGranted, isCapturing]);

  // Canvas visualizer loop
  useEffect(() => {
    if (!isCapturing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Fit canvas to parent
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      // Fade out effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw points
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      const now = Date.now();
      const activePoints = pointsRef.current.filter(p => now - p.timestamp < 1000); // Keep last 1s trace
      
      if (activePoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(activePoints[0].x, activePoints[0].y);
        
        for (let i = 1; i < activePoints.length; i++) {
          const p = activePoints[i];
          ctx.strokeStyle = `hsl(${p.pressure * 200 + 200}, 80%, 60%)`;
          ctx.lineWidth = Math.max(1, p.pressure * 10);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCapturing]);

  const handlePointerDown = (e) => {
    e.preventDefault(); // Prevent scrolling
    setIsCapturing(true);
    setIsComplete(false);
    setProgress(0);
    setEntropyScore(0);
    pointsRef.current = [];
    startTimeRef.current = Date.now();
    
    // Haptic feedback start
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handlePointerMove = (e) => {
    if (!isCapturing) return;
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 0.5; // Default if device doesn't support pressure
    
    // Add point data
    pointsRef.current.push({
      x, 
      y, 
      pressure,
      timestamp: Date.now(),
      accel: { ...accelRef.current }
    });
    
    setDebugInfo(prev => ({ ...prev, x: Math.round(x), y: Math.round(y), pressure: pressure.toFixed(2) }));
    
    // Calculate progress
    const elapsed = Date.now() - startTimeRef.current;
    const newProgress = Math.min(100, (elapsed / minDuration) * 100);
    setProgress(newProgress);
    
    // Calculate live entropy (simplified chaos metric)
    // Variance in pressure + Variance in acceleration + Path jitter
    if (pointsRef.current.length > 10) {
       const recent = pointsRef.current.slice(-10);
       const pressureVar = recent.reduce((sum, p) => sum + Math.abs(p.pressure - 0.5), 0);
       const accelVar = recent.reduce((sum, p) => sum + (Math.abs(p.accel.x) + Math.abs(p.accel.y)), 0);
       setEntropyScore(prev => Math.min(100, prev + (pressureVar + accelVar) * 0.1));
    }

    if (elapsed >= minDuration && !isComplete) {
      handleComplete();
    }
  };

  const handlePointerUp = (e) => {
    if (isCapturing && progress < 100) {
      // Failed / Cancelled
      setIsCapturing(false);
      setProgress(0);
      pointsRef.current = [];
    }
  };

  const handleComplete = () => {
    setIsCapturing(false);
    setIsComplete(true);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success pulse
    
    const finalData = {
      duration: Date.now() - startTimeRef.current,
      points: pointsRef.current,
      entropyScore: Math.min(100, Math.round(entropyScore * 10) / 10),
      timestamp: new Date().toISOString()
    };
    
    if (onCaptureComplete) {
      onCaptureComplete(finalData);
    }
  };

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-white/20 bg-black/40 backdrop-blur-md select-none touch-none", className)}>
      
      {/* Visualizer Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      />
      
      {/* UI Overlay */}
      <div 
        className="relative z-10 w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <AnimatePresence mode="wait">
          {!isCapturing && !isComplete && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-4 pointer-events-none"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center animate-pulse">
                <Fingerprint className="w-10 h-10 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-100">Establish Connection</h3>
                <p className="text-sm text-cyan-300/70">Press and hold to calibrate your energetic signature</p>
              </div>
              
              {!permissionGranted && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => { e.stopPropagation(); requestMotionPermission(); }}
                  className="pointer-events-auto border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Enable Motion Sensors
                </Button>
              )}
            </motion.div>
          )}

          {isCapturing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none w-full max-w-xs space-y-4"
            >
              <div className="text-center">
                 <h3 className="text-lg font-mono text-cyan-200 tracking-widest animate-pulse">CAPTURING ENTROPY</h3>
                 <div className="flex justify-center gap-4 text-xs font-mono text-cyan-400 mt-2">
                   <div className="flex items-center gap-1">
                     <Activity className="w-3 h-3" />
                     {debugInfo.accel} G
                   </div>
                   <div className="flex items-center gap-1">
                     <Fingerprint className="w-3 h-3" />
                     {debugInfo.pressure} P
                   </div>
                 </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 w-full bg-cyan-900/50 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}

          {isComplete && (
            <motion.div 
               initial={{ opacity: 0, scale: 1.1 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-4 pointer-events-auto"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-100">Signature Captured</h3>
                <p className="text-sm text-emerald-300">Entropy Score: <span className="font-mono font-bold text-lg">{entropyScore}</span></p>
              </div>
              <Button 
                onClick={(e) => { e.stopPropagation(); setIsComplete(false); }}
                variant="outline"
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalibrate
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}