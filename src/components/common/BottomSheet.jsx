import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const handleClose = React.useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
    console.log('BottomSheet close clicked');
    onClose?.();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 bottom-0 z-[201] bg-gradient-to-br from-slate-900/98 via-purple-900/98 to-indigo-900/98 backdrop-blur-lg rounded-t-3xl shadow-2xl border-t-2 border-purple-500/30 max-h-[85vh] overflow-hidden flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <button
                onClick={handleClose}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose(e);
                }}
                className="p-2 rounded-full bg-red-600/80 hover:bg-red-700 border-2 border-white/40 transition-colors z-[202] flex-shrink-0 shadow-lg active:scale-95"
                aria-label="Close"
                type="button"
                style={{ touchAction: 'none' }}
              >
                <X className="w-5 h-5 text-white stroke-[3]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}