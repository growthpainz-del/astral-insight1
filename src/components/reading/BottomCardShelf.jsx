import React from "react";
import { CARD_ASPECT_RATIO } from "@/components/utils/cardSizing";

export default function BottomCardShelf({ cards = [], onCardClick = () => {} }) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div className="text-sm text-purple-200 mb-2 flex items-center justify-between">
        <span>Available Cards ({cards.length})</span>
      </div>
      <div style={{ width: "100%", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: 8,
            width: "100%",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          className="shelf-scroll"
        >
          {cards.map((card, idx) => (
            <div
              key={card.id || idx}
              className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 hover:border-purple-400/50 transition p-1"
              onClick={() => onCardClick(card, idx)}
              title={card.name}
              style={{
                width: 72,
                height: Math.round(72 * CARD_ASPECT_RATIO),
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-full h-full object-cover rounded"
                  draggable={false}
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full items-center justify-center text-white/70 text-xs text-center"
                style={{ display: card.image_url ? "none" : "flex" }}
              >
                {card.name || "Card"}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .shelf-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}