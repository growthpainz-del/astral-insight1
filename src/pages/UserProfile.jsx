import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Loader2, 
  ArrowLeft, 
  Layers,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import DeckCard from "@/components/deck/DeckCard";

export default function UserProfilePage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userEmail = searchParams.get("email");

  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    categories: [],
    newestDeck: null,
    oldestDeck: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userEmail) {
      loadUserProfile();
    } else {
      setError("No user specified");
      setLoading(false);
    }
  }, [userEmail]);

  const loadUserProfile = async () => {
    setLoading(true);
    setError("");
    try {
      // Load all decks (filter client-side for complex conditions)
      const allUserDecks = await base44.entities.Deck.list("-created_date", 200);
      
      // Filter for this user's public AND published decks
      const userDecks = allUserDecks.filter(deck => 
        deck.created_by?.toLowerCase() === userEmail?.toLowerCase() &&
        deck.is_public === true &&
        deck.publish_status === "published"
      );

      console.log(`📊 Found ${userDecks.length} published decks for ${userEmail}`);

      setDecks(userDecks || []);

      // Calculate stats
      if (userDecks && userDecks.length > 0) {
        // Count cards in each deck
        const cardCounts = await Promise.all(
          userDecks.map(deck => 
            base44.entities.Card.filter({ deck_id: deck.id })
              .then(cards => cards?.length || 0)
              .catch(() => 0)
          )
        );

        const totalCards = cardCounts.reduce((sum, count) => sum + count, 0);
        const categories = [...new Set(userDecks.map(d => d.category).filter(Boolean))];

        setStats({
          totalDecks: userDecks.length,
          totalCards,
          categories,
          newestDeck: userDecks[0],
          oldestDeck: userDecks[userDecks.length - 1],
        });
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
      setError("Failed to load user profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userEmail) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-6 text-red-200 text-center">
            <p className="text-lg mb-4">{error || "Invalid user profile"}</p>
            <Link to={createPageUrl("Explore")}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explore
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const username = userEmail.split('@')[0];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("Explore")} className="inline-block mb-6">
          <Button variant="ghost" className="text-purple-300 hover:text-white hover:bg-purple-900/30">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Button>
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-slate-900/60 border-purple-500/30">
            <CardHeader>
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">
                  {username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{username}</h1>
                  <p className="text-white/60 mb-4">{userEmail}</p>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-purple-900/30 px-4 py-2 rounded-lg">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-semibold">{stats.totalDecks}</span>
                      <span className="text-white/60">Public Deck{stats.totalDecks !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-900/30 px-4 py-2 rounded-lg">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-semibold">{stats.totalCards}</span>
                      <span className="text-white/60">Total Cards</span>
                    </div>

                    {stats.newestDeck && (
                      <div className="flex items-center gap-2 bg-amber-900/30 px-4 py-2 rounded-lg">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span className="text-white/60">Joined:</span>
                        <span className="text-white font-semibold">
                          {new Date(stats.oldestDeck.created_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  {stats.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="text-white/60 text-sm">Specializes in:</span>
                      {stats.categories.map(cat => (
                        <Badge
                          key={cat}
                          className="bg-purple-500/20 text-purple-200"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Decks Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            Public Decks ({decks.length})
          </h2>
        </div>

        {decks.length === 0 ? (
          <Card className="bg-slate-900/40 border-white/10">
            <CardContent className="py-12 text-center text-white/60">
              <Layers className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p>This creator hasn't published any public decks yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck, index) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DeckCard deck={deck} showAuthor={false} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {decks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Love {username}'s decks?
                </h3>
                <p className="text-white/70 mb-6">
                  Create your own oracle deck and share it with the community!
                </p>
                <Link to={createPageUrl("CreateDeck")}>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Your Deck
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}