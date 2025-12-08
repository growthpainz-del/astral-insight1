
import React from 'react';
import { motion } from 'framer-motion';
import FramedCardImage from '../deck/FramedCardImage';
import CardDetailsModal from '@/components/cards/CardDetailsModal';
import QuickCardPreview from './QuickCardPreview';
import { logError } from '@/components/utils/errorHandler'; // Imported logError

export default function CardInSpread({
  card,
  position,
  backImageUrl, // New prop
  isFlipped = false, // Now a prop, with default
  onFlip, // New callback for when card is clicked to flip
  onClick, // New callback for when card is clicked for details/general action
  requiresPositions = true, // New prop
  showPositionLabels = true, // New prop
  revealMode = "tap", // New prop: "tap", "auto", "manual"
  animateFlip = true, // New prop (though flip is now opacity-based in JSX)
  animateSpread = true, // New prop
  animationDelay = 0, // New prop
  interactive = true, // New prop
  allowReposition = false, // New prop
  onDrag, // New prop
  onDragEnd, // New prop
  dragConstraints, // New prop
  cardSize = { width: 120, height: 180 }, // New prop
  // customX, // Not used in provided outline, commented out for now
  // customY, // Not used in provided outline, commented out for now
}) {
  // State for quick preview and full details modals (kept local as per original functionality)
  const [showDetails, setShowDetails] = React.useState(false);
  const [showQuick, setShowQuick] = React.useState(false);

  // long-press state (kept as per existing code retention instruction)
  const [isHolding, setIsHolding] = React.useState(false);
  const wasLongPressRef = React.useRef(false);
  const holdTimerRef = React.useRef(null);

  // New image loading states
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  // Handlers for image loading
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    // FIX: Properly extract error message
    const errorMsg = e?.error?.message || e?.message || 'Failed to load card image';
    logError('Error loading card image', errorMsg, card?.image_url);
    setImageError(true);
    setImageLoading(false);
  };

  // --- Event Handling Logic for Tap/Long Press ---

  // Consolidated handler for regular tap behavior
  const handleCardTap = () => {
    if (!interactive || allowReposition) return;

    if (revealMode === "auto") {
      // Always face up, tap directly opens details/triggers generic click
      if (typeof onClick === 'function') {
        onClick(card);
      } else {
        setShowDetails(true);
      }
    } else if (revealMode === "tap") {
      if (!isFlipped) {
        // If face down, first tap attempts to flip it
        if (typeof onFlip === 'function') {
          onFlip(card);
        }
      } else {
        // If face up, second tap opens full details
        if (typeof onClick === 'function') {
          onClick(card);
        } else {
          setShowDetails(true);
        }
      }
    } else if (revealMode === "manual") {
      // Parent fully controls flips; tap only triggers details if already flipped
      if (isFlipped) {
        if (typeof onClick === 'function') {
          onClick(card);
        } else {
          setShowDetails(true);
        }
      }
    }
  };

  const onPointerDown = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    wasLongPressRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      wasLongPressRef.current = true;
      setIsHolding(true);
    }, 250);
  };

  const endHold = () => {
    clearTimeout(holdTimerRef.current);
    const wasLong = wasLongPressRef.current;
    wasLongPressRef.current = false;
    if (isHolding) setIsHolding(false);
    return wasLong;
  };

  const onPointerUp = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const wasLong = endHold();
    if (wasLong) {
      // Long-press: open the compact Quick Preview or flip if face down
      if (!isFlipped) {
        if (typeof onFlip === 'function') {
          onFlip(card); // Long press on face-down card also flips it
        }
      } else {
        setShowQuick(true); // Long press on face-up card shows quick preview
      }
      return;
    }
    // Regular tap behavior
    handleCardTap();
  };

  const onPointerLeave = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    endHold();
  };

  // Determine reversed status for display
  const reversedFlag = card?.is_reversed;

  return (
    <motion.div
      className={`
        card-in-spread
        ${interactive && !allowReposition ? 'cursor-pointer' : ''}
        ${allowReposition ? 'cursor-move' : ''}
        relative
        ${isFlipped ? 'is-flipped' : ''}
      `}
      style={{
        width: cardSize.width,
        height: cardSize.height,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        touchAction: 'manipulation', // Essential for touch events
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
      initial={animateSpread ? { opacity: 0, scale: 0.8, y: -50 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: animationDelay,
        ease: [0.23, 1, 0.32, 1],
      }}
      drag={allowReposition ? true : false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragConstraints}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      whileHover={interactive && !allowReposition ? { scale: 1.05, zIndex: 10 } : {}}
      whileTap={interactive && !allowReposition ? { scale: 0.98 } : {}}
      onPointerDown={interactive && !allowReposition ? onPointerDown : undefined}
      onPointerUp={interactive && !allowReposition ? onPointerUp : undefined}
      onPointerLeave={interactive && !allowReposition ? onPointerLeave : undefined}
      // Note: onClick prop from outline is replaced by onPointerUp calling handleCardTap to integrate long-press logic
    >
      {/* Card Container */}
      <div className="relative w-full h-full">
        {/* Card Back */}
        <div
          className={`absolute inset-0 backface-hidden rounded-lg overflow-hidden border-2 shadow-lg transition-all duration-300 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            transform: animateFlip ? 'rotateY(0deg)' : 'none', // Apply rotation for 3D effect if animated
            borderColor: 'rgba(168, 85, 247, 0.3)',
          }}
        >
          {backImageUrl ? (
            <img
              src={backImageUrl}
              alt="Card back"
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
              <div className="text-white/30 text-4xl">✦</div>
            </div>
          )}
        </div>

        {/* Card Front */}
        <div
          className={`absolute inset-0 backface-hidden rounded-lg overflow-hidden border-2 shadow-xl transition-all duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            transform: animateFlip ? 'rotateY(180deg)' : 'none', // Apply rotation for 3D effect if animated
            borderColor: card?.is_reversed ? 'rgba(239, 68, 68, 0.5)' : 'rgba(168, 85, 247, 0.5)',
          }}
        >
          {card?.image_url && !imageError ? (
            <FramedCardImage
              src={card.image_url}
              alt={card.name}
              frameStyle={card.frame_style}
              isReversed={card.is_reversed}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-white/30 text-2xl mb-2">🃏</div>
                <p className="text-white/60 text-xs">{card?.name || 'Unknown'}</p>
                {imageError && (
                  <p className="text-red-400/60 text-[10px] mt-1">Image unavailable</p>
                )}
              </div>
            </div>
          )}

          {/* Card Name Overlay (optional) */}
          {isFlipped && card?.name && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs font-medium text-center truncate">
                {card.name}
              </p>
            </div>
          )}
        </div>

        {/* Reversed Indicator */}
        {isFlipped && card?.is_reversed && (
          <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-bold z-10">
            Reversed
          </div>
        )}

        {/* Loading Indicator */}
        {imageLoading && isFlipped && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Position Label */}
      {requiresPositions && showPositionLabels && position && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max max-w-[200px]">
          <div className="bg-black/60 backdrop-blur-sm border border-purple-400/30 rounded-lg px-3 py-1">
            <p className="text-white text-xs font-medium text-center truncate">
              {position.name}
            </p>
            {position.meaning && (
              <p className="text-white/60 text-[10px] text-center truncate">
                {position.meaning}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Preview Modal (now long-press only) */}
      <QuickCardPreview
        open={showQuick}
        onClose={() => setShowQuick(false)}
        onOpenFull={() => {
          setShowQuick(false);
          setShowDetails(true);
        }}
        card={card}
        isReversed={reversedFlag}
        position={position}
      />

      {/* Full Details Modal (opens on tap) */}
      <CardDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        card={card}
      />
    </motion.div>
  );
}
