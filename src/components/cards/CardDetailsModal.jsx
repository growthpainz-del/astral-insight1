import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CardDetailsPanel from "./CardDetailsPanel";

export default function CardDetailsModal({ open, onClose, card }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 text-white border border-purple-800/40">
        <DialogHeader>
          <DialogTitle className="text-amber-200">
            {card?.name || card?.card_name || card?.card?.name || card?.title || card?.card?.title || "Card Details"}
          </DialogTitle>
        </DialogHeader>
        <CardDetailsPanel card={card} />
        <DialogFooter>
          <Button variant="outline" className="border-white/20" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}