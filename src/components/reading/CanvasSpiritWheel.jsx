import React, { useRef, useEffect, useState } from 'react';

export default function CanvasSpiritWheel({
  wheelData,
  rotations,
  activeTheme,
  metatron,
  zoomLevel = 1,
  isSpinning = false,
  showLabels = false
}) {
  const canvasRef = useRef(null);
  const imageCache = useRef({});
  const [, forceUpdate] = React.useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // High DPI Display support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Only resize canvas internal resolution if it mismatches
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    } else {
      // Reset transform before clearing
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const width = rect.width;
    const height = rect.height;
    if (width <= 0 || height <= 0) return;
    
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.max(0.1, Math.min(cx, cy) - 40);

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background Glow / Ambient
    const bgGlow = ctx.createRadialGradient(cx, cy, maxRadius * 0.5, cx, cy, maxRadius);
    bgGlow.addColorStop(0, 'rgba(0,0,0,0)');
    bgGlow.addColorStop(1, activeTheme?.outerBorder ? `${activeTheme.outerBorder}40` : 'rgba(120,0,255,0.2)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    // 2. Metatron overlay
    if (metatron?.enabled) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((metatron.rotation || 0) * Math.PI / 180);
      ctx.strokeStyle = metatron.color || 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -maxRadius);
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
      }
      ctx.beginPath();
      ctx.arc(0, 0, maxRadius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Rings
    const drawRing = (items, rOut, rIn, rotDeg, config) => {
      if (!items || !items.length) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotDeg * Math.PI / 180);

      const angle = (Math.PI * 2) / items.length;

      items.forEach((item, i) => {
        const start = i * angle - angle / 2 - Math.PI / 2;
        const end = start + angle;

        // Segment background
        ctx.beginPath();
        ctx.arc(0, 0, rOut, start, end);
        ctx.arc(0, 0, rIn, end, start, true);
        ctx.closePath();
        
        ctx.fillStyle = item.color || config.bg || '#111';
        ctx.fill();
        
        // Segment border
        ctx.strokeStyle = config.border || '#FFF';
        ctx.lineWidth = config.thickness || 2;
        ctx.stroke();

        // Text / Label
        ctx.save();
        const textAngle = start + angle / 2;
        const textRad = rIn + (rOut - rIn) / 2;
        ctx.rotate(textAngle);
        ctx.translate(textRad, 0);
        ctx.rotate(Math.PI / 2);
        
        ctx.fillStyle = config.text || '#FFF';
        ctx.font = `bold ${config.fontSize || 14}px ${activeTheme?.fontFamily || 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const isUrl = typeof item.id === 'string' && (item.id.startsWith('http') || item.id.startsWith('data:image'));
        
        if (isUrl) {
          let img = imageCache.current[item.id];
          if (!img) {
            img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => forceUpdate(n => n + 1);
            img.src = item.id;
            imageCache.current[item.id] = img;
          }
          if (img.complete && img.naturalWidth > 0) {
            const size = (rOut - rIn) * 0.6;
            if (showLabels && (item.label || item.name)) {
              ctx.drawImage(img, -size / 2, -size / 2 - 8, size, size);
              ctx.font = `bold ${Math.max(8, (config.fontSize || 14) - 4)}px ${activeTheme?.fontFamily || 'sans-serif'}`;
              let txt = item.label || item.name;
              if (txt.length > 12) txt = txt.substring(0, 10) + '..';
              ctx.fillText(txt, 0, size / 2 + 6);
            } else {
              ctx.drawImage(img, -size / 2, -size / 2, size, size);
            }
          }
        } else {
          // If id is just a generic fallback number string (e.g. "1"), prefer the name/label
          const isFallbackId = /^\d+$/.test(item.id);
          let txt = (isFallbackId ? (item.label || item.name) : item.id) || item.label || item.name || '';
          if (txt.length > 12) txt = txt.substring(0, 10) + '..';
          ctx.fillText(txt, 0, 0);
        }
        
        ctx.restore();
      });
      ctx.restore();
    };

    const t = activeTheme || {};
    drawRing(wheelData.outer1, maxRadius, maxRadius * 0.85, rotations.outer1, { bg: t.outerBg, border: t.outerBorder, text: t.textOuter, thickness: t.borderThickness });
    drawRing(wheelData.outer2, maxRadius * 0.85, maxRadius * 0.70, rotations.outer2, { bg: t.outerBg, border: t.outerBorder, text: t.textOuter, thickness: t.borderThickness });
    drawRing(wheelData.middle, maxRadius * 0.70, maxRadius * 0.50, rotations.middle, { bg: t.middleBg, border: t.middleBorder, text: t.textMiddle, thickness: t.borderThickness });
    drawRing(wheelData.inner, maxRadius * 0.50, maxRadius * 0.30, rotations.inner, { bg: t.innerBg, border: t.innerBorder, text: t.textInner, thickness: t.borderThickness });
    
    // 5th ring: Rune
    if (wheelData.rune && wheelData.rune.length > 0) {
      drawRing(wheelData.rune, maxRadius * 0.30, maxRadius * 0.15, rotations.rune || 0, { bg: '#F97316', border: '#ea580c', text: '#fff', thickness: 2 });
    }

    // 4. Center Hub
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = t.hubBg || '#000';
    ctx.fill();
    ctx.strokeStyle = t.hubBorder || '#FFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.fillStyle = '#FFF';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.hubIcon || '👁️', 0, 0);
    ctx.restore();

    // 5. Roulette Track and Marble
    ctx.save();
    ctx.translate(cx, cy);
    
    // Draw subtle outer track for marble
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius + 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)';
    ctx.lineWidth = 16;
    ctx.stroke();
    
    // Draw marble
    ctx.save();
    const marbleRot = rotations.marble || 0;
    ctx.rotate((marbleRot - 90) * Math.PI / 180);
    
    // Marble body
    ctx.beginPath();
    ctx.arc(maxRadius + 14, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#E2E8F0'; // silver marble base
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Highlight / reflection
    ctx.beginPath();
    ctx.arc(maxRadius + 12, -2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.restore();
    
    // Keep a subtle indicator at the top to mark the "reading point"
    ctx.beginPath();
    ctx.moveTo(0, -maxRadius - 26);
    ctx.lineTo(-8, -maxRadius - 38);
    ctx.lineTo(8, -maxRadius - 38);
    ctx.closePath();
    ctx.fillStyle = '#D4AF37';
    ctx.fill();

    ctx.restore();

  }, [wheelData, rotations, activeTheme, metatron, zoomLevel]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full max-w-[850px] max-h-[850px] mx-auto rounded-full transition-transform duration-300 ${isSpinning ? 'animate-pulse' : ''}`}
      style={{ transform: `scale(${zoomLevel})` }}
    />
  );
}