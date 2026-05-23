/**
 * readingEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure deterministic reading engine — no AI, no API calls.
 * Takes card data, position, orientation and returns structured interpretation
 * blocks that can be displayed directly or passed to the AI for deepening.
 *
 * This is the foundation layer. It never changes based on who the user is.
 * The learningLayer.js personalizes on top of this output.
 */

// ─── I Ching Hexagram Wisdom Map ──────────────────────────────────────────────
// Extracted from Rooted Crescent deck custom fields.
// Add more as other decks are onboarded.

const ICHING_WISDOM = {
  2:  { name: "The Receptive",              theme: "receptivity",    wisdom: "Yield and receive. Strength through openness." },
  3:  { name: "Difficulty at the Beginning",theme: "perseverance",   wisdom: "Chaos seeds potential. Begin despite uncertainty." },
  4:  { name: "Youthful Folly",             theme: "learning",       wisdom: "Embrace beginner's mind. Wisdom grows through stumbling." },
  5:  { name: "Waiting",                    theme: "patience",       wisdom: "Trust the timing. What is needed will arrive." },
  6:  { name: "Conflict",                   theme: "tension",        wisdom: "Inner tension signals growth. Meet conflict with clarity." },
  7:  { name: "The Army",                   theme: "integration",    wisdom: "Organize inner forces. Discipline creates power." },
  8:  { name: "Union",                      theme: "connection",     wisdom: "Bonds strengthen all. Seek harmonious alliance." },
  11: { name: "Peace",                      theme: "harmony",        wisdom: "Heaven and earth in balance. This is the fertile moment." },
  12: { name: "Standstill",                 theme: "stillness",      wisdom: "Withdrawal conserves strength. Pause before the next move." },
  13: { name: "Fellowship with Men",        theme: "community",      wisdom: "Shared vision multiplies power. Unite around truth." },
  15: { name: "Modesty",                    theme: "humility",       wisdom: "The humble are lifted. Let your actions speak quietly." },
  16: { name: "Enthusiasm",                 theme: "momentum",       wisdom: "Joy in motion creates momentum. Follow genuine excitement." },
  19: { name: "Approach",                   theme: "expansion",      wisdom: "Growth comes at the threshold. Step beyond what is known." },
  20: { name: "Contemplation",              theme: "observation",    wisdom: "See clearly before acting. Witness without judgment." },
  23: { name: "Splitting Apart",            theme: "dissolution",    wisdom: "What falls away creates space. Trust the clearing." },
  24: { name: "Return",                     theme: "renewal",        wisdom: "The turning point arrives. Return to essence." },
  25: { name: "Innocence",                  theme: "authenticity",   wisdom: "Act from pure intent. Sincerity opens all doors." },
  27: { name: "Nourishment",                theme: "sustenance",     wisdom: "Feed what deserves to grow. Choose your nourishment wisely." },
  29: { name: "The Abysmal",                theme: "depth",          wisdom: "Water flows through every obstacle. Trust the passage." },
  30: { name: "The Clinging",               theme: "clarity",        wisdom: "Light clings to what it illuminates. Radiate your truth." },
  32: { name: "Duration",                   theme: "perseverance",   wisdom: "Endurance shapes all great things. Steadiness is power." },
  35: { name: "Progress",                   theme: "advancement",    wisdom: "Clarity of purpose accelerates progress." },
  37: { name: "The Family",                 theme: "roots",          wisdom: "Strong foundations sustain all. Honor your roots." },
  40: { name: "Deliverance",                theme: "release",        wisdom: "Liberation follows the storm. Release what was carried." },
  42: { name: "Increase",                   theme: "growth",         wisdom: "This is a time of increase. Invest in what matters most." },
  44: { name: "Coming to Meet",             theme: "encounter",      wisdom: "The unexpected meeting carries a message. Stay discerning." },
  49: { name: "Revolution",                 theme: "transformation", wisdom: "Change is the nature of things. Transform with intention." },
  50: { name: "The Cauldron",               theme: "alchemy",        wisdom: "Transform raw material into nourishment. You are the vessel." },
  51: { name: "The Arousing",               theme: "awakening",      wisdom: "The shock awakens. Move with the thunder, not against it." },
  52: { name: "Keeping Still",              theme: "stillness",      wisdom: "Stillness is not emptiness. The mountain holds its ground." },
  56: { name: "The Wanderer",               theme: "journey",        wisdom: "Travel lightly. The wanderer finds wisdom in movement." },
  58: { name: "The Joyous",                 theme: "joy",            wisdom: "Genuine joy is magnetic. Share it freely." },
  61: { name: "Inner Truth",                theme: "authenticity",   wisdom: "Truth resonates beyond words. Speak and act from the core." },
};

