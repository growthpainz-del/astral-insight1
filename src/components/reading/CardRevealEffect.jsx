import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Map card element/keywords to an archetype color/theme
function getArchetypeTheme(card) {
  if (!card) return { color: "#a78bfa", glow: "#7c3aed", label: "mystic", particles: "✦" };

  const text = [
    card.element || "",
    ...(card.keywords || []),
    card.name || "",
  ].join(" ").toLowerCase();

  if (/fire|flame|passion|sun|leo|aries|sagittarius|wand|strength|tower/.test(text))
    return { color: "#f97316", glow: "#ea580c", label: "fire", particles: "🔥" };
  if (/water|ocean|moon|pisces|cancer|scorpio|cup|emotion|flow|intuition/.test(text))
    return { color: "#38bdf8", glow: "#0284c7", label: "water", particles: "💧" };
  if (/earth|grounded|taurus|virgo|capricorn|pent|material|body|forest/.test(text))
    return { color: "#86efac", glow: "#16a34a", label: "earth", particles: "🌿" };
  if (/air|wind|thought|gemini|libra|aquarius|sword|mind|logic|storm/.test(text))
    return { color: "#e2e8f0", glow: "#94a3b8", label: "air", particles: "⚡" };
  if (/spirit|divine|star|universe|world|cosmos|void/.test(text))
    return { color: "#fde68a", glow: "#f59e0b", label: "spirit", particles: "✨" };
  if (/shadow|dark|death|tower|devil|reversed|chaos|void/.test(text))
    return { color: "#c084fc", glow: "#9333ea", label: "shadow", particles: "🌑" };
  if (/love|heart|empress|couple|partner|relation/.test(text))
    return { color: "#fb7185", glow: "#e11d48", label: "love", particles: "💖" };

  return { color: "#a78bfa", glow: "#7c3aed", label: "mystic", particles: "✦" };
}

// Burst particles canvas overlay
function ParticleBurst({ color, active, cardRect }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const NUM = 28;
    const particles = Array.from({ length: NUM }, (_, i) => {
      const angle = (i / NUM) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 2.5 + Math.random() * 4;
      const size = 3 + Math.random() * 5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.022 + Math.random() * 0.018,
        size,
        r: parseInt(color.slice(1, 3), 16) || 167,
        g: parseInt(color.slice(3, 5), 16) || 139,
        b: parseInt(color.slice(5, 7), 16) || 250,
      };
    });

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life -= p.decay;

        ctx.beginPath();
        const radius = Math.max(0, p.size * p.life);
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.max(0, p.life) * 0.9})`;
        // glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.7)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      if (alive && frame < 120) {
        frame++;
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, color]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="absolute pointer-events-none z-30"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        opacity: active ? 1 : 0,
        transition: "opacity 0.3s",
      }}
    />
  );
}

// Pulsing aura ring that stays on revealed card
function AuraRing({ color, glow, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-lg pointer-events-none z-20"
          style={{
            boxShadow: `0 0 18px 4px ${glow}80, 0 0 40px 10px ${glow}30, inset 0 0 12px ${color}30`,
            border: `1.5px solid ${color}60`,
          }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * CardRevealEffect wraps a card and enhances reveal with:
 * - 3D cinematic flip-in animation (Y-axis 180° → 0°)
 * - Archetype-matched particle burst on reveal
 * - Persistent pulsing aura ring
 *
 * Props:
 *  card         — card data object
 *  isRevealed   — boolean: trigger reveal animation
 *  delay        — stagger delay (seconds)
 *  children     — the card content to show after flip
 *  backContent  — the card back content (shown before reveal)
 *  style        — extra style for outer container
 *  className    — extra classes
 */
export default function CardRevealEffect({
  card,
  isRevealed,
  delay = 0,
  children,
  backContent,
  style,
  className = "",
}) {
  const theme = getArchetypeTheme(card);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [burstActive, setBurstActive] = useState(false);

  // Track the first time isRevealed becomes true
  useEffect(() => {
    if (isRevealed && !hasFlipped) {
      const t = setTimeout(() => {
        setHasFlipped(true);
        setBurstActive(true);
        setTimeout(() => setBurstActive(false), 1600);
      }, delay * 1000 + 10);
      return () => clearTimeout(t);
    }
  }, [isRevealed]);

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: "900px", transformStyle: "preserve-3d", ...style }}
    >
      {/* Particle burst overlay */}
      <ParticleBurst color={theme.color} active={burstActive} />

      {/* The card itself — 3D flip animation */}
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: "preserve-3d", position: "relative" }}
        initial={{ rotateY: 0, scale: 0.88, opacity: 0.5 }}
        animate={
          hasFlipped
            ? {
                rotateY: [180, 95, -5, 0],
                scale: [0.88, 1.08, 1.02, 1],
                opacity: 1,
              }
            : { rotateY: 0, scale: 1, opacity: 1 }
        }
        transition={
          hasFlipped
            ? {
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.5, 0.85, 1],
              }
            : { duration: 0 }
        }
      >
        {/* Back face — shown before flip */}
        {!hasFlipped && (
          <div
            className="absolute inset-0 w-full h-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            {backContent}
          </div>
        )}

        {/* Front face — shown after flip */}
        <div
          className="w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            opacity: hasFlipped ? 1 : 0,
          }}
        >
          {children}
        </div>
      </motion.div>

      {/* Aura ring overlay (visible once flipped) */}
      <AuraRing color={theme.color} glow={theme.glow} visible={hasFlipped} />

      {/* Archetype flash text on flip */}
      <AnimatePresence>
        {burstActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -18, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-none z-40 whitespace-nowrap"
            style={{
              color: theme.color,
              textShadow: `0 0 10px ${theme.glow}`,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {theme.particles} {theme.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}