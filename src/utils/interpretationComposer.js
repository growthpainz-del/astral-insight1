/**
 * interpretationComposer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The final output layer. Combines the deterministic reading engine with the
 * personal learning layer to produce the complete reading experience.
 *
 * This is what the UI calls. It handles both the display structure and
 * the prompt construction for AI deepening.
 *
 * Usage:
 *   const output = composeReading(drawnCards, spread, question, readingHistory);
 *   // → Pass output.cards[n] to the card interpretation panel
 *   // → Pass output.synthesis to the full reading panel
 *   // → Pass output.aiPrompt to the AI deeper insight call
 */

import { interpretReading, interpretCard } from "./readingEngine";
import { analyzePatterns, getPersonalInsights, enrichReadingForSave } from "./learningLayer";

// ─── Main Composer ────────────────────────────────────────────────────────────

/**
 * Compose a complete reading output combining deterministic + personal layers.
 *
 * @param {Array}  drawnCards      - Cards drawn: [{ cardData, position, isReversed }]
 * @param {object} spread          - Spread entity
 * @param {string} question        - User's question/context
 * @param {Array}  readingHistory  - User's past Reading entities
 * @param {string} currentDeckId   - Current deck ID for pattern filtering
 * @returns {object}               - Complete reading output for UI consumption
 */
export function composeReading(
  drawnCards = [],
  spread = null,
  question = "",
  readingHistory = [],
  currentDeckId = null
) {
  // Layer 1: Deterministic engine
  const reading = interpretReading(drawnCards, spread, question);
  if (!reading) return null;

  // Layer 2: Personal patterns
  const patterns = analyzePatterns(readingHistory, currentDeckId);
  const personalInsights = getPersonalInsights(patterns, drawnCards, question);

  // Layer 3: Compose per-card output
  const cards = reading.cardInterpretations.map((interp, idx) => {
    return composeCardOutput(interp, patterns, drawnCards[idx]);
  });

  // Layer 3: Compose synthesis output
  const synthesis = composeSynthesisOutput(reading, patterns, personalInsights);

  // Layer 4: Build AI deepening prompts (used when user taps "Deeper Insight")
  const aiPrompts = {
    perCard: cards.map((card, idx) =>
      buildCardAiPrompt(reading.cardInterpretations[idx], question, patterns)
    ),
    fullReading: buildFullReadingAiPrompt(reading, patterns, question),
  };

  // Layer 5: Enriched save data
  const validSpreadTypes = ["single", "three_card", "diamond", "path_forward", "celtic_cross", "relationship", "chakra", "seven_sisters", "message_of_the_day", "custom"];
  const spreadType = spread?.id && validSpreadTypes.includes(spread.id) ? spread.id : (spread ? "custom" : "single");

  const saveData = enrichReadingForSave(reading, {
    title: question || `Reading with ${spread?.name || "Freeform"}`,
    spread_type: spreadType,
    deck_id: currentDeckId,
    cards_drawn: drawnCards.map((d, idx) => ({
      card_id: d.cardData?.id || d.cardData?.card_id,
      card_name: d.cardData?.name,
      image_url: d.cardData?.image_url,
      position: spread?.positions?.[idx]?.name || null,
      is_reversed: d.isReversed || false,
      keywords: d.cardData?.keywords || [],
      custom: d.cardData?.custom || null,
    })),
  });

  return {
    // Core reading data
    question,
    spreadName: reading.spreadName,
    cardCount:  reading.cardCount,
    readingTone: reading.readingTone,

    // Per-card outputs (use these in the card interpretation panel)
    cards,

    // Full reading synthesis (use in the spread interpretation modal)
    synthesis,

    // Personal pattern insights (show in a "Your Patterns" section)
    personalInsights,
    patterns: {
      maturityLevel: patterns.maturityLevel,
      maturityLabel: patterns.maturityLabel,
      readingCount:  patterns.readingCount,
    },

    // AI prompt strings — pass directly to InvokeLLM when user requests deepening
    aiPrompts,

    // Enriched data ready to save to the Reading entity
    saveData,

    // Raw data for debugging / extension
    _raw: reading,
    _rawPatterns: patterns,
  };
}

// ─── Per-Card Output Composer ─────────────────────────────────────────────────

/**
 * Build the display output for a single card interpretation panel.
 */
