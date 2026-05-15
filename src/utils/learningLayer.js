/**
 * learningLayer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Personal learning layer — reads the user's Reading history and builds a
 * pattern profile that personalizes the deterministic engine over time.
 *
 * This runs entirely on the user's own data. Nothing is shared.
 * Privacy: all pattern data is derived from and stored in the user's own
 * Reading entities. No external storage or tracking.
 *
 * Growth curve:
 *   1–4   readings  → baseline (no personalization yet)
 *   5–9   readings  → first patterns emerge (recurring cards)
 *   10–19 readings  → theme patterns visible
 *   20–49 readings  → I Ching convergence detectable
 *   50+   readings  → full personal oracle profile active
 */

import { detectThemes, parseIChingNumber, THEME_GROUPS } from "./readingEngine";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_READINGS_FOR_PATTERNS  = 5;
const MIN_READINGS_FOR_CHING     = 20;
const MIN_READINGS_FOR_FULL      = 50;
const RECURRENCE_THRESHOLD       = 3;   // card must appear 3+ times to be "recurring"
const THEME_THRESHOLD            = 4;   // theme must appear 4+ times to be "dominant"

// ─── Pattern Analyzer ─────────────────────────────────────────────────────────

/**
 * Analyze a user's reading history to extract personal patterns.
 *
 * @param {Array}  readingHistory  - Array of Reading entities from the database
 * @param {string} currentDeckId  - Optional: filter to current deck only
 * @returns {object}              - Personal pattern profile
 */
