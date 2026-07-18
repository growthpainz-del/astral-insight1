import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const PALETTES = {
  rustic: {
    stone: ['#B5A48A', '#8B7D6B', '#3A2F26'],
    stoneStroke: '#1a1410',
    glyph: 'rgba(20,10,2,0.92)',
    glyphShadow: 'rgba(193,122,58,0.75)',
    bg: '#07050f',
  },
  futuristic: {
    stone: ['#4b6b78', '#2b4b58', '#0b1b28'],
    stoneStroke: '#071020',
    glyph: 'rgba(103,232,249,0.92)',
    glyphShadow: 'rgba(103,232,249,0.75)',
    bg: '#07050f',
  },
  obsidian: {
    stone: ['#2a2030', '#1a1428', '#0a0810'],
    stoneStroke: '#0a0818',
    glyph: 'rgba(167,139,250,0.95)',
    glyphShadow: 'rgba(167,139,250,0.7)',
    bg: '#07050f',
  }
};

export default function SigilForge() {
  const drawCanvasRef = useRef(null);
  const mirrorCanvasRef = useRef(null);
  const stoneCanvasRef = useRef(null);
  const tmpCanvasRef = useRef(document.createElement('canvas'));

  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [symmetry, setSymmetry] = useState(2); // 1, 2, 4, 8
  const [brushOpacity, setBrushOpacity] = useState(100);

  const [strokesState, setStrokesState] = useState([]);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);

  const [isForging, setIsForging] = useState(false);
  const [isSavingToWheel, setIsSavingToWheel] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [symbolName, setSymbolName] = useState("");
  const [oracleReading, setOracleReading] = useState("");
  const [meaningFocus, setMeaningFocus] = useState("general");
  const [meaningTone, setMeaningTone] = useState("poetic");

  const [paletteId, setPaletteId] = useState('rustic');
  const [stoneTexture, setStoneTexture] = useState(null);
  const [texMirror, setTexMirror] = useState(0);

  const isDrawingRef = useRef(false);

  const palette = PALETTES[paletteId];

  const redrawAll = () => {
    const dc = drawCanvasRef.current;
    const mc = mirrorCanvasRef.current;
    if (!dc || !mc) return;
    const dctx = dc.getContext('2d');
    const mctx = mc.getContext('2d');
    
    const W = dc.width; const H = dc.height;
    const cx = W/2; const cy = H/2;
    
    dctx.clearRect(0,0,W,H);
    mctx.clearRect(0,0,W,H);
    
    // Draw guidelines on DC
    dctx.strokeStyle = 'rgba(255,255,255,0.05)';
    dctx.lineWidth = 1;
    dctx.beginPath();
    if (symmetry >= 2) { dctx.moveTo(cx, 0); dctx.lineTo(cx, H); }
    if (symmetry >= 4) { dctx.moveTo(0, cy); dctx.lineTo(W, cy); }
    if (symmetry >= 8) { 
      dctx.moveTo(0, 0); dctx.lineTo(W, H); 
      dctx.moveTo(W, 0); dctx.lineTo(0, H); 
    }
    dctx.stroke();

    const drawStroke = (ctx, stroke) => {
      if (!stroke || !stroke.points || !stroke.points.length) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x || 0, stroke.points[0].y || 0);
      for(let i=1; i<stroke.points.length; i++) {
        if(stroke.points[i]) ctx.lineTo(stroke.points[i].x || 0, stroke.points[i].y || 0);
      }
      if (stroke.points.length === 1) {
        ctx.lineTo((stroke.points[0].x || 0) + 0.1, stroke.points[0].y || 0);
      }
      ctx.strokeStyle = stroke.color || '#fff';
      ctx.lineWidth = stroke.size || 5;
      ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const drawSymmetries = (ctx, stroke) => {
      ctx.save();
      drawStroke(ctx, stroke);
      if (symmetry >= 2) {
        ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); drawStroke(ctx, stroke); ctx.restore();
      }
      if (symmetry >= 4) {
        ctx.save(); ctx.translate(0, H); ctx.scale(1, -1); drawStroke(ctx, stroke); ctx.restore();
        ctx.save(); ctx.translate(W, H); ctx.scale(-1, -1); drawStroke(ctx, stroke); ctx.restore();
      }
      if (symmetry >= 8) {
        [90, 180, 270].forEach(angle => {
          ctx.save();
          ctx.translate(cx, cy); ctx.rotate(angle * Math.PI / 180); ctx.translate(-cx, -cy);
          drawStroke(ctx, stroke);
          ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); drawStroke(ctx, stroke); ctx.restore();
          ctx.restore();
        });
      }
      ctx.restore();
    };

    if (Array.isArray(strokesRef.current)) {
      strokesRef.current.forEach(s => {
        drawStroke(dctx, s);
        drawSymmetries(mctx, s);
      });
    }
    
    if (currentStrokeRef.current) {
      drawStroke(dctx, currentStrokeRef.current);
      drawSymmetries(mctx, currentStrokeRef.current);
    }
    
    drawSymbolOnStone();
  };

  useEffect(() => {
    redrawAll();
  }, [strokesState, symmetry, paletteId, stoneTexture, texMirror]);

  useEffect(() => {
    const W = 160, H = 180;
    const dc = drawCanvasRef.current;
    const mc = mirrorCanvasRef.current;
    const sc = stoneCanvasRef.current;
    if (dc) { dc.width = W; dc.height = H; }
    if (mc) { mc.width = W; mc.height = H; }
    if (sc) { sc.width = 200; sc.height = 200; }
    redrawAll();
  }, []);

  const getXY = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    let clientX = 0, clientY = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  };

  const generateSVG = () => {
    const W = 160; const H = 180;
    const cx = W/2; const cy = H/2;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W*8}" height="${H*8}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g stroke-linecap="round" stroke-linejoin="round" fill="none">`;
    
    const renderStroke = (stroke) => {
      if (!stroke || !stroke.points || !stroke.points.length) return '';
      let d = `M ${(stroke.points[0].x || 0).toFixed(2)} ${(stroke.points[0].y || 0).toFixed(2)}`;
      for (let i=1; i<stroke.points.length; i++) {
        if(stroke.points[i]) d += ` L ${(stroke.points[i].x || 0).toFixed(2)} ${(stroke.points[i].y || 0).toFixed(2)}`;
      }
      return `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.size}" opacity="${stroke.opacity}" />`;
    };

    if (Array.isArray(strokesRef.current)) {
      strokesRef.current.forEach(stroke => {
        svg += renderStroke(stroke);
        if (symmetry >= 2) {
          svg += `<g transform="translate(${W}, 0) scale(-1, 1)">${renderStroke(stroke)}</g>`;
        }
        if (symmetry >= 4) {
          svg += `<g transform="translate(0, ${H}) scale(1, -1)">${renderStroke(stroke)}</g>`;
          svg += `<g transform="translate(${W}, ${H}) scale(-1, -1)">${renderStroke(stroke)}</g>`;
        }
        if (symmetry >= 8) {
          [90, 180, 270].forEach(angle => {
             svg += `<g transform="translate(${cx}, ${cy}) rotate(${angle}) translate(${-cx}, ${-cy})">`;
             svg += renderStroke(stroke);
             svg += `<g transform="translate(${W}, 0) scale(-1, 1)">${renderStroke(stroke)}</g>`;
             svg += `</g>`;
          });
        }
      });
    }
    svg += `</g></svg>`;
    return svg;
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getXY(e, drawCanvasRef.current);
    isDrawingRef.current = true;
    currentStrokeRef.current = {
      color: brushColor,
      size: brushSize,
      opacity: brushOpacity / 100,
      points: [pos]
    };
    redrawAll();
  };

  const doDraw = (e) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    const pos = getXY(e, drawCanvasRef.current);
    const lastPos = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
    const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
    if (dist > 1.5) {
      currentStrokeRef.current.points.push(pos);
      redrawAll();
    }
  };

  const stopDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const next = [...strokesRef.current, currentStrokeRef.current];
      strokesRef.current = next;
      setStrokesState(next);
    }
    currentStrokeRef.current = null;
    redrawAll();
  };

  const undoLast = () => {
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    setStrokesState(next);
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    setStrokesState([]);
    setSymbolName("");
    setOracleReading("");
    setErrorMsg("");
  };

  const handleTexUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setStoneTexture(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const saveToWheel = async () => {
    try {
      setIsSavingToWheel(true);
      const safeName = symbolName.trim() || "Unnamed Sigil";
      
      const svgString = generateSVG();
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const file = new File([blob], `sigil-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sigil'}.svg`, { type: "image/svg+xml" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const user = await base44.auth.me();
      if (!user) {
        alert("Please log in to save sigils.");
        return;
      }

      let decks = await base44.entities.Deck.filter({ name: "Forged Sigils", created_by: user.email });
      let deckId;
      if (decks && decks.length > 0) {
        deckId = decks[0].id;
      } else {
        const newDeck = await base44.entities.Deck.create({
          name: "Forged Sigils",
          category: "custom",
          description: "Sigils forged in the Astral Insight Sigil Forge"
        });
        deckId = newDeck.id;
      }

      await base44.entities.Card.create({
        deck_id: deckId,
        name: safeName,
        overall_meaning: oracleReading,
        spirit_wheel_icon_url: file_url,
        image_url: file_url
      });
      
      alert("Sigil saved to 'Forged Sigils' deck! You can now select it in the Spirit Wheel Designer as a card.");
    } catch (err) {
      console.error(err);
      alert("Failed to save: " + err.message);
    } finally {
      setIsSavingToWheel(false);
    }
  };

  const forgeSigil = async () => {
    setIsForging(true);
    const originalName = symbolName;
    setOracleReading("... channeling the cosmos ...");
    setErrorMsg("");

    try {
      const mc = mirrorCanvasRef.current;
      
      // Create a canvas with a solid background so the drawing isn't lost in transparency
      const tmp = document.createElement('canvas');
      tmp.width = mc.width;
      tmp.height = mc.height;
      const ctx = tmp.getContext('2d');
      ctx.fillStyle = '#07050f'; // Dark background so light strokes are clearly visible
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(mc, 0, 0);

      const blob = await new Promise(res => tmp.toBlob(res, 'image/jpeg', 0.95));
      const file = new File([blob], "sigil.jpg", { type: "image/jpeg" });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const nameContext = originalName ? `The user has named this sigil "${originalName}". Use this name or incorporate its concept. ` : "";
      
      const focusText = {
        general: "general life guidance",
        love: "love, relationships, and emotional connections",
        career: "career, ambitions, and life purpose",
        spiritual: "spiritual growth and inner shadow work"
      }[meaningFocus] || "general life guidance";

      const toneText = {
        poetic: "poetic, mystical, and grounded",
        direct: "direct, clear, and actionable",
        cryptic: "cryptic, shadowy, and mysterious",
        encouraging: "warm, uplifting, and encouraging"
      }[meaningTone] || "poetic";

      const entropy = Math.random().toString(36).substring(7);

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Rooted Crescent Oracle. Carefully analyze the visual shapes and patterns in this mirrored drawing to see what symbols emerge. ${nameContext}Identify the single primary spirit symbol that appears (one or two words) and connect it to its deep, ancient, and common symbolic meanings. Then, write exactly 3 sentences as a ${toneText} oracle reading focused on ${focusText}. 
        
CRITICAL RULES FOR VARIETY: 
1. The meaning MUST be inspired by the spiritual and universal symbolism of the shape, but NEVER just describe lines or symmetry. 
2. DO NOT use clichés, repetitive phrasing, or standard fortune-teller tropes. 
3. Draw from a vast and diverse pool of obscure mythology, alchemy, esoteric traditions, and highly specific symbolic archetypes. 
4. Every reading MUST feel completely distinct and highly specific to the unique energy of this exact drawing. 
5. NEVER start sentences with repetitive structures like "This symbol represents", "The curves suggest", or "This sigil brings".
6. Provide only an upright, balanced, or positive meaning. (Randomization Seed: ${entropy})`,
        file_urls: [file_url],
        model: 'gpt_5_4',
        response_json_schema: {
          type: "object",
          properties: {
            symbol: { type: "string" },
            reading: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          },
          required: ["symbol", "reading"]
        }
      });
      
      console.log("Oracle AI Response:", res);
      
      let parsedRes = res;
      if (typeof res === 'string') {
        try {
            parsedRes = JSON.parse(res.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch(e) {
            console.error("Parse error:", e);
        }
      }

      const finalSymbol = parsedRes?.symbol || parsedRes?.data?.symbol || originalName || "Mystic Mark";
      setSymbolName(finalSymbol.toUpperCase());

      if (!parsedRes || (!parsedRes.symbol && !parsedRes.data?.symbol && !parsedRes.reading && !parsedRes.data?.reading)) {
          setOracleReading("Error/Raw response: " + (typeof res === 'string' ? res : JSON.stringify(res)).substring(0, 300));
      } else {
          setOracleReading(parsedRes?.reading || parsedRes?.data?.reading || "The oracle's whispers are clouded.");
      }
      drawSymbolOnStone();

    } catch (err) {
      console.error(err);
      setOracleReading("Error: " + err.message);
      setErrorMsg("Error: " + err.message);
    } finally {
      setIsForging(false);
    }
  };

  const drawSymbolOnStone = (name) => {
    const c = stoneCanvasRef.current;
    const mc = mirrorCanvasRef.current;
    if (!c || !mc) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);

    ctx.shadowColor = palette.glyphShadow;
    ctx.shadowBlur = 10;
    
    // Draw the user's doodle scaled to fit the stone
    const scale = Math.min(180 / mc.width, 180 / mc.height);
    const sw = mc.width * scale;
    const sh = mc.height * scale;
    const dx = (200 - sw) / 2;
    const dy = (200 - sh) / 2;
    
    ctx.drawImage(mc, dx, dy, sw, sh);
  };

  const getStoneTexturePattern = () => {
    if (!stoneTexture) return null;
    return (
      <pattern id="stoneTex" patternUnits="userSpaceOnUse" width="200" height="200" patternTransform={`scale(${texMirror < 50 ? 1 : -1}, 1) translate(${texMirror < 50 ? 0 : -200}, 0)`}>
        <image href={stoneTexture} x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMid slice" />
      </pattern>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <style>{`
        .v-panel { background: #0f0b1e; border: 1px solid rgba(160,120,255,.16); border-radius: 14px; padding: 14px; margin-bottom: 14px; }
        .v-panel-title { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: .24em; text-transform: uppercase; color: #C17A3A; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .v-panel-title::after { content: ''; flex: 1; height: 1px; background: rgba(193,122,58,.3); }
        .canvas-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .canvas-col { display: flex; flex-direction: column; gap: 6px; }
        .col-label { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #C17A3A; }
        .canvas-wrap { width: 100%; height: 180px; position: relative; background: #111; border: 1px solid rgba(139,125,107,.3); border-radius: 8px; overflow: hidden; }
        canvas.surface { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block; touch-action: none; }
        #drawing-canvas { cursor: crosshair; }
        #mirror-canvas { cursor: default; }
        .color-swatch { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: border-color .15s; flex-shrink: 0; }
        .color-swatch.active { border-color: #E8A857; }
        .v-slider-group { display: flex; align-items: center; gap: 8px; font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #8B7D6B; white-space: nowrap; }
        .v-btn { background: transparent; border: 1px solid rgba(139,125,107,.4); color: #C4B49A; padding: 6px 14px; font-family: 'Crimson Text', serif; font-size: 14px; cursor: pointer; border-radius: 6px; transition: all .2s; }
        .v-btn:hover, .v-btn.active { background: rgba(193,122,58,.15); border-color: #C17A3A; color: #E8A857; }
        
        .oracle-btn { width: 100%; margin-top: 16px; padding: 14px; background: linear-gradient(135deg, rgba(193,122,58,.2), rgba(123,184,196,.1)); border: 1px solid #C17A3A; color: #E8A857; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: .15em; text-transform: uppercase; cursor: pointer; border-radius: 8px; transition: all .3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .oracle-btn:hover:not(:disabled) { background: linear-gradient(135deg, rgba(193,122,58,.35), rgba(123,184,196,.2)); box-shadow: 0 0 20px rgba(193,122,58,.3); }
        .oracle-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .stone-row-wrap { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        @media (min-width: 640px) { .stone-row-wrap { flex-wrap: nowrap; } }
        .stone-wrap { position: relative; width: 180px; height: 180px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
        .stone-svg { position: absolute; width: 100%; height: 100%; filter: drop-shadow(0 6px 18px rgba(0,0,0,.8)); }
        .stone-svg.glowing { animation: stonePulse 2.5s ease infinite; }
        @keyframes stonePulse { 0%, 100% { filter: drop-shadow(0 6px 18px rgba(0,0,0,.8)); } 50% { filter: drop-shadow(0 6px 18px rgba(0,0,0,.8)) drop-shadow(0 0 20px rgba(193,122,58,.7)); } }
        #stone-canvas { position: absolute; width: 52%; height: 52%; border-radius: 50%; z-index: 1; }
        .stone-text { flex: 1; text-align: center; }
        @media (min-width: 640px) { .stone-text { text-align: left; } }
        
        .pal-btn { flex: 1; padding: 10px; border-radius: 9px; border: none; cursor: pointer; font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; transition: all .25s; }
        .pal-btn.rustic { background: rgba(193,122,58,.12); border: 1px solid rgba(193,122,58,.3); color: #C17A3A; }
        .pal-btn.rustic.on { background: rgba(193,122,58,.28); border-color: #C17A3A; color: #E8A857; }
        .pal-btn.futuristic { background: rgba(103,232,249,.08); border: 1px solid rgba(103,232,249,.25); color: #67e8f9; }
        .pal-btn.futuristic.on { background: rgba(103,232,249,.2); border-color: #67e8f9; color: #fff; }
        .pal-btn.obsidian { background: rgba(120,80,200,.08); border: 1px solid rgba(120,80,200,.2); color: #a78bfa; }
        .pal-btn.obsidian.on { background: rgba(120,80,200,.2); border-color: #a78bfa; color: #fff; box-shadow: 0 0 12px rgba(120,80,200,.2); }
        
        .upload-area { border: 1.5px dashed rgba(193,122,58,.3); border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; transition: border-color .25s; margin-bottom: 14px; }
        .upload-area:hover { border-color: rgba(193,122,58,.6); }
      `}</style>

      {/* Draw & Mirror */}
      <div className="v-panel">
        <div className="v-panel-title">Sigil Forge</div>
        <div className="canvas-row">
          <div className="canvas-col">
            <div className="col-label">Draw</div>
            <div className="canvas-wrap" id="draw-wrap">
              <canvas 
                ref={drawCanvasRef} 
                id="drawing-canvas" 
                className="surface"
                onMouseDown={startDraw}
                onMouseMove={doDraw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={doDraw}
                onTouchEnd={stopDraw}
              ></canvas>
            </div>
          </div>
          <div className="canvas-col">
            <div className="col-label">Mirror</div>
            <div className="canvas-wrap" id="mirror-wrap">
              <canvas ref={mirrorCanvasRef} id="mirror-canvas" className="surface"></canvas>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input 
              type="color" 
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer p-0 border-0 bg-transparent"
              title="Color Wheel"
            />
            {['#ffffff', '#C17A3A', '#7BB8C4', '#9B7FBE', '#6BAF6B', '#C44B4B', '#67e8f9', '#a78bfa'].map(c => (
              <div 
                key={c}
                className={`color-swatch ${brushColor === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setBrushColor(c)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="v-slider-group">
              Brush <input type="range" min="1" max="28" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-20" />
            </div>
            <div className="v-slider-group">
              Opacity <input type="range" min="10" max="100" value={brushOpacity} onChange={e => setBrushOpacity(Number(e.target.value))} className="w-20" />
              <span className="text-[#C17A3A] min-w-[30px]">{brushOpacity}%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center mt-1">
            <div className="v-slider-group mr-2">Symmetry:</div>
            <button className={`v-btn ${symmetry === 1 ? 'active' : ''}`} onClick={() => setSymmetry(1)}>None</button>
            <button className={`v-btn ${symmetry === 2 ? 'active' : ''}`} onClick={() => setSymmetry(2)}>Mirror</button>
            <button className={`v-btn ${symmetry === 4 ? 'active' : ''}`} onClick={() => setSymmetry(4)}>Quad</button>
            <button className={`v-btn ${symmetry === 8 ? 'active' : ''}`} onClick={() => setSymmetry(8)}>Mandala</button>
            <div className="flex-1"></div>
            <button className="v-btn" onClick={undoLast} disabled={strokesState.length === 0}>Undo</button>
            <button className="v-btn" onClick={clearCanvas}>Clear</button>
          </div>
        </div>

        {errorMsg && <div className="text-red-500 text-xs italic mt-2">{errorMsg}</div>}
      </div>

      {/* The Stone */}
      <div className="v-panel">
        <div className="v-panel-title">The Stone</div>
        <div className="stone-row-wrap">
          <div className="stone-wrap">
            <svg className={`stone-svg ${isForging || oracleReading ? 'glowing' : ''}`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {getStoneTexturePattern()}
                <radialGradient id="sg" cx="38%" cy="32%" r="65%">
                  <stop offset="0%" stopColor={palette.stone[0]}/>
                  <stop offset="40%" stopColor={palette.stone[1]}/>
                  <stop offset="100%" stopColor={palette.stone[2]}/>
                </radialGradient>
                <filter id="stf">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
              </defs>
              <ellipse cx="100" cy="105" rx="88" ry="82" fill={stoneTexture ? "url(#stoneTex)" : "url(#sg)"} filter="url(#stf)"/>
              <ellipse cx="72" cy="68" rx="28" ry="18" fill="rgba(255,255,255,0.07)" transform="rotate(-20,72,68)"/>
              <ellipse cx="100" cy="105" rx="88" ry="82" fill="none" stroke={palette.stoneStroke} strokeWidth="4"/>
            </svg>
            <canvas ref={stoneCanvasRef} id="stone-canvas"></canvas>
          </div>
          <div className="stone-text flex flex-col gap-3">
            {isForging && <Loader2 className="w-6 h-6 animate-spin text-[#C17A3A] mx-auto sm:mx-0 mb-2" />}
            <input 
              className="font-['Cinzel'] bg-transparent border-b border-[#C17A3A]/40 text-[#C17A3A] text-lg tracking-[0.16em] outline-none text-center sm:text-left placeholder-[#C17A3A]/50 w-full"
              style={{ textShadow: '0 0 15px rgba(193,122,58,0.5)' }}
              value={symbolName}
              onChange={e => setSymbolName(e.target.value)}
              placeholder="Name your sigil..."
            />
            <textarea 
              className="italic bg-transparent border border-[#C17A3A]/20 rounded p-2 text-[#8B7D6B] text-base leading-relaxed outline-none focus:border-[#C17A3A]/50 w-full resize-none h-24"
              value={oracleReading}
              onChange={e => setOracleReading(e.target.value)}
              placeholder="Enter its meaning manually or let the Oracle define it..."
            />
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 w-full">
                 <select 
                   value={meaningFocus} 
                   onChange={e => setMeaningFocus(e.target.value)}
                   className="flex-1 bg-[#160f2a] border border-[#C17A3A]/40 rounded p-1.5 text-[#C17A3A] text-xs outline-none cursor-pointer"
                 >
                   <option value="general">General Guidance</option>
                   <option value="love">Love & Relationships</option>
                   <option value="career">Career & Purpose</option>
                   <option value="spiritual">Spiritual Growth</option>
                 </select>
                 <select 
                   value={meaningTone} 
                   onChange={e => setMeaningTone(e.target.value)}
                   className="flex-1 bg-[#160f2a] border border-[#C17A3A]/40 rounded p-1.5 text-[#C17A3A] text-xs outline-none cursor-pointer"
                 >
                   <option value="poetic">Poetic & Mystical</option>
                   <option value="direct">Direct & Clear</option>
                   <option value="cryptic">Cryptic & Shadowy</option>
                   <option value="encouraging">Warm & Encouraging</option>
                 </select>
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button 
                  onClick={forgeSigil} 
                  disabled={isForging}
                  className="px-3 py-1.5 rounded-lg border border-[#67e8f9]/40 text-[#67e8f9] hover:bg-[#67e8f9]/10 text-xs tracking-wider uppercase font-['Cinzel'] transition-all flex items-center justify-center gap-2"
                >
                  {isForging ? <Loader2 className="w-3 h-3 animate-spin" /> : '✨'} Ask Oracle
                </button>
                {(symbolName || oracleReading) && (
                  <button 
                    onClick={saveToWheel} 
                    disabled={isSavingToWheel}
                    className="px-3 py-1.5 rounded-lg border border-[#C17A3A]/40 text-[#E8A857] hover:bg-[#C17A3A]/10 text-xs tracking-wider uppercase font-['Cinzel'] transition-all flex items-center justify-center gap-2"
                  >
                    {isSavingToWheel ? <Loader2 className="w-3 h-3 animate-spin" /> : '✦'} Save to Wheel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Texture Studio */}
      <div className="v-panel">
        <div className="v-panel-title">Texture Studio</div>

        <div className="flex gap-2 mb-4">
          <button className={`pal-btn rustic ${paletteId === 'rustic' ? 'on' : ''}`} onClick={() => setPaletteId('rustic')}>🪵 Rustic</button>
          <button className={`pal-btn futuristic ${paletteId === 'futuristic' ? 'on' : ''}`} onClick={() => setPaletteId('futuristic')}>🌌 Cosmic</button>
          <button className={`pal-btn obsidian ${paletteId === 'obsidian' ? 'on' : ''}`} onClick={() => setPaletteId('obsidian')}>🖤 Obsidian</button>
        </div>

        <div className="upload-area" onClick={() => document.getElementById('tex-file-input').click()}>
          <span className="text-2xl block mb-1 opacity-50">🖼</span>
          <span className="font-['Cinzel'] text-[10px] tracking-[0.18em] uppercase text-[#C17A3A] block mb-1">Upload Stone Texture</span>
          <span className="font-serif italic text-xs text-[#8B7D6B]">JPG, PNG or WebP — applied to the stone</span>
        </div>
        <input type="file" id="tex-file-input" accept="image/*" onChange={handleTexUpload} className="hidden" />

        {stoneTexture && (
          <div className="v-slider-group mt-2">
            Texture Mirror <input type="range" min="0" max="100" value={texMirror} onChange={e => setTexMirror(Number(e.target.value))} className="w-24" />
            <span className="text-[#C17A3A] min-w-[30px]">{texMirror}%</span>
          </div>
        )}
      </div>
    </div>
  );
}