export const DEFAULT_BACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200&auto=format&fit=crop"; // starry abstract fallback

export function getDeckBackImage(deck) {
  if (!deck) return DEFAULT_BACK_IMAGE_URL;
  // Support legacy or alternate field names
  const url =
    deck.back_image_url ||
    deck.back_image ||
    deck.card_back_url ||
    deck.card_back ||
    null;
  return url && String(url).trim().length > 0 ? url : DEFAULT_BACK_IMAGE_URL;
}