export function analyzePatterns(readingHistory = [], currentDeckId = null) {
  // Filter to relevant readings
  const relevant = currentDeckId
    ? readingHistory.filter(r => r.deck_id === currentDeckId)
    : readingHistory;

  const totalReadings = relevant.length;

  // Not enough history yet
  if (totalReadings < MIN_READINGS_FOR_PATTERNS) {
    return {
      readingCount: totalReadings,
      maturityLevel: "seedling",
      maturityLabel: `${MIN_READINGS_FOR_PATTERNS - totalReadings} more readings to unlock personal patterns`,
      recurringCards: [],
      dominantThemes: [],
      iChingConvergence: [],
      shadowCards: [],       // Cards that always appear reversed
      reversalPattern: null,
      questionThemes: [],
      milestones: getMilestones(totalReadings),
      isEmpty: true,
    };
  }

  // ── Card frequency analysis ────────────────────────────────────────────────
  const cardFrequency    = {};
  const cardReversals    = {};
  const cardPositions    = {}; // Which positions each card tends to land in
  const allKeywords      = [];
  const allIChingNums    = [];
  const questionWords    = [];
  let   totalReversals   = 0;
  let   totalCardDraws   = 0;

  for (const reading of relevant) {
    const drawn = reading.cards_drawn || [];

    // Analyze question/title for themes
    const titleWords = (reading.title || "").toLowerCase().split(/\s+/);
    questionWords.push(...titleWords);

    for (const card of drawn) {
      const id = card.card_id || card.cardId;
      if (!id) continue;

      totalCardDraws++;

      // Frequency
      cardFrequency[id] = (cardFrequency[id] || 0) + 1;

      // Reversal tracking
      if (!cardReversals[id]) cardReversals[id] = { reversed: 0, total: 0 };
      cardReversals[id].total++;
      if (card.is_reversed) {
        cardReversals[id].reversed++;
        totalReversals++;
      }

      // Position tracking
      if (card.position) {
        if (!cardPositions[id]) cardPositions[id] = [];
        cardPositions[id].push(card.position);
      }

      // Keyword accumulation (from cached card data if available)
      if (card.keywords) allKeywords.push(...card.keywords);

      // I Ching tracking
      if (card.custom) {
        const num = parseIChingNumber(card.custom);
        if (num) allIChingNums.push(num);
      }
    }
  }

  // ── Recurring cards ────────────────────────────────────────────────────────
  const recurringCards = Object.entries(cardFrequency)
    .filter(([, count]) => count >= RECURRENCE_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([cardId, count]) => {
      const reversalData = cardReversals[cardId] || { reversed: 0, total: count };
      const reversalRate = reversalData.total > 0
        ? reversalData.reversed / reversalData.total
        : 0;
      const positions = cardPositions[cardId] || [];
      const dominantPosition = positions.length
        ? getMostFrequent(positions)
        : null;

      return {
        cardId,
        appearances: count,
        reversalRate: Math.round(reversalRate * 100),
        dominantPosition,
        tendency: reversalRate > 0.6 ? "shadow"
                : reversalRate > 0.4 ? "mixed"
                : "upright",
        note: buildRecurringCardNote(count, reversalRate, dominantPosition, totalReadings),
      };
    });

  // ── Shadow cards (always or almost always reversed) ────────────────────────
  const shadowCards = Object.entries(cardReversals)
    .filter(([, data]) => data.total >= 3 && (data.reversed / data.total) >= 0.75)
    .map(([cardId, data]) => ({
      cardId,
      reversalRate: Math.round((data.reversed / data.total) * 100),
      note: "This card consistently arrives reversed — it carries shadow work for you.",
    }));

  // ── Dominant themes ────────────────────────────────────────────────────────
  const themeCounts = {};
  for (const keyword of allKeywords) {
    const themes = detectThemes([keyword]);
    for (const theme of themes) {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }
  }

  const dominantThemes = Object.entries(themeCounts)
    .filter(([, count]) => count >= THEME_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({
      theme,
      strength: count,
      label: THEME_GROUPS[theme] ? `${theme} (${count} signals)` : theme,
    }));

  // ── I Ching convergence (only meaningful after 20+ readings) ──────────────
  let iChingConvergence = [];
  if (totalReadings >= MIN_READINGS_FOR_CHING) {
    const iChingCounts = allIChingNums.reduce((acc, n) => {
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {});

    iChingConvergence = Object.entries(iChingCounts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([num, count]) => ({
        hexagram: parseInt(num),
        appearances: count,
        note: `Hexagram ${num} has appeared ${count} times in your readings — a persistent thread.`,
      }));
  }

  // ── Reversal pattern ──────────────────────────────────────────────────────
  const overallReversalRate = totalCardDraws > 0
    ? totalReversals / totalCardDraws
    : 0;

  const reversalPattern = totalReadings >= 5 ? {
    rate: Math.round(overallReversalRate * 100),
    tendency: overallReversalRate > 0.5 ? "shadow-dominant"
            : overallReversalRate > 0.3 ? "balanced"
            : "upright-dominant",
    note: buildReversalNote(overallReversalRate),
  } : null;

  // ── Question theme patterns ────────────────────────────────────────────────
  const questionThemes = analyzeQuestionThemes(questionWords, totalReadings);

  // ── Maturity level ────────────────────────────────────────────────────────
  const { maturityLevel, maturityLabel } = getMaturityLevel(totalReadings);

  return {
    readingCount: totalReadings,
    maturityLevel,
    maturityLabel,
    recurringCards,
    dominantThemes,
    iChingConvergence,
    shadowCards,
    reversalPattern,
    questionThemes,
    milestones: getMilestones(totalReadings),
    isEmpty: false,
  };
}

// ─── Personalization Composer ─────────────────────────────────────────────────

/**
 * Generate personalized context notes to surface during a reading.
 * These are shown alongside the deterministic interpretation.
 *
 * @param {object} patterns      - Output from analyzePatterns()
 * @param {Array}  currentCards  - Cards drawn in this reading (with cardId)
 * @param {string} question      - Current question
 * @returns {Array}              - Array of personal insight notes
 */
export function getPersonalInsights(patterns, currentCards = [], question = "") {
  if (!patterns || patterns.isEmpty) return [];

  const insights = [];
  const drawnIds = currentCards.map(c => c.cardId || c.card_id).filter(Boolean);

  // ── Recurring card notices ─────────────────────────────────────────────────
  for (const drawn of drawnIds) {
    const recurring = patterns.recurringCards.find(r => r.cardId === drawn);
    if (recurring && recurring.appearances >= RECURRENCE_THRESHOLD) {
      insights.push({
        type: "recurring_card",
        priority: "high",
        cardId: drawn,
        message: recurring.note,
        appearances: recurring.appearances,
      });
    }
  }

  // ── Shadow card notices ────────────────────────────────────────────────────
  for (const drawn of drawnIds) {
    const shadow = patterns.shadowCards.find(s => s.cardId === drawn);
    if (shadow) {
      insights.push({
        type: "shadow_card",
        priority: "high",
        cardId: drawn,
        message: shadow.note,
      });
    }
  }

  // ── Dominant theme resonance ───────────────────────────────────────────────
  if (patterns.dominantThemes.length >= 2) {
    insights.push({
      type: "dominant_theme",
      priority: "medium",
      message: `Your readings consistently return to ${patterns.dominantThemes[0].theme} and ${patterns.dominantThemes[1]?.theme || "reflection"}. These are your active growth edges.`,
      themes: patterns.dominantThemes.slice(0, 3).map(t => t.theme),
    });
  }

  // ── I Ching convergence ────────────────────────────────────────────────────
  if (patterns.iChingConvergence.length) {
    insights.push({
      type: "ching_convergence",
      priority: "medium",
      message: patterns.iChingConvergence[0].note,
      hexagram: patterns.iChingConvergence[0].hexagram,
    });
  }

  // ── Reversal pattern ──────────────────────────────────────────────────────
  if (patterns.reversalPattern) {
    insights.push({
      type: "reversal_pattern",
      priority: "low",
      message: patterns.reversalPattern.note,
      tendency: patterns.reversalPattern.tendency,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Save a completed reading's pattern data back to the Reading entity.
 * Call this after a reading is completed to enrich the stored data.
 *
 * @param {object} readingResult  - Output from interpretReading()
 * @param {object} existingData   - Existing Reading entity data to merge
 * @returns {object}              - Enriched data ready to save
 */
export function enrichReadingForSave(readingResult, existingData = {}) {
  if (!readingResult) return existingData;

  return {
    ...existingData,
    // Enrich cards_drawn with keyword cache for future pattern analysis
    cards_drawn: (existingData.cards_drawn || []).map((drawn, idx) => {
      const interp = readingResult.cardInterpretations?.[idx];
      if (!interp) return drawn;
      return {
        ...drawn,
        keywords: interp.keywords || [],
        custom:   interp.ancientThread
          ? `Linked to ${interp.ancientThread.name} (${interp.ancientThread.hexagram}) from the I Ching, symbolizing ${interp.ancientThread.symbolism}.`
          : (drawn.custom || null),
      };
    }),
    // Store reading metadata for learning layer
    _reading_meta: {
      dominantThemes:   readingResult.dominantThemes,
      readingTone:      readingResult.readingTone,
      iChingNums:       readingResult._meta?.iChingNums || [],
      reversalRate:     readingResult.reversalRate,
      hasResonances:    readingResult.resonances.length > 0,
      hasTensions:      readingResult.tensions.length > 0,
    },
  };
}

// ─── Milestone System ─────────────────────────────────────────────────────────

/**
 * Get milestone messages based on reading count.
 * These can be shown as celebratory moments in the UI.
 */
function getMilestones(count) {
  const milestones = [
    { at: 1,   message: "Your first reading. The oracle begins to know you." },
    { at: 5,   message: "5 readings complete. Patterns are starting to stir." },
    { at: 10,  message: "10 readings. Your first recurring themes are visible." },
    { at: 20,  message: "20 readings. The I Ching threads are converging." },
    { at: 50,  message: "50 readings. Your personal oracle profile is fully active." },
    { at: 100, message: "100 readings. The oracle knows you deeply." },
  ];

  return milestones
    .filter(m => count >= m.at)
    .slice(-1); // Return only the most recent milestone
}

function getMaturityLevel(count) {
  if (count >= MIN_READINGS_FOR_FULL) return {
    maturityLevel: "oracle",
    maturityLabel: "Full oracle profile active",
  };
  if (count >= MIN_READINGS_FOR_CHING) return {
    maturityLevel: "deepening",
    maturityLabel: "I Ching patterns emerging",
  };
  if (count >= MIN_READINGS_FOR_PATTERNS) return {
    maturityLevel: "awakening",
    maturityLabel: "Personal patterns forming",
  };
  return {
    maturityLevel: "seedling",
    maturityLabel: `${MIN_READINGS_FOR_PATTERNS - count} more readings to unlock patterns`,
  };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getMostFrequent(arr) {
  const counts = arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function buildRecurringCardNote(appearances, reversalRate, position, totalReadings) {
  const pct = Math.round((appearances / totalReadings) * 100);
  const posNote = position ? ` often in the ${position} position` : "";
  if (reversalRate > 0.6) {
    return `This card has appeared ${appearances} times (${pct}% of your readings)${posNote}, frequently reversed — it carries persistent shadow work for you.`;
  }
  if (reversalRate > 0.4) {
    return `This card has appeared ${appearances} times (${pct}% of your readings)${posNote}, sometimes reversed — its message is still integrating.`;
  }
  return `This card has appeared ${appearances} times (${pct}% of your readings)${posNote} — it carries a sustained message for you.`;
}

function buildReversalNote(rate) {
  if (rate > 0.6) return "Your readings draw heavily reversed — a season of deep inner work and shadow integration.";
  if (rate > 0.4) return "Your readings balance upright and reversed — inner and outer work are equally active.";
  if (rate > 0.2) return "Your readings lean upright with occasional reversals — energy is mostly outward-flowing.";
  return "Your readings are predominantly upright — a period of clear outward expression and action.";
}

function analyzeQuestionThemes(words, totalReadings) {
  if (totalReadings < MIN_READINGS_FOR_PATTERNS) return [];

  const themeKeywords = {
    love:        ["love", "relationship", "partner", "romance", "heart", "connection"],
    career:      ["work", "career", "job", "money", "business", "success", "path"],
    growth:      ["grow", "change", "transform", "evolve", "learn", "become"],
    guidance:    ["guide", "direction", "path", "should", "need", "help", "sign"],
    creativity:  ["create", "art", "music", "write", "make", "build", "express"],
    healing:     ["heal", "health", "pain", "release", "let go", "forgive", "peace"],
    purpose:     ["purpose", "meaning", "why", "soul", "calling", "destiny"],
  };

  const themeCounts = {};
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const count = words.filter(w => keywords.some(k => w.includes(k))).length;
    if (count > 0) themeCounts[theme] = count;
  }

  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme, count]) => ({ theme, count }));
}

export { getMaturityLevel, getMilestones };