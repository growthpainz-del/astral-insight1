import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import MoonPhaseWidget from "@/components/dashboard/MoonPhaseWidget";
import { BookOpen, Palette, Sparkles, Users, History, Compass } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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
        className="h-full p-5 sm:p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-black/60 hover:border-white/20"
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

function SimpleDeckCard({ deck }) {
  return (
    <Link to={createPageUrl(`DeckGallery?deckId=${deck.id}`)} className="block group">
      <div className="w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden relative border border-white/10 group-hover:border-purple-500/50 transition-all shadow-lg">
        {deck.cover_image ? (
          <img src={deck.cover_image} alt={deck.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-purple-900/30 flex items-center justify-center">
            <Palette className="w-8 h-8 text-white/30" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <p className="text-white text-xs sm:text-sm font-bold truncate drop-shadow-md">{deck.name}</p>
          <p className="text-white/60 text-[10px] sm:text-xs truncate mt-0.5">{deck.category || "Oracle"}</p>
        </div>
      </div>
    </Link>
  );
}

const FEATURES = [
  { title: "Reading Room", desc: "Draw cards & gain deep insights from your decks.", to: createPageUrl("ReadingRoom"), icon: BookOpen, color: "#a78bfa" },
  { title: "Creator Studio", desc: "Build, design, and manage your own oracle decks.", to: createPageUrl("Studio"), icon: Palette, color: "#f472b6" },
  { title: "Spirit Wheel", desc: "Instant cosmic guidance with a spin of the wheel.", to: createPageUrl("SpiritWheel"), icon: Sparkles, color: "#67e8f9" },
  { title: "Community Vault", desc: "Explore and read with decks published by the community.", to: createPageUrl("Explore"), icon: Users, color: "#34d399" },
  { title: "Reading History", desc: "View past readings and track your journey.", to: createPageUrl("History"), icon: History, color: "#94a3b8" },
  { title: "Journal", desc: "Write reflections and notes on your daily life.", to: createPageUrl("Journal"), icon: Compass, color: "#fbbf24" },
];

export default function CosmicHub() {
  const [deckOfWeek, setDeckOfWeek] = useState(null);
  const [newDecks, setNewDecks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const publicDecks = await base44.entities.Deck.filter({ is_public: true }, "-created_date", 8);
        if (publicDecks && publicDecks.length > 0) {
          // Pick a deck of the week (deterministic based on current week to seem authentic)
          const weekNum = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
          const dotwIndex = weekNum % publicDecks.length;
          setDeckOfWeek(publicDecks[dotwIndex]);
          
          // Remaining are "What's New"
          setNewDecks(publicDecks.filter((_, i) => i !== dotwIndex));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

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
          
          {/* Header */}
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
              Astral Insight
            </h1>
            <p className="font-['IM_Fell_English'] italic text-lg sm:text-xl text-purple-200/70 tracking-widest">
              Choose your path among the stars
            </p>
          </header>

          {/* Moon Phase Widget */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
            <MoonPhaseWidget />
          </section>

          {/* Main Features Grid */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
            <h2 className="font-['Cinzel'] text-xl sm:text-2xl text-white/90 tracking-widest uppercase mb-6 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Cosmic Pathways
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </section>

          {/* Deck of the Week & What's New */}
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            
            {/* Deck of the week */}
            <section className="md:col-span-1">
              <h2 className="font-['Cinzel'] text-xl text-white/90 tracking-widest uppercase mb-6 flex items-center gap-2">
                <span className="text-amber-400">★</span> Deck of the Week
              </h2>
              {deckOfWeek ? (
                <div className="relative group h-full">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center h-full justify-center">
                    <SimpleDeckCard deck={deckOfWeek} />
                    <h3 className="font-bold text-lg mt-5 text-amber-100">{deckOfWeek.name}</h3>
                    <p className="text-sm text-white/60 line-clamp-3 mt-2 font-['Crimson_Text']">
                      {deckOfWeek.description || "A wonderful deck from the community vault."}
                    </p>
                    <Link to={createPageUrl(`ReadingRoom?deckId=${deckOfWeek.id}`)} className="mt-5 w-full">
                      <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/40 hover:to-purple-500/40 border border-amber-500/30 text-amber-100 text-sm font-semibold transition-all">
                        Read with this deck
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center text-white/50 italic h-64 flex items-center justify-center">
                  Discovering stars...
                </div>
              )}
            </section>

            {/* What's New */}
            <section className="md:col-span-2">
              <h2 className="font-['Cinzel'] text-xl text-white/90 tracking-widest uppercase mb-6 flex items-center gap-2">
                <span className="text-cyan-400">✧</span> What's New
              </h2>
              <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 h-full flex flex-col justify-center">
                {newDecks.length > 0 ? (
                  <div className="relative">
                    <Carousel opts={{ align: "start", dragFree: true, loop: false }} className="w-full touch-pan-y">
                      <CarouselContent className="-ml-4 py-2">
                        {newDecks.map(deck => (
                          <CarouselItem key={deck.id} className="pl-4 basis-auto shrink-0">
                            <SimpleDeckCard deck={deck} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <div className="hidden sm:block">
                        <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-black/60 border-white/20 text-white hover:bg-black" />
                        <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-black/60 border-white/20 text-white hover:bg-black" />
                      </div>
                    </Carousel>
                  </div>
                ) : (
                  <div className="text-center text-white/50 italic py-12">
                    No new decks recently added to the vault.
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <Link to={createPageUrl("Explore")} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors uppercase tracking-wider font-['Cinzel']">
                    Browse the full community vault ⟶
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}