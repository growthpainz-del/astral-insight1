
import React, { useState, useEffect, useCallback } from "react";
import { Card as CardEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, AlertTriangle, Trash2, CheckCircle, Sparkles, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Levenshtein distance function to find similarity between strings
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
  for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  return matrix[b.length][a.length];
};

// New helper function to normalize names
const normalizeCardName = (name) => {
  let normalized = name.toLowerCase().trim();
  if (normalized.startsWith('the ')) {
    normalized = normalized.substring(4);
  }
  return normalized;
};


export default function DuplicateCardScanner({ isOpen, onClose, deckCards }) {
  const [isScanning, setIsScanning] = useState(true);
  const [exactDuplicateGroups, setExactDuplicateGroups] = useState([]);
  const [suggestedDuplicates, setSuggestedDuplicates] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const scanForDuplicates = useCallback(() => {
    setIsScanning(true);
    setExactDuplicateGroups([]);
    setSuggestedDuplicates([]);

    if (deckCards.length < 2) {
      setIsScanning(false);
      return;
    }

    // 1. Find EXACT duplicates using the new normalization
    const nameGroups = deckCards.reduce((acc, card) => {
      const normalizedName = normalizeCardName(card.name);
      if (!acc.has(normalizedName)) {
        acc.set(normalizedName, []);
      }
      acc.get(normalizedName).push(card);
      return acc;
    }, new Map());

    const foundExactDuplicates = [];
    const uniqueCards = [];
    const processedForFuzzy = new Set();

    for (const group of nameGroups.values()) {
      if (group.length > 1) {
        foundExactDuplicates.push(group);
        group.forEach(card => processedForFuzzy.add(card.id));
      } else {
        uniqueCards.push(group[0]);
      }
    }
    
    setExactDuplicateGroups(foundExactDuplicates);

    // 2. Find SUGGESTED duplicates (fuzzy match)
    const foundSuggested = [];
    for (let i = 0; i < uniqueCards.length; i++) {
      for (let j = i + 1; j < uniqueCards.length; j++) {
        const cardA = uniqueCards[i];
        const cardB = uniqueCards[j];

        if (processedForFuzzy.has(cardA.id) || processedForFuzzy.has(cardB.id)) {
            continue;
        }

        const distance = levenshteinDistance(normalizeCardName(cardA.name), normalizeCardName(cardB.name));
        
        // Threshold: distance of 1 or 2 suggests a typo for reasonably long names
        if (distance > 0 && distance <= 2 && Math.max(cardA.name.length, cardB.name.length) > 4) {
          foundSuggested.push([cardA, cardB]);
          // Mark both cards as processed to avoid re-matching them in other suggested groups
          // This also helps prevent suggesting A-B, then B-C, when A-C might also be a good match.
          // For suggested, we might want to allow a card to be part of multiple suggestions if relevant,
          // but for now, we'll keep it simple to avoid overwhelming the user.
          processedForFuzzy.add(cardA.id);
          processedForFuzzy.add(cardB.id);
        }
      }
    }

    setSuggestedDuplicates(foundSuggested);
    setIsScanning(false);
  }, [deckCards]);

  useEffect(() => {
    if (isOpen) {
      // Delay scan slightly to allow for dialog animation
      const timer = setTimeout(() => scanForDuplicates(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scanForDuplicates]);

  const handleDelete = async (cardId) => {
    setDeletingId(cardId);
    try {
      await CardEntity.delete(cardId);
      // After successful deletion, update the state locally
      const newExactGroups = exactDuplicateGroups.map(group => 
        group.filter(card => card.id !== cardId)
      ).filter(group => group.length > 1); // Keep groups with more than one card after deletion
      
      const newSuggestedGroups = suggestedDuplicates.map(group =>
        group.filter(card => card.id !== cardId)
      ).filter(group => group.length > 1); // Keep groups with more than one card after deletion

      setExactDuplicateGroups(newExactGroups);
      setSuggestedDuplicates(newSuggestedGroups);

    } catch (error) {
      console.error("Error deleting duplicate card:", error);
      alert("Failed to delete the card. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <RefreshCcw className="w-6 h-6 text-amber-400" />
            Duplicate Card Scanner
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Review and remove any duplicate or similarly-named cards found in your deck.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {isScanning ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
              <p className="mt-4 text-white">Scanning for duplicates...</p>
            </div>
          ) : exactDuplicateGroups.length === 0 && suggestedDuplicates.length === 0 ? (
            <div className="text-center py-16 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <p className="mt-4 text-xl font-semibold text-white">No Duplicates Found!</p>
              <p className="text-green-200">Your deck is clean.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Exact Duplicates Section */}
              {exactDuplicateGroups.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-200 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Exact Duplicates Found ({exactDuplicateGroups.length})
                  </h3>
                  <AnimatePresence>
                    {exactDuplicateGroups.map((group) => (
                      <motion.div
                        key={group[0].name}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/5 p-4 rounded-lg border border-white/10 mt-3"
                      >
                        <h3 className="font-bold text-lg text-white mb-3">
                          Card: "{group[0].name}" <Badge variant="destructive">{group.length} found</Badge>
                        </h3>
                        <div className="space-y-2">
                          {group.map((card) => (
                            <div key={card.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md hover:bg-white/10">
                              <div className="flex items-center gap-3">
                                {card.image_url ? (
                                  <img src={card.image_url} alt={card.name} className="w-8 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-8 h-12 bg-purple-600/30 rounded flex items-center justify-center text-white/50 text-xs">Art</div>
                                )}
                                <div>
                                   <p className="text-sm text-purple-200">ID: {card.id}</p>
                                   <p className="text-xs text-purple-300">Created: {new Date(card.created_date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(card.id)}
                                disabled={deletingId === card.id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deletingId === card.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Suggested Duplicates Section */}
              {suggestedDuplicates.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-200 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Suggested Duplicates / Typos ({suggestedDuplicates.length})
                  </h3>
                   <AnimatePresence>
                    {suggestedDuplicates.map((group, index) => (
                      <motion.div
                        key={index}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/5 p-4 rounded-lg border border-white/10 mt-3"
                      >
                         <h3 className="font-bold text-lg text-white mb-3">
                          Potential Typo:
                        </h3>
                        <div className="space-y-2">
                          {group.map((card) => (
                            <div key={card.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md hover:bg-white/10">
                              <div className="flex items-center gap-3">
                                {card.image_url ? (
                                  <img src={card.image_url} alt={card.name} className="w-8 h-12 object-cover rounded" />
                                ) : (
                                  <div className="w-8 h-12 bg-purple-600/30 rounded flex items-center justify-center text-white/50 text-xs">Art</div>
                                )}
                                <div>
                                   <p className="text-sm text-purple-200 font-semibold">{card.name}</p>
                                   <p className="text-xs text-purple-300">ID: {card.id}</p>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(card.id)}
                                disabled={deletingId === card.id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deletingId === card.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-purple-200 hover:bg-white/10"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
