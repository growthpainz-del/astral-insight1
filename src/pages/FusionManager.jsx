import React, { useEffect, useState, useMemo } from "react";
import { Deck } from "@/entities/Deck";
import { FusionRecipe } from "@/entities/FusionRecipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, RefreshCcw, Wand2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FusionManager() {
  const [decks, setDecks] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deck1, setDeck1] = useState("");
  const [deck2, setDeck2] = useState("");
  const [pairName, setPairName] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const [allDecks, allRecipes] = await Promise.all([
      Deck.list("-created_date"),
      FusionRecipe.list("-created_date"),
    ]);
    setDecks(allDecks || []);
    setRecipes(allRecipes || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const deckOptions = useMemo(
    () => decks.map((d) => ({ id: d.id, name: d.name })),
    [decks]
  );

  const selectedNames = useMemo(() => {
    const d1 = decks.find((d) => d.id === deck1)?.name || "";
    const d2 = decks.find((d) => d.id === deck2)?.name || "";
    return { d1, d2 };
  }, [deck1, deck2, decks]);

  const doCreate = async (payload) => {
    setSaving(true);
    setMessage(null);
    await FusionRecipe.create(payload);
    setSaving(false);
    setPairName("");
    setContent("");
    await loadAll();
    setMessage({ type: "success", text: "Fusion created successfully." });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = async () => {
    if (!deck1 || !deck2) {
      setMessage({ type: "error", text: "Please choose two decks." });
      return;
    }
    const finalName =
      pairName ||
      `${selectedNames.d1 || "Deck A"} + ${selectedNames.d2 || "Deck B"}`;
    const payload = {
      deck_pairing_name: finalName,
      deck_id_1: deck1,
      deck_id_2: deck2,
      recipe_content:
        content ||
        `Fusion Guidance:\n- Pull 1–2 cards from ${selectedNames.d1}\n- Pull 1–2 cards from ${selectedNames.d2}\n- Weave a combined narrative.\n- Contrast themes, then reconcile into an actionable insight.`,
    };
    await doCreate(payload);
  };

  const handleQuickCreateILoveYouButBlackSwan = async () => {
    const d1 =
      decks.find((d) => /i\s*love\s*you\s*but/i.test(d.name)) ||
      decks.find((d) => /love/i.test(d.name) && /but/i.test(d.name));
    const d2 = decks.find((d) => /black\s*swan/i.test(d.name));
    if (!d1 || !d2) {
      setMessage({
        type: "error",
        text:
          "Could not find both decks by name. Please select them manually below and save.",
      });
      if (d1?.id) setDeck1(d1.id);
      if (d2?.id) setDeck2(d2.id);
      if (d1?.name || d2?.name) {
        setPairName(
          `${d1?.name || "I Love You, But"} + ${d2?.name || "Black Swan"}`
        );
      }
      setContent(defaultILoveYouButBlackSwanRecipe());
      return;
    }
    await doCreate({
      deck_pairing_name: `${d1.name} + ${d2.name}`,
      deck_id_1: d1.id,
      deck_id_2: d2.id,
      recipe_content: defaultILoveYouButBlackSwanRecipe(),
    });
  };

  const defaultILoveYouButBlackSwanRecipe = () =>
    `I Love You, But + Black Swan — Fusion Recipe
Intent:
- Explore heartfelt truths and the unforeseen “swan events” that reshape love, identity, or destiny.

Method:
1) Pull 2 cards from “I Love You, But”:
   - Card A (Tender Truth): The loving intention or core value at stake.
   - Card B (But…): The honest friction, boundary, or hard line.

2) Pull 2 cards from “Black Swan”:
   - Card C (The Unseen): A hidden factor or improbable shift changing the landscape.
   - Card D (Trajectory): Where the shock or rarity is steering the story next.

Weave:
- Read A vs. B as “Love & Line.” What truth needs honoring?
- Read C -> D as “Swan Arc.” How does the rare event transform the stakes?
- Synthesize a single, compassionate action that safeguards Love while adapting to the Swan.

Affirmation:
“I honor love with honesty, and I adapt with courage when life becomes extraordinary.”`;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fusion Manager</h1>
          <div className="flex gap-2">
            <Link to={createPageUrl("FusionReading")}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Open Fusion Reading
              </Button>
            </Link>
            <Button onClick={loadAll} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg p-3 border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-red-500/10 border-red-500/30 text-red-200"
            }`}
          >
            {message.type === "success" ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {message.text}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> {message.text}
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quick Add</h2>
            <Button
              onClick={handleQuickCreateILoveYouButBlackSwan}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Create “I Love You, But + Black Swan”
            </Button>
          </div>
          <p className="text-white/70 text-sm">
            We’ll try to find the two decks by name and add the fusion recipe. If we can’t find them, the fields below will prefill so you can save manually.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          <h2 className="text-xl font-semibold">Create Custom Fusion</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Deck A</label>
              <Select value={deck1} onValueChange={setDeck1}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select first deck" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-white/10 max-h-80">
                  {deckOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Deck B</label>
              <Select value={deck2} onValueChange={setDeck2}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select second deck" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-white/10 max-h-80">
                  {deckOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Pairing Name</label>
            <Input
              placeholder={`${selectedNames.d1 || "Deck A"} + ${selectedNames.d2 || "Deck B"}`}
              value={pairName}
              onChange={(e) => setPairName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Fusion Recipe / Guidance</label>
            <Textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How should these decks be combined in a reading? (steps, positions, synthesis tips, tone, etc.)"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Fusion
            </Button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-4">Existing Fusions</h2>
          {loading ? (
            <div className="text-white/70">Loading...</div>
          ) : recipes.length === 0 ? (
            <div className="text-white/60">No fusions yet.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {recipes.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="font-medium">{r.deck_pairing_name}</div>
                  <div className="text-sm text-white/60 mt-1 line-clamp-2">{r.recipe_content}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}