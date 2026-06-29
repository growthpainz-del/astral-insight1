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
    const maxRadius = Math.max(0.1, Math.min(cx, cy) - 85);

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
            img.onerror = () => { img.failed = true; forceUpdate(n => n + 1); };
            img.src = item.id;
            imageCache.current[item.id] = img;
          }
          if (img.complete && img.naturalWidth > 0 && !img.failed) {
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
          } else if (img.failed) {
            // Fallback to text if image fails to load
            let txt = item.label || item.name || 'Error';
            if (txt.length <= 3) {
              ctx.fillText(txt, 0, 0);
            } else {
              ctx.restore();
              ctx.save();
              ctx.rotate(textAngle);
              ctx.translate(rIn + 8, 0);
              ctx.fillStyle = config.text || '#FFF';
              ctx.font = `bold ${Math.max(8, (config.fontSize || 14) - 2)}px ${activeTheme?.fontFamily || 'sans-serif'}`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              const availWidth = rOut - rIn - 16;
              let finalTxt = txt;
              if (ctx.measureText(finalTxt).width > availWidth) {
                while (finalTxt.length > 3 && ctx.measureText(finalTxt + '..').width > availWidth) {
                  finalTxt = finalTxt.slice(0, -1);
                }
                finalTxt += '..';
              }
              let absoluteAngle = (textAngle + (rotDeg * Math.PI) / 180) % (2 * Math.PI);
              if (absoluteAngle < 0) absoluteAngle += 2 * Math.PI;
              if (absoluteAngle > Math.PI / 2 && absoluteAngle < (3 * Math.PI) / 2) {
                ctx.translate(availWidth, 0);
                ctx.rotate(Math.PI);
                ctx.textAlign = 'right';
              }
              ctx.fillText(finalTxt, 0, 0);
            }
          }
        } else {
          // If id is just a generic fallback number string (e.g. "1"), prefer the name/label
          const isFallbackId = /^\d+$/.test(item.id);
          let txt = (isFallbackId ? (item.label || item.name) : item.id) || item.label || item.name || '';
          
          if (txt.length <= 3) {
            ctx.fillText(txt, 0, 0);
          } else {
            // Draw longer text radially to avoid overlap
            ctx.restore();
            ctx.save();
            ctx.rotate(textAngle);
            ctx.translate(rIn + 8, 0);
            
            ctx.fillStyle = config.text || '#FFF';
            ctx.font = `bold ${Math.max(8, (config.fontSize || 14) - 2)}px ${activeTheme?.fontFamily || 'sans-serif'}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            const availWidth = rOut - rIn - 16;
            let finalTxt = txt;
            if (ctx.measureText(finalTxt).width > availWidth) {
              while (finalTxt.length > 3 && ctx.measureText(finalTxt + '..').width > availWidth) {
                finalTxt = finalTxt.slice(0, -1);
              }
              finalTxt += '..';
            }
            
            // Flip text on the left half so it remains readable
            let absoluteAngle = (textAngle + (rotDeg * Math.PI) / 180) % (2 * Math.PI);
            if (absoluteAngle < 0) absoluteAngle += 2 * Math.PI;
            if (absoluteAngle > Math.PI / 2 && absoluteAngle < (3 * Math.PI) / 2) {
              ctx.translate(availWidth, 0);
              ctx.rotate(Math.PI);
              ctx.textAlign = 'right';
            }
            
            ctx.fillText(finalTxt, 0, 0);
          }
        }
        
        ctx.restore();
      });
      ctx.restore();
    };

    const t = activeTheme || {};
    
    const activeRings = [];
    if (wheelData.outer1 && wheelData.outer1.length > 0) activeRings.push({ data: wheelData.outer1, rot: rotations.outer1, bg: t.outerBg, border: t.outerBorder, text: t.textOuter });
    if (wheelData.outer2 && wheelData.outer2.length > 0) activeRings.push({ data: wheelData.outer2, rot: rotations.outer2, bg: t.outerBg, border: t.outerBorder, text: t.textOuter });
    if (wheelData.middle && wheelData.middle.length > 0) activeRings.push({ data: wheelData.middle, rot: rotations.middle, bg: t.middleBg, border: t.middleBorder, text: t.textMiddle });
    if (wheelData.inner && wheelData.inner.length > 0) activeRings.push({ data: wheelData.inner, rot: rotations.inner, bg: t.innerBg, border: t.innerBorder, text: t.textInner });

    const hasRune = wheelData.rune && wheelData.rune.length > 0;
    const innerBoundary = hasRune ? maxRadius * 0.30 : maxRadius * 0.15;
    const totalSpace = maxRadius - innerBoundary;
    const numRings = Math.max(1, activeRings.length);
    const ringWidth = totalSpace / numRings;

    let currentOut = maxRadius;
    activeRings.forEach(ring => {
      const currentIn = currentOut - ringWidth;
      drawRing(ring.data, currentOut, currentIn, ring.rot, { bg: ring.bg, border: ring.border, text: ring.text, thickness: t.borderThickness });
      currentOut = currentIn;
    });
    
    // 5th ring: Rune
    if (hasRune) {
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

    // 5. Roulette Tracks and Marbles (on their own individual rings)
    ctx.save();
    ctx.translate(cx, cy);
    
    const marblePositions = [
      { label: "PAST", id: "marble1", initialAngle: -90, color: "#94A3B8", distance: maxRadius + 14 }, // Silver
      { label: "PRESENT", id: "marble2", initialAngle: 30, color: "#D4AF37", distance: maxRadius + 38 }, // Gold
      { label: "FUTURE", id: "marble3", initialAngle: 150, color: "#8B5CF6", distance: maxRadius + 62 } // Purple
    ];
    
    marblePositions.forEach(pos => {
      // Draw individual subtle track for this marble
      ctx.beginPath();
      ctx.arc(0, 0, pos.distance, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
      ctx.lineWidth = 14;
      ctx.stroke();
      
      // We read specific marble rotations if they exist, fallback to general marbleRot + offset
      const specificRot = rotations[pos.id];
      const marbleRot = specificRot !== undefined ? specificRot : (rotations.marble || 0);
      const currentAngle = specificRot !== undefined ? marbleRot : marbleRot + pos.initialAngle;
      
      ctx.save();
      ctx.rotate(currentAngle * Math.PI / 180);

      // Draw indicator pointing inwards (tip closer to center than base)
      ctx.beginPath();
      ctx.moveTo(pos.distance - 12, 0);
      ctx.lineTo(pos.distance - 4, -6);
      ctx.lineTo(pos.distance - 4, 6);
      ctx.closePath();
      ctx.fillStyle = pos.color;
      ctx.fill();

      // Draw marble on its individual track
      ctx.beginPath();
      ctx.arc(pos.distance, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = pos.color; 
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Highlight / reflection
      ctx.beginPath();
      ctx.arc(pos.distance - 2, -2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      
      // Draw label outside the track
      ctx.translate(pos.distance + 14, 0);
      const normalized = ((currentAngle % 360) + 360) % 360;
      if (normalized > 90 && normalized < 270) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = pos.color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(pos.label, 0, 0);

      ctx.restore();
    });

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