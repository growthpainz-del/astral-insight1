import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Library, Trash2, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";

export default function CardLibrary() {
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingCardId, setMovingCardId] = useState(null);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex flex-col group shadow-lg">
                <div className="aspect-[2/3] w-full bg-black/50 relative border-b border-white/10">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg leading-tight truncate text-purple-100">{card.name}</h3>
                  {card.subtitle && <p className="text-purple-300 text-xs mt-1 truncate">{card.subtitle}</p>}
                  
                  {card.overall_meaning && (
                    <p className="text-white/60 text-xs mt-2 line-clamp-3 flex-1 italic">
                      "{card.overall_meaning}"
                    </p>
                  )}

                  <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
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
                      Delete Draft
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}