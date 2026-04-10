import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea }
 from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card as CardEntity } from "@/entities/Card";
import { Spread } from "@/entities/Spread";
import { Deck } from "@/entities/Deck";
import { Loader2, FileJson, ListPlus, CheckCircle2, AlertTriangle } from "lucide-react";
import { InvokeLLM, GenerateImage } from "@/integrations/Core";

// START: Inlined from "@/components/deck/cardFields.ts"
export const CARD_FIELD_WHITELIST = new Set([
  "name",
  "subtitle",
  "number",
  "element",
  "keywords",
  "image_url",
  "video_url",
  "frame_style",
  "ancient_wisdom",
  "overall_meaning",
  "upright_meaning",
  "upright_insight",
  "upright_action",
  "reversed_meaning",
  "reversed_insight",
  "reversed_action",
  "interaction",
  "musician_quote",
  "facedown_meaning",
  "history",
  "ai_image_prompt",
  "ai_image_negative_prompt",
  "ai_prompt_style",
  "ai_prompt_metadata",
  "ai_reference_image_url",
  "custom", // For custom AI notes
  // Custom fields are handled separately as an object, not individual whitelisted keys.
]);
// END: Inlined from "@/components/deck/cardFields.ts"


// START: Inlined from "./importSanitizer.ts"

// Shared helpers from original CombinedImporter.tsx, now moved to importSanitizer context
function clean(s) {
  return String(s || "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function replaceSmartQuotes(s = "") {
  return String(s).replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function fixBrokenApostrophes(s = "") {
  let out = String(s);
  out = out.replace(/([A-Za-z])"\s*s\b/g, "$1's");
  out = out.replace(/([A-Za-z])"\s+([A-Za-z])/g, "$1' $2");
  return out;
}

function stripTrailingBrace(s = "") {
  return String(s).replace(/(\]\s*)}\s*$/s, "$1");
}

function wrapArrayAsCardsObjectIfNeeded(s = "") {
  const t = s.trim();
  if (t.startsWith("[") && t.endsWith("]")) {
    return `{"cards": ${t}}`;
  }
  if (t.startsWith("[") && /\]\s*}\s*$/.test(t)) {
    const cleaned = stripTrailingBrace(t);
    return `{"cards": ${cleaned}}`;
  }
  return s;
}

function normalizeLooseJson(raw) {
  if (!raw) return "";
  let s = String(raw);

  s = s.replace(/([{,]\s*)([A-Za-z_][\w]*)\s*:/g, '$1"$2":');
  s = s.replace(/'([^']*)'/g, '"$1"');

  s = s.replace(/("keywords"\s*:\s*)(?!\[)([^,\n}\]]+)/g, (m, p1, p2) => {
    const items = p2.split(',').map(item => {
      const trimmed = item.trim();
      if (/^".*"$/.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed) || /^(true|false|null)$/i.test(trimmed)) {
        return trimmed;
      }
      return `"${trimmed}"`;
    }).join(', ');
    return `${p1}[${items}]`;
  });

  s = s.replace(/\[([^\[\]]*?)\]/gs, (m, inner) => {
    const parts = inner.split(/,(?![^\[]*\])(?![^{]*})/).map(t => t.trim()).filter(Boolean);
    const fixed = parts.map(t => {
      if (/^".*"$/.test(t) || /^-?\d+(\.\d+)?$/.test(t) || /^(true|false|null)$/i.test(t) || t.startsWith("{") || t.startsWith("[") || t.startsWith('"')) {
        return t;
      }
      return `"${t.replace(/^"|"$/g, '').replace(/"/g, '\\"')}"`;
    });
    return `[${fixed.join(", ")}]`;
  });

  s = s.replace(/:\s*([^,"{}\[\]\s][^,}\]]*)/g, (m, val) => {
    const v = val.trim();
    if (/^-?\d+(\.\d+)?$/.test(v) || /^(true|false|null)$/i.test(v) || v.startsWith("{") || v.startsWith("[") || v.startsWith('"')) return `: "${v}"`;
    return `: "${v}"`;
  });

  s = s.replace(/,\s*([}\]])/g, "$1");
  return s.trim();
}

function unwrapQuotedObjects(raw) {
  if (!raw) return "";
  return String(raw).replace(/"\s*\{([\s\S]*?)\}\s*"/g, "{$1}");
}

function mergeAdjacentQuotedStrings(s) {
  if (!s) return "";
  let out = String(s);
  let prev;
  do {
    prev = out;
    out = out.replace(/"([^"]+)"\s*,\s*"([^"]+)"/g, '"$1 $2"');
  } while (out !== prev);
  return out;
}