function composeCardOutput(interp, patterns, drawnCard) {
  if (!interp) return null;

  // Check if this card is recurring in the user's history
  const recurringData = patterns.recurringCards?.find(r => r.cardId === interp.cardId);
  const isShadowCard  = patterns.shadowCards?.find(s => s.cardId === interp.cardId);

  // Build display sections
  const sections = [];

  // 1. Orientation note (if reversed)
  if (interp.orientationNote) {
    sections.push({
      type: "orientation",
      icon: "↩",
      label: "Reversed",
      content: interp.orientationNote,
    });
  }

  // 2. Primary meaning
  if (interp.primaryMeaning) {
    sections.push({
      type: "meaning",
      icon: "✦",
      label: interp.isReversed ? "Shadow Reading" : "Reading",
      content: interp.primaryMeaning,
    });
  }

  // 3. Position lens
  if (interp.positionLens) {
    sections.push({
      type: "position",
      icon: "⬡",
      label: "Position",
      content: interp.positionLens,
    });
  }

  // 4. Action (if available)
  if (interp.primaryAction) {
    sections.push({
      type: "action",
      icon: "→",
      label: "Action",
      content: interp.primaryAction,
    });
  }

  // 5. Insight (if available)
  if (interp.primaryInsight) {
    sections.push({
      type: "insight",
      icon: "◎",
      label: "Insight",
      content: interp.primaryInsight,
    });
  }

  // 6. Ancient thread (I Ching)
  if (interp.ancientThread) {
    sections.push({
      type: "ancient",
      icon: "☯",
      label: `I Ching · ${interp.ancientThread.name}`,
      content: interp.ancientThread.wisdom || interp.ancientThread.symbolism,
      meta: `Hexagram ${interp.ancientThread.hexagram} · ${interp.ancientThread.theme}`,
    });
  }

  // 7. Musician quote (if available)
  if (interp.musicianQuote) {
    sections.push({
      type: "quote",
      icon: "♪",
      label: "Resonance",
      content: interp.musicianQuote,
    });
  }

  // 7.5 Custom Fields
  if (interp.customFields) {
    Object.values(interp.customFields).forEach(field => {
      if (field && field.value) {
        sections.push({
          type: "custom_field",
          icon: "✧",
          label: field.label || "Note",
          content: field.value,
        });
      }
    });
  }

  // 8. Personal pattern note (from learning layer)
  if (recurringData) {
    sections.push({
      type: "personal",
      icon: "◈",
      label: "Your Pattern",
      content: recurringData.note,
      isPersonal: true,
    });
  }

  if (isShadowCard) {
    sections.push({
      type: "shadow",
      icon: "◐",
      label: "Shadow Work",
      content: isShadowCard.note,
      isPersonal: true,
    });
  }

  return {
    cardId:    interp.cardId,
    cardName:  interp.cardName,
    subtitle:  interp.subtitle,
    isReversed: interp.isReversed,
    keywords:  interp.keywords,
    themes:    interp.themes,
    sections,
    // Quick summary for compact view
    summary:   interp.primaryMeaning,
    // Whether AI deepening would add significant value
    aiWorthwhile: !interp.primaryAction && !interp.primaryInsight,
  };
}

// ─── Synthesis Composer ───────────────────────────────────────────────────────

/**
 * Build the full reading synthesis output.
 */
