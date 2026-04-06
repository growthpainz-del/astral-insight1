import React, { useState, useEffect } from 'react';
import { Moon, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const MOON_PHASES = [
  { name: 'New Moon', icon: '🌑', spread: 'Manifestation & New Beginnings', spreadId: 'single', desc: 'Plant seeds of intention.' },
  { name: 'Waxing Crescent', icon: '🌒', spread: 'Growth & Action', spreadId: 'three_card', desc: 'Focus on your goals and take small steps.' },
  { name: 'First Quarter', icon: '🌓', spread: 'Overcoming Obstacles', spreadId: 'path_forward', desc: 'Make decisions and push through challenges.' },
  { name: 'Waxing Gibbous', icon: '🌔', spread: 'Refinement & Adjustment', spreadId: 'three_card', desc: 'Edit your plans and trust the process.' },
  { name: 'Full Moon', icon: '🌕', spread: 'Release & Realization', spreadId: 'celtic_cross', desc: 'Let go of what no longer serves you.' },
  { name: 'Waning Gibbous', icon: '🌖', spread: 'Gratitude & Receiving', spreadId: 'diamond', desc: 'Express thanks and share your wisdom.' },
  { name: 'Last Quarter', icon: '🌗', spread: 'Forgiveness & Cleansing', spreadId: 'path_forward', desc: 'Release resentments and clear your space.' },
  { name: 'Waning Crescent', icon: '🌘', spread: 'Rest & Reflection', spreadId: 'single', desc: 'Recharge your energy for the new cycle.' },
];

const getMoonPhase = (date = new Date()) => {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  if (month < 3) {
    year--;
    month += 12;
  }
  ++month;
  const jd = 365.25 * year + 30.6 * month + day - 694039.09;
  const cycle = jd / 29.5305882;
  const fractional = cycle - Math.floor(cycle);
  let phase = Math.round(fractional * 8);
  if (phase >= 8) phase = 0;
  return MOON_PHASES[phase];
};

export default function MoonPhaseWidget() {
  const [phase, setPhase] = useState(MOON_PHASES[0]);

  useEffect(() => {
    setPhase(getMoonPhase(new Date()));
  }, []);

  return (
    <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/60 hover:shadow-indigo-500/20">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none select-none">
        <span className="text-[120px]">{phase.icon}</span>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white/80 text-sm uppercase tracking-wider">Current Lunar Cycle</h3>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="text-5xl">{phase.icon}</div>
            <div>
              <h4 className="text-2xl font-bold text-indigo-300">{phase.name}</h4>
              <p className="text-white/70 text-sm mt-1">{phase.desc}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full bg-black/40 rounded-xl p-5 border border-white/10 md:max-w-sm">
          <div className="text-xs text-white/50 uppercase tracking-wider mb-2 font-semibold">Suggested Focus</div>
          <div className="text-amber-200 font-medium flex items-center gap-2 text-lg mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {phase.spread} Spread
          </div>
          <Link to={createPageUrl(`ReadingRoom?spread=${phase.spreadId}`)} className="block w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Try Lunar Reading <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}