function parseCardStringToObject(str) {
  if (typeof str !== "string") return null;
  let t = str;
  t = replaceSmartQuotes(t);
  t = fixBrokenApostrophes(t);
  t = mergeAdjacentQuotedStrings(t);
  t = normalizeLooseJson(t);
  if (!/^\s*\{[\s\S]*\}\s*$/.test(t)) {
    t = `{${t}}`;
  }
  try {
    const obj = JSON.parse(t);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function salvageArrayOfObjects(raw) {
  if (!raw) return null;
  let s = String(raw);

  s = replaceSmartQuotes(s);

  const firstBracket = s.indexOf("[");
  const lastBracket = s.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) return null;

  let inside = s.slice(firstBracket + 1, lastBracket);
  inside = unwrapQuotedObjects(inside).replace(/""/g, '"');

  const parts = inside
    .split(/}\s*,\s*(?=\s*\{)/g)
    .map((chunk) => {
      let c = chunk.trim();
      if (!c) return null;
      if (!c.startsWith("{")) c = "{" + c;
      if (!c.endsWith("}")) c = c + "}";
      return c;
    })
    .filter(Boolean);

  const items = parts.map(parseCardStringToObject).filter(Boolean);
  return items.length ? items : null;
}

function extractFirstJsonObject(text) {
  const s = String(text || "");
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let prev = "";
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && prev !== "\\") inStr = !inStr;
    if (!inStr) {
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    prev = ch;
  }
  return null;
}

function normalizeIncomingCard(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = { ...raw };
  if (!c.name && c.title) c.name = String(c.title);
  if (!c.overall_meaning && c.subtitle) c.overall_meaning = String(c.subtitle);
  if (!c.upright_meaning && c.upright) c.upright_meaning = String(c.upright);
  if (!c.reversed_meaning && (c.reverse || c.reversed)) c.reversed_meaning = String(c.reverse || c.reversed);
  if (!c.custom && c.custom_notes) c.custom = String(c.custom_notes);
  if (c.number != null) c.number = Number(c.number);
  if (Array.isArray(c.keywords)) c.keywords = c.keywords.map(String);
  return c;
}

// NEW FUNCTION as per outline
function extractCardsFromText(inputText) {
  const warnings = [];
  let t = String(inputText || "");

  // Apply initial text fixers first
  t = clean(t);
  t = replaceSmartQuotes(t);
  t = fixBrokenApostrophes(t);
  t = stripTrailingBrace(t);
  t = wrapArrayAsCardsObjectIfNeeded(t);

  // Map common synonyms (these regexes operate on the raw string before JSON.parse)
  t = t.replace(/\bpersona_prompt\b\s*:/g, 'persona:');
  t = t.replace(/\bdeck_name\b\s*:/g, 'name:');

  let obj = null;

  try {
    obj = JSON.parse(t);
  } catch (e1) {
    const fixedLoose = normalizeLooseJson(t);
    try {
      obj = JSON.parse(fixedLoose);
    } catch (e2) {
      const salvagedItems = salvageArrayOfObjects(t);
      if (salvagedItems) {
        obj = { cards: salvagedItems };
      } else {
        const cardsMatch = t.match(/"cards"\s*:\s*(\[[\s\S]*?\])/) || t.match(/"card_definitions"\s*:\s*(\[[\s\S]*?\])/);
        const spreadsMatch = t.match(/"spreads"\s*:\s*(\[[\s\S]*?\])/);
        if (cardsMatch || spreadsMatch) {
          const salvage = {};
          if (cardsMatch) {
            try { salvage.cards = JSON.parse(cardsMatch[1].replace(/,\s*]/g, "]")); }
            catch (e) { warnings.push(`Could not parse cards array: ${e.message}`); }
          }
          if (spreadsMatch) {
            try { salvage.spreads = JSON.parse(spreadsMatch[1].replace(/,\s*]/g, "]")); }
            catch (e) { warnings.push(`Could not parse spreads array: ${e.message}`); }
          }
          obj = salvage;
        } else {
          const firstObj = extractFirstJsonObject(t);
          obj = firstObj ? JSON.parse(firstObj) : null;
          if (!obj) {
            warnings.push(`Could not parse text as JSON or extract a recognizable object structure. Parsing error: ${e1.message || "Unknown error"}.`);
            return { cards: [], warnings, fullParsedObject: null };
          }
        }
      }
    }
  }

  let rawParsedCards = [];
  if (Array.isArray(obj)) {
    rawParsedCards = obj;
  } else if (obj && Array.isArray(obj.cards)) {
    rawParsedCards = obj.cards;
  } else if (obj && Array.isArray(obj.card_definitions)) {
    rawParsedCards = obj.card_definitions;
  } else if (obj && typeof obj === "object" && !obj.cards && !obj.spreads && !obj.card_definitions && Object.keys(obj).length > 0) {
    // If it's a single object that looks like a card (and not just a spreads wrapper)
    rawParsedCards = [obj];
  }

  rawParsedCards = rawParsedCards
    .map(item => typeof item === "string" ? parseCardStringToObject(item) : item)
    .filter(Boolean);

  // Apply normalizeIncomingCard for card-level field mappings
  const cards = rawParsedCards.map(normalizeIncomingCard).filter(Boolean);

  return { cards, warnings, fullParsedObject: obj };
}

