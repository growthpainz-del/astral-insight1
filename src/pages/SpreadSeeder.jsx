import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle2, Loader2, AlertTriangle, Sparkles } from "lucide-react";

// Built-in spread definitions with visual coordinates
const BUILT_IN_CARD_SPREADS = [
  {
    name: "Single Card",
    description: "Draw one card for quick guidance",
    category: "General",
    is_public: true,
    is_system_spread: true,
    requires_positions: false,
    positions: [
      { name: "Present Moment", meaning: "What you need to know right now", x: 50, y: 50 }
    ]
  },
  {
    name: "Message of the Day",
    description: "Your daily guidance card",
    category: "General",
    is_public: true,
    is_system_spread: true,
    requires_positions: false,
    positions: [
      { name: "Message of the Day", meaning: "Your guidance for today", x: 50, y: 50 }
    ]
  },
  {
    name: "Past, Present, Future",
    description: "Classic three-card timeline reading",
    category: "General",
    is_public: true,
    is_system_spread: true,
    positions: [
      { name: "Past", meaning: "Past influences affecting you", x: 25, y: 50 },
      { name: "Present", meaning: "Current situation and energies", x: 50, y: 50 },
      { name: "Future", meaning: "Potential outcomes and future path", x: 75, y: 50 }
    ]
  },
  {
    name: "Business Diamond",
    description: "Comprehensive business and financial guidance",
    category: "Career",
    is_public: true,
    is_system_spread: true,
    positions: [
      { name: "Current Financial Foundation", meaning: "Your current financial state", x: 50, y: 20 },
      { name: "Past Business Influences", meaning: "What got you here", x: 20, y: 40 },
      { name: "Recent Financial Gains", meaning: "Recent positive developments", x: 80, y: 40 },
      { name: "Challenges to Overcome", meaning: "Current obstacles", x: 35, y: 60 },
      { name: "Opportunities Ahead", meaning: "Upcoming chances for growth", x: 65, y: 60 },
      { name: "Strategies to Employ", meaning: "Actions to take", x: 50, y: 80 },
      { name: "Future Wealth Outlook", meaning: "Long-term financial potential", x: 50, y: 95 }
    ]
  },
  {
    name: "Path Forward",
    description: "Seven-card journey from past to future",
    category: "General",
    is_public: true,
    is_system_spread: true,
    positions: [
      { name: "Past Influences", meaning: "What brought you here", x: 15, y: 50 },
      { name: "Current Position", meaning: "Where you are now", x: 28, y: 50 },
      { name: "Immediate Challenges", meaning: "What you're facing", x: 41, y: 50 },
      { name: "Actions", meaning: "What you need to do", x: 54, y: 50 },
      { name: "Support", meaning: "Help available to you", x: 67, y: 50 },
      { name: "Near Future", meaning: "What's coming soon", x: 80, y: 50 },
      { name: "Long-term Outcome", meaning: "Final result", x: 93, y: 50 }
    ]
  }
];

const BUILT_IN_RUNE_SPREADS = [
  {
    name: "Single Rune",
    description: "Draw one rune for a quick, focused answer",
    category: "Runes",
    is_public: true,
    is_system_spread: true,
    requires_positions: false,
    positions: [
      { name: "Your Rune", meaning: "The core energy or answer", x: 50, y: 50 }
    ]
  },
  {
    name: "Three Rune Norn Spread",
    description: "A reading concerning a situation's past, present, and future",
    category: "Runes",
    is_public: true,
    is_system_spread: true,
    positions: [
      { name: "Past (Urd)", meaning: "What was: The past of the situation", x: 25, y: 50 },
      { name: "Present (Verdandi)", meaning: "What is: The present state and challenge", x: 50, y: 50 },
      { name: "Future (Skuld)", meaning: "What shall be: The likely outcome", x: 75, y: 50 }
    ]
  },
  {
    name: "Five Rune Cross",
    description: "A detailed spread for in-depth analysis of a situation",
    category: "Runes",
    is_public: true,
    is_system_spread: true,
    positions: [
      { name: "Past", meaning: "Influences from the past", x: 50, y: 20 },
      { name: "Present", meaning: "The current situation", x: 50, y: 50 },
      { name: "Future", meaning: "The likely outcome", x: 50, y: 80 },
      { name: "The Challenge", meaning: "Obstacles to overcome", x: 20, y: 50 },
      { name: "The Resolution", meaning: "How to resolve the challenge", x: 80, y: 50 }
    ]
  }
];

