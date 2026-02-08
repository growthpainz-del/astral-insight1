import React from "react";

export default function ShuffleAnimation({ url, className = "", style = {} }) {
  if (!url) return null;
  const isGif = /\.gif($|\?)/i.test(url);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/15 bg-black/30 ${className}`}
      style={{ aspectRatio: '16/9', ...style }}
    >
      {isGif ? (
        <img
          src={url}
          alt="Shuffle animation"
          className="w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <video
          src={url}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
        />
      )}
    </div>
  );
}