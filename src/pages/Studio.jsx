import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { queueApiCall } from "@/components/utils/apiQueue";
import PullToRefresh from "@/components/common/PullToRefresh";
import {
  Plus,
  Palette,
  FileJson,
  Image as ImageIcon,
  Layers,
  Upload,
  Wand2,
  Send,
  ChevronRight,
  Settings,
  Eye,
  Clock,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS = [
  { id: "my-decks",  icon: "🎴", label: "My Decks",        sub: "Browse and manage all your decks",       color: "#a78bfa", to: null         },
  { id: "create",    icon: "✨", label: "Create Deck",      sub: "Start a new oracle or tarot deck",       color: "#67e8f9", to: "CreateDeck" },
  { id: "spreads",   icon: "🃏", label: "Spread Designer",  sub: "Build custom card layouts",              color: "#c9a84c", to: "SpreadManager" },
  { id: "tester",    icon: "🎲", label: "Spread Tester",    sub: "Test your custom layouts",               color: "#818cf8", to: "SpreadTester" },
  { id: "photos",    icon: "📷", label: "Photo Library",    sub: "Upload and organise card images",        color: "#34d399", to: "PhotoUploader" },
  { id: "ai-art",    icon: "🤖", label: "AI Image Gen",     sub: "Generate card art with AI",              color: "#f97316", to: "CreateDeck" },
  { id: "bulk",      icon: "📦", label: "Bulk Import",      sub: "Import decks from JSON or CSV",          color: "#818cf8", to: "CreateDeck" },
  { id: "persona",   icon: "🎭", label: "Persona",          sub: "Customise your AI reading voice",        color: "#f472b6", to: "Persona"    },
  { id: "publish",   icon: "🚀", label: "Publishing Guide", sub: "Submit your deck for review",            color: "#a78bfa", to: "Help"       },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStatusMeta(deck) {
  switch (deck.publish_status) {
    case "published":
      return { label: deck.is_public ? "Public" : "Personal", cls: "bg-green-500/20 text-green-300 border-green-500/30" };
    case "pending_review":
      return { label: "In Review",  cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    case "rejected":
      return { label: "Rejected",   cls: "bg-red-500/20 text-red-300 border-red-500/30" };
    default:
      return { label: "Draft",      cls: "bg-gray-500/20 text-gray-300 border-gray-500/30" };
  }
}

// ─── DeckTile ─────────────────────────────────────────────────────────────────
function DeckTile({ deck }) {
  const { label, cls } = getStatusMeta(deck);
  return (
    <div className="relative flex-shrink-0 w-36 rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-purple-400/40 transition-all group">
      <div className="relative aspect-[2/3] bg-gradient-to-br from-purple-900/40 to-slate-900/40">
        {deck.cover_image ? (
          <img src={deck.cover_image} alt={deck.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Palette className="w-8 h-8" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={`text-[10px] px-1.5 py-0.5 ${cls}`}>{label}</Badge>
        </div>
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
          <Link to={createPageUrl(`DeckView?id=${deck.id}`)}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs w-full">
              <Settings className="w-3 h-3 mr-1" /> Edit
            </Button>
          </Link>
          <Link to={createPageUrl(`DeckGallery?deckId=${deck.id}`)}>
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-xs w-full">
              <Eye className="w-3 h-3 mr-1" /> Gallery
            </Button>
          </Link>
        </div>
      </div>
      <div className="p-2">
        <p className="text-white text-xs font-semibold leading-tight truncate">{deck.name}</p>
        <p className="text-white/50 text-[10px] mt-0.5">{deck.category || "Oracle"}</p>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-5 py-3 border"
      style={{ background: `${color}11`, borderColor: `${color}33`, minWidth: 80 }}
    >
      <span className="text-2xl font-bold leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-white/50 mt-1 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Studio Tools List ────────────────────────────────────────────────────────
function StudioToolsList({ tools, onSelect }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
      {tools.map((tool) => (
        <div
          key={tool.id}
          onClick={() => {
            if (tool.to) navigate(createPageUrl(tool.to));
            else onSelect?.(tool);
          }}
          className="shrink-0 cursor-pointer rounded-2xl flex flex-col items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            width: 140,
            height: 150,
            background: `radial-gradient(135% 135% at 30% 20%, ${tool.color}22 0%, rgba(255,255,255,0.03) 100%)`,
            border: `1px solid ${tool.color}44`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 0 10px ${tool.color}11`,
          }}
        >
          <div className="text-4xl leading-none mb-3 drop-shadow-md">{tool.icon}</div>
          <div className="text-center px-3 w-full">
            <p className="text-white text-sm font-bold leading-tight drop-shadow-md">{tool.label}</p>
            <p className="text-white/60 text-[10px] mt-1.5 leading-tight">{tool.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Studio() {
  const [publishedDecks, setPublishedDecks] = useState([]);
  const [draftDecks, setDraftDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const deckSectionRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let user = null;
      try {
        user = await queueApiCall(() => base44.auth.me());
        setCurrentUser(user);
      } catch {
        setLoading(false);
        return;
      }

      await new Promise(r => setTimeout(r, 300));

      const allDecks = await queueApiCall(() =>
        base44.entities.Deck.list("-created_date", 200)
      );
      const mine = (allDecks || []).filter(
        d => d.created_by?.toLowerCase() === user.email?.toLowerCase()
      );

      setPublishedDecks(mine.filter(d =>
        d.publish_status === "published" || !d.publish_status
      ));
      setDraftDecks(mine.filter(d =>
        ["draft", "pending_review", "rejected"].includes(d.publish_status)
      ));
    } catch {
      toast.error("Failed to load studio data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalDecks   = publishedDecks.length + draftDecks.length;
  const publicDecks  = publishedDecks.filter(d => d.is_public).length;

  const handleToolSelect = (tool) => {
    if (tool.id === "my-decks") {
      deckSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Palette className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white/60">Loading studio…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Palette className="w-16 h-16 text-purple-400/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-white/60 mb-6">Please log in to access Creator Studio</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-600 hover:bg-purple-700">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen text-white pb-24">

        {/* ── Hero ── */}
        <div
          className="relative px-4 pt-8 pb-6"
          style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <span>🎨</span> Creator Studio
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Build, design, and publish your oracle decks
              </p>
            </div>
            <Link to={createPageUrl("CreateDeck")}>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg shadow-purple-900/40"
              >
                <Plus className="w-4 h-4 mr-1" /> New Deck
              </Button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <StatCard value={totalDecks}            label="Total Decks"  color="#a78bfa" />
            <StatCard value={draftDecks.length}     label="In Progress"  color="#f97316" />
            <StatCard value={publishedDecks.length} label="Published"    color="#34d399" />
            <StatCard value={publicDecks}           label="Public"       color="#67e8f9" />
          </div>
        </div>

        {/* ── Studio Tools ── */}
        <div className="px-2 mb-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest px-2 mb-3">
            Studio Tools
          </p>
          <StudioToolsList tools={TOOLS} onSelect={handleToolSelect} />
        </div>

        {/* ── In Progress ── */}
        {draftDecks.length > 0 && (
          <div className="px-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-bold text-white">
                In Progress ({draftDecks.length})
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {draftDecks.map(deck => <DeckTile key={deck.id} deck={deck} />)}
            </div>
          </div>
        )}

        {/* ── My Decks ── */}
        <div ref={deckSectionRef} className="px-4 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-white">
              My Decks ({publishedDecks.length})
            </h2>
          </div>

          {totalDecks === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/8 bg-white/3">
              <Palette className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No decks yet</h3>
              <p className="text-white/50 mb-6 max-w-xs mx-auto text-sm">
                Start your creative journey by building your first oracle deck
              </p>
              <Link to={createPageUrl("CreateDeck")}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Deck
                </Button>
              </Link>
            </div>
          ) : publishedDecks.length === 0 ? (
            <p className="text-white/40 text-sm italic">No published decks yet.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {publishedDecks.map(deck => <DeckTile key={deck.id} deck={deck} />)}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}