// NEW FUNCTION as per outline
function mapCustomFieldShorthand(card) {
  if (!card || typeof card !== "object") return card;
  const newCard = { ...card };
  if (!newCard.custom_fields) {
    newCard.custom_fields = {};
  }

  const customFieldMappings = {
    "hard_truth": { label: "Hard Truth", category: "scripture" },
    "core_vulnerability": { label: "Core Vulnerability", category: "other" },
    "strength_for_growth": { label: "Strength for Growth", category: "other" },
  };

  for (const key in customFieldMappings) {
    if (Object.prototype.hasOwnProperty.call(newCard, key) && newCard[key] !== undefined && newCard[key] !== null && newCard[key] !== "") {
      newCard.custom_fields[key] = {
        label: customFieldMappings[key].label,
        value: String(newCard[key]),
        category: customFieldMappings[key].category,
      };
      delete newCard[key]; // Remove the top-level key after moving
    }
  }

  // Handle a generic `custom_fields` object already present in the source card
  if (card.custom_fields && typeof card.custom_fields === "object") {
    Object.entries(card.custom_fields).forEach(([k, cfg]) => {
      if (cfg && (cfg.value !== undefined || cfg.label !== undefined)) {
        newCard.custom_fields[k] = {
          label: String(cfg.label || k),
          value: String(cfg.value || ""),
          category: String(cfg.category || "other")
        };
      }
    });
  }

  return newCard;
}

// NEW FUNCTION as per outline
function normalizeImportedCards(rawText) {
  const { cards: extractedCards, warnings, fullParsedObject } = extractCardsFromText(rawText);
  const normalized = extractedCards.map(mapCustomFieldShorthand);
  return { cards: normalized, warnings, fullParsedObject };
}
// END: Inlined from "./importSanitizer.ts"


// Add these helpers near the top of the file (after imports)
function buildPlaceholderForCard(card = {}) {
  // 600x900 portrait placeholder with readable text
  const label = [`#${card.number ?? ""}`, card.name || "Card Image"].join(" ").trim();
  return `https://placehold.co/600x900/png?text=${encodeURIComponent(label)}`;
}

// Cross-origin safe image validation using Image() with timeout
function validateImageUrl(url, timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (!url || typeof url !== "string") return resolve(false);
    const img = new Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve(!!ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      finish(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };
    img.src = url;
  });
}

async function ensureCardImageUrl(card, shouldValidate) {
  if (!shouldValidate) {
    // If not validating, just pass through or create placeholder when missing
    return card.image_url || buildPlaceholderForCard(card);
  }
  if (!card.image_url) {
    return buildPlaceholderForCard(card);
  }
  const ok = await validateImageUrl(card.image_url);
  return ok ? card.image_url : buildPlaceholderForCard(card);
}

function isPlaceholderUrl(url) {
  return typeof url === "string" && /placehold\.co/.test(url);
}

function toArrayMaybe(obj) {
  if (!obj) return [];
  return Array.isArray(obj) ? obj : [obj];
}

function coerceNumber(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function autoLayoutPositions(positions) {
  const n = positions.length || 1;
  const cx = 50;
  const cy = 50;
  const r = n <= 3 ? 20 : n <= 6 ? 28 : n <= 10 ? 34 : 40;
  return positions.map((p, i) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2;
    const x = Math.round(cx + r * Math.cos(theta));
    const y = Math.round(cy + r * Math.sin(theta));
    return { ...p, x, y };
  });
}

