import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  History as HistoryIcon,
  Calendar,
  BookOpen,
  Trash2,
  Download,
  Search,
  Loader2,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { format } from "date-fns";
import EnhancedCardViewer from "@/components/reading/EnhancedCardViewer";

export default function HistoryPage() {
  // Pull-to-refresh (mobile)
  const containerRef = React.useRef(null);
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startYRef = React.useRef(0);
  const atTop = () => (window.scrollY === 0) || ((containerRef.current && containerRef.current.scrollTop === 0));
  const onTouchStart = (e) => { if (!atTop()) return; startYRef.current = e.touches[0].clientY; setPull(0); };
  const onTouchMove = (e) => { if (!atTop()) return; const dy = e.touches[0].clientY - startYRef.current; if (dy>0) { e.preventDefault(); setPull(Math.min(120, dy)); } };
  const onTouchEnd = () => { if (pull>80 && !refreshing) { setRefreshing(true); window.location.reload(); } setPull(0); }
  const [readings, setReadings] = useState([]);
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReading, setSelectedReading] = useState(null);
  const [viewingCard, setViewingCard] = useState(null);
  const [decks, setDecks] = useState({});
  const [cards, setCards] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReadings();
  }, []);

  useEffect(() => {
    filterReadings();
  }, [readings, searchTerm]);

  const loadReadings = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const allReadings = user?.email
        ? await base44.entities.Reading.filter({ created_by: user.email }, "-created_date", 100)
        : [];
      setReadings(allReadings || []);

      // Load decks and cards for all readings
      const deckIds = new Set(allReadings.map(r => r.deck_id).filter(Boolean));
      const deckPromises = Array.from(deckIds).map(id => 
        base44.entities.Deck.get(id).catch(() => null)
      );
      const loadedDecks = await Promise.all(deckPromises);
      const decksMap = {};
      loadedDecks.forEach(deck => {
        if (deck) decksMap[deck.id] = deck;
      });
      setDecks(decksMap);

      // Load all cards - FIXED: Only fetch valid card IDs, skip corrupted ones
      const cardIds = new Set(
        allReadings.flatMap(r => 
          (r.cards_drawn || [])
            .map(dc => dc.card_id)
            .filter(id => id && !id.includes('-drawn-')) // Skip corrupted IDs with timestamps
        )
      );
      
      console.log('📋 Loading', cardIds.size, 'unique cards for history');
      
      const cardsMap = {};
      for (const cardId of cardIds) {
        try {
          const card = await base44.entities.Card.get(cardId);
          if (card) cardsMap[cardId] = card;
        } catch (e) {
          console.warn("⚠️ Failed to load card (may be deleted or corrupted ID):", cardId);
          // Don't block loading if a card fails
        }
      }
      setCards(cardsMap);
    } catch (error) {
      console.error("Failed to load readings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterReadings = () => {
    if (!searchTerm.trim()) {
      setFilteredReadings(readings);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = readings.filter(reading => 
      reading.title?.toLowerCase().includes(term) ||
      reading.spread_type?.toLowerCase().includes(term) ||
      reading.interpretation?.toLowerCase().includes(term) ||
      decks[reading.deck_id]?.name?.toLowerCase().includes(term)
    );
    setFilteredReadings(filtered);
  };

  const deleteReading = async (readingId) => {
    if (!confirm("Delete this reading? This cannot be undone.")) return;

    try {
      await base44.entities.Reading.delete(readingId);
      setReadings(prev => prev.filter(r => r.id !== readingId));
      if (selectedReading?.id === readingId) {
        setSelectedReading(null);
      }
    } catch (error) {
      alert("Failed to delete reading: " + (error.message || "Unknown error"));
    }
  };

  const exportReading = (reading) => {
    const deck = decks[reading.deck_id];
    const timestamp = format(new Date(reading.created_date || Date.now()), "yyyy-MM-dd_HHmmss");
    
    let text = `🔮 TAROT READING\n`;
    text += `${"=".repeat(50)}\n\n`;
    text += `Title: ${reading.title}\n`;
    text += `Date: ${format(new Date(reading.created_date || Date.now()), "PPpp")}\n`;
    text += `Deck: ${deck?.name || "Unknown"}\n`;
    text += `Spread: ${reading.spread_type || "Unknown"}\n`;
    text += `\n${"=".repeat(50)}\n\n`;

    if (reading.cards_drawn && reading.cards_drawn.length > 0) {
      text += `🃏 CARDS DRAWN:\n\n`;
      reading.cards_drawn.forEach((dc, idx) => {
        const card = cards[dc.card_id];
        text += `${idx + 1}. ${dc.position || "Card"}\n`;
        text += `   ${card?.name || dc.card_name || "Unknown Card"}`;
        if (dc.is_reversed) text += ` (Reversed)`;
        text += `\n\n`;
      });
      text += `${"=".repeat(50)}\n\n`;
    }

    if (reading.interpretation) {
      text += `📝 INTERPRETATION:\n\n${reading.interpretation}\n\n`;
      text += `${"=".repeat(50)}\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading_${reading.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyReadingToClipboard = async (reading) => {
    const deck = decks[reading.deck_id];
    
    let text = `🔮 ${reading.title}\n\n`;
    text += `📅 ${format(new Date(reading.created_date || Date.now()), "PPP")}\n`;
    text += `🎴 ${deck?.name || "Unknown Deck"} - ${reading.spread_type || "Unknown Spread"}\n\n`;

    if (reading.cards_drawn && reading.cards_drawn.length > 0) {
      text += `Cards:\n`;
      reading.cards_drawn.forEach((dc) => {
        const card = cards[dc.card_id];
        text += `• ${card?.name || dc.card_name || "Unknown"}`;
        if (dc.is_reversed) text += ` (Reversed)`;
        text += ` - ${dc.position || ""}\n`;
      });
      text += `\n`;
    }

    if (reading.interpretation) {
      text += `Interpretation:\n${reading.interpretation}`;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("Failed to copy to clipboard");
    }
  };

  const viewCard = (cardId, position, isReversed, relatedCards) => {
    const card = cards[cardId];
    if (card) {
      setViewingCard({
        card,
        position,
        isReversed,
        relatedCards
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Pull-to-refresh indicator */}
        <div style={{height: pull, transition: pull===0 ? 'height .2s ease' : 'none'}} className="flex items-center justify-center text-white/70">
          {pull>0 && (refreshing ? 'Refreshing…' : 'Pull to refresh')}
        </div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30">
              <HistoryIcon className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                Reading History
              </h1>
              <p className="text-white/70 text-sm">
                {readings.length} reading{readings.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search readings by title, spread, deck, or interpretation..."
            className="pl-12 bg-slate-800/50 border-white/10 text-white h-12"
          />
        </div>

        {/* Readings Grid */}
        {filteredReadings.length === 0 ? (
          <Card className="bg-white/5 border-white/10 text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/70 text-lg">
                {searchTerm ? "No readings match your search" : "No readings yet"}
              </p>
              <p className="text-white/50 text-sm mt-2">
                {searchTerm ? "Try a different search term" : "Your saved readings will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReadings.map((reading) => {
              const deck = decks[reading.deck_id];
              const readingDate = reading.created_date || reading.date;

              return (
                <Card
                  key={reading.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={() => setSelectedReading(reading)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {reading.title}
                      </CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReading(reading.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-white/70">
                        <Calendar className="w-4 h-4" />
                        {readingDate ? format(new Date(readingDate), "PPP") : "Unknown date"}
                      </div>
                      {deck && (
                        <div className="flex items-center gap-2 text-white/70">
                          <BookOpen className="w-4 h-4" />
                          {deck.name}
                        </div>
                      )}
                      <Badge className="bg-purple-600/30 border-purple-500/40 text-purple-200">
                        {reading.spread_type || "Unknown Spread"}
                      </Badge>
                      {reading.cards_drawn && reading.cards_drawn.length > 0 && (
                        <Badge className="bg-cyan-600/30 border-cyan-500/40 text-cyan-200">
                          {reading.cards_drawn.length} card{reading.cards_drawn.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {reading.interpretation && (
                    <CardContent>
                      <p className="text-white/60 text-sm line-clamp-3">
                        {reading.interpretation}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading Detail Modal */}
      {selectedReading && (
        <Dialog open={!!selectedReading} onOpenChange={() => setSelectedReading(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 text-white border border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-400" />
                {selectedReading.title}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Reading Info */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Date:</span>
                      <p className="text-white font-medium">
                        {selectedReading.created_date 
                          ? format(new Date(selectedReading.created_date), "PPpp")
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Deck:</span>
                      <p className="text-white font-medium">
                        {decks[selectedReading.deck_id]?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Spread:</span>
                      <p className="text-white font-medium">
                        {selectedReading.spread_type || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Cards:</span>
                      <p className="text-white font-medium">
                        {selectedReading.cards_drawn?.length || 0} drawn
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cards Drawn */}
                {selectedReading.cards_drawn && selectedReading.cards_drawn.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Cards Drawn
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedReading.cards_drawn.map((dc, idx) => {
                        // FIXED: Handle both new clean card IDs and old corrupted ones
                        const isCorruptedId = dc.card_id?.includes('-drawn-');
                        const card = isCorruptedId ? null : cards[dc.card_id];
                        
                        // Use stored card data from cards_drawn if available (for old readings)
                        const displayName = card?.name || dc.name || dc.card_name || "Unknown Card";
                        const displayImage = card?.image_url || dc.image_url;
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => card && viewCard(dc.card_id, dc.position, dc.is_reversed, selectedReading.cards_drawn.filter(c => c.card_id !== dc.card_id))}
                            className={`bg-white/5 border border-white/10 rounded-lg p-4 transition-all ${card ? 'hover:bg-white/10 cursor-pointer group' : 'opacity-75'}`}
                          >
                            <div className="flex items-start gap-3">
                              {displayImage && (
                                <img
                                  src={displayImage}
                                  alt={displayName}
                                  className={`w-16 h-24 object-cover rounded border border-white/20 ${dc.is_reversed ? 'rotate-180' : ''}`}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                  {displayName}
                                </p>
                                <p className="text-sm text-white/60 mb-2">
                                  {dc.position}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {dc.is_reversed && (
                                    <Badge className="bg-purple-600/30 border-purple-500/40 text-purple-200 text-xs">
                                      Reversed
                                    </Badge>
                                  )}
                                  {isCorruptedId && (
                                    <Badge className="bg-amber-600/30 border-amber-500/40 text-amber-200 text-xs">
                                      ⚠️ Old format
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interpretation */}
                {selectedReading.interpretation && (
                  <div>
                    <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Interpretation & Notes
                    </h3>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                        {selectedReading.interpretation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyReadingToClipboard(selectedReading)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportReading(selectedReading)}
                className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteReading(selectedReading.id)}
                className="border-red-500/40 text-red-300 hover:bg-red-500/10 ml-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Card Viewer */}
      {viewingCard && (
        <EnhancedCardViewer
          card={viewingCard.card}
          position={viewingCard.position}
          isReversed={viewingCard.isReversed}
          relatedCards={viewingCard.relatedCards}
          isOpen={!!viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}
    </div>
  );
}