import React from "react";
import { X } from "lucide-react";
import { safeText } from "@/components/utils/safeText";

export default function CardDetailsPanel(props) {
  const { open = true, onClose, card, position } = props || {};

  const close = () => onClose && onClose();

  const positionFromCard = (card && (card.__position || card.position)) || null;
  const positionInfo = position || positionFromCard || null;

  if (!open) return null;

  const img =
    card?.image_url ||
    card?.card?.image_url ||
    card?.image ||
    "";
  const name = safeText(card?.name || card?.card?.name || "Card");
  const overall = safeText(card?.overall_meaning || card?.card?.overall_meaning);
  const upright = safeText(card?.upright_meaning || card?.card?.upright_meaning);
  const reversed = safeText(card?.reversed_meaning || card?.card?.reversed_meaning);
  const keywords = Array.isArray(card?.keywords || card?.card?.keywords)
    ? (card?.keywords || card?.card?.keywords).join(", ")
    : safeText(card?.keywords || card?.card?.keywords);
  const notes = safeText(card?.custom || card?.notes || card?.card?.custom || card?.card?.notes);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close panel"
        className="flex-1 bg-black/40"
        onClick={close}
      />
      <div className="w-full sm:max-w-md h-full bg-gradient-to-br from-violet-900/80 via-indigo-900/80 to-slate-900/80 border-l border-purple-500/20 text-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {img ? (
              <img
                src={img}
                alt={name || "Card"}
                className="w-9 h-12 rounded-md object-cover shadow"
              />
            ) : null}
            <h2 className="text-base sm:text-lg font-semibold">{name || "Card"}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-white/10 border border-white/20 p-1 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {positionInfo && (
            <div className="p-3 rounded-md bg-white/5 border border-white/10">
              {positionInfo.name ? (
                <div className="text-sm font-semibold text-white">{positionInfo.name}</div>
              ) : null}
              {positionInfo.meaning ? (
                <div className="text-xs text-white/80 mt-1 whitespace-pre-wrap">
                  {positionInfo.meaning}
                </div>
              ) : null}
            </div>
          )}

          {overall && (
            <section>
              <h3 className="text-sm text-white/70">Overall Meaning</h3>
              <p className="text-white/90 whitespace-pre-wrap">{overall}</p>
            </section>
          )}

          {upright && (
            <section>
              <h3 className="text-sm text-white/70">Upright Meaning</h3>
              <p className="text-white/90 whitespace-pre-wrap">{upright}</p>
            </section>
          )}

          {reversed && (
            <section>
              <h3 className="text-sm text-white/70">Reversed Meaning</h3>
              <p className="text-white/90 whitespace-pre-wrap">{reversed}</p>
            </section>
          )}

          {keywords && keywords.trim() && (
            <section>
              <h3 className="text-sm text-white/70">Keywords</h3>
              <p className="text-white/90">{keywords}</p>
            </section>
          )}

          {notes && notes.trim() && (
            <section>
              <h3 className="text-sm text-white/70">Notes</h3>
              <p className="text-white/90 whitespace-pre-wrap">{notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}