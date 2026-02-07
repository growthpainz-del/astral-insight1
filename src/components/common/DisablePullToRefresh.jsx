import React, { useEffect } from "react";

export default function DisablePullToRefresh({ targetSelector = "main", threshold = 10 }) {
  useEffect(() => {
    const scrollEl = document.querySelector(targetSelector);
    if (!scrollEl) return;

    let startY = 0;
    let active = false;

    const onTouchStart = (e) => {
      try {
        if (scrollEl.scrollTop <= 0) {
          startY = e.touches[0].clientY;
          active = true;
        } else {
          active = false;
        }
      } catch (_) {
        active = false;
      }
    };

    const onTouchMove = (e) => {
      if (!active) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > threshold && scrollEl.scrollTop <= 0) {
        // Prevent native pull-to-refresh
        e.preventDefault();
        // Nudge scroll to avoid bounce
        try { scrollEl.scrollTop = 1; } catch (_) {}
      }
    };

    const onTouchEnd = () => { active = false; };

    // Must be non-passive to allow preventDefault
    scrollEl.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollEl.addEventListener("touchend", onTouchEnd, { passive: true });

    // Extra safety: CSS overscroll containment on target
    const prevStyle = scrollEl.style.overscrollBehaviorY;
    scrollEl.style.overscrollBehaviorY = scrollEl.style.overscrollBehaviorY || "contain";

    return () => {
      scrollEl.removeEventListener("touchstart", onTouchStart, { passive: true });
      scrollEl.removeEventListener("touchmove", onTouchMove, { passive: false });
      scrollEl.removeEventListener("touchend", onTouchEnd, { passive: true });
      try { scrollEl.style.overscrollBehaviorY = prevStyle || ""; } catch (_) {}
    };
  }, [targetSelector, threshold]);

  return null;
}