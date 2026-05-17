import React from "react";
import { CARD_ASPECT_RATIO } from "@/components/utils/cardSizing";

export default function BottomCardShelf({ cards = [], onCardClick = () => {} }) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="text-sm text-purple-200 mb-2 flex items-center justify-between">
        <span>Available Cards ({cards.length})</span>
      </div>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {cards.map((card, idx) => (
            <div
              key={card.id || idx}
              className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 hover:border-purple-400/50 transition p-1"
              onClick={() => onCardClick(card, idx)}
              title={card.name}
              style={{ width: 90, height: Math.round(90 * CARD_ASPECT_RATIO), cursor: "pointer" }}
            >
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-full h-full object-cover rounded"
                  draggable={false}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-full h-full items-center justify-center text-white/70 text-xs"
                style={{ display: card.image_url ? 'none' : 'flex' }}
              >
                {card.name || "Card"}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}