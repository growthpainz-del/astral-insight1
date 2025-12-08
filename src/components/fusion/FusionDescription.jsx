import React from "react";
import { base44 } from "@/api/base44Client";

/**
 * Renders a dynamic description for a Fusion Reading:
 * - If recipeId exists, uses recipe_content.summary (if available).
 * - Else, if a "summary" url param exists, uses that.
 * - Else, shows a generic blend line using the two deck names.
 *
 * NOTE: This component only controls the description text.
 * The two deck titles at the top remain as they are on the page.
 */
export default function FusionDescription({ deck1Id, deck2Id, recipeId }) {
  const [deckA, setDeckA] = React.useState(null);
  const [deckB, setDeckB] = React.useState(null);
  const [summary, setSummary] = React.useState("");

  // Read optional summary from URL for Builder → Reading handoff
  React.useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const fromUrlSummary = url.get("summary");
    if (fromUrlSummary && !summary) {
      try {
        // Handle potential double-encoding
        setSummary(decodeURIComponent(fromUrlSummary));
      } catch {
        setSummary(fromUrlSummary);
      }
    }
  }, []);

  // Fetch decks for fallback description
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (deck1Id) {
          const d1 = await base44.entities.Deck.get(deck1Id);
          if (!cancelled) setDeckA(d1);
        }
        if (deck2Id) {
          const d2 = await base44.entities.Deck.get(deck2Id);
          if (!cancelled) setDeckB(d2);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deck1Id, deck2Id]);

  // Load selected recipe summary
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!recipeId) return;
      try {
        const recipe = await base44.entities.FusionRecipe.get(recipeId);
        const rc = recipe?.recipe_content;
        let parsed;
        if (typeof rc === "string") {
          try { parsed = JSON.parse(rc); } catch { /* not JSON */ }
        } else if (rc && typeof rc === "object") {
          parsed = rc;
        }
        const s = parsed?.summary || (typeof rc === "string" ? rc.slice(0, 240) : "");
        if (!cancelled && s) setSummary(s);
      } catch {
        // ignore recipe errors (fallback below)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const fallbackText = React.useMemo(() => {
    const a = deckA?.name || "Deck A";
    const b = deckB?.name || "Deck B";
    return `Blend the essence of ${a} with ${b} for deeper, combined insight.`;
  }, [deckA?.name, deckB?.name]);

  return (
    <p className="text-white/80 mt-2">
      {summary?.trim() ? summary : fallbackText}
    </p>
  );
}