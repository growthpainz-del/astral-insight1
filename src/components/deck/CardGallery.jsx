
import React from "react";
import { Button } from "@/components/ui/button";
import { Card as CardEntity } from "@/entities/Card"; // Updated import
import { Deck } from "@/entities/Deck"; // New import
// Updated import
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import FramedCardImage from "./FramedCardImage";
import { logError } from '@/components/utils/errorHandler';
import { Search, Grid3x3, List, ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react"; // Updated lucide imports
import { ScrollArea } from "@/components/ui/scroll-area"; // New import
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // New imports

export default function CardGallery({ deckId }) {
  const [cards, setCards] = React.useState([]);
  const [filteredCards, setFilteredCards] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedCard, setSelectedCard] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [imageErrors, setImageErrors] = React.useState(new Set());
  const [deck, setDeck] = React.useState(null);
  const cardsPerPage = viewMode === "grid" ? 12 : 20;

  React.useEffect(() => {
    if (!deckId) return;
    setLoading(true);

    // Load both deck and cards
    Promise.all([
      Deck.get(deckId), // Changed from base44.entities.Deck.get
      CardEntity.filter({ deck_id: deckId })
    ])
      .then(([deckData, cardsData]) => {
        setDeck(deckData);
        const sorted = (cardsData || []).sort((a, b) => {
          const numA = Number(a.number) || 0;
          const numB = Number(b.number) || 0;
          return numA - numB;
        });
        setCards(sorted);
        setFilteredCards(sorted);
      })
      .catch((err) => logError('Failed to load cards', err)) // Updated error message
      .finally(() => setLoading(false));
  }, [deckId]);

  React.useEffect(() => {
    if (!search.trim()) {
      setFilteredCards(cards);
      setCurrentPage(1);
      return;
    }
    const query = search.toLowerCase();
    const filtered = cards.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const keywords = Array.isArray(c.keywords)
        ? c.keywords.join(" ").toLowerCase()
        : "";
      const overall = (c.overall_meaning || "").toLowerCase();
      return name.includes(query) || keywords.includes(query) || overall.includes(query);
    });
    setFilteredCards(filtered);
    setCurrentPage(1);
  }, [search, cards]);

  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const handleImageError = (cardName, imageUrl) => {
    logError(`Card image error for "${cardName}"`, 'Failed to load image', imageUrl);
    setImageErrors(prev => new Set(prev).add(imageUrl));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, keywords, or meaning..."
            className="pl-10 bg-white/10 border-white/20 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-purple-600" : "border-white/20 text-white"}
          >
            <Grid3x3 className="w-4 h-4" /> {/* Changed from Grid to Grid3x3 */}
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-purple-600" : "border-white/20 text-white"}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          {search ? "No cards found matching your search." : "No cards in this deck yet."}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="cursor-pointer group"
                >
                  <div className={`${deck?.name?.toLowerCase().includes('lie detector') ? 'aspect-[1/1]' : 'aspect-[2/3]'} rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-purple-400/60 transition-all hover:scale-105`}>
                    {card.image_url && !imageErrors.has(card.image_url) ? (
                      <FramedCardImage
                        src={card.image_url}
                        alt={card.name}
                        frameStyle={card.frame_style}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(card.name, card.image_url)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-white/80 text-center truncate">{card.name}</p>
                  {card.number && (
                    <Badge variant="outline" className="mt-1 text-xs border-white/20 text-white/60">
                      #{card.number}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-400/60 transition-all cursor-pointer"
                >
                  <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-white/5">
                    {card.image_url && !imageErrors.has(card.image_url) ? (
                      <FramedCardImage
                        src={card.image_url}
                        alt={card.name}
                        frameStyle={card.frame_style}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(card.name, card.image_url)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {card.number && (
                        <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                          #{card.number}
                        </Badge>
                      )}
                      <h3 className="text-white font-medium truncate">{card.name}</h3>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2 mt-1">
                      {card.overall_meaning || card.upright_meaning || "No description available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-white/20 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/80">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-white/20 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Replaced fixed div modal with Shadcn Dialog component */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-2xl font-bold text-white">
              {selectedCard?.name || "Card Details"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelectedCard(null)} className="text-white/60 hover:text-white">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="space-y-4 pt-0">
              <div className="flex items-start gap-4">
                <div className="w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                  {selectedCard?.image_url && !imageErrors.has(selectedCard.image_url) ? (
                    <FramedCardImage
                      src={selectedCard.image_url}
                      alt={selectedCard.name}
                      frameStyle={selectedCard.frame_style}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(selectedCard.name, selectedCard.image_url)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedCard?.number && (
                      <Badge className="bg-purple-600">{selectedCard.number}</Badge>
                    )}
                    {/* The card name is now handled by DialogTitle, so the h2 here is removed for brevity */}
                  </div>
                  {selectedCard?.keywords && selectedCard.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedCard.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedCard?.overall_meaning && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-1">Overall Meaning</h3>
                  <p className="text-white/80">{selectedCard.overall_meaning}</p>
                </div>
              )}

              {selectedCard?.upright_meaning && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-1">Upright</h3>
                  <p className="text-white/80">{selectedCard.upright_meaning}</p>
                </div>
              )}

              {selectedCard?.reversed_meaning && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-1">Reversed</h3>
                  <p className="text-white/80">{selectedCard.reversed_meaning}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
