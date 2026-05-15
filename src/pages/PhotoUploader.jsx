import React, { useState } from "react";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Image as ImageIcon, Upload, Copy, Check, Loader2, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Deck } from "@/entities/Deck";
import { Card as CardEntity } from "@/entities/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2 } from "lucide-react";

export default function PhotoUploader() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]); // [{name, url}]
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // decks and association
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  // post-upload match options
  const [matchMode, setMatchMode] = useState("none"); // none | number | name
  const [matching, setMatching] = useState(false);
  const [matchSummary, setMatchSummary] = useState(null);

  // add a small helper near the top of the component file
  const isValidFile = (f) => {
    if (!f || typeof f !== "object") return false;
    // accept File or Blob-like
    const looksLikeBlob = typeof f.arrayBuffer === "function" || typeof f.stream === "function" || typeof f.slice === "function";
    return (typeof File !== "undefined" && f instanceof File) || looksLikeBlob;
  };

  // helpers
  const normalizeName = (s = "") =>
    decodeURIComponent(String(s))
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const stripNumericPrefix = (s = "") => String(s).replace(/^\d+[\s_\-\.]*/, "");
  const stripNonAlnum = (s = "") => String(s).replace(/[^a-z0-9]/g, "");
  const levenshtein = (a = "", b = "") => {
    a = String(a); b = String(b);
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
      }
    }
    return dp[m][n];
  };
  const extractNumberFromFilename = (name = "") => {
    const m = String(name).match(/(\d{1,3})/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? n : null;
  };

  // load decks once
  React.useEffect(() => {
    (async () => {
      const all = await Deck.list("name", 200);
      setDecks(all || []);
      // If there's only one deck, pre-select it
      if (all && all.length === 1) {
        setSelectedDeckId(all[0].id);
      }
    })();
  }, []);

  // NEW: Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone itself
    // Check if the relatedTarget is null or outside the currentTarget
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError("Please drop image files only.");
      return;
    }

    setFiles(imageFiles);
    setError("");
    setMatchSummary(null);
  };

  const onSelectFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked);
    setError("");
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError("Please select at least one image file.");
      return;
    }
    // filter out invalid entries early
    const validFiles = files.filter(isValidFile);
    if (validFiles.length === 0) {
      setError("Selected files are not valid image files. Please re-select.");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError("");
    setResults([]);
    setMatchSummary(null); // Reset match summary on new upload
    try {
      const out = [];
      for (let i = 0; i < validFiles.length; i++) {
        const f = validFiles[i];
        // Upload sequentially (more predictable, friendlier to rate limits)
        const { file_url } = await UploadFile({ file: f });

        // infer metadata
        const inferredNumber = extractNumberFromFilename(f.name);
        const inferredName = normalizeName(stripNumericPrefix(f.name));

        // save asset record
        await base44.entities.UploadAsset.create({
          file_url,
          file_name: f.name,
          mime_type: f.type || "",
          size: f.size || 0,
          linked_deck_id: selectedDeckId || undefined,
          card_number: inferredNumber || undefined,
          card_name: inferredName || undefined,
          tags: selectedDeckId ? ["deck:" + selectedDeckId] : []
        });

        out.push({ name: f.name || `image_${i+1}`, url: file_url });
        setResults([...out]);
        setProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }
    } catch (e) {
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const copyUrl = async (url, idx) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch {
      // ignore copy errors
    }
  };

  // NEW: after-upload bulk match function
  const assignAndMatch = async () => {
    if (!selectedDeckId || matchMode === "none" || results.length === 0) return;
    setMatching(true);
    setMatchSummary(null);
    try {
      const deckCards = await CardEntity.filter({ deck_id: selectedDeckId });
      const indexByNumber = new Map(deckCards.map(c => [Number(c.number), c]));
      // build name indices
      const cardIndex = new Map();
      const fuzzyIndex = [];
      const addKey = (k, c) => { if (!k) return; if (!cardIndex.has(k)) cardIndex.set(k, c); fuzzyIndex.push({ key: k, card: c }); };
      deckCards.forEach(c => {
        const n1 = normalizeName(c.name);
        const n2 = stripNonAlnum(n1);
        const n3 = normalizeName(stripNumericPrefix(c.name));
        const n4 = stripNonAlnum(n3);
        Array.from(new Set([n1, n2, n3, n4])).forEach(k => addKey(k, c));
      });

      let updated = 0, failed = 0, skipped = 0;
      for (const r of results) {
        let target = null;
        if (matchMode === "number") {
          const num = extractNumberFromFilename(r.name) ?? extractNumberFromFilename(r.url);
          target = num != null ? indexByNumber.get(Number(num)) : null;
        } else if (matchMode === "name") {
          const keys = Array.from(new Set([
            normalizeName(stripNumericPrefix(r.name)),
            stripNonAlnum(normalizeName(stripNumericPrefix(r.name)))
          ])).filter(Boolean);
          // exact pass
          for (const k of keys) {
            const c = cardIndex.get(k);
            if (c) { target = c; break; }
          }
          // fuzzy pass
          if (!target) {
            let best = { card: null, distance: Infinity, key: "", rowKey: "" };
            for (const rk of keys) {
              for (const { key, card } of fuzzyIndex) {
                const d = levenshtein(rk, key);
                if (d < best.distance) { best = { card, distance: d, key, rowKey: rk }; if (d === 0) break; }
              }
            }
            if (best.card) {
              const len = Math.max(best.key.length, best.rowKey.length);
              const maxAllowed = len <= 5 ? 1 : len <= 9 ? 2 : 3;
              if (best.distance > 0 && best.distance <= maxAllowed) target = best.card;
            }
          }
        }
        if (!target) { skipped += 1; continue; }
        try {
          await CardEntity.update(target.id, { image_url: r.url });
          updated += 1;
        } catch (e) {
          failed += 1;
        }
        // also backfill asset -> linked_card_id if we can find it
        try {
          const inferredNumber = extractNumberFromFilename(r.name);
          const inferredName = normalizeName(stripNumericPrefix(r.name));
          // best-effort update matching UploadAsset by url
          const maybe = await base44.entities.UploadAsset.filter({ file_url: r.url }, "-created_date", 1);
          if (Array.isArray(maybe) && maybe[0]) {
            await base44.entities.UploadAsset.update(maybe[0].id, {
              linked_deck_id: selectedDeckId,
              linked_card_id: target.id,
              card_number: inferredNumber || undefined,
              card_name: inferredName || undefined
            });
          }
        } catch (e) {
          // non-fatal
        }
      }
      setMatchSummary({ updated, failed, skipped, total: results.length });
    } catch (e) {
      setError("Matching failed: " + (e?.message || "unknown error"));
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-transparent">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 border border-white/20">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Photo Uploader</h1>
            <p className="text-white/70 text-sm">
              Upload images to Base44 storage and get permanent URLs for your cards and decks.
            </p>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5 space-y-4">
            {/* NEW: Drag and Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                ${isDragging
                  ? 'border-purple-500 bg-purple-500/20 scale-[1.02]'
                  : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                }
              `}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onSelectFiles}
                className="hidden"
                id="file-input"
                disabled={isUploading}
              />

              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-all ${isDragging ? 'text-purple-400 scale-110' : 'text-white/60'}`} />
                <p className="text-white font-semibold mb-2 text-lg">
                  {isDragging ? '📂 Drop your images here' : '🖼️ Drag & drop images here'}
                </p>
                <p className="text-white/60 text-sm mb-3">
                  or click to browse your files
                </p>
                <div className="inline-block">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                    disabled={isUploading}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Select Files
                  </Button>
                </div>
              </label>

              {files.length > 0 && !isUploading && (
                <div className="mt-4 text-sm text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Association and matching options */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white">Associate uploads to deck</Label>
                <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                  <SelectTrigger className="bg-slate-900 border-white/10 text-white">
                    <SelectValue placeholder="No deck selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.length === 0 && <SelectItem value={null} disabled>No decks available</SelectItem>}
                    {decks.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/60">Selecting a deck helps you find these images later and enables auto-matching.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white">After upload: matching</Label>
                <RadioGroup value={matchMode} onValueChange={setMatchMode} className="grid grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="m-none" value="none" />
                    <Label htmlFor="m-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="m-number" value="number" disabled={!selectedDeckId} />
                    <Label htmlFor="m-number">By number</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="m-name" value="name" disabled={!selectedDeckId} />
                    <Label htmlFor="m-name">By name</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-white/60">Match by first number in filename (e.g., 14-The-Fool.jpg) or by name (fuzzy).</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!files.length || isUploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? "Uploading..." : `Upload ${files.length ? `(${files.length})` : ""}`}
              </Button>
              {isUploading && (
                <div className="flex-1 flex items-center gap-3">
                  <Progress value={progress} className="w-full" />
                  <span className="text-sm text-white/70 w-12 text-right">{progress}%</span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 rounded p-2">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-3">
            {/* INSERT UI: “Apply matching now” button under results list */}
            {selectedDeckId && matchMode !== "none" && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={assignAndMatch}
                  disabled={matching || isUploading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {matching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Apply matching to {results.length} image{results.length > 1 ? "s" : ""}
                </Button>
                {matchSummary && (
                  <div className="text-sm text-white/80">
                    Updated {matchSummary.updated} • Skipped {matchSummary.skipped} • Failed {matchSummary.failed}
                  </div>
                )}
              </div>
            )}

            <h2 className="text-lg font-semibold text-white">Uploaded Files</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r, idx) => (
                <div key={`${r.url}-${idx}`} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  {r.url ? (
                    <img
                      src={r.url}
                      alt={r.name}
                      className="w-full h-40 object-cover bg-black/40"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-black/40 text-white/60">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-white/90 truncate" title={r.name}>{r.name}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={r.url}
                        className="bg-slate-900 border-white/10 text-white text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => copyUrl(r.url, idx)}
                        title="Copy URL"
                      >
                        {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center text-xs text-white/60 gap-1">
                      <LinkIcon className="w-3 h-3" />
                      <span>Use this URL in your card’s Image URL</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}