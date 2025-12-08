import React from "react";
import { X } from "lucide-react";
import { safeText } from "@/components/utils/safeText";

export default function CardDetailsModal({ open, onClose, card, position }) {
  const handleClose = React.useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
    console.log('CardDetailsModal close button clicked');
    onClose?.();
  }, [onClose]);

  // Add support for showing the spread position info
  const positionFromCard = (card && (card.__position || card.position)) || null;
  const positionInfo = position || positionFromCard || null;

  if (!card || !open) {
    return null;
  }

  const img = card.image_url || card.image || card.cover_image;
  const name = safeText(card?.name);
  const overall = safeText(card?.overall_meaning);
  const upright = safeText(card?.upright_meaning);
  const reversed = safeText(card?.reversed_meaning);
  const keywords = Array.isArray(card?.keywords) ? card.keywords.join(", ") : safeText(card?.keywords);
  const notes = safeText(card?.custom || card?.notes);

  return (
    <div className="max-w-2xl md:max-w-3xl bg-gradient-to-br from-slate-900/98 via-purple-900/98 to-indigo-900/98 backdrop-blur-lg border border-purple-500/30 text-white rounded-2xl relative shadow-2xl p-6">
      {/* Close button - positioned absolutely with highest z-index */}
      <button
        type="button"
        onClick={handleClose}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose(e);
        }}
        className="absolute right-3 top-3 rounded-full bg-red-600/80 hover:bg-red-700 border-2 border-white/40 p-2 text-white transition-all z-[9999] cursor-pointer shadow-lg hover:scale-110 active:scale-95"
        aria-label="Close"
        style={{ touchAction: 'none' }}
      >
        <X className="w-5 h-5 stroke-[3]" />
      </button>

      {positionInfo && (
        <div className="mb-4 p-3 rounded-md bg-purple-500/20 border border-purple-400/30">
          {positionInfo.name && (
            <div className="text-sm font-semibold text-purple-100">{positionInfo.name}</div>
          )}
          {positionInfo.meaning && (
            <div className="text-xs text-purple-200 mt-1 whitespace-pre-wrap">
              {positionInfo.meaning}
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-3">
          {img && (
            <img
              src={img}
              alt={name || "Card"}
              className="w-12 h-16 rounded-md object-cover shadow-md border border-white/20 flex-shrink-0"
            />
          )}
          <h2 className="text-xl md:text-2xl font-bold text-white pr-8">{name || "Card"}</h2>
        </div>
      </div>

      <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
        {overall && (
          <section>
            <h3 className="text-sm font-semibold text-purple-200 mb-1">Overall Meaning</h3>
            <p className="text-white whitespace-pre-wrap leading-relaxed">{overall}</p>
          </section>
        )}

        {upright && (
          <section>
            <h3 className="text-sm font-semibold text-purple-200 mb-1">Upright Meaning</h3>
            <p className="text-white whitespace-pre-wrap leading-relaxed">{upright}</p>
          </section>
        )}

        {reversed && (
          <section>
            <h3 className="text-sm font-semibold text-purple-200 mb-1">Reversed Meaning</h3>
            <p className="text-white whitespace-pre-wrap leading-relaxed">{reversed}</p>
          </section>
        )}

        {keywords && keywords.trim() && (
          <section>
            <h3 className="text-sm font-semibold text-purple-200 mb-1">Keywords</h3>
            <p className="text-white">{keywords}</p>
          </section>
        )}

        {notes && notes.trim() && (
          <section>
            <h3 className="text-sm font-semibold text-purple-200 mb-1">Notes</h3>
            <p className="text-white whitespace-pre-wrap leading-relaxed">{notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}