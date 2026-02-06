import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { BookOpen, Palette, Sparkles, Plus, History, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-slate-900 to-blue-950 text-white flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/47c4e8b48_IMG_6739.png" alt="Astral Insight logo" className="mx-auto h-16 w-16 mb-4 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
          <h1 className="relative inline-block text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-amber-300 mb-3">
            <span>Astral </span>
            <span>
              Ins
              <span className="relative inline-block">
                i
                <span className="twinkle-dot absolute -top-3 left-1/2 w-2 h-2 rounded-full bg-amber-300"></span>
              </span>
              ght
            </span>
          </h1>
          <p className="text-lg md:text-xl text-purple-200">
            Your mystical journey awaits
          </p>
          <style>{`
            @keyframes twinkleDot {
              0%, 100% { transform: translateX(-50%) scale(0.75); opacity: 0.6; filter: drop-shadow(0 0 2px rgba(255, 210, 120, 0.6)); }
              50% { transform: translateX(-50%) scale(1.25); opacity: 1; filter: drop-shadow(0 0 6px rgba(255, 210, 120, 1)) drop-shadow(0 0 12px rgba(255, 210, 120, 0.8)); }
            }
            .twinkle-dot { animation: twinkleDot 1.8s ease-in-out infinite; }
          `}</style>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link to={createPageUrl('Dashboard')}>
              <div className="group relative h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-3xl border-2 border-blue-400/30 hover:border-blue-400/60 p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-8 h-8 text-blue-300" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-3">
                    🔮 Reading Room
                  </h2>
                  
                  <p className="text-blue-200 mb-6 text-lg">
                    Browse decks, draw cards, and receive cosmic guidance
                  </p>

                  <div className="space-y-2 text-sm text-blue-200/80">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Explore oracle decks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>Get AI-powered readings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      <span>View reading history</span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg group-hover:shadow-lg">
                      Enter Reading Room
                      <BookOpen className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Link to={createPageUrl('Studio')}>
              <div className="group relative h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl border-2 border-purple-400/30 hover:border-purple-400/60 p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Palette className="w-8 h-8 text-purple-300" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-3">
                    🎨 Creator Studio
                  </h2>
                  
                  <p className="text-purple-200 mb-6 text-lg">
                    Build your own oracle decks and design custom spreads
                  </p>

                  <div className="space-y-2 text-sm text-purple-200/80">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Create custom decks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>Design card spreads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>AI-assisted creation</span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg group-hover:shadow-lg">
                      Open Studio
                      <Palette className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to={createPageUrl('Help')} className="text-purple-300 hover:text-white transition-colors">
              Need help?
            </Link>
            <span className="text-purple-600">•</span>
            <Link to={createPageUrl('Explore')} className="text-purple-300 hover:text-white transition-colors">
              Explore creators
            </Link>
            <span className="text-purple-600">•</span>
            <Link to={createPageUrl('SubscriptionManagement')} className="text-purple-300 hover:text-white transition-colors">
              Upgrade
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}