// ─── Keyword Theme Groups ─────────────────────────────────────────────────────
// Used to detect thematic resonance across multiple cards in a reading.

const THEME_GROUPS = {
  transformation: ["transformation", "change", "alchemy", "metamorphosis", "revolution", "renewal", "rebirth"],
  shadow:         ["shadow", "darkness", "hidden", "mystery", "depth", "void", "unconscious"],
  creativity:     ["creativity", "inspiration", "flow", "dreams", "imagination", "muse", "brilliance"],
  resilience:     ["resilience", "strength", "endurance", "perseverance", "courage", "resolve", "fortitude"],
  connection:     ["connection", "community", "bonds", "partnership", "unity", "relationships", "togetherness"],
  balance:        ["balance", "harmony", "equilibrium", "peace", "stillness", "calm", "grounding"],
  liberation:     ["freedom", "liberation", "release", "breaking free", "boundaries", "chains", "independence"],
  intuition:      ["intuition", "wisdom", "insight", "guidance", "clarity", "truth", "awareness"],
  growth:         ["growth", "expansion", "progress", "learning", "evolution", "journey", "exploration"],
  nurturing:      ["nurturing", "care", "support", "protection", "love", "healing", "nourishment"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse I Ching number from a card's custom field string.
 * e.g. "Linked to Modesty (15) from the I Ching..." → 15
 */
function parseIChingNumber(customField) {
  if (!customField) return null;
  const match = customField.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse I Ching symbol name from custom field.
 * e.g. "Linked to Modesty (15) from the I Ching..." → "Modesty"
 */
function parseIChingName(customField) {
  if (!customField) return null;
  const match = customField.match(/Linked to ([^(]+)\(/);
  return match ? match[1].trim() : null;
}

/**
 * Parse the symbolic meaning from custom field.
 * e.g. "...symbolizing humble presence." → "humble presence"
 */
function parseIChingSymbolism(customField) {
  if (!customField) return null;
  const match = customField.match(/symbolizing (.+?)\.?\s*$/);
  return match ? match[1].trim() : null;
}

/**
 * Detect which theme groups a card's keywords touch.
 */
function detectThemes(keywords = []) {
  const lower = keywords.map(k => k.toLowerCase());
  const matched = [];
  for (const [theme, words] of Object.entries(THEME_GROUPS)) {
    if (words.some(w => lower.some(k => k.includes(w) || w.includes(k)))) {
      matched.push(theme);
    }
  }
  return matched;
}

/**
 * Find thematic resonance between two cards.
 * Returns shared themes if any.
 */
function findCardResonance(cardA, cardB) {
  const themesA = detectThemes(cardA.keywords || []);
  const themesB = detectThemes(cardB.keywords || []);
  return themesA.filter(t => themesB.includes(t));
}

/**
 * Detect tension between two cards based on opposing themes.
 */
const OPPOSING_THEMES = [
  ["liberation", "nurturing"],
  ["shadow", "clarity"],
  ["stillness", "momentum"],
  ["transformation", "balance"],
  ["connection", "solitude"],
];

function findCardTension(cardA, cardB) {
  const themesA = detectThemes(cardA.keywords || []);
  const themesB = detectThemes(cardB.keywords || []);
  return OPPOSING_THEMES.filter(
    ([a, b]) => (themesA.includes(a) && themesB.includes(b)) ||
                (themesA.includes(b) && themesB.includes(a))
  ).map(pair => pair.join(" ↔ "));
}

// ─── Core Interpretation Builder ─────────────────────────────────────────────

/**
 * Build a deterministic interpretation for a single card in a position.
 *
 * @param {object} card        - Card entity from the database
 * @param {object} position    - Spread position { name, meaning }
 * @param {boolean} isReversed - Whether the card landed reversed
 * @param {string} question    - User's question/context
 * @returns {object}           - Structured interpretation block
 */
export function interpretCard(card, position = null, isReversed = false, question = "") {
  if (!card) return null;

  const iChingNum    = parseIChingNumber(card.custom);
  const iChingName   = parseIChingName(card.custom);
  const iChingSymbol = parseIChingSymbolism(card.custom);
  const iChingData   = iChingNum ? ICHING_WISDOM[iChingNum] : null;
  const themes       = detectThemes(card.keywords || []);

  // Primary meaning — upright or reversed
  const primaryMeaning = isReversed
    ? (card.reversed_meaning || card.overall_meaning || "")
    : (card.upright_meaning  || card.overall_meaning || "");

  const primaryAction = isReversed
    ? (card.reversed_action || null)
    : (card.upright_action  || null);

  const primaryInsight = isReversed
    ? (card.reversed_insight || null)
    : (card.upright_insight  || null);

  // Position lens — how the position reframes the card
  let positionLens = null;
  if (position?.meaning) {
    positionLens = `In the position of "${position.name}" — ${position.meaning}`;
  }

  // I Ching thread
  let ancientThread = null;
  if (iChingName && iChingSymbol) {
    ancientThread = {
      hexagram: iChingNum,
      name: iChingName,
      symbolism: iChingSymbol,
      wisdom: iChingData?.wisdom || null,
      theme: iChingData?.theme || null,
    };
  }

  // Orientation note
  const orientationNote = isReversed
    ? "This card arrives reversed — its energy turns inward, asking for reflection rather than outward expression."
    : null;

  return {
    cardId:          card.id || card.card_id || null,
    cardName:        card.name,
    isReversed,
    keywords:        card.keywords || [],
    themes,
    primaryMeaning,
    primaryAction,
    primaryInsight,
    positionLens,
    orientationNote,
    ancientThread,
    facedownMeaning: card.facedown_meaning || null,
    musicianQuote:   card.musician_quote   || null,
    subtitle:        card.subtitle         || null,
    customFields:    card.custom_fields    || null,
  };
}

// ─── Full Reading Interpreter ─────────────────────────────────────────────────

/**
 * Build a complete deterministic reading from all drawn cards.
 *
 * @param {Array}  drawnCards  - Array of { cardData, position, isReversed }
 * @param {object} spread      - Spread entity { name, positions }
 * @param {string} question    - User's question/context
 * @returns {object}           - Full reading interpretation
 */
export function interpretReading(drawnCards = [], spread = null, question = "") {
  if (!drawnCards.length) return null;

  // Interpret each card individually
  const cardInterpretations = drawnCards.map((drawn, idx) => {
    const position = spread?.positions?.[idx] || drawn.position || null;
    return interpretCard(
      drawn.cardData || drawn,
      position,
      drawn.isReversed || drawn.is_reversed || false,
      question
    );
  });

  // ── Cross-card analysis ──────────────────────────────────────────────────────

  // Collect all themes across all cards
  const allThemes = cardInterpretations.flatMap(c => c.themes);
  const themeCounts = allThemes.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const dominantThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  // Collect I Ching threads
  const iChingThreads = cardInterpretations
    .filter(c => c.ancientThread)
    .map(c => c.ancientThread);

  // Detect shared I Ching themes (multiple cards pointing to same hexagram theme)
  const iChingThemes = iChingThreads.map(t => t.theme).filter(Boolean);
  const iChingThemeCounts = iChingThemes.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const convergentWisdom = Object.entries(iChingThemeCounts)
    .filter(([, count]) => count > 1)
    .map(([theme]) => theme);

  // Detect card resonances (pairs that amplify each other)
  const resonances = [];
  const tensions   = [];
  for (let i = 0; i < drawnCards.length; i++) {
    for (let j = i + 1; j < drawnCards.length; j++) {
      const cardA = drawnCards[i].cardData || drawnCards[i];
      const cardB = drawnCards[j].cardData || drawnCards[j];
      const shared = findCardResonance(cardA, cardB);
      const opposing = findCardTension(cardA, cardB);
      if (shared.length) {
        resonances.push({
          cards: [cardA.name, cardB.name],
          sharedThemes: shared,
          note: `${cardA.name} and ${cardB.name} amplify each other through ${shared.join(", ")}.`,
        });
      }
      if (opposing.length) {
        tensions.push({
          cards: [cardA.name, cardB.name],
          opposingThemes: opposing,
          note: `${cardA.name} and ${cardB.name} create productive tension: ${opposing.join(", ")}.`,
        });
      }
    }
  }

  // Reversal rate
  const reversalCount = cardInterpretations.filter(c => c.isReversed).length;
  const reversalRate  = drawnCards.length > 0 ? reversalCount / drawnCards.length : 0;

  // Overall reading tone based on reversal rate
  let readingTone;
  if (reversalRate === 0)       readingTone = "expansive";   // All upright — energy flowing outward
  else if (reversalRate <= 0.3) readingTone = "mixed";       // Mostly upright — some internal work
  else if (reversalRate <= 0.6) readingTone = "reflective";  // Balanced — inner/outer in dialogue
  else if (reversalRate < 1)    readingTone = "inward";      // Mostly reversed — deep inner work
  else                          readingTone = "shadow";      // All reversed — shadow integration time

  // Synthesis note — a short deterministic summary sentence
  const synthesisNote = buildSynthesisNote(dominantThemes, readingTone, convergentWisdom, question);

  return {
    question,
    spreadName:     spread?.name || "Freeform",
    cardCount:      drawnCards.length,
    cardInterpretations,
    dominantThemes,
    iChingThreads,
    convergentWisdom,
    resonances,
    tensions,
    reversalRate,
    readingTone,
    synthesisNote,
    // Metadata for learning layer
    _meta: {
      cardIds:      cardInterpretations.map(c => c.cardId).filter(Boolean),
      keywords:     cardInterpretations.flatMap(c => c.keywords),
      iChingNums:   iChingThreads.map(t => t.hexagram).filter(Boolean),
      reversedIds:  cardInterpretations.filter(c => c.isReversed).map(c => c.cardId).filter(Boolean),
    },
  };
}

// ─── Synthesis Note Builder ───────────────────────────────────────────────────

function buildSynthesisNote(dominantThemes, tone, convergentWisdom, question) {
  const toneDescriptions = {
    expansive:  "The cards speak with outward energy — this is a moment for action and expression.",
    mixed:      "The reading holds both expansion and reflection — move forward while staying aware.",
    reflective: "The cards invite a pause. Inner work is the outer work right now.",
    inward:     "Much of this reading turns inward. The wisdom is beneath the surface.",
    shadow:     "The cards call for shadow integration. What has been avoided holds the key.",
  };

  const themeNote = dominantThemes.length
    ? `The threads of ${dominantThemes.slice(0, 2).join(" and ")} run through this reading.`
    : "";

  const wisdomNote = convergentWisdom.length
    ? `Multiple cards echo the theme of ${convergentWisdom[0]} — the I Ching amplifies this signal.`
    : "";

  const toneNote = toneDescriptions[tone] || "";

  return [toneNote, themeNote, wisdomNote].filter(Boolean).join(" ");
}

// ─── Utility Exports ──────────────────────────────────────────────────────────

export { detectThemes, findCardResonance, findCardTension, parseIChingNumber, ICHING_WISDOM, THEME_GROUPS };