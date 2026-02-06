import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Deck } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  User as UserIcon, 
  Layers,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import PullToRefresh from "@/components/common/PullToRefresh";

export default function ExplorePage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    setLoading(true);
    setError("");
    try {
      // Get ALL decks first (we'll filter in JS for complex conditions)
      const allDecks = await Deck.list("-created_date", 500);
      
      // Filter for public AND published decks
      const publicDecks = allDecks.filter(deck => 
        deck.is_public === true && 
        deck.publish_status === "published"
      );

      console.log(`📊 Found ${publicDecks.length} published public decks from ${allDecks.length} total decks`);
      
      // Group by creator email
      const creatorMap = new Map();
      publicDecks.forEach(deck => {
        const email = deck.created_by?.toLowerCase();
        if (!email) return;
        
        if (!creatorMap.has(email)) {
          creatorMap.set(email, {
            email: deck.created_by,
            decks: [],
            totalCards: 0,
            categories: new Set(),
          });
        }
        
        const creator = creatorMap.get(email);
        creator.decks.push(deck);
        if (deck.category) creator.categories.add(deck.category);
      });

      console.log(`👥 Found ${creatorMap.size} creators with published decks`);

      // Convert to array and sort by deck count
      const creatorsList = Array.from(creatorMap.values())
        .map(creator => ({
          ...creator,
          deckCount: creator.decks.length,
          categories: Array.from(creator.categories),
          latestDeck: creator.decks[0], // Most recent deck
          featuredDeck: creator.decks.find(d => d.cover_image) || creator.decks[0],
        }))
        .sort((a, b) => b.deckCount - a.deckCount);

      setCreators(creatorsList);
    } catch (e) {
      console.error("Failed to load creators:", e);
      setError("Failed to load creators. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = creators.filter(creator => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      creator.email?.toLowerCase().includes(search) ||
      creator.decks.some(d => d.name?.toLowerCase().includes(search)) ||
      creator.categories.some(c => c.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Discovering creators...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadCreators}>
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">
            Explore Deck Creators
          </h1>
          <p className="text-xl text-white/80">
            Discover amazing oracle and tarot decks from our community
          </p>
        </motion.div>

        {/* Search */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by creator, deck name, or category..."
              className="bg-black/40 border-purple-500/30 text-white pl-12 py-6 text-lg"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4 text-red-200 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          <Card className="bg-purple-900/20 border-purple-500/30">
            <CardContent className="pt-6 text-center">
              <UserIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{creators.length}</div>
              <div className="text-sm text-white/60">Creators</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="pt-6 text-center">
              <Layers className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">
                {creators.reduce((sum, c) => sum + c.deckCount, 0)}
              </div>
              <div className="text-sm text-white/60">Public Decks</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">
                {new Set(creators.flatMap(c => c.categories)).size}
              </div>
              <div className="text-sm text-white/60">Categories</div>
            </CardContent>
          </Card>
        </div>

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <p className="text-lg mb-2">No creators found</p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator, index) => (
              <motion.div
                key={creator.email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl(`UserProfile?email=${encodeURIComponent(creator.email)}`)}>
                  <Card className="bg-slate-900/60 border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-105 cursor-pointer h-full">
                    <CardHeader>
                      {/* Featured Deck Cover */}
                      {creator.featuredDeck?.cover_image ? (
                        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden border border-white/20">
                          <img
                            src={creator.featuredDeck.cover_image}
                            alt={creator.featuredDeck.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/20 flex items-center justify-center">
                          <Layers className="w-16 h-16 text-white/40" />
                        </div>
                      )}

                      {/* Creator Info */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {creator.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white text-lg truncate">
                            {creator.email.split('@')[0]}
                          </CardTitle>
                          <CardDescription className="text-white/60 text-xs truncate">
                            {creator.email}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-purple-300">
                          <Layers className="w-4 h-4" />
                          <span className="font-semibold">{creator.deckCount}</span>
                          <span className="text-white/60">deck{creator.deckCount !== 1 ? 's' : ''}</span>
                        </div>
                        {creator.deckCount > 5 && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Top Creator
                          </Badge>
                        )}
                      </div>

                      {/* Categories */}
                      {creator.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {creator.categories.slice(0, 3).map(cat => (
                            <Badge
                              key={cat}
                              className="bg-purple-500/20 text-purple-200 text-xs"
                            >
                              {cat}
                            </Badge>
                          ))}
                          {creator.categories.length > 3 && (
                            <Badge className="bg-white/10 text-white/60 text-xs">
                              +{creator.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Latest Deck */}
                      {creator.latestDeck && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-white/50 mb-1">Latest:</div>
                          <div className="text-sm text-white font-semibold truncate">
                            {creator.latestDeck.name}
                          </div>
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}