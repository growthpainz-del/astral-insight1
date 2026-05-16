import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MoonPhaseWidget from "@/components/dashboard/MoonPhaseWidget";
import { BookOpen, Palette, Sparkles, Layers, Image as ImageIcon, History, Compass, HelpCircle, Star, GitMerge, Sprout, Users, Coins, ShieldAlert } from "lucide-react";
import { isUserAdmin } from "@/components/utils/adminGuard";
import { base44 } from "@/api/base44Client";

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

function FeatureCard({ to, icon: Icon, title, desc, color }) {
  return (
    <Link to={to} className="block group h-full">
      <div 
        className="h-full p-5 sm:p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-black/60 hover:border-white/20 flex flex-col items-center text-center"
        style={{ 
          boxShadow: `inset 0 0 20px ${color}10, 0 4px 20px rgba(0,0,0,0.4)`, 
        }}
      >
        <Icon className="w-8 h-8 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_currentColor]" style={{ color }} />
        <h3 className="text-white font-bold text-lg mb-2 font-['Cinzel'] tracking-wide">{title}</h3>
        <p className="text-white/60 text-sm font-['Crimson_Text'] leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

const CATEGORIES = [
  {
    title: "Cosmic Pathways",
    icon: Sparkles,
    features: [
      { title: "Reading Room", desc: "Draw cards & gain deep insights.", to: createPageUrl("ReadingRoom"), icon: BookOpen, color: "#a78bfa" },
      { title: "Spirit Wheel", desc: "Instant cosmic guidance with a spin.", to: createPageUrl("SpiritWheel"), icon: Sparkles, color: "#67e8f9" },
      { title: "Reading History", desc: "View past readings and track your journey.", to: createPageUrl("History"), icon: History, color: "#94a3b8" },
      { title: "Journal", desc: "Write reflections and notes on your daily life.", to: createPageUrl("Journal"), icon: Compass, color: "#fbbf24" },
    ]
  },
  {
    title: "Special Readings",
    icon: Star,
    features: [
      { title: "Fusions", desc: "Combine deck energies for unique readings.", to: createPageUrl("FusionReading"), icon: GitMerge, color: "#ec4899" },
      { title: "Zodiac", desc: "Astrological and celestial readings.", to: createPageUrl("ZodiacReading"), icon: Star, color: "#eab308" },
    ]
  },
  {
    title: "Creator Studio",
    icon: Palette,
    features: [
      { title: "My Decks", desc: "Build, design, and manage your oracle decks.", to: createPageUrl("Studio"), icon: Palette, color: "#f472b6" },
      { title: "Create Deck", desc: "Start a new journey with a fresh deck.", to: createPageUrl("CreateDeck"), icon: Sprout, color: "#34d399" },
      { title: "Spreads", desc: "Design and manage custom card spreads.", to: createPageUrl("SpreadManager"), icon: Layers, color: "#818cf8" },
      { title: "Persona", desc: "Configure your AI reading persona.", to: createPageUrl("Persona"), icon: Sparkles, color: "#fcd34d" },
    ]
  },
  {
    title: "Discover",
    icon: Compass,
    features: [
      { title: "Deck Gallery", desc: "Browse and discover oracle decks.", to: createPageUrl("Explore"), icon: Layers, color: "#34d399" },
      { title: "Card Gallery", desc: "Explore individual cards across the universe.", to: createPageUrl("CardLibrary"), icon: ImageIcon, color: "#fb923c" },
      { title: "Help & Guides", desc: "Learn how to use the app and read cards.", to: createPageUrl("Help"), icon: HelpCircle, color: "#f87171" },
    ]
  },
  {
    title: "Account & Settings",
    icon: Users,
    features: [
      { title: "Account", desc: "Manage your profile and preferences.", to: createPageUrl("Account"), icon: Users, color: "#94a3b8" },
      { title: "Subscription", desc: "Manage your tokens and plan.", to: createPageUrl("SubscriptionManagement"), icon: Coins, color: "#fbbf24" },
    ]
  }
];

const ADMIN_CATEGORY = {
  title: "Admin Controls",
  icon: ShieldAlert,
  features: [
    { title: "Manage Users", desc: "View and manage user accounts.", to: createPageUrl("AdminUsers"), icon: Users, color: "#ef4444" },
    { title: "Review Decks", desc: "Approve submitted decks.", to: createPageUrl("AdminDeckReview"), icon: Sparkles, color: "#f97316" },
    { title: "Token Grant", desc: "Grant tokens to users.", to: createPageUrl("AdminTokenGrant"), icon: Coins, color: "#eab308" },
    { title: "Seed Spreads", desc: "Manage system spreads.", to: createPageUrl("SpreadManager"), icon: Layers, color: "#3b82f6" },
  ]
};

export default function DashboardHub() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsAdmin(isUserAdmin(u));
    }).catch(console.error);
  }, []);

  const visibleCategories = isAdmin ? [...CATEGORIES, ADMIN_CATEGORY] : CATEGORIES;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes dustFloat {
          from { transform: translateY(0px) scale(1); opacity: 0.4; }
          to   { transform: translateY(-22px) scale(1.3); opacity: 0.15; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      <div className="min-h-screen relative font-['Crimson_Text'] text-white selection:bg-purple-500/30 pb-20 overflow-x-hidden">
        <CosmosCanvas />
        <DustMotes />

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 space-y-12 sm:space-y-16">
          <header className="text-center space-y-4">
            <img 
              src="https://media.base44.com/images/public/68d2a300021f94d0f312c039/dceb9973f_FFC86774-57E4-432D-9291-05752E7FDC5A.png" 
              alt="Astral Insight Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl shadow-xl shadow-purple-900/40 border border-purple-500/20 mb-6"
            />
            <h1 style={{
              fontFamily: "'Cinzel', serif", fontWeight: 700,
              fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #c8a8ff 0%, #ffffff 40%, #a0c8ff 70%, #c8a8ff 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 5s linear infinite",
            }}>
              Dashboard Hub
            </h1>
          </header>

          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
            <MoonPhaseWidget />
          </section>

          <div className="space-y-12">
            {visibleCategories.map((category, idx) => {
              const Icon = category.icon;
              return (
              <section key={category.title} className={`animate-in fade-in slide-in-from-bottom-8 duration-700 delay-${(idx + 2) * 100} fill-mode-both`}>
                <h2 className="font-['Cinzel'] text-xl sm:text-2xl text-white/90 tracking-widest uppercase mb-6 flex items-center gap-3">
                  <Icon className="w-5 h-5 text-purple-400" />
                  {category.title}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {category.features.map((feature) => (
                    <FeatureCard key={feature.title} {...feature} />
                  ))}
                </div>
              </section>
            )})}
          </div>
        </main>
      </div>
    </>
  );
}