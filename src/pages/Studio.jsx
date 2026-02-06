import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Deck } from "@/entities/all";
import { 
  Plus, 
  Settings, 
  Clock, 
  Eye, 
  Palette,
  FileJson,
  Image as ImageIcon,
  Layers,
  Upload,
  Wand2,
  Send
} from "lucide-react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queueApiCall } from "@/components/utils/apiQueue";
import PullToRefresh from "@/components/common/PullToRefresh";

function DeckCard({ deck }) {
  const getStatusColor = () => {
    switch (deck.publish_status) {
      case "published": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "pending_review": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "rejected": return "bg-red-500/20 text-red-300 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusLabel = () => {
    switch (deck.publish_status) {
      case "published": return deck.is_public ? "Public" : "Personal";
      case "pending_review": return "Pending Review";
      case "rejected": return "Rejected";
      default: return "Draft";
    }
  };

  return (
    <div className="group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-purple-400/40 transition-all">
      {/* Cover Image */}
      <div className="relative aspect-[2/3] bg-gradient-to-br from-purple-900/40 to-slate-900/40">
        {deck.cover_image ? (
          <img
            src={deck.cover_image}
            alt={deck.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <Palette className="w-12 h-12" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={getStatusColor()}>
            {getStatusLabel()}
          </Badge>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link to={createPageUrl(`DeckView?id=${deck.id}`)}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link to={createPageUrl(`DeckGallery?deckId=${deck.id}`)}>
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Eye className="w-4 h-4 mr-2" />
              Gallery
            </Button>
          </Link>
        </div>
      </div>

      {/* Deck Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1 truncate">{deck.name}</h3>
        <p className="text-white/60 text-sm mb-3">{deck.category || 'Oracle'}</p>
        
        <div className="flex gap-2">
          <Link to={createPageUrl(`DeckView?id=${deck.id}`)} className="flex-1">
            <Button size="sm" variant="outline" className="w-full border-purple-400/40 text-purple-300 hover:bg-purple-500/10">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ title, description, icon: Icon, to, color = "purple" }) {
  const gradients = {
    purple: "from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30",
    pink: "from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30",
    blue: "from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30",
    green: "from-green-600/20 to-teal-600/20 hover:from-green-600/30 hover:to-teal-600/30",
  };

  return (
    <Link to={to}>
      <div className={`group bg-gradient-to-br ${gradients[color]} backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 p-6 transition-all duration-300 hover:scale-105 cursor-pointer`}>
        <Icon className="w-8 h-8 text-white/80 mb-3 group-hover:scale-110 transition-transform" />
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    </Link>
  );
}

export default function Studio() {
  const [publishedDecks, setPublishedDecks] = useState([]);
  const [draftDecks, setDraftDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);

      let user = null;
      try {
        user = await queueApiCall(() => User.me());
        setCurrentUser(user);
      } catch (e) {
        console.log("No current user logged in");
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const allDecks = await queueApiCall(() => Deck.list("-created_date", 200));
      
      const myPublished = (allDecks || []).filter(d => 
        d.created_by && 
        d.created_by.toLowerCase() === user.email?.toLowerCase() &&
        (d.publish_status === "published" || !d.publish_status)
      );

      const myDrafts = (allDecks || []).filter(d =>
        d.created_by &&
        d.created_by.toLowerCase() === user.email?.toLowerCase() &&
        (d.publish_status === "draft" || d.publish_status === "pending_review" || d.publish_status === "rejected")
      );

      setPublishedDecks(myPublished);
      setDraftDecks(myDrafts);
      
    } catch (error) {
      console.error("Error loading studio data:", error);
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
          <Palette className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <div className="text-white">Loading studio...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Palette className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-white/70 mb-6">Please log in to access Creator Studio</p>
          <Button onClick={() => User.login()} className="bg-purple-600 hover:bg-purple-700">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  const totalDecks = publishedDecks.length + draftDecks.length;

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-b border-purple-800/40 p-8 md:p-12 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                🎨 Creator Studio
              </h1>
              <p className="text-xl text-purple-200">
                Build, design, and publish your oracle decks
              </p>
            </div>
            <Link to={createPageUrl("CreateDeck")}>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 font-bold">
                <Plus className="w-5 h-5 mr-2" />
                New Deck
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-white">{totalDecks}</div>
              <div className="text-sm text-white/60">Total Decks</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-green-400">{publishedDecks.length}</div>
              <div className="text-sm text-white/60">Published</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-amber-400">{draftDecks.length}</div>
              <div className="text-sm text-white/60">In Progress</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-3xl font-bold text-purple-400">{publishedDecks.filter(d => d.is_public).length}</div>
              <div className="text-sm text-white/60">Public</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {/* Drafts & In Progress */}
        {draftDecks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold">In Progress ({draftDecks.length})</h2>
            </div>
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
                {draftDecks.map(deck => (
                  <div key={deck.id} className="snap-start min-w-[180px] sm:min-w-[220px] md:min-w-[240px]">
                    <DeckCard deck={deck} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Published Decks */}
        {publishedDecks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">My Published Decks ({publishedDecks.length})</h2>
            </div>
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
                {publishedDecks.map(deck => (
                  <div key={deck.id} className="snap-start min-w-[180px] sm:min-w-[220px] md:min-w-[240px]">
                    <DeckCard deck={deck} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Decks State */}
        {totalDecks === 0 && (
          <div className="text-center py-16">
            <Palette className="w-20 h-20 text-purple-400/40 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3">No decks yet</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Start your creative journey by building your first oracle deck
            </p>
            <Link to={createPageUrl("CreateDeck")}>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Deck
              </Button>
            </Link>
          </div>
        )}

        {/* Tools & Resources */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Tools & Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ToolCard
              title="Spread Designer"
              description="Create custom card layouts for readings"
              icon={Layers}
              to={createPageUrl("SpreadManager")}
              color="purple"
            />
            <ToolCard
              title="Photo Uploader"
              description="Manage and organize card images"
              icon={ImageIcon}
              to={createPageUrl("PhotoUploader")}
              color="pink"
            />
            <ToolCard
              title="Bulk Import"
              description="Import decks from JSON files"
              icon={FileJson}
              to={createPageUrl("CreateDeck")}
              color="blue"
            />
            <ToolCard
              title="AI Image Generator"
              description="Create card art with AI assistance"
              icon={Wand2}
              to={createPageUrl("CreateDeck")}
              color="pink"
            />
            <ToolCard
              title="Publishing Guide"
              description="Learn how to publish your deck"
              icon={Send}
              to={createPageUrl("Help")}
              color="green"
            />
            <ToolCard
              title="Import Guide"
              description="Step-by-step deck building tutorials"
              icon={Upload}
              to={createPageUrl("Help")}
              color="blue"
            />
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}