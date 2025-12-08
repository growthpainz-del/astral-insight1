import React from "react";
import { Card as CardEntity } from "@/entities/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Plus, Trash2, Search } from "lucide-react";

function objToRows(customFieldsObj) {
  if (!customFieldsObj || typeof customFieldsObj !== "object") return [];
  return Object.keys(customFieldsObj).map((key) => ({
    key,
    label: customFieldsObj[key]?.label || "",
    category: customFieldsObj[key]?.category || "other",
    value: customFieldsObj[key]?.value || ""
  }));
}

function rowsToObj(rows) {
  const out = {};
  rows
    .filter(r => (r.key || "").trim() && (r.value || "").trim())
    .forEach((r) => {
      out[r.key.trim()] = {
        label: (r.label || "").trim() || r.key.trim(),
        value: r.value,
        category: r.category || "other"
      };
    });
  return out;
}

export default function QuickCustomNotes({ deckId, isOpen, onClose, onSaved }) {
  const [cards, setCards] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [customNotes, setCustomNotes] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setSelected(null);
    setCustomNotes("");
    setRows([]);
    CardEntity.filter({ deck_id: deckId }, "name")
      .then((list) => setCards(list))
      .catch((e) => setError(e.message || "Failed to load cards"))
      .finally(() => setLoading(false));
  }, [isOpen, deckId]);

  const filtered = cards.filter((c) =>
    (c.name || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  const pickCard = (card) => {
    setSelected(card);
    setCustomNotes(card.custom || "");
    setRows(objToRows(card.custom_fields));
  };

  const addRow = () => {
    setRows((r) => [...r, { key: "", label: "", category: "other", value: "" }]);
  };

  const updateRow = (idx, patch) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const removeRow = (idx) => {
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await CardEntity.update(selected.id, {
        custom: customNotes || "",
        custom_fields: rowsToObj(rows),
      });
      // Update local list so badges reflect
      const updated = await CardEntity.get(selected.id);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelected(updated);
      if (onSaved) onSaved();
    } catch (e) {
      setError(e.message || "Failed to save custom notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full bg-slate-900 text-white border border-purple-800/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-300" />
            Custom Notes Manager
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: card list */}
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards (e.g., Lakshmi)"
                className="pl-9 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <ScrollArea className="mt-3 h-[55vh] rounded border border-slate-700">
              <div className="p-2 space-y-1">
                {loading && (
                  <div className="flex items-center gap-2 text-white/70 p-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading cards…
                  </div>
                )}
                {!loading && filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCard(c)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-slate-800 transition ${selected?.id === c.id ? "bg-slate-800" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      <div className="flex items-center gap-2">
                        {c.custom && <Badge className="bg-emerald-700/60">Notes</Badge>}
                        {c.custom_fields && Object.keys(c.custom_fields).length > 0 && (
                          <Badge variant="outline" className="border-amber-400/40 text-amber-200">Fields</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-sm text-white/60 px-3 py-6">No cards match your search.</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: editor */}
          <div className="md:col-span-2">
            {!selected ? (
              <div className="h-[60vh] border border-slate-700 rounded flex items-center justify-center text-white/60">
                Select a card to edit its notes.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selected.name}</h3>
                  <Badge variant="outline" className="border-white/20">
                    #{selected.number ?? "—"}
                  </Badge>
                </div>

                <div>
                  <label className="text-xs text-white/70">Custom Notes for AI</label>
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Add any guidance you'd like the AI to consider for this card…"
                    className="bg-slate-800 border-slate-700 text-white h-32"
                  />
                  <p className="text-[11px] text-white/50 mt-1">
                    These notes are saved on the card’s “custom” field and can be used by AI readings.
                  </p>
                </div>

                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/80">Custom Fields</label>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={addRow}>
                      <Plus className="w-4 h-4 mr-1" /> Add field
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {rows.length === 0 && (
                      <div className="text-sm text-white/60">No custom fields. Click “Add field” to create one.</div>
                    )}
                    {rows.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-10 gap-2 items-start">
                        <Input
                          value={r.key}
                          onChange={(e) => updateRow(idx, { key: e.target.value })}
                          placeholder="key (e.g., myth_ref)"
                          className="md:col-span-2 bg-slate-800 border-slate-700"
                        />
                        <Input
                          value={r.label}
                          onChange={(e) => updateRow(idx, { label: e.target.value })}
                          placeholder="label (e.g., Myth Reference)"
                          className="md:col-span-2 bg-slate-800 border-slate-700"
                        />
                        <Select
                          value={r.category || "other"}
                          onValueChange={(val) => updateRow(idx, { category: val })}
                        >
                          <SelectTrigger className="md:col-span-2 bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white">
                            <SelectItem value="scripture">Scripture</SelectItem>
                            <SelectItem value="meaning">Meaning</SelectItem>
                            <SelectItem value="action">Action</SelectItem>
                            <SelectItem value="wisdom">Wisdom</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={r.value}
                          onChange={(e) => updateRow(idx, { value: e.target.value })}
                          placeholder="Value/content"
                          className="md:col-span-3 bg-slate-800 border-slate-700 h-20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeRow(idx)}
                          className="md:col-span-1 border-red-600/40 text-red-300 hover:bg-red-900/30"
                          title="Remove field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-300 bg-red-900/20 border border-red-600/40 rounded p-2">{error}</div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="border-white/20" onClick={onClose}>Close</Button>
                  <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>) : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}