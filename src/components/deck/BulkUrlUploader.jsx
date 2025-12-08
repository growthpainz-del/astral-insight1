import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BulkImageUrlMatcher from "./BulkImageUrlMatcher";

export default function BulkUrlUploader({ isOpen, onClose, deckId }) {
  return (
    <Dialog open={!!isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 text-white border border-purple-500/30 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bulk Image URLs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!deckId ? (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80">
              Please open this tool from a specific deck so we can match the URLs to its cards.
            </div>
          ) : (
            <BulkImageUrlMatcher
              deckId={deckId}
              onDone={() => {
                if (onClose) onClose();
              }}
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}