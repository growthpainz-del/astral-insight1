import React, { useState, useEffect } from "react";
import { Card as CardEntity } from "@/entities/Card";
import { Deck } from "@/entities/Deck"; // ADDED: Import Deck entity
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Plus, Search, Grid3x3, List, Upload, Eye, Pencil, Trash2, ChevronDown } from "lucide-react";
import CardEditor from "@/components/deck/CardEditor";
import { safeUploadFile } from "@/components/utils/safeUpload";
import { queueApiCall } from "@/components/utils/apiQueue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CardManager({ deckId, cards: initialCards, onUpdate }) {
  const [cards, setCards] = useState(initialCards || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [editingCard, setEditingCard] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deck, setDeck] = useState(null); // NEW: Track deck info
  
  const [dragOverCardId, setDragOverCardId] = useState(null);
  const [uploadingCardIds, setUploadingCardIds] = useState(new Set());

  useEffect(() => {
    setCards(initialCards || []);
  }, [initialCards]);

  // Load deck info
  useEffect(() => {
    if (!deckId) return;
    // CHANGED: Use Deck.get instead of CardEntity.get
    Deck.get(deckId).then(setDeck).catch(console.error);
  }, [deckId]);

  const filteredCards = cards.filter(card => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      card.name?.toLowerCase().includes(search) ||
      card.number?.toString().includes(search)
    );
  });

  const handleCardClick = (card) => {
    setEditingCard(card);
    setShowEditor(true);
  };

  const handleCardSaved = async (updatedCard) => {
    const newCards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    setCards(newCards);
    setShowEditor(false);
    setEditingCard(null);
    if (onUpdate) onUpdate(newCards);
  };

  const handleCardDragEnter = (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(cardId);
  };

  const handleCardDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCardDragLeave = (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCardId(null);
    }
  };

  const handleCardDrop = async (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(null);

    // NEW: Check if it's an internal drag (from PhotoLibraryPicker)
    const imageUrl = e.dataTransfer.getData("application/x-image-url") || e.dataTransfer.getData("text/plain");
    
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    // Internal drag - image URL from library (optimistic)
    console.log(`🎯 Assigning library image to card "${card.name}"`);
    setUploadingCardIds(prev => new Set(prev).add(card.id));
    const prevCards = cards;
    const optimistic = cards.map(c => c.id === card.id ? { ...c, image_url: imageUrl } : c);
    setCards(optimistic);
    if (onUpdate) onUpdate(optimistic);

    try {
      await queueApiCall(
        () => CardEntity.update(card.id, { image_url: imageUrl }),
        5,
        2000
      );
      console.log(`✅ Library image assigned to card "${card.name}"`);
    } catch (error) {
      console.error("Failed to assign image:", error);
      alert(`Failed to assign image: ${error.message || 'Unknown error'}`);
      setCards(prevCards);
      if (onUpdate) onUpdate(prevCards);
    } finally {
      setUploadingCardIds(prev => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
    return;
    }

    // External drag - file from desktop
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));

    if (!imageFile) {
      alert("Please drop an image file or drag from the Photo Library");
      return;
    }

    setUploadingCardIds(prev => new Set(prev).add(card.id));

    try {
      const fileUrl = await safeUploadFile(imageFile);
      
      const prevCards = cards;
      const optimistic = cards.map(c => c.id === card.id ? { ...c, image_url: fileUrl } : c);
      setCards(optimistic);
      if (onUpdate) onUpdate(optimistic);

      await queueApiCall(
        () => CardEntity.update(card.id, { image_url: fileUrl }),
        5,
        2000
      );
      console.log(`✅ Dropped image on card "${card.name}"`);
    } catch (error) {
      console.error("Failed to upload and assign image:", error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
      // Revert optimistic change
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, image_url: card.image_url } : c));
      if (onUpdate) onUpdate(cards);
    } finally {
      setUploadingCardIds(prev => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cards by name or number..."
            className="pl-10 bg-black/40 border-white/20 text-white"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-purple-600" : "border-white/20 text-white"}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-purple-600" : "border-white/20 text-white"}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4" />
          <span className="font-semibold">💡 Drag & Drop Images</span>
        </div>
        <p className="text-xs text-blue-200/80">
          • Drag from <strong>Photo Library</strong> (open via Edit button) directly onto cards<br/>
          • Or drag image files from your desktop onto any card
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 pr-4">
            {filteredCards.map((card) => {
              const isDraggingOver = dragOverCardId === card.id;
              const isUploading = uploadingCardIds.has(card.id);
              
              return (
                <div
                  key={card.id}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    isDraggingOver 
                      ? 'border-purple-500 bg-purple-500/20 scale-105 shadow-xl shadow-purple-500/50' 
                      : 'border-white/10 hover:border-purple-400/50'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={(e) => handleCardDragEnter(e, card.id)}
                  onDragOver={handleCardDragOver}
                  onDragLeave={(e) => handleCardDragLeave(e, card.id)}
                  onDrop={(e) => handleCardDrop(e, card)}
                >
                  <div 
                    className={`${deck?.name?.toLowerCase().includes('lie detector') ? 'aspect-[1/1]' : 'aspect-[2/3]'} bg-black/40 relative cursor-pointer`}
                    onClick={() => handleCardClick(card)}
                  >
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs">Drop image here</span>
                      </div>
                    )}
                    
                    {isDraggingOver && (
                      <div className="absolute inset-0 bg-purple-500/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-white">
                          <Upload className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                          <div className="text-sm font-bold">Drop to assign</div>
                        </div>
                      </div>
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                          <div className="text-sm">Uploading...</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-black/70 hover:bg-black/90 h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronDown className="w-4 h-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-purple-500/40">
                          <DropdownMenuItem onClick={() => handleCardClick(card)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {card.image_url && (
                            <DropdownMenuItem onClick={() => window.open(card.image_url, '_blank')}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Full
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-black/40">
                    <div className="flex items-center gap-2">
                      {card.number != null && (
                        <span className="text-xs text-purple-300 font-bold">#{card.number}</span>
                      )}
                      <span className="text-sm text-white truncate flex-1">{card.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 pr-4">
            {filteredCards.map((card) => {
              const isDraggingOver = dragOverCardId === card.id;
              const isUploading = uploadingCardIds.has(card.id);
              
              return (
                <div
                  key={card.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isDraggingOver 
                      ? 'border-purple-500 bg-purple-500/20 scale-[1.02]' 
                      : 'border-white/10 hover:border-purple-400/50'
                  } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={(e) => handleCardDragEnter(e, card.id)}
                  onDragOver={handleCardDragOver}
                  onDragLeave={(e) => handleCardDragLeave(e, card.id)}
                  onDrop={(e) => handleCardDrop(e, card)}
                >
                  <div className="w-16 h-24 rounded overflow-hidden bg-black/40 flex-shrink-0 relative">
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {card.number != null && (
                        <span className="text-sm text-purple-300 font-bold">#{card.number}</span>
                      )}
                      <span className="text-white font-medium truncate">{card.name}</span>
                    </div>
                    {isDraggingOver && (
                      <div className="text-xs text-purple-300 mt-1 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Drop image to assign
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCardClick(card)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {showEditor && editingCard && (
        <CardEditor
          card={editingCard}
          deckId={deckId}
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditingCard(null);
          }}
          onSave={handleCardSaved}
        />
      )}
    </div>
  );
}