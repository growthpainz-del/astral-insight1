import React, { useEffect, useRef, useState } from "react";

export default function PullToRefresh({ onRefresh, children, threshold = 70, className = "" }) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getScrollEl = () => document.querySelector("main");

    const onTouchStart = (e) => {
      const scrollEl = getScrollEl();
      if (!scrollEl) return;
      if (scrollEl.scrollTop <= 0 && !refreshing) {
        pullingRef.current = true;
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || refreshing) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        e.preventDefault();
        setPull(Math.min(dy, threshold * 1.6));
      }
    };

    const onTouchEnd = async () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (pull >= threshold && onRefresh) {
        try {
          setRefreshing(true);
          await Promise.resolve(onRefresh());
        } finally {
          setRefreshing(false);
        }
      }
      setPull(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, threshold, refreshing]);

  return (
    <div ref={containerRef} className={className}>
      {/* Pull indicator - respects safe area */}
      <div
        style={{
          height: pull > 0 ? pull : 0,
          transition: refreshing ? "height 0.2s" : "height 0.12s",
        }}
      >
        <div
          className="flex items-center justify-center text-white/70 text-sm"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px))" }}
        >
          {refreshing ? "Refreshing..." : pull >= threshold ? "Release to refresh" : pull > 0 ? "Pull to refresh" : null}
        </div>
      </div>
      {children}
    </div>
  );
}