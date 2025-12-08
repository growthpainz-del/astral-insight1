
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Stop all propagation/defaults to avoid clicks hitting cards behind
const stopAll = (e) => {
  if (!e) return;
  e.preventDefault?.();
  e.stopPropagation?.();
  if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
    e.nativeEvent.stopImmediatePropagation();
  }
};

// NEW: stop only bubbling (allow default so links can navigate)
const stopBubbleOnly = (e) => {
  if (!e) return;
  e.stopPropagation?.();
  if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
    e.nativeEvent.stopImmediatePropagation();
  }
};

const Field = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      <div className="text-sm text-white/90 whitespace-pre-line">{value}</div>
    </div>
  );
};

export default function QuickCardPreview({
  isOpen,
  onClose,
  card,
  positionLabel,
}) {
  // Hooks MUST be at top-level, never after conditionals
  const [showDetails, setShowDetails] = React.useState(false);

  // Let the app know when this bottom sheet is visible so floating buttons can hide
  React.useEffect(() => {
    if (isOpen) {
      try {
        document.body.setAttribute('data-reading-bottom-sheet', 'open');
        window.dispatchEvent(new CustomEvent('readingBottomSheetOpen'));
      } catch (e) {
        console.error("Error setting data attribute or dispatching event:", e);
      }
      return () => {
        try {
          document.body.removeAttribute('data-reading-bottom-sheet');
          window.dispatchEvent(new CustomEvent('readingBottomSheetClose'));
        } catch (e) {
          console.error("Error removing data attribute or dispatching event:", e);
        }
      };
    }
  }, [isOpen]);

  // Listen for global close request (e.g., when AI panel opens)
  React.useEffect(() => {
    const handler = () => {
      onClose?.();
    };
    window.addEventListener("closeQuickCardPreview", handler);
    return () => window.removeEventListener("closeQuickCardPreview", handler);
  }, [onClose]);

  // Early return after hooks are declared
  if (!isOpen || !card) return null;

  const isReversed = !!card.is_reversed;

  return (
    <div
      className="reading-bottom-sheet px-3"
      onMouseDown={stopBubbleOnly} // Changed from stopAll, removed onClick handler
    >
      <div className="mx-auto max-w-2xl rounded-2xl shadow-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/70 via-indigo-900/70 to-blue-900/70 backdrop-blur-md pr-20 md:pr-6 relative">
        {/* Removed: crescent moon link to DeckView Moon section */}

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-10 h-10 rounded-md object-cover border border-white/10"
              />
            ) : null}
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">{card.name || "Card"}</div>
              {positionLabel ? (
                <div className="text-xs text-white/75 truncate">
                  {positionLabel} {isReversed ? "(Reversed)" : "(Upright)"}
                </div>
              ) : (
                <div className="text-xs text-white/60">{isReversed ? "Reversed" : "Upright"}</div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            data-close-preview
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white"
            onMouseDown={stopAll}
            onClick={(e) => {
              stopAll(e);
              onClose?.();
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 text-sm text-white/90">
          {/* Short summary row */}
          {(card.upright_meaning || card.reversed_meaning) && (
            <div className="mb-2">
              <Field
                label={isReversed ? "Reversed Meaning" : "Upright Meaning"}
                value={isReversed ? card.reversed_meaning : card.upright_meaning}
              />
            </div>
          )}

          {/* Toggle for full details inside same panel (prevents opening another window) */}
          <button
            type="button"
            onMouseDown={stopAll}
            onClick={(e) => {
              stopAll(e);
              setShowDetails((v) => !v);
            }}
            className="w-full text-left px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-between"
          >
            <span className="font-medium">
              {showDetails ? "Hide Full Description" : "View Full Description"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showDetails && (
            <div className="mt-3 max-h-[50vh] overflow-y-auto bg-black/20 border border-white/10 rounded-md p-3 space-y-3">
              {Array.isArray(card.keywords) && card.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {card.keywords.map((k, i) => (
                    <Badge
                      key={i}
                      className="bg-purple-500/20 text-purple-200 border border-purple-500/30"
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              )}

              <Field label="Overall Meaning" value={card.overall_meaning} />
              <Field
                label={isReversed ? "Reversed Insight" : "Upright Insight"}
                value={isReversed ? card.reversed_insight : card.upright_insight}
              />
              <Field
                label={isReversed ? "Reversed Action" : "Upright Action"}
                value={isReversed ? card.reversed_action : card.upright_action}
              />
              <Field label="Ancient Wisdom" value={card.ancient_wisdom} />
              <Field label="Interaction" value={card.interaction} />
              <Field label="Musician Quote" value={card.musician_quote} />
              <Field label="Notes" value={card.custom} />

              {card.custom_fields && typeof card.custom_fields === "object" && (
                <div className="space-y-2">
                  {Object.entries(card.custom_fields).map(([key, field]) => {
                    if (!field?.value) return null;
                    return (
                      <Field
                        key={key}
                        label={field.label || key}
                        value={field.value}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
