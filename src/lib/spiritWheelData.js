export const CATEGORIES = ["General", "Love", "Career", "Spiritual", "Astrology"];
export const ROOTED_CARDS_DATA = [];
export const WHEEL_MIDDLE = [];
export const WHEEL_INNER = [];

// 5.1 Deterministic Selection
export function hashSeed(phrase) {
  if (!phrase) return Math.random();
  let h = 0;
  for (let i = 0; i < phrase.length; i++) {
    h = Math.imul(31, h) + phrase.charCodeAt(i) | 0;
  }
  return Math.abs(h) / 2147483648; // map to 0-1
}

export function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function pickWeighted(segments, rng) {
  if (!segments || segments.length === 0) return null;
  const totalWeight = segments.reduce((sum, seg) => sum + (seg.weight || 10), 0);
  let rand = rng() * totalWeight;
  for (let i = 0; i < segments.length; i++) {
    rand -= (segments[i].weight || 10);
    if (rand <= 0) return segments[i];
  }
  return segments[segments.length - 1];
}

// 5.2 Rotation Math
export function computeTargetAngle(numSegments, targetIndex, currentAngle, extraSpins, direction) {
  if (!numSegments || numSegments === 0) return currentAngle;
  const segAngle = (Math.PI * 2) / numSegments;
  const segCenter = targetIndex * segAngle + segAngle / 2;
  
  // Target rotation: -PI/2 - segCenter, normalized for direction
  let target = -Math.PI / 2 - segCenter;
  
  // Convert to degrees for Canvas rotation ease
  let targetDeg = target * (180 / Math.PI);
  targetDeg += (extraSpins * 360 * direction);
  return targetDeg;
}

// 5.4 Synergy Detection
export function checkSynergy(selectedIds, rules) {
  if (!rules || !Array.isArray(rules)) return null;
  for (const rule of rules) {
    if (rule.trigger_ids && rule.trigger_ids.every(id => selectedIds.includes(id))) {
      return rule;
    }
  }
  return null;
}

// 5.5 Synthesis Generation
export function buildSynthesis(picks, ringKeys, shadowSeg, synergy, engineConfig) {
  const style = engineConfig?.synthesis_style || 'classic';
  let reading = engineConfig?.reading_intro ? `${engineConfig.reading_intro}\n\n` : '';

  if (style === 'poetic') {
    reading += `Core Energy breathes through ${picks.outer1?.label || 'the void'} - ${picks.outer1?.meaning || ''}\n`;
    if (picks.outer2) reading += `Echoing alongside ${picks.outer2.label} - ${picks.outer2.meaning}\n`;
    reading += `Context weaves through ${picks.middle?.label} - ${picks.middle?.meaning}\n`;
    reading += `Guidance illuminates ${picks.inner?.label} - ${picks.inner?.meaning}\n`;
  } else if (style === 'direct') {
    reading += `Core Energy I: ${picks.outer1?.label}. ${picks.outer1?.meaning}\n`;
    if (picks.outer2) reading += `Core Energy II: ${picks.outer2.label}. ${picks.outer2.meaning}\n`;
    reading += `Context: ${picks.middle?.label}. ${picks.middle?.meaning}\n`;
    reading += `Action: ${picks.inner?.label}. ${picks.inner?.meaning}\n`;
  } else if (style === 'question') {
    reading += `Core Energy I - ${picks.outer1?.label}: How might ${picks.outer1?.meaning}?\n`;
    reading += `Context - ${picks.middle?.label}: Consider ${picks.middle?.meaning}\n`;
  } else {
    // classic
    reading += `Your Core Energy is ${picks.outer1?.label}: ${picks.outer1?.meaning}\n`;
    if (picks.outer2) reading += `Secondary Energy: ${picks.outer2.label}: ${picks.outer2.meaning}\n`;
    reading += `The Context: ${picks.middle?.label}: ${picks.middle?.meaning}\n`;
    reading += `Suggested Action: ${picks.inner?.label}: ${picks.inner?.meaning}\n`;
  }

  if (picks.rune) {
    reading += `\nRune whisper: ${picks.rune.label} - ${picks.rune.meaning}\n`;
  }
  if (shadowSeg) {
    reading += `\nShadow Aspect: ${shadowSeg.label} - ${shadowSeg.meaning}\n`;
  }
  if (synergy) {
    reading += `\n✨ Cosmic Synergy: ${synergy.combined_meaning || 'Energies align in harmony.'}\n`;
  }

  return reading;
}