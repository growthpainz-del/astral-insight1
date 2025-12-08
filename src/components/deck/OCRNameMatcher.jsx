import React from "react";
import { Button } from "@/components/ui/button";
import { Card as CardEntity } from "@/entities/all";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, CheckCircle2, XCircle, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function OCRNameMatcher({ deckId, onDone }) {
  const [files, setFiles] = React.useState([]); // [{file, file_url, preview}]
  const [items, setItems] = React.useState([]); // OCR items [{file_url, preview, guess, confidence, status, error, matchedCardId}]
  const [cards, setCards] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0, message: "" });

  React.useEffect(() => {
    if (!deckId) return;
    CardEntity.filter({ deck_id: deckId }).then(setCards);
  }, [deckId]);

  const handleChooseFiles = async (e) => {
    const fList = Array.from(e.target.files || []);
    if (!fList.length) return;

    setBusy(true);
    const nextFiles = [];
    for (const f of fList) {
      // Upload to get a URL
      const { data } = await base44.integrations.Core.UploadFile({ file: f });
      const file_url = data?.file_url;
      if (!file_url) continue;

      nextFiles.push({
        file: f,
        file_url,
        preview: URL.createObjectURL(f),
      });
    }
    setFiles((prev) => [...prev, ...nextFiles]);
    setItems((prev) => [
      ...prev,
      ...nextFiles.map((nf) => ({
        file_url: nf.file_url,
        preview: nf.preview,
        guess: "",
        confidence: 0,
        status: "pending",
        error: "",
        matchedCardId: null,
      })),
    ]);
    setBusy(false);
    e.target.value = "";
  };

  const runOCR = async () => {
    if (!deckId || !items.length) return;
    setBusy(true);
    setProgress({ current: 0, total: items.length, message: "Reading titles..." });

    // Build name index for matching
    const index = new Map();
    cards.forEach((c) => {
      index.set(normalizeName(c.name), c);
    });

    const updated = [...items];
    let i = 0;

    for (const it of updated) {
      setProgress({ current: i, total: updated.length, message: "Analyzing image..." });
      try {
        // Ask the LLM to read printed title text from the image
        const prompt = [
          "You are an OCR assistant for card titles.",
          "Look at the attached image and read the visible printed title text on the card (usually at the top or bottom frame).",
          "Return a short JSON object:",
          '{ "card_name": string, "confidence": number, "other_text": array<string> }',
          "- card_name: the likely title you see printed on the card.",
          "- confidence: 0..1 for how sure you are about card_name.",
          "- other_text: any extra visible words (optional).",
          "If there is no visible title, return empty string and confidence 0."
        ].join("\n");

        const { data: res } = await base44.integrations.Core.InvokeLLM({
          prompt,
          file_urls: [it.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              card_name: { type: "string" },
              confidence: { type: "number" },
              other_text: { type: "array", items: { type: "string" } }
            },
            required: ["card_name", "confidence"]
          }
        });

        const guess = String(res?.card_name || "").trim();
        const confidence = Number(res?.confidence || 0);
        it.guess = guess;
        it.confidence = confidence;
        it.status = "recognized";

        // Try to match to existing card by normalized name
        const nn = normalizeName(guess);
        let matched = index.get(nn) || null;

        // Fallback: loose includes match
        if (!matched && nn) {
          for (const [normName, c] of index.entries()) {
            if (normName.includes(nn) || nn.includes(normName)) {
              matched = c;
              break;
            }
          }
        }

        if (matched) {
          it.matchedCardId = matched.id;
          it.status = "matched";
        } else {
          it.status = "needs_match";
        }

      } catch (err) {
        it.error = err?.message || "OCR failed";
        it.status = "error";
      }

      i += 1;
      setProgress({ current: i, total: updated.length, message: "Analyzing image..." });
      await new Promise((r) => setTimeout(r, 150)); // gentle rate limit
    }

    setItems(updated);
    setBusy(false);
    setProgress({ current: updated.length, total: updated.length, message: "Done" });
  };

  const applyMatches = async () => {
    const toApply = items.filter((it) => it.matchedCardId && it.status !== "applied");
    if (!toApply.length) return;
    setBusy(true);
    setProgress({ current: 0, total: toApply.length, message: "Updating cards..." });

    let i = 0;
    for (const it of toApply) {
      try {
        await CardEntity.update(it.matchedCardId, { image_url: it.file_url });
        it.status = "applied";
      } catch (e) {
        it.error = e?.message || "Update failed";
        it.status = "error";
      }
      i += 1;
      setProgress({ current: i, total: toApply.length, message: "Updating cards..." });
      await new Promise((r) => setTimeout(r, 120));
    }
    setItems([...items]);
    setBusy(false);
    onDone && onDone();
  };

  const setManualMatch = (idx, cardId) => {
    const next = [...items];
    next[idx].matchedCardId = cardId || null;
    next[idx].status = cardId ? "matched" : "needs_match";
    setItems(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <label className="flex items-center justify-center px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Choose Images
          <Input type="file" accept="image/*" multiple className="hidden" onChange={handleChooseFiles} />
        </label>
        <Button
          onClick={runOCR}
          disabled={!items.length || busy}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Analyze & Match
        </Button>
        <Button
          variant="outline"
          onClick={applyMatches}
          disabled={busy || !items.some((it) => it.matchedCardId && it.status !== "applied")}
          className="border-white/20"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Apply to Matched Cards
        </Button>
      </div>

      {busy && (
        <div className="text-sm text-white/70">
          {progress.message} {progress.current}/{progress.total}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it, idx) => {
          const matchedCard = it.matchedCardId ? cards.find((c) => c.id === it.matchedCardId) : null;
          return (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-black/40 mb-2">
                {it.preview ? (
                  <img src={it.preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <img src={it.file_url} alt="preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <div className="text-white/90 font-semibold truncate">
                    {it.guess || "—"}
                  </div>
                  <div className="text-white/60">conf: {(it.confidence || 0).toFixed(2)}</div>
                </div>

                {it.status === "error" && (
                  <div className="text-red-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> {it.error}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-white/60">Match:</span>
                  <Select value={it.matchedCardId || ""} onValueChange={(val) => setManualMatch(idx, val || null)}>
                    <SelectTrigger className="bg-black/40 border-white/20">
                      <SelectValue placeholder="Select card…" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-60">
                      {cards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.number != null ? `${c.number}. ` : ""}{c.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={null}>— None —</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {matchedCard && (
                  <div className="text-white/70">
                    Will update: <span className="font-medium">{matchedCard.name}</span>
                  </div>
                )}
                <div className="text-white/50 text-xs">Status: {it.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}