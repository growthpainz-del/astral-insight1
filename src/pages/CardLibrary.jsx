import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Library, Trash2, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getThumbnailUrl } from "@/lib/utils";

export default function CardLibrary() {
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingCardId, setMovingCardId] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) return;
      
      const [unassignedCards, userDecks] = await Promise.all([
        queueApiCall(() => base44.entities.Card.filter({ deck_id: "unassigned", created_by: user.email }, "-created_date", 200)),
        queueApiCall(() => base44.entities.Deck.filter({ created_by: user.email }, "-updated_date", 100))
      ]);
      
      setCards(unassignedCards || []);
      setDecks(userDecks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToDeck = async (cardId, deckId) => {
    if (!deckId) return;
    setMovingCardId(cardId);
    try {
      await base44.entities.Card.update(cardId, { deck_id: deckId });
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      console.error(e);
      alert("Failed to move card.");
    } finally {
      setMovingCardId(null);
    }
  };

  const handleDelete = async (cardId) => {
    if (!confirm("Are you sure you want to delete this card draft?")) return;
    try {
      await base44.entities.Card.delete(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      console.error(e);
      alert("Failed to delete card.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 flex items-center gap-3">
          <Library className="w-8 h-8 text-purple-400" />
          Card Library
        </h1>
        <p className="text-white/60 mb-8">Your unassigned cards and drafts. Move them to a deck when you're ready.</p>

        {cards.length === 0 ? (
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-xl">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Your library is empty</h2>
            <p className="text-white/60 mb-6">Create unassigned cards in the Card Maker to see them here.</p>
            <Link to={createPageUrl("CardMaker")}>
              <Button className="bg-purple-600 hover:bg-purple-700">Go to Card Maker</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row gap-4 items-center group shadow-sm transition-all hover:bg-slate-800">
                <div 
                  className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 bg-black/50 rounded-md border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-colors flex items-center justify-center relative"
                  onClick={() => setExpandedCard(card)}
                  title="Click to expand"
                >
                  {card.image_url ? (
                    <>
                      <img src={getThumbnailUrl(card.image_url, 400)} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white/80" />
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-white/20 text-center">No Image</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                  <h3 className="font-bold text-base sm:text-lg leading-tight truncate text-purple-100 w-full">{card.name || "Untitled"}</h3>
                  {card.subtitle && <p className="text-purple-300 text-xs mt-0.5 truncate w-full">{card.subtitle}</p>}
                  
                  {card.overall_meaning && (
                    <p className="text-white/60 text-xs mt-1.5 line-clamp-2 italic w-full">
                      "{card.overall_meaning}"
                    </p>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-48 shrink-0 mt-2 sm:mt-0">
                  <Select 
                    onValueChange={(val) => handleMoveToDeck(card.id, val)}
                    disabled={movingCardId === card.id}
                  >
                    <SelectTrigger className="w-full bg-black/40 border-white/20 h-8 text-xs">
                      <SelectValue placeholder="Move to Deck..." />
                    </SelectTrigger>
                    <SelectContent>
                      {decks.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full h-8 text-xs bg-red-950/50 hover:bg-red-900/80 border border-red-900/50"
                    onClick={() => handleDelete(card.id)}
                    disabled={movingCardId === card.id}
                  >
                    {movingCardId === card.id ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Trash2 className="w-3 h-3 mr-2" />} 
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!expandedCard} onOpenChange={(open) => !open && setExpandedCard(null)}>
          <DialogContent className="max-w-sm sm:max-w-md md:max-w-xl bg-slate-950 border-white/10 p-1 overflow-hidden flex flex-col items-center justify-center">
            <DialogTitle className="sr-only">View Card</DialogTitle>
            {expandedCard?.image_url && (
              <img src={expandedCard.image_url} alt={expandedCard.name} className="w-full max-h-[85vh] object-contain rounded-md" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}