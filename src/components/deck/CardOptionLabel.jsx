import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export default function CardOptionLabel({ card }) {
  const hasImage = Boolean(card?.image_url);
  const num = card?.number != null ? `${card.number}. ` : "";
  const name = card?.name || "Untitled";

  return (
    <div className="flex items-center gap-2">
      {hasImage ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <Circle className="w-4 h-4 text-white/30" />
      )}
      <span className="truncate">{num}{name}</span>
    </div>
  );
}