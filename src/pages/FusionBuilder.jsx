
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, Scale, Shuffle, Save, Loader2, Play } from "lucide-react";
import FusionResult from "@/components/fusion/FusionResult";
import { createPageUrl } from "@/utils";

export default function FusionBuilder() {
  const [deck1Id, setDeck1Id] = React.useState("");
  const [deck2Id, setDeck2Id] = React.useState("");
  const [customTitle, setCustomTitle] = React.useState("");
  const [analysis, setAnalysis] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const { data: decks = [], isLoading: decksLoading } = useQuery({
    queryKey: ["decks-for-fusion"],
    queryFn: async () => {
      const list = await base44.entities.Deck.list("name");
      return Array.isArray(list) ? list : [];
    },
  });

  const selectedDeck1 = decks.find(d => d.id === deck1Id);
  const selectedDeck2 = decks.find(d => d.id === deck2Id);

  const canAnalyze = deck1Id && deck2Id && deck1Id !== deck2Id;

  const fetchDeckSummary = async (deckId) => {
    const deck = decks.find(d => d.id === deckId);
    const cards = await base44.entities.Card.filter({ deck_id: deckId }, "number", 40);
    // Build a compact summary
    const compactCards = (cards || []).slice(0, 30).map(c => ({
      name: c.name,
      number: c.number,
      keywords: Array.isArray(c.keywords) ? c.keywords.slice(0, 6) : (c.keywords ? String(c.keywords).split(/[,;]+/).slice(0, 6) : []),
      overall_meaning: c.overall_meaning ? String(c.overall_meaning).slice(0, 180) : undefined
    }));
    return {
      id: deck.id,
      name: deck.name,
      description: deck.description || "",
      category: deck.category,
      is_public: !!deck.is_public,
      cards_preview: compactCards
    };
  };

  const generate = async () => {
    if (!canAnalyze) return;
    setError("");
    setIsGenerating(true);
    setAnalysis(null);
    try {
      const d1 = await fetchDeckSummary(deck1Id);
      const d2 = await fetchDeckSummary(deck2Id);

      const schema = {
        type: "object",
        properties: {
          fusion_title: { type: "string" },
          summary: { type: "string" },
          themes: { type: "array", items: { type: "string" } },
          similarities: { type: "array", items: { type: "string" } },
          contrasts: { type: "array", items: { type: "string" } },
          opposing_forces: { type: "array", items: { type: "string" } },
          reading_tips: { type: "array", items: { type: "string" } },
          spread_suggestions: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                name: { type: "string" },
                positions: { type: "array", items: { type: "string" } }
              }
            } 
          }
        }
      };

      const prompt = `
You are an expert tarot/oracle curator. Analyze two decks and produce a succinct, practical fusion guide.
Focus on: core themes, similarities, contrasts, and opposing forces. Offer clear reading tips and 2-3 spread ideas.

Deck A:
${JSON.stringify(d1, null, 2)}

Deck B:
${JSON.stringify(d2, null, 2)}

Output JSON only, matching the provided schema. Keep lists concise (max 6 items each).
If you propose spreads, use 3-7 positions with short, clear labels.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: schema
      });

      // res is already parsed JSON per integration
      const data = res || {};
      setAnalysis({
        ...data,
        fusion_title: data.fusion_title || `${d1.name} × ${d2.name} Fusion`,
      });
      if (!customTitle) {
        setCustomTitle(data.fusion_title || `${d1.name} × ${d2.name} Fusion`);
      }
    } catch (e) {
      setError(e?.message || "Failed to generate fusion analysis.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRecipe = async () => {
    if (!analysis || !canAnalyze) return;
    setSaving(true);
    try {
      const d1 = decks.find(d => d.id === deck1Id);
      const d2 = decks.find(d => d.id === deck2Id);
      const deck_pairing_name = customTitle || `${d1?.name} × ${d2?.name} Fusion`;

      await base44.entities.FusionRecipe.create({
        deck_pairing_name,
        deck_id_1: deck1Id,
        deck_id_2: deck2Id,
        recipe_content: JSON.stringify(analysis, null, 2)
      });
      alert("Fusion recipe saved!");
    } catch (e) {
      alert("Failed to save recipe: " + (e?.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Fusion Builder</h1>
        </div>

        <UICard className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Select Two Decks</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/80">Deck A</label>
              <Select value={deck1Id} onValueChange={setDeck1Id} disabled={decksLoading}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={decksLoading ? "Loading..." : "Choose deck"} />
                </SelectTrigger>
                <SelectContent>
                  {decks.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-white/80">Deck B</label>
              <Select value={deck2Id} onValueChange={setDeck2Id} disabled={decksLoading}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={decksLoading ? "Loading..." : "Choose deck"} />
                </SelectTrigger>
                <SelectContent>
                  {decks.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Separator className="my-2 bg-white/10" />
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm text-white/80">Fusion Title (optional)</label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g., Shadow × Harmony: A Bridge Between Worlds"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <Button
                  onClick={generate}
                  disabled={!canAnalyze || isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 min-w-[180px] gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                  {isGenerating ? "Analyzing..." : "Generate Fusion"}
                </Button>
              </div>
              {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
              {!canAnalyze && (
                <p className="text-white/60 text-sm mt-2">Pick two different decks to continue.</p>
              )}
            </div>
          </CardContent>
        </UICard>

        {analysis && (
          <UICard className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">{customTitle || analysis.fusion_title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FusionResult result={analysis} />

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={saveRecipe}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Recipe"}
                </Button>

                <a
                  href={createPageUrl(
                    `FusionReading?deck1=${encodeURIComponent(deck1Id)}&deck2=${encodeURIComponent(deck2Id)}${
                      analysis?.summary ? `&summary=${encodeURIComponent(analysis.summary)}` : ""
                    }`
                  )}
                  className="inline-flex"
                >
                  <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    <Play className="w-4 h-4" />
                    Start Fusion Reading
                  </Button>
                </a>
              </div>

              <div className="text-xs text-white/60 mt-2">
                Tip: Saved recipes appear under My Fusions.
              </div>
            </CardContent>
          </UICard>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Lightbulb className="w-4 h-4 text-yellow-300 mb-2" />
            <div className="font-semibold">Themes</div>
            <p className="text-sm text-white/70">Look for repeating motifs: growth, shadow, cycles, healing.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Scale className="w-4 h-4 text-blue-300 mb-2" />
            <div className="font-semibold">Opposing Forces</div>
            <p className="text-sm text-white/70">Let contrast create guidance: chaos vs. order, intuition vs. logic.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Shuffle className="w-4 h-4 text-purple-300 mb-2" />
            <div className="font-semibold">Blend</div>
            <p className="text-sm text-white/70">Combine aesthetics and meanings to form a unique voice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