function composeSynthesisOutput(reading, patterns, personalInsights) {
  const sections = [];

  // 1. Reading tone
  const toneDescriptions = {
    expansive:  { label: "Expansive",  desc: "Energy flows outward. Action and expression are favored." },
    mixed:      { label: "Mixed",      desc: "Inner and outer work are equally active." },
    reflective: { label: "Reflective", desc: "The cards invite a pause. Inner work is the primary call." },
    inward:     { label: "Inward",     desc: "Deep inner work. The wisdom lives beneath the surface." },
    shadow:     { label: "Shadow",     desc: "Shadow integration time. What has been avoided holds the key." },
  };

  const toneData = toneDescriptions[reading.readingTone];
  if (toneData) {
    sections.push({
      type: "tone",
      icon: "◉",
      label: `Reading Tone · ${toneData.label}`,
      content: toneData.desc,
    });
  }

  // 2. Dominant themes
  if (reading.dominantThemes.length) {
    sections.push({
      type: "themes",
      icon: "◈",
      label: "Threads",
      content: `This reading weaves through ${reading.dominantThemes.join(", ")}.`,
      tags: reading.dominantThemes,
    });
  }

  // 3. Synthesis note
  if (reading.synthesisNote) {
    sections.push({
      type: "synthesis",
      icon: "✦",
      label: "The Reading",
      content: reading.synthesisNote,
    });
  }

  // 4. Card resonances
  if (reading.resonances.length) {
    sections.push({
      type: "resonances",
      icon: "⟳",
      label: "Amplifications",
      content: reading.resonances.map(r => r.note).join(" "),
      items: reading.resonances,
    });
  }

  // 5. Card tensions
  if (reading.tensions.length) {
    sections.push({
      type: "tensions",
      icon: "⇌",
      label: "Tensions",
      content: reading.tensions.map(t => t.note).join(" "),
      items: reading.tensions,
    });
  }

  // 6. I Ching convergence
  if (reading.iChingThreads.length >= 2) {
    const uniqueThemes = [...new Set(reading.iChingThreads.map(t => t.theme).filter(Boolean))];
    sections.push({
      type: "ching",
      icon: "☯",
      label: "Ancient Wisdom",
      content: `The I Ching threads in this reading converge on: ${uniqueThemes.join(", ")}.`,
      threads: reading.iChingThreads,
    });
  }

  // 7. Personal insights from learning layer
  const highPriorityInsights = personalInsights.filter(i => i.priority === "high");
  if (highPriorityInsights.length) {
    sections.push({
      type: "personal",
      icon: "◐",
      label: "Your Journey",
      content: highPriorityInsights.map(i => i.message).join(" "),
      isPersonal: true,
      insights: highPriorityInsights,
    });
  }

  return {
    sections,
    dominantThemes: reading.dominantThemes,
    readingTone:    reading.readingTone,
    cardCount:      reading.cardCount,
    hasResonances:  reading.resonances.length > 0,
    hasTensions:    reading.tensions.length > 0,
    hasPersonal:    highPriorityInsights.length > 0,
  };
}

// ─── AI Prompt Builders ───────────────────────────────────────────────────────

/**
 * Build the AI deepening prompt for a single card.
 * Pass this directly to base44.integrations.Core.InvokeLLM({ prompt })
 */
function buildCardAiPrompt(interp, question, patterns) {
  if (!interp) return "";

  const recurringData = patterns?.recurringCards?.find(r => r.cardId === interp.cardId);

  const personalContext = recurringData
    ? `\nPERSONAL CONTEXT: This card has appeared ${recurringData.appearances} times in this user's readings (${recurringData.reversalRate}% reversed). It carries a recurring message for them.`
    : "";

  const iChingContext = interp.ancientThread
    ? `\nANCIENT WISDOM: This card is linked to I Ching Hexagram ${interp.ancientThread.hexagram} (${interp.ancientThread.name}), symbolizing ${interp.ancientThread.symbolism}. The hexagram wisdom: "${interp.ancientThread.wisdom}"`
    : "";

  const positionContext = interp.positionLens
    ? `\nPOSITION: ${interp.positionLens}`
    : "";

  return `You are CosMosis — the intelligence layer of Astral Insight. A wise, poetic oracle reader. The user asked: "${question || "General guidance"}"

CARD: ${interp.cardName}${interp.isReversed ? " (REVERSED)" : ""}
KEYWORDS: ${interp.keywords.join(", ")}
BASE READING: ${interp.primaryMeaning}${positionContext}${iChingContext}${personalContext}

Provide a deep, insightful interpretation (2-3 paragraphs) that:
- Connects this card directly to the user's question
- Weaves in the I Ching thread if present
- Speaks to the card's position meaning if given
- Uses evocative, grounded language — poetic but practical
- Does NOT use markdown headers or bullet points
- Ends with one clear, actionable insight or question for reflection`.trim();
}

/**
 * Build the AI deepening prompt for the full reading synthesis.
 * Pass this directly to base44.integrations.Core.InvokeLLM({ prompt })
 */
