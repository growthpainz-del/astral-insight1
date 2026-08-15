import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';

export default function OrbitWheelDraw({
  spreadSize = 3,
  orbitCount = 18,
  onCardCaptured,
  onComplete,
  deckBackImage = "https://media.base44.com/images/public/68d2a300021f94d0f312c039/87ddf47a1_2EC745CC-69B3-47EE-AC3A-6F29ABBF057F.png",
  // The medallion the cards orbit around. Defaults to the same emblem used
  // on the card backs, shown large and uncropped at the hub.
  centerImage = "https://media.base44.com/images/public/68d2a300021f94d0f312c039/87ddf47a1_2EC745CC-69B3-47EE-AC3A-6F29ABBF057F.png",
  spinSpeed = 0.08,
  // Visual declutter toggles: hide the numbered vertex labels and/or the
  // dashed orbit-track rings without touching the underlying geometry.
  showVertexLabels = true,
  showOrbitTrack = true,
}) {
  const [phase, setPhase] = useState('idle');
  const [capturedSlots, setCapturedSlots] = useState([]);
  const [orbiting, setOrbiting] = useState([]);
  // The card the player just tapped: holds briefly in place with an edge
  // glow ("selected!"), then flies from its orbit position to its slot.
  const [selection, setSelection] = useState(null); // { id, pos, slotIndex, vertexPos }
  const [flare, setFlare] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const isCapturingRef = useRef(false);

  const ringRotation = useRef(0);
  const lastTime = useRef(performance.now());
  const animRef = useRef();
  const ringRef = useRef();
  const hubRef = useRef();

  const orbitRef = useRef([]);
  const capturedRef = useRef([]);

  // Hub spin state: counter-rotates relative to the ring, slows as the
  // spread fills up, and flips direction on every successful selection so
  // each capture reads as a distinct little "beat."
  const hubRotation = useRef(0);
  const hubDirection = useRef(-1); // opposite of ring by default
  const HUB_SPEED_MULTIPLIER = 2.2;
  const HUB_MIN_SPEED_FACTOR = 0.12;

  const uid = useId();
  const gradGlow = `orbitGlow-${uid}`;

  // Vertical compression applied to the orbiting ring so it reads as a
  // tilted, perspective orbit rather than a flat carousel.
  const ORBIT_TILT = 0.55;

  useEffect(() => {
    const initial = Array.from({ length: orbitCount }).map((_, i) => ({
      id: i,
      baseAngle: (360 / orbitCount) * i
    }));
    setOrbiting(initial);
    orbitRef.current = initial;
  }, [orbitCount]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const getVertexPosition = (index, radius) => {
    const angle = (360 / spreadSize) * index;
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
  };

  // 0 = far edge of the orbit (small, dim, behind), 1 = near edge (large, bright, in front)
  const getOrbitDepth = (angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return (Math.sin(rad) + 1) / 2;
  };

  // The orbiting cards live on a tilted ellipse (see ORBIT_TILT). Single
  // source of truth for "where is a card at this angle" so anything aiming
  // at a card lands exactly on it.
  const getOrbitXY = (angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const r = 160;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) * ORBIT_TILT };
  };

  const getOrbitStyle = (angleDeg, counterRotateDeg) => {
    const { x, y } = getOrbitXY(angleDeg);
    const depth = getOrbitDepth(angleDeg);
    const scale = 0.62 + 0.38 * depth;
    const opacity = 0.35 + 0.65 * depth;
    const zIndex = Math.round(depth * 100);
    return {
      transform: `translate(${x}px, ${y}px) rotate(${counterRotateDeg}deg) scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  const startSpin = () => {
    setPhase('spinning');
    lastTime.current = performance.now();

    const loop = (time) => {
      const dt = time - lastTime.current;
      lastTime.current = time;
      ringRotation.current = (ringRotation.current + spinSpeed * dt) % 360;

      if (ringRef.current) {
        const children = ringRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const baseAngle = parseFloat(children[i].dataset.baseangle);
          const currentAngle = (baseAngle + ringRotation.current) % 360;
          const s = getOrbitStyle(currentAngle, -ringRotation.current);
          children[i].style.transform = s.transform;
          children[i].style.opacity = s.opacity;
          children[i].style.zIndex = s.zIndex;
        }
      }

      // Hub: counter-rotates, slows down as fewer slots remain open, and
      // its direction is flipped externally (see selectCard) each capture.
      if (hubRef.current) {
        const remainingFactor = Math.max(
          HUB_MIN_SPEED_FACTOR,
          (spreadSize - capturedRef.current.length) / spreadSize
        );
        hubRotation.current =
          (hubRotation.current + hubDirection.current * spinSpeed * HUB_SPEED_MULTIPLIER * remainingFactor * dt) % 360;
        hubRef.current.style.transform = `rotate(${hubRotation.current}deg)`;
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  };

  // Player-triggered capture, three beats:
  //   1. Freeze — the tapped card stops orbiting exactly where it is and
  //      its edges glow to confirm the selection.
  //   2. Flight — it travels from that frozen orbit position to its
  //      numbered slot.
  //   3. Flare — a burst of light on arrival, then it settles into the
  //      slot (back showing, reveal handled by the parent's resolver).
  const selectCard = async (card) => {
    if (isCapturingRef.current) return;
    if (phase !== 'spinning') return;
    const slotIndex = capturedRef.current.length;
    if (slotIndex >= spreadSize) return;

    const idx = orbitRef.current.findIndex(c => c.id === card.id);
    if (idx === -1) return; // already taken by a near-simultaneous tap

    isCapturingRef.current = true;
    setIsCapturing(true);

    const impactAngle = (card.baseAngle + ringRotation.current) % 360;
    const impactPos = getOrbitXY(impactAngle);
    const vertexPos = getVertexPosition(slotIndex, 160);

    // Pull it out of the moving pool so it visibly freezes instead of
    // continuing to drift while it's highlighted.
    const newOrbit = [...orbitRef.current];
    newOrbit.splice(idx, 1);
    orbitRef.current = newOrbit;
    setOrbiting(newOrbit);

    // 1. Glow-hold at its true current position
    setSelection({ id: card.id, pos: impactPos, slotIndex, vertexPos, stage: 'glow' });
    await new Promise(r => setTimeout(r, 320));

    // 2. Fly from orbit position to its slot
    setSelection(sel => sel ? { ...sel, stage: 'flying' } : sel);
    await new Promise(r => setTimeout(r, 480));

    // 3. Flare on arrival
    setSelection(null);
    setFlare({ id: slotIndex, pos: vertexPos });
    await new Promise(r => setTimeout(r, 320));
    setFlare(null);

    const newCapture = {
      slotIndex,
      cardId: card.id,
      isRevealed: false,
      cardData: null,
    };
    capturedRef.current = [...capturedRef.current, newCapture];
    setCapturedSlots([...capturedRef.current]);

    // Flip the hub's spin direction as a little "beat" marking the capture.
    hubDirection.current *= -1;

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    // Delegate identity resolution to parent
    if (onCardCaptured) {
      try {
        const data = await onCardCaptured(slotIndex, capturedRef.current.length - 1);
        capturedRef.current = capturedRef.current.map(c =>
          c.slotIndex === slotIndex ? { ...c, isRevealed: true, cardData: data } : c
        );
        setCapturedSlots([...capturedRef.current]);
      } catch (e) {
        console.error("Card capture resolution failed:", e);
      }
    }

    isCapturingRef.current = false;
    setIsCapturing(false);

    if (capturedRef.current.length >= spreadSize) {
      setTimeout(() => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        setPhase('complete');
        if (onComplete) onComplete(capturedRef.current);
      }, 500);
    }
  };

  const canSelect = phase === 'spinning' && !isCapturing && capturedSlots.length < spreadSize;

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto flex items-center justify-center overflow-visible bg-transparent" style={{ containerType: 'inline-size', touchAction: 'manipulation' }}>
      <div className="w-[400px] h-[400px] relative origin-center" style={{ transform: 'scale(min(1, calc(100cqw / 400)))' }}>

        {/* Ambient cosmic glow — soft, screen-blended so it sits well over any dark background */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            opacity: phase === 'idle' ? 0.5 : 1,
            background: 'radial-gradient(circle at 50% 50%, rgba(253,224,71,0.16) 0%, rgba(168,85,247,0.10) 42%, transparent 72%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* SVG Geometry Layer */}
        <svg width="400" height="400" viewBox="0 0 400 400" className="absolute inset-0 pointer-events-none">
          <defs>
            <radialGradient id={gradGlow} cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="rgba(253,224,71,0)" />
              <stop offset="88%" stopColor="rgba(253,224,71,0.10)" />
              <stop offset="100%" stopColor="rgba(253,224,71,0)" />
            </radialGradient>
          </defs>

          {/* Soft outer halo behind the track */}
          <circle cx="200" cy="200" r="172" fill={`url(#${gradGlow})`} />

          {showOrbitTrack && (
            <>
              {/* Slowly-drifting dashed orbit track, independent of the card spin */}
              <g style={{ transformOrigin: '200px 200px', animation: 'orbitTrackSpin 60s linear infinite' }}>
                <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(253, 224, 71, 0.45)" strokeWidth="2" strokeDasharray="2 10" />
              </g>
              <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(253, 224, 71, 0.55)" strokeWidth="1.5" strokeDasharray="8 8" style={{ filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.4))' }} />
            </>
          )}

          <style>{`
            @keyframes orbitTrackSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </svg>

        {phase === 'idle' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <button
              onClick={startSpin}
              className="pointer-events-auto group relative rounded-full w-32 h-32 flex flex-col items-center justify-center font-bold transition-all duration-300"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                background: 'radial-gradient(circle at 35% 30%, rgba(253,224,71,0.22), rgba(20,16,10,0.92) 65%)',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
                boxShadow: '0 0 22px rgba(253,224,71,0.35), inset 0 0 18px rgba(253,224,71,0.08)',
              }}
            >
              <span
                className="absolute inset-0 rounded-full -z-10"
                style={{
                  background: 'linear-gradient(135deg, #fde047, #f59e0b 55%, #c084fc)',
                  padding: 3,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              <span className="absolute inset-[-6px] rounded-full border border-[#fde047]/30 animate-ping" style={{ animationDuration: '2.4s' }} />
              <Sparkles className="w-4 h-4 mb-1 text-[#fde047] opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm tracking-widest leading-tight text-center text-[#fef08a]">PRESS<br/>TO BEGIN</span>
              <ChevronDown className="w-4 h-4 mt-1 text-[#fef08a]/80" />
            </button>
          </div>
        )}

        {/* Vertices (Spread Slots) */}
        {Array.from({ length: spreadSize }).map((_, i) => {
          const pos = getVertexPosition(i, 160);
          const isCaptured = capturedSlots.find(c => c.slotIndex === i);

          return (
            <div
              key={`vertex-${i}`}
              className="absolute top-1/2 left-1/2 flex items-center justify-center transition-all duration-500"
              style={{
                width: 60, height: 90,
                marginLeft: -30, marginTop: -45,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                zIndex: isCaptured ? 200 : 150
              }}
            >
              {!isCaptured && (
                <div className="relative w-[42px] h-[42px] rounded-full flex items-center justify-center">
                  <span
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background: 'radial-gradient(circle, rgba(253,224,71,0.25) 0%, transparent 70%)',
                      animationDuration: '2.2s',
                    }}
                  />
                  <div
                    className="relative w-full h-full rounded-full bg-[#1a1a1a]/90 backdrop-blur flex items-center justify-center"
                    style={{
                      border: '2px solid transparent',
                      backgroundImage: 'linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #fde047, #f59e0b 60%, #c084fc)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: '0 0 15px rgba(253,224,71,0.55)',
                    }}
                  >
                    {showVertexLabels && (
                      <span className="text-[#fef08a] font-bold text-lg">{i + 1}</span>
                    )}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {isCaptured && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.5, rotateY: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotateY: isCaptured.isRevealed ? 180 : 0
                    }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    className="absolute inset-0 rounded-lg"
                    style={{
                      transformStyle: 'preserve-3d',
                      padding: 2,
                      background: 'linear-gradient(135deg, #fde047, #f59e0b 55%, #c084fc)',
                      boxShadow: '0 0 26px rgba(253,224,71,0.55), 0 0 40px rgba(168,85,247,0.25)',
                    }}
                  >
                    <div
                      className="absolute inset-[2px] rounded-md overflow-hidden flex items-center justify-center p-2"
                      style={{ backfaceVisibility: 'hidden', background: 'radial-gradient(circle at 50% 40%, #1f1a2e, #0e0c14)' }}
                    >
                      <img src={deckBackImage} alt="Back" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute inset-[2px] rounded-md overflow-hidden bg-slate-900" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      {isCaptured.cardData?.image_url ? (
                        <img src={isCaptured.cardData.image_url} alt="Front" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <span className="text-[10px] text-white/80 leading-tight">
                            {isCaptured.cardData?.name || 'Revealed'}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Orbiting Ring — tilted ellipse with depth-based scale/opacity so cards feel like
            they're actually circling in space. Each card is directly tappable to select it. */}
        <div
          ref={ringRef}
          className="absolute top-1/2 left-1/2 w-0 h-0 transition-opacity duration-1000"
          style={{ transform: 'translate(-50%, -50%)', opacity: phase === 'idle' ? 0.6 : (phase === 'complete' ? 0 : 1) }}
        >
          {orbiting.map(card => {
            const currentAngle = (card.baseAngle + ringRotation.current) % 360;
            const s = getOrbitStyle(currentAngle, -ringRotation.current);
            return (
              <div
                key={`orbit-${card.id}`}
                role={canSelect ? 'button' : undefined}
                onClick={canSelect ? () => selectCard(card) : undefined}
                data-baseangle={card.baseAngle}
                className="absolute w-[50px] h-[75px] -ml-[25px] -mt-[37.5px] rounded-md overflow-hidden flex items-center justify-center p-1.5"
                style={{
                  transform: s.transform,
                  opacity: s.opacity,
                  zIndex: s.zIndex,
                  background: 'radial-gradient(circle at 50% 40%, #1f1a2e, #0e0c14)',
                  border: '1px solid rgba(253,224,71,0.35)',
                  boxShadow: '0 0 14px rgba(253,224,71,0.18), 0 4px 10px rgba(0,0,0,0.4)',
                  cursor: canSelect ? 'pointer' : 'default',
                  pointerEvents: canSelect ? 'auto' : 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <img src={deckBackImage} alt="Back" className="w-full h-full object-contain brightness-110" draggable={false} />
              </div>
            );
          })}
        </div>

        {/* Selected card — glows in place, then flies from its orbit position to its slot. */}
        <AnimatePresence>
          {selection && (
            <motion.div
              key={`selection-${selection.id}`}
              initial={{ x: selection.pos.x, y: selection.pos.y, scale: 1 }}
              animate={
                selection.stage === 'glow'
                  ? { x: selection.pos.x, y: selection.pos.y, scale: [1, 1.1, 1.04] }
                  : { x: selection.vertexPos.x, y: selection.vertexPos.y, scale: 1.04 }
              }
              exit={{ opacity: 0, scale: 0.7 }}
              transition={
                selection.stage === 'glow'
                  ? { duration: 0.32, ease: 'easeOut' }
                  : { duration: 0.48, ease: 'easeInOut' }
              }
              className="absolute top-1/2 left-1/2 w-[50px] h-[75px] -ml-[25px] -mt-[37.5px] rounded-md overflow-hidden flex items-center justify-center p-1.5"
              style={{
                zIndex: 180,
                background: 'radial-gradient(circle at 50% 40%, #2a2340, #12101a)',
                border: '2px solid #fde047',
                boxShadow: '0 0 4px #fef9c3, 0 0 22px rgba(253,224,71,0.85), 0 0 42px rgba(192,132,252,0.5)',
              }}
            >
              <img src={deckBackImage} alt="" className="w-full h-full object-contain brightness-125" draggable={false} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Impact Flare — a burst of light where the selected card lands in its slot. */}
        <AnimatePresence>
          {flare && (
            <motion.div
              key={`flare-${flare.id}`}
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{ transform: `translate(${flare.pos.x}px, ${flare.pos.y}px)` }}
            >
              <motion.div
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
                className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full"
                style={{ background: 'radial-gradient(circle, #ffffff 0%, #fef9c3 30%, #fde047 55%, rgba(192,132,252,0.4) 80%, transparent 100%)' }}
              />
              <motion.div
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2"
                style={{ borderColor: 'rgba(253,224,71,0.85)' }}
              />
              {Array.from({ length: 6 }).map((_, i) => {
                const sparkAngle = i * 60 + 15;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, scaleX: 0 }}
                    animate={{ opacity: 0, scaleX: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute h-[2px] w-5 rounded-full"
                    style={{
                      transformOrigin: '0% 50%',
                      transform: `rotate(${sparkAngle}deg)`,
                      background: 'linear-gradient(90deg, #fef9c3, rgba(192,132,252,0))',
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Hub — purely the "engine" now: it spins on its own, counter to the
            ring, slowing as the spread fills and flipping direction on every capture.
            No longer tappable; selection happens directly on the orbiting cards. */}
        <div
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none transition-all duration-700"
          style={{
            width: phase === 'idle' ? 150 : 168,
            height: phase === 'idle' ? 150 : 168,
            marginLeft: phase === 'idle' ? -75 : -84,
            marginTop: phase === 'idle' ? -75 : -84,
            zIndex: 30,
          }}
        >
          <span className="absolute inset-0 rounded-full border border-[#fde047]/40 animate-ping" style={{ animationDuration: '2.2s' }} />
          <span className="absolute inset-[-10px] rounded-full border border-[#c084fc]/25 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.4s' }} />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(253,224,71,0.35) 0%, rgba(192,132,252,0.12) 55%, transparent 78%)',
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute inset-[10%] rounded-full overflow-hidden flex items-center justify-center p-3"
            style={{
              background: 'radial-gradient(circle at 50% 40%, #241e35, #0e0c14)',
              border: '2px solid transparent',
              backgroundImage: 'radial-gradient(circle at 50% 40%, #241e35, #0e0c14), linear-gradient(135deg, #fde047, #f59e0b 55%, #c084fc)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: '0 0 34px rgba(253,224,71,0.55), 0 0 60px rgba(168,85,247,0.28)',
            }}
          >
            {/* This inner element is what the rAF loop rotates. Kept separate from
                the outer ring so the glow/border stay static while only the emblem spins. */}
            <div ref={hubRef} className="w-full h-full flex items-center justify-center">
              {centerImage ? (
                <img src={centerImage} alt="" className="w-full h-full object-contain" draggable={false} />
              ) : (
                <div
                  className="w-1/2 h-1/2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #fef9c3, #fde047 60%, #f59e0b)',
                    boxShadow: '0 0 20px #fde047, 0 0 34px rgba(192,132,252,0.4)',
                  }}
                />
              )}
            </div>
          </div>

          {canSelect && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap text-[10px] tracking-[0.2em] font-bold text-[#fef08a] pointer-events-none"
            >
              TAP A CARD TO SELECT
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
