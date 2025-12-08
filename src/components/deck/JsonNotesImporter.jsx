
import React from "react";
import { Card as CardEntity } from "@/entities/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CARD_FIELD_WHITELIST } from "@/components/deck/cardFields";

function normalizeName(s) {
  return (s || "").toString().trim().toLowerCase();
}

function toCustomFieldsObject(val) {
  // Accept either:
  // - object of {key: "value"} or {key: {label, value, category}}
  // - array of {key, label?, value, category?}
  if (!val) return undefined;
  const out = {};
  if (Array.isArray(val)) {
    val.forEach((row) => {
      const k = (row?.key || "").trim();
      if (!k) return;
      out[k] = {
        label: (row.label || k).toString(),
        value: (row.value || "").toString(),
        category: row.category || "other",
      };
    });
    return out;
  }
  if (typeof val === "object") {
    Object.keys(val).forEach((k) => {
      const v = val[k];
      if (v == null) return;
      if (typeof v === "string") {
        out[k] = { label: k, value: v, category: "other" };
      } else if (typeof v === "object") {
        out[k] = {
          label: (v.label || k).toString(),
          value: (v.value || "").toString(),
          category: v.category || "other",
        };
      }
    });
    return out;
  }
  return undefined;
}

function sanitizePayload(raw) {
  const payload = {};
  Object.keys(raw || {}).forEach((k) => {
    if (!CARD_FIELD_WHITELIST.has(k)) return;
    let v = raw[k];
    if (k === "keywords") {
      if (Array.isArray(v)) {
        payload.keywords = v.map((x) => x.toString());
      } else if (typeof v === "string") {
        payload.keywords = v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return;
    }
    if (k === "custom_fields") {
      const cf = toCustomFieldsObject(v);
      if (cf) payload.custom_fields = cf;
      return;
    }
    if (k === "number" && v !== null && v !== undefined && v !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) payload.number = n;
      return;
    }
    if (k === "name" && typeof v === "string") {
      // allow renaming only if explicitly provided
      payload.name = v;
      return;
    }
    payload[k] = v;
  });
  return payload;
}

