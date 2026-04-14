import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CARD_ASPECT_RATIO, calculateCardSize, calculateContainerHeight, getDesignerAspectRatio } from "@/components/utils/cardSizing";
import { Move, Bug } from "lucide-react";
import ScratchRevealCard from "@/components/reading/ScratchRevealCard";
import { getThumbnailUrl } from "@/lib/utils";

// FIXED: Larger card size for better visibility
const DEFAULT_CARD_WIDTH = 140; // Increased for better card viewing

// IMPROVED: Extract position data from cards if available
function extractPositionsFromCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  // Check if cards have embedded position coordinates
  const hasEmbeddedPositions = cards.some(card =>
    card &&
    typeof card.position_x === 'number' &&
    typeof card.position_y === 'number'
  );

  if (!hasEmbeddedPositions) return null;

  // Extract position data from cards
  return cards.map((card, idx) => ({
    name: card.position || `Position ${idx + 1}`,
    meaning: card.position_meaning || '',
    x: typeof card.position_x === 'number' ? card.position_x : 50,
    y: typeof card.position_y === 'number' ? card.position_y : 50,
    rotation: typeof card.position_rotation === 'number' ? card.position_rotation : 0,
  }));
}

function normalizeSpreadPositions(spread, positions, cards) {
        // PRIORITY 1: Use coordinates from the spread definition if present (designer is the source of truth)
        if (positions && Array.isArray(positions) && positions.length > 0) {
          const hasCoordinates = positions.some(p =>
            typeof p === 'object' && p !== null &&
            (typeof p.x === 'number' || typeof p.y === 'number')
          );
          if (hasCoordinates) {
            console.log('📍 Using coordinate positions from spread definition');

            // Preserve spacing for any positions without x/y by using a fallback grid
            const count = positions.length;
            const cols = Math.min(5, Math.ceil(Math.sqrt(count)));
            const rows = Math.ceil(count / cols);

            const getFallbackXY = (i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const fx = 15 + (col * (70 / (cols - 1 || 1)));
              const fy = 20 + (row * (60 / (rows - 1 || 1)));
              return { fx, fy };
            };

            // Map raw coords first
            const mapped = positions.map((pos, idx) => {
              const { fx, fy } = getFallbackXY(idx);
              const x = typeof pos?.x === 'number' ? Math.min(100, Math.max(0, pos.x)) : fx;
              const y = typeof pos?.y === 'number' ? Math.min(100, Math.max(0, pos.y)) : fy;
              const rotation = typeof pos?.rotation === 'number' ? pos.rotation : 0;

              let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
              if (!posName.match(/\d/)) {
                posName = `${idx + 1}. ${posName}`;
              }

              return {
                name: posName,
                meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
                x,
                y,
                rotation,
                position_number: idx + 1,
              };
            });

            // Tighten Path Forward horizontally if it's too wide on large screens
            const title = (spread?.name || '').toLowerCase();
            const isPathForward = title.includes('path') && title.includes('forward');
            if (isPathForward && mapped.length === 7) {
              const xs = mapped.map(p => p.x);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const range = maxX - minX;
              const targetRange = 42; // compress to ~42% of container width
              if (range > targetRange) {
                const center = (minX + maxX) / 2;
                const scale = targetRange / range;
                for (const p of mapped) {
                  p.x = Math.round(center + (p.x - center) * scale);
                }
              }
            }

            return mapped;
          }
        }

        // SPECIAL CASE: Path Forward (7) — right-pointing arrow/chevron if no explicit coords
        if (
          Array.isArray(positions) && positions.length === 7 &&
          spread?.name?.toLowerCase()?.includes('path') &&
          spread?.name?.toLowerCase()?.includes('forward')
        ) {
          const hasCoords = positions.some(p => typeof p === 'object' && p && (typeof p.x === 'number' || typeof p.y === 'number'));
          if (!hasCoords) {
            const arrow = [
              { x: 10, y: 30, rotation: 0 },
                      { x: 32, y: 40, rotation: 0 },
                      { x: 54, y: 50, rotation: 0 },
                      { x: 80, y: 50, rotation: 0 }, // tip
                      { x: 54, y: 60, rotation: 0 },
                      { x: 32, y: 70, rotation: 0 },
                      { x: 10, y: 80, rotation: 0 },
            ];
            return positions.map((pos, idx) => {
              let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
              if (!posName.match(/\d/)) posName = `${idx + 1}. ${posName}`;
              return {
                name: posName,
                meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
                x: arrow[idx]?.x ?? 50,
                y: arrow[idx]?.y ?? 50,
                rotation: arrow[idx]?.rotation ?? 0,
                position_number: idx + 1,
              };
            });
          }
        }

        // PRIORITY 2: Use position data embedded in cards (from custom spreads)
        const embeddedPositions = extractPositionsFromCards(cards);
        if (embeddedPositions) {
          console.log('📍 Using embedded positions from cards:', embeddedPositions.length);
          // FIXED: Ensure position names include sequential numbers
          return embeddedPositions.map((pos, idx) => {
            let posName = pos.name || `Position ${idx + 1}`;
            if (!posName.match(/\d/)) {
              posName = `${idx + 1}. ${posName}`;
            }
            return {
              ...pos,
              name: posName,
              position_number: idx + 1,
            };
          });
        }

        // Handle case where positions array itself is empty or invalid
        if (!positions || !Array.isArray(positions) || positions.length === 0) {
          return [];
        }

        // No coordinates anywhere: continue with named-only handling below
        const hasCoordinates = false;

  if (hasCoordinates) {
    console.log('📍 Using coordinate positions from spread definition');
    return positions.map((pos, idx) => {
      const x = typeof pos?.x === 'number' ? Math.min(100, Math.max(0, pos.x)) : 50;
      const y = typeof pos?.y === 'number' ? Math.min(100, Math.max(0, pos.y)) : 50;
      const rotation = typeof pos?.rotation === 'number' ? pos.rotation : 0;

      let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
      if (!posName.match(/\d/)) {
        posName = `${idx + 1}. ${posName}`;
      }

      return {
        name: posName,
        meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
        x,
        y,
        rotation,
        position_number: idx + 1,
      };
    });
  }

  // PRIORITY 3: Fallback layouts for built-in spreads
  console.log('📍 Using fallback layout for:', positions.length, 'positions');
  const count = positions.length;

  // Single card - center
  if (count === 1) {
    let posName = typeof positions[0] === 'string' ? positions[0] : positions[0]?.name || 'Card';
    if (!posName.match(/\d/)) {
      posName = `1. ${posName}`;
    }
    return [{
      name: posName,
      meaning: typeof positions[0] === 'string' ? '' : (positions[0]?.meaning || ''),
      x: 50,
      y: 50,
      rotation: 0,
      position_number: 1,
    }];
  }

  // Diamond Ring (7) fallback: ensure a symmetric ring if no explicit coords
  if (count === 7 && (spread?.name?.toLowerCase()?.includes('diamond') || spread?.id === 'diamond')) {
    const ring = [
      { x: 50, y: 14, rotation: 0 },   // North
      { x: 74, y: 30, rotation: 35 },  // NE
      { x: 88, y: 50, rotation: 90 },  // East
      { x: 74, y: 70, rotation: -35 }, // SE
      { x: 50, y: 86, rotation: 0 },   // South
      { x: 26, y: 70, rotation: 35 },  // SW
      { x: 12, y: 50, rotation: 90 },  // West
    ];
    return positions.map((pos, idx) => {
      let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
      if (!posName.match(/\d/)) posName = `${idx + 1}. ${posName}`;
      return {
        name: posName,
        meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
        x: ring[idx]?.x ?? 50,
        y: ring[idx]?.y ?? 50,
        rotation: ring[idx]?.rotation ?? 0,
        position_number: idx + 1,
      };
    });
  }

  // Three cards - horizontal line
  if (count === 3) {
    return positions.map((pos, idx) => {
      let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
      if (!posName.match(/\d/)) {
        posName = `${idx + 1}. ${posName}`;
      }

      return {
        name: posName,
        meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
        x: 20 + (idx * 30),
        y: 50,
        rotation: 0,
        position_number: idx + 1,
      };
    });
  }

  // Celtic Cross layout (10 cards)
  if (count === 10 && spread?.name?.toLowerCase().includes('celtic cross')) {
    const celticPositions = [
      { x: 50, y: 50, rotation: 0 },
      { x: 50, y: 50, rotation: 90 },
      { x: 50, y: 25, rotation: 0 },
      { x: 50, y: 75, rotation: 0 },
      { x: 25, y: 50, rotation: 0 },
      { x: 75, y: 50, rotation: 0 },
      { x: 85, y: 80, rotation: 0 },
      { x: 85, y: 60, rotation: 0 },
      { x: 85, y: 40, rotation: 0 },
      { x: 85, y: 20, rotation: 0 },
    ];

    return positions.map((pos, idx) => {
      let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
      if (!posName.match(/\d/)) {
        posName = `${idx + 1}. ${posName}`;
      }

      return {
        name: posName,
        meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
        x: celticPositions[idx]?.x ?? 50,
        y: celticPositions[idx]?.y ?? 50,
        rotation: celticPositions[idx]?.rotation ?? 0,
        position_number: idx + 1,
      };
    });
  }



  // Default: distribute evenly in a grid
  const cols = Math.min(5, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);

  return positions.map((pos, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    let posName = typeof pos === 'string' ? pos : (pos.name || `Position ${idx + 1}`);
    if (!posName.match(/\d/)) {
      posName = `${idx + 1}. ${posName}`;
    }

    return {
      name: posName,
      meaning: typeof pos === 'string' ? '' : (pos.meaning || ''),
      x: 15 + (col * (70 / (cols - 1 || 1))),
      y: 20 + (row * (60 / (rows - 1 || 1))),
      rotation: 0,
      position_number: idx + 1,
    };
  });
}

