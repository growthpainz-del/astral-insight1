import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card as CardEntity } from "@/entities/all";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function sanitizeForCreate(obj, deckId) {
  const out = { deck_id: deckId };
  
  // PRIORITY: Map name/title fields - TITLE TAKES PRIORITY OVER ID
  out.name = obj.title || obj.name || obj.card_name || (obj.id ? `Card ${obj.id}` : undefined);
  
  out.subtitle = obj.subtitle || obj.short_description || obj.text;
  
  // Map number field - can come from 'number', 'id', or 'card_number'
  if (obj.number != null) {
    out.number = Number(obj.number);
  } else if (obj.id != null && typeof obj.id === 'number') {
    out.number = Number(obj.id);
  } else if (obj.card_number != null) {
    out.number = Number(obj.card_number);
  }
  
  const el = (obj.element || "").toString().toLowerCase();
  if (["air", "fire", "water", "earth", "spirit", "none"].includes(el)) {
    out.element = el;
  }

  // Keywords
  if (obj.keywords) {
    if (Array.isArray(obj.keywords)) {
      out.keywords = obj.keywords.map(String);
    } else if (typeof obj.keywords === "string") {
      out.keywords = obj.keywords.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
  }

  // Map all meaning fields with fallbacks - NOW WITH "upright" and "reverse" support
  const meaningMap = {
    overall_meaning: ["overall_meaning", "theme", "meaning", "description", "summary"],
    upright_meaning: ["upright_meaning", "upright", "upright_description", "positive_meaning"],
    upright_insight: ["upright_insight", "upright_message", "upright_guidance"],
    upright_action: ["upright_action", "upright_advice", "upright_steps"],
    reversed_meaning: ["reversed_meaning", "reversed", "reverse", "reverse_meaning", "negative_meaning"],
    reversed_insight: ["reversed_insight", "reversed_message", "reverse_insight"],
    reversed_action: ["reversed_action", "reversed_advice", "reverse_action"],
    interaction: ["interaction", "card_combinations", "interactions"],
    ancient_wisdom: ["ancient_wisdom", "history", "traditional_meaning", "science_slip"],
    musician_quote: ["musician_quote", "quote", "wisdom_quote"],
    facedown_meaning: ["facedown_meaning", "hidden_meaning", "face_down"]
  };

  for (const [field, synonyms] of Object.entries(meaningMap)) {
    for (const syn of synonyms) {
      if (obj[syn] && String(obj[syn]).trim()) {
        out[field] = String(obj[syn]).trim();
        break;
      }
    }
  }

  // Custom notes - combine multiple sources + type field
  const customParts = [
    obj.type ? `Type: ${obj.type}` : null,
    obj.custom,
    obj.custom_notes,
    obj.custom_ai_notes,
    obj.notes,
    obj.ai_notes
  ].filter(s => s && String(s).trim());
  
  if (customParts.length > 0) {
    out.custom = customParts.join("\n");
  }

  // Images
  out.image_url = obj.image_url || obj.image || obj.img_url || obj.card_image;
  out.video_url = obj.video_url || obj.video || obj.audio_url;
  out.frame_style = obj.frame_style || obj.frame;

  // AI prompts
  out.ai_image_prompt = obj.ai_image_prompt || obj.image_generate_prompt || obj.image_prompt || obj.prompt;
  out.ai_image_negative_prompt = obj.ai_image_negative_prompt || obj.negative_prompt;
  out.ai_prompt_style = obj.ai_prompt_style || obj.style || obj.style_tags;
  out.ai_reference_image_url = obj.ai_reference_image_url || obj.reference_image_url || obj.seed_image_url;

  // Custom fields - preserve any extra fields not in standard schema
  if (obj.custom_fields && typeof obj.custom_fields === "object") {
    out.custom_fields = { ...obj.custom_fields };
  }

  return out;
}

function sanitizeForUpdate(obj) {
  const out = {};
  
  // PRIORITY: Name field - TITLE TAKES PRIORITY
  if (obj.title !== undefined) {
    out.name = obj.title ? String(obj.title).trim() : null;
  } else if (obj.name !== undefined) {
    out.name = obj.name ? String(obj.name).trim() : null;
  } else if (obj.card_name !== undefined) {
    out.name = obj.card_name ? String(obj.card_name).trim() : null;
  }

  // Subtitle
  if (obj.subtitle !== undefined) {
    out.subtitle = obj.subtitle ? String(obj.subtitle).trim() : null;
  } else if (obj.text !== undefined) {
    out.subtitle = obj.text ? String(obj.text).trim() : null;
  }
  
  // Number - can come from 'number' or 'id' if numeric
  if (obj.number !== undefined) {
    if (obj.number != null && obj.number !== "") {
      const n = Number(obj.number);
      out.number = !Number.isNaN(n) ? n : null;
    } else {
      out.number = null;
    }
  } else if (obj.id !== undefined && typeof obj.id === 'number') {
    const n = Number(obj.id);
    out.number = !Number.isNaN(n) ? n : null;
  }
  
  // Element
  if (obj.element !== undefined) {
    const el = String(obj.element || "").toLowerCase();
    if (["air", "fire", "water", "earth", "spirit", "none"].includes(el)) {
      out.element = el;
    } else {
      out.element = null;
    }
  }

  // Keywords
  if (obj.keywords !== undefined) {
    if (Array.isArray(obj.keywords)) {
      out.keywords = obj.keywords.map(String).filter(Boolean);
    } else if (typeof obj.keywords === "string") {
      out.keywords = obj.keywords.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    } else {
      out.keywords = null;
    }
  }

  // Meaning fields - NOW WITH "upright" and "reverse" support
  const meaningMap = {
    overall_meaning: ["overall_meaning", "theme", "meaning", "description"],
    upright_meaning: ["upright_meaning", "upright", "upright_description"],
    upright_insight: ["upright_insight", "upright_message"],
    upright_action: ["upright_action", "upright_advice"],
    reversed_meaning: ["reversed_meaning", "reversed", "reverse", "reverse_meaning"],
    reversed_insight: ["reversed_insight", "reversed_message"],
    reversed_action: ["reversed_action", "reversed_advice"],
    interaction: ["interaction", "card_combinations"],
    ancient_wisdom: ["ancient_wisdom", "history", "science_slip"],
    musician_quote: ["musician_quote", "quote"],
    facedown_meaning: ["facedown_meaning", "hidden_meaning"]
  };

  for (const [field, synonyms] of Object.entries(meaningMap)) {
    for (const syn of synonyms) {
      if (obj[syn] !== undefined) {
        out[field] = obj[syn] ? String(obj[syn]).trim() : null;
        break;
      }
    }
  }

  // Custom notes - combine type + custom fields
  const customParts = [
    obj.type ? `Type: ${obj.type}` : null,
    obj.custom,
    obj.custom_notes,
    obj.notes
  ].filter(s => s && String(s).trim());

  if (customParts.length > 0) {
    out.custom = customParts.join("\n");
  } else if (obj.custom !== undefined) {
    out.custom = null;
  }

  // Images
  if (obj.image_url !== undefined) out.image_url = obj.image_url ? String(obj.image_url).trim() : null;
  else if (obj.image !== undefined) out.image_url = obj.image ? String(obj.image).trim() : null;

  if (obj.video_url !== undefined) out.video_url = obj.video_url ? String(obj.video_url).trim() : null;
  else if (obj.video !== undefined) out.video_url = obj.video ? String(obj.video).trim() : null;
  
  if (obj.frame_style !== undefined) out.frame_style = obj.frame_style ? String(obj.frame_style).trim() : null;

  // AI prompts
  if (obj.ai_image_prompt !== undefined) {
    out.ai_image_prompt = obj.ai_image_prompt ? String(obj.ai_image_prompt).trim() : null;
  } else if (obj.image_generate_prompt !== undefined) {
    out.ai_image_prompt = obj.image_generate_prompt ? String(obj.image_generate_prompt).trim() : null;
  } else if (obj.image_prompt !== undefined) {
    out.ai_image_prompt = obj.image_prompt ? String(obj.image_prompt).trim() : null;
  } else if (obj.prompt !== undefined) {
    out.ai_image_prompt = obj.prompt ? String(obj.prompt).trim() : null;
  }

  if (obj.ai_image_negative_prompt !== undefined) out.ai_image_negative_prompt = obj.ai_image_negative_prompt ? String(obj.ai_image_negative_prompt).trim() : null;
  
  if (obj.ai_prompt_style !== undefined) out.ai_prompt_style = obj.ai_prompt_style ? String(obj.ai_prompt_style).trim() : null;
  else if (obj.style !== undefined) out.ai_prompt_style = obj.style ? String(obj.style).trim() : null;

  if (obj.ai_reference_image_url !== undefined) out.ai_reference_image_url = obj.ai_reference_image_url ? String(obj.ai_reference_image_url).trim() : null;

  // Custom fields
  if (obj.custom_fields !== undefined) {
    if (typeof obj.custom_fields === "object" && obj.custom_fields !== null) {
      out.custom_fields = { ...obj.custom_fields };
    } else {
      out.custom_fields = null;
    }
  }

  return out;
}

export default function JsonCardImporter({ deckId, onDone }) {
  const [jsonText, setJsonText] = React.useState("");
  const [parsed, setParsed] = React.useState([]);
  const [error, setError] = React.useState("");
  const [isValid, setIsValid] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [stats, setStats] = React.useState({ created: 0, updated: 0, skipped: 0 });
  const [message, setMessage] = React.useState("");
  const [sampleCount, setSampleCount] = React.useState(3);
  const [treatNumericIdAsNumber, setTreatNumericIdAsNumber] = React.useState(true);


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

  const runImport = async () => {
    if (!deckId) {
      setError("Please select a deck first.");
      return;
    }
    if (!isValid || parsed.length === 0) {
      setError("Validate JSON first.");
      return;
    }
    setIsRunning(true);
    setMessage("Preparing import…");
    setStats({ created: 0, updated: 0, skipped: 0 });

    try {
      // Load existing cards and index by id/number/name
      const existing = await CardEntity.filter({ deck_id: deckId });
      const byId = new Map();
      const byNumber = new Map();
      const byName = new Map();
      for (const c of existing) {
        if (c.id) byId.set(String(c.id), c);
        if (c.number != null) byNumber.set(Number(c.number), c);
        if (c.name) byName.set(String(c.name).trim().toLowerCase(), c);
      }

      let created = 0, updated = 0, skipped = 0;
      for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i] || {};
        
        // CRITICAL: Determine the intended card name FIRST (title > name > id)
        const intendedName = (row.title || row.name || row.card_name || (row.id ? `Card ${row.id}` : null));
        const nameKey = intendedName ? String(intendedName).trim().toLowerCase() : null;
        
        // Determine card number
        const numVal = row.number != null && row.number !== "" ? Number(row.number) : 
                       (row.id != null && typeof row.id === 'number' ? Number(row.id) : null);

        // Resolve target card
        let target =
          (numVal != null && !Number.isNaN(numVal) && byNumber.get(numVal)) ||
          (nameKey && byName.get(nameKey)) ||
          null;

        try {
          if (target) {
            const updatePayload = sanitizeForUpdate(row);
            if (Object.keys(updatePayload).length === 0) {
              skipped++;
            } else {
              try {
                await CardEntity.update(target.id, updatePayload);
                updated++;
              } catch (err) {
                if (err?.response?.status === 404) {
                  const createPayload = sanitizeForCreate(row, deckId);
                  if (!createPayload.name) {
                    createPayload.name = intendedName || `Card ${i + 1}`;
                  }
                  await CardEntity.create(createPayload);
                  created++;
                } else if (err?.response?.status === 403) {
                  throw new Error("This deck appears to be read-only. You cannot modify official/public decks you don't own.");
                } else {
                  throw err;
                }
              }
            }
          } else {
            if (!intendedName) {
              skipped++;
            } else {
              const createPayload = sanitizeForCreate(row, deckId);
              if (!createPayload.name) createPayload.name = String(intendedName).trim();
              await CardEntity.create(createPayload);
              created++;
            }
          }
        } catch (rowErr) {
          skipped++;
          console.error("Import row failed:", rowErr);
          if (rowErr?.message?.includes("read-only")) {
            setError("This deck is read-only. Please copy it to your personal space or create a new deck to import into.");
            break;
          }
        }

        if ((i + 1) % 5 === 0) {
          setMessage(`Processed ${i + 1}/${parsed.length}…`);
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      setStats({ created, updated, skipped });
      setMessage("Done.");
      onDone && onDone();
    } catch (e) {
      const code = e?.response?.status;
      if (code === 403) {
        setError("Import failed: deck is read-only. Please import into a deck you own.");
      } else if (code === 404) {
        setError("Import failed with 404. Tip: enable 'Treat numeric id as number' if your JSON uses 'id' for the card number.");
      } else {
        setError("Import failed: " + (e?.message || "Unknown error"));
      }
    } finally {
      setIsRunning(false);
    }
  };

  const sample = parsed.slice(0, sampleCount);

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-col sm:flex-row gap-3">
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Paste an array of card objects. E.g. [{"title":"Brain Fog Bonanza","id":1,"upright":"...","reverse":"...","science_slip":"..."}]'
          className="flex-1 min-h-[180px] bg-black/40 border-white/20"
        />
        <div className="w-full sm:w-64 space-y-3">
          <Button onClick={handleValidate} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Validate JSON
          </Button>
          <div className="flex items-center justify-between gap-2 px-2 py-2 bg-white/5 rounded border border-white/10">
            <Label htmlFor="numeric-id" className="text-xs text-white/80">
              Treat numeric "id" as number
            </Label>
            <Switch
              id="numeric-id"
              checked={treatNumericIdAsNumber}
              onCheckedChange={setTreatNumericIdAsNumber}
            />
          </div>
          <Button
            onClick={runImport}
            disabled={!isValid || isRunning || !deckId}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing…
              </>
            ) : (
              "Run Import"
            )}
          </Button>
          <div className="text-xs text-white/70">
            Status: {message || (isValid ? "Valid JSON ready." : "Waiting for validation…")}
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="pt-2 border-t border-white/10">
            <label className="text-xs text-white/70">Preview first N items</label>
            <Input
              type="number"
              min={0}
              max={50}
              value={sampleCount}
              onChange={(e) => setSampleCount(Math.max(0, Number(e.target.value) || 0))}
              className="bg-black/40 border-white/20 mt-1"
            />
          </div>

          <div className="pt-2 border-t border-white/10 text-xs">
            <div>Created: {stats.created}</div>
            <div>Updated: {stats.updated}</div>
            <div>Skipped: {stats.skipped}</div>
          </div>
        </div>
      </div>

      {isValid && sample.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-md p-3">
          <div className="text-sm font-semibold mb-2">Sample preview (showing how fields will map):</div>
          {sample.map((card, idx) => (
            <div key={idx} className="mb-3 p-2 bg-black/20 rounded border border-white/5">
              <div className="text-xs text-emerald-300">
                ✓ Card {idx + 1}: <strong>{card.title || card.name || `Card ${card.id}`}</strong>
              </div>
              <div className="text-xs text-white/60 mt-1">
                {card.number !== undefined && <div>Number: {card.number}</div>}
                {card.id !== undefined && typeof card.id === 'number' && <div>Number (from id): {card.id}</div>}
                {card.upright && <div>Upright: {card.upright.slice(0, 50)}...</div>}
                {card.reverse && <div>Reversed: {card.reverse.slice(0, 50)}...</div>}
                {card.science_slip && <div>Ancient Wisdom: {card.science_slip.slice(0, 50)}...</div>}
                {card.type && <div>Type (in custom notes): {card.type}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}