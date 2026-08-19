import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Minus, Maximize2, Mic, MicOff, Video, VideoOff } from "lucide-react";

/**
 * FloatingWherebyTV
 * A draggable, floatable "retro TV" styled console that hosts the Whereby
 * live-session iframe. Sits fixed over the page, can be dragged anywhere
 * within the viewport, and can be minimized down to a small floating dock icon.
 */
export default function FloatingWherebyTV({ url }) {
  const [minimized, setMinimized] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const boundaryRef = useRef(null);

  if (!url) return null;

  const embedUrl = `${url}${url.includes("?") ? "&" : "?"}embed=true&audio=${audioOn ? "on" : "off"}&video=${videoOn ? "on" : "off"}&background=off&leaveButton=off&chat=off&people=off`;

  return (
    <div ref={boundaryRef} className="fixed inset-0 z-[200] pointer-events-none">
      <AnimatePresence mode="wait">
        {minimized ? (
          <motion.button
            key="dock"
            drag
            dragMomentum={false}
            dragConstraints={boundaryRef}
            onClick={() => setMinimized(false)}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="pointer-events-auto fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#1a0f35] to-[#0a0618] border-2 border-[#a078ff]/50 shadow-[0_0_20px_rgba(167,139,250,0.35)] flex items-center justify-center cursor-grab active:cursor-grabbing"
            title="Reopen live reading console"
          >
            <Tv className="w-6 h-6 text-cyan-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          </motion.button>
        ) : (
          <motion.div
            key="tv"
            drag
            dragMomentum={false}
            dragElastic={0.05}
            dragConstraints={boundaryRef}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="pointer-events-auto fixed bottom-6 right-6 w-[300px] select-none"
            style={{ touchAction: "none" }}
          >
            {/* TV cabinet / bezel */}
            <div className="relative rounded-[22px] p-3 pb-4 bg-gradient-to-b from-[#2a1f45] via-[#1a0f35] to-[#0a0618] border border-[#a078ff]/40 shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">
              {/* Antenna */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-end gap-1 pointer-events-none">
                <div className="w-[2px] h-6 bg-gradient-to-t from-[#a078ff]/70 to-transparent rotate-[-18deg] origin-bottom" />
                <div className="w-[2px] h-7 bg-gradient-to-t from-cyan-300/70 to-transparent rotate-[16deg] origin-bottom" />
              </div>

              {/* Drag handle / title strip */}
              <div className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-purple-200/70">
                    Live Reading
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMinimized(true)}
                    className="text-purple-200/60 hover:text-cyan-300 transition-colors"
                    title="Minimize"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Screen */}
              <div className="relative rounded-xl overflow-hidden border-2 border-[#0a0618] bg-black aspect-video shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <iframe
                  src={embedUrl}
                  allow="camera; microphone; fullscreen; speaker; display-capture"
                  className="w-full h-full border-0"
                />
                {/* subtle scanline overlay for TV feel */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
                  }}
                />
              </div>

              {/* Control knobs */}
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => setAudioOn((v) => !v)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                    audioOn
                      ? "bg-purple-900/50 border-purple-400/50 text-cyan-300"
                      : "bg-red-900/40 border-red-500/50 text-red-300"
                  }`}
                  title={audioOn ? "Mute mic" : "Unmute mic"}
                >
                  {audioOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setVideoOn((v) => !v)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                    videoOn
                      ? "bg-purple-900/50 border-purple-400/50 text-cyan-300"
                      : "bg-red-900/40 border-red-500/50 text-red-300"
                  }`}
                  title={videoOn ? "Turn camera off" : "Turn camera on"}
                >
                  {videoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setMinimized(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-400/30 bg-[#0a0618] text-purple-200/60 hover:text-cyan-300 transition-colors"
                  title="Dock"
                >
                  <Maximize2 className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
