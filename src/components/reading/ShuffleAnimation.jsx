import React from "react";

export default function ShuffleAnimation({ url, className = "", style = {} }) {
  if (!url) return null;
  const isGif = /\.gif($|\?)/i.test(url);
  const videoRef = React.useRef(null);
  const [autoplayFailed, setAutoplayFailed] = React.useState(false);

  const tryPlay = React.useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = true; // ensure muted before play for iOS
      await v.play();
      setAutoplayFailed(false);
    } catch (e) {
      // Autoplay blocked; show tap-to-play overlay
      setAutoplayFailed(true);
      try { v.load(); } catch (_) {}
    }
  }, []);

  React.useEffect(() => {
    setAutoplayFailed(false);
    const t = setTimeout(() => { tryPlay(); }, 50);
    return () => clearTimeout(t);
  }, [url, tryPlay]);

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
        <div className="relative w-full h-full">
          <video
            key={url}
            ref={videoRef}
            src={url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            defaultMuted
            playsInline
            loop
            preload="auto"
            disablePictureInPicture
            onLoadedData={tryPlay}
            onPlay={() => setAutoplayFailed(false)}
            onError={() => setAutoplayFailed(true)}
          />
          {autoplayFailed && (
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm"
              onClick={tryPlay}
            >
              Tap to play animation
            </button>
          )}
        </div>
      )}
    </div>
  );
}