import React from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SpreadDesignCanvas from "@/components/spread/SpreadDesignCanvas";

export default function FusionRecipeEditor() {
  const url = new URLSearchParams(window.location.search);
  const recipeId = url.get("id");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [recipe, setRecipe] = React.useState(null);
  const [decks, setDecks] = React.useState([]);
  const [spreadMeta, setSpreadMeta] = React.useState({ name: "", description: "", category: "Fusion" });
  const [positions, setPositions] = React.useState([
    { name: "Position 1", meaning: "", x: 30, y: 50 },
    { name: "Position 2", meaning: "", x: 70, y: 50 }
  ]);

  React.useEffect(() => {
    (async () => {
      const ds = await base44.entities.Deck.list("name");
      setDecks(ds || []);
      if (recipeId) {
        const r = await base44.entities.FusionRecipe.get(recipeId);
        setRecipe(r);
        if (r?.custom_spread?.positions?.length) {
          setPositions(r.custom_spread.positions);
          setSpreadMeta({
            name: r.custom_spread.name || "Fusion Spread",
            description: r.custom_spread.description || "",
            category: r.custom_spread.category || "Fusion"
          });
        } else {
          setSpreadMeta({ name: `Fusion: ${r?.deck_pairing_name || "Spread"}`, description: "", category: "Fusion" });
        }
      }
      setLoading(false);
    })();
  }, [recipeId]);

  const saveAttachedSpread = async () => {
    if (!recipe) return;
    setSaving(true);

    // Create or update a Spread entity, then link it to the recipe
    const payload = {
      name: spreadMeta.name || `Fusion: ${recipe.deck_pairing_name}`,
      description: spreadMeta.description || "",
      category: spreadMeta.category || "Fusion",
      positions,
      is_public: false,
      deck_id: null
    };

    let spread;
    if (recipe.spread_id) {
      spread = await base44.entities.Spread.update(recipe.spread_id, payload);
    } else {
      spread = await base44.entities.Spread.create(payload);
    }

    await base44.entities.FusionRecipe.update(recipe.id, {
      spread_id: spread.id,
      custom_spread: {
        ...payload
      }
    });

    setSaving(false);
    alert("Fusion recipe spread saved and linked!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">
        Loading...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">
        Recipe not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Fusion Recipe: {recipe.deck_pairing_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm">Spread name</label>
                <Input value={spreadMeta.name} onChange={(e) => setSpreadMeta({ ...spreadMeta, name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <label className="text-sm">Category</label>
                <Input value={spreadMeta.category} onChange={(e) => setSpreadMeta({ ...spreadMeta, category: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm">Description</label>
                <Textarea value={spreadMeta.description} onChange={(e) => setSpreadMeta({ ...spreadMeta, description: e.target.value })} className="bg-white/10 border-white/20 text-white min-h-[80px]" />
              </div>
            </div>

            <SpreadDesignCanvas positions={positions} onChange={setPositions} showGrid />

            <div className="space-y-2">
              <h3 className="font-semibold">Positions</h3>
              <div className="grid gap-3">
                {positions.map((p, i) => (
                  <div key={i} className="grid md:grid-cols-12 gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="md:col-span-2">
                      <Input value={p.name} onChange={(e) => setPositions((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="md:col-span-8">
                      <Input placeholder="Meaning / question" value={p.meaning} onChange={(e) => setPositions((prev) => prev.map((x, idx) => idx === i ? { ...x, meaning: e.target.value } : x))} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="md:col-span-1">
                      <Input value={p.x} onChange={(e) => setPositions((prev) => prev.map((x, idx) => idx === i ? { ...x, x: Number(e.target.value || 0) } : x))} className="bg-white/10 border-white/20 text-white" />
                      <div className="text-[10px] text-white/60">x%</div>
                    </div>
                    <div className="md:col-span-1">
                      <Input value={p.y} onChange={(e) => setPositions((prev) => prev.map((x, idx) => idx === i ? { ...x, y: Number(e.target.value || 0) } : x))} className="bg-white/10 border-white/20 text-white" />
                      <div className="text-[10px] text-white/60">y%</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setPositions((prev) => [...prev, { name: `Position ${prev.length + 1}`, meaning: "", x: 50, y: 50 }])} className="bg-purple-600 hover:bg-purple-700">Add position</Button>
                <Button onClick={saveAttachedSpread} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? "Saving..." : "Save & Link to Recipe"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-white/70">
              Tip: Once saved, this custom spread appears in the Reading page’s Spread Type menu (for non-rune decks).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}