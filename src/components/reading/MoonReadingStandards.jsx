
import React from "react";
import { Card as UICard, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Calendar } from "lucide-react";

const PHASES = [
  { key: "new_moon", label: "New Moon" },
  { key: "waxing_crescent", label: "Waxing Crescent" },
  { key: "first_quarter", label: "First Quarter" },
  { key: "waxing_gibbous", label: "Waxing Gibbous" },
  { key: "full_moon", label: "Full Moon" },
  { key: "waning_gibbous", label: "Waning Gibbous" },
  { key: "last_quarter", label: "Last Quarter" },
  { key: "waning_crescent", label: "Waning Crescent" },
];

const DEFAULT_STANDARDS = {
  new_moon: {
    tone: "Seed intentions, quiet introspection, gentle beginnings.",
    focus: ["Intent-setting", "Inner alignment", "Vision sketching"],
    reversals_weight: "Low to medium (signals seeds and blocks).",
    timing: "0-3 days (initiate, plan).",
    spread_tweaks: "Use 1–3 card spreads; keep it minimal.",
  },
  waxing_crescent: {
    tone: "Nurture the spark; protect new starts.",
    focus: ["Momentum", "Resources", "Courage to act"],
    reversals_weight: "Medium (adjust course early).",
    timing: "3–7 days (small actions).",
    spread_tweaks: "Add a ‘support’ position.",
  },
  first_quarter: {
    tone: "Decision, friction, commitment.",
    focus: ["Overcoming blocks", "Choosing paths"],
    reversals_weight: "High (name resistance).",
    timing: "7–10 days (decide and move).",
    spread_tweaks: "Challenge vs. action positions.",
  },
  waxing_gibbous: {
    tone: "Refinement and optimization.",
    focus: ["Improve plan", "Tune effort"],
    reversals_weight: "Medium (refine details).",
    timing: "10–14 days (polish).",
    spread_tweaks: "What to improve / what to keep.",
  },
  full_moon: {
    tone: "Revelation, culmination, release.",
    focus: ["What’s revealed", "What to release"],
    reversals_weight: "Medium to high (shadow clarity).",
    timing: "14–16 days (celebrate and let go).",
    spread_tweaks: "Add a ‘release’ position.",
  },
  waning_gibbous: {
    tone: "Harvest lessons, gratitude, sharing.",
    focus: ["Learnings", "Mentoring", "Refactoring"],
    reversals_weight: "Medium (integrate).",
    timing: "16–20 days (teach and tidy).",
    spread_tweaks: "What to teach / what to retire.",
  },
  last_quarter: {
    tone: "Reassessment, boundaries, simplification.",
    focus: ["Cut losses", "Close loops"],
    reversals_weight: "High (non-negotiables).",
    timing: "20–24 days (decide what ends).",
    spread_tweaks: "Keep/Remove/Transform.",
  },
  waning_crescent: {
    tone: "Rest, spiritual cleansing, surrender.",
    focus: ["Recovery", "Compassion", "Preparation"],
    reversals_weight: "Low (gentle endings).",
    timing: "24–29.5 days (restore).",
    spread_tweaks: "What to surrender / how to rest.",
  },
};

// Simple moon phase calculator (approximate 8-phase index)
function getPhaseKey(date = new Date()) {
  const synodic = 29.53058867; // days
  const knownNew = Date.parse("2000-01-06T18:14:00Z"); // known new moon
  const days = (date.getTime() - knownNew) / 86400000;
  const cycle = ((days % synodic) + synodic) % synodic;
  const idx = Math.floor(((cycle / synodic) * 8) + 0.5) % 8;
  return PHASES[idx].key;
}

function parseCustom(custom) {
  if (!custom) return null;
  try {
    const obj = typeof custom === "string" ? JSON.parse(custom) : custom;
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function mergedStandards(deck) {
  // Supports overrides in deck.custom.moon_affecters.{phaseKey}.{field}
  const parsed = parseCustom(deck?.custom);
  const overrides = parsed?.moon_affecters || {};
  const out = {};
  for (const p of PHASES) {
    out[p.key] = { ...DEFAULT_STANDARDS[p.key], ...(overrides[p.key] || {}) };
  }
  return out;
}

export function buildMoonStandardContext(deck, phaseKey) {
  const all = mergedStandards(deck);
  const s = all[phaseKey] || DEFAULT_STANDARDS[phaseKey] || {};
  const label = PHASES.find(p => p.key === phaseKey)?.label || phaseKey;
  return [
    `Moon Phase: ${label}`,
    `Tone: ${s.tone || ""}`,
    `Focus: ${(s.focus || []).join(", ")}`,
    `Reversals: ${s.reversals_weight || ""}`,
    `Timing: ${s.timing || ""}`,
    `Spread Tweaks: ${s.spread_tweaks || ""}`,
  ].filter(Boolean).join("\n");
}

function MoonReadingStandards({ deck, compact = false }) {
  const currentKey = getPhaseKey(new Date());
  const [phase, setPhase] = React.useState(currentKey);
  const standards = mergedStandards(deck);
  const active = standards[phase] || DEFAULT_STANDARDS[phase];

  return (
    <UICard className="bg-white/5 border-white/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Moon className="w-5 h-5 text-blue-300" />
            Moon Reading Standards
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-white/20 text-white/80">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Today
            </Badge>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger className="w-44 bg-black/30 border-white/10 text-white">
                <SelectValue placeholder="Moon phase" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                {PHASES.map(p => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className={`grid ${compact ? "grid-cols-1" : "md:grid-cols-2"} gap-4`}>
          <div>
            <div className="text-white/90 font-semibold mb-1">Tone</div>
            <div className="text-white/80">{active.tone}</div>
          </div>
          <div>
            <div className="text-white/90 font-semibold mb-1">Focus</div>
            <div className="text-white/80">{Array.isArray(active.focus) ? active.focus.join(", ") : active.focus}</div>
          </div>
          <div>
            <div className="text-white/90 font-semibold mb-1">Reversals Weight</div>
            <div className="text-white/80">{active.reversals_weight}</div>
          </div>
          <div>
            <div className="text-white/90 font-semibold mb-1">Timing</div>
            <div className="text-white/80">{active.timing}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-white/90 font-semibold mb-1">Spread Tweaks</div>
            <div className="text-white/80">{active.spread_tweaks}</div>
          </div>
        </div>

        {/* Optional: show how deck.custom overrides are applied */}
        {parseCustom(deck?.custom)?.moon_affecters && (
          <div className="mt-3 text-xs text-white/60">
            Using deck-specific moon_affecters from custom overrides.
          </div>
        )}
      </CardContent>
    </UICard>
  );
}

export default MoonReadingStandards;
