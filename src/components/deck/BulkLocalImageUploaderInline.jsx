
import React from "react";
import { Card as CardEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ocrCardImageFromFile } from "@/components/utils/cardOcr";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Images, Upload, Loader2, AlertCircle, CheckCircle2, FolderOpen, LogIn, XCircle, X } from "lucide-react";
import { User } from "@/entities/User";
import { queueApiCall } from "@/components/utils/apiQueue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

function sanitizeName(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^[\s._-]*\d+[\s._-]*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseNumberFromFilename(name) {
  if (!name) return null;
  const base = name.toString();
  const m1 = base.match(/^\s*(\d{1,3})[.\-\s_]+/);
  if (m1) return Number(m1[1]);
  const m2 = base.match(/(^|[^\d])(\d{1,3})($|[^\d])/);
  if (m2) return Number(m2[2]);
  return null;
}

function stripArticles(s) {
  return String(s || "").replace(/^(the|a|an)\s+/i, "").trim();
}

function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter || 1;
  return inter / union;
}

export default function BulkLocalImageUploaderInline({ deckId, onDone }) {
  const [cards, setCards] = React.useState([]);
  const [byNumber, setByNumber] = React.useState(new Map());
  const [byName, setByName] = React.useState(new Map());
  const [byPosition, setByPosition] = React.useState(new Map());
  const [files, setFiles] = React.useState([]);
  const [loadingCards, setLoadingCards] = React.useState(true);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0, message: "" });
  const [results, setResults] = React.useState({ success: 0, skipped: 0, failures: 0, unmatched: [], updated: [], failed: [] });
  const [createMissing, setCreateMissing] = React.useState(true);
  const [preferOcr, setPreferOcr] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  // NEW: Manual matching modal state
  // unmatchedModal: { file, fileName, ocr, fileIndex, resolve: Function }
  const [unmatchedModal, setUnmatchedModal] = React.useState(null); 
  const [selectedPosition, setSelectedPosition] = React.useState("");
  const [skipAllUnmatched, setSkipAllUnmatched] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        await User.me();
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
        setError("You must be logged in to upload images. Please log in and try again.");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const loadCards = React.useCallback(async () => {
    if (!isAuthenticated && !checkingAuth) {
      setLoadingCards(false);
      return;
    }
    try {
      setError("");
      setLoadingCards(true);
      
      const list = await queueApiCall(
        () => CardEntity.filter({ deck_id: deckId }),
        5,
        2000
      );
      
      const sorted = (list || []).sort((a, b) => {
        const an = a.number ?? 0;
        const bn = b.number ?? 0;
        if (an !== bn) return an - bn;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
      
      const nMap = new Map();
      const nmMap = new Map();
      const posMap = new Map();
      
      for (let i = 0; i < sorted.length; i++) {
        const c = sorted[i];
        const position = i + 1;
        
        if (c.number != null) nMap.set(Number(c.number), c);
        nmMap.set(sanitizeName(c.name), c);
        posMap.set(position, c);
      }
      
      setCards(sorted);
      setByNumber(nMap);
      setByName(nmMap);
      setByPosition(posMap);
      
      console.log(`✅ Loaded ${sorted.length} cards for deck ${deckId}`);
      console.log(`📊 Position index: cards 1-${sorted.length}`);
    } catch (e) {
      const errMsg = e?.message || "";
      if (errMsg.toLowerCase().includes("logged in") || errMsg.toLowerCase().includes("auth") || e?.response?.status === 401) {
        setError("Authentication error. Please log in and refresh the page.");
        setIsAuthenticated(false);
      } else {
        setError(`Failed to load cards: ${errMsg || "Please refresh the page"}`);
      }
    } finally {
      setLoadingCards(false);
    }
  }, [deckId, isAuthenticated, checkingAuth]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) {
        await loadCards();
      }
    })();
    return () => { mounted = false; };
  }, [loadCards]);

  const findFuzzyByName = (name) => {
    if (!name) return null;
    const key = sanitizeName(name);
    if (byName.has(key)) return byName.get(key);

    const noArticleKey = sanitizeName(stripArticles(name));
    if (byName.has(noArticleKey)) return byName.get(noArticleKey);

    const nameTokens = tokenize(name);
    let best = null;
    let bestScore = 0;
    for (const [nm, card] of byName.entries()) {
      const score = jaccard(nameTokens, tokenize(nm));
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (best && bestScore >= 0.55) return best;
    return null;
  };

  const onSelectFiles = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    setResults({ success: 0, skipped: 0, failures: 0, unmatched: [], updated: [], failed: [] });
    setError("");
    setSkipAllUnmatched(false); // Reset this when new files are selected
  };

  const handleManualMatch = async () => {
    if (!unmatchedModal || !selectedPosition) {
      if (unmatchedModal?.resolve) unmatchedModal.resolve({ type: 'skipped' });
      setUnmatchedModal(null);
      setSelectedPosition("");
      return;
    }

    const position = parseInt(selectedPosition, 10);
    const target = byPosition.get(position);
    
    if (!target) {
      alert(`Error: No card found at position ${position}`);
      if (unmatchedModal.resolve) unmatchedModal.resolve({ type: 'skipped' });
      setUnmatchedModal(null);
      setSelectedPosition("");
      return;
    }

    try {
      const imageUrl = unmatchedModal.ocr?.file_url;
      if (!imageUrl) {
        throw new Error("Missing image URL from OCR result for manual match.");
      }

      setProgress(prev => ({ 
        ...prev, 
        message: `🎯 Manually assigning "${unmatchedModal.fileName}" to position #${position}: "${target.name}"...` 
      }));

      await queueApiCall(
        () => CardEntity.update(target.id, { image_url: imageUrl }),
        5,
        2000
      );
      
      console.log(`✅ Manually matched "${unmatchedModal.fileName}" to card "${target.name}" (position ${position})`);

      if (unmatchedModal.resolve) {
        unmatchedModal.resolve({ 
          type: 'assigned',
          data: {
            cardName: target.name,
            cardNumber: target.number,
            position,
            fileName: unmatchedModal.fileName,
            url: imageUrl,
            matchedBy: 'manual'
          }
        });
      }
    } catch (updateError) {
      console.error(`Failed to update card ${target.name}:`, updateError);
      alert(`Failed to assign image: ${updateError.message || 'Unknown error'}`);
      if (unmatchedModal.resolve) {
        unmatchedModal.resolve({ 
          type: 'failed',
          data: {
            cardName: target.name,
            fileName: unmatchedModal.fileName,
            error: updateError.message || "Update failed"
          }
        });
      }
    } finally {
      setUnmatchedModal(null);
      setSelectedPosition("");
    }
  };

  const handleSkipUnmatched = () => {
    if (unmatchedModal?.resolve) {
      unmatchedModal.resolve({ 
        type: 'skipped',
        data: {
          file: unmatchedModal.fileName,
          guess: unmatchedModal.ocr?.name || null,
          number: unmatchedModal.ocr?.number ?? null,
          confidence: unmatchedModal.ocr?.confidence ?? null,
          reason: "Manually skipped by user"
        }
      });
    }
    setUnmatchedModal(null);
    setSelectedPosition("");
  };

  const startUpload = async () => {
    if (!files.length) return;

    if (!isAuthenticated) {
      setError("You must be logged in to upload images. Please log in and try again.");
      return;
    }

    setUploading(true);
    setResults({ success: 0, skipped: 0, failures: 0, unmatched: [], updated: [], failed: [] });
    setProgress({ current: 0, total: files.length, message: "Starting upload..." });

    let success = 0;
    let skipped = 0;
    let failures = 0;
    let newCardsCreated = 0;
    let existingCardsUpdated = 0;
    const unmatchedLocal = [];
    const updatedLocal = [];
    const failedLocal = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name || `file_${i + 1}`;
      setProgress({ current: i, total: files.length, message: `Processing ${fileName}...` });

      try {
        setProgress({ current: i, total: files.length, message: `📖 Reading card info from image: ${fileName}...` });
        const ocr = await ocrCardImageFromFile(file);
        
        console.log(`📊 OCR Result for ${fileName}:`, { 
          number: ocr?.number, 
          name: ocr?.name, 
          confidence: ocr?.confidence 
        });

        let target = null;
        let matchedBy = null;
        let modalOutcome = null;

        // FIXED: Match by filename number when preferOcr is FALSE
        if (!preferOcr) {
          // Extract number from FILENAME instead of OCR
          const filenameNumber = parseNumberFromFilename(fileName);
          console.log(`📁 Filename number extraction: "${fileName}" → ${filenameNumber}`);
          
          if (filenameNumber != null) {
            const position = Number(filenameNumber);
            if (byPosition.has(position)) {
              target = byPosition.get(position);
              matchedBy = 'filename';
              console.log(`✅ Matched by FILENAME: ${position} → Card "${target.name}" (card.number: ${target.number || 'null'})`);
            } else {
              console.log(`⚠️ No card found at position ${position} (deck has ${cards.length} cards)`);
            }
          } else {
            console.log(`⚠️ Could not extract number from filename: "${fileName}"`);
          }
        } else {
          // Use OCR number when preferOcr is TRUE
          if (ocr?.number != null) {
            const position = Number(ocr.number);
            if (byPosition.has(position)) {
              target = byPosition.get(position);
              matchedBy = 'position';
              console.log(`✅ Matched by OCR POSITION: ${position} → Card "${target.name}" (card.number: ${target.number || 'null'})`);
            } else {
              console.log(`⚠️ No card found at position ${position} (deck has ${cards.length} cards)`);
            }
          }
        }

        // Try fuzzy name match if no number match
        if (!target && ocr?.name) {
          target = findFuzzyByName(ocr.name);
          if (target) {
            matchedBy = 'name';
            console.log(`✅ Matched by NAME: "${ocr.name}" → Card "${target.name}"`);
          }
        }

        // --- Handle files that couldn't be automatically matched ---
        if (!target) {
          if (!createMissing && !skipAllUnmatched) {
            let resolveLoopPromise;
            const modalInteractionPromise = new Promise(resolve => {
              resolveLoopPromise = resolve;
            });

            setUnmatchedModal({ file, fileName, ocr, fileIndex: i, resolve: resolveLoopPromise });
            
            modalOutcome = await modalInteractionPromise;
          }
        }

        // --- Process the file based on automatic match or modal outcome ---
        if (target) {
          try {
            const positionInDeck = cards.findIndex(c => c.id === target.id) + 1;
            setProgress({ 
              current: i, 
              total: files.length, 
              message: `🎯 Updating card at position #${positionInDeck}: "${target.name}"...` 
            });
            
            await queueApiCall(
              () => CardEntity.update(target.id, { image_url: ocr.file_url }),
              5,
              2000
            );
            
            success++;
            existingCardsUpdated++;
            updatedLocal.push({ 
              cardName: target.name, 
              cardNumber: target.number,
              position: positionInDeck,
              fileName, 
              url: ocr.file_url,
              matchedBy
            });
            
            console.log(`✅ Updated card "${target.name}" (position ${positionInDeck}) with image from ${fileName}`);
            
          } catch (updateError) {
            console.error(`Failed to update card ${target.name}:`, updateError);
            failedLocal.push({ 
              cardName: target.name, 
              fileName, 
              error: updateError.message || "Update failed" 
            });
            failures++;
          }
        } else if (modalOutcome?.type === 'assigned') {
          success++;
          existingCardsUpdated++;
          updatedLocal.push(modalOutcome.data);
        } else if (modalOutcome?.type === 'failed') {
          failures++;
          failedLocal.push(modalOutcome.data);
        } else if (createMissing && ocr?.name && ocr?.file_url) {
          try {
            setProgress({ 
              current: i, 
              total: files.length, 
              message: `➕ Creating new card: ${ocr.name}...` 
            });
            
            const created = await queueApiCall(
              () => CardEntity.create({
                deck_id: deckId,
                name: stripArticles(ocr.name) || fileName.replace(/\.[^.]+$/, ""),
                // If OCR number is not finite, try to get it from the filename
                number: Number.isFinite(ocr?.number) ? ocr.number : parseNumberFromFilename(fileName),
                image_url: ocr.file_url
              }),
              5,
              2000
            );
            
            const newKey = sanitizeName(created.name);
            setByName(prev => new Map(prev).set(newKey, created));
            if (created.number != null) {
              setByNumber(prev => new Map(prev).set(Number(created.number), created));
            }
            
            success++;
            newCardsCreated++;
            updatedLocal.push({ 
              cardName: created.name, 
              cardNumber: created.number,
              fileName, 
              url: ocr.file_url, 
              isNew: true 
            });
            
            console.log(`✅ Created new card "${created.name}" from ${fileName}`);
            
          } catch (createError) {
            console.error(`Failed to create card for ${fileName}:`, createError);
            failedLocal.push({ 
              cardName: ocr.name || fileName, 
              fileName, 
              error: createError.message || "Create failed" 
            });
            failures++;
          }
        } else {
          const reason = modalOutcome?.type === 'skipped'
            ? "Manually skipped by user"
            : skipAllUnmatched
              ? "Skipped due to 'Skip All Unmatched'"
              : (!ocr?.number && !ocr?.name && !parseNumberFromFilename(fileName)) 
                ? "Could not read card info from image or filename" 
                : (preferOcr && ocr?.number && !byPosition.has(Number(ocr.number)))
                  ? `No card at position ${ocr.number} (deck has ${cards.length} cards)`
                  : (!preferOcr && parseNumberFromFilename(fileName) && !byPosition.has(Number(parseNumberFromFilename(fileName))))
                    ? `No card at position ${parseNumberFromFilename(fileName)} from filename (deck has ${cards.length} cards)`
                    : "No matching card found";

          unmatchedLocal.push({
            file: fileName,
            guess: ocr?.name || null,
            // Populate number based on preferOcr setting
            number: preferOcr ? (ocr?.number ?? null) : (parseNumberFromFilename(fileName) ?? null),
            confidence: ocr?.confidence ?? null,
            reason: reason
          });
          skipped++;
          console.log(`⏭️ Skipped ${fileName} - ${reason}`);
        }
      } catch (e) {
        console.error("Upload/OCR failed for", fileName, e);
        const errMsg = e?.message || "";

        if (errMsg.toLowerCase().includes("logged in") || errMsg.toLowerCase().includes("auth") || e?.response?.status === 401) {
          setError("Authentication error during upload. Please log in again and retry.");
          setIsAuthenticated(false);
          setUploading(false);
          return;
        }

        failedLocal.push({ cardName: "Unknown", fileName, error: errMsg || "Unknown error" });
        failures++;
      }

      setProgress({ current: i + 1, total: files.length, message: `Processed ${i + 1}/${files.length}` });
      await new Promise(r => setTimeout(r, 150));
    }

    setResults({ 
      success, 
      skipped, 
      failures, 
      unmatched: unmatchedLocal, 
      updated: updatedLocal, 
      failed: failedLocal 
    });
    setProgress({ 
      current: files.length, 
      total: files.length, 
      message: `Complete! ${existingCardsUpdated} placeholders updated, ${newCardsCreated} new cards created, ${skipped} skipped, ${failures} failed` 
    });
    setUploading(false);
    
    if (existingCardsUpdated > 0 || newCardsCreated > 0) {
      console.log(`🔄 Reloading cards list after ${existingCardsUpdated} updates and ${newCardsCreated} creates...`);
      await loadCards();
    }

    if (onDone && success > 0) {
      setTimeout(() => onDone(), 500);
    }
  };

  const percent = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;
  const uploadComplete = !uploading && progress.total > 0 && progress.current === progress.total;

  if (checkingAuth) {
    return (
      <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-purple-300 mr-2" />
        <span className="text-white/70">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/40">
        <div className="flex items-center gap-2 mb-3">
          <LogIn className="w-5 h-5 text-red-300" />
          <h3 className="text-lg font-bold text-red-100">Authentication Required</h3>
        </div>
        <p className="text-red-200 text-sm mb-3">
          You must be logged in to upload images. Please log in and refresh this page to continue.
        </p>
        <Button
          onClick={() => User.login()}
          className="bg-red-600 hover:bg-red-700"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Log In
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Images className="w-5 h-5 text-purple-300" />
          <h3 className="text-lg font-bold text-white">Bulk Upload Local Images</h3>
        </div>
        <p className="text-sm text-white/70 mb-3">
          Upload images and they'll be matched to cards by the number printed ON the image (OCR reads the card number automatically).
        </p>

        <div className="space-y-3 mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border-2 border-purple-500/40">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">⚙️ Upload Options</div>
          
          <label 
            className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors border border-white/10"
            onClick={(e) => {
              e.preventDefault();
              if (!uploading) setCreateMissing(!createMissing);
            }}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={createMissing}
                onChange={(e) => {
                  e.stopPropagation();
                  if (!uploading) setCreateMissing(e.target.checked);
                }}
                disabled={uploading}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-all ${createMissing ? 'bg-green-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${createMissing ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-base">Create New Cards</div>
              <div className="text-xs text-white/70 mt-1">
                When OCR detects a card name that doesn't exist in your deck, automatically create it
              </div>
            </div>
          </label>

          <label 
            className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors border border-white/10"
            onClick={(e) => {
              e.preventDefault();
              if (!uploading) setPreferOcr(!preferOcr);
            }}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={preferOcr}
                onChange={(e) => {
                  e.stopPropagation();
                  if (!uploading) setPreferOcr(e.target.checked);
                }}
                disabled={uploading}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-all ${preferOcr ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${preferOcr ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-base flex items-center gap-2">
                {preferOcr ? '🎯 Read Numbers from Images' : '📁 Read Numbers from Filenames'}
              </div>
              <div className="text-xs text-white/70 mt-1">
                {preferOcr 
                  ? "Use OCR to read card numbers printed ON the image (ignores filenames). Slower but more accurate when numbers are visible in artwork."
                  : "Use numbers extracted from image filenames (e.g., '001-CardName.jpg'). Faster, but requires consistent naming."
                }
              </div>
            </div>
          </label>
        </div>

        {loadingCards ? (
          <div className="flex items-center gap-2 text-white/70 mb-3">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading cards...
          </div>
        ) : error ? (
          <div className="mb-3 bg-red-900/20 border border-red-500/40 text-red-100 p-2 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : null}

        <div className="flex flex-col md:flex-row gap-3 items-start mb-3">
          <label className="block w-full">
            <span className="sr-only">Choose images</span>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={onSelectFiles}
              className="bg-black/40 border-white/20 text-white w-full"
              disabled={uploading || loadingCards || !!error || !isAuthenticated}
            />
          </label>
        </div>

        <div className="text-white/80 text-sm mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            {files.length ? `${files.length} file(s) selected` : "No files chosen yet"}
          </div>
          <p className="text-xs text-white/60 mt-1">
            💡 Tip: Card matching prioritizes your chosen setting (OCR or Filename), then fuzzy name matching from OCR.
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          {!uploadComplete ? (
            <>
              <Button
                onClick={startUpload}
                disabled={!files.length || uploading || loadingCards || !!error || !isAuthenticated}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Start Upload
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setFiles([]); setResults({ success: 0, skipped: 0, failures: 0, unmatched: [], updated: [], failed: [] }); setProgress({ current: 0, total: 0, message: "" }); }}
                disabled={uploading || !isAuthenticated}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Reset
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setFiles([]);
                  setResults({ success: 0, skipped: 0, failures: 0, unmatched: [], updated: [], failed: [] });
                  setProgress({ current: 0, total: 0, message: "" });
                  if (onDone) onDone();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done - View Updated Cards
              </Button>
              <Button
                variant="outline"
                onClick={() => { setFiles([]); setResults({ success: 0, skipped: 0, failures: 0, unmatched: [], updated: [], failed: [] }); setProgress({ current: 0, total: 0, message: "" }); }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Upload More Images
              </Button>
            </>
          )}
        </div>

        {uploading || progress.total > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress.message}</span>
            </div>
            <Progress value={percent} className="h-2" />
            <p className="text-xs text-white/60">{percent}% complete ({progress.current} / {progress.total})</p>
          </div>
        ) : null}

        {(results.success > 0 || results.skipped > 0 || results.failures > 0) ? (
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-md border border-white/10 bg-black/30">
              <div className="flex items-center gap-2 text-emerald-300 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Successfully updated: {results.success}</span>
              </div>
              <div className="text-yellow-300 text-sm">Skipped (no match): {results.skipped}</div>
              <div className="text-red-300 text-sm">Failed: {results.failures}</div>
            </div>

            {results.updated?.length > 0 && (
              <div className="p-3 rounded-md border border-emerald-500/30 bg-emerald-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm font-semibold text-emerald-200">Updated Cards</span>
                </div>
                <ScrollArea className="max-h-48">
                  <ul className="text-xs text-emerald-100 space-y-1 pr-4">
                    {results.updated.map((u, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">
                            {u.cardName} 
                            {u.cardNumber != null && ` (#${u.cardNumber})`}
                            {u.position != null && ` (Pos: ${u.position})`}
                            {u.isNew && <span className="text-emerald-400"> (NEW)</span>}
                          </div>
                          <div className="text-emerald-200/70">← {u.fileName} (matched by {u.matchedBy})</div>
                          <div className="text-emerald-200/50 text-[10px] truncate">{u.url}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {results.failed?.length > 0 && (
              <div className="p-3 rounded-md border border-red-500/30 bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-300" />
                  <span className="text-sm font-semibold text-red-200">Failed Updates</span>
                </div>
                <ScrollArea className="max-h-48">
                  <ul className="text-xs text-red-100 space-y-1 pr-4">
                    {results.failed.map((f, i) => (
                      <li key={i}>
                        <div className="font-semibold">{f.cardName}</div>
                        <div className="text-red-200/70">← {f.fileName}</div>
                        <div className="text-red-300/80 text-[10px]">Error: {f.error}</div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {results.unmatched?.length > 0 && (
              <div className="p-3 rounded-md border border-yellow-500/30 bg-yellow-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-semibold text-yellow-200">Unmatched Files</span>
                </div>
                <ScrollArea className="max-h-48">
                  <ul className="text-xs text-yellow-100 space-y-1 pr-4">
                    {results.unmatched.slice(0, 15).map((u, i) => (
                      <li key={i}>
                        {u.file}
                        {u.guess ? <> → "{u.guess}"{u.number != null ? ` (#${u.number})` : ""}{typeof u.confidence === "number" ? ` [${Math.round(u.confidence * 100)}%]` : ""}</> : " (no title read)"}
                        {u.reason && <div className="text-yellow-200/70 text-[10px]">Reason: {u.reason}</div>}
                      </li>
                    ))}
                    {results.unmatched.length > 15 ? <li>...and {results.unmatched.length - 15} more</li> : null}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* NEW: Manual Matching Modal */}
      <Dialog open={!!unmatchedModal} onOpenChange={(open) => !open && handleSkipUnmatched()}>
        <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/40">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Manual Card Assignment Required
            </DialogTitle>
            <DialogDescription className="text-white/70">
              OCR couldn't confidently match this image. Please manually select the correct card position.
            </DialogDescription>
          </DialogHeader>

          {unmatchedModal && (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="flex gap-4">
                <div className="w-48 h-72 bg-black/40 rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
                  {unmatchedModal.ocr?.file_url ? (
                    <img 
                      src={unmatchedModal.ocr.file_url} 
                      alt={unmatchedModal.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Images className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-200 font-semibold">File: {unmatchedModal.fileName}</p>
                    {unmatchedModal.ocr?.number && (
                      <p className="text-xs text-yellow-200/70">OCR detected number: {unmatchedModal.ocr.number}</p>
                    )}
                    {unmatchedModal.ocr?.name && (
                      <p className="text-xs text-yellow-200/70">OCR detected name: "{unmatchedModal.ocr.name}"</p>
                    )}
                    {unmatchedModal.ocr?.confidence != null && (
                      <p className="text-xs text-yellow-200/70">
                        Confidence: {Math.round(unmatchedModal.ocr.confidence * 100)}%
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Select Card Position:</label>
                    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                      <SelectTrigger className="bg-black/40 border-white/20 text-white">
                        <SelectValue placeholder="Choose a card position..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-purple-500/40 max-h-[300px]">
                        <ScrollArea className="h-[250px]">
                          {cards.map((card, idx) => {
                            const pos = idx + 1;
                            return (
                              <SelectItem key={card.id} value={pos.toString()} className="text-white">
                                {pos}. {card.name} {card.number != null ? `(#${card.number})` : ''}
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-amber-900/20 border border-amber-500/30 rounded">
                    <Checkbox 
                      id="skip-all" 
                      checked={skipAllUnmatched}
                      onCheckedChange={setSkipAllUnmatched}
                    />
                    <label htmlFor="skip-all" className="text-xs text-amber-200 cursor-pointer">
                      Skip all remaining unmatched images (don't ask again)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleSkipUnmatched}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Skip This Image
                </Button>
                <Button
                  onClick={handleManualMatch}
                  disabled={!selectedPosition}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Assign to Position {selectedPosition}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
