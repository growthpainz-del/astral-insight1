
import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card as UICard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon, Link as LinkIcon, Hash, AlertTriangle, CheckCircle2 } from "lucide-react";
import "@/components/deck/_cardUpdatePatch";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function filenameFromUrl(url) {
  try {
    const u = new URL(url);
    return (u.pathname.split("/").pop() || "").trim();
  } catch {
    return "";
  }
}

function normalizeForName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-\.]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function slug(s) {
  return normalizeForName(s).replace(/\s+/g, "-");
}

// Roman numeral support (I..L = 1..50)
const ROMAN_MAP = new Map([
  ["i",1],["ii",2],["iii",3],["iv",4],["v",5],["vi",6],["vii",7],["viii",8],["ix",9],["x",10],
  ["xi",11],["xii",12],["xiii",13],["xiv",14],["xv",15],["xvi",16],["xvii",17],["xviii",18],["xix",19],["xx",20],
  ["xxi",21],["xxii",22],["xxiii",23],["xxiv",24],["xxv",25],["xxvi",26],["xxvii",27],["xxviii",28],["xxix",29],["xxx",30],
  ["xxxi",31],["xxxii",32],["xxxiii",33],["xxxiv",34],["xxxv",35],["xxxvi",36],["xxxvii",37],["xxxviii",38],["xxxix",39],["xl",40],
  ["xli",41],["xlii",42],["xliii",43],["xliv",44],["xlv",45],["xlvi",46],["xlvii",47],["xlviii",48],["xlix",49],["l",50],
]);

function parseNumberFromFilename(url) {
  const name = filenameFromUrl(url);
  if (!name) return null;

  // Leading number like 01_, 1-, 001 , 10. etc.
  const lead = name.match(/^(\d{1,4})[\s._-]/);
  if (lead) return parseInt(lead[1], 10);

  // Any standalone 1–3 digit token
  const token = name.match(/(?:^|[^\d])(\d{1,3})(?:[^\d]|$)/);
  if (token) return parseInt(token[1], 10);

  // Roman numerals (consider tokenized)
  const lower = name.toLowerCase();
  const roman = lower.match(/(?:^|[\s._-])(x{0,3}(ix|iv|v?i{0,3})|xl|l)(?=[\s._-]|$)/i);
  if (roman) {
    const r = roman[0].replace(/[^ivxl]/gi, "").toLowerCase();
    if (ROMAN_MAP.has(r)) return ROMAN_MAP.get(r);
  }

  return null;
}

