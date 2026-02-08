import React from "react";
import SpreadLayout from "@/components/reading/SpreadLayout";

export default function CompactSpread({
  spread,
  positions,
  cards,
  deck,
  viewMode,
  revealedCards,
  onCardClick,
  onCardReveal,
}) {
  return (
    <div className="w-full md:max-w-[420px] lg:max-w-[520px]">
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <SpreadLayout
          spread={spread}
          positions={positions}
          cards={cards}
          deck={deck}
          onCardClick={onCardClick}
          revealedCards={revealedCards}
          onCardReveal={onCardReveal}
          animateSpread={false}
          viewMode={viewMode}
          sizeScale={0.6}
          defaultCardWidth={80}
          allowReposition={false}
          containerMinH="480px"
        />
      </div>
    </div>
  );
}