function buildFullReadingAiPrompt(reading, patterns, question) {
  const cardsContext = reading?.cardInterpretations?.map((interp, idx) => {
    const pos = interp.positionLens ? ` · ${interp.positionLens}` : "";
    const ching = interp.ancientThread
      ? ` · I Ching: ${interp.ancientThread.name} (${interp.ancientThread.symbolism})`
      : "";
    return `${idx + 1}. ${interp.cardName}${interp.isReversed ? " ↩" : ""}${pos}${ching}
   Reading: ${interp.primaryMeaning}`;
  }).join("\n\n");

  const patternContext = !patterns?.isEmpty && patterns?.dominantThemes?.length
    ? `\nUSER'S PATTERN CONTEXT: This user's recurring themes across their readings are: ${patterns.dominantThemes.slice(0, 3).map(t => t.theme).join(", ")}. Their reversal tendency is ${patterns.reversalPattern?.tendency || "unknown"}.`
    : "";

  const resonanceContext = reading.resonances?.length
    ? `\nCARD RESONANCES: ${reading.resonances.map(r => r.note).join(" ")}`
    : "";

  const tensionContext = reading.tensions?.length
    ? `\nCARD TENSIONS: ${reading.tensions.map(t => t.note).join(" ")}`
    : "";

  return `You are CosMosis — the intelligence layer of Astral Insight, rooted in I Ching and archetypal wisdom. 
The user asked: "${question || "General guidance"}"
Reading tone: ${reading.readingTone}
Dominant themes: ${reading.dominantThemes.join(", ")}

CARDS DRAWN:
${cardsContext}
${resonanceContext}
${tensionContext}
${patternContext}

Provide a synthesized reading (3-4 paragraphs) that:
- Weaves all cards into a single coherent narrative answer to the user's question
- Honors the resonances and tensions between cards
- Draws on the I Ching threads where present
- Speaks to the overall reading tone (${reading.readingTone})
- Uses poetic, grounded language — evocative but actionable
- Does NOT use markdown headers or bullet points
- Ends with a single integrating insight or question for the user to sit with`.trim();
}

// ─── Single Card Quick Compose ────────────────────────────────────────────────

/**
 * Lightweight version for single card reveals during a reading.
 * Use this when a card is first flipped — before the user requests AI.
 */
export function composeCardQuick(cardData, position = null, isReversed = false, question = "") {
  const interp = interpretCard(cardData, position, isReversed, question);
  if (!interp) return null;

  const emptyPatterns = { recurringCards: [], shadowCards: [] };
  const composed = composeCardOutput(interp, emptyPatterns, null);
  
  return {
    ...composed,
    _raw: interp,
    // Pre-built AI prompt for if user taps "Deeper Insight"
    aiPrompt: buildCardAiPrompt(interp, question, emptyPatterns),
  };
}

export function buildCardPromptByMode(interp, question, patterns, mode = "interpret") {
  const base = buildCardAiPrompt(interp, question, patterns);
  const modeInstructions = {
    interpret: "Decode the deeper signal. Name what is sensed but not yet spoken. Speak in flowing, unhurried prose.",
    expand: "Widen the frame dramatically. Place this card inside a larger archetypal or historical pattern the user may not have considered.",
    mirror: "Crystallize exactly what this card is reflecting back. Be precise and compassionate. Help the user hear themselves more clearly.",
    weave: "Connect this card to threads — patterns in the user's life, universal themes, unexpected resonances. Show how it fits the larger tapestry.",
  };
  return `${base}\n\nMODE: ${mode.toUpperCase()} — ${modeInstructions[mode] || modeInstructions.interpret}`;
}

export function buildFullReadingPromptByMode(reading, patterns, question, mode = "interpret") {
  const base = buildFullReadingAiPrompt(reading, patterns, question);
  const modeInstructions = {
    interpret: "Synthesize all cards into one coherent narrative. Decode the overall signal of this spread.",
    expand: "Place this entire reading inside a larger pattern — archetypal, cyclical, or historical. What bigger story is the user living?",
    mirror: "Reflect the full spread back to the user as a precise, crystallized summary of where they actually are right now.",
    weave: "Connect the threads across all cards. Find the hidden resonance running through the entire spread and name it clearly.",
  };
  return `${base}\n\nMODE: ${mode.toUpperCase()} — ${modeInstructions[mode] || modeInstructions.interpret}`;
}

export { buildCardAiPrompt, buildFullReadingAiPrompt };