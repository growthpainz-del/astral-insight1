import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Copy, Check } from "lucide-react";

function normalizeName(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9\s'"&().:+\-_/]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CardNames() {
  const [searchParams] = useSearchParams();

  const [deckName, setDeckName] = useState(
    searchParams.get("name") || "it's not the end of the world"
  );
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState([]);
  const [targetDeck, setTargetDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const desiredNorm = useMemo(() => normalizeName(deckName), [deckName]);

  const resultText = useMemo(() => {
    if (!cards?.length) return "";
    return [...cards]
      .sort((a, b) => {
        const na = a.number ?? 0;
        const nb = b.number ?? 0;
        if (na !== nb) return na - nb;
        return (a.name || "").localeCompare(b.name || "");
      })
      .map((c) => c.name || "")
      .join("\n");
  }, [cards]);

  const candidates = useMemo(() => {
    if (!decks?.length || !desiredNorm) return [];
    const withNorms = decks.map((d) => ({ d, n: normalizeName(d.name) }));
    const exact = withNorms.filter((x) => x.n === desiredNorm).map((x) => x.d);
    if (exact.length) return exact;
    return withNorms
      .filter((x) => x.n.includes(desiredNorm))
      .map((x) => x.d)
      .slice(0, 10);
  }, [decks, desiredNorm]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setTargetDeck(null);
    setCards([]);
    setCopied(false);
    try {
      const list = await base44.entities.Deck.filter({}, "-created_date", 200);
      setDecks(list || []);
      const chosen =
        (list || []).find((d) => normalizeName(d.name) === desiredNorm) ||
        (list || []).find((d) => normalizeName(d.name).includes(desiredNorm)) ||
        null;
      if (!chosen) {
        setError("Deck not found. Try adjusting the name below.");
        setLoading(false);
        return;
      }
      setTargetDeck(chosen);
      const fetchedCards = await base44.entities.Card.filter({
        deck_id: chosen.id,
      });
      setCards(fetchedCards || []);
    } catch (e) {
      setError(e?.message || "Failed to load deck or cards.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount when name param is present.
  // Depends on deckName so it doesn't capture a stale closure value.
  useEffect(() => {
    if (deckName && !cards.length && !targetDeck && !loading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckName]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([resultText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (targetDeck?.name || "deck").replace(
      /[^a-z0-9\-_ ]/gi,
      "_"
    );
    a.download = `${safeName}_card_names.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h1 className="text-2xl font-bold mb-3">List Card Names from Deck</h1>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <Input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter deck name..."
              className="bg-black/40 border-white/20"
            />
            <Button
              onClick={fetchData}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Deck
                </>
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
          {!targetDeck && candidates.length > 0 && (
            <div className="mt-3 text-sm text-white/80">
              <p className="mb-1">Did you mean:</p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant="outline"
                    className="border-white/20 hover:bg-white/10"
                    onClick={async () => {
                      setDeckName(c.name);
                      setTargetDeck(c);
                      setLoading(true);
                      try {
                        const fetchedCards =
                          await base44.entities.Card.filter({
                            deck_id: c.id,
                          });
                        setCards(fetchedCards || []);
                        setError("");
                      } catch (e) {
                        setError(e?.message || "Failed to load cards.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {targetDeck && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{targetDeck.name}</h2>
                <p className="text-white/60 text-sm">{cards.length} cards</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="border-white/20 hover:bg-white/10"
                  disabled={!resultText}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  onClick={downloadTxt}
                  disabled={!resultText}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Download .txt
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <h3 className="text-sm font-semibold mb-2">Card Names</h3>
                <ScrollArea className="max-h-80 pr-2">
                  <ul className="text-sm space-y-1">
                    {[...cards]
                      .sort(
                        (a, b) =>
                          (a.number ?? 0) - (b.number ?? 0) ||
                          (a.name || "").localeCompare(b.name || "")
                      )
                      .map((c) => (
                        <li key={c.id} className="text-white/80">
                          {c.number != null ? `${c.number}. ` : ""}
                          {c.name}
                        </li>
                      ))}
                  </ul>
                </ScrollArea>
              </div>
              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <h3 className="text-sm font-semibold mb-2">Raw (.txt)</h3>
                <Textarea
                  value={resultText}
                  readOnly
                  rows={12}
                  className="bg-black/40 border-white/10 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}