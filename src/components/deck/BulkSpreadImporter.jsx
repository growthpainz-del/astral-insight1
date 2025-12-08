
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spread } from "@/entities/Spread";
import { Loader2, CheckCircle2, AlertTriangle, ListPlus, MapPin } from "lucide-react";

function toArrayMaybe(obj) {
  if (!obj) return [];
  return Array.isArray(obj) ? obj : [obj];
}

function coerceNumber(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

// Circular auto-layout for n positions
function autoLayoutPositions(positions) {
  const n = positions.length || 1;
  const cx = 50;
  const cy = 50;
  const r = n <= 3 ? 20 : n <= 6 ? 28 : n <= 10 ? 34 : 40;
  return positions.map((p, i) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2; // start at top
    const x = Math.round(cx + r * Math.cos(theta));
    const y = Math.round(cy + r * Math.sin(theta));
    return { ...p, x, y };
  });
}

// Normalize a raw position struct into {name, meaning, x, y}
function normalizePosition(raw) {
  if (typeof raw === "string") {
    return { name: raw, meaning: raw, x: undefined, y: undefined };
  }
  if (!raw || typeof raw !== "object") return { name: "Position", meaning: "", x: undefined, y: undefined };

  // Try common keys with variations + your format (number/question/coordinates)
  const nameFromNumber = raw.number != null ? `Position ${raw.number}` : undefined;

  const name = raw.name || raw.title || raw.position || nameFromNumber || "Position";
  const meaning = raw.meaning || raw.description || raw.prompt || raw.question || "";

  // x/y from many shapes
  let x = raw.x ?? raw.left ?? raw.pos_x ?? raw.posX;
  let y = raw.y ?? raw.top ?? raw.pos_y ?? raw.posY;

  // Support {pos:{x,y}} or {pos:[x,y]}
  if ((x === undefined || y === undefined) && raw.pos && typeof raw.pos === "object") {
    if (Array.isArray(raw.pos)) {
      x = raw.pos[0];
      y = raw.pos[1];
    } else {
      x = raw.pos.x ?? x;
      y = raw.pos.y ?? y;
    }
  }

  // Support coordinates: "(50, 50)" or "50,50" or "50 50"
  if ((x === undefined || y === undefined) && typeof raw.coordinates === "string") {
    const nums = raw.coordinates.match(/-?\d+(\.\d+)?/g);
    if (nums && nums.length >= 2) {
      x = Number(nums[0]);
      y = Number(nums[1]);
    }
  }
  if ((x === undefined || y === undefined) && typeof raw.coords === "string") {
    const nums = raw.coords.match(/-?\d+(\.\d+)?/g);
    if (nums && nums.length >= 2) {
      x = Number(nums[0]);
      y = Number(nums[1]);
    }
  }

  x = coerceNumber(x, undefined);
  y = coerceNumber(y, undefined);

  return { name: String(name), meaning: String(meaning || ""), x, y };
}

function normalizeSpread(raw, deckId, defaultCategory) {
  if (!raw || typeof raw !== "object") return null;

  const name = raw.name || raw.title || raw.spread_name;
  if (!name) return null;

  const description = raw.description || raw.overview || raw.summary || "";
  const category = raw.category || defaultCategory || "General";

  // Positions can be under various keys
  const rawPositions =
    raw.positions ||
    raw.cards ||
    raw.slots ||
    raw.points ||
    raw.spots ||
    [];

  const normalized = toArrayMaybe(rawPositions).map(normalizePosition);

  // If any position missing coords, do auto layout
  const needsAuto = normalized.some(p => typeof p.x !== "number" || typeof p.y !== "number");
  const finalPositions = needsAuto ? autoLayoutPositions(normalized) : normalized;

  return {
    name: String(name),
    description: String(description),
    category: String(category),
    positions: finalPositions,
    deck_id: deckId || null,
    is_public: false
  };
}

