export function normalizeCard(card) {
  const get = (key) => {
    if (card && key in card && card[key] != null) return card[key];
    if (card?.card_details && key in card.card_details && card.card_details[key] != null) {
      return card.card_details[key];
    }
    return undefined;
  };

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const normalized = {
    id: get("id"),
    name: (get("name") || "Untitled").toString(),
    image_url: get("image_url") || "",
    video_url: get("video_url") || "",
    number: get("number") != null ? Number(get("number")) : undefined,
    element: get("element") || "none",
    keywords: toArray(get("keywords")),
    overall_meaning: get("overall_meaning") || get("subtitle") || "",
    upright_meaning: get("upright_meaning") || "",
    reversed_meaning: get("reversed_meaning") || "",
    upright_insight: get("upright_insight") || "",
    reversed_insight: get("reversed_insight") || "",
    upright_action: get("upright_action") || "",
    reversed_action: get("reversed_action") || "",
    custom: get("custom") || get("custom_notes_for_ai") || "",
    custom_fields: get("custom_fields") || {},
  };

  const aliasToCustom = [
    ["hard_truth", "The Hard Truth"],
    ["strength_for_growth", "Strength for Growth"],
    ["core_vulnerability", "Core Vulnerability"],
    ["history", "History"],
  ];
  aliasToCustom.forEach(([key, label]) => {
    const v = get(key);
    if (v && !normalized.custom_fields[key]) {
      normalized.custom_fields[key] = { label, value: v, category: "other" };
    }
  });

  return normalized;
}

export function getStandardCardDisplay(card, isReversed = false) {
  const c = normalizeCard(card);
  const meaningTitle = isReversed ? "Reversed Meaning" : "Upright Meaning";
  const meaningBody =
    (isReversed ? c.reversed_meaning || c.upright_meaning : c.upright_meaning || c.reversed_meaning) || "";

  return {
    name: c.name,
    image: c.image_url,
    summary: c.overall_meaning || "",
    meaningTitle,
    meaningBody,
    customNotes: c.custom || "",
    number: c.number,
    element: c.element,
    keywords: c.keywords,
    customFields: c.custom_fields || {},
  };
}