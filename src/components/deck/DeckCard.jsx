import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import PremiumBadge from "@/components/pricing/PremiumBadge";

export default function DeckCard({ deck, index, currentUser, isPremiumUser, onClick }) {
  const isOwner = deck.created_by && currentUser?.email && 
    deck.created_by.toLowerCase() === currentUser.email.toLowerCase();
  
  const canAccess = !deck.is_premium || isPremiumUser || isOwner;
  
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(deck);
    }
  };

  // FIXED: Use full Reading page with deckId parameter
  const readingUrl = createPageUrl("Reading") + `?deckId=${deck.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        to={canAccess ? readingUrl : "#"}
        onClick={handleClick}
        className={canAccess ? "" : "pointer-events-none"}
      >
        <div className={`group relative bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden 
          ${canAccess ? 'hover:bg-white/20 hover:scale-[1.02]' : 'opacity-60'} 
          transition-all duration-300 border border-purple-500/20 h-full flex flex-col`}>
          
          {deck.cover_image && (
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
              <img
                src={deck.cover_image}
                alt={deck.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {!canAccess && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Lock className="w-12 h-12 text-white/80" />
                </div>
              )}
            </div>
          )}

          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors flex-1">
                {deck.name}
              </h3>
              {deck.is_premium && <PremiumBadge />}
            </div>

            {deck.description && (
              <p className="text-purple-200 text-sm mb-4 line-clamp-2 flex-1">
                {deck.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-auto">
              {deck.category && (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                  {deck.category}
                </Badge>
              )}
              {deck.is_public && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                  Public
                </Badge>
              )}
              {isOwner && (
                <Badge variant="outline" className="bg-green-500/20 text-green-200 border-green-500/30">
                  My Deck
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}