function parseLines(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function BulkImageUrlMatcher({ deckId, onDone }) {
  const [cards, setCards] = React.useState([]);
  const [raw, setRaw] = React.useState("");
  // Modes:
  // - number_from_filename
  // - name_from_filename
  // - explicit_pairs (accept "number,url" or "name,url")
  // - sequential_by_number (map in order to cards sorted by number)
  // - sequential_by_name (map in order to cards sorted by name)
  const [mode, setMode] = React.useState("number_from_filename");
  const [startOffset, setStartOffset] = React.useState(0); // for sequential modes: start at index offset
  const [trimPrefix, setTrimPrefix] = React.useState("");  // remove from filename before name matching
  const [trimSuffix, setTrimSuffix] = React.useState("");  // remove from filename before name matching

  const [building, setBuilding] = React.useState(false);
  const [matches, setMatches] = React.useState([]);
  const [unmatched, setUnmatched] = React.useState([]);
  const [applying, setApplying] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0, message: "" });
  const [rehostAfter, setRehostAfter] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!deckId) return;
    base44.entities.Card.filter({ deck_id: deckId }).then((list) => {
      const sorted = [...list].sort((a, b) => {
        const na = a.number ?? 0;
        const nb = b.number ?? 0;
        if (na !== nb) return na - nb;
        return (a.name || "").localeCompare(b.name || "");
      });
      setCards(sorted);
    }).catch(() => setCards([]));
  }, [deckId]);

  const byNumber = React.useMemo(() => {
    const m = new Map();
    cards.forEach((c) => {
      if (typeof c.number === "number") m.set(c.number, c);
    });
    return m;
  }, [cards]);

  const byNameSlug = React.useMemo(() => {
    const m = new Map();
    cards.forEach((c) => m.set(slug(c.name), c));
    return m;
  }, [cards]);

  const cardsByNumberAsc = React.useMemo(() => {
    return [...cards].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }, [cards]);

  const cardsByNameAsc = React.useMemo(() => {
    return [...cards].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [cards]);

  const buildPreview = () => {
    setBuilding(true);
    setMessage("");
    const lines = parseLines(raw);
    const prepared = [];
    const misses = [];

    if (!lines.length) {
      setMatches([]);
      setUnmatched([]);
      setBuilding(false);
      setMessage("Paste URLs first, then click Preview.");
      return;
    }

    if (mode === "explicit_pairs") {
      // Accept: "12, https://..." or "Card Name, https://..." or tab-separated
      for (const line of lines) {
        const parts = line.split(/,|\t/).map((p) => p.trim()).filter(Boolean);
        if (parts.length < 2) {
          misses.push({ line, reason: "Expected 'key, url' or 'key<TAB>url'" });
          continue;
        }
        const key = parts[0];
        const url = parts.slice(1).join(" ");
        if (!/^https?:\/\//i.test(url)) {
          misses.push({ line, reason: "Invalid/missing URL" });
          continue;
        }
        // numeric key
        if (/^\d{1,4}$/.test(key)) {
          const num = parseInt(key, 10);
          const card = byNumber.get(num);
          if (!card) {
            misses.push({ line, reason: `No card with number ${num}` });
            continue;
          }
          prepared.push({ card, url });
          continue;
        }
        // name key
        const s = slug(key);
        const card = byNameSlug.get(s);
        if (!card) {
          misses.push({ line, reason: `No card with name similar to "${key}"` });
          continue;
        }
        prepared.push({ card, url });
      }
    } else if (mode === "number_from_filename") {
      for (const line of lines) {
        if (!/^https?:\/\//i.test(line)) {
          misses.push({ line, reason: "Not a URL" });
          continue;
        }
        const num = parseNumberFromFilename(line);
        if (!Number.isFinite(num)) {
          misses.push({ line, reason: "No number found in filename" });
          continue;
        }
        const card = byNumber.get(num);
        if (!card) {
          misses.push({ line, reason: `No card with number ${num}` });
          continue;
        }
        prepared.push({ card, url: line });
      }
    } else if (mode === "name_from_filename") {
      for (const line of lines) {
        if (!/^https?:\/\//i.test(line)) {
          misses.push({ line, reason: "Not a URL" });
          continue;
        }
        let base = filenameFromUrl(line);
        if (trimPrefix && base.startsWith(trimPrefix)) base = base.slice(trimPrefix.length);
        if (trimSuffix && base.endsWith(trimSuffix)) base = base.slice(0, -trimSuffix.length);
        const s = slug(base);
        const card = byNameSlug.get(s);
        if (!card) {
          misses.push({ line, reason: `No card with name like "${normalizeForName(base)}"` });
          continue;
        }
        prepared.push({ card, url: line });
      }
    } else if (mode === "sequential_by_number" || mode === "sequential_by_name") {
      const urls = lines.filter((l) => /^https?:\/\//i.test(l));
      const list = mode === "sequential_by_number" ? cardsByNumberAsc : cardsByNameAsc;
      const start = Math.max(0, parseInt(startOffset, 10) || 0);
      let i = 0;
      for (const url of urls) {
        const card = list[start + i];
        if (!card) {
          misses.push({ line: url, reason: "Ran out of cards to map; adjust Start offset" });
          continue;
        }
        prepared.push({ card, url });
        i += 1;
      }
    }

    // collapse duplicates (prefer last entry per card)
    const byCardId = new Map();
    prepared.forEach((p) => byCardId.set(p.card.id, p));
    const final = Array.from(byCardId.values());

    setMatches(final.map((m) => ({
      card_id: m.card.id,
      card_name: m.card.name,
      number: m.card.number,
      current_url: m.card.image_url || "",
      new_url: m.url,
    })));
    setUnmatched(misses);
    setBuilding(false);
  };

  const apply = async () => {
    if (!matches.length) {
      setMessage("Nothing to apply. Click Preview first.");
      return;
    }
    setApplying(true);
    setProgress({ current: 0, total: matches.length, message: "Updating cards..." });
    let done = 0;
    for (const m of matches) {
      await base44.entities.Card.update(m.card_id, { image_url: m.new_url });
      done += 1;
      setProgress({ current: done, total: matches.length, message: `Updated ${done}/${matches.length}` });
      await sleep(120); // small delay to avoid rate limits
    }
    if (rehostAfter) {
      setProgress((p) => ({ ...p, message: "Rehosting updated images..." }));
      try {
        await base44.functions.invoke("rehostDeckImages", { deckId });
      } catch (e) {
        // non-fatal
        console.warn("Rehost failed:", e?.message || e);
      }
    }
    setApplying(false);
    setMessage("Done! Images updated.");
    if (onDone) onDone();
  };

  return (
    <div className="space-y-4">
      <UICard className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <ImageIcon className="w-5 h-5 text-purple-300" />
            Bulk Image URL Matcher
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3">
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste your image URLs here (one per line), or pairs like:
12, https://example.com/12.jpg
The Fool, https://example.com/fool.jpg"
              className="min-h-[180px] bg-black/40 border-white/20 text-white"
            />
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70">Matching Mode</label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="bg-black/40 border-white/20 text-white">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 text-white border-gray-700">
                    <SelectItem value="number_from_filename">Number from filename</SelectItem>
                    <SelectItem value="name_from_filename">Name from filename</SelectItem>
                    <SelectItem value="explicit_pairs">Explicit pairs (number/name, URL)</SelectItem>
                    <SelectItem value="sequential_by_number">Sequential → cards sorted by number</SelectItem>
                    <SelectItem value="sequential_by_name">Sequential → cards sorted by name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(mode === "sequential_by_number" || mode === "sequential_by_name") && (
                <div>
                  <label className="text-xs text-white/70">Start at card index (0-based)</label>
                  <Input
                    type="number"
                    min={0}
                    value={startOffset}
                    onChange={(e) => setStartOffset(e.target.value)}
                    className="bg-black/40 border-white/20 text-white"
                  />
                </div>
              )}

              {mode === "name_from_filename" && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-white/70">Trim prefix (optional)</label>
                    <Input
                      value={trimPrefix}
                      onChange={(e) => setTrimPrefix(e.target.value)}
                      placeholder="e.g., MyDeck_"
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Trim suffix (optional)</label>
                    <Input
                      value={trimSuffix}
                      onChange={(e) => setTrimSuffix(e.target.value)}
                      placeholder="e.g., _final"
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>
                </div>
              )}

              <Button onClick={buildPreview} disabled={building} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                {building ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preview</> : "Preview Matching"}
              </Button>
              {message && <p className="text-xs text-white/70">{message}</p>}
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 border border-white/10 rounded-md">
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-sm text-white/90">Matches ({matches.length})</span>
              </div>
              <ScrollArea className="max-h-64">
                <div className="p-3 space-y-2 text-sm">
                  {matches.map((m) => (
                    <div key={m.card_id} className="flex items-start gap-2">
                      <Badge className="bg-purple-700/40 border border-purple-500/30">
                        <Hash className="w-3 h-3 mr-1" /> {m.number ?? "—"}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-white">{m.card_name}</div>
                        <div className="text-xs text-white/70 break-all">
                          <span className="inline-flex items-center gap-1"><LinkIcon className="w-3 h-3" />{m.new_url}</span>
                        </div>
                        {m.current_url && m.current_url !== m.new_url && (
                          <div className="text-[10px] text-white/50 truncate">
                            was: {m.current_url}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!matches.length && <div className="text-white/60">No matches yet.</div>}
                </div>
              </ScrollArea>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-md">
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span className="text-sm text-white/90">Unmatched / Issues ({unmatched.length})</span>
              </div>
              <ScrollArea className="max-h-64">
                <div className="p-3 space-y-2 text-sm">
                  {unmatched.map((u, idx) => (
                    <div key={idx} className="text-amber-200">
                      • {u.reason}: <span className="text-white/80 break-all">{u.line}</span>
                    </div>
                  ))}
                  {!unmatched.length && <div className="text-white/60">No issues.</div>}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                className="accent-purple-500"
                checked={rehostAfter}
                onChange={(e) => setRehostAfter(e.target.checked)}
              />
              Rehost updated images to app storage after saving
            </label>
            <Button onClick={apply} disabled={applying || !matches.length} className="bg-emerald-600 hover:bg-emerald-700">
              {applying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying…</> : "Apply to Cards"}
            </Button>
          </div>
        </CardContent>
      </UICard>

      <div className="text-xs text-white/60">
        Tips:
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>For iPhone camera roll names (e.g., IMG_0947.JPG), use Sequential modes and set Start offset so the first URL aligns to your first card.</li>
          <li>If filenames include deck prefixes, use Name from filename and trim the common prefix/suffix so names match.</li>
          <li>Explicit pairs accept either number or exact card name on the left, followed by a comma and the URL.</li>
          <li>Roman numerals in filenames are supported (I, II, …, X, …, L).</li>
        </ul>
      </div>
    </div>
  );
}
