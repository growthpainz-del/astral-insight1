import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Wand2, Users, ChevronRight, Star } from "lucide-react";

// ─── Particle Canvas ────────────────────────────────────────────────────────
function CosmicCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", resize);

    // Stars
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.004 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Nebula dust particles
    const dust = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 80 + 30,
      hue: Math.random() > 0.5 ? 270 : 200, // purple or cyan
      alpha: Math.random() * 0.07 + 0.02,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
    }));

    // Shooting stars
    const shootingStars = Array.from({ length: 4 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.5,
      vx: (Math.random() * 3 + 2),
      vy: (Math.random() * 1.5 + 0.5),
      len: Math.random() * 100 + 60,
      alpha: 0,
      life: Math.random() * 300,
      maxLife: Math.random() * 60 + 40,
    }));

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Deep space gradient bg
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      bg.addColorStop(0, "#0a0118");
      bg.addColorStop(0.5, "#060330");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Nebula dust
      dust.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -d.r) d.x = W + d.r;
        if (d.x > W + d.r) d.x = -d.r;
        if (d.y < -d.r) d.y = H + d.r;
        if (d.y > H + d.r) d.y = -d.r;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, `hsla(${d.hue}, 80%, 60%, ${d.alpha * 1.5})`);
        g.addColorStop(1, `hsla(${d.hue}, 80%, 60%, 0)`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Stars
      stars.forEach((s) => {
        const flicker = Math.sin(t * s.speed * 60 + s.twinkleOffset) * 0.4 + 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flicker * s.alpha})`;
        ctx.fill();
      });

      // Shooting stars
      shootingStars.forEach((ss) => {
        ss.life++;
        if (ss.life > ss.maxLife + 200) {
          ss.x = Math.random() * W * 0.7;
          ss.y = Math.random() * H * 0.4;
          ss.vx = Math.random() * 3 + 2;
          ss.vy = Math.random() * 1.5 + 0.5;
          ss.len = Math.random() * 100 + 60;
          ss.life = 0;
          ss.maxLife = Math.random() * 60 + 40;
        }
        const progress = ss.life / ss.maxLife;
        const a = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        if (a > 0) {
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(ss.x - ss.vx * (ss.len / ss.vx), ss.y - ss.vy * (ss.len / ss.vx));
          const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.len, ss.y - (ss.vy / ss.vx) * ss.len);
          grad.addColorStop(0, `rgba(255,255,255,${a * 0.9})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ss.x += ss.vx * 0.8;
          ss.y += ss.vy * 0.8;
        }
      });

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}