export default function SpreadSeeder() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [pendingSeed, setPendingSeed] = useState(false);

  const seedSpreads = async (skipConfirm = false) => {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      // Check if system spreads already exist
      const existingSpreads = await base44.entities.Spread.filter({ is_system_spread: true });
      
      if (existingSpreads && existingSpreads.length > 0 && !skipConfirm) {
        setExistingCount(existingSpreads.length);
        setOverwriteDialogOpen(true);
        setPendingSeed(true);
        setLoading(false);
        return;
      }
      
      if (existingSpreads && existingSpreads.length > 0) {

        // Delete existing system spreads
        for (const spread of existingSpreads) {
          try {
            await base44.entities.Spread.delete(spread.id);
            setResults(prev => [...prev, { name: spread.name, status: "deleted", message: "Deleted old version" }]);
          } catch (err) {
          }
        }
      }

      // Seed card spreads
      for (const spread of BUILT_IN_CARD_SPREADS) {
        try {
          await base44.entities.Spread.create(spread);
          setResults(prev => [...prev, { name: spread.name, status: "success", message: "Created successfully" }]);
        } catch (err) {
          setResults(prev => [...prev, { name: spread.name, status: "error", message: err.message || "Failed to create" }]);
        }
      }

      // Seed rune spreads
      for (const spread of BUILT_IN_RUNE_SPREADS) {
        try {
          await base44.entities.Spread.create(spread);
          setResults(prev => [...prev, { name: spread.name, status: "success", message: "Created successfully" }]);
        } catch (err) {
          setResults(prev => [...prev, { name: spread.name, status: "error", message: err.message || "Failed to create" }]);
        }
      }

      setError("");
    } catch (err) {
      setError("Failed to seed spreads: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const checkExisting = async () => {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const existingSpreads = await base44.entities.Spread.filter({ is_system_spread: true });
      
      if (!existingSpreads || existingSpreads.length === 0) {
        setError("No system spreads found in database. Click 'Seed Built-In Spreads' to create them.");
      } else {
        setResults(existingSpreads.map(spread => ({
          name: spread.name,
          status: "exists",
          message: `${spread.positions?.length || 0} positions, ${spread.category || 'General'}`
        })));
      }
    } catch (err) {
      setError("Failed to check spreads: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Spread System Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-200 mb-2">What This Does:</h3>
              <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                <li>Creates database records for all built-in spreads (Past/Present/Future, etc.)</li>
                <li>Makes them editable in Spread Designer</li>
                <li>Allows visual position customization</li>
                <li>Marks them as system spreads so they're always available</li>
              </ul>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-200 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Important Notes:
              </h3>
              <ul className="text-sm text-amber-300 space-y-1 list-disc list-inside">
                <li>This is a ONE-TIME operation (run it once)</li>
                <li>Safe to run multiple times - it will recreate from scratch</li>
                <li>Your custom spreads will NOT be affected</li>
                <li>After seeding, you can edit these spreads in Spread Designer</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={checkExisting}
                disabled={loading}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Current Spreads"
                )}
              </Button>

              <Button
                onClick={seedSpreads}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Seed Built-In Spreads
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Results:</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        result.status === "success"
                          ? "bg-green-900/20 border border-green-500/30"
                          : result.status === "error"
                          ? "bg-red-900/20 border border-red-500/30"
                          : result.status === "deleted"
                          ? "bg-amber-900/20 border border-amber-500/30"
                          : "bg-blue-900/20 border border-blue-500/30"
                      }`}
                    >
                      {result.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
                      {result.status === "error" && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                      {result.status === "deleted" && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
                      {result.status === "exists" && <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-semibold text-white">{result.name}</p>
                        <p className="text-sm text-white/70">{result.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-purple-200 mb-2">What Spreads Will Be Created:</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">Card Spreads:</h4>
                  <ul className="text-sm text-purple-200 space-y-1">
                    {BUILT_IN_CARD_SPREADS.map(s => (
                      <li key={s.name}>• {s.name} ({s.positions.length} {s.positions.length === 1 ? 'card' : 'cards'})</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">Rune Spreads:</h4>
                  <ul className="text-sm text-purple-200 space-y-1">
                    {BUILT_IN_RUNE_SPREADS.map(s => (
                      <li key={s.name}>• {s.name} ({s.positions.length} {s.positions.length === 1 ? 'rune' : 'runes'})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overwrite confirmation */}
      <AlertDialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Spreads?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Found <span className="font-semibold text-white">{existingCount} existing system spreads</span>.
              Delete them and recreate fresh copies? Your custom spreads will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => { setOverwriteDialogOpen(false); setPendingSeed(false); }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setOverwriteDialogOpen(false);
                setPendingSeed(false);
                seedSpreads(true);
              }}
            >
              Delete & Recreate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}