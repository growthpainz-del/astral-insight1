import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Deck as DeckEntity, Card as CardEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";

export default function ReadingSimple() {
  const searchParams = new URLSearchParams(window.location.search);
  const deckIdFromUrl = searchParams.get("deckId");

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!deckIdFromUrl) {
      setError("No deck selected");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Loading timeout. Please try again.");
      }
    }, 20000);

    const loadDeck = async () => {
      try {
        console.log('📖 Loading deck:', deckIdFromUrl);
        
        const [loadedDeck, loadedCards] = await Promise.all([
          queueApiCall(() => DeckEntity.get(deckIdFromUrl), 3, 1500),
          queueApiCall(() => CardEntity.filter({ deck_id: deckIdFromUrl }), 3, 1500)
        ]);

        if (cancelled) return;

        console.log('✅ Loaded:', loadedDeck.name, loadedCards.length, 'cards');
        setDeck(loadedDeck);
        setCards(loadedCards);
        setError("");
      } catch (err) {
        if (cancelled) return;
        console.error('❌ Load failed:', err);
        
        if (isNetworkError(err)) {
          setError("Network error. Check your connection.");
        } else if (err.response?.status === 404) {
          setError("Deck not found.");
        } else {
          setError("Failed to load deck.");
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    loadDeck();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [deckIdFromUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-200 mb-4">{error}</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="text-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 p-6">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="text-purple-200 mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {deck && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-4">{deck.name}</h1>
            <p className="text-purple-200 mb-6">{deck.description}</p>
            
            <div className="text-white">
              <p className="mb-2">Deck loaded successfully!</p>
              <p>Cards: {cards.length}</p>
              <p className="text-sm text-purple-300 mt-4">
                Full reading interface coming back online shortly...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}