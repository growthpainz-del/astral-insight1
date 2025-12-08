import React from "react";
import { Card as CardEntity } from "@/entities/all";
import "@/components/deck/_cardUpdatePatch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

export default function QuickMeaningEditor({ deckId, onSaved }) {
  const [cards, setCards] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [savingIds, setSavingIds] = React.useState(new Set());
  const [savedIds, setSavedIds] = React.useState(new Set());
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!deckId) return;
    setLoading(true);
    try {
      const list = await CardEntity.filter({ deck_id: deckId });
      const sorted = [...list].sort((a, b) => {
        const na = a.number ?? 0;
        const nb = b.number ?? 0;
        if (na !== nb) return na - nb;
        return (a.name || "").localeCompare(b.name || "");
      });
      // add local fields for editing
      setCards(sorted.map(c => ({
        ...c,
        _upright: c.upright_meaning || "",
        _reversed: c.reversed_meaning || "",
        _dirty: false,
      })));
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(c => {
      const hay = `${c.number || ""} ${c.name || ""} ${c._upright} ${c._reversed}`.toLowerCase();
      return hay.includes(q);
    });
  }, [cards, search]);

  const markDirty = (id, fields) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...fields, _dirty: true } : c));
    // Remove "saved" checkmark once edited again
    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const saveOne = async (card) => {
    if (!card?._dirty) {
      setSavedIds(prev => new Set(prev).add(card.id));
      return;
    }
    setSavingIds(prev => {
      const next = new Set(prev);
      next.add(card.id);
      return next;
    });
    try {
      await CardEntity.update(card.id, {
        upright_meaning: card._upright || "",
        reversed_meaning: card._reversed || "",
      });
      // reflect clean state
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, upright_meaning: card._upright, reversed_meaning: card._reversed, _dirty: false } : c));
      setSavedIds(prev => {
        const next = new Set(prev);
        next.add(card.id);
        return next;
      });
      if (onSaved) onSaved();
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  };

  const saveAll = async () => {
    const dirty = cards.filter(c => c._dirty);
    for (let i = 0; i < dirty.length; i++) {
       
      await saveOne(dirty[i]);
      // small delay to be gentle on rate limits
       
      await new Promise(r => setTimeout(r, 120));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <Input
          placeholder="Search by number, name, or meaning…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-black/40 border-white/20 text-white"
        />
        <Button onClick={saveAll} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Save className="w-4 h-4 mr-2" /> Save All Changes
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/80">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading cards…
        </div>
      ) : (
        <ScrollArea className="h-[60vh] rounded-lg border border-white/10">
          <div className="divide-y divide-white/10">
            {filtered.map((c) => {
              const isSaving = savingIds.has(c.id);
              const isSaved = savedIds.has(c.id) && !c._dirty;
              return (
                <div key={c.id} className="p-4 bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-white font-semibold">
                      #{c.number ?? "—"} {c.name}
                    </div>
                    <div className="flex items-center gap-2">
                      {isSaved ? (
                        <span className="flex items-center text-emerald-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Saved
                        </span>
                      ) : null}
                      <Button
                        size="sm"
                        onClick={() => saveOne(c)}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" /> Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/70 mb-1">Upright Meaning</label>
                      <Textarea
                        value={c._upright}
                        onChange={(e) => markDirty(c.id, { _upright: e.target.value })}
                        placeholder="Add or update the upright meaning…"
                        className="bg-black/40 border-white/20 text-white min-h-[96px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/70 mb-1">Reversed Meaning</label>
                      <Textarea
                        value={c._reversed}
                        onChange={(e) => markDirty(c.id, { _reversed: e.target.value })}
                        placeholder="Add or update the reversed meaning…"
                        className="bg-black/40 border-white/20 text-white min-h-[96px]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-white/70">No cards match your search.</div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}