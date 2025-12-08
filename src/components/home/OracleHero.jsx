
import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function OracleHero() {
  // NEW: use the provided image URL
  const HERO_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/700bd7a94_0DC18799-794E-447B-AD87-0A5B20D22CE5.png";

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
      {/* Background gradient + subtle vignette */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% -10%, rgba(147, 51, 234, 0.25), transparent 60%), radial-gradient(900px 600px at 100% 0%, rgba(6, 182, 212, 0.18), transparent 60%)",
          }}
        />
      </div>

      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: 2 + (i % 2),
              height: 2 + (i % 2),
              backgroundColor: "rgba(255,255,255,0.6)",
              opacity: 0.6 - (i % 3) * 0.15,
              filter: "drop-shadow(0 0 6px rgba(255,255,255,0.7))",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 sm:p-10 lg:p-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Copy */}
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Read the signs. Shape your path.
            </h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-white/80">
              Explore official and custom oracle decks, draw cards, and capture your insights with a beautiful reading flow.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  <BookOpen className="w-5 h-5 mr-2" />
                  View Decks
                </Button>
              </Link>
              <Link to={createPageUrl("Help")}>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  How it works
                </Button>
              </Link>
            </div>
          </div>

          {/* Illustration replaced with your image */}
          <div className="w-full max-w-md mx-auto md:max-w-lg">
            <div className="relative">
              <img
                src={HERO_IMAGE_URL}
                alt="Mystical crescent moon lifting oracle cards"
                className="w-full h-auto select-none pointer-events-none"
                loading="eager"
                decoding="async"
                style={{
                  filter:
                    "drop-shadow(0 8px 40px rgba(56,189,248,0.35)) drop-shadow(0 4px 18px rgba(168,85,247,0.35))",
                }}
              />
              {/* Soft glow behind the image for depth */}
              <div className="absolute -inset-6 bg-gradient-to-b from-cyan-400/10 via-fuchsia-500/10 to-transparent blur-2xl rounded-[40px] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
