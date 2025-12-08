import React, { useState } from "react";
import { Card as CardEntity } from "@/entities/Card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";

export default function BulkCardUpload({ isOpen, onClose, deckId, onUploadComplete }) {
  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    setError(null);
    let cards;

    try {
      cards = JSON.parse(jsonInput);
      if (!Array.isArray(cards)) {
        throw new Error("Input must be a JSON array of card objects.");
      }
    } catch (e) {
      setError(`Invalid JSON: ${e.message}`);
      return;
    }

    if (cards.length === 0) {
      setError("JSON array is empty. Nothing to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const cardsWithDeckId = cards.map((card) => {
        // Map all possible fields from the Card schema
        const newCard = {
          deck_id: deckId,
          name: card.name,
          image_url: card.image_url,
          video_url: card.video_url,
          frame_style: card.frame_style,
          number: card.number,
          element: card.element,
          keywords: card.keywords,
          ancient_wisdom: card.ancient_wisdom,
          overall_meaning: card.overall_meaning,
          upright_meaning: card.upright_meaning,
          upright_insight: card.upright_insight,
          upright_action: card.upright_action,
          reversed_meaning: card.reversed_meaning,
          reversed_insight: card.reversed_insight,
          reversed_action: card.reversed_action,
          interaction: card.interaction,
          musician_quote: card.musician_quote,
          facedown_meaning: card.facedown_meaning,
          custom_fields: card.custom_fields,
        };
        
        // Remove any fields that are undefined so they don't cause issues
        Object.keys(newCard).forEach(key => newCard[key] === undefined && delete newCard[key]);
        
        if (!newCard.name) {
          throw new Error("One or more cards in the JSON is missing the required 'name' field.");
        }
        
        return newCard;
      });

      await CardEntity.bulkCreate(cardsWithDeckId);

      setIsUploading(false);
      setJsonInput("");
      onUploadComplete(); // This will close the modal and refresh the list
    } catch (e) {
      console.error("Bulk upload failed:", e);
      setError(`Upload failed: ${e.message}`);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Bulk Upload Cards via JSON</DialogTitle>
          <DialogDescription className="text-gray-400">
            Paste a JSON array of card objects below. Each object must have a 'name' property. All other fields from the Card schema (like 'image_url', 'number', 'upright_meaning', etc.) are supported.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='[{"name": "Card One", "image_url": "https://..."}, {"name": "Card Two", "number": 2}]'
            className="min-h-[250px] bg-white/10 border-white/20 text-white font-mono text-sm focus:ring-purple-400"
            disabled={isUploading}
          />
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} className="bg-purple-600 hover:bg-purple-700" disabled={isUploading || !jsonInput.trim()}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${jsonInput.trim() ? `(${(jsonInput.match(/"name":/g) || []).length}) Cards` : 'Cards'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}