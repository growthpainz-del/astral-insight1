import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Info } from "lucide-react";

export default function BulkImporter({ isOpen, onClose }) {
  // Legacy importer disabled in favor of the All‑in‑One JSON Importer page.
  return (
    <Dialog open={!!isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 text-white border border-purple-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-300" />
            Import moved
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-white/80">
          <p>
            The legacy “Bulk Import Cards (JSON)” is now disabled. Use the All‑in‑One JSON Importer
            to import Cards + Spreads + Persona in one place.
          </p>
          <p className="text-white/70 text-sm">
            Tip: It also supports updating only custom notes/fields when names match.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
          <Link to={createPageUrl("PersonaCardImporter")}>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              Open JSON Importer
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}