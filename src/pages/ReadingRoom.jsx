import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Deck, Reading as ReadingEntity, Card } from "@/entities/all";
import { Play, Clock, Sparkles, ChevronRight, Eye, Combine, Star, Heart, TrendingUp, Users, Wand2, RefreshCw } from "lucide-react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queueApiCall } from "@/components/utils/apiQueue";
import { motion, AnimatePresence } from "framer-motion";
import PullToRefresh from "@/components/common/PullToRefresh";
import { Label } from "@/components/ui/label";
import DidAgentEmbed from "@/components/integrations/DidAgentEmbed";

function DeckCard({ deck, isOwned = false }) {
  return (
    <Link to={createPageUrl(`Reading?deckId=${deck.id}`)} className="group block">
      <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-white/10 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30">
        {deck.cover_image ? (
          <img
            src={deck.cover_image}
            alt={deck.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <Sparkles className="w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 text-white">
              <Play className="w-5 h-5 mr-1" />
              <span className="font-semibold">Read Now</span>
            </div>
          </div>
        </div>

        <div className="absolute top-2 left-2">
          {deck.is_premium && (
            <div className="bg-amber-500 text-xs font-bold px-2 py-1 rounded">PREMIUM</div>
          )}
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = createPageUrl(`DeckGallery?deckId=${deck.id}`); }}
            className="bg-black/70 hover:bg-black/90 backdrop-blur-sm p-2 rounded-lg border border-white/20 transition-all hover:scale-110"
            title="View Gallery"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <h4 className="text-white font-semibold truncate">{deck.name}</h4>
        <p className="text-white/60 text-sm">{deck.category || 'Oracle'}</p>
      </div>
    </Link>
  );
}

function ReadingCard({ reading, deck }) {
  return (
    <Link to={createPageUrl(`History`)} className="group">
      <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-white/10 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30">
        {deck?.cover_image ? (
          <img
            src={deck.cover_image}
            alt={reading.title}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <Clock className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white/70 text-xs mb-1">{new Date(reading.created_date).toLocaleDateString()}</p>
            <h4 className="text-white font-semibold text-sm line-clamp-2">{reading.title}</h4>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ label, icon: Icon, to, gradient }) {
  return (
    <Link to={to} className="group">
      <div className={`relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden ${gradient} border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          <Icon className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-center">{label}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ReadingRoom() {
  const [publicDecks, setPublicDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      let user = null;
      try {
        user = await queueApiCall(() => User.me());
        setCurrentUser(user);
      } catch (e) {
        console.log("No current user logged in");
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const allDecks = await queueApiCall(() => Deck.list("-created_date", 200));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const readings = await queueApiCall(() => ReadingEntity.list("-created_date", 10));

      const publicDecksList = (allDecks || []).filter(d => d.is_public && d.publish_status === "published");
      const myDecksList = user 
        ? (allDecks || []).filter(d => 
            d.created_by && 
            d.created_by.toLowerCase() === user.email?.toLowerCase() &&
            (d.publish_status === "published" || !d.publish_status)
          )
        : [];

      setPublicDecks(publicDecksList);
      setMyDecks(myDecksList);
      setRecentReadings(readings || []);
      
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <div className="text-white">Loading reading room...</div>
        </div>
      </div>
    );
  }

  const allAvailableDecks = [...publicDecks, ...myDecks];
  const searchParams = new URLSearchParams(window.location.search);
  const showAllOfficial = searchParams.get('all') === '1';

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white">

      {/* Hero Section */}
      <div className="relative h-[50vh] mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/700bd7a34_0DC18799-794E-447B-AD87-0A5B20D22CE5.png"
            alt="Hero"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            🔮 Reading Room
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-6 max-w-2xl">
            Explore mystical decks and receive cosmic guidance
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link to={createPageUrl("Reading")}>
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold">
                <Play className="w-5 h-5 mr-2" />
                Full Reading
              </Button>
            </Link>
            <Link to={createPageUrl("Help")}> 
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 force-white">
                Learn More
              </Button>
            </Link>
            <Link to={createPageUrl("History")}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Clock className="w-5 h-5 mr-2" />
                View History
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Quick Start
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <QuickAction
            label="Fusion Reading"
            icon={Combine}
            to={createPageUrl("FusionReading")}
            gradient="bg-gradient-to-br from-pink-600 to-purple-600"
          />
          <QuickAction
            label="Zodiac Reading"
            icon={Star}
            to={createPageUrl("ZodiacReading")}
            gradient="bg-gradient-to-br from-indigo-600 to-blue-600"
          />
          <QuickAction
            label="Rebel 8-Ball"
            icon={Heart}
            to={createPageUrl("Rebel8Ball")}
            gradient="bg-gradient-to-br from-red-600 to-pink-600"
          />
          <QuickAction
            label="Explore Creators"
            icon={Users}
            to={createPageUrl("Explore")}
            gradient="bg-gradient-to-br from-cyan-600 to-teal-600"
          />
        </div>
      </div>

      {/* Official Decks */}
      {publicDecks.length > 0 && (
        <div className="px-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              Official Decks ({publicDecks.length})
            </h2>
            <Link to={createPageUrl("ReadingRoom?all=1")} className="text-white underline decoration-white/50 hover:decoration-white flex items-center gap-1 text-sm">
              View All Decks <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {(showAllOfficial ? publicDecks : publicDecks.slice(0, 12)).map(deck => (
              <DeckCard key={deck.id} deck={deck} isOwned={false} />
            ))}
          </div>
        </div>
      )}

      {/* My Decks */}
      {myDecks.length > 0 && (
        <div className="px-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Decks ({myDecks.length})</h2>
            <Link to={createPageUrl("Studio")} className="text-white underline decoration-white/50 hover:decoration-white flex items-center gap-1 text-sm">
              Manage in Studio <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {myDecks.map(deck => (
              <DeckCard key={deck.id} deck={deck} isOwned={true} />
            ))}
          </div>
        </div>
      )}


      {/* Recent Readings */}
      {recentReadings.length > 0 && (
        <div className="px-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-400" />
              Continue Your Journey
            </h2>
            <Link to={createPageUrl("History")} className="text-white underline decoration-white/50 hover:decoration-white flex items-center gap-1 text-sm">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {recentReadings.slice(0, 8).map(reading => (
              <ReadingCard
                key={reading.id}
                reading={reading}
                deck={publicDecks.find(d => d.id === reading.deck_id) || myDecks.find(d => d.id === reading.deck_id)}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
          </div>
          </PullToRefresh>
          );
          }