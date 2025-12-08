
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DeckCard from './DeckCard';
import { deckDisplayName } from "@/components/utils/nameAliases";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Eye, Settings } from "lucide-react";

export default function DeckCarousel({ title, decks, onDelete, onAnalyze, disabled }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!decks || decks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-12">
      <h2 className="text-2xl font-bold text-white ml-4 md:ml-0">{title}</h2>
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex flex-nowrap overflow-x-auto gap-4 p-4 scrollbar-hide"
        >
          {decks.map((deck, index) => {
            const deckForDisplay = { ...deck, name: deckDisplayName(deck.name) };
            const isDraftLike = !deckForDisplay.is_public && deckForDisplay.card_count === 0;
            const isOfficial = !!deckForDisplay.is_public;

            return (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-40 sm:w-48 md:w-56 lg:w-64 relative"
              >
                {/* Official/read-only badge for clarity */}
                {isOfficial && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-black border border-amber-200 shadow">
                    Official – Read-only
                  </div>
                )}

                {/* Eye overlay for quick gallery */}
                <Link
                  to={createPageUrl(`DeckGallery?deckId=${deck.id}`)}
                  className="absolute right-2 top-2 z-20"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="View deck gallery"
                    title="View deck gallery"
                    disabled={disabled}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white shadow-md disabled:opacity-50 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </Link>

                {/* Gear overlay for deck controls */}
                <Link
                  to={createPageUrl(`DeckView?deckId=${deck.id}&tab=controllers`)}
                  className="absolute left-2 top-2 z-20"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Deck controls"
                    title="Deck controls"
                    disabled={disabled}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white shadow-md disabled:opacity-50 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </Link>

                {/* NEW: Continue overlay for in-progress decks (0 cards) */}
                {isDraftLike && (
                  <Link
                    to={createPageUrl(`DeckView?deckId=${deck.id}&tab=controllers`)}
                    className="absolute bottom-2 right-2 z-20"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label="Continue editing this deck"
                      title="Continue editing this deck"
                      disabled={disabled}
                      className="px-3 py-1 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold shadow pointer-events-auto disabled:opacity-50"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      Continue
                    </button>
                  </Link>
                )}

                <DeckCard
                  deck={deckForDisplay}
                  onDelete={onDelete}
                  onAnalyze={onAnalyze}
                  disabled={disabled}
                />
              </motion.div>
            );
          })}
        </div>
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-2 rounded-full opacity-70 transition-opacity duration-300 hover:bg-black/80 disabled:opacity-0 md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-2 rounded-full opacity-70 transition-opacity duration-300 hover:bg-black/80 disabled:opacity-0 md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
