import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

// ── Canvas: stars + nebulae ──────────────────────────────────────
function CosmicCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, raf;

    const STARS = Array.from({ length: 190 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.7,
      speed: 0.00006 + Math.random() * 0.00016,
      phase: Math.random() * Math.PI * 2,
    }));
    const NEBULAE = [
      { x: 0.18, y: 0.25, rx: 280, ry: 180, hue: 255, a: 0.08 },
      { x: 0.82, y: 0.20, rx: 240, ry: 160, hue: 200, a: 0.07 },
      { x: 0.5,  y: 0.7,  rx: 320, ry: 200, hue: 270, a: 0.06 },
      { x: 0.12, y: 0.75, rx: 200, ry: 130, hue: 240, a: 0.05 },
      { x: 0.88, y: 0.68, rx: 220, ry: 140, hue: 195, a: 0.06 },
      { x: 0.55, y: 0.12, rx: 180, ry: 110, hue: 290, a: 0.05 },
    ];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, W * 0.88);
      bg.addColorStop(0, "#0e0820");
      bg.addColorStop(0.5, "#060412");
      bg.addColorStop(1, "#020208");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      NEBULAE.forEach(n => {
        const g = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.rx);
        g.addColorStop(0, `hsla(${n.hue},68%,52%,${n.a})`);
        g.addColorStop(1, `hsla(${n.hue},68%,28%,0)`);
        ctx.beginPath();
        ctx.ellipse(n.x * W, n.y * H, n.rx, n.ry, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      STARS.forEach(s => {
        const tw = 0.5 + 0.5 * Math.sin(t * s.speed * 2000 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * tw, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * tw})`;
        ctx.fill();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Dust motes ───────────────────────────────────────────────────
function DustMotes() {
  const motes = useRef(
    Array.from({ length: 22 }, () => ({
      left: `${5 + Math.random() * 90}%`,
      top: `${8 + Math.random() * 84}%`,
      size: 2 + Math.random() * 4,
      dur: `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 8}s`,
    }))
  ).current;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      {motes.map((m, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            borderRadius: "50%",
            background: "rgba(175,135,255,.3)",
            filter: "blur(1.2px)",
            animation: `cosmicDustFloat ${m.dur} ${m.delay} ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ── Orb Portal ───────────────────────────────────────────────────
function OrbPortal({ emoji, label, sub, color, to, delay }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(to)}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
    >
      <motion.div
        animate={{ y: hovered ? -10 : 0, scale: hovered ? 1.06 : 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        {/* Orb */}
        <div style={{ position: "relative" }}>
          {/* Pulse ring */}
          <div style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: `1px solid ${color}99`,
            animation: "cosmicRingPulse 2s ease-out infinite",
            pointerEvents: "none",
          }} />
          <motion.div
            animate={{ boxShadow: hovered
              ? `0 0 42px ${color}bb, 0 0 80px ${color}44, inset 0 0 24px ${color}22`
              : `0 0 22px ${color}66, inset 0 0 14px ${color}11`
            }}
            transition={{ duration: 0.4 }}
            style={{
              width: 108, height: 108, borderRadius: "50%",
              background: `radial-gradient(circle at 38% 35%, ${color}88 0%, ${color}22 60%, transparent 100%)`,
              border: `1.5px solid ${color}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38,
              filter: hovered ? `drop-shadow(0 0 12px ${color})` : "none",
              transition: "filter 0.3s",
            }}
          >
            {emoji}
          </motion.div>
        </div>

        {/* Labels */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 12.5, letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: hovered ? "#ffffff" : "rgba(255,255,255,.72)",
            transition: "color 0.3s",
            marginBottom: 3,
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: 11, letterSpacing: "0.06em",
            color: `${color}99`,
          }}>
            {sub}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function CosmicHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#020208", overflow: "hidden", position: "relative" }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes cosmicDustFloat {
          from { transform: translateY(0px) scale(1); opacity: 0.5; }
          to   { transform: translateY(-24px) scale(1.4); opacity: 0.1; }
        }
        @keyframes cosmicRingPulse {
          0%   { transform: scale(1);    opacity: 0.85; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
        @keyframes cosmicShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes cosmicTableFloat {
          0%   { transform: translateY(0px) rotate(-0.5deg); }
          50%  { transform: translateY(-13px) rotate(0.3deg); }
          100% { transform: translateY(0px) rotate(-0.5deg); }
        }
        @keyframes cosmicTitleReveal {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cosmicCommunityPop {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <CosmicCanvas />
      <DustMotes />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 36px",
        background: "linear-gradient(to bottom, rgba(2,2,8,.88) 0%, transparent 100%)",
      }}>
        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(180,150,255,.55)" }}>
          Rooted Crescent
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { label: "Community", to: "Explore" },
            { label: "My Decks", to: "Studio" },
            { label: "History", to: "History" },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={createPageUrl(to)}
              style={{
                fontFamily: "'Cinzel', Georgia, serif", fontSize: 10.5, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "rgba(200,180,255,.5)",
                textDecoration: "none", transition: "color .25s",
                animation: "cosmicCommunityPop .8s 1.6s both",
              }}
              onMouseEnter={e => e.target.style.color = "rgba(210,190,255,1)"}
              onMouseLeave={e => e.target.style.color = "rgba(200,180,255,.5)"}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <Link
              to={createPageUrl("Dashboard")}
              style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(200,180,255,.5)", textDecoration: "none", transition: "color .25s", animation: "cosmicCommunityPop .8s 1.6s both" }}
              onMouseEnter={e => e.target.style.color = "rgba(210,190,255,1)"}
              onMouseLeave={e => e.target.style.color = "rgba(200,180,255,.5)"}
            >
              Dashboard
            </Link>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(200,180,255,.5)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10, paddingTop: 20 }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 46, animation: "cosmicTitleReveal .9s .2s cubic-bezier(.2,.8,.2,1) both" }}>
          <h1 style={{
            fontFamily: "'Cinzel', Georgia, serif", fontWeight: 700,
            fontSize: "clamp(26px, 4.8vw, 50px)", letterSpacing: "0.22em",
            textTransform: "uppercase",
            background: "linear-gradient(90deg,#c8a8ff 0%,#ffffff 40%,#a0c8ff 70%,#c8a8ff 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "cosmicShimmer 4s 1.2s linear infinite",
            marginBottom: 10,
          }}>
            The Oracle Chamber
          </h1>
          <p style={{
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: "clamp(13px, 1.5vw, 16px)", color: "rgba(190,165,255,.6)",
            letterSpacing: "0.08em",
          }}>
            Choose your path among the stars
          </p>
        </div>

        {/* Crescent Table */}
        <div style={{ position: "relative", width: "clamp(300px, 54vw, 600px)", animation: "cosmicTableFloat 7s ease-in-out infinite" }}>
          <svg viewBox="0 0 620 270" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", filter: "drop-shadow(0 16px 55px rgba(110,70,255,.38))" }}>
            <defs>
              <radialGradient id="chTg" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#2a1a5e" stopOpacity=".96"/>
                <stop offset="100%" stopColor="#0e0820" stopOpacity=".88"/>
              </radialGradient>
              <radialGradient id="chTs" cx="44%" cy="28%" r="55%">
                <stop offset="0%" stopColor="rgba(190,160,255,.2)"/>
                <stop offset="100%" stopColor="rgba(190,160,255,0)"/>
              </radialGradient>
              <filter id="chShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="7" stdDeviation="16" floodColor="#6030e0" floodOpacity=".3"/>
              </filter>
            </defs>
            {/* Table body */}
            <ellipse cx="310" cy="150" rx="300" ry="112" fill="url(#chTg)" filter="url(#chShadow)"/>
            {/* Inner crescent cutout */}
            <ellipse cx="310" cy="120" rx="200" ry="74" fill="#08051a"/>
            {/* Shine */}
            <ellipse cx="310" cy="150" rx="300" ry="112" fill="url(#chTs)"/>
            {/* Rims */}
            <ellipse cx="310" cy="150" rx="300" ry="112" stroke="rgba(180,140,255,.38)" strokeWidth="1.3" fill="none"/>
            <ellipse cx="310" cy="120" rx="200" ry="74" stroke="rgba(120,80,220,.22)" strokeWidth=".9" fill="none"/>
            {/* Constellation dots + line */}
            {[88,155,242,310,378,465,532].map((x, i) => {
              const ys = [172,200,216,220,216,200,172];
              return <circle key={i} cx={x} cy={ys[i]} r={i === 3 ? 2.8 : 2.4} fill={i === 3 ? "rgba(210,180,255,.7)" : "rgba(210,180,255,.55)"}/>;
            })}
            <polyline points="88,172 155,200 242,216 310,220 378,216 465,200 532,172" stroke="rgba(180,140,255,.18)" strokeWidth=".8" fill="none"/>
            {/* Glyph */}
            <text x="310" y="208" textAnchor="middle" fontFamily="serif" fontSize="13" fill="rgba(200,170,255,.42)" letterSpacing="7">✦  ◈  ✦</text>
          </svg>

          {/* Orb Portals ON the table */}
          <div style={{
            position: "absolute", bottom: "13%", left: 0, right: 0,
            display: "flex", justifyContent: "space-around", alignItems: "flex-end",
            padding: "0 9%",
          }}>
            <OrbPortal
              emoji="🌙"
              label="Read Mode"
              sub="Readings & community decks"
              color="#a78bfa"
              to={createPageUrl("ReadingRoom")}
              delay={0.7}
            />
            <OrbPortal
              emoji="⚗️"
              label="Build Mode"
              sub="Spirit Wheel & deck designer"
              color="#67e8f9"
              to={createPageUrl("Studio")}
              delay={1.0}
            />
          </div>
        </div>

        {/* Community Vault link */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.9 }}
          style={{ marginTop: 40 }}
        >
          <Link
            to={createPageUrl("Explore")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              fontFamily: "'Cinzel', Georgia, serif", fontSize: 10.5, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "rgba(180,150,255,.5)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(180,150,255,.2)",
              paddingBottom: 3, transition: "color .25s, border-color .25s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "rgba(210,185,255,.9)";
              e.currentTarget.style.borderColor = "rgba(210,185,255,.45)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "rgba(180,150,255,.5)";
              e.currentTarget.style.borderColor = "rgba(180,150,255,.2)";
            }}
          >
            <span style={{ fontSize: 13 }}>✦</span>
            Explore the Community Vault
            <span style={{ fontSize: 13 }}>✦</span>
          </Link>
        </motion.div>

        {/* Welcome / sign-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
          style={{ marginTop: 18, textAlign: "center" }}
        >
          {user ? (
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(190,165,255,.4)" }}>
              Welcome back, <span style={{ color: "rgba(190,165,255,.7)" }}>{user.full_name || user.email}</span>
            </p>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              style={{
                fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12,
                color: "rgba(190,165,255,.4)", background: "none", border: "none",
                cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4,
                transition: "color .25s",
              }}
              onMouseEnter={e => e.target.style.color = "rgba(210,185,255,.8)"}
              onMouseLeave={e => e.target.style.color = "rgba(190,165,255,.4)"}
            >
              Sign in to save your readings →
            </button>
          )}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 70, background: "linear-gradient(to top, rgba(2,2,8,.9), transparent)", zIndex: 5, pointerEvents: "none" }} />
    </div>
  );
}