export default function JsonNotesImporter({ deckId, isOpen, onClose, onImported }) {
  const [jsonText, setJsonText] = React.useState("");
  const [cards, setCards] = React.useState([]);
  const [matches, setMatches] = React.useState([]); // {card, payload, source}
  const [unmatched, setUnmatched] = React.useState([]); // items that couldn't match any card
  const [parsing, setParsing] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [error, setError] = React.useState("");
  const [onlyNotes, setOnlyNotes] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setError("");
    setJsonText("");
    setMatches([]);
    setUnmatched([]);
    setProgress({ done: 0, total: 0 });
    setApplying(false);
    setParsing(false);
    CardEntity.filter({ deck_id: deckId }, "name").then(setCards);
  }, [isOpen, deckId]);

  const handleFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
  };

  const parseJson = () => {
    try {
      setParsing(true);
      setError("");
      const data = JSON.parse(jsonText);
      const byName = new Map();
      const byNumber = new Map();
      cards.forEach((c) => {
        if (c.name) byName.set(normalizeName(c.name), c);
        if (c.number != null) byNumber.set(Number(c.number), c);
      });

      const parsedItems = [];

      // Accept shapes:
      // 1) Array of objects [{name?, number?, ...fields}]
      // 2) Object keyed by name { "Lakshmi": {...fields}, ... }
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (!item || typeof item !== "object") return;
          const nameKey = normalizeName(item.name);
          const hasNumber = item.number != null && item.number !== "";
          const byNameCard = nameKey ? byName.get(nameKey) : null;
          const byNumCard = hasNumber ? byNumber.get(Number(item.number)) : null;
          const card = byNameCard || byNumCard;
          const payload = sanitizePayload(item);
          parsedItems.push({ card, payload, source: item });
        });
      } else if (typeof data === "object" && data) {
        Object.keys(data).forEach((k) => {
          const item = data[k];
          const card = byName.get(normalizeName(k)) || (item?.number != null ? byNumber.get(Number(item.number)) : null);
          const payload = sanitizePayload(item || {});
          parsedItems.push({ card, payload, source: { name: k, ...(item || {}) } });
        });
      } else {
        throw new Error("Unsupported JSON format");
      }

      const m = parsedItems.filter((x) => x.card && Object.keys(x.payload || {}).length > 0);
      const u = parsedItems.filter((x) => !x.card);

      // Optional: If toggled to only notes, strip payload to just custom/custom_fields
      const finalMatches = m.map((x) => {
        if (!onlyNotes) return x;
        const reduced = {};
        if (x.payload.custom != null) reduced.custom = x.payload.custom;
        if (x.payload.custom_fields != null) reduced.custom_fields = x.payload.custom_fields;
        return { ...x, payload: reduced };
      });

      setMatches(finalMatches);
      setUnmatched(u);
    } catch (e) {
      setError(e.message || "Failed to parse JSON");
      setMatches([]);
      setUnmatched([]);
    } finally {
      setParsing(false);
    }
  };

  const applyUpdates = async () => {
    if (matches.length === 0) return;
    setApplying(true);
    setProgress({ done: 0, total: matches.length });
    setError("");

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      try {
        await CardEntity.update(m.card.id, m.payload);
      } catch (e) {
        console.error("Update failed for", m.card?.name, e);
        // continue
      }
      setProgress({ done: i + 1, total: matches.length });
      // small delay to avoid rate limits
       
      await new Promise((r) => setTimeout(r, 180));
    }

    setApplying(false);
    if (onImported) onImported(matches.length);
    onClose();
  };

  const matchedCount = matches.length;
  const unmatchedCount = unmatched.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full bg-slate-900 text-white border border-purple-800/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-300" />
            Import Notes/Fields from JSON
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Input */}
          <div className="lg:col-span-1 space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-white/70">Upload JSON file</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded border border-white/20 bg-slate-800 cursor-pointer w-fit">
                <Upload className="w-4 h-4" />
                Choose file
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/70">Or paste JSON</label>
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='Examples:
[{"name":"Lakshmi","custom":"Prosperity notes","custom_fields":{"myth_ref":"Vedic goddess"}}]
or
{"Lakshmi":{"custom":"Prosperity notes","custom_fields":[{"key":"myth_ref","label":"Myth Reference","value":"Vedic goddess"}]}}'
                className="bg-slate-800 border-slate-700 text-white h-48"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyNotes}
                  onChange={(e) => setOnlyNotes(e.target.checked)}
                />
                Only update Custom Notes & Custom Fields
              </label>
              <Button onClick={parseJson} disabled={parsing} className="bg-cyan-600 hover:bg-cyan-700">
                {parsing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing…</>) : "Parse"}
              </Button>
            </div>

            {error && (
              <div className="text-sm bg-red-900/20 border border-red-600/40 rounded p-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-300 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-700/50">Matched: {matchedCount}</Badge>
              <Badge variant="outline" className="border-amber-400/40 text-amber-200">Unmatched: {unmatchedCount}</Badge>
              {applying && (
                <span className="text-sm text-white/70">
                  Applying {progress.done}/{progress.total}…
                </span>
              )}
            </div>

            <Separator className="bg-white/10" />

            <ScrollArea className="h-[360px] rounded border border-slate-700">
              <div className="p-3 space-y-3">
                {matches.slice(0, 80).map((m, i) => (
                  <div key={i} className="p-2 rounded bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{m.card?.name} <span className="text-xs text-white/60">#{m.card?.number ?? "—"}</span></div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div className="mt-1 text-xs text-white/70 break-words">
                      Will update fields: {Object.keys(m.payload).filter(k => k !== "name").join(", ") || "none"}
                    </div>
                  </div>
                ))}
                {matches.length > 80 && (
                  <div className="text-xs text-white/60">Showing first 80 of {matches.length} matches…</div>
                )}

                {unmatched.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-amber-300 mb-1">Unmatched entries (check name/number):</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {unmatched.slice(0, 20).map((u, i) => (
                        <div key={i} className="text-xs text-white/60 bg-white/5 rounded p-2 border border-white/10">
                          {(u?.source?.name || u?.source?.number || "Unknown").toString()}
                        </div>
                      ))}
                    </div>
                    {unmatched.length > 20 && (
                      <div className="text-xs text-white/60 mt-1">…and {unmatched.length - 20} more</div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button variant="outline" className="border-white/20" onClick={onClose}>Cancel</Button>
          <Button
            onClick={applyUpdates}
            disabled={applying || matches.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {applying ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying…</>) : `Apply Updates (${matchedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
