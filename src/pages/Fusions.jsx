
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card as UICard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Combine, Wand2, Save, Loader2, Sparkles, BookOpen, Plus, RefreshCw } from "lucide-react";
import FusionResult from "@/components/fusion/FusionResult";

function useUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });
}

function uniqById(items) {
  const map = new Map();
  (items || []).forEach(i => map.set(i.id, i));
  return Array.from(map.values());
}

function sortByName(items) {
  return [...(items || [])].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

function safeParse(jsonStr) {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

const BUILT_IN_SPREADS = [
  {
    id: "five",
    name: "5 Card Insight",
    positions: [
      { name: "1. Core", meaning: "Core theme" },
      { name: "2. Support", meaning: "Helpful energy" },
      { name: "3. Challenge", meaning: "Obstacle" },
      { name: "4. Guidance", meaning: "Advice" },
      { name: "5. Outcome", meaning: "Likely direction" }
    ]
  },
  {
    id: "three",
    name: "3 Card Flow",
    positions: [
      { name: "1. Past", meaning: "What led here" },
      { name: "2. Present", meaning: "Now" },
      { name: "3. Next", meaning: "Where it's headed" }
    ]
  }
];

export default function Fusions() {
  const qc = useQueryClient();
  const { data: user } = useUser();

  // Deck selection
  const { data: decksAll = [], isLoading: decksLoading } = useQuery({
    queryKey: ["fusion-decks", user?.email],
    queryFn: async () => {
      const [mine, pub] = await Promise.all([
        user?.email ? base44.entities.Deck.filter({ created_by: user.email }) : [],
        base44.entities.Deck.filter({ is_public: true })
      ]);
      return sortByName(uniqById([...(mine || []), ...(pub || [])]));
    },
    enabled: true
  });

  const [deck1Id, setDeck1Id] = React.useState("");
  const [deck2Id, setDeck2Id] = React.useState("");

  const deck1 = React.useMemo(() => decksAll.find(d => d.id === deck1Id), [decksAll, deck1Id]);
  const deck2 = React.useMemo(() => decksAll.find(d => d.id === deck2Id), [decksAll, deck2Id]);

  const pairKey = React.useMemo(() => {
    if (!deck1Id || !deck2Id) return "";
    return [deck1Id, deck2Id].sort().join("|");
  }, [deck1Id, deck2Id]);

  const [question, setQuestion] = React.useState("");
  const [spreadId, setSpreadId] = React.useState(BUILT_IN_SPREADS[0].id);
  const currentSpread = React.useMemo(() => BUILT_IN_SPREADS.find(s => s.id === spreadId) || BUILT_IN_SPREADS[0], [spreadId]);

  // Recipes for this pair (only mine)
  const { data: myRecipes = [], isLoading: recipesLoading, refetch: refetchRecipes } = useQuery({
    queryKey: ["fusion-recipes", pairKey, user?.email],
    queryFn: async () => {
      if (!pairKey || !user?.email) return [];
      // Filter by creator and by pair key if present; fall back to deck match for older records
      const allMine = await base44.entities.FusionRecipe.filter({ created_by: user.email });
      return (allMine || []).filter(r => {
        if (r.pair_key) return r.pair_key === pairKey;
        // backward compatibility
        const a = [r.deck_id_1, r.deck_id_2].sort().join("|");
        return a === pairKey;
      }).sort((a, b) => (b.updated_date || "").localeCompare(a.updated_date || ""));
    },
    enabled: !!pairKey && !!user?.email
  });

  const [selectedRecipeId, setSelectedRecipeId] = React.useState("");
  const selectedRecipe = React.useMemo(() => myRecipes.find(r => r.id === selectedRecipeId), [myRecipes, selectedRecipeId]);

  // AI Analysis
  const [analysis, setAnalysis] = React.useState(null);
  const [generating, setGenerating] = React.useState(false);
  const canGenerate = !!deck1 && !!deck2 && deck1Id !== deck2Id;

  const generateAI = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setAnalysis(null);
    try {
      // small summaries to keep tokens low
      const [cards1, cards2] = await Promise.all([
        base44.entities.Card.filter({ deck_id: deck1Id }, "number", 40),
        base44.entities.Card.filter({ deck_id: deck2Id }, "number", 40)
      ]);
      const summarize = (cards) => (cards || []).slice(0, 30).map(c => ({
        name: c.name, number: c.number,
        keywords: Array.isArray(c.keywords) ? c.keywords.slice(0, 6) : (c.keywords ? String(c.keywords).split(/[,;]+/).slice(0, 6) : []),
        overall_meaning: c.overall_meaning ? String(c.overall_meaning).slice(0, 160) : undefined
      }));

      const payload = {
        deckA: { id: deck1.id, name: deck1.name, description: deck1.description || "", category: deck1.category, cards_preview: summarize(cards1) },
        deckB: { id: deck2.id, name: deck2.name, description: deck2.description || "", category: deck2.category, cards_preview: summarize(cards2) }
      };

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

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert tarot/oracle curator. Analyze two decks and produce a succinct, practical fusion guide.
Focus on: core themes, similarities, contrasts, and opposing forces. Offer clear reading tips and 2-3 spread ideas.
Keep lists concise (max 6 items). Output strictly JSON matching schema.

Input:
${JSON.stringify(payload, null, 2)}`,
        add_context_from_internet: false,
        response_json_schema: schema
      });

      const data = res || {};
      setAnalysis({
        ...data,
        fusion_title: data.fusion_title || `${deck1.name} × ${deck2.name} Fusion`
      });
    } finally {
      setGenerating(false);
    }
  };

  // Manual content editor mirrors analysis when user wants to edit
  const [manualContent, setManualContent] = React.useState("");

  React.useEffect(() => {
    // When a recipe is chosen, reflect it
    if (selectedRecipe) {
      setManualContent(selectedRecipe.recipe_content || "");
      setAnalysis(safeParse(selectedRecipe.recipe_content));
    } else {
      setManualContent("");
      setAnalysis(null);
    }
  }, [selectedRecipe]);

  const usesPublicOnly = !!deck1?.is_public && !!deck2?.is_public;
  // REMOVED: const [isPublic, setIsPublic] = React.useState(false);
  // REMOVED: React.useEffect(() => { if (!usesPublicOnly) setIsPublic(false); }, [usesPublicOnly]);

  // Save or create recipe
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (selectedRecipeId) {
        return base44.entities.FusionRecipe.update(selectedRecipeId, payload);
      }
      return base44.entities.FusionRecipe.create(payload);
    },
    onSuccess: async () => {
      await refetchRecipes();
      qc.invalidateQueries({ queryKey: ["fusion-recipes", pairKey, user?.email] });
    }
  });

  const handleSave = async () => {
    if (!deck1 || !deck2) return;
    const name = `${deck1.name} + ${deck2.name}`;
    const contentToStore = manualContent?.trim()
      ? manualContent
      : JSON.stringify(analysis || { summary: "", themes: [], similarities: [], contrasts: [], opposing_forces: [] });

    const payload = {
      deck_pairing_name: name,
      deck_id_1: deck1.id,
      deck_id_2: deck2.id,
      recipe_content: contentToStore,
      pair_key: pairKey,
      uses_public_decks_only: usesPublicOnly,
      is_public: false, // personal tool for now
      owner_email: user?.email || ""
    };
    await saveMutation.mutateAsync(payload);
  };

  // Simple on-page Fusion Reading (duo draw: one card from each deck per position)
  const [reading, setReading] = React.useState(null);
  const [readingLoading, setReadingLoading] = React.useState(false);

  const generateReading = async () => {
    if (!deck1Id || !deck2Id) return;
    setReadingLoading(true);
    try {
      const [cards1, cards2] = await Promise.all([
        base44.entities.Card.filter({ deck_id: deck1Id }),
        base44.entities.Card.filter({ deck_id: deck2Id })
      ]);
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const pairs = currentSpread.positions.map((pos) => {
        const c1 = pick(cards1 || []) || null;
        const c2 = pick(cards2 || []) || null;
        return { position: pos.name, fromA: c1, fromB: c2 };
      });
      setReading({ question, spread: currentSpread.name, pairs });
    } finally {
      setReadingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Combine className="w-7 h-7" />
              Fusions
            </h1>
            <p className="text-white/70">
              Pair any two decks. Let AI generate an interaction recipe or write your own. Do your reading right here.
            </p>
          </div>
        </div>

        {/* Step 1: Choose Decks */}
        <UICard className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Choose Decks
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-2">Deck A</div>
              <Select value={deck1Id} onValueChange={setDeck1Id}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder={decksLoading ? "Loading..." : "Select deck"} />
                </SelectTrigger>
                <SelectContent>
                  {decksAll.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.is_public ? "• Public" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-2">Deck B</div>
              <Select value={deck2Id} onValueChange={setDeck2Id}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder={decksLoading ? "Loading..." : "Select deck"} />
                </SelectTrigger>
                <SelectContent>
                  {decksAll.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.is_public ? "• Public" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {deck1 && deck2 && (
              <div className="md:col-span-2 text-xs text-white/70">
                Your fusion recipes are private to you. Deck privacy is respected. Sharing may be added in a future update.
              </div>
            )}
          </CardContent>
        </UICard>

        {/* Step 2: Recipes (AI or manual) */}
        <UICard className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Your Fusion Recipes for this Pair
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CHANGED: two columns (selector + actions); removed publish column */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-2">Select a saved recipe</div>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder={recipesLoading ? "Loading..." : (myRecipes.length ? "Choose a recipe" : "No recipes yet")} />
                  </SelectTrigger>
                  <SelectContent>
                    {myRecipes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.deck_pairing_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" className="border-white/20 text-white gap-2" onClick={() => setSelectedRecipeId("")}>
                  <Plus className="w-4 h-4" />
                  New
                </Button>
                <Button variant="outline" className="border-white/20 text-white gap-2" disabled={!canGenerate || generating} onClick={generateAI}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate with AI
                </Button>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* AI result preview */}
            {analysis && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">AI Analysis Preview</div>
                <FusionResult result={analysis} />
                <div className="flex gap-2">
                  <Button variant="outline" className="border-white/20 text-white gap-2" onClick={() => setManualContent(JSON.stringify(analysis, null, 2))}>
                    <RefreshCw className="w-4 h-4" />
                    Use this as editable JSON
                  </Button>
                </div>
              </div>
            )}

            {/* Manual editor (raw JSON or prose) */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">Recipe Content (JSON or prose)</div>
              <Textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder='Paste JSON from AI or write your own mix. If JSON, FusionResult will render it.'
                className="min-h-[160px] bg-black/30 border-white/10"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 gap-2" disabled={!deck1 || !deck2 || saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {selectedRecipeId ? "Save Changes" : "Save Recipe"}
                </Button>
              </div>
            </div>
          </CardContent>
        </UICard>

        {/* Step 3: Do the Reading here */}
        <UICard className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Fusion Reading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm mb-2">Your Question</div>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What guidance do you seek from this fusion?"
                  className="bg-black/40 border-white/10"
                />
              </div>
              <div>
                <div className="text-sm mb-2">Choose Spread</div>
                <Select value={spreadId} onValueChange={setSpreadId}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Spread" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILT_IN_SPREADS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generateReading} className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={!deck1 || !deck2 || readingLoading}>
              {readingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Generate Fusion Reading
            </Button>

            {reading && (
              <div className="mt-4">
                <div className="text-white/80 mb-3">
                  {deck1?.name} × {deck2?.name} — {reading.spread}
                  {question ? ` • Q: ${question}` : ""}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {reading.pairs.map((p, idx) => (
                    <div key={idx} className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="font-semibold mb-2">{p.position}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded overflow-hidden border border-white/10 bg-black/40">
                          {p.fromA?.image_url ? (
                            <img src={p.fromA.image_url} alt={p.fromA.name} className="w-full aspect-[2/3] object-cover" />
                          ) : (
                            <div className="w-full aspect-[2/3] flex items-center justify-center text-xs text-white/60">No image</div>
                          )}
                          <div className="px-2 py-1 text-xs border-t border-white/10">{p.fromA?.name || "—"} <span className="text-white/50">({deck1?.name})</span></div>
                        </div>
                        <div className="rounded overflow-hidden border border-white/10 bg-black/40">
                          {p.fromB?.image_url ? (
                            <img src={p.fromB.image_url} alt={p.fromB.name} className="w-full aspect-[2/3] object-cover" />
                          ) : (
                            <div className="w-full aspect-[2/3] flex items-center justify-center text-xs text-white/60">No image</div>
                          )}
                          <div className="px-2 py-1 text-xs border-t border-white/10">{p.fromB?.name || "—"} <span className="text-white/50">({deck2?.name})</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* If the selected/AI recipe is valid JSON, show its structured insights under the reading */}
                {analysis && (
                  <div className="mt-6">
                    <FusionResult result={analysis} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </UICard>
      </div>
    </div>
  );
}
