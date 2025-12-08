import React, { useRef, useState, useEffect } from 'react';

export default function ScratchRevealCard({ 
  frontImage, 
  backImage, 
  cardName, 
  isReversed, 
  onReveal,
  width,
  height 
}) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * 2; // 2x for retina
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Draw scratch overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Add pattern
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    for (let i = 0; i < rect.height; i += 4) {
      ctx.fillRect(0, i, rect.width, 2);
    }
  }, [width, height]);

  const scratch = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 40, 0, 2 * Math.PI);
    ctx.fill();

    // Check if revealed
    checkRevealPercentage();
  };

  const checkRevealPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }

    const percentage = (transparent / (pixels.length / 4)) * 100;
    setScratchPercentage(percentage);

    if (percentage > 60 && !isRevealed) {
      setIsRevealed(true);
      onReveal();
    }
  };

  const handleStart = (e) => {
    setIsScratching(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    scratch(x, y);
  };

  const handleMove = (e) => {
    if (!isScratching) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    scratch(x, y);
  };

  const handleEnd = () => {
    setIsScratching(false);
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Card front */}
      <div className="absolute inset-0">
        {frontImage ? (
          <img
            src={frontImage}
            alt={cardName}
            className={`w-full h-full object-cover rounded-lg ${isReversed ? 'rotate-180' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg flex items-center justify-center">
            <span className="text-white/90 text-center px-2 font-semibold">{cardName}</span>
          </div>
        )}
      </div>

      {/* Scratch overlay */}
      {!isRevealed && (
        <>
          {/* Card back behind scratch */}
          <div className="absolute inset-0 pointer-events-none">
            {backImage ? (
              <img
                src={backImage}
                alt="Card back"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-800 rounded-lg" />
            )}
          </div>

          {/* Scratch canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-lg cursor-grab active:cursor-grabbing"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{ touchAction: 'none' }}
          />

          {/* Progress hint */}
          {scratchPercentage > 0 && scratchPercentage < 60 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-900/90 text-white text-xs px-3 py-1 rounded-full">
              {Math.round(scratchPercentage)}% revealed
            </div>
          )}

          {/* Scratch instruction */}
          {scratchPercentage === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg animate-pulse">
                ✨ Scratch to reveal
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}