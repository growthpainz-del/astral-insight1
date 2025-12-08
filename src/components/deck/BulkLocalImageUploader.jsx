
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card as CardEntity } from "@/entities/Card";
import { Deck } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Link as LinkIcon, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { retryAsync } from "@/components/utils/retry";
import { safeUploadFile } from "@/components/utils/safeUpload";
import { ocrCardImageFromFile } from "@/components/utils/cardOcr";

function isValidFile(f) {
  if (!f || typeof f !== "object") return false;
  const looksLikeBlob = typeof f.arrayBuffer === "function" || typeof f.stream === "function" || typeof f.slice === "function";
  return (typeof File !== "undefined" && f instanceof File) || looksLikeBlob;
}

function normalizeName(s) {
  if (!s) return "";
  const decoded = decodeURIComponent(s);
  return decoded
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase();
}
function stripNumericPrefix(s) {
  return (s || "").replace(/^\d+[\s_\-\.]*/, "");
}
function stripNonAlnum(s) {
  return (s || "").replace(/[^a-z0-9]/g, "");
}

function levenshtein(a = "", b = "") {
  a = String(a);
  b = String(b);
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 1; j <= n; j++) dp[0][j] = j; // Corrected: j=1 to n, not m

  for (let i = 1; i <= m; i++) {
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cb = b.charCodeAt(j - 1);
      const cost = ca === cb ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function extractNumberFromFilename(filename = "") {
  const stem = String(filename).toLowerCase().replace(/\.[a-z0-9]+$/i, "");
  const patterns = [
    /(?:^|\b)no\.?\s*[_\-:\s]?(\d{1,3})\b/,
    /^(\d{1,3})[a-z]\b/,
    /^(\d{1,3})\s*[-_.( ]\s*(?:\d{1,3}|[a-z])\b/,
    /^(\d{1,3})\b/
  ];
  for (const rx of patterns) {
    const m = stem.match(rx);
    if (m) {
      const n = parseInt(m[1].replace(/^0+/, "") || "0", 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  const groups = stem.match(/\d{1,3}/g);
  if (groups && groups.length) {
    let candidate = null;
    for (const raw of groups) {
      const normalized = raw.replace(/^0+/, "");
      if (normalized !== "" && normalized !== "0") {
        candidate = parseInt(normalized, 10);
      }
    }
    if (Number.isFinite(candidate)) return candidate;
    const first = parseInt(groups[0], 10);
    if (Number.isFinite(first)) return first;
  }
  return null;
}

export default function BulkLocalImageUploader({ deckId, isOpen, onClose, onImportComplete }) {
  const [files, setFiles] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [cards, setCards] = React.useState([]);
  const [matches, setMatches] = React.useState([]);
  const [unmatched, setUnmatched] = React.useState([]);
  const [isMatching, setIsMatching] = React.useState(false);
  const [matchProgress, setMatchProgress] = React.useState({ current: 0, total: 0, phase: "" }); // NEW: matching progress
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [summary, setSummary] = React.useState(null);
  const [removeBg, setRemoveBg] = React.useState(false);
  const [preferOcr, setPreferOcr] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setRows([]);
      setCards([]);
      setMatches([]);
      setUnmatched([]);
      setIsMatching(false);
      setMatchProgress({ current: 0, total: 0, phase: "" });
      setIsUploading(false);
      setProgress(0);
      setSummary(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!deckId) return;
    Deck.get(deckId).then(d => setRemoveBg(!!d.auto_remove_bg)).catch(() => {});
  }, [deckId]);

  const onPickFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    setFiles(arr);
    const mapped = arr.map((f) => {
      const name = f.name || "";
      const base = normalizeName(name);
      const baseNoNum = normalizeName(stripNumericPrefix(name));
      const keyTight = stripNonAlnum(base);
      const keyTightNoNum = stripNonAlnum(baseNoNum);
      const matchKeys = Array.from(new Set([base, baseNoNum, keyTight, keyTightNoNum])).filter(Boolean);
      return {
        file: f,
        fileNameRaw: name,
        matchKeys,
      };
    });
    setRows(mapped);
  };

  const runMatch = async () => {
    if (!deckId || rows.length === 0) return;
    setIsMatching(true);
    setMatchProgress({ current: 0, total: 5, phase: "Loading cards..." }); // 5 phases total for filename-based, OCR will have dynamic total

    const deckCards = await CardEntity.filter({ deck_id: deckId });
    setCards(deckCards);
    setMatchProgress({ current: 1, total: 5, phase: "Building indexes..." });

    const cardIndex = new Map();
    const fuzzyIndex = [];
    const numberIndex = new Map();
    const addKey = (k, c) => {
      if (!k) return;
      if (!cardIndex.has(k)) cardIndex.set(k, c);
      fuzzyIndex.push({ key: k, card: c });
    };

    deckCards.forEach((c) => {
      const n1 = normalizeName(c.name);
      const n2 = stripNonAlnum(n1);
      const n3 = normalizeName(stripNumericPrefix(c.name));
      const n4 = stripNonAlnum(n3);
      Array.from(new Set([n1, n2, n3, n4])).forEach((k) => addKey(k, c));
      if (c.number !== undefined && c.number !== null && c.number !== "") {
        const num = Number(c.number);
        if (Number.isFinite(num) && !numberIndex.has(num)) numberIndex.set(num, c);
      }
    });

    const matchedUrls = new Set();
    const matchedCardIds = new Set();

    // If preferOcr is enabled, skip filename matching and use OCR exclusively
    if (preferOcr) {
      const ocrMatches = [];
      const ocrUnmatched = [];
      
      const ocrTotalSteps = rows.length + 2; // +1 for start, +1 for end
      setMatchProgress({ current: 1, total: ocrTotalSteps, phase: "Reading images with OCR..." });

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        setMatchProgress({ current: i + 2, total: ocrTotalSteps, phase: `OCR: ${r.fileNameRaw}...` });
        
        try {
          const ocrResult = await ocrCardImageFromFile(r.file);
          
          let matchedCard = null;
          
          // Try matching by number first from OCR result
          if (ocrResult.number !== null && numberIndex.has(ocrResult.number) && !matchedCardIds.has(numberIndex.get(ocrResult.number).id)) {
            matchedCard = numberIndex.get(ocrResult.number);
          }
          
          // Try matching by name from OCR result if not matched by number
          if (!matchedCard && ocrResult.name) {
            const ocrName = normalizeName(ocrResult.name);
            
            // Exact match from OCR name
            const exactMatchCandidate = cardIndex.get(ocrName);
            if (exactMatchCandidate && !matchedCardIds.has(exactMatchCandidate.id)) {
              matchedCard = exactMatchCandidate;
            }
            
            // Fuzzy match from OCR name if exact fails
            if (!matchedCard) {
              let best = { card: null, distance: Infinity, key: "" };
              for (const { key, card } of fuzzyIndex) {
                if (matchedCardIds.has(card.id)) continue;
                const d = levenshtein(ocrName, key);
                if (d < best.distance) {
                  best = { card, distance: d, key: key };
                  if (d === 0) break;
                }
              }
              const len = Math.max(ocrName.length, best.key?.length || 0);
              const maxAllowed = len <= 5 ? 1 : len <= 9 ? 2 : 3;
              if (best.card && best.distance <= maxAllowed) {
                matchedCard = best.card;
              }
            }
          }
          
          if (matchedCard && !matchedCardIds.has(matchedCard.id)) { // Double-check against matchedCardIds
            ocrMatches.push({
              file: r.file,
              fileNameRaw: r.fileNameRaw,
              card: matchedCard,
              status: "pending",
              matchType: "ocr",
              distance: 0,
              ocrResult // Store OCR result for file_url in upload step
            });
            matchedCardIds.add(matchedCard.id);
            matchedUrls.add(r.fileNameRaw);
          } else {
            ocrUnmatched.push(r);
          }
        } catch (err) {
          console.error("OCR failed for", r.fileNameRaw, err);
          ocrUnmatched.push(r);
        }
      }

      setMatches(ocrMatches);
      setUnmatched(ocrUnmatched);
      setMatchProgress({ current: ocrTotalSteps, total: ocrTotalSteps, phase: "OCR matching complete!" });
      setIsMatching(false);
      return;
    }

    // Original filename-based matching logic (when preferOcr is false)

    // Pass 0: number-based matches first
    setMatchProgress({ current: 2, total: 5, phase: "Matching by card numbers..." });
    const byNumber = [];
    const remainingAfterNumber = [];
    rows.forEach((r) => {
      const num = extractNumberFromFilename(r.fileNameRaw);
      if (num !== null && numberIndex.has(num)) {
        const card = numberIndex.get(num);
        if (!matchedCardIds.has(card.id)) {
          byNumber.push({
            file: r.file,
            fileNameRaw: r.fileNameRaw,
            card,
            status: "pending",
            matchType: "number",
            distance: 0
          });
          matchedUrls.add(r.fileNameRaw);
          matchedCardIds.add(card.id);
        } else {
          remainingAfterNumber.push(r);
        }
      } else {
        remainingAfterNumber.push(r);
      }
    });

    // Pass 1: exact/normalized name matches
    setMatchProgress({ current: 3, total: 5, phase: "Matching by card names..." });
    const exact = [];
    const stillUnmatched = [];
    remainingAfterNumber.forEach((r) => {
      let matchedCard = null;
      for (const k of (r.matchKeys || [])) {
        const candidate = cardIndex.get(k);
        if (candidate && !matchedCardIds.has(candidate.id)) {
          matchedCard = candidate;
          break;
        }
      }
      if (matchedCard) {
        exact.push({ file: r.file, fileNameRaw: r.fileNameRaw, card: matchedCard, status: "pending", matchType: "exact" });
        matchedCardIds.add(matchedCard.id);
        matchedUrls.add(r.fileNameRaw);
      } else {
        stillUnmatched.push(r);
      }
    });

    // Pass 2: fuzzy name matches
    setMatchProgress({ current: 4, total: 5, phase: "Fuzzy matching remaining files..." });
    const fuzzy = [];
    stillUnmatched.forEach((r) => {
      let best = { card: null, distance: Infinity, key: "", rowKey: "" };
      const rowKeys = (r.matchKeys || []).filter(Boolean);
      for (const rk of rowKeys) {
        for (const { key, card } of fuzzyIndex) {
          if (matchedCardIds.has(card.id)) continue;
          const d = levenshtein(rk, key);
          if (d < best.distance) {
            best = { card, distance: d, key, rowKey: rk };
            if (d === 0) break;
          }
        }
      }
      if (best.card) {
        const len = Math.max(best.key.length, best.rowKey.length);
        const maxAllowed = len <= 5 ? 1 : len <= 9 ? 2 : 3;
        if (best.distance > 0 && best.distance <= maxAllowed) {
          fuzzy.push({
            file: r.file,
            fileNameRaw: r.fileNameRaw,
            card: best.card,
            status: "pending",
            matchType: "fuzzy",
            distance: best.distance,
          });
          matchedCardIds.add(best.card.id);
          matchedUrls.add(r.fileNameRaw);
        }
      }
    });

    const notFound = rows.filter(u => !matchedUrls.has(u.fileNameRaw));

    setMatchProgress({ current: 5, total: 5, phase: "Matching complete!" });
    setMatches([...byNumber, ...exact, ...fuzzy]);
    setUnmatched(notFound);
    setIsMatching(false);
  };

  const uploadAndApply = async () => {
    if (matches.length === 0) return;
    setIsUploading(true);
    setProgress(0);
    setSummary(null);

    let updated = 0;
    let failed = 0;
    const failures = [];

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      try {
        if (!isValidFile(m.file)) {
          throw new Error("Invalid file selected or file data corrupted.");
        }
        
        let file_url;

        // If the match was made via OCR and it already pre-uploaded the file, use that URL
        if (m.matchType === "ocr" && m.ocrResult?.file_url) {
          file_url = m.ocrResult.file_url;
        } else {
          // Otherwise, upload the file now
          file_url = await safeUploadFile(m.file);
        }

        // Background removal logic
        if (removeBg && file_url) {
          try {
            const { data } = await base44.functions.invoke('removeBackground', { image_url: file_url });
            if (data?.status === 'ok' && data?.file_url) {
              file_url = data.file_url;
            } else if (data?.status === 'error') {
              console.warn("Background removal failed for", m.fileNameRaw, ":", data.message);
            }
          } catch (bgRemoveError) {
            console.error("Error invoking background removal for", m.fileNameRaw, ":", bgRemoveError);
          }
        }

        await retryAsync(() => CardEntity.update(m.card.id, { image_url: file_url }), 3, 500);
        updated += 1;
        matches[i].status = "updated";
      } catch (e) {
        failed += 1;
        matches[i].status = "failed";
        failures.push(`${m.card?.name || "Unknown card"}: ${e.message || "Upload error"}`);
      }
      setProgress(Math.round(((i + 1) / matches.length) * 100));
      await new Promise(r => setTimeout(r, 30));
    }

    setMatches([...matches]);
    setSummary({ total: matches.length, updated, failed, failures });
    setIsUploading(false);
    if (onImportComplete) onImportComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ImagePlus className="w-5 h-5 mr-1 text-pink-300" />
            Bulk Local Images → Auto‑match & Upload
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex-1">
          <div className="space-y-2">
            <p className="text-sm text-white/70">
              Select multiple image files. We'll match each filename to a card's name (case-insensitive; handles spaces, camelCase, and minor spelling errors).
              Also tries to match numbers in filenames to card numbers.
            </p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
              className="block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-600/80 file:text-white hover:file:bg-purple-600"
            />
            
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input 
                type="checkbox" 
                checked={removeBg} 
                onChange={(e) => setRemoveBg(e.target.checked)} 
                className="form-checkbox h-4 w-4 text-purple-600 rounded bg-gray-700 border-gray-600 focus:ring-purple-500" 
              />
              Remove background on upload (may take longer)
            </label>
            
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input 
                type="checkbox" 
                checked={preferOcr} 
                onChange={(e) => setPreferOcr(e.target.checked)} 
                disabled={isMatching || isUploading}
                className="form-checkbox h-4 w-4 text-cyan-600 rounded bg-gray-700 border-gray-600 focus:ring-cyan-500" 
              />
              <div>
                <div>Read card numbers directly from images (ignore filenames)</div>
                <div className="text-xs text-white/60 mt-0.5">
                  When enabled, uses OCR to read the card title/number printed on the image instead of parsing filenames. Slower but more accurate for images with generic filenames.
                </div>
              </div>
            </label>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={runMatch}
                disabled={rows.length === 0 || isMatching}
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/20"
              >
                {isMatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                Match to Cards
              </Button>
              <Button
                onClick={uploadAndApply}
                disabled={matches.length === 0 || isUploading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Upload & Apply ({matches.length})
              </Button>
            </div>
          </div>

          {/* NEW: Matching progress display */}
          {isMatching && (
            <div className="space-y-2 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">{matchProgress.phase}</span>
              </div>
              <Progress 
                value={matchProgress.total > 0 ? Math.round((matchProgress.current / matchProgress.total) * 100) : 0} 
                className="h-2"
              />
              <div className="text-xs text-blue-200/70">
                {matchProgress.current} / {matchProgress.total}
              </div>
            </div>
          )}

          {(matches.length > 0 || unmatched.length > 0) && (
            <div className="space-y-3">
              <div className="text-sm text-white/80">
                Matches: <Badge className="bg-emerald-700/50">{matches.length}</Badge> • Unmatched: <Badge className="bg-red-700/40">{unmatched.length}</Badge>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <div className="text-xs text-white/60">{progress}%</div>
                </div>
              )}

              {matches.length > 0 && (
                <ScrollArea className="max-h-40 rounded-lg border border-white/10">
                  <div className="p-3 space-y-2">
                    {matches.slice(0, 30).map((m, idx) => (
                      <div key={idx} className="bg-white/5 rounded p-2 text-xs flex items-center justify-between gap-3">
                        <div className="truncate">
                          <span className="text-white/80">{m.card?.name}</span>
                          <span className="text-white/50"> ← </span>
                          <span className="text-white/70">{m.fileNameRaw}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.matchType === "number" && (
                            <Badge className="bg-indigo-700/60">number</Badge>
                          )}
                          {m.matchType === "fuzzy" && (
                            <Badge className="bg-amber-700/60">fuzzy</Badge>
                          )}
                          {m.matchType === "ocr" && (
                            <Badge className="bg-cyan-700/60">OCR</Badge>
                          )}
                          <Badge className={
                            m.status === "updated" ? "bg-emerald-700/60" :
                            m.status === "failed" ? "bg-red-700/60" : "bg-white/10"
                          }>
                            {m.status || "pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {matches.length > 30 && (
                      <div className="text-center text-white/60 text-xs">+{matches.length - 30} more…</div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {unmatched.length > 0 && (
                <div className="rounded-lg border border-red-500/30 p-3 bg-red-900/10">
                  <div className="text-sm text-red-200 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    {unmatched.length} file(s) didn't match any card name
                  </div>
                  <ScrollArea className="max-h-28">
                    <ul className="list-disc list-inside text-xs text-white/80 space-y-1">
                      {unmatched.slice(0, 30).map((u, i) => (
                        <li key={i}>{u.fileNameRaw}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {summary && (
                <div className="mt-2 text-sm">
                  <div className="text-white/80">Done.</div>
                  <div className="text-white/70">Updated: {summary.updated}</div>
                  <div className="text-white/70">Failed: {summary.failed}</div>
                  {summary.failures?.length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-white/70">Show errors</summary>
                      <ul className="list-disc ml-5 text-red-300">
                        {summary.failures.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
