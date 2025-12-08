
import React from "react";
import { Save, Loader2 } from "lucide-react";

export default function FloatingSave({ className = "" }) {
  const [busy, setBusy] = React.useState(false);
  const [hidden, setHidden] = React.useState(false); // NEW: auto-hide under bottom sheets
  const [dock, setDock] = React.useState(() => {
    try {
      const storedMode = localStorage.getItem("floating_save_mode");
      const storedDock = localStorage.getItem("floating_save_dock");
      // Default LEFT on small screens to avoid external preview bubbles
      const isSmall = typeof window !== "undefined" && window.innerWidth <= 768;
      if (storedMode === "custom") return "custom";
      if (storedDock) return storedDock;
      return isSmall ? "left" : "right";
    } catch {
      const isSmall = typeof window !== "undefined" && window.innerWidth <= 768;
      return isSmall ? "left" : "right";
    }
  });
  const [bottomOffset, setBottomOffset] = React.useState(16);
  const [customPos, setCustomPos] = React.useState(() => {
    try {
      const raw = localStorage.getItem("floating_save_pos");
      // x: horizontal center, bottom: distance from bottom
      return raw ? JSON.parse(raw) : { x: null, bottom: null };
    } catch {
      return { x: null, bottom: null };
    }
  });
  const draggingRef = React.useRef(false); // To track if the button is currently being dragged
  const lastTapRef = React.useRef(0); // For double-tap detection

  // NEW: listen for bottom-sheet open/close to hide FloatingSave (prevents obstructing AI/Save)
  React.useEffect(() => {
    const onOpen = () => setHidden(true);
    const onClose = () => setHidden(false);
    window.addEventListener('readingBottomSheetOpen', onOpen);
    window.addEventListener('readingBottomSheetClose', onClose);

    // Fallback observer: hide if .reading-bottom-sheet appears in DOM
    const observer = new MutationObserver(() => {
      const exists = !!document.querySelector('.reading-bottom-sheet');
      setHidden(exists);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('readingBottomSheetOpen', onOpen);
      window.removeEventListener('readingBottomSheetClose', onClose);
      observer.disconnect();
    };
  }, []);

  const isVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const findSaveButton = () => {
    // Prefer buttons inside an open dialog first; fallback to document
    const dialogRoot = document.querySelector('[role="dialog"]') || document;
    const candidates = Array.from(
      dialogRoot.querySelectorAll('button, [role="button"], input[type="submit"]')
    );

    const ranked = candidates
      .filter((el) => !el.disabled && isVisible(el))
      .map((el) => {
        const text = (
          el.textContent ||
          el.getAttribute("aria-label") ||
          ""
        ).toLowerCase().trim();
        let score = 0;
        if (el.hasAttribute("data-save") || el.getAttribute("data-action") === "save")
          score += 10; // explicit tag
        if (text.includes("save settings")) score += 6;
        if (text === "save" || text.startsWith("save ")) score += 5;
        if (text.includes("update")) score += 3;
        if (text.includes("apply")) score += 2;
        if (text.includes("deck")) score += 1;
        if (text.includes("delete")) score -= 50; // avoid delete buttons
        return { el, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    // Fallback: any form submit button if no specific save button is found
    if (!ranked.length) {
      const form = document.querySelector("form");
      if (form) {
        const submit = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submit && !submit.disabled && isVisible(submit)) return submit;
      }
    }

    return ranked.length ? ranked[0].el : null;
  };

  const avoidEditAppOverlap = React.useCallback(() => {
    // If user placed it manually, don't auto-move
    if (dock === "custom") return;

    const candidates = Array.from(
      document.querySelectorAll('button, a, [role="button"], [data-edit-app="true"]')
    );
    const editBtn = candidates.find((el) => {
      const t = (el.textContent || el.getAttribute("aria-label") || "").toLowerCase();
      return (
        t.includes("edit app") ||
        (t.includes("edit") && t.includes("app")) ||
        el.getAttribute("data-edit-app") === "true"
      );
    });

    let desiredDock = dock || "right"; // Start with current or default dock
    let desiredBottom = 16; // Default bottom offset

    if (editBtn && isVisible(editBtn)) {
      const r = editBtn.getBoundingClientRect();
      // Check if the edit button is in the general bottom-right area.
      // Adjust threshold as needed. 160px from right/bottom
      const isBottomRight =
        r.bottom > window.innerHeight - 160 && r.right > window.innerWidth - 160;

      if (isBottomRight) {
        desiredDock = "left"; // Move to the left to avoid overlap
        // Lift exactly above the edit button plus padding (16px)
        // Math.max(72, ...) ensures a minimum lift even if the edit button is very low.
        const lift = Math.max(72, Math.ceil(window.innerHeight - r.top) + 16);
        desiredBottom = lift;
      } else {
        // If edit button exists but is not in bottom-right, revert to default dock/bottom if it was previously moved
        desiredDock = localStorage.getItem("floating_save_dock") || "right";
        desiredBottom = 16;
      }
    } else {
      // If no edit button or not visible, revert to stored or default "right"
      desiredDock = localStorage.getItem("floating_save_dock") || "right";
      desiredBottom = 16;
    }

    setBottomOffset(desiredBottom);
    setDock((prev) => {
      // Only update dock state and localStorage if it's not custom mode
      // and the desired dock is different
      if (prev !== desiredDock && prev !== "custom") {
        try {
          localStorage.setItem("floating_save_dock", desiredDock);
        } catch (e) {
          console.warn("Failed to write floating_save_dock to localStorage:", e);
        }
        return desiredDock;
      }
      return prev;
    });
  }, [dock]); // `dock` is a dependency because `desiredDock` is initialized based on it

  React.useEffect(() => {
    avoidEditAppOverlap();
    const onResize = () => avoidEditAppOverlap();
    window.addEventListener("resize", onResize);
    // Observe DOM changes to detect dynamically added/removed "Edit app" buttons
    const obs = new MutationObserver(avoidEditAppOverlap);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden", "aria-hidden"],
    });
    return () => {
      window.removeEventListener("resize", onResize);
      obs.disconnect();
    };
  }, [avoidEditAppOverlap]);

  const startDrag = (e) => {
    draggingRef.current = true;
    // Prevent text selection and default touch behavior
    e.preventDefault();
    e.stopPropagation();

    // Determine if it's a touch event or mouse event
    const initialPoint = "touches" in e ? e.touches[0] : e;
    // Store initial offset from button center to touch/mouse point
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const offsetX = initialPoint.clientX - (buttonRect.left + buttonRect.width / 2);
    const offsetY = initialPoint.clientY - (buttonRect.top + buttonRect.height / 2);

    const move = (ev) => {
      if (!draggingRef.current) return;
      const point = "touches" in ev ? ev.touches[0] : ev;

      // Calculate new center x, accounting for initial offset
      const newX = point.clientX - offsetX;
      // Calculate new bottom, accounting for initial offset
      const newBottom = window.innerHeight - (point.clientY - offsetY);

      // Clamp x to stay within screen bounds with some padding (half button width)
      const clampedX = Math.min(
        Math.max(newX, buttonRect.width / 2),
        window.innerWidth - buttonRect.width / 2
      );
      // Clamp bottom to stay within screen bounds with some padding (half button height)
      const clampedBottom = Math.min(
        Math.max(newBottom, buttonRect.height / 2),
        window.innerHeight - buttonRect.height / 2
      );

      setCustomPos({ x: clampedX, bottom: clampedBottom });
      setDock("custom"); // Set mode to custom when dragging starts
      try {
        localStorage.setItem("floating_save_mode", "custom");
        localStorage.setItem("floating_save_pos", JSON.stringify({ x: clampedX, bottom: clampedBottom }));
      } catch (err) {
        console.warn("Failed to write floating_save_pos to localStorage:", err);
      }
      ev.preventDefault(); // Prevent scrolling/zooming during drag
    };

    const end = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", move, { passive: false });
      window.removeEventListener("pointerup", end);
      window.removeEventListener("touchmove", move, { passive: false });
      window.removeEventListener("touchend", end);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  };

  const handleClick = async () => {
    // If dragging has just finished, ignore the click event
    if (draggingRef.current) {
      draggingRef.current = false; // Reset for next interaction
      return;
    }

    const now = Date.now();
    // Double-tap toggles side (and exits custom mode if active)
    if (now - lastTapRef.current < 350) {
      // 350ms for double-tap window
      const next = dock === "right" ? "left" : "right";
      setDock(next);
      try {
        localStorage.setItem("floating_save_mode", "dock"); // Revert to dock mode
        localStorage.setItem("floating_save_dock", next);
      } catch (e) {
        console.warn("Failed to write floating_save_dock to localStorage:", e);
      }
      lastTapRef.current = 0; // Reset double-tap timer
      return;
    }
    lastTapRef.current = now; // Record time of first tap

    const btn = findSaveButton();
    if (!btn) {
      const form = document.querySelector("form");
      if (form) {
        setBusy(true);
        // Use requestSubmit if available, otherwise fallback to submit
        form.requestSubmit ? form.requestSubmit() : form.submit();
        setTimeout(() => setBusy(false), 1500); // Stop busy state after a timeout
      }
      return;
    }

    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    setBusy(true);
    setTimeout(() => {
      btn.click();
      setTimeout(() => setBusy(false), 1500);
    }, 250); // Small delay to allow scrollIntoView to happen
  };

  const computedStyle = React.useCallback(() => {
    const baseStyle = {
      zIndex: 2147483647, // Max z-index to ensure it's always on top
      // Lift it above mobile browser bar by default
      bottom: `calc(env(safe-area-inset-bottom, 0px) + ${
        dock === "custom" && customPos.bottom != null ? customPos.bottom : bottomOffset + 56
      }px)`,
    };

    if (dock === "custom" && customPos.x != null) {
      // For custom mode, explicitly set left and right to override Tailwind classes
      // customPos.x is the center of the button, so subtract half its width (56px/2 = 28px)
      return { ...baseStyle, left: `${customPos.x - 28}px`, right: "auto" };
    }

    // For 'left' or 'right' dock modes, rely on Tailwind classes for horizontal position.
    // The `className` will conditionally add `left-4` or `right-4`.
    // `computedStyle` only provides `zIndex` and `bottom` in this case.
    return baseStyle;
  }, [dock, customPos, bottomOffset]);

  if (hidden) {
    return null; // Do not render while reading window is open
  }

  return (
    <button
      aria-label="Save"
      onClick={handleClick}
      onPointerDown={startDrag} // For mouse/pen interactions
      onTouchStart={startDrag} // For touch interactions
      className={
        "md:hidden fixed rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-xl border border-white/10 flex items-center justify-center active:scale-95 transition " +
        (dock === "custom" ? "" : (dock === "left" ? "left-4" : "right-4")) + // Apply left-4/right-4 only if not custom
        " " +
        className
      }
      style={computedStyle()}
      title="Save (drag to move, double‑tap to swap sides)"
    >
      {busy ? (
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      ) : (
        <Save className="w-6 h-6 text-white" />
      )}
    </button>
  );
}
