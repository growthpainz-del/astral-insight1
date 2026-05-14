import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card as CardEntity } from "@/entities/Card";
import { Deck } from "@/entities/Deck";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Loader2,
  X,
  ArrowLeft,
  Search,
  Plus,
  Settings,
  Pencil,
  Sparkles,
  FileImage,
  LayoutGrid,
  List
} from "lucide-react";



import CardEditor from "../components/deck/CardEditor";
import AIManualBuilder from "../components/deck/AIManualBuilder";
import BulkImageUploader from "../components/deck/BulkImageUploader";

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (retries === maxRetries - 1) throw error; // Last retry, rethrow
      const delay = baseDelay * Math.pow(2, retries); // Exponential backoff
      await new Promise(res => setTimeout(res, delay));
      retries++;
    }
  }
};

export default function CardGallery() {
  // deckId will now be managed via state and URLSearchParams instead of useParams()
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId") || searchParams.get("id");

  const [cards, setCards] = useState([]); // Replaces allCards
  const [deck, setDeck] = useState(null); // Replaces decks map
  const [isLoading, setIsLoading] = useState(true);
  const [filterText, setFilterText] = useState(""); // Replaces searchTerm
  const [viewMode, setViewMode] = useState("grid");

  // New state declarations from the outline
  const [isBuilderOpen, setIsBuilderOpen] = useState(false); // For AIManualBuilder dialog
  const [creatingCard, setCreatingCard] = useState(false); // For CardEditor in create mode
  const [editingCard, setEditingCard] = useState(null); // For CardEditor in edit mode
  const [deletingId, setDeletingId] = useState(null);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false); // New state for BulkImageUploader
  const [previewCard, setPreviewCard] = useState(null); // Preview modal for quick view

  // New states introduced by the outline's proposed changes
  const [error, setError] = useState(null); // For displaying API call errors
  const [deckCustomFields, setDeckCustomFields] = useState([]); // Now state-managed, replacing the useMemo for this



  // Extracted deck and card loading logic, now combined and deck-specific
  const loadDeckAndCards = useCallback(async () => {
    if (!deckId) {
      setIsLoading(false);
      setCards([]);
      setDeck(null);
      setDeckCustomFields([]); // Clear custom fields if no deck context
      setError(null); // Clear any previous error
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous error when starting a new load
    try {
      const [fetchedDeck, fetchedCards] = await Promise.all([
        retryApiCall(() => Deck.get(deckId)),
        retryApiCall(() => CardEntity.filter({ deck_id: deckId })) // FIX: Use correct filter method, wrapped with retryApiCall
      ]);

      // Sort cards by the 'number' property. Cards without a number (null/undefined) will appear at the end.
      const sortedCards = fetchedCards.sort((a, b) => (a.number || Infinity) - (b.number || Infinity));

      setDeck(fetchedDeck);
      setCards(sortedCards);

      // Set deck custom fields from the fetched deck, processing if needed
      if (fetchedDeck.custom_fields) {
        // Assuming fetchedDeck.custom_fields can be an array of strings or objects with a 'label' property
        const processedCustomFields = fetchedDeck.custom_fields.map(field => {
          if (typeof field === 'string') {
            return field;
          }
          if (typeof field === 'object' && field.label) {
            return field.label;
          }
          return null;
        }).filter(Boolean).sort(); // Filter out nulls and sort alphabetically
        setDeckCustomFields(processedCustomFields);
      } else {
        setDeckCustomFields([]);
      }

    } catch (err) {
      setError("Failed to load deck or cards: " + err.message); // Set error state
      setDeck(null);
      setCards([]); // Clear cards on error
      setDeckCustomFields([]); // Clear custom fields on error
    } finally {
      setIsLoading(false);
    }
  }, [deckId]); // Dependency array for useCallback

  // Effect to load deck and cards when deckId changes
  useEffect(() => {
    if (deckId) {
      loadDeckAndCards();
    } else {
      // If no deckId is present, the component behaves as an empty gallery
      setIsLoading(false);
      setCards([]);
      setDeck(null);
      setDeckCustomFields([]);
      setError(null);
    }
  }, [deckId, loadDeckAndCards]);

  const handleDeleteCard = (cardId) => {
    if (!deckId) return;
    const card = cards.find(c => c.id === cardId);
    setCardToDelete(card || { id: cardId });
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      setDeletingId(cardToDelete.id);
      await retryApiCall(() => CardEntity.delete(cardToDelete.id));
      setCardToDelete(null);
      loadDeckAndCards();
    } catch (err) {
      toast.error("Failed to delete card. Please try again.");
      setError("Failed to delete card: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardCreated = () => {
    setCreatingCard(false);
    setEditingCard(null); // Clear editing card if card was edited
    loadDeckAndCards(); // Refresh cards in the gallery
  };

  const handleBuilderComplete = () => {
    setIsBuilderOpen(false);
    loadDeckAndCards(); // Refresh cards after manual build
  };

  const filteredCards = useMemo(() => {
    let currentCards = cards; // Use the 'cards' state

    if (filterText) {
      const lowercasedFilter = filterText.toLowerCase();
      currentCards = currentCards.filter(card =>
        card.name?.toLowerCase().includes(lowercasedFilter) ||
        card.description?.toLowerCase().includes(lowercasedFilter) ||
        card.upright_meaning?.toLowerCase().includes(lowercasedFilter) ||
        card.reversed_meaning?.toLowerCase().includes(lowercasedFilter)
      );
    }
    // Sort cards by the 'number' property, with null/undefined numbers treated as Infinity
    return currentCards.sort((a, b) => (a.number || Infinity) - (b.number || Infinity));
  }, [cards, filterText]);

  // Removed the previous `useMemo` for `deckCustomFields` as it is now managed by `useState`
  // and set directly when the deck is loaded.

  const pageTitle = deck ? deck.name : "Card Gallery";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-indigo-950/20 p-4 md:p-8 text-white flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-indigo-950/20 p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link to={createPageUrl("Dashboard")} className="inline-flex items-center gap-2 text-purple-300 hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-wide">{pageTitle}</h1>
            {deck && <p className="text-purple-200 mt-1">{deck.description}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {deckId && ( // Only show Deck Management if a deck is loaded
              <Link to={createPageUrl("DeckManagement", { id: deckId })}>
                <Button variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Deck & Manuals
                </Button>
              </Link>
            )}
            <Button onClick={() => setCreatingCard(true)} className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 shadow-lg shadow-blue-500/25 transition-all duration-300 text-white border-0">
              <Plus className="w-5 h-5 mr-2" />
              Add New Card
            </Button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder="Search cards by name, description, or meaning..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <Button variant={viewMode === 'grid' ? "default" : "outline"} onClick={() => setViewMode('grid')} className="border-white/20 bg-white/5">
               <LayoutGrid className="w-4 h-4 text-white" />
             </Button>
             <Button variant={viewMode === 'list' ? "default" : "outline"} onClick={() => setViewMode('list')} className="border-white/20 bg-white/5">
               <List className="w-4 h-4 text-white" />
             </Button>
          </div>
          {/* Manual Builder button moved here as it's a card creation tool */}
          <Button variant="outline" onClick={() => setIsBuilderOpen(true)} className="w-full md:w-auto border-purple-500/40 text-purple-300 hover:bg-purple-500/10">
            <Sparkles className="w-4 h-4 mr-2" /> AI Manual Builder
          </Button>
          {/* New Bulk Upload Images Button */}
          <Button variant="outline" onClick={() => setIsImageUploaderOpen(true)} className="w-full md:w-auto border-green-600 text-green-300 hover:bg-green-600/20">
            <FileImage className="w-4 h-4 mr-2" /> Bulk Upload Images
          </Button>
        </div>

        {error && ( // Display error message if an error occurred
          <div className="bg-red-900/50 text-red-300 p-4 rounded-lg mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Error loading content:</p>
              <p>{error}</p>
            </div>
            <Button onClick={loadDeckAndCards} variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-500/10">
              Retry
            </Button>
          </div>
        )}

        {filteredCards.length > 0 ? (
          viewMode === "grid" ? (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {filteredCards.map(card => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="cursor-pointer group"
                  onClick={() => setPreviewCard(card)}
                >
                  <Card className="bg-white/5 border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20">
                    <CardContent className="p-0 aspect-[9/16] relative">
                      <img
                        src={card.image_url || 'https://placehold.co/300x500/000000/FFFFFF/png?text=No+Image'}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-3">
                        <h3 className="font-bold text-white truncate">{card.name}</h3>
                        {card.number && <span className="text-xs text-gray-300">No. {card.number}</span>}
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCard(card); }}
                        className="absolute top-2 right-2 p-1 rounded bg-black/40 hover:bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Edit card"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="flex flex-col gap-4"
              initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {filteredCards.map(card => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card 
                    className="bg-white/5 border-white/10 flex flex-col sm:flex-row p-4 gap-4 items-center cursor-pointer hover:bg-white/10 transition-colors group" 
                    onClick={() => setPreviewCard(card)}
                  >
                    <div className="w-16 h-24 flex-shrink-0 relative overflow-hidden rounded-md border border-white/20">
                      <img src={card.image_url || 'https://placehold.co/300x500/000000/FFFFFF/png?text=No+Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                      <h3 className="font-bold text-white text-lg truncate">{card.name}</h3>
                      {card.number && <p className="text-sm text-purple-300">No. {card.number}</p>}
                      <p className="text-sm text-white/60 line-clamp-2 mt-1 hidden sm:block">
                        {card.overall_meaning || card.upright_meaning || "No description provided."}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingCard(card); }} className="sm:ml-auto">
                      <Pencil className="w-4 h-4 text-white/60 hover:text-white" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">An Empty Canvas</h3>
            <p className="text-blue-200 mb-6 max-w-md mx-auto">
              This deck has no cards yet. Add your first card to begin building your collection.
            </p>
            {!deckId && (
              <p className="text-blue-300">
                You're currently viewing the general card gallery. Select a deck from the dashboard to manage its cards.
              </p>
            )}
          </div>
        )}
      </div>

      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-gray-900 border-purple-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">AI Manual Builder</DialogTitle>
            <Button onClick={() => setIsBuilderOpen(false)} size="icon" variant="ghost" className="absolute top-3 right-3 text-white/70 hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="flex-grow overflow-hidden">
            <AIManualBuilder
              deckId={deckId}
              deck={deck}
              onComplete={handleBuilderComplete}
            />
          </div>
        </DialogContent>
      </Dialog>

      {isImageUploaderOpen && (
        <BulkImageUploader
          cards={cards}
          deckId={deckId}
          onComplete={() => {
            loadDeckAndCards();
            setIsImageUploaderOpen(false);
          }}
          onClose={() => setIsImageUploaderOpen(false)}
        />
      )}

      {/* Quick Preview Modal for card details */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border-purple-800/40">
          <DialogHeader>
            <DialogTitle className="text-2xl">{previewCard?.name || "Card Details"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewCard?.overall_meaning && (
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-1">Overall Meaning</h3>
                <p className="text-white/80">{previewCard.overall_meaning}</p>
              </div>
            )}
            {previewCard?.upright_meaning && (
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-1">Upright</h3>
                <p className="text-white/80">{previewCard.upright_meaning}</p>
              </div>
            )}
            {previewCard?.reversed_meaning && (
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-1">Reversed</h3>
                <p className="text-white/80">{previewCard.reversed_meaning}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCard || creatingCard} onOpenChange={() => { setEditingCard(null); setCreatingCard(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 border-purple-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">{creatingCard ? "Create New Card" : "Edit Card"}</DialogTitle>
            <Button onClick={() => { setEditingCard(null); setCreatingCard(false); }} size="icon" variant="ghost" className="absolute top-3 right-3 text-white/70 hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6 -mr-4">
            <CardEditor
              deckId={deckId}
              card={editingCard}
              onSave={handleCardCreated}
              onClose={() => { setEditingCard(null); setCreatingCard(false); }}
              onDelete={handleDeleteCard}
              deckCustomFields={deckCustomFields} // Now passed from state
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete card confirmation */}
      <AlertDialog
        open={!!cardToDelete}
        onOpenChange={(open) => !open && setCardToDelete(null)}
      >
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete{" "}
              {cardToDelete?.name
                ? <><span className="font-semibold text-white">"{cardToDelete.name}"</span>?</>
                : "this card?"
              }{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCard}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}