export default function SpreadLayout(props) {
  const {
    spread,
    positions = [],
    cards = [],
    requiresPositions = true,
    showPositionLabels = true,
    hideEmptySlots = false,
    revealMode = "instant",
    animateSpread = true,
    onCardClick = () => {},
    deck,
    containerMinH = null,
    defaultCardWidth = DEFAULT_CARD_WIDTH,
    allowReposition = false,
    onPositionUpdate = () => {},
    revealedCards = new Set(),
    onCardReveal = () => {},
    useScratchReveal = false,
    viewMode = "normal",
    sizeScale = 1,
    enableExternalDrops = false,
    onExternalDrop = () => {},
    } = props;

  // DEBUG: Log received props
  console.log('🎴 SpreadLayout: Props received', {
    spreadName: spread?.name,
    spreadPositions: spread?.positions?.length || positions.length,
    cardsReceived: cards?.length,
    cardsData: cards,
    animateSpread,
    showPositionLabels
  });

  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cw = entry.contentRect?.width || el.clientWidth || 0;
        const ch = entry.contentRect?.height || el.clientHeight || 0;
        setContainerWidth(Math.round(cw));
        setContainerHeight(Math.round(ch));
      }
    });
    ro.observe(el);
    // Initial
    setContainerWidth(Math.round(el.clientWidth || 0));
    setContainerHeight(Math.round(el.clientHeight || 0));
    return () => ro.disconnect();
  }, []);

  // NEW: Animation state
  const [showPositions, setShowPositions] = React.useState(false);
  const [showCards, setShowCards] = React.useState(false);

  // NEW: MOBILE DEBUG PANEL STATE
  const [showMobileDebug, setShowMobileDebug] = React.useState(false);

  // NEW: Pinch-to-zoom state
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const gestureRef = React.useRef({
    pinching: false,
    startDistance: 0,
    startScale: 1,
    lastCenter: { x: 0, y: 0 },
    panning: false,
    lastPoint: { x: 0, y: 0 },
  });

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const getTouchCenter = (touches) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStartZoom = (e) => {
    if (e.touches.length === 2) {
      const d = getDistance(e.touches);
      gestureRef.current.pinching = true;
      gestureRef.current.startDistance = d;
      gestureRef.current.startScale = zoom;
      gestureRef.current.lastCenter = getTouchCenter(e.touches);
      e.preventDefault();
    } else if (e.touches.length === 1 && zoom > 1) {
      gestureRef.current.panning = true;
      gestureRef.current.lastPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      e.preventDefault();
    }
  };

  const handleTouchMoveZoom = (e) => {
    if (gestureRef.current.pinching && e.touches.length === 2) {
      const dist = getDistance(e.touches);
      const scale = clamp(
        gestureRef.current.startScale * (dist / gestureRef.current.startDistance),
        0.7,
        2.8
      );
      setZoom(scale);
      const center = getTouchCenter(e.touches);
      const dx = center.x - gestureRef.current.lastCenter.x;
      const dy = center.y - gestureRef.current.lastCenter.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      gestureRef.current.lastCenter = center;
      e.preventDefault();
    } else if (gestureRef.current.panning && e.touches.length === 1) {
      const point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const dx = point.x - gestureRef.current.lastPoint.x;
      const dy = point.y - gestureRef.current.lastPoint.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      gestureRef.current.lastPoint = point;
      e.preventDefault();
    }
  };

  const handleTouchEndZoom = () => {
    gestureRef.current.pinching = false;
    gestureRef.current.panning = false;
  };

  // NEW: Dragging state for repositioning
  const [isDragging, setIsDragging] = React.useState(false); // Indicates if any card is currently being dragged
  const [draggedCardIndex, setDraggedCardIndex] = React.useState(null); // Which card is being dragged
  const [cardPositionsTemp, setCardPositionsTemp] = React.useState([]); // Stores { x, y } for each card index during drag
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const dragTimeoutRef = React.useRef(null);
  const visibilityHandlerRef = React.useRef(null);

  // NEW: Scroll lock references
  const wasBodyOverflow = React.useRef({ body: "", html: "" });
  const preventWheelRef = React.useRef((e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {
      console.error('Error preventing wheel:', err);
    }
  });
  const preventTouchMoveRef = React.useRef((e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {
      console.error('Error preventing touch move:', err);
    }
  });

  // NEW: Lock scroll function
  const lockScroll = React.useCallback(() => {
    try {
      // Store original overflow values
      wasBodyOverflow.current = {
        body: document.body.style.overflow,
        html: document.documentElement.style.overflow,
      };

      // Lock scroll
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none"; // Important for mobile

      // Prevent wheel and touch scrolling
      window.addEventListener("wheel", preventWheelRef.current, { passive: false, capture: true });
      window.addEventListener("touchmove", preventTouchMoveRef.current, { passive: false, capture: true });

      // console.log('🔒 Scroll locked');
    } catch (error) {
      console.error('Error locking scroll:', error);
    }
  }, []);

  // NEW: Unlock scroll function
  const unlockScroll = React.useCallback(() => {
    try {
      // Restore original overflow values
      document.body.style.overflow = wasBodyOverflow.current.body || "";
      document.documentElement.style.overflow = wasBodyOverflow.current.html || "";
      document.body.style.touchAction = "";

      // Remove event listeners
      window.removeEventListener("wheel", preventWheelRef.current, { capture: true });
      window.removeEventListener("touchmove", preventTouchMoveRef.current, { capture: true });

      // console.log('🔓 Scroll unlocked');
    } catch (error) {
      console.error('Error unlocking scroll:', error);
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, [unlockScroll]);

  // Card sizing moved below (needs visibleCount)
  // const defaultSlot = ... (defined after visibleCount)

  // IMPROVED: Pass cards to normalization function
  const normalizedPositions = React.useMemo(() => {
    try {
      // DEBUG: Log inputs to normalization
      console.log('📐 SpreadLayout: Calculating normalizedPositions', {
        spread: spread?.name,
        inputPositions: positions?.length,
        cardsForNormalization: cards?.length,
        cardsData: cards
      });
      
      const result = normalizeSpreadPositions(spread, positions, cards);
      
      // DEBUG: Log result
      console.log('📐 SpreadLayout: normalizedPositions result', {
        count: result?.length,
        positions: result
      });
      
      return result;
    } catch (err) {
      console.error('Error in normalizedPositions:', err);
      return [];
    }
  }, [spread, positions, cards]);

  const cardsByIndex = React.useMemo(() => {
    const result = Array.isArray(cards) ? cards : [];
    console.log('🎴 SpreadLayout: cardsByIndex derived', {
      inputCardsLength: cards?.length,
      cardsByIndexLength: result.length,
      cardsByIndex: result
    });
    return result;
  }, [cards]);

  const visibleCount = hideEmptySlots
    ? normalizedPositions.filter((_, i) => cardsByIndex[i]).length
    : normalizedPositions.length;

  // Responsive card width for mobile/large spreads (after visibleCount)
  const baseSlot = defaultCardWidth || DEFAULT_CARD_WIDTH;
  const sizeMultiplier = viewMode === 'compact' ? 0.75 : viewMode === 'detailed' ? 1.2 : 1;
  let computedWidth = baseSlot;
  if (containerWidth) {
    const { cardWidth } = calculateCardSize(containerWidth, visibleCount);
    computedWidth = Math.max(80, Math.min(cardWidth, 220));
  }
  // Clamp further for dense spreads on small screens
  if (visibleCount >= 7 && containerWidth && containerWidth < 520) {
    computedWidth = Math.min(computedWidth, 95);
  }
  const defaultSlot = Math.round(computedWidth * sizeMultiplier * sizeScale);

  // Build render pairs including temporary drag positions
  const renderItems = React.useMemo(() => {
    try {
      // DEBUG: Log renderItems calculation
      console.log('🔧 SpreadLayout: Building renderItems', {
        normalizedPositionsCount: normalizedPositions.length,
        cardsByIndexCount: cardsByIndex.length,
        draggedCardIndex
      });
      
      const items = normalizedPositions.map((pos, i) => {
        const card = cardsByIndex[i] || null;
        
        // DEBUG: Log each position-card pair
        console.log(`🔧 SpreadLayout: Position ${i} (${pos.name})`, {
          hasCard: !!card,
          cardName: card?.name,
          cardData: card
        });
        
        if (draggedCardIndex === i && cardPositionsTemp[i]) {
          return {
            pos: {
              ...pos,
              x: cardPositionsTemp[i].x,
              y: cardPositionsTemp[i].y,
            },
            card,
          };
        }
        return { pos, card };
      });
      
      // DEBUG: Log final renderItems
      console.log('🔧 SpreadLayout: renderItems complete', {
        totalItems: items.length,
        itemsWithCards: items.filter(item => item.card).length,
        items
      });
      
      return items;
    } catch (err) {
      console.error('Error in renderItems:', err);
      return [];
    }
  }, [normalizedPositions, cardsByIndex, draggedCardIndex, cardPositionsTemp]);

  // Animation sequence
  React.useEffect(() => {
    try {
      if (!animateSpread || cardsByIndex.filter(Boolean).length === 0) {
        console.log('✅ SpreadLayout: Setting showPositions=true, showCards=true (no animation)');
        setShowPositions(true);
        setShowCards(true);
        return;
      }

      console.log('🎬 SpreadLayout: Starting animation sequence');
      setShowPositions(true);
      setShowCards(false);

      const timer = setTimeout(() => {
        console.log('🎬 SpreadLayout: Animation complete, showing cards');
        setShowCards(true);
      }, 1200);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Error in animation sequence:', err);
      setShowPositions(true);
      setShowCards(true);
    }
  }, [animateSpread, cardsByIndex.length]);

  // --- Card repositioning handlers ---
  const handleCardDragStart = (e, idx) => {
    try {
      if (!allowReposition) return;

      e.stopPropagation();
      setIsDragging(true);
      setDraggedCardIndex(idx);
      lockScroll();

      const container = containerRef.current;
      if (!container || !renderItems[idx]) {
        console.warn("Container or renderItems not ready for drag start.");
        setIsDragging(false);
        setDraggedCardIndex(null);
        unlockScroll();
        return;
      }

      const rect = container.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;

      // Calculate initial card position based on renderItems to get the base position
      const currentPos = renderItems[idx].pos;
      const cardCenterX = rect.left + (rect.width * (currentPos?.x || 50) / 100);
      const cardCenterY = rect.top + (rect.height * (currentPos?.y || 50) / 100);

      // Calculate offset from card center to cursor
      dragOffsetRef.current = {
        x: point.clientX - cardCenterX,
        y: point.clientY - cardCenterY
      };

      if (e.preventDefault) e.preventDefault();

      document.addEventListener('mousemove', handleCardDragMove, { passive: false, capture: true });
      document.addEventListener('mouseup', handleCardDragEnd, { passive: false, capture: true });
      document.addEventListener('touchmove', handleCardDragMove, { passive: false, capture: true });
      document.addEventListener('touchend', handleCardDragEnd, { passive: false, capture: true });
      document.addEventListener('touchcancel', handleCardDragEnd, { passive: false, capture: true });

      // Safety: auto-unlock if something interrupts touchend
      const onVisibilityChange = () => {
        if (document.hidden) handleCardDragEnd();
      };
      visibilityHandlerRef.current = onVisibilityChange;
      document.addEventListener('visibilitychange', onVisibilityChange);

      // Safety timeout as last resort
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = setTimeout(() => handleCardDragEnd(), 5000);
    } catch (err) {
      console.error('Error starting card drag:', err);
      setIsDragging(false);
      setDraggedCardIndex(null);
      unlockScroll();
    }
  };

  const handleCardDragMove = (e) => {
    try {
      if (draggedCardIndex === null || !allowReposition) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;

      // Calculate new position as percentage relative to container
      const x = ((point.clientX - dragOffsetRef.current.x - rect.left) / rect.width) * 100;
      const y = ((point.clientY - dragOffsetRef.current.y - rect.top) / rect.height) * 100;

      // Clamp to container bounds with padding
      const clampedX = Math.max(5, Math.min(95, x)); // Using 5% and 95%
      const clampedY = Math.max(5, Math.min(95, y)); // Using 5% and 95%

      // Refresh safety timeout while dragging
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = setTimeout(() => handleCardDragEnd(), 5000);

      // Update temporary card positions
      setCardPositionsTemp(prev => {
        const newPositions = [...prev];
        if (!newPositions[draggedCardIndex]) {
          newPositions[draggedCardIndex] = {};
        }
        newPositions[draggedCardIndex] = {
          x: clampedX,
          y: clampedY
        };
        return newPositions;
      });

      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    } catch (err) {
      console.error('Error during card drag:', err);
    }
  };

  const handleCardDragEnd = () => {
    try {
      if (draggedCardIndex === null) return;

      unlockScroll();

      // Construct the updated list of positions to pass to onPositionUpdate
      const updatedPositions = normalizedPositions.map((pos, idx) => {
        if (idx === draggedCardIndex && cardPositionsTemp[idx]) {
          return {
            ...pos, // Keep name, meaning, rotation from original
            x: cardPositionsTemp[idx].x,
            y: cardPositionsTemp[idx].y,
          };
        }
        return pos; // Use original normalized position for other cards
      });

      if (onPositionUpdate && typeof onPositionUpdate === 'function') {
        onPositionUpdate(updatedPositions);
      }

      setIsDragging(false);
      setDraggedCardIndex(null);
      setCardPositionsTemp([]); // Clear temporary positions after drag ends

      document.removeEventListener('mousemove', handleCardDragMove, { capture: true });
      document.removeEventListener('mouseup', handleCardDragEnd, { capture: true });
      document.removeEventListener('touchmove', handleCardDragMove, { capture: true });
      document.removeEventListener('touchend', handleCardDragEnd, { capture: true });
      document.removeEventListener('touchcancel', handleCardDragEnd, { capture: true });
      if (dragTimeoutRef.current) { clearTimeout(dragTimeoutRef.current); dragTimeoutRef.current = null; }
      if (visibilityHandlerRef.current) { document.removeEventListener('visibilitychange', visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
    } catch (err) {
      console.error('Error ending card drag:', err);
      setIsDragging(false);
      setDraggedCardIndex(null);
      unlockScroll();
    }
  };

  // FIXED: Better responsive container sizing
  const isVerticalSpread = React.useMemo(() => {
    if (normalizedPositions.length <= 3) return false;
    const xValues = normalizedPositions.map(item => item.x);
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    return xRange < 15; // If X coordinates are within a small range, it's vertical
  }, [normalizedPositions]);

  const computedContainerMinHeight = React.useMemo(() => {
    if (containerMinH) return containerMinH;
    const base = calculateContainerHeight(defaultSlot, visibleCount, isVerticalSpread, requiresPositions);
    const adjusted = visibleCount >= 7 ? Math.max(base, Math.round(defaultSlot * CARD_ASPECT_RATIO * 4.5)) : base;
    return `${Math.max(adjusted, 420)}px`;
  }, [containerMinH, visibleCount, defaultSlot, isVerticalSpread, requiresPositions]);


  // Safety wrapper for rendering - only show if there are positions defined
  if (!Array.isArray(normalizedPositions) || normalizedPositions.length === 0) {
    console.warn('⚠️ SpreadLayout: No positions to display');
    return (
      <div className="w-full">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4 text-red-200 text-center">
          <div className="font-bold mb-2">⚠️ SpreadLayout Error</div>
          <div className="text-sm">No positions to display</div>
          <div className="text-xs mt-2 opacity-60">
            normalizedPositions: {normalizedPositions?.length || 0} | 
            cards: {cards?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  // DEBUG: Log rendering state
  console.log('🎨 SpreadLayout: Rendering with state', {
    showPositions,
    showCards,
    visibleCount,
    renderItemsCount: renderItems.length,
    renderItemsWithCards: renderItems.filter(item => item.card).length
  });

  return (
    <div className="w-full" ref={containerRef}>
      {/* NEW: MOBILE DEBUG PANEL FOR SPREADLAYOUT */}
      <div className="mb-4">
        <button
          onClick={() => setShowMobileDebug(!showMobileDebug)}
          className="flex items-center gap-2 bg-orange-600/20 border border-orange-500/50 rounded-lg px-3 py-2 text-xs text-orange-200 hover:bg-orange-600/30 w-full"
        >
          <Bug className="w-4 h-4" />
          <span className="font-semibold">SpreadLayout Debug {showMobileDebug ? '▼' : '▶'}</span>
        </button>

        {showMobileDebug && (
          <div className="mt-2 bg-orange-900/30 border-2 border-orange-500/50 rounded-lg p-3 text-xs space-y-2 text-orange-100">
            <div className="font-bold text-orange-200 mb-2">📐 SpreadLayout State:</div>
            
            <div className="bg-black/30 rounded p-2 space-y-1">
              <div>• normalizedPositions: {normalizedPositions.length}</div>
              <div>• cardsByIndex: {cardsByIndex.length}</div>
              <div>• renderItems: {renderItems.length}</div>
              <div>• visibleCount: {visibleCount}</div>
            </div>

            <div className="bg-black/30 rounded p-2 space-y-1">
              <div>• showPositions: {showPositions ? '✅ YES' : '❌ NO'}</div>
              <div>• showCards: {showCards ? '✅ YES' : '❌ NO'}</div>
              <div>• animateSpread: {animateSpread ? '✅ YES' : '❌ NO'}</div>
            </div>

            <div className="bg-black/30 rounded p-2 space-y-1">
              <div className="font-semibold text-orange-200 mb-1">Render Items:</div>
              {renderItems.map((item, idx) => (
                <div key={idx} className="text-[10px] border-l-2 border-orange-500/30 pl-2">
                  {idx + 1}. {item.card ? `✅ ${item.card.name}` : '❌ No card'} 
                  @ ({item.pos.x?.toFixed(0)}%, {item.pos.y?.toFixed(0)}%)
                </div>
              ))}
            </div>

            <div className="text-orange-300 text-[10px] italic mt-2">
              💡 If renderItems show cards but they're not visible below, check CSS/rendering
            </div>
          </div>
        )}
      </div>

      {allowReposition && (
        <div className="mb-3 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-400/40 rounded-lg px-3 py-2 text-xs text-purple-300">
            <Move className="w-4 h-4" />
            <span>Drag cards to reposition them</span>
          </div>
        </div>
      )}

      <div
        className="relative w-full rounded-xl flex items-center justify-center mystical-grid-container"
        style={{
          minHeight: computedContainerMinHeight,
          aspectRatio: getDesignerAspectRatio(visibleCount),
          padding: visibleCount === 1 ? '3rem 2rem' : (viewMode === 'compact' ? '1rem 0.5rem' : viewMode === 'detailed' ? '3rem 2rem' : '2rem 1rem'),
          overflow: 'auto',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          overflowY: (isDragging || zoom > 1) ? 'hidden' : 'visible',
          touchAction: isDragging ? 'none' : (zoom > 1 ? 'none' : 'pan-x pan-y')
        }}
      >
        {/* Reading Mat - centered circular, auto-fit with margin */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="rounded-full shadow-[0_0_40px_rgba(251,191,36,0.25)]"
            style={{
              width: Math.max(120, Math.round((Math.min(containerWidth || 600, 900)) * 0.9)),
              height: Math.max(120, Math.round((Math.min(containerWidth || 600, 900)) * 0.9)),
              maxWidth: '95%',
              maxHeight: '95%',
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/1ae9dba83_E9BB4507-45F8-4ECD-991B-74E57C0ECC6D.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.72,
              filter: 'saturate(1.05) drop-shadow(0 8px 30px rgba(251,191,36,0.25))',
            }}
          />
        </div>
          {/* Mystical grid background (kept subtle above the mat) */}
        <div className="absolute inset-0 pointer-events-none opacity-15 z-0">
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="0.5"/>
              </pattern>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)"/>
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Zoom wrapper (captures pinch/pan) */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          onTouchStart={handleTouchStartZoom}
          onTouchMove={handleTouchMoveZoom}
          onTouchEnd={handleTouchEndZoom}
          onTouchCancel={handleTouchEndZoom}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            willChange: 'transform',
            touchAction: zoom > 1 ? 'none' : 'manipulation',
            pointerEvents: 'auto'
          }}
        >
        {/* Single card - direct flexbox centering */}
        {visibleCount === 1 ? (
          renderItems.map(({ pos, card }, idx) => {
            if (hideEmptySlots && !card) return null;

            const isCurrentDragged = draggedCardIndex === idx;

            return (
              <motion.div
                key={`card-${idx}`}
                className={`relative flex flex-col items-center justify-center z-10 ${viewMode === 'compact' ? 'p-1' : viewMode === 'detailed' ? 'p-3' : 'p-2'}`}
                style={{
                  width: defaultSlot,
                  height: Math.round(defaultSlot * CARD_ASPECT_RATIO),
                  maxWidth: '90vw',
                  cursor: allowReposition ? 'grab' : 'pointer',
                  zIndex: isCurrentDragged ? 100 : 10,
                }}
                initial={animateSpread ? { scale: 0, opacity: 0 } : false}
                animate={
                  showPositions
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{
                  delay: animateSpread ? idx * 0.1 : 0,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                data-spread-slot
              >
                {/* Position marker */}
                {showPositionLabels && showPositions && !card && (
                    <div
                      className="absolute inset-0 rounded-lg border-2 border-dashed border-purple-500/40 bg-purple-900/10 flex items-center justify-center backdrop-blur-sm"
                      onDragOver={(e) => { if (enableExternalDrops) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }}
                      onDrop={(e) => {
                        if (!enableExternalDrops) return;
                        e.preventDefault();
                        try {
                          const data = e.dataTransfer.getData('application/json');
                          const payload = JSON.parse(data);
                          if (payload && payload.source === 'bottom-shelf' && typeof payload.cardIndex === 'number') {
                            onExternalDrop({ targetIndex: idx, source: 'bottom-shelf', cardIndex: payload.cardIndex });
                          }
                        } catch (err) { console.error('Drop parse error:', err); }
                      }}
                    >
                      <div className="text-center p-2">
                        <div className="text-purple-300 font-semibold text-sm mb-1">{pos.name}</div>
                        {pos.meaning && (
                          <div className="text-purple-400 text-xs opacity-70">{pos.meaning}</div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Card */}
                <AnimatePresence>
                  {card && showCards && (

                    <motion.div
                      initial={animateSpread ? {
                        scale: 0.1,
                        opacity: 0,
                        x: 0,
                        y: 0,
                        rotateZ: pos.rotation || 0,
                        rotateY: 180
                      } : false}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        x: 0,
                        rotateZ: pos.rotation || 0,
                        rotateY: 0,
                      }}
                      transition={{
                        delay: animateSpread ? 1.2 + idx * 0.2 : 0,
                        duration: 0.9,
                        type: "spring",
                        stiffness: 120,
                        damping: 18
                      }}
                      className="w-full h-full flex flex-col"
                    >
                      {useScratchReveal && !revealedCards.has(idx) ? (
                        <div
                                                                                     onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                                                     onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                                                     onClick={() => !allowReposition && onCardClick(card, idx)}
                                                                                     className="relative w-full h-full rounded-lg group"
                                                                                   >
                                                  <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-amber-400/20 shadow-[0_0_22px_rgba(251,191,36,0.35)] group-hover:ring-amber-400/40 group-hover:shadow-[0_0_32px_rgba(251,191,36,0.55)] transition-all" />
                                                  <ScratchRevealCard
                            frontImage={card.image_url}
                            backImage={deck?.back_image_url}
                            cardName={card.name}
                            isReversed={(card.isReversed || card.is_reversed)}
                            onReveal={() => onCardReveal(idx)}
                            width="100%"
                            height="100%"
                          />
                        </div>
                      ) : !revealedCards.has(idx) ? (
                                                    <button
                                                       type="button"
                                                       onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                       onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                       onTouchEnd={(e) => {
                                                         if (allowReposition) return;
                                                         e.preventDefault();
                                                         onCardReveal(idx);
                                                         setTimeout(() => onCardClick(card, idx), 300);
                                                       }}
                                                       onClick={() => {
                                                         if (allowReposition && isDragging) return;
                                                         onCardReveal(idx);
                                                         setTimeout(() => onCardClick(card, idx), 300);
                                                       }}
                                                       className="relative w-full h-full rounded-lg overflow-hidden ring-2 ring-amber-400/20 shadow-[0_0_22px_rgba(251,191,36,0.35)] hover:ring-amber-400/40 hover:shadow-[0_0_32px_rgba(251,191,36,0.55)] hover:scale-105 transition-all group"
                                                       style={{ touchAction: 'manipulation' }}
                                                     >
                          {deck?.back_image_url ? (
                            <img
                              src={deck.back_image_url}
                              alt="Card back"
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-800 flex items-center justify-center">
                              <span className="text-white/70 text-xs">Tap to reveal</span>
                            </div>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCardClick(card, idx)}
                          onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                          onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                          className={`relative w-full h-full rounded-lg overflow-hidden ring-2 ring-amber-400/20 shadow-[0_0_22px_rgba(251,191,36,0.35)] transition-all duration-300 group ${isCurrentDragged ? 'shadow-purple-500/80 scale-105' : 'hover:ring-amber-400/40 hover:shadow-[0_0_32px_rgba(251,191,36,0.55)] hover:scale-105'}`}
                          role="button"
                          aria-label={`${card?.name || 'Card'} details`}
                          style={{
                            transform: `rotate(${pos.rotation || 0}deg)`,
                            transformOrigin: 'center',
                            cursor: allowReposition ? (isCurrentDragged ? 'grabbing' : 'grab') : 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all" />

                          {card.image_url ? (
                            <img
                              src={getThumbnailUrl(card.image_url, 400)}
                              alt={card.name}
                              className={`w-full h-full object-contain ${(card.isReversed || card.is_reversed) ? 'rotate-180' : ''}`}
                              loading="lazy"
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                              <span className="text-white/90 text-center px-2 font-semibold text-sm">{card.name}</span>
                            </div>
                          )}
                          {allowReposition && (
                            <div className="absolute top-2 right-2 bg-purple-500/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Move className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      )}

                      {showPositionLabels && (
                                            <div className="mt-2 text-center">
                                              {card?.name && <div className="text-sm font-semibold text-white mb-1">{card.name}</div>}
                                              <Badge className={`bg-purple-600/80 text-white ${viewMode === 'compact' ? 'text-[10px] px-1.5 py-0.5' : viewMode === 'detailed' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'}`}>
                                                {pos.name}
                                              </Badge>
                                            </div>
                                          )}

                            <div className="mt-2 text-center space-y-1">
                              {card?.name && <div className="text-sm font-semibold text-white">{card.name}</div>}
                              {pos?.meaning && <div className="text-xs text-purple-200/80">{pos.meaning}</div>}
                            </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty slot */}
                {!card && !hideEmptySlots && showCards && (
                  <div className="w-full h-full rounded-lg border-2 border-dashed border-purple-500/30 bg-purple-900/5 flex items-center justify-center text-purple-300 text-xs">
                    {showPositionLabels ? pos?.name : "Empty Slot"}
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          // Multi-card layout with absolute positioning
          <div className="relative z-10 w-full h-full" style={{
            maxWidth: isVerticalSpread ? '400px' : '100%',
            padding: '1rem'
          }}>
            {renderItems.map(({ pos, card }, idx) => {
              if (hideEmptySlots && !card) return null;

              const safeX = Math.max(5, Math.min(95, pos.x));
              const safeY = Math.max(5, Math.min(95, pos.y));
              // Center-emergence offsets in px (from container center to final spot)
              const contW = containerWidth || (containerRef.current?.clientWidth || 0);
              const contH = containerHeight || (containerRef.current?.clientHeight || 0);
              const finalXpx = (safeX / 100) * contW;
              const finalYpx = (safeY / 100) * contH;
              const dx = (contW / 2) - finalXpx;
              const dy = (contH / 2) - finalYpx;
              const isCurrentDragged = draggedCardIndex === idx;

              return (
                                    <motion.div
                                      key={`card-${idx}`}
                                      className={`absolute -translate-x-1/2 -translate-y-1/2 ${viewMode === 'compact' ? 'p-0.5' : viewMode === 'detailed' ? 'p-2' : 'p-1'}`}
                                      style={{
                                        left: `${safeX}%`,
                                        top: `${safeY}%`,
                                        pointerEvents: isDragging && draggedCardIndex !== idx ? 'none' : 'auto',
                                        cursor: allowReposition ? (isCurrentDragged ? 'grabbing' : 'grab') : 'default',
                    width: defaultSlot,
                    height: Math.round(defaultSlot * CARD_ASPECT_RATIO),
                    maxWidth: '90vw',
                    cursor: allowReposition ? 'grab' : 'default',
                    zIndex: isCurrentDragged ? 100 : 10,
                  }}
                  initial={animateSpread ? { scale: 0, opacity: 0 } : false}
                  animate={{
                    scale: showPositions ? 1 : 0,
                    opacity: showPositions ? 1 : 0
                  }}
                  transition={{
                    delay: animateSpread ? idx * 0.12 : 0,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 180,
                    damping: 22
                  }}
                  data-spread-slot
                >
                  {/* Position marker */}
                  {showPositionLabels && showPositions && !card && (
                    <div
                      className="absolute inset-0 rounded-lg border-2 border-dashed border-purple-500/40 bg-purple-900/10 flex items-center justify-center backdrop-blur-sm"
                      onDragOver={(e) => { if (enableExternalDrops) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }}
                      onDrop={(e) => {
                        if (!enableExternalDrops) return;
                        e.preventDefault();
                        try {
                          const data = e.dataTransfer.getData('application/json');
                          const payload = JSON.parse(data);
                          if (payload && payload.source === 'bottom-shelf' && typeof payload.cardIndex === 'number') {
                            onExternalDrop({ targetIndex: idx, source: 'bottom-shelf', cardIndex: payload.cardIndex });
                          }
                        } catch (err) { console.error('Drop parse error:', err); }
                      }}
                    >
                      <div className="text-center p-1">
                        <div className="text-purple-300 font-semibold text-xs">{pos.name}</div>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {card && showCards && (

                      <motion.div
                        initial={animateSpread ? {
                            scale: 0.1,
                            opacity: 0,
                            x: dx,
                            y: dy,
                            rotateZ: pos.rotation || 0,
                            rotateY: 180
                          } : false}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          y: 0,
                          x: 0,
                          rotateZ: pos.rotation || 0,
                          rotateY: 0
                        }}
                        transition={{
                          delay: animateSpread ? 1.2 + idx * 0.2 : 0,
                          duration: 0.9,
                          type: "spring",
                          stiffness: 120,
                          damping: 18
                        }}
                        className="w-full h-full flex flex-col"
                      >
                        {useScratchReveal && !revealedCards.has(idx) ? (
                          <div
                                                        onClick={() => !allowReposition && onCardClick(card, idx)}
                                                        className="relative w-full h-full rounded-lg group"
                                                      >
                                                        <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] group-hover:ring-amber-400/40 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.55)] transition-all" />
                                                        <ScratchRevealCard
                              frontImage={card.image_url}
                              backImage={deck?.back_image_url}
                              cardName={card.name}
                              isReversed={(card.isReversed || card.is_reversed)}
                              onReveal={() => onCardReveal(idx)}
                              width="100%"
                              height="100%"
                            />
                          </div>
                        ) : !revealedCards.has(idx) ? (
                                                        <button
                                                          type="button"
                                                          onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                          onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                          onTouchEnd={(e) => {
                                                            if (allowReposition) return;
                                                            e.preventDefault();
                                                            onCardReveal(idx);
                                                            setTimeout(() => onCardClick(card, idx), 300);
                                                          }}
                                                          onClick={() => {
                                                            if (allowReposition && isDragging) return;
                                                            onCardReveal(idx);
                                                            setTimeout(() => onCardClick(card, idx), 300);
                                                          }}
                                                          className="relative w-full h-full rounded-lg overflow-hidden ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:ring-amber-400/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.55)] hover:scale-110 transition-all group"
                                                          style={{ touchAction: 'manipulation' }}
                                                        >
                            {deck?.back_image_url ? (
                              <img
                                src={deck.back_image_url}
                                alt="Card back"
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-800 flex items-center justify-center">
                                <span className="text-white/70 text-[10px]">Tap to reveal</span>
                              </div>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCardClick(card, idx)}
                                                      onMouseDown={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                      onTouchStart={(e) => allowReposition && handleCardDragStart(e, idx)}
                                                      className={`relative w-full h-full rounded-lg overflow-hidden ring-2 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all duration-300 group ${isCurrentDragged ? 'shadow-purple-500/80 scale-110' : 'hover:ring-amber-400/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.55)] hover:scale-110'}`}
                            role="button"
                            aria-label={`${card?.name || 'Card'} details`}
                            style={{
                              transform: `rotate(${pos.rotation}deg)`,
                              transformOrigin: 'center',
                              cursor: allowReposition ? (isCurrentDragged ? 'grabbing' : 'grab') : 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                              touchAction: 'manipulation'
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all" />

                            {card.image_url ? (
                              <img
                                src={card.image_url}
                                alt={card.name}
                                className={`w-full h-full object-contain ${(card.isReversed || card.is_reversed) ? 'rotate-180' : ''}`}
                                loading="lazy"
                                draggable={false}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                                <span className="text-white/90 text-center px-1 font-semibold text-[10px]">{card.name}</span>
                              </div>
                            )}
                            {allowReposition && (
                              <div className="absolute top-2 right-2 bg-purple-500/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Move className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        )}

                        {showPositionLabels && (
                          <div
                            className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none"
                            style={{ top: '100%', marginTop: '4px' }}
                          >
                            {card?.name && (
                              <div className="text-[11px] md:text-sm font-semibold text-white text-center mb-1 whitespace-nowrap">
                                {card.name}
                              </div>
                            )}
                            <Badge className={`bg-purple-600/90 text-white whitespace-nowrap ${viewMode === 'compact' ? 'text-[10px] px-1.5 py-0.5' : viewMode === 'detailed' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'}`}>
                              {pos.name}
                            </Badge>
                            {pos?.meaning && (
                              <div className="mt-1 text-center text-[10px] text-purple-200/80">
                                {pos.meaning}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty slot */}
                  {!card && !hideEmptySlots && showCards && (
                    <div className="w-full h-full rounded-lg border-2 border-dashed border-purple-500/20 bg-purple-900/5 flex items-center justify-center text-purple-300 text-xs">
                      {showPositionLabels ? pos?.name : "Empty Slot"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      <style>{`
        .mystical-grid-container {
          background: linear-gradient(135deg, rgba(88, 28, 135, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 1px solid rgba(168, 85, 247, 0.2);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.1) inset;
        }
      `}</style>
    </div>
  );
}