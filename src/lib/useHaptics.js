import { useCallback } from 'react';

export function useHaptics() {
  const vibrate = useCallback((pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  return {
    tick: (isOuter) => vibrate(isOuter ? [12, 6, 8] : [6, 4, 6]),
    spinStart: () => vibrate([10, 20, 15, 30, 20]),
    finalLand: () => vibrate([25, 50, 40]),
    synergy: () => vibrate([15, 30, 15, 30, 25])
  };
}