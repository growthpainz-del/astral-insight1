import React, { useState, useRef } from 'react';

const MobileIdeomotorCapture = ({ cardId, onCaptureComplete, children }) => {
  const [isHolding, setIsHolding] = useState(false);
  const touchData = useRef([]);
  const startTime = useRef(null);

  const handlePointerDown = (e) => {
    setIsHolding(true);
    startTime.current = Date.now();
    touchData.current = [{ x: e.clientX, y: e.clientY, time: 0 }];
  };

  const handlePointerMove = (e) => {
    if (!isHolding) return;
    const elapsed = Date.now() - startTime.current;
    // Capture variance at ~30fps
    if (elapsed % 33 < 10) { 
      touchData.current.push({ x: e.clientX, y: e.clientY, time: elapsed });
    }
  };

  const handlePointerUp = () => {
    setIsHolding(false);
    const dwellTime = Date.now() - startTime.current;
    const entropy = calculatePathEntropy(touchData.current);
    
    // Send to Deno Edge / InvokeLLM via React Query
    if (onCaptureComplete) {
        onCaptureComplete({ cardId, dwellTime, entropy, rawPath: touchData.current });
    }
  };

  const calculatePathEntropy = (path) => {
    // Simple variance logic to detect "wiggle" vs "linear" intent
    if (path.length < 2) return 0;
    const totalDist = path.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.hypot(p.x - path[i-1].x, p.y - path[i-1].y), 0);
    return totalDist / path.length; // Returns a "wiggle" coefficient
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="divine-studio-card-hitbox touch-none select-none relative"
    >
      {children}
    </div>
  );
};

export default MobileIdeomotorCapture;