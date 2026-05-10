import { base44 } from "@/api/base44Client";

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

export const getCardRelationship = async (id1, id2) => {
  if (!id1 || !id2) return null;
  const pair = [String(id1), String(id2)].sort().join("|");
  try {
    const relations = await base44.entities.CardRelationship.filter({ relationship_key: pair });
    if (relations && relations.length > 0 && relations[0].custom_notes) {
      return relations[0].custom_notes;
    }
  } catch (e) {
    console.error("Failed to fetch card relationship", e);
  }
  return null;
};