function normalizePosition(raw) {
  if (typeof raw === "string") {
    return { name: raw, meaning: raw, x: undefined, y: undefined };
  }
  if (!raw || typeof raw !== "object") return { name: "Position", meaning: "", x: undefined, y: undefined };

  const nameFromNumber = raw.number != null ? `Position ${raw.number}` : undefined;
  const name = raw.name || raw.title || raw.position || nameFromNumber || "Position";
  const meaning = raw.meaning || raw.description || raw.prompt || raw.question || "";

  let x = raw.x ?? raw.left ?? raw.pos_x ?? raw.posX;
  let y = raw.y ?? raw.top ?? raw.pos_y ?? raw.posY;

  if ((x === undefined || y === undefined) && raw.pos && typeof raw.pos === "object") {
    if (Array.isArray(raw.pos)) {
      x = raw.pos[0];
      y = raw.pos[1];
    } else {
      x = raw.pos.x ?? x;
      y = raw.pos.y ?? y;
    }
  }

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

  const rawPositions =
    raw.positions ||
    raw.cards ||
    raw.slots ||
    raw.points ||
    raw.spots ||
    [];

  const normalized = toArrayMaybe(rawPositions).map(normalizePosition);
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

// Add helper near other helpers
function firstNonEmptyString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

const ELEMENTS = ["air", "fire", "water", "earth", "spirit", "none"];

// Extended mapToCard function now assumes initial normalization by importSanitizer
function mapToCard(src, deckId, globalCustom) {
  if (!src || typeof src !== "object") return null;

  const out = { deck_id: deckId };

  // Core fields with synonym mapping
  out.name = firstNonEmptyString(src.name, src.title, src.card_name);
  out.subtitle = firstNonEmptyString(src.subtitle, src.short_description, src.tagline);
  out.number = src.number != null ? Number(src.number) : (src.card_number != null ? Number(src.card_number) : undefined);
  if (isNaN(out.number)) delete out.number;
  
  // Element
  const el = (src.element || "").toString().toLowerCase();
  if (ELEMENTS.includes(el)) {
    out.element = el;
  }

  // Keywords - handle string or array
  if (src.keywords) {
    if (Array.isArray(src.keywords)) {
      out.keywords = src.keywords.map(String).filter(Boolean);
    } else if (typeof src.keywords === "string") {
      out.keywords = src.keywords.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
  }

  // CRITICAL: Map all meaning fields with synonyms
  out.overall_meaning = firstNonEmptyString(
    src.overall_meaning,
    src.theme,
    src.meaning,
    src.description,
    src.summary
  );

  out.upright_meaning = firstNonEmptyString(
    src.upright_meaning,
    src.upright,
    src.upright_description,
    src.positive_meaning
  );

  out.upright_insight = firstNonEmptyString(
    src.upright_insight,
    src.upright_message,
    src.upright_guidance
  );

  out.upright_action = firstNonEmptyString(
    src.upright_action,
    src.upright_advice,
    src.upright_steps
  );

  out.reversed_meaning = firstNonEmptyString(
    src.reversed_meaning,
    src.reversed,
    src.reverse,
    src.reverse_meaning,
    src.reversed_description,
    src.negative_meaning
  );

  out.reversed_insight = firstNonEmptyString(
    src.reversed_insight,
    src.reversed_message,
    src.reversed_guidance,
    src.reverse_insight
  );

  out.reversed_action = firstNonEmptyString(
    src.reversed_action,
    src.reversed_advice,
    src.reversed_steps,
    src.reverse_action
  );

  out.interaction = firstNonEmptyString(
    src.interaction,
    src.card_combinations,
    src.interactions,
    src.with_other_cards
  );

  out.ancient_wisdom = firstNonEmptyString(
    src.ancient_wisdom,
    src.history,
    src.traditional_meaning,
    src.esoteric_meaning
  );

  out.musician_quote = firstNonEmptyString(
    src.musician_quote,
    src.quote,
    src.wisdom_quote
  );

  out.facedown_meaning = firstNonEmptyString(
    src.facedown_meaning,
    src.hidden_meaning,
    src.face_down
  );

  // Custom/AI notes - combine if needed
  const customParts = [
    src.custom,
    src.custom_notes,
    src.custom_ai_notes,
    src.custom_ai_helper,
    src.notes,
    src.ai_notes
  ].filter(s => s && String(s).trim());
  
  if (customParts.length > 0) {
    out.custom = customParts.join("\n\n");
  } else if (globalCustom) {
    out.custom = globalCustom;
  }

  // Image/media URLs
  out.image_url = firstNonEmptyString(src.image_url, src.image, src.img_url, src.card_image);
  out.video_url = firstNonEmptyString(src.video_url, src.video, src.audio_url);
  out.frame_style = firstNonEmptyString(src.frame_style, src.frame);

  // AI prompt fields - NOW WITH image_generate_prompt support!
  out.ai_image_prompt = firstNonEmptyString(
    src.ai_image_prompt,
    src.image_generate_prompt,
    src.image_prompt,
    src.ai_prompt,
    src.prompt
  );

  out.ai_image_negative_prompt = firstNonEmptyString(
    src.ai_image_negative_prompt,
    src.negative_prompt,
    src.image_negative_prompt
  );

  out.ai_prompt_style = firstNonEmptyString(
    src.ai_prompt_style,
    src.ai_style,
    src.style,
    src.style_tags
  );

  out.ai_reference_image_url = firstNonEmptyString(
    src.ai_reference_image_url,
    src.reference_image_url,
    src.seed_image_url,
    src.style_reference_image
  );

  // Ensure top-level ai_prompt_metadata is copied
  if (src.ai_prompt_metadata && typeof src.ai_prompt_metadata === "object") {
    out.ai_prompt_metadata = { ...(out.ai_prompt_metadata || {}), ...src.ai_prompt_metadata };
  }

  // AI nested object support (fills in if top-level fields are empty)
  if (src.ai_image && typeof src.ai_image === "object") {
    const ai = src.ai_image;
    out.ai_image_prompt = out.ai_image_prompt || firstNonEmptyString(ai.prompt, ai.image_prompt, ai.text);
    out.ai_image_negative_prompt = out.ai_image_negative_prompt || firstNonEmptyString(ai.negative_prompt, ai.negativePrompt);
    out.ai_prompt_style = out.ai_prompt_style || firstNonEmptyString(ai.style, ai.style_tags, ai.styleTags);
    out.ai_reference_image_url = out.ai_reference_image_url || firstNonEmptyString(ai.reference_image_url, ai.seed_image_url, ai.ref_image, ai.image_ref);

    const { prompt, image_prompt, text, negative_prompt, negativePrompt, style, style_tags, styleTags, reference_image_url, seed_image_url, ref_image, image_ref, ...rest } = ai;
    if (Object.keys(rest || {}).length > 0) {
      out.ai_prompt_metadata = { ...(out.ai_prompt_metadata || {}), ...rest }; // Merge rest from ai_image
    }
  }

  // Custom fields
  if (src.custom_fields && typeof src.custom_fields === "object") {
    out.custom_fields = { ...src.custom_fields };
  }

  // Only return if we have at least a name
  return out.name ? out : null;
}

async function generatePromptForCardViaLLM(card, deckName) {
  const prompt = [
    "Write a concise AI image prompt for this tarot/oracle card.",
    "Max ~220 chars; vivid subject + setting + lighting + mood + composition. No artist names.",
    `Deck: ${deckName || "Unknown Deck"}`,
    `Card: #${card.number ?? "?"} ${card.name}`,
    card.keywords?.length ? `Keywords: ${card.keywords.join(", ")}` : "",
    card.overall_meaning ? `Theme: ${card.overall_meaning}` : "",
    card.upright_meaning ? `Upright: ${card.upright_meaning}` : "",
    card.reversed_meaning ? `Reversed: ${card.reversed_meaning}` : "",
    "Output JSON with fields: prompt, negative_prompt, style"
  ].filter(Boolean).join("\n");

  const { data } = await InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        negative_prompt: { type: "string" },
      style: { type: "string" }
      },
      required: ["prompt"]
    }
  });

  return {
    ai_image_prompt: data?.prompt || "",
    ai_image_negative_prompt: data?.negative_prompt || "",
    ai_prompt_style: data?.style || ""
  };
}

