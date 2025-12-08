import React from "react";
import { Coins } from "lucide-react";

/**
 * TOKEN COSTS - Three-tier reading system
 */
const TOKEN_COSTS = {
  READING_QUICK: 1,      // Quick reading (1-2 paragraphs)
  READING_STANDARD: 2,   // Standard reading (3-4 paragraphs)
  READING_DEEP: 4,       // Deep reading (5-7 paragraphs)
  FUSION: 1,             // Fusion readings
  IMAGE_GEN: 2,          // AI image generation
  BULK_IMAGE: 2,         // Per-card bulk generation
};

export default function TokenCostPreview({ action = "reading", quantity = 1, readingTier = "standard" }) {
  const getCost = () => {
    switch (action) {
      case "reading":
        if (readingTier === "quick") return TOKEN_COSTS.READING_QUICK * quantity;
        if (readingTier === "deep") return TOKEN_COSTS.READING_DEEP * quantity;
        return TOKEN_COSTS.READING_STANDARD * quantity;
      case "reading_quick":
        return TOKEN_COSTS.READING_QUICK * quantity;
      case "reading_standard":
      case "simple":
      case "complex":
        return TOKEN_COSTS.READING_STANDARD * quantity;
      case "reading_deep":
        return TOKEN_COSTS.READING_DEEP * quantity;
      case "fusion":
        return TOKEN_COSTS.FUSION * quantity;
      case "image":
      case "generate":
        return TOKEN_COSTS.IMAGE_GEN * quantity;
      case "bulk_image":
        return TOKEN_COSTS.BULK_IMAGE * quantity;
      default:
        return 1 * quantity;
    }
  };

  const cost = getCost();
  const actionName = {
    reading: readingTier === "quick" ? "Quick Reading" : readingTier === "deep" ? "Deep Reading" : "Standard Reading",
    reading_quick: "Quick Reading",
    reading_standard: "Standard Reading",
    reading_deep: "Deep Reading",
    simple: "Reading",
    complex: "Reading",
    fusion: "Fusion Reading",
    image: "AI Image",
    generate: "AI Image",
    bulk_image: "Bulk Images"
  }[action] || "Action";

  return (
    <div className="inline-flex items-center gap-2 bg-purple-900/20 border border-purple-500/40 rounded-lg px-3 py-1.5">
      <Coins className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-semibold text-white">
        {cost} token{cost !== 1 ? "s" : ""}
      </span>
      <span className="text-xs text-purple-300">
        ({actionName}{quantity > 1 ? ` × ${quantity}` : ""})
      </span>
    </div>
  );
}

export { TOKEN_COSTS };