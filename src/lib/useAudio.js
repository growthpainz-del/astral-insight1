import { useCallback, useRef } from 'react';

export function useAudio() {
  const ctxRef = useRef(null);

  const getContext = () => {
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        ctxRef.current = new AudioContextClass();
      }
    }
    return ctxRef.current;
  };

  const playOscillator = useCallback((freq, type = 'sine', duration = 0.1) => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }, []);

  return {
    playTick: useCallback((freq = 600) => playOscillator(freq, 'sine', 0.05), [playOscillator]),
    playWhoosh: useCallback(() => playOscillator(300, 'triangle', 0.3), [playOscillator]),
    playReveal: useCallback(() => {
      playOscillator(523, 'sine', 0.3); // C
      setTimeout(() => playOscillator(659, 'sine', 0.3), 100); // E
      setTimeout(() => playOscillator(784, 'sine', 0.3), 200); // G
      setTimeout(() => playOscillator(1047, 'sine', 0.4), 300); // High C
    }, [playOscillator]),
    speak: useCallback((text) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // clear previous
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    }, [])
  };
}