async function ensureCardsHavePrompts(dataObj, deckName) {
  let cardsArray = [];
  let isRootArray = Array.isArray(dataObj);

  if (isRootArray) {
    cardsArray = dataObj;
  } else if (dataObj && Array.isArray(dataObj.cards)) {
    cardsArray = dataObj.cards;
  }
  if (!cardsArray.length) return dataObj;

  const result = [...cardsArray];
  for (let i = 0; i < result.length; i++) {
    const c = result[i] || {};
    // Only generate if ai_image_prompt is missing or empty
    const hasPrompt = c.ai_image_prompt && String(c.ai_image_prompt).trim();
    if (!hasPrompt) {
      const gen = await generatePromptForCardViaLLM(c, deckName);
      result[i] = { ...c, ...gen };
      // small delay to be gentle on the LLM API
      await new Promise(r => setTimeout(r, 150));
    }
  }

  if (isRootArray) return result;
  return { ...dataObj, cards: result };
}

const CRESCENT_SKELETON = `[
  {
    "number": 1,
    "title": "CARD TITLE",
    "subtitle": "Overall theme or short description.",
    "upright": "Upright meaning in 1-2 sentences.",
    "reverse": "Reversed meaning in 1 sentence.",
    "custom_notes": "Optional notes (e.g., linked hexagram).",
    "keywords": ["tag1", "tag2", "tag3"]
  }
]`;


const DEFAULT_ASPECT_RATIO = "9:16";

function sanitizePromptAspectRatio(text = "", ratio = DEFAULT_ASPECT_RATIO) {
  let s = String(text || "");
  s = s
    .replace(/(^|\n)\s*Aspect\s*ratio\s*:\s*\d+\s*:\s*\d+\s*/gi, "$1")
    .replace(/(^|\n)\s*--?ar\s*\d+\s*:\s*\d+\s*/gi, "$1")
    .replace(/\bar\s*\d+\s*:\s*\d+\b/gi, "")
    .replace(/\b\d+\s*:\s*\d+\s*ratio\b/gi, "")
    .replace(/\bportrait\s*\d+\s*:\s*\d+\b/gi, "")
    .replace(/\b\d+\s*x\s*\d+\b/gi, "")
    .replace(/\b(9\s*:\s*16|16\s*:\s*9|4\s*:\s*5|3\s*:\s*4|3\s*:\s*2|1\s*:\s*1)\b/gi, "");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  const arHeader = `Generate a vertical portrait image in exact ${ratio} aspect ratio (full frame, no borders, no letterboxing).`;
  const arFlag = `--ar ${ratio}`;
  const arLine = `Aspect ratio: ${ratio}`;
  return [arHeader, s, arFlag, arLine].filter(Boolean).join("\n").trim();
}


