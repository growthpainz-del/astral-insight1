import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card as CardEntity } from "@/entities/all";
import { Loader2, Sparkles } from "lucide-react";

export default function JsonCardUpdater({ deckId, onDone }) {
  const [jsonText, setJsonText] = React.useState("");
  const [parsed, setParsed] = React.useState([]);
  const [error, setError] = React.useState("");
  const [isValid, setIsValid] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [stats, setStats] = React.useState({ updated: 0, skipped: 0 });
  const [message, setMessage] = React.useState("");

  const handleValidate = () => {
    setError("");
    setIsValid(false);
    setParsed([]);
    try {
      const data = JSON.parse(jsonText || "[]");
      if (!Array.isArray(data)) {
        setError("JSON must be an array of card objects.");
        return;
      }
      const cleaned = data
        .map((o) => (o && typeof o === "object" ? o : null))
        .filter(Boolean);
      if (cleaned.length === 0) {
        setError("No valid objects found in the array.");
        return;
      }
      setParsed(cleaned);
      setIsValid(true);
    } catch (e) {
      setError("Invalid JSON: " + (e.message || "parse error"));
    }
  };

  const runUpdate = async () => {
    if (!deckId) {
      setError("Please select a deck first.");
      return;
    }
    if (!isValid || parsed.length === 0) {
      setError("Validate JSON first.");
      return;
    }
    setIsRunning(true);
    setMessage("Loading existing cards...");
    setStats({ updated: 0, skipped: 0 });

    try {
      // Load existing cards
      const existing = await CardEntity.filter({ deck_id: deckId });
      const byNumber = new Map();
      const byName = new Map();
      
      for (const c of existing) {
        if (c.number != null) byNumber.set(Number(c.number), c);
        if (c.name) byName.set(String(c.name).trim().toLowerCase(), c);
      }

      let updated = 0, skipped = 0;

      for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i] || {};
        
        // Match by number, title, or name
        const numVal = row.number != null ? Number(row.number) : 
                       (row.id != null && typeof row.id === 'number' ? Number(row.id) : null);
        const nameVal = row.title || row.name || row.card_name;
        const nameKey = nameVal ? String(nameVal).trim().toLowerCase() : null;

        let target = null;
        if (numVal != null && !Number.isNaN(numVal)) {
          target = byNumber.get(numVal);
        }
        if (!target && nameKey) {
          target = byName.get(nameKey);
        }

        if (target) {
          const updatePayload = {};
          
          // Map AI prompt fields with priority: image_prompt > ai_image_prompt > prompt
          if (row.image_prompt !== undefined) {
            updatePayload.ai_image_prompt = row.image_prompt ? String(row.image_prompt).trim() : null;
          } else if (row.ai_image_prompt !== undefined) {
            updatePayload.ai_image_prompt = row.ai_image_prompt ? String(row.ai_image_prompt).trim() : null;
          } else if (row.prompt !== undefined) {
            updatePayload.ai_image_prompt = row.prompt ? String(row.prompt).trim() : null;
          } else if (row.image_generate_prompt !== undefined) {
            updatePayload.ai_image_prompt = row.image_generate_prompt ? String(row.image_generate_prompt).trim() : null;
          }

          // Negative prompt
          if (row.negative_prompt !== undefined) {
            updatePayload.ai_image_negative_prompt = row.negative_prompt ? String(row.negative_prompt).trim() : null;
          } else if (row.ai_image_negative_prompt !== undefined) {
            updatePayload.ai_image_negative_prompt = row.ai_image_negative_prompt ? String(row.ai_image_negative_prompt).trim() : null;
          }

          // Style
          if (row.style !== undefined) {
            updatePayload.ai_prompt_style = row.style ? String(row.style).trim() : null;
          } else if (row.ai_prompt_style !== undefined) {
            updatePayload.ai_prompt_style = row.ai_prompt_style ? String(row.ai_prompt_style).trim() : null;
          }

          // Reference image
          if (row.reference_image_url !== undefined) {
            updatePayload.ai_reference_image_url = row.reference_image_url ? String(row.reference_image_url).trim() : null;
          } else if (row.ai_reference_image_url !== undefined) {
            updatePayload.ai_reference_image_url = row.ai_reference_image_url ? String(row.ai_reference_image_url).trim() : null;
          }

          // Also update other fields if provided
          if (row.title !== undefined) {
            updatePayload.name = row.title ? String(row.title).trim() : null;
          } else if (row.name !== undefined) {
            updatePayload.name = row.name ? String(row.name).trim() : null;
          }

          if (row.text !== undefined) {
            updatePayload.subtitle = row.text ? String(row.text).trim() : null;
          } else if (row.subtitle !== undefined) {
            updatePayload.subtitle = row.subtitle ? String(row.subtitle).trim() : null;
          }

          if (row.upright !== undefined) {
            updatePayload.upright_meaning = row.upright ? String(row.upright).trim() : null;
          }

          if (row.reverse !== undefined) {
            updatePayload.reversed_meaning = row.reverse ? String(row.reverse).trim() : null;
          } else if (row.reversed !== undefined) {
            updatePayload.reversed_meaning = row.reversed ? String(row.reversed).trim() : null;
          }

          if (row.science_slip !== undefined) {
            updatePayload.ancient_wisdom = row.science_slip ? String(row.science_slip).trim() : null;
          }

          if (row.theme !== undefined) {
            updatePayload.overall_meaning = row.theme ? String(row.theme).trim() : null;
          }

          if (row.image_url !== undefined) {
            updatePayload.image_url = row.image_url ? String(row.image_url).trim() : null;
          }

          if (Object.keys(updatePayload).length > 0) {
            try {
              await CardEntity.update(target.id, updatePayload);
              updated++;
            } catch (err) {
              console.error(`Failed to update card ${target.name}:`, err);
              skipped++;
            }
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }

        if ((i + 1) % 5 === 0) {
          setMessage(`Updated ${updated}/${parsed.length}...`);
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      setStats({ updated, skipped });
      setMessage("Done!");
      onDone && onDone();
    } catch (e) {
      setError("Update failed: " + (e?.message || "Unknown error"));
    } finally {
      setIsRunning(false);
    }
  };

  const sample = parsed.slice(0, 3);

  return (
    <div className="space-y-4 text-white">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
        <p className="font-semibold mb-1">💡 Bulk Update AI Prompts</p>
        <p>Paste an array with your cards' AI prompts. Match cards by <code className="bg-black/30 px-1 rounded">id</code> (as number), <code className="bg-black/30 px-1 rounded">title</code>, or <code className="bg-black/30 px-1 rounded">name</code>.</p>
        <p className="mt-2 text-xs">Supports fields: <code className="bg-black/30 px-1 rounded">image_prompt</code>, <code className="bg-black/30 px-1 rounded">prompt</code>, <code className="bg-black/30 px-1 rounded">ai_image_prompt</code>, <code className="bg-black/30 px-1 rounded">style</code>, <code className="bg-black/30 px-1 rounded">negative_prompt</code></p>
      </div>

      <Textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='[{"id":1,"image_prompt":"A brain surrounded by fog..."},{"id":2,"image_prompt":"Person chasing squirrels..."}]'
        className="min-h-[200px] bg-black/40 border-white/20 text-white font-mono text-sm"
      />

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex gap-2">
        <Button onClick={handleValidate} className="bg-emerald-600 hover:bg-emerald-700">
          Validate JSON
        </Button>
        <Button
          onClick={runUpdate}
          disabled={!isValid || isRunning || !deckId}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Update Cards
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-white/70">
        Status: {message || (isValid ? `Ready to update ${parsed.length} cards` : "Waiting for validation...")}
      </div>

      {stats.updated > 0 && (
        <div className="text-sm bg-emerald-900/20 border border-emerald-500/30 rounded p-3">
          <div className="text-emerald-300">✓ Updated: {stats.updated}</div>
          <div className="text-white/60">Skipped: {stats.skipped}</div>
        </div>
      )}

      {isValid && sample.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-md p-3">
          <div className="text-sm font-semibold mb-2">Preview (first 3):</div>
          {sample.map((card, idx) => (
            <div key={idx} className="mb-2 p-2 bg-black/20 rounded border border-white/5 text-xs">
              <div className="text-emerald-300">
                Card {card.id || card.number || "?"}: {card.title || card.name || "(match by number)"}
              </div>
              {(card.image_prompt || card.prompt || card.ai_image_prompt) && (
                <div className="text-white/60 mt-1">
                  Prompt: {(card.image_prompt || card.prompt || card.ai_image_prompt).slice(0, 80)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}