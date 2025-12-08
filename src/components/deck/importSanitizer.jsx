export const ALLOWED_ELEMENTS = new Set(["air", "fire", "water", "earth", "spirit", "none"]);

function safeJsonParse(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export function extractCardsFromText(rawText) {
  const warnings = [];

  // First try normal JSON
  let parsed = safeJsonParse(rawText);
  if (!parsed.ok) {
    // Try common fixes: remove trailing commas, normalize quotes
    let t = rawText
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/\u2018|\u2019|\u201C|\u201D/g, '"'); // curly quotes to straight

    parsed = safeJsonParse(t);
    if (!parsed.ok) {
      const msg = String(parsed.error?.message || "Unknown parse error");
      return {
        cards: [],
        warnings: [
          "JSON Parse error: " + msg,
          "Tips:",
          "- Ensure your JSON is an array of card objects: [ { ... }, { ... } ]",
          "- Remove any trailing commas and use straight quotes (\")",
          "- If you included spreads at the end, please remove them; import spreads separately",
        ],
      };
    }
  }

  let data = parsed.data;

  // Accept either an array of cards or an object that contains cards
  if (Array.isArray(data)) {
    // Filter out any objects that are clearly not cards (e.g., {spreads:[...]})
    const cardsOnly = data.filter((item) => item && typeof item === "object" && !("spreads" in item));
    if (cardsOnly.length !== data.length) {
      warnings.push("Ignored trailing non-card object(s) (e.g., spreads).");
    }
    return { cards: cardsOnly, warnings };
  }

  if (data && typeof data === "object") {
    // Try common shapes: { cards: [...] } or { data: [...] }
    const maybe = data.cards || data.data || data.items;
    if (Array.isArray(maybe)) {
      return { cards: maybe, warnings };
    }
    // If object contains spreads, instruct user
    if (Array.isArray(data.spreads)) {
      warnings.push("Detected spreads at top-level; please import spreads separately using Spread Designer or Bulk Spread Importer.");
    }
  }

  return {
    cards: [],
    warnings: [
      ...warnings,
      "Could not find an array of cards. Expected: [ { name, number, ... }, ... ]",
    ],
  };
}

export function mapCustomFieldShorthand(cardInput) {
  const card = { ...cardInput };

  // Normalize keywords string -> array
  if (typeof card.keywords === "string") {
    card.keywords = card.keywords
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Normalize element
  if (card.element && typeof card.element === "string") {
    const e = card.element.toLowerCase();
    if (!ALLOWED_ELEMENTS.has(e)) {
      // unknown element -> drop it, warn by attaching to custom_fields
      card.custom_fields = card.custom_fields || {};
      card.custom_fields.element = { label: "Element (raw)", value: card.element, category: "other" };
      delete card.element;
    } else {
      card.element = e;
    }
  }

  // Convert arbitrary "Label|Value" fields into custom_fields if key is unknown
  const customCandidates = ["role", "hard_truth", "strength_for_growth"];
  for (const key of customCandidates) {
    const v = card[key];
    if (typeof v === "string" && v.includes("|")) {
      const [label, ...rest] = v.split("|");
      const value = rest.join("|").trim();
      if (value) {
        card.custom_fields = card.custom_fields || {};
        card.custom_fields[key] = {
          label: label.trim() || key,
          value,
          category: key === "hard_truth" ? "wisdom" : key === "strength_for_growth" ? "meaning" : "other",
        };
      }
      delete card[key];
    }
  }

  // Also map any other string fields that look like "Label|Value" and are not part of the core schema
  // Minimal heuristic: keys with spaces or lower_snake not in core -> move to custom if contain "|"
  const CORE_KEYS = new Set([
    "deck_id","name","subtitle","image_url","video_url","frame_style","number","element","keywords",
    "ancient_wisdom","overall_meaning","upright_meaning","upright_insight","upright_action",
    "reversed_meaning","reversed_insight","reversed_action","interaction","musician_quote",
    "facedown_meaning","custom","custom_ai_notes","custom_ai_helper","custom_notes","custom_fields",
    "ai_image_prompt","ai_image_negative_prompt","ai_prompt_style","ai_prompt_metadata","ai_reference_image_url","ai_generated_images"
  ]);

  for (const [k, v] of Object.entries({ ...card })) {
    if (CORE_KEYS.has(k)) continue;
    if (typeof v === "string" && v.includes("|")) {
      const [label, ...rest] = v.split("|");
      const value = rest.join("|").trim();
      if (value) {
        card.custom_fields = card.custom_fields || {};
        card.custom_fields[k] = {
          label: label.trim() || k,
          value,
          category: "other",
        };
        delete card[k];
      }
    }
  }

  return card;
}