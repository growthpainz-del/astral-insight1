export const isImageSymbol = (id) => {
  if (!id || typeof id !== 'string') return false;
  const s = id.trim().toLowerCase();
  return s.startsWith('http') || s.startsWith('data:image') || /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/.test(s);
};

export const getImageUrl = (id) => {
  if (!id) return '';
  let url = id.trim().replace(/^['"]+|['"]+$/g, '');
  if (!url.startsWith('http') && !url.startsWith('data:image')) {
    url = 'https://' + url;
  }
  return url;
};

export const getCardRelationship = (id1, id2) => {
  if (!id1 || !id2) return null;
  const pair = [String(id1), String(id2)].sort((a, b) => parseInt(a) - parseInt(b)).join("|");
  const relationships = {
    "1|53": "The Rooted Journey and The Rooted Tree indicate complete grounding and an unshakeable foundation.",
    "7|29": "The Seer's Gaze and Echoes of the Mind reveal that your inner guidance is offering profound clarity.",
    "10|36": "Between the Folds and With Chains Unbound suggest that patience will soon break your old patterns.",
    "13|39": "The Wild Embrace and Veins of the Void urge you to unleash your passions to claim your true self.",
    "20|44": "Illuminating Insight and Cascading Illumination indicate a massive flow of inspiration lighting your path.",
    "21|40": "Luna Duala and The Triad of Synergy point to ultimate harmonization of mind, body, and spirit.",
    "23|39": "The 4 Shadows and Veins of the Void challenge you to embrace your shadows to find true freedom.",
    "25|48": "The Cosmic Vision and Harmonic Gates of Ascension mean you are aligning with cosmic flow for a major transformation."
  };
  return relationships[pair] || null;
};