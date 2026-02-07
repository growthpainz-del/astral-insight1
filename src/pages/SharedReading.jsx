import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Calendar, Eye, Heart } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EnhancedCardViewer from "@/components/reading/EnhancedCardViewer";

export default function SharedReadingPage() {
  const [reading, setReading] = useState(null);
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingCard, setViewingCard] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const readingId = urlParams.get("id");

    if (!readingId) {
      setError("No reading ID provided");
      setLoading(false);
      return;
    }

    loadReading(readingId);
  }, []);

  const loadReading = async (readingId) => {
    try {
      const loadedReading = await base44.entities.Reading.get(readingId);
      if (!loadedReading?.is_public) { throw new Error("Reading is private or not shared."); }
      setReading(loadedReading);

      if (loadedReading.deck_id) {
        const loadedDeck = await base44.entities.Deck.get(loadedReading.deck_id);
        setDeck(loadedDeck);
      }

      if (loadedReading.cards_drawn?.length) {
        const cardPromises = loadedReading.cards_drawn.map(dc => 
          base44.entities.Card.get(dc.card_id).catch(() => null)
        );
        const loadedCards = await Promise.all(cardPromises);
        
        setCards(loadedCards.map((card, idx) => ({
          ...card,
          position: loadedReading.cards_drawn[idx].position,
          isReversed: loadedReading.cards_drawn[idx].is_reversed
        })));
      }
    } catch (err) {
      console.error("Failed to load shared reading:", err);
      setError("Failed to load reading. It may have been deleted or is not public.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950 p-6">
        <Card className="bg-white/5 border-white/10 max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-red-300 mb-4">{error}</p>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
                  {reading?.title}
                </CardTitle>
                <div className="flex flex-wrap gap-3 text-sm text-white/70">
                  {reading?.created_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(reading.created_date), "PPP")}
                    </div>
                  )}
                  {deck && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {deck.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {reading?.spread_type || "Reading"}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Cards */}
        {cards.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-purple-300">Cards Drawn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => card && setViewingCard({ card, position: card.position, isReversed: card.isReversed })}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    {card?.image_url && (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className={`w-full h-48 object-cover rounded mb-3 ${card.isReversed ? 'rotate-180' : ''}`}
                      />
                    )}
                    <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {card?.name || "Unknown Card"}
                    </p>
                    <p className="text-sm text-white/60">{card?.position}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interpretation */}
        {reading?.interpretation && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-300">Interpretation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                {reading.interpretation}
              </p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
          <CardContent className="pt-6 text-center">
            <Heart className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              Get Your Own Reading
            </h3>
            <p className="text-white/70 mb-4">
              Discover insights and guidance with our divination tools
            </p>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Reading
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Card Viewer */}
      {viewingCard && (
        <EnhancedCardViewer
          card={viewingCard.card}
          position={viewingCard.position}
          isReversed={viewingCard.isReversed}
          isOpen={!!viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}
    </div>
  );
}