export default function CombinedImporter({ deckId, isOpen, onClose, onImportComplete }) {
  const [rawText, setRawText] = React.useState("");
  const [parseError, setParseError] = React.useState("");
  const [parseWarnings, setParseWarnings] = React.useState([]); // NEW: State for parsing warnings
  const [cards, setCards] = React.useState([]);
  const [spreads, setSpreads] = React.useState([]);
  const [importCards, setImportCards] = React.useState(true);
  const [importSpreads, setImportSpreads] = React.useState(true);
  const [isParsing, setIsParsing] = React.useState(false);

  const [validateAndPlaceholder, setValidateAndPlaceholder] = React.useState(true);
  const [autoGeneratePrompts, setAutoGeneratePrompts] = React.useState(false);
  const [autoGenerateImages, setAutoGenerateImages] = React.useState(false);

  const [isImporting, setIsImporting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [summary, setSummary] = React.useState(null);

  const [deckName, setDeckName] = React.useState("");
  const [existingStats, setExistingStats] = React.useState({ existing: 0, toCreate: 0 });

  React.useEffect(() => {
    if (!isOpen) {
      setRawText("");
      setParseError("");
      setParseWarnings([]); // Clear warnings on close
      setCards([]);
      setSpreads([]);
      setImportCards(true);
      setImportSpreads(true);
      setIsParsing(false);
      setIsImporting(false);
      setProgress(0);
      setSummary(null);
      setValidateAndPlaceholder(true);
      setAutoGeneratePrompts(false);
      setAutoGenerateImages(false);
      setDeckName("");
      setExistingStats({ existing: 0, toCreate: 0 });
      return;
    }
    (async () => {
      try {
        const d = deckId ? await Deck.get(deckId) : null;
        setDeckName(d?.name || "");
      } catch {
        setDeckName("");
      }
    })();
  }, [isOpen, deckId]);


  async function prepareCardsWithImageUrls(dataObj) {
    let cardsArray = [];
    let isRootArray = Array.isArray(dataObj);

    if (isRootArray) {
      cardsArray = dataObj;
    } else if (dataObj && Array.isArray(dataObj.cards)) {
      cardsArray = dataObj.cards;
    } else {
      return dataObj;
    }

    if (!cardsArray.length) return dataObj;

    const concurrency = 6;
    let idx = 0;
    const processed = new Array(cardsArray.length);

    async function worker() {
      while (idx < cardsArray.length) {
        const myIdx = idx++;
        const c = cardsArray[myIdx] || {};
        const ensuredUrl = await ensureCardImageUrl(c, validateAndPlaceholder);
        processed[myIdx] = { ...c, image_url: ensuredUrl };
      }
    }
    const workers = Array.from({ length: Math.min(concurrency, cardsArray.length) }, () => worker());
    await Promise.all(workers);

    if (isRootArray) {
      return processed;
    }
    return { ...dataObj, cards: processed };
  }

  // Refactored parseText to use normalizeImportedCards and apply whitelist
  const parseText = async (inputText) => {
    setIsParsing(true);
    setParseError("");
    setParseWarnings([]); // Clear warnings at the start of new parse
    setCards([]);
    setSpreads([]);
    setExistingStats({ existing: 0, toCreate: 0 });

    try {
      // Use the new normalization function from importSanitizer
      // preFilteredCards contains all fields, with basic normalization and shorthand custom_fields applied
      const { cards: preFilteredCards, warnings, fullParsedObject } = normalizeImportedCards(inputText);
      setParseWarnings(warnings); // Set any warnings from the parsing process

      // Build global notes (include persona/persona_prompt/name if provided) from fullParsedObject
      const globalCustom = [
        fullParsedObject?.persona ? `Persona: ${fullParsedObject.persona}` : null,
        fullParsedObject?.persona_prompt ? `Persona Prompt: ${fullParsedObject.persona_prompt}` : null,
        fullParsedObject?.name || fullParsedObject?.deck_definition?.name ? `Deck: ${fullParsedObject.name || fullParsedObject?.deck_definition?.name}` : null,
        fullParsedObject?.description || fullParsedObject?.deck_definition?.description ? `Description: ${fullParsedObject.description || fullParsedObject?.deck_definition?.description}` : null,
        fullParsedObject?.notes ? `Notes: ${fullParsedObject.notes}` : null
      ].filter(Boolean).join("\n");

      // Apply mapToCard to the pre-filtered cards.
      // `mapToCard` now handles comprehensive field mapping, synonym resolution, and global custom notes.
      const mappedCards = preFilteredCards.map(c => mapToCard(c, deckId, globalCustom || undefined)).filter(Boolean);

      // Now, continue with existing logic for image URLs, AI prompts, spreads, and stats.
      let processedCardsForImages = await prepareCardsWithImageUrls({ cards: mappedCards });

      if (autoGeneratePrompts) {
        const deckNameHint =
          fullParsedObject?.deck?.name ||
          fullParsedObject?.deck_definition?.name ||
          fullParsedObject?.name ||
          fullParsedObject?.deck_name ||
          deckName ||
          "";
        const finalCardsPayload = await ensureCardsHavePrompts(processedCardsForImages, deckNameHint);
        setCards(Array.isArray(finalCardsPayload) ? finalCardsPayload : (finalCardsPayload.cards || []));
      } else {
        setCards(Array.isArray(processedCardsForImages) ? processedCardsForImages : (processedCardsForImages.cards || []));
      }

      const rawSpreads = toArrayMaybe(fullParsedObject?.spreads); // Get spreads from fullParsedObject
      const mappedSpreads = rawSpreads.map((s) => normalizeSpread(s, deckId, "General")).filter(Boolean);
      setSpreads(mappedSpreads);

      // Compute duplicate stats by name against existing deck content
      try {
        const existing = await CardEntity.filter({ deck_id: deckId });
        const existingNames = new Set(existing.map((c) => (c.name || "").toLowerCase()));
        const toCreate = mappedCards.filter((c) => !existingNames.has((c.name || "").toLowerCase())).length;
        const existingCount = mappedCards.length - toCreate;
        setExistingStats({ existing: existingCount, toCreate });
      } catch (e) {
        setExistingStats({ existing: 0, toCreate: mappedCards.length });
        console.error("Failed to compute existing card stats:", e);
      }
    } catch (e) {
      setParseError(`Failed to process input. ${e.message || ""}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleParse = async () => {
    await parseText(rawText);
  };

  const handleAutoFixAndParse = async () => {
    setIsParsing(true);
    let fixed = String(rawText || "");

    // Apply specific text fixers
    fixed = replaceSmartQuotes(fixed);
    fixed = fixBrokenApostrophes(fixed);
    fixed = stripTrailingBrace(fixed);
    fixed = wrapArrayAsCardsObjectIfNeeded(fixed);

    fixed = unwrapQuotedObjects(fixed);
    fixed = fixed.replace(/""/g, '"');
    fixed = mergeAdjacentQuotedStrings(fixed);
    fixed = normalizeLooseJson(fixed);
    fixed = fixed.trim();

    setRawText(fixed);
    await parseText(fixed);
  };

  const insertSkeleton = () => {
    setRawText(CRESCENT_SKELETON);
  };

  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const handleImport = async () => {
    setIsImporting(true);
    setSummary(null);
    setProgress(0);

    let createdCards = 0;
    let createdSpreads = 0;
    let failedCards = 0;
    let failedSpreads = 0;
    const failures = [];

    const willImportCards = importCards && cards.length > 0;
    const willImportSpreads = importSpreads && spreads.length > 0;

    try {
      if (willImportCards) {
        const existing = await CardEntity.filter({ deck_id: deckId });
        const existingNames = new Set(existing.map((c) => (c.name || "").toLowerCase()));
        const toCreateCards = cards.filter((c) => !existingNames.has((c.name || "").toLowerCase()));

        if (autoGenerateImages) {
          const genConcurrency = 3;
          let genIdx = 0;
          async function genWorker() {
            while (genIdx < toCreateCards.length) {
              const i = genIdx++;
              const c = toCreateCards[i];
              const hasNoRealImage = !c.image_url || isPlaceholderUrl(c.image_url);
              const basePrompt = (c.ai_image_prompt && String(c.ai_image_prompt).trim()) || "";

              if (hasNoRealImage && basePrompt) {
                try {
                  let promptToSanitize = basePrompt;
                  if (c.ai_prompt_style) {
                    promptToSanitize += `\nStyle: ${c.ai_prompt_style}`;
                  }
                  if (c.ai_image_negative_prompt) {
                    promptToSanitize += `\nNegative prompt: ${c.ai_image_negative_prompt}`;
                  }
                  
                  const finalPrompt = sanitizePromptAspectRatio(promptToSanitize, DEFAULT_ASPECT_RATIO);

                  const { url } = await GenerateImage({ prompt: finalPrompt });
                  if (url) {
                    c.image_url = url;
                  }
                } catch (e) {
                  failures.push(`Image generation failed for "${c.name}": ${e.message || "Unknown error"}`);
                }
                await new Promise(r => setTimeout(r, 150));
              }
            }
          }
          const gens = Array.from({ length: Math.min(genConcurrency, toCreateCards.length) }, () => genWorker());
          await Promise.all(gens);
        }

        const batches = chunk(toCreateCards, 50);
        const cardsPhaseWeight = willImportSpreads ? 50 : 100;

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          try {
            const res = await CardEntity.bulkCreate(batch);
            createdCards += Array.isArray(res) ? res.length : batch.length;
          } catch (err) {
            failedCards += batch.length;
            failures.push(`Cards batch ${i + 1}: ${err.message || "Unknown error"}`);
          }
          const p = batches.length ? Math.round(((i + 1) / batches.length) * cardsPhaseWeight) : 0;
          setProgress(Math.min(100, p));
          await new Promise((r) => setTimeout(r, 40));
        }
      }

      if (willImportSpreads) {
        const existingSpreads = await Spread.filter({ deck_id: deckId });
        const existingSpreadNames = new Set(existingSpreads.map((s) => (s.name || "").toLowerCase()));
        const toCreateSpreads = spreads.filter((s) => !existingSpreadNames.has((s.name || "").toLowerCase()));

        const batchesS = chunk(toCreateSpreads, 25);
        const base = willImportCards ? 50 : 0;
        const spreadsPhaseWeight = 100 - base;

        for (let i = 0; i < batchesS.length; i++) {
          const batch = batchesS[i];
          try {
            const res = await Spread.bulkCreate(batch);
            createdSpreads += Array.isArray(res) ? res.length : batch.length;
          } catch (err) {
            failedSpreads += batch.length;
            failures.push(`Spreads batch ${i + 1}: ${err.message || "Unknown error"}`);
          }
          const p = batchesS.length ? base + Math.round(((i + 1) / batchesS.length) * spreadsPhaseWeight) : base;
          setProgress(Math.min(100, p));
          await new Promise((r) => setTimeout(r, 40));
        }
      }

      setProgress(100);
      setSummary({
        cards: { created: createdCards, failed: failedCards, total: cards.length },
        spreads: { created: createdSpreads, failed: failedSpreads, total: spreads.length },
        failures,
      });

      if (onImportComplete) onImportComplete();
    } finally {
      setIsImporting(false);
    }
  };

  const totalParsed = cards.length + spreads.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileJson className="w-5 h-5 text-purple-300" />
            All‑in‑One Import (Cards + Spreads)
            {deckName ? (
              <span className="ml-2 text-sm text-white/70">→ {deckName}</span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden flex-1">
          <p className="text-sm text-white/70">
            Paste a JSON object containing cards and spreads (e.g., {"{ persona, cards: [...], spreads: [...] }"}). Missing spread coordinates will be auto‑arranged in a circle.
            Extra text outside the first JSON object will be ignored.
          </p>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder='{"persona":"...","cards":[{"name":"The Fool", "image_url":"https://example.com/fool.png", "...":""}],"spreads":[{"name":"Single","positions":[{"name":"Guidance"}]}]} // Optional comments or other JSON here'
            className="bg-slate-800 border-slate-700 text-white min-h-[160px]"
          />

          {parseError && (
            <div className="text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {parseError}
            </div>
          )}

          {parseWarnings.length > 0 && (
            <div className="text-sm text-yellow-300 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Warnings during parsing:
              </div>
              <ul className="list-disc ml-5">
                {parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-white/70 flex items-center gap-2">
              <input type="checkbox" className="accent-purple-500" checked={importCards} onChange={(e) => setImportCards(e.target.checked)} />
              Import cards
            </label>
            <label className="text-xs text-white/70 flex items-center gap-2">
              <input type="checkbox" className="accent-purple-500" checked={importSpreads} onChange={(e) => setImportSpreads(e.target.checked)} />
              Import spreads
            </label>
            <Button onClick={handleParse} disabled={isParsing} className="bg-indigo-600 hover:bg-indigo-700">
              {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListPlus className="w-4 h-4 mr-2" />}
              Parse
            </Button>
            <Button onClick={handleAutoFixAndParse} disabled={isParsing} variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/20">
              {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Auto‑Fix & Parse
            </Button>
            <Button onClick={insertSkeleton} type="button" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Insert skeleton
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <input
              id="validate-images"
              type="checkbox"
              className="accent-purple-500"
              checked={validateAndPlaceholder}
              onChange={(e) => setValidateAndPlaceholder(e.target.checked)}
            />
            <label htmlFor="validate-images" className="text-white/80">
              Validate image URLs from JSON and use a placeholder if missing/broken
            </label>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <input
              id="auto-gen-prompts"
              type="checkbox"
              className="accent-purple-500"
              checked={autoGeneratePrompts}
              onChange={(e) => setAutoGeneratePrompts(e.target.checked)}
            />
            <label htmlFor="auto-gen-prompts" className="text-white/80">
              Auto-generate AI image prompts for cards missing prompts (uses LLM)
            </label>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <input
              id="auto-gen-images"
              type="checkbox"
              className="accent-purple-500"
              checked={autoGenerateImages}
              onChange={(e) => setAutoGenerateImages(e.target.checked)}
            />
            <label htmlFor="auto-gen-images" className="text-white/80">
              Auto-generate images for cards missing image_url using AI prompt
            </label>
          </div>

          {totalParsed > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Badge className="bg-white/10">Cards: {cards.length}</Badge>
                <Badge className="bg-white/10">Spreads: {spreads.length}</Badge>
              </div>

              {cards.length > 0 && (
                <div className="text-xs text-white/70">
                  {deckName ? <div className="mb-1">Importing into: <span className="text-white">{deckName}</span></div> : null}
                  <div>
                    Will create: <span className="text-emerald-300">{existingStats.toCreate}</span>
                    {existingStats.existing > 0 ? (
                      <> • Already exists (by name, skipped): <span className="text-amber-300">{existingStats.existing}</span></>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cards.length > 0 && (
                  <div className="rounded border border-white/10">
                    <div className="px-3 py-2 text-white/80 text-sm">Cards Preview (first 5)</div>
                    <ScrollArea className="max-h-40">
                      <div className="p-3 space-y-2">
                        {cards.slice(0, 5).map((c, i) => (
                          <div key={i} className="bg-white/5 rounded p-2 text-xs">
                            <div className="font-medium">{c.name}</div>
                            {c.subtitle && <div className="text-white/70">Subtitle: {c.subtitle}</div>}
                            {c.element && <div className="text-white/70">element: {c.element}</div>}
                            {c.image_url && <div className="text-white/70">image_url: {c.image_url.slice(0,40)}...</div>}
                            {c.ai_image_prompt && (
                              <div className="text-white/70">AI Prompt: {c.ai_image_prompt.slice(0, 40)}{c.ai_image_prompt.length > 40 ? "..." : ""}</div>
                            )}
                            {c.ai_reference_image_url && (
                              <div className="text-white/70">AI Ref Image: {c.ai_reference_image_url.slice(0, 40)}{c.ai_reference_image_url.length > 40 ? "..." : ""}</div>
                            )}
                            {Array.isArray(c.keywords) && c.keywords.length > 0 && (
                              <div className="text-white/60">keywords: {c.keywords.slice(0,5).join(", ")}{c.keywords.length>5?"…":""}</div>
                            )}
                            {c.custom && (
                              <div className="text-white/60">
                                AI notes: {c.custom.slice(0, 60)}{c.custom.length > 60 ? "…" : ""}
                              </div >
                            )}
                          </div >
                        ))}
                      </div >
                    </ScrollArea>
                  </div>
                )}
                {spreads.length > 0 && (
                  <div className="rounded border border-white/10">
                    <div className="px-3 py-2 text-white/80 text-sm">Spreads Preview (first 3)</div>
                    <ScrollArea className="max-h-40">
                      <div className="p-3 space-y-2">
                        {spreads.slice(0, 3).map((s, i) => (
                          <div key={i} className="bg-white/5 rounded p-2 text-xs">
                            <div className="font-medium">{s.name}</div>
                            <div className="text-white/70">{s.positions?.length || 0} positions</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="text-xs text-white/60">{progress}%</div>
            </div>
          )}

          {summary && (
            <div className="mt-2 text-sm">
              <div className="text-white/80">Done.</div>
              <div className="text-white/70">Cards — created: {summary.cards.created} / {summary.cards.total}, failed: {summary.cards.failed}</div>
              <div className="text-white/70">Spreads — created: {summary.spreads.created} / {summary.spreads.total}, failed: {summary.spreads.failed}</div>
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || (!importCards && !importSpreads) || ((importCards && cards.length === 0) && (importSpreads && spreads.length === 0))}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}