export default function BulkSpreadImporter({ deckId, isOpen, onClose, onImportComplete }) {
  const [rawText, setRawText] = React.useState("");
  const [defaultCategory, setDefaultCategory] = React.useState("General");
  const [parsed, setParsed] = React.useState([]);
  const [error, setError] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => {
    if (!isOpen) {
      setRawText("");
      setParsed([]);
      setError("");
      setParsing(false);
      setImporting(false);
      setProgress(0);
      setSummary(null);
    }
  }, [isOpen]);

  const handleParse = (autoFix = false) => {
    setParsing(true);
    setError("");
    setParsed([]);
    try {
      let json;

      // First try strict JSON
      try {
        json = JSON.parse(rawText);
      } catch (e1) {
        // Fallback: attempt auto-fix even if user clicked "Parse"
        let t = String(rawText || "");

        // Normalize smart quotes and BOM
        t = t.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/^\uFEFF/, "").trim();

        // If starts with spreads: [...] (quoted or unquoted), wrap into an object
        if (/^"?spreads"?\s*:/.test(t)) {
          t = `{ ${t} }`;
        }

        // Ensure "spreads" key is quoted when inside an object
        t = t.replace(/(\{|\s|,)(\s*)spreads(\s*):/g, '$1"spreads":');

        // If it's a raw array, wrap as {"spreads": [...]}
        if (t.startsWith("[")) {
          t = `{"spreads": ${t}}`;
        }

        // Remove trailing commas before } or ]
        t = t.replace(/,\s*([}\]])/g, "$1");

        // Balance square brackets a bit (common paste truncations)
        const opens = (t.match(/\[/g) || []).length;
        const closes = (t.match(/\]/g) || []).length;
        if (opens > closes) t += "]".repeat(opens - closes);

        // Try parsing the normalized candidate
        try {
          json = JSON.parse(t);
        } catch (e2) {
          // Last resort: extract first JSON array and treat as spreads
          const arrMatch = t.match(/\[[\s\S]*\]/);
          if (arrMatch) {
            try {
              const arrStr = arrMatch[0].replace(/,\s*]/g, "]"); // trailing comma before ]
              const arr = JSON.parse(arrStr);
              json = { spreads: arr };
            } catch {
              throw e2;
            }
          } else {
            // Try single object fallback
            const objMatch = t.match(/\{[\s\S]*\}/);
            if (objMatch) {
              try {
                const objStr = objMatch[0].replace(/,\s*}/g, "}");
                const obj = JSON.parse(objStr);
                json = { spreads: [obj] };
              } catch {
                throw e2;
              }
            } else {
              throw e2;
            }
          }
        }
      }

      // Build spreads array from many possible shapes
      let spreadsArr = [];
      if (Array.isArray(json)) {
        spreadsArr = json;
      } else if (json && typeof json === "object") {
        if (Array.isArray(json.spreads)) {
          spreadsArr = json.spreads;
        } else if (Array.isArray(json.Spreads)) {
          spreadsArr = json.Spreads;
        } else if (json.spread) {
          spreadsArr = Array.isArray(json.spread) ? json.spread : [json.spread];
        } else {
          // Single spread object
          spreadsArr = [json];
        }
      }

      const normalized = spreadsArr
        .map((s) => normalizeSpread(s, deckId, defaultCategory))
        .filter(Boolean);

      if (normalized.length === 0) {
        setError("No spreads found. Provide an array of spreads or an object with spreads: [...]. Each spread must have a name and positions.");
      } else {
        setParsed(normalized);
      }
    } catch (e) {
      setError(`Invalid or unsupported JSON. Tip: you can paste: spreads: [ ... ] or {"spreads":[...]} and use coordinates "(50, 50)". ${e.message || ""}`);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsed.length) return;
    setImporting(true);
    setProgress(0);
    setSummary(null);

    let created = 0;
    let failed = 0;
    const failures = [];

    // Bulk in reasonable chunks to avoid rate limits
    const chunkSize = 10;
    for (let i = 0; i < parsed.length; i += chunkSize) {
      const chunk = parsed.slice(i, i + chunkSize);
      try {
        await Spread.bulkCreate(chunk);
        created += chunk.length;
      } catch (e) {
        failed += chunk.length;
        failures.push(e.message || "Unknown error");
      }
      setProgress(Math.round(((i + chunkSize) / parsed.length) * 100));
      await new Promise(r => setTimeout(r, 50));
    }

    setSummary({ total: parsed.length, created, failed, failures });
    setImporting(false);
    if (onImportComplete) onImportComplete();
  };

  const preview = parsed.slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-purple-300" />
            Bulk Spreads Import
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-white/70">
            Paste JSON containing spreads. Supports either an array of spreads, or an object like {"{ spreads: [...] }"}.
            Each spread should have name, optional description/category, and positions (each with name/meaning; x/y optional).
            Missing coordinates are auto-arranged in a circle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder='Examples: [{"name":"Three Card","positions":[{"name":"Past"},{"name":"Present"},{"name":"Future"}]}] or {"spreads":[...]}'
                className="min-h-[180px] bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs text-white/70">Default Category</label>
              <Input
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="bg-slate-800 border-slate-700"
                placeholder="General"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleParse(false)} disabled={parsing} className="bg-purple-600 hover:bg-purple-700">
                  {parsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Parse
                </Button>
                <Button onClick={() => handleParse(true)} variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-900/20" disabled={parsing}>
                  Auto‑Fix & Parse
                </Button>
              </div>
              {parsed.length > 0 && (
                <Badge className="bg-green-600/20 text-green-300 border-green-500/40">
                  Parsed {parsed.length} spreads
                </Badge>
              )}
              {error && (
                <div className="text-red-300 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {parsed.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-300" />
                Preview (first 5)
              </h4>
              <ScrollArea className="max-h-48 rounded border border-slate-700">
                <div className="p-3 space-y-3">
                  {preview.map((s, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{s.name}</div>
                        <Badge variant="outline" className="text-xs">{s.category || "General"}</Badge>
                      </div>
                      {s.description && <p className="text-xs text-white/70 mt-1">{s.description}</p>}
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {s.positions.map((p, i) => (
                          <div key={i} className="text-xs text-white/80 bg-slate-900/60 border border-slate-700 px-2 py-1 rounded">
                            <span className="font-semibold">{i + 1}. {p.name}</span>
                            <span className="block text-white/60">{p.meaning}</span>
                            <span className="block text-white/40">x:{p.x} y:{p.y}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {summary && (
            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded">
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Import finished</span>
              </div>
              <p className="text-sm text-white/80 mt-1">
                Total: {summary.total} • Created: {summary.created} • Failed: {summary.failed}
              </p>
              {summary.failures?.length > 0 && (
                <div className="text-xs text-red-300 mt-2">
                  {summary.failures.slice(0, 5).map((f, i) => <div key={i}>- {f}</div>)}
                  {summary.failures.length > 5 && <div>...and {summary.failures.length - 5} more</div>}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          {importing && (
            <div className="flex-1 mr-3">
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-white">
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsed.length || importing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Spreads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
