import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function DeckPickerModal({ open, onOpenChange, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decks, setDecks] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const list = await base44.entities.Deck.filter({}, '-updated_date', 100);
        setDecks(Array.isArray(list) ? list : []);
      } catch (e) {
        setError(e?.message || 'Failed to load decks');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filtered = decks.filter(d => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (d.name || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Select a Deck</DialogTitle>
          <DialogDescription className="text-white/60">
            Choose a deck to scope your Interpreter training, or close to train a user-level interpreter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decks..."
            className="bg-slate-800 border-slate-700 text-white"
          />

          {loading ? (
            <div className="flex items-center gap-2 text-purple-300"><Loader2 className="w-4 h-4 animate-spin" /> Loading decks…</div>
          ) : error ? (
            <div className="text-red-300 text-sm">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto pr-1">
              {filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelect?.(d)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left"
                >
                  {d.cover_image ? (
                    <img src={d.cover_image} alt={d.name} className="w-14 h-14 rounded object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded bg-slate-800 flex items-center justify-center text-xs text-white/50">No Image</div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{d.name}</div>
                    <div className="text-xs text-white/60 line-clamp-2">{d.description || '—'}</div>
                  </div>
                </button>
              ))}
              {!filtered.length && (
                <div className="text-white/60 text-sm">No decks match your search.</div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
              Train without deck
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}