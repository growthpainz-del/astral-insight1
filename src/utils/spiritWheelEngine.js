/**
 * Spirit Wheel Core Engine
 * Handles deterministic spinning, Metatron's Cube logic, and Synergy rules.
 */

// 1. Deterministic Spin Engine (Seeded RNG)
export const hashSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const pickWeighted = (segments, rngValue) => {
  if (!segments || segments.length === 0) return 0;
  const totalWeight = segments.reduce((sum, seg) => sum + (seg.weight || 10), 0);
  let randomVal = rngValue * totalWeight;
  for (let i = 0; i < segments.length; i++) {
    const weight = segments[i].weight || 10;
    if (randomVal <= weight) return i;
    randomVal -= weight;
  }
  return segments.length - 1;
};

export const calculateTargetAngle = (currentRotation, extraSpins, segmentIndex, totalSegments) => {
  if (totalSegments === 0) return currentRotation;
  const segmentAngle = 360 / totalSegments;
  const targetSegmentCenter = (segmentIndex * segmentAngle);
  // Determine what angle lands this segment at the top (0 degrees pointer)
  const baseTarget = 360 - targetSegmentCenter;
  return currentRotation + (extraSpins * 360) + baseTarget;
};

// 2. Metatron's Cube Zone System
export const calculateMetatronZone = (stopAngle, metatronRotation = 12) => {
  // 6-fold symmetry — collapse to 60° sector
  const relative = ((stopAngle - metatronRotation) % 360 + 360) % 360;
  const sector = relative % 60;
  
  let zone = 'Vector';
  if (sector > 15 && sector <= 45) {
    zone = 'Void';
  } else if (sector > 45) {
    zone = 'Tangent';
  }
  
  return {
    angle: stopAngle,
    relativeAngle: relative,
    sectorAngle: sector,
    zone: zone, 
    description: zone === 'Vector' ? 'High resonance — full activation' :
                 zone === 'Void' ? 'Dissolution — potential unrealized' :
                 'Binding — held just out of reach'
  };
};

// 3. Synergy Engine
export const evaluateSynergies = (drawnCardIds, synergyRules) => {
  if (!synergyRules || !Array.isArray(synergyRules)) return [];
  const triggered = [];
  for (const rule of synergyRules) {
    if (!rule.trigger_ids || !Array.isArray(rule.trigger_ids)) continue;
    const allPresent = rule.trigger_ids.every(id => drawnCardIds.includes(id));
    if (allPresent) {
      triggered.push(rule);
    }
  }
  return triggered;
};