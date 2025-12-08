import React from "react";
import CensorReveal from "@/components/media/CensorReveal";

export default function CensoredImage({
  deck,
  src,
  alt = "",
  className = "",
  rounded = "rounded-2xl",
  width = 640,
  height = 400,
}) {
  const mode = deck?.censor_mode || "none";

  if (mode === "none") {
    return (
      <img
        src={src}
        alt={alt}
        className={`w-full h-auto object-contain ${rounded} ${className}`}
        draggable={false}
      />
    );
  }

  const overlayOpacity = typeof deck?.censor_overlay_opacity === "number" ? deck.censor_overlay_opacity : 0.85;
  const blurAmount = typeof deck?.censor_blur_amount === "number" ? deck.censor_blur_amount : 20;
  const overlayColor = `rgba(0,0,0,${Math.max(0.5, Math.min(0.98, overlayOpacity))})`;

  return (
    <CensorReveal
      src={src}
      alt={alt}
      mode={mode}
      overlayColor={overlayColor}
      blurAmount={blurAmount}
      rounded={rounded}
      className={className}
      width={width}
      height={height}
    />
  );
}