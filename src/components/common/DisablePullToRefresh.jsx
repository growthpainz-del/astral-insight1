import React, { useEffect } from "react";

export default function DisablePullToRefresh({ targetSelector = "main", threshold = 10 }) {
  useEffect(() => {
    const target = document.querySelector(targetSelector);
    const scrollingEl = document.scrollingElement || document.documentElement;
    const scrollEl = target || scrollingEl;

    if (!scrollEl) return;

    let startY = 0;
    let active = false;

    const atTop = () => {
      try { return (scrollEl.scrollTop || 0) <= 0; } catch { return false; }
    };

    const nudgeDown = () => {
      try { if ((scrollEl.scrollTop || 0) <= 0) scrollEl.scrollTop = 1; } catch {}
    };

    const onTouchStart = (e) => {
      try {
        startY = e.touches?.[0]?.clientY || 0;
        active = atTop();
        if (active) nudgeDown(); // pre-nudge to avoid bounce
      } catch { active = false; }
    };

    const onTouchMove = (e) => {
      if (!active) return;
      const dy = (e.touches?.[0]?.clientY || 0) - startY;
      if (dy > threshold && atTop()) {
        // Block native pull-to-refresh and preview's parent handlers
        e.preventDefault();
        e.stopPropagation();
        nudgeDown();
      }
    };

    const onTouchEnd = () => { active = false; };
    const onTouchCancel = () => { active = false; };

    // Also prevent wheel overscroll bounce on desktop Safari
    const onWheel = (e) => {
      if ((e.deltaY < 0) && atTop()) {
        e.preventDefault();
        e.stopPropagation();
        nudgeDown();
      }
    };

    // Listeners on both target and window to catch bubbling to preview frame
    const optsPassiveFalse = { passive: false };
    const optsPassiveTrue = { passive: true };

    (target || window).addEventListener("touchstart", onTouchStart, optsPassiveTrue);
    (target || window).addEventListener("touchmove", onTouchMove, optsPassiveFalse);
    (target || window).addEventListener("touchend", onTouchEnd, optsPassiveTrue);
    (target || window).addEventListener("touchcancel", onTouchCancel, optsPassiveTrue);
    (target || window).addEventListener("wheel", onWheel, optsPassiveFalse);

    // Hardened CSS overscroll guards
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehaviorY;
    const prevBody = body.style.overscrollBehaviorY;
    const prevTarget = scrollEl.style.overscrollBehaviorY;

    try {
      if (!html.style.overscrollBehaviorY) html.style.overscrollBehaviorY = "none";
      if (!body.style.overscrollBehaviorY) body.style.overscrollBehaviorY = "none";
      if (!scrollEl.style.overscrollBehaviorY) scrollEl.style.overscrollBehaviorY = "contain";
    } catch {}

    return () => {
      (target || window).removeEventListener("touchstart", onTouchStart, optsPassiveTrue);
      (target || window).removeEventListener("touchmove", onTouchMove, optsPassiveFalse);
      (target || window).removeEventListener("touchend", onTouchEnd, optsPassiveTrue);
      (target || window).removeEventListener("touchcancel", onTouchCancel, optsPassiveTrue);
      (target || window).removeEventListener("wheel", onWheel, optsPassiveFalse);
      try {
        html.style.overscrollBehaviorY = prevHtml || "";
        body.style.overscrollBehaviorY = prevBody || "";
        scrollEl.style.overscrollBehaviorY = prevTarget || "";
      } catch {}
    };
  }, [targetSelector, threshold]);

  return null;
}