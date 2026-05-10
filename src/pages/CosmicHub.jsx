import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STAR_COUNT = 180;
const NEBULA_COUNT = 6;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function CosmosCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: randomBetween(0.4, 1.8),
      speed: randomBetween(0.00005, 0.00018),
      phase: Math.random() * Math.PI * 2,
    }));

    const nebulae = Array.from({ length: NEBULA_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      rx: randomBetween(120, 320), ry: randomBetween(80, 220),
      hue: [240, 260, 200, 280, 190, 300][Math.floor(Math.random() * 6)],
      alpha: randomBetween(0.04, 0.11),
    }));

    let t = 0;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, W * 0.85);
      bg.addColorStop(0, "#0d0820");
      bg.addColorStop(0.5, "#060412");
      bg.addColorStop(1, "#020208");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      nebulae.forEach((n) => {
        const grd = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.rx);
        grd.addColorStop(0, `hsla(${n.hue},70%,55%,${n.alpha})`);
        grd.addColorStop(1, `hsla(${n.hue},70%,30%,0)`);
        ctx.beginPath();
        ctx.ellipse(n.x * W, n.y * H, n.rx, n.ry, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      stars.forEach((s) => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed * 2000 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * twinkle})`;
        ctx.fill();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}

function DustMotes() {
  const motes = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${randomBetween(5, 95)}%`,
    top: `${randomBetween(10, 90)}%`,
    size: randomBetween(2, 5),
    delay: randomBetween(0, 8),
    dur: randomBetween(6, 14),
  }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      {motes.map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute", left: m.left, top: m.top,
            width: m.size, height: m.size, borderRadius: "50%",
            background: "rgba(180,140,255,0.35)", filter: "blur(1px)",
            animation: `dustFloat ${m.dur}s ${m.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function Portal({ to, icon, label, sub, accent, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        textDecoration: "none", cursor: "pointer",
        animation: `portalReveal 0.9s ${delay}s cubic-bezier(.2,.8,.2,1) both`,
        transition: "transform 0.35s cubic-bezier(.2,.8,.2,1)",
        transform: hovered ? "translateY(-10px) scale(1.04)" : "translateY(0) scale(1)",
      }}
    >
      <div
        style={{
          width: 110, height: 110, borderRadius: "50%",
          background: hovered
            ? `radial-gradient(circle at 38% 35%, ${accent}cc, ${accent}44 60%, transparent)`
            : `radial-gradient(circle at 38% 35%, ${accent}66, ${accent}22 60%, transparent)`,
          border: `1.5px solid ${accent}${hovered ? "cc" : "55"}`,
          boxShadow: hovered
            ? `0 0 40px ${accent}88, 0 0 80px ${accent}33, inset 0 0 30px ${accent}22`
            : `0 0 18px ${accent}33, inset 0 0 14px ${accent}11`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.35s ease", position: "relative", overflow: "hidden",
        }}
      >
        {hovered && (
          <div style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: `1px solid ${accent}66`,
            animation: "ringPulse 1.2s ease-out infinite",
          }} />
        )}
        <span style={{ fontSize: 38, lineHeight: 1, filter: "drop-shadow(0 0 8px white)" }}>
          {icon}
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.18em",
          textTransform: "uppercase", color: hovered ? "#fff" : "rgba(255,255,255,0.75)",
          transition: "color 0.3s", marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: 11,
          color: hovered ? accent : "rgba(180,160,220,0.55)",
          transition: "color 0.3s", letterSpacing: "0.06em",
        }}>
          {sub}
        </div>
      </div>
    </Link>
  );
}

export default function CosmicHub() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes dustFloat {
          from { transform: translateY(0px) scale(1); opacity: 0.4; }
          to   { transform: translateY(-22px) scale(1.3); opacity: 0.15; }
        }
        @keyframes portalReveal {
          from { opacity: 0; transform: translateY(28px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes titleReveal {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtitleReveal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tableFloat {
          0%   { transform: translateY(0px) rotate(-1deg); }
          50%  { transform: translateY(-12px) rotate(0deg); }
          100% { transform: translateY(0px) rotate(-1deg); }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);    opacity: 0.8; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes communityPop {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        fontFamily: "'Cinzel', serif",
        background: "#020208",
      }}>
        <CosmosCanvas />
        <DustMotes />

        {/* Nav */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 36px",
          background: "linear-gradient(to bottom, rgba(2,2,8,0.85) 0%, transparent 100%)",
        }}>
          <Link 
            to="/" 
            style={{ 
              animation: "communityPop 0.8s 1.6s both",
              display: "flex", 
              alignItems: "center",
              textDecoration: "none"
            }}
          >
            <img 
              src="https://media.base44.com/images/public/68d2a300021f94d0f312c039/dceb9973f_FFC86774-57E4-432D-9291-05752E7FDC5A.png" 
              alt="Rooted Crescent" 
              style={{ 
                width: 32,
                height: 32,
                borderRadius: 8,
                objectFit: 'cover',
                transition: "transform 0.25s, filter 0.25s",
                filter: "brightness(0.9)"
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.filter = "brightness(1.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(0.9)"; }}
            />
          </Link>

          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[
              { label: "Community", to: createPageUrl("Explore") },
              { label: "My Decks",  to: createPageUrl("Studio") },
              { label: "History",   to: createPageUrl("History") },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                style={{
                  fontFamily: "'Cinzel', serif", fontSize: 10.5, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "rgba(200,180,255,0.55)",
                  textDecoration: "none", transition: "color 0.25s",
                  animation: "communityPop 0.8s 1.6s both",
                }}
                onMouseEnter={(e) => (e.target.style.color = "rgba(200,170,255,1)")}
                onMouseLeave={(e) => (e.target.style.color = "rgba(200,180,255,0.55)")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Central content */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
        }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif", fontWeight: 700,
              fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "0.22em",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #c8a8ff 0%, #ffffff 40%, #a0c8ff 70%, #c8a8ff 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "titleReveal 1.1s 0.2s cubic-bezier(.2,.8,.2,1) both, shimmer 4s 1.4s linear infinite",
              marginBottom: 10,
            }}>
              Astral Insight
            </h1>
            <p style={{
              fontFamily: "'IM Fell English', serif", fontStyle: "italic",
              fontSize: "clamp(13px, 1.6vw, 17px)", color: "rgba(190,165,255,0.65)",
              letterSpacing: "0.08em", animation: "subtitleReveal 1.2s 0.9s ease both",
            }}>
              Choose your path among the stars
            </p>
          </div>

          {/* Crescent Table */}
          <div style={{
            position: "relative", width: "clamp(320px, 55vw, 620px)",
            animation: "tableFloat 7s ease-in-out infinite",
          }}>
            <svg viewBox="0 0 620 260" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", filter: "drop-shadow(0 18px 60px rgba(120,80,255,0.35))" }}>
              <defs>
                <radialGradient id="tableGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%"   stopColor="#2a1a5e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0e0820" stopOpacity="0.85" />
                </radialGradient>
                <radialGradient id="tableShine" cx="45%" cy="30%" r="55%">
                  <stop offset="0%"   stopColor="rgba(180,150,255,0.18)" />
                  <stop offset="100%" stopColor="rgba(180,150,255,0)" />
                </radialGradient>
                <filter id="tableShadow">
                  <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#7040ff" floodOpacity="0.28" />
                </filter>
              </defs>
              <ellipse cx="310" cy="145" rx="300" ry="108" fill="url(#tableGlow)" filter="url(#tableShadow)" />
              <ellipse cx="310" cy="118" rx="200" ry="72" fill="#0a0618" />
              <ellipse cx="310" cy="145" rx="300" ry="108" fill="url(#tableShine)" />
              <ellipse cx="310" cy="145" rx="300" ry="108" stroke="rgba(180,140,255,0.35)" strokeWidth="1.2" fill="none" />
              <ellipse cx="310" cy="118" rx="200" ry="72"  stroke="rgba(120,80,220,0.2)"  strokeWidth="0.8" fill="none" />
              {[[90,168],[155,195],[240,210],[310,215],[380,210],[465,195],[530,168]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(200,170,255,0.55)" />
              ))}
              <polyline points="90,168 155,195 240,210 310,215 380,210 465,195 530,168"
                stroke="rgba(180,140,255,0.18)" strokeWidth="0.8" fill="none" />
              <text x="310" y="205" textAnchor="middle" fontFamily="serif" fontSize="13"
                fill="rgba(200,170,255,0.4)" letterSpacing="6">✦  ◈  ✦</text>
            </svg>

            {/* Portals on the table */}
            <div style={{
              position: "absolute", bottom: "14%", left: 0, right: 0,
              display: "flex", justifyContent: "space-around", alignItems: "flex-end",
              padding: "0 2%",
            }}>
              <Portal to={createPageUrl("Dashboard")} icon="🌙" label="Reading Room" sub="Your central hub" accent="#a78bfa" delay={0.7} />
              <Portal to={createPageUrl("Studio")} icon="🎨" label="Creators Studio" sub="Build oracle decks" accent="#f472b6" delay={0.9} />
              <Portal to={createPageUrl("SpiritWheel")} icon="⚗️" label="Spirit Wheel" sub="Instant cosmic guidance" accent="#67e8f9" delay={1.1} />
            </div>
          </div>

          {/* Community link */}
          <Link
            to={createPageUrl("Explore")}
            style={{
              marginTop: 42, display: "inline-flex", alignItems: "center", gap: 10,
              fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "rgba(180,150,255,0.55)",
              textDecoration: "none", borderBottom: "1px solid rgba(180,150,255,0.2)",
              paddingBottom: 3, transition: "color 0.25s, border-color 0.25s",
              animation: "communityPop 0.9s 1.5s both",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(200,170,255,0.9)";
              e.currentTarget.style.borderColor = "rgba(200,170,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(180,150,255,0.55)";
              e.currentTarget.style.borderColor = "rgba(180,150,255,0.2)";
            }}
          >
            <span style={{ fontSize: 14 }}>✦</span>
            Explore the Community Vault
            <span style={{ fontSize: 14 }}>✦</span>
          </Link>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(to top, rgba(2,2,8,0.9), transparent)",
          zIndex: 5, pointerEvents: "none",
        }} />
      </div>
    </>
  );
}