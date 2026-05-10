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

export const getCardRelationship = async (card1, card2) => {
  if (!card1 || !card2) return null;
  
  let id1 = card1.card_id;
  let id2 = card2.card_id;
  
  // If we need to look up by name for either card
  if ((!id1 && card1.name) || (!id2 && card2.name)) {
    try {
      const deckId = "68e5da16144fc658238689c6";
      const cards = await base44.entities.Card.filter({ deck_id: deckId });
      
      if (!id1 && card1.name) {
        const c1 = cards.find(c => c.name?.toLowerCase() === card1.name?.toLowerCase());
        if (c1) id1 = c1.id;
      }
      if (!id2 && card2.name) {
        const c2 = cards.find(c => c.name?.toLowerCase() === card2.name?.toLowerCase());
        if (c2) id2 = c2.id;
      }
    } catch (e) {
      console.error("Failed to fetch cards for relationship lookup", e);
    }
  }

  if (id1 && id2) {
    try {
      const pair = [String(id1), String(id2)].sort().join("|");
      const relations = await base44.entities.CardRelationship.filter({ relationship_key: pair });
      if (relations && relations.length > 0 && relations[0].custom_notes) {
        return relations[0].custom_notes;
      }
    } catch (e) {
      console.error("Failed to fetch card relationship", e);
    }
  }
  return null;
};