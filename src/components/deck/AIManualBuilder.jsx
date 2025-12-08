
import React from "react";
import { Deck, Card as CardEntity } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InvokeLLM } from "@/integrations/Core";
import { Loader2, Wand2, CheckCircle2, AlertTriangle } from "lucide-react";
import { queueApiCall } from "@/components/utils/apiQueue";

const DEFAULT_FIELDS = [
  { key: "overall_meaning", label: "Overall Meaning" },
  { key: "upright_meaning", label: "Upright Meaning" },
  { key: "reversed_meaning", label: "Reversed Meaning" },
  { key: "upright_action", label: "Upright Action" },
  { key: "reversed_action", label: "Reversed Action" },
  { key: "keywords", label: "Keywords" },
  { key: "ancient_wisdom", label: "Ancient Wisdom" },
];

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  // split by comma or semicolon
  return String(val)
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Helper sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function AIManualBuilder({ deckId, deck: deckProp, onDone }) {
  // Use deckProp if available, otherwise localDeck will be fetched by useEffect
  const [localDeck, setLocalDeck] = React.useState(null);
  const [cards, setCards] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // CHANGED: allow generating for all by default
  const [missingOnly, setMissingOnly] = React.useState(false);
  const [selectedFields, setSelectedFields] = React.useState(
    new Set(DEFAULT_FIELDS.map((f) => f.key))
  );
  const [extraContext, setExtraContext] = React.useState("");
  const [limit, setLimit] = React.useState(0); // 0 = no limit

  const [isGenerating, setIsGenerating] = React.useState(false); // For card generation
  const [progress, setProgress] = React.useState({ current: 0, total: 0, message: "" });
  const [log, setLog] = React.useState([]);

  // New state for manual generation
  const [generatingManual, setGeneratingManual] = React.useState(false);
  const [generatedManualContent, setGeneratedManualContent] = React.useState("");

  // Determine the effective deck object to use
  const deck = deckProp || localDeck;

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!deckId) {
          setError("No deck selected.");
          setLoading(false);
          return;
        }

        // Only fetch localDeck if deckProp is not provided or if the deckId for localDeck doesn't match
        if (!deckProp && (!localDeck || localDeck.id !== deckId)) {
          const d = await queueApiCall(() => Deck.get(deckId));
          if (cancelled) return;
          setLocalDeck(d);
        }
        
        const cs = await queueApiCall(() => CardEntity.filter({ deck_id: deckId }));
        if (cancelled) return;
        setCards(cs);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load deck or cards.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [deckId, deckProp, localDeck]);

  const toggleField = (key) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredCards = React.useMemo(() => {
    if (!Array.isArray(cards)) return [];
    if (!missingOnly) return cards;
    return cards.filter((c) => {
      // consider missing if any selected field is empty
      for (const key of selectedFields) {
        if (key === "keywords") {
          const kw = c.keywords;
          if (!kw || (Array.isArray(kw) ? kw.length === 0 : String(kw).trim().length === 0)) {
            return true;
          }
        } else if (!c[key] || String(c[key]).trim().length === 0) {
          return true;
        }
      }
      return false;
    });
  }, [cards, missingOnly, selectedFields]);

  const buildPrompt = (card) => {
    const fieldsNeeded = Array.from(selectedFields);
    const deckContext = [
      deck?.name ? `Deck: ${deck.name}` : "",
      deck?.description ? `Deck description: ${deck.description}` : "",
      deck?.manual_content ? `Manual content:\n${deck.manual_content.slice(0, 1800)}` : "",
      extraContext ? `Extra context:\n${extraContext}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // NEW: Include existing card meanings in prompt
    const cardKnown = [
      `Card #${card.number ?? "?"}: ${card.name}`,
      card.overall_meaning ? `Existing overall meaning: ${card.overall_meaning}` : "",
      card.upright_meaning ? `Existing upright meaning: ${card.upright_meaning}` : "",
      card.reversed_meaning ? `Existing reversed meaning: ${card.reversed_meaning}` : "",
      card.upright_action ? `Existing upright action: ${card.upright_action}` : "",
      card.reversed_action ? `Existing reversed action: ${card.reversed_action}` : "",
      card.keywords?.length ? `Existing keywords: ${card.keywords.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const styleGuide = `
Write concise, original, non-plagiarized content suitable for an oracle/tarot manual. 
Tone: clear, supportive, actionable. 
Keep each field 1–3 sentences max. 
Keywords should be a short comma-separated list.
IMPORTANT: If existing meanings are provided above, use them as the foundation and only fill in missing fields.
Do not rewrite existing content unless the field is empty.
Do not mention this prompt, JSON, or instructions in outputs.
`;

    const askList = fieldsNeeded.map((k) => {
      // Check if field already has content
      const hasContent = card[k] && String(card[k]).trim().length > 0;
      if (k === "keywords" && card.keywords?.length > 0) {
        return `- ${k} (already has: ${card.keywords.join(", ")} - keep existing)`;
      }
      return hasContent ? `- ${k} (keep existing: "${String(card[k]).slice(0, 50)}...")` : `- ${k}`;
    }).join("\n");

    return [
      "You are an expert tarot/oracle author.",
      styleGuide.trim(),
      "",
      deckContext,
      "",
      cardKnown,
      "",
      "Generate or preserve the following fields:",
      askList,
      "",
      "Return JSON with exactly these keys. For fields marked 'keep existing', return the exact same content. Only generate new content for empty fields.",
    ].join("\n");
  };

  const schemaFor = (fields) => {
    const props = {};
    const req = [];
    
    for (const f of fields) {
      if (f === "keywords") {
        props[f] = {
          type: "array",
          items: { type: "string" },
          description: "Short comma-separated list of keywords"
        };
      } else {
        props[f] = {
          type: "string",
          description: `Content for ${f}`
        };
      }
      req.push(f);
    }
    
    return {
      type: "object",
      properties: props,
      required: req
    };
  };

  const handleGenerate = async () => {
    if (!deck || filteredCards.length === 0 || selectedFields.size === 0) {
      setError("Nothing to generate. Check selected fields or cards.");
      return;
    }
    
    setIsGenerating(true);
    setError("");
    setProgress({ current: 0, total: filteredCards.length, message: "Starting..." });
    setLog([]);
    
    const fields = Array.from(selectedFields);
    const max = limit && limit > 0 ? Math.min(limit, filteredCards.length) : filteredCards.length;

    // No longer tracking consecutive network errors directly here, queueApiCall handles retries
    // and will eventually throw if max retries are exceeded.

    for (let i = 0; i < max; i++) {
      if (!isGenerating) {
        console.log("Generation cancelled.");
        break;
      }
      const card = filteredCards[i];
      setProgress({
        current: i,
        total: max,
        message: `Generating for "${card.name}" (${i + 1}/${max})`,
      });

      try {
        const prompt = buildPrompt(card);
        const schema = schemaFor(fields);
        
        if (!schema.type || !schema.properties || !schema.required) {
          throw new Error("Invalid schema generated");
        }

        // Use queueApiCall for LLM invocation and destructure the 'data' property if present
        const { data: res } = await queueApiCall(() => InvokeLLM({
          prompt,
          response_json_schema: schema,
        }));

        const update = {};
        for (const k of fields) {
          const v = res?.[k];
          // Skip if field already has content (preserve existing)
          const hasExisting = card[k] && String(card[k]).trim().length > 0;
          if (k === "keywords" && card.keywords?.length > 0) {
            continue;
          }
          if (hasExisting) {
            continue;
          }
          
          // Only update empty fields
          if (k === "keywords") {
            const arr = toArray(v);
            if (arr.length) update.keywords = arr;
          } else if (typeof v === "string" && v.trim().length) {
            update[k] = v.trim();
          }
        }

        if (Object.keys(update).length > 0) {
          await queueApiCall(() => CardEntity.update(card.id, update));
          setLog((l) => [
            { type: "ok", card: card.name, updated: Object.keys(update) },
            ...l,
          ]);
        } else {
          setLog((l) => [
            { type: "skip", card: card.name, reason: "All selected fields already have content or nothing new generated" },
            ...l,
          ]);
        }
      } catch (e) {
        console.error("Error generating for card:", card.name, e);
        setLog((l) => [
          { 
            type: "err", 
            card: card.name, 
            error: e?.message || "Failed to generate"
          },
          ...l,
        ]);
        // queueApiCall handles retries; if an error reaches here, it's a persistent error.
        // We can choose to stop or continue. For now, we continue but log the error.
        // If critical to stop, re-introduce a breaking condition here.
      }

      // Longer delay between cards to avoid overwhelming the queue and potential rate limits
      await sleep(1500);
    }

    setProgress({
      current: max,
      total: max,
      message: "Done.",
    });
    setIsGenerating(false);
    onDone && onDone();
  };

  const generateManual = async () => {
    setGeneratingManual(true);
    setError("");

    try {
      const { data } = await queueApiCall(() => base44.functions.invoke("generateManualTemplate", {
        deckId: deckId,
        deckName: deck?.name || "Unknown Deck",
        deckDescription: deck?.description || "",
        deckCategory: deck?.category || "oracle",
      }));

      if (data?.manual_content) {
        setGeneratedManualContent(data.manual_content);
        
        // Save to deck
        if (deckId) {
          await queueApiCall(() => Deck.update(deckId, { manual_content: data.manual_content }));
          setError("");
          setLog((l) => [
            { type: "ok", card: "Manual", updated: ["manual_content - saved to deck!"] },
            ...l,
          ]);
        }
      } else {
        throw new Error("No manual content generated");
      }
    } catch (e) {
      console.error("Manual generation error:", e);
      setError(e?.message || "Failed to generate manual");
      setLog((l) => [
        { type: "err", card: "Manual Generator", error: e?.message || "Failed to generate" },
        ...l,
      ]);
    } finally {
      setGeneratingManual(false);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-white">
      <h3 className="text-lg font-bold mb-1">AI Manual Builder</h3>
      <p className="text-sm text-white/70 mb-4">
        Generate meanings and actions for cards using AI. Select fields, choose scope, add optional context, then Generate.
      </p>

      {/* Deck Manual Generator Section */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
        <h4 className="text-purple-300 font-semibold mb-2">📖 AI Deck Manual Generator</h4>
        <p className="text-purple-200/80 text-sm mb-3">
          Generate a comprehensive guide that teaches users how to read this deck <strong>manually</strong> - 
          without AI assistance. The manual will include card meanings, interpretation techniques, and reading guidance.
        </p>
        
        <Button
          onClick={generateManual}
          disabled={generatingManual || !deckId}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {generatingManual ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Manual...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Reading Manual
            </>
          )}
        </Button>

        {generatedManualContent && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-emerald-300 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Manual generated and saved to deck!
            </div>
            <div className="p-3 bg-black/30 rounded border border-purple-500/30 max-h-[400px] overflow-y-auto">
              <pre className="text-xs text-purple-100 whitespace-pre-wrap font-mono">
                {generatedManualContent}
              </pre>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/80">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading deck…
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Generation Error</div>
            <div className="text-sm">{error}</div>
            <Button
              onClick={() => {
                setError("");
                setIsGenerating(false);
              }}
              variant="outline"
              size="sm"
              className="mt-3 border-red-400/40 text-red-200 hover:bg-red-900/30"
            >
              Clear Error
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Fields</div>
                <div className="grid grid-cols-1 gap-2">
                  {DEFAULT_FIELDS.map((f) => (
                    <label key={f.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`fld-${f.key}`}
                        checked={selectedFields.has(f.key)}
                        onCheckedChange={() => toggleField(f.key)}
                      />
                      <Label htmlFor={`fld-${f.key}`} className="text-white/90">{f.label}</Label>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/30 rounded-md p-3 border border-white/10">
                <div>
                  <div className="text-sm font-medium text-white/90">Only missing fields</div>
                  <div className="text-xs text-white/60">Skip cards that already have values</div>
                </div>
                <Switch checked={missingOnly} onCheckedChange={setMissingOnly} />
              </div>

              <div>
                <Label htmlFor="limit" className="text-white/80">Limit (0 = all)</Label>
                <Input
                  id="limit"
                  type="number"
                  min={0}
                  value={limit}
                  onChange={(e) => setLimit(Math.max(0, Number(e.target.value || 0)))}
                  className="bg-black/40 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-3">
              <div>
                <Label htmlFor="context" className="text-white/80">Extra Context (optional)</Label>
                <Textarea
                  id="context"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="E.g., Deck’s tone, audience, special symbols, example entries…"
                  className="bg-black/40 border-white/20 text-white mt-1 min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-black/30 p-3 border border-white/10">
                  <div className="text-xs text-white/70">Deck</div>
                  <div className="text-sm font-semibold">{deck?.name || "Unknown"}</div>
                </div>
                <div className="rounded-md bg-black/30 p-3 border border-white/10">
                  <div className="text-xs text-white/70">Cards in scope</div>
                  <div className="text-sm font-semibold">
                    {filteredCards.length} of {cards.length}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  // CHANGED: enable button even if no fields are missing; only disable if no cards or no fields selected
                  disabled={isGenerating || selectedFields.size === 0 || cards.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Card Fields
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6 space-y-3">
            <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} />
            <div className="text-xs text-white/70">{progress.message}</div>
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="mt-4 max-h-48 overflow-auto bg-black/30 border border-white/10 rounded-md">
              <ul className="divide-y divide-white/10">
                {log.map((entry, idx) => (
                  <li key={idx} className="p-2 text-xs flex items-start gap-2">
                    {entry.type === "ok" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : entry.type === "err" ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-white/90">
                        {entry.card}
                        {entry.updated ? ` — updated: ${entry.updated.join(", ")}` : ""}
                      </div>
                      {entry.error && <div className="text-white/70">{entry.error}</div>}
                      {entry.reason && <div className="text-white/70">{entry.reason}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
