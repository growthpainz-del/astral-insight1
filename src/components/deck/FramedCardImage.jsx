import React from 'react';
import { logError } from '@/components/utils/errorHandler';

const frameStyles = {
  none: '',
  vignette_burn: 'brightness-95 contrast-110',
  black_border: 'border-[8px] border-black',
  white_border: 'border-[8px] border-white',
};

export default function FramedCardImage({ 
  src, 
  alt = "Card", 
  frameStyle = "none", 
  isReversed = false,
  className = "",
  onLoad,
  onError,
  ...props 
}) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  const handleImageLoad = (e) => {
    setImageLoading(false);
    setImageError(false);
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e) => {
    // FIX: Properly extract error message
    const errorMsg = e?.error?.message || e?.message || 'Failed to load image';
    logError('FramedCardImage error', errorMsg, src);
    setImageError(true);
    setImageLoading(false);
    if (onError) onError(e);
  };

  if (imageError) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-white/30 text-4xl mb-2">🃏</div>
          <p className="text-white/60 text-xs">{alt}</p>
          <p className="text-red-400/60 text-[10px] mt-1">Image unavailable</p>
        </div>
      </div>
    );
  }

  const frameClass = frameStyles[frameStyle] || frameStyles.none;
  const rotationClass = isReversed ? 'rotate-180' : '';

  return (
    <div className={`relative w-full h-full ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${frameClass} ${rotationClass}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        {...props}
      />
    </div>
  );
}