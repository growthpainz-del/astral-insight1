import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Orbit, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05050a] text-white overflow-hidden relative">
      {/* Background gradients */}
      <div 
        className="absolute inset-0 z-0 opacity-40" 
        style={{ 
          background: 'radial-gradient(circle at 50% 30%, #3b1c6d 0%, #05050a 60%)' 
        }} 
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent z-10" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-12 flex flex-col items-center min-h-screen">
        
        {/* Header */}
        <header className="w-full flex justify-between items-center mb-16 md:mb-24">
          <div className="flex items-center gap-3">
            <img 
              src="https://media.base44.com/images/public/68d2a300021f94d0f312c039/87ddf47a1_2EC745CC-69B3-47EE-AC3A-6F29ABBF057F.png" 
              alt="Astral Insight" 
              className="w-10 h-10 rounded-full object-cover border border-purple-500/30" 
            />
            <span 
              className="font-bold tracking-widest uppercase text-lg text-purple-100" 
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Astral Insight
            </span>
          </div>
          <Button 
            variant="outline" 
            className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20 rounded-full px-6" 
            onClick={() => navigate(createPageUrl("CosmicHub"))}
          >
            Enter App
          </Button>
        </header>

        {/* Hero Section */}
        <main className="text-center flex flex-col items-center w-full flex-1 justify-center pb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3 h-3" />
            <span>The New Standard in Digital Divination</span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-100 to-cyan-100 leading-tight drop-shadow-sm" 
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Your Digital Oracle.
          </h1>
          
          <p className="text-lg md:text-xl text-purple-200/70 mb-12 max-w-2xl leading-relaxed font-light">
            Discover deterministic interpretations, custom tarot decks, and the immersive Spirit Wheel. A specialized reading engine for pattern synthesis and spiritual exploration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-24 w-full sm:w-auto">
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-8 py-7 text-lg shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] group" 
              onClick={() => navigate(createPageUrl("ReadingRoom"))}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Free Reading
              <ArrowRight className="w-5 h-5 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-purple-800/60 bg-black/40 hover:bg-purple-900/40 text-purple-100 rounded-full px-8 py-7 text-lg backdrop-blur-sm" 
              onClick={() => navigate(createPageUrl("Studio"))}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Build a Custom Deck
            </Button>
          </div>

          {/* Feature Teasers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left max-w-5xl">
            <div className="p-8 bg-purple-950/10 border border-purple-800/30 rounded-3xl backdrop-blur-md hover:bg-purple-900/20 transition-colors">
              <Orbit className="w-10 h-10 text-cyan-400 mb-5 opacity-90" />
              <h3 className="text-xl font-semibold mb-3 text-white tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>The Spirit Wheel</h3>
              <p className="text-purple-200/60 text-sm leading-relaxed">
                Deterministic physics-based celestial wheel for dynamic readings and sacred geometry symbol alignment.
              </p>
            </div>
            
            <div className="p-8 bg-purple-950/10 border border-purple-800/30 rounded-3xl backdrop-blur-md hover:bg-purple-900/20 transition-colors">
              <BookOpen className="w-10 h-10 text-fuchsia-400 mb-5 opacity-90" />
              <h3 className="text-xl font-semibold mb-3 text-white tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>Deck Studio</h3>
              <p className="text-purple-200/60 text-sm leading-relaxed">
                Upload, train, and manage your own divinatory decks with AI-driven visual styling, metadata extraction, and OCR.
              </p>
            </div>
            
            <div className="p-8 bg-purple-950/10 border border-purple-800/30 rounded-3xl backdrop-blur-md hover:bg-purple-900/20 transition-colors">
              <Sparkles className="w-10 h-10 text-purple-400 mb-5 opacity-90" />
              <h3 className="text-xl font-semibold mb-3 text-white tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>Fusion Readings</h3>
              <p className="text-purple-200/60 text-sm leading-relaxed">
                Combine decks dynamically, extract emergent patterns, and log your journey in a private metaphysical journal.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}