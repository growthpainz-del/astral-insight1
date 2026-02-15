import React from "react";
import DidAgentEmbed from "@/components/integrations/DidAgentEmbed";
import { Button } from "@/components/ui/button";
import { Video, X } from "lucide-react";

export default function DidAgentFloater() {
  const [open, setOpen] = React.useState(false);
  const inPreview = React.useMemo(() => {
    try { return window.top !== window.self; } catch (_) { return true; }
  }, []);

  return (
    <>
      {/* Launcher button (bottom-right) */}
      <Button
        onClick={() => {
          // Always open modal; in preview we also suggest opening in new tab from inside the modal
          setOpen(true);
          if (inPreview) {
            try { window.open(window.location.href, '_blank'); } catch (_) {}
          }
        }}
        className="fixed bottom-28 right-4 z-[70] bg-purple-600 hover:bg-purple-700 shadow-lg rounded-full px-4 py-2"
        title="Open Live Agent"
      >
        <Video className="w-4 h-4" />
        <span className="ml-1">Live Agent</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Content container */}
          <div className="absolute inset-0 p-4 md:p-6 flex items-center justify-center">
            <div className="relative w-full h-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-white/20 bg-black/80 shadow-2xl">
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90"
                aria-label="Close Live Agent"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Frame-based embed fills container */}
              <div className="absolute inset-0">
                <DidAgentEmbed
                  mode="full"
                  position="right"
                  orientation="horizontal"
                  name="live-agent-floater"
                  // Frame mode uses secure server config (getDidEmbedConfig) to fetch keys
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}