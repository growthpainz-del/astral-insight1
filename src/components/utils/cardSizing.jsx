// Shared card sizing utility to ensure consistency across the app

// Modern card proportions: 9:16 aspect ratio (width:height)
// This means height = width * (16/9) = width * 1.778
export const CARD_ASPECT_RATIO = 16 / 9; // 1.778

/**
 * Calculate optimal card dimensions based on container and card count
 * @param {number} containerWidth - Width of the container in pixels
 * @param {number} cardCount - Number of cards to display
 * @param {boolean} isVerticalSpread - Whether cards are stacked vertically
 * @returns {{cardWidth: number, cardHeight: number}}
 */
export function calculateCardSize(containerWidth, cardCount, isVerticalSpread = false) {
  const w = containerWidth || 360;
  
  // Special case: Single card gets optimal size
  if (cardCount === 1) {
    const cardWidth = Math.min(Math.round(w * 0.5), 280);
    return {
      cardWidth,
      cardHeight: Math.round(cardWidth * CARD_ASPECT_RATIO)
    };
  }
  
  // Determine scaling factor based on card count
  let factor;
  if (cardCount <= 3) {
    factor = 0.42;
  } else if (cardCount <= 5) {
    factor = 0.28;
  } else if (cardCount <= 7) {
    factor = 0.22;
  } else if (cardCount <= 10) {
    factor = 0.18;
  } else {
    factor = 0.15;
  }
  
  // Vertical spreads can be slightly wider per card
  if (isVerticalSpread && cardCount > 3) {
    factor *= 1.2;
  }
  
  const cardWidth = Math.max(80, Math.min(Math.round(w * factor), 380));
  const cardHeight = Math.round(cardWidth * CARD_ASPECT_RATIO);
  
  return { cardWidth, cardHeight };
}

/**
 * Calculate optimal container height for a spread
 * @param {number} cardWidth - Width of a single card
 * @param {number} cardCount - Number of cards
 * @param {boolean} isVerticalSpread - Whether cards are stacked vertically
 * @param {boolean} requiresPositions - Whether spread has custom positions
 * @returns {number} Minimum container height in pixels
 */
export function calculateContainerHeight(cardWidth, cardCount, isVerticalSpread, requiresPositions) {
  const cardHeight = Math.round(cardWidth * CARD_ASPECT_RATIO);
  
  // Single card needs extra padding
  if (cardCount === 1) {
    return Math.max(cardHeight * 3, 600);
  }
  
  // Vertical spreads need height for stacking
  if (isVerticalSpread) {
    return Math.max(cardHeight * cardCount * 1.2, 800);
  }
  
  // Custom positioned spreads need varied heights
  if (requiresPositions) {
    if (cardCount <= 3) return cardHeight * 2.2;
    if (cardCount <= 5) return cardHeight * 2.8;
    return cardHeight * 3.5;
  }
  
  // Horizontal spreads
  return cardHeight * 1.6;
}

/**
 * Get optimal aspect ratio for spread designer canvas
 * @param {number} cardCount - Number of cards in spread
 * @returns {string} CSS aspect-ratio value
 */
export function getDesignerAspectRatio(cardCount) {
  if (cardCount === 1) return "1 / 1";      // Square for single card
  if (cardCount <= 3) return "16 / 9";     // Wide for few cards
  if (cardCount <= 7) return "4 / 3";      // Medium for most spreads
  return "3 / 2";                           // Wider for many cards
}