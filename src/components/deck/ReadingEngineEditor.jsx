import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Edit, Check, X, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function ReadingEngineEditor({ deckId, deck }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await base44.entities.ReadingCategory.filter({ deck_id: deckId });
      setCategories(res || []);
    } catch (e) {
      console.error("Failed to load categories:", e);
      toast.error("Failed to load reading categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deckId) loadCategories();
  }, [deckId]);

  const handleAddNew = () => {
    setEditingCategory({
      deck_id: deckId,
      name: "",
      description: "",
      branch_1_title: "The Core Energy",
      branch_2_title: "The Modifier",
      branch_3_title: "The Outcome",
      interpretation_instructions: "Synthesize these three elements to answer your query.",
      booster_symbols: [],
      is_active: true,
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleSave = async () => {
    if (!editingCategory.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    
    try {
      setLoading(true);
      if (editingCategory.id) {
        await base44.entities.ReadingCategory.update(editingCategory.id, editingCategory);
        toast.success("Category updated!");
      } else {
        await base44.entities.ReadingCategory.create(editingCategory);
        toast.success("Category created!");
      }
      setEditingCategory(null);
      await loadCategories();
    } catch (e) {
      console.error("Failed to save category:", e);
      toast.error("Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      setLoading(true);
      await base44.entities.ReadingCategory.delete(id);
      toast.success("Category deleted.");
      await loadCategories();
    } catch (e) {
      console.error("Failed to delete:", e);
      toast.error("Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    setIsAiGenerating(true);
    try {
      const prompt = `You are an expert oracle deck creator. Based on this deck's details, suggest a new Reading Category for a structured reading engine. 
Deck Name: ${deck?.name || "Untitled"}
Deck Description: ${deck?.description || "No description"}
AI Reading Coach info: ${deck?.ai_reading_coach || "None"}

A reading category needs:
- name: e.g. "Love & Relationships", "Shadow Work"
- description: What it focuses on
- branch_1_title: The first card/concept (e.g. "The Core Energy", "Current State")
- branch_2_title: The second card/concept/modifier (e.g. "The Obstacle", "Hidden Factor")
- branch_3_title: The third card/concept/outcome (e.g. "The Outcome", "Next Step")
- booster_symbols: An array of 10 thematic symbols (emojis) and their meanings tailored to this category's theme.
- interpretation_instructions: How the user should combine these 3 branches and the booster symbol.

Return a JSON matching the requested schema.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            branch_1_title: { type: "string" },
            branch_2_title: { type: "string" },
            branch_3_title: { type: "string" },
            interpretation_instructions: { type: "string" },
            booster_symbols: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  meaning: { type: "string" }
                }
              }
            }
          }
        }
      });

      const parsed = typeof response === "string" ? JSON.parse(response) : response;
      setEditingCategory({
        ...editingCategory,
        deck_id: deckId,
        name: parsed.name || "",
        description: parsed.description || "",
        branch_1_title: parsed.branch_1_title || "Branch 1",
        branch_2_title: parsed.branch_2_title || "Branch 2",
        branch_3_title: parsed.branch_3_title || "Branch 3",
        interpretation_instructions: parsed.interpretation_instructions || "",
        booster_symbols: parsed.booster_symbols || [],
        is_active: true
      });
      toast.success("AI generated a suggestion! Review and save.");

    } catch (e) {
      console.error("AI Gen Failed:", e);
      toast.error("Failed to generate AI suggestion.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const addBoosterSymbol = () => {
    setEditingCategory(prev => ({
      ...prev,
      booster_symbols: [...(prev.booster_symbols || []), { symbol: "", meaning: "" }]
    }));
  };

  const updateBoosterSymbol = (index, field, value) => {
    setEditingCategory(prev => {
      const newSymbols = [...prev.booster_symbols];
      newSymbols[index] = { ...newSymbols[index], [field]: value };
      return { ...prev, booster_symbols: newSymbols };
    });
  };

  const removeBoosterSymbol = (index) => {
    setEditingCategory(prev => {
      const newSymbols = [...prev.booster_symbols];
      newSymbols.splice(index, 1);
      return { ...prev, booster_symbols: newSymbols };
    });
  };

  if (loading && !categories.length && !editingCategory) {
    return <div className="flex items-center gap-2 text-white/50"><Loader2 className="animate-spin w-4 h-4" /> Loading rules...</div>;
  }

  if (editingCategory) {
    return (
      <div className="bg-black/30 border border-purple-500/30 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-purple-300">
            {editingCategory.id ? "Edit Category" : "New Category"}
          </h3>
          <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={isAiGenerating} className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20">
            {isAiGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            AI Suggest
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/80">Category Name *</Label>
            <Input 
              value={editingCategory.name} 
              onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} 
              placeholder="e.g. Love & Relationships"
              className="bg-black/40 border-white/10 text-white mt-1"
            />
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-md p-3 mt-auto">
            <div>
              <div className="font-medium text-white">Active</div>
              <div className="text-xs text-white/50">Available for readings</div>
            </div>
            <Switch 
              checked={editingCategory.is_active} 
              onCheckedChange={v => setEditingCategory({...editingCategory, is_active: v})} 
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-white/80">Description</Label>
            <Textarea 
              value={editingCategory.description} 
              onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} 
              className="bg-black/40 border-white/10 text-white mt-1 h-20"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 border-t border-white/10 pt-4">
          <div>
            <Label className="text-white/80">Branch 1 Title</Label>
            <Input 
              value={editingCategory.branch_1_title} 
              onChange={e => setEditingCategory({...editingCategory, branch_1_title: e.target.value})} 
              className="bg-black/40 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-white/80">Branch 2 Title</Label>
            <Input 
              value={editingCategory.branch_2_title} 
              onChange={e => setEditingCategory({...editingCategory, branch_2_title: e.target.value})} 
              className="bg-black/40 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-white/80">Branch 3 Title</Label>
            <Input 
              value={editingCategory.branch_3_title} 
              onChange={e => setEditingCategory({...editingCategory, branch_3_title: e.target.value})} 
              className="bg-black/40 border-white/10 text-white mt-1"
            />
          </div>
          <div className="md:col-span-3">
            <Label className="text-white/80">Interpretation Instructions</Label>
            <Textarea 
              value={editingCategory.interpretation_instructions} 
              onChange={e => setEditingCategory({...editingCategory, interpretation_instructions: e.target.value})} 
              className="bg-black/40 border-white/10 text-white mt-1 h-24"
              placeholder="Explain how to combine these 3 branches with the booster symbol..."
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-white/80 text-lg">Booster Symbols</Label>
            <Button size="sm" variant="outline" onClick={addBoosterSymbol} className="border-white/20 text-white hover:bg-white/10">
              <Plus className="w-4 h-4 mr-2" /> Add Symbol
            </Button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {(editingCategory.booster_symbols || []).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <Input 
                  value={item.symbol} 
                  onChange={e => updateBoosterSymbol(idx, 'symbol', e.target.value)} 
                  placeholder="Emoji"
                  className="w-16 bg-black/40 border-white/10 text-center text-xl"
                />
                <Input 
                  value={item.meaning} 
                  onChange={e => updateBoosterSymbol(idx, 'meaning', e.target.value)} 
                  placeholder="Meaning"
                  className="flex-1 bg-black/40 border-white/10 text-white"
                />
                <Button variant="ghost" size="icon" onClick={() => removeBoosterSymbol(idx)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {!(editingCategory.booster_symbols || []).length && (
              <p className="text-white/40 text-sm text-center py-4">No symbols added yet.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <Button variant="outline" onClick={handleCancelEdit} disabled={loading} className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Save Category
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(cat => (
          <div key={cat.id} className="bg-black/30 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                {cat.name}
                {!cat.is_active && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Inactive</span>}
              </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)} className="text-blue-400 hover:bg-blue-400/10 h-8 w-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-red-400 hover:bg-red-400/10 h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-3 line-clamp-2">{cat.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md">{cat.branch_1_title}</span>
              <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md">{cat.branch_2_title}</span>
              <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md">{cat.branch_3_title}</span>
            </div>

            <div className="text-xs text-white/40">
              {cat.booster_symbols?.length || 0} symbols defined
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 bg-black/20 rounded-xl border border-white/5">
            <Sparkles className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
            <p className="text-white/60">No reading categories defined yet.</p>
            <p className="text-white/40 text-sm mt-1">Create your first category to power your deck's structured readings.</p>
          </div>
        )}
      </div>
    </div>
  );
}