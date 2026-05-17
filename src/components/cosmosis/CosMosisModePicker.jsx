import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const MODES = [
  { id: "interpret", glyph: "◎", name: "Interpret", hint: "decode the signal" },
  { id: "expand",    glyph: "∿", name: "Expand",    hint: "widen the frame" },
  { id: "mirror",    glyph: "⊛", name: "Mirror",    hint: "reflect back" },
  { id: "weave",     glyph: "⋈", name: "Weave",     hint: "connect threads" },
];

export default function CosMosisModePicker({ visible, onSelect, onCancel }) {
  if (!visible) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="w-full rounded-xl border border-purple-500/30 bg-black/60 backdrop-blur-md p-3 space-y-2"
      >
        <p className="text-[11px] text-purple-400 font-['Cinzel'] tracking-widest text-center uppercase mb-3">
          CosMosis · Choose your mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className="flex flex-col items-center gap-1 p-3 rounded-lg border border-purple-500/20 bg-purple-900/20 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all text-center"
            >
              <span className="text-purple-300 text-lg">{mode.glyph}</span>
              <span className="text-purple-100 text-xs font-semibold font-['Cinzel']">{mode.name}</span>
              <span className="text-purple-400 text-[10px]">{mode.hint}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full text-center text-purple-500 text-xs mt-1 hover:text-purple-300 transition-colors py-1"
        >
          cancel
        </button>
      </motion.div>
    </AnimatePresence>
  );
}