// ─── Crescent Table SVG ──────────────────────────────────────────────────────
function CrescentTable({ children }) {
  return (
    <div className="relative w-full max-w-3xl mx-auto" style={{ aspectRatio: "1.4/1" }}>
      {/* Crescent shape via CSS clip */}
      <svg
        viewBox="0 0 700 500"
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="tableGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e0a4a" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0d0530" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#050118" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="crescentClip">
            <path d="M350,30 
              A 280,230 0 1 1 350,470 
              A 180,160 0 1 0 350,30 Z" />
          </clipPath>
        </defs>

        {/* Outer glow */}
        <ellipse cx="350" cy="250" rx="320" ry="260" fill="url(#glowGrad)" filter="url(#softGlow)" />

        {/* Table surface */}
        <path
          d="M350,30 A 280,230 0 1 1 350,470 A 180,160 0 1 0 350,30 Z"
          fill="url(#tableGrad)"
          stroke="#7c3aed"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          filter="url(#glow)"
        />

        {/* Constellation lines on table */}
        <g opacity="0.15" stroke="#a78bfa" strokeWidth="0.8">
          <line x1="200" y1="120" x2="280" y2="180" />
          <line x1="280" y1="180" x2="320" y2="140" />
          <line x1="320" y1="140" x2="400" y2="160" />
          <line x1="150" y1="300" x2="220" y2="260" />
          <line x1="220" y1="260" x2="260" y2="310" />
          <line x1="500" y1="200" x2="560" y2="240" />
          <line x1="560" y1="240" x2="530" y2="300" />
        </g>

        {/* Constellation dots */}
        <g fill="#c4b5fd" opacity="0.3">
          {[
            [200,120],[280,180],[320,140],[400,160],
            [150,300],[220,260],[260,310],
            [500,200],[560,240],[530,300],
          ].map(([cx,cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2.5" />
          ))}
        </g>

        {/* Crescent moon symbol top-center */}
        <text x="350" y="70" textAnchor="middle" fontSize="24" fill="#f3e8ff" opacity="0.7">☽</text>

        {/* Subtle arc ring inside */}
        <path
          d="M350,80 A 230,185 0 1 1 350,420 A 140,125 0 1 0 350,80 Z"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="0.5"
          strokeOpacity="0.25"
          strokeDasharray="4 8"
        />

        {/* Crystal ball glow center */}
        <radialGradient id="crystalGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#e0d7ff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#a78bfa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.3" />
        </radialGradient>
        <circle cx="350" cy="240" r="48" fill="url(#crystalGrad)" filter="url(#softGlow)" opacity="0.5" />
        <circle cx="350" cy="240" r="34" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.4" />
        <circle cx="335" cy="228" r="8" fill="white" opacity="0.12" />
      </svg>

      {/* Floating content overlaid on the table */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}

// ─── Portal Card ─────────────────────────────────────────────────────────────
function PortalCard({ to, icon: Icon, title, subtitle, items, color, delay, glowColor }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="cursor-pointer" onClick={() => navigate(to)}>
        <motion.div
          animate={{ y: hovered ? -6 : 0, scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative group cursor-pointer rounded-2xl overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at top, ${color}22 0%, #0d0530 70%)`,
            border: `1px solid ${color}55`,
            boxShadow: hovered
              ? `0 0 40px ${glowColor}60, 0 0 80px ${glowColor}30, inset 0 1px 0 ${color}40`
              : `0 0 20px ${glowColor}20, inset 0 1px 0 ${color}20`,
            width: "200px",
            minHeight: "260px",
            transition: "box-shadow 0.4s ease",
          }}
        >
          {/* Top glow bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />

          {/* Swirling portal ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border opacity-20"
            style={{ borderColor: color, borderStyle: "dashed" }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border opacity-15"
            style={{ borderColor: color, borderStyle: "dotted" }}
          />

          <div className="relative z-10 p-6 flex flex-col items-center text-center gap-3">
            {/* Icon portal */}
            <motion.div
              animate={{ scale: hovered ? 1.15 : 1 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mb-1"
              style={{
                background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                border: `1px solid ${color}50`,
                boxShadow: `0 0 20px ${glowColor}40`,
              }}
            >
              <Icon className="w-8 h-8" style={{ color }} />
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
              <p className="text-xs mt-1 opacity-60 text-white">{subtitle}</p>
            </div>

            <div className="w-full space-y-1.5 mt-1">
              {items.map((item, i) => (
                <div
                  key={i}
                  onClick={(e) => {
                    if (item.to) {
                      e.stopPropagation();
                      navigate(item.to);
                    }
                  }}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${item.to ? 'hover:bg-white/10' : ''}`}
                  style={{ background: `${color}12`, border: `1px solid ${color}20` }}
                >
                  <ChevronRight className="w-3 h-3 opacity-50" style={{ color }} />
                  <span className="text-white/70">{item.label || item}</span>
                </div>
              ))}
            </div>

            <motion.div
              animate={{ opacity: hovered ? 1 : 0.5 }}
              className="mt-2 text-xs font-semibold tracking-widest uppercase"
              style={{ color }}
            >
              Enter Portal →
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CosmicHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [floatY, setFloatY] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Gentle floating animation via JS for the whole table
  useEffect(() => {
    let frame;
    let t = 0;
    const tick = () => {
      t += 0.008;
      setFloatY(Math.sin(t) * 10);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#000" }}>

      {/* Cosmic particle canvas */}
      <CosmicCanvas />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 text-center mb-6 md:mb-8 px-4"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-4 h-4 text-purple-400 opacity-60" />
          <span className="text-purple-300/60 text-xs uppercase tracking-[0.3em]">Astral Insight</span>
          <Star className="w-4 h-4 text-purple-400 opacity-60" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(135deg, #f3e8ff 0%, #a78bfa 50%, #60a5fa 100%)" }}>
          The Cosmic Table
        </h1>
        <p className="text-purple-200/50 text-sm md:text-base mt-2">
          Your portal to divination & creation
        </p>
      </motion.div>

      {/* Floating crescent table with portals */}
      <div
        className="relative z-10 w-full px-4"
        style={{ transform: `translateY(${floatY}px)`, transition: "transform 0.1s linear" }}
      >
        <CrescentTable>
          {/* Portals overlaid on crescent */}
          <div className="flex items-center justify-around w-full px-8 md:px-16 pointer-events-auto gap-4 md:gap-0">
            {/* READ portal — left side of crescent */}
            <PortalCard
              to={createPageUrl("ReadingRoom")}
              icon={BookOpen}
              title="Read Mode"
              subtitle="Readings & Community Decks"
              items={[
                { label: "Start a Reading", to: createPageUrl("Reading") },
                { label: "Community Decks", to: createPageUrl("ReadingRoom") },
                { label: "Oracle Chat", to: createPageUrl("AgentChat") },
                { label: "Reading History", to: createPageUrl("History") },
              ]}
              color="#a78bfa"
              glowColor="#7c3aed"
              delay={0.5}
            />

            {/* Center crystal orb link */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
              className="pointer-events-auto hidden md:flex flex-col items-center gap-2"
            >
              <Link to={createPageUrl("Dashboard")}>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #e0d7ff, #a78bfa, #4c1d95)",
                    boxShadow: "0 0 30px #7c3aed80, 0 0 60px #7c3aed40",
                    border: "1px solid #c4b5fd40"
                  }}
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
              </Link>
              <span className="text-purple-300/50 text-[10px] uppercase tracking-widest">All Tools</span>
            </motion.div>

            {/* BUILD portal — right side of crescent */}
            <PortalCard
              to={createPageUrl("Studio")}
              icon={Wand2}
              title="Build Mode"
              subtitle="Spirit Wheel & Deck Designer"
              items={[
                { label: "Spirit Wheel Designer", to: createPageUrl("SpiritWheelDesigner") },
                { label: "Deck Designer", to: createPageUrl("Studio") },
                { label: "Spread Builder", to: createPageUrl("SpreadManager") },
                { label: "Card Library", to: createPageUrl("CardLibrary") },
              ]}
              color="#34d399"
              glowColor="#10b981"
              delay={0.65}
            />
          </div>
        </CrescentTable>
      </div>

      {/* Bottom navigation pills */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="relative z-10 flex flex-wrap justify-center gap-3 mt-8 px-4"
      >
        {[
          { label: "Community", icon: Users, to: "Explore" },
          { label: "Oracle Chat", icon: Sparkles, to: "AgentChat" },
          { label: "Pendulum", icon: Star, to: "Pendulum" },
          { label: "My Readings", icon: BookOpen, to: "History" },
        ].map(({ label, icon: Icon, to }) => (
          <Link key={to} to={createPageUrl(to)}>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-purple-200/70 hover:text-purple-100 transition-colors"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* User welcome or login */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="relative z-10 mt-6 text-center"
      >
        {user ? (
          <p className="text-purple-300/40 text-xs">
            Welcome back, <span className="text-purple-300/70">{user.full_name || user.email}</span>
          </p>
        ) : (
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="text-purple-400/60 hover:text-purple-300 text-xs underline underline-offset-4 transition-colors"
          >
            Sign in to save your readings →
          </button>
        )}
      </motion.div>

      {/* Floating mystical particles overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${10 + (i * 7.5)}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: i % 2 === 0 ? "#a78bfa" : "#34d399",
              boxShadow: i % 2 === 0 ? "0 0 6px #a78bfa" : "0 0 6px #34d399",
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.4, 0.8],
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}