import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queueApiCall } from "@/components/utils/apiQueue";
import PullToRefresh from "@/components/common/PullToRefresh";



function ToolCard({ title, description, icon: Icon, to, color = "purple" }) {
  const gradients = {
    purple: "from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30",
    pink: "from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30",
    blue: "from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30",
    green: "from-green-600/20 to-teal-600/20 hover:from-green-600/30 hover:to-teal-600/30",
  };

  return (
    <Link to={to} className="block transition-transform duration-300 hover:scale-105 hover:z-10 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-[14px]">
      <div 
        className="w-full flex flex-col p-[20px] pb-[16px] bg-[#160f2a] rounded-[14px] border-[1.5px] border-[rgba(160,120,255,0.16)] transition-all duration-300"
        style={{
          boxShadow: "0 0 0 1px transparent",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 1px rgba(167,139,250,0.15), 0 10px 32px rgba(80,40,180,0.45)";
          e.currentTarget.querySelector('.icon-wrap').style.background = "rgba(167,139,250,0.18)";
          e.currentTarget.querySelector('.tool-title').style.color = "#fff";
          e.currentTarget.querySelector('.tool-desc').style.color = "rgba(200,185,240,0.7)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = "rgba(160,120,255,0.16)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.querySelector('.icon-wrap').style.background = "rgba(167,139,250,0.1)";
          e.currentTarget.querySelector('.tool-title').style.color = "rgba(220,210,255,0.85)";
          e.currentTarget.querySelector('.tool-desc').style.color = "rgba(180,160,220,0.42)";
        }}
      >
        <div 
          className="icon-wrap w-[44px] h-[44px] rounded-[11px] flex items-center justify-center text-[22px] bg-[rgba(167,139,250,0.1)] border border-[rgba(167,139,250,0.2)] mb-[2px] transition-colors duration-300"
        >
          <Icon className="w-6 h-6 text-purple-300" />
        </div>
        <div 
          className="tool-title uppercase font-bold text-[11px] tracking-[0.1em] text-[rgba(220,210,255,0.85)] transition-colors duration-300 leading-[1.3] mt-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {title}
        </div>
        <div 
          className="tool-desc text-[13px] text-[rgba(180,160,220,0.42)] leading-[1.5] transition-colors duration-300 mt-1"
          style={{ fontFamily: "'Crimson Text', serif" }}
        >
          {description}
        </div>
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
        user = await queueApiCall(() => base44.auth.me());
        setCurrentUser(user);
      } catch (e) {
        console.log("No current user logged in");
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const allDecks = await queueApiCall(() => base44.entities.Deck.filter({ created_by: user.email }, "-updated_date", 500));
      
      const myPublished = (allDecks || []).filter(d => d.publish_status === "published");

      const myDrafts = (allDecks || []).filter(d =>
        d.publish_status === "draft" || d.publish_status === "pending_review" || d.publish_status === "rejected" || !d.publish_status
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
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-600 hover:bg-purple-700">
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
      <div 
        className="px-[18px] py-[22px] pb-[16px] border-b border-[rgba(160,120,255,0.16)] mb-8"
        style={{
          background: "linear-gradient(160deg, #1a0f35 0%, #0e0823 60%, #07050f 100%)",
          animation: "fadeUp 0.4s ease"
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-[10px] mb-[6px]">
            <span className="text-[26px]">🎨</span>
            <h1 
              className="text-[22px] tracking-[0.08em] font-bold"
              style={{
                fontFamily: "'Cinzel', serif",
                background: "linear-gradient(90deg, #c8a8ff, #fff 50%, #a0c8ff)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 5s linear infinite"
              }}
            >
              Creator Studio
            </h1>
          </div>
          <div 
            className="text-[14px] text-[rgba(180,160,220,0.42)] mb-[18px]"
            style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}
          >
            Build, design, and publish your oracle decks
          </div>

          {/* Quick Stats */}
          <div className="flex gap-[10px] overflow-x-auto pb-[4px] no-scrollbar">
            <div 
              className="shrink-0 min-w-[100px] p-[12px] px-[14px] rounded-[12px] border border-[rgba(160,120,255,0.16)] bg-[rgba(255,255,255,0.04)]"
              style={{ animation: "countUp 0.5s ease both", animationDelay: "0.1s" }}
            >
              <div className="text-[22px] font-bold leading-none text-[#67e8f9]" style={{ fontFamily: "'Cinzel', serif" }}>{totalDecks}</div>
              <div className="text-[12px] text-[rgba(180,160,220,0.42)] mt-[3px]" style={{ fontFamily: "'Crimson Text', serif" }}>Total Decks</div>
            </div>
            <div 
              className="shrink-0 min-w-[100px] p-[12px] px-[14px] rounded-[12px] border border-[rgba(160,120,255,0.16)] bg-[rgba(255,255,255,0.04)]"
              style={{ animation: "countUp 0.5s ease both", animationDelay: "0.2s" }}
            >
              <div className="text-[22px] font-bold leading-none text-[#f97316]" style={{ fontFamily: "'Cinzel', serif" }}>{draftDecks.length}</div>
              <div className="text-[12px] text-[rgba(180,160,220,0.42)] mt-[3px]" style={{ fontFamily: "'Crimson Text', serif" }}>In Progress</div>
            </div>
            <div 
              className="shrink-0 min-w-[100px] p-[12px] px-[14px] rounded-[12px] border border-[rgba(160,120,255,0.16)] bg-[rgba(255,255,255,0.04)]"
              style={{ animation: "countUp 0.5s ease both", animationDelay: "0.3s" }}
            >
              <div className="text-[22px] font-bold leading-none text-[#34d399]" style={{ fontFamily: "'Cinzel', serif" }}>{publishedDecks.length}</div>
              <div className="text-[12px] text-[rgba(180,160,220,0.42)] mt-[3px]" style={{ fontFamily: "'Crimson Text', serif" }}>Published</div>
            </div>
            <div 
              className="shrink-0 min-w-[100px] p-[12px] px-[14px] rounded-[12px] border border-[rgba(160,120,255,0.16)] bg-[rgba(255,255,255,0.04)]"
              style={{ animation: "countUp 0.5s ease both", animationDelay: "0.4s" }}
            >
              <div className="text-[22px] font-bold leading-none text-[#a78bfa]" style={{ fontFamily: "'Cinzel', serif" }}>{publishedDecks.filter(d => d.is_public).length}</div>
              <div className="text-[12px] text-[rgba(180,160,220,0.42)] mt-[3px]" style={{ fontFamily: "'Crimson Text', serif" }}>Public</div>
            </div>
          </div>
          
          <Link to={createPageUrl("CreateDeck")} className="block mt-[14px]">
            <button 
              className="w-full flex items-center justify-center gap-[8px] p-[13px] rounded-[50px] border-none cursor-pointer text-white"
              style={{
                fontFamily: "'Cinzel', serif", 
                fontSize: "11px", 
                letterSpacing: "0.16em", 
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #6d28d9, #7c3aed, #a78bfa)",
                boxShadow: "0 4px 18px rgba(124,58,237,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
                animation: "pulse 2.5s ease infinite"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 26px rgba(124,58,237,0.55)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 18px rgba(124,58,237,0.4)";
              }}
            >
              + New Deck
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {/* Drafts & In Progress */}
        {draftDecks.length > 0 && (
          <>
            <div className="flex items-center gap-[10px] px-[18px] mt-[18px] mb-[12px] text-[rgba(180,160,220,0.42)] uppercase tracking-[0.28em] text-[9px]" style={{ fontFamily: "'Cinzel', serif" }}>
              In Progress
              <div className="flex-1 h-[1px] bg-[rgba(160,120,255,0.16)]"></div>
            </div>
            <div className="px-[18px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[11px] mb-[18px]">
                {draftDecks.map((deck, i) => (
                  <div 
                    key={deck.id}
                    className="flex flex-col rounded-[13px] overflow-hidden bg-[#160f2a] border border-[rgba(160,120,255,0.16)] transition-all duration-200 cursor-pointer"
                    style={{ animation: "fadeUp 0.4s ease both", animationDelay: `${(i % 4) * 0.08 + 0.1}s` }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "rgba(167,139,250,0.38)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "rgba(160,120,255,0.16)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div className="relative w-full aspect-[3/4] flex items-center justify-center text-[36px] bg-gradient-to-br from-[#1e1438] to-[#0d0822] overflow-hidden">
                      {deck.cover_image ? (
                        <img src={deck.cover_image} alt={deck.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>🎨</span>
                      )}
                      <div 
                        className="absolute top-[8px] left-[8px] px-[8px] py-[3px] rounded-[50px] uppercase tracking-[0.1em] text-[7.5px]"
                        style={{ 
                          fontFamily: "'Cinzel', serif",
                          background: deck.publish_status === "pending_review" ? "rgba(234,179,8,0.15)" : deck.publish_status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.6)",
                          border: `1px solid ${deck.publish_status === "pending_review" ? "rgba(234,179,8,0.3)" : deck.publish_status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(160,160,160,0.3)"}`,
                          color: deck.publish_status === "pending_review" ? "#fef08a" : deck.publish_status === "rejected" ? "#fca5a5" : "rgba(200,200,200,0.8)"
                        }}
                      >
                        {deck.publish_status === "pending_review" ? "Pending" : deck.publish_status === "rejected" ? "Rejected" : "Draft"}
                      </div>
                    </div>
                    <div className="p-[10px] px-[11px] pb-[11px] flex-1 flex flex-col">
                      <div className="text-[10px] tracking-[0.1em] uppercase text-[rgba(220,210,255,0.85)] mb-[3px] leading-[1.3] truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                        {deck.name}
                      </div>
                      <div className="text-[11.5px] text-[rgba(180,160,220,0.42)] truncate" style={{ fontFamily: "'Crimson Text', serif" }}>
                        {deck.category || 'Oracle'}
                      </div>
                      <div className="mt-auto pt-[9px] flex gap-[6px]">
                        <Link to={createPageUrl(`DeckView?id=${deck.id}`)} className="flex-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="w-full flex items-center justify-center gap-[4px] py-[7px] rounded-[8px] border-none cursor-pointer transition-all duration-200 uppercase tracking-[0.1em] text-[8px]"
                            style={{ 
                              fontFamily: "'Cinzel', serif",
                              background: "rgba(167,139,250,0.15)",
                              border: "1px solid rgba(167,139,250,0.25)",
                              color: "#a78bfa"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(167,139,250,0.25)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(167,139,250,0.15)"}
                          >
                            ⚙ Edit
                          </button>
                        </Link>
                        <Link to={createPageUrl(`DeckGallery?deckId=${deck.id}`)} className="flex-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="w-full flex items-center justify-center gap-[4px] py-[7px] rounded-[8px] border-none cursor-pointer transition-all duration-200 uppercase tracking-[0.1em] text-[8px]"
                            style={{ 
                              fontFamily: "'Cinzel', serif",
                              background: "rgba(103,232,249,0.08)",
                              border: "1px solid rgba(103,232,249,0.2)",
                              color: "#67e8f9"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(103,232,249,0.15)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(103,232,249,0.08)"}
                          >
                            ◎ View
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Published Decks */}
        {publishedDecks.length > 0 && (
          <>
            <div className="flex items-center gap-[10px] px-[18px] mt-[18px] mb-[12px] text-[rgba(180,160,220,0.42)] uppercase tracking-[0.28em] text-[9px]" style={{ fontFamily: "'Cinzel', serif" }}>
              Published Decks
              <div className="flex-1 h-[1px] bg-[rgba(160,120,255,0.16)]"></div>
            </div>
            <div className="px-[18px] pb-[18px]">
              <div className="flex flex-col gap-[9px]">
                {publishedDecks.map((deck, i) => (
                  <Link key={deck.id} to={createPageUrl(`DeckView?id=${deck.id}`)}>
                    <div 
                      className="flex items-center gap-[12px] p-[11px] px-[13px] bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[13px] cursor-pointer transition-colors duration-200"
                      style={{ animation: "fadeUp 0.4s ease both", animationDelay: `${(i % 10) * 0.08 + 0.1}s` }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(160,120,255,0.16)"}
                    >
                      <div className="shrink-0 w-[44px] h-[62px] rounded-[8px] bg-gradient-to-br from-[#1e1438] to-[#0d0822] flex items-center justify-center text-[22px] border border-[rgba(160,120,255,0.16)] overflow-hidden">
                        {deck.cover_image ? (
                          <img src={deck.cover_image} alt={deck.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>✨</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] tracking-[0.09em] uppercase text-[rgba(220,210,255,0.85)] mb-[3px] truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                          {deck.name}
                        </div>
                        <div className="text-[12px] text-[rgba(180,160,220,0.42)] truncate" style={{ fontFamily: "'Crimson Text', serif" }}>
                          {deck.category || 'Oracle'} • {deck.is_public ? 'Public' : 'Personal'}
                        </div>
                      </div>
                      <div className="text-[16px] text-[rgba(180,160,220,0.42)] shrink-0">›</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
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
          <div 
            className="flex items-center gap-[10px] px-[18px] mt-[20px] mb-[12px] text-[rgba(180,160,220,0.42)] uppercase tracking-[0.28em] text-[9px]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Studio Tools
            <div className="flex-1 h-[1px] bg-[rgba(160,120,255,0.16)]"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-[18px]">
            <ToolCard
              title="Cardify Studio"
              description="Turn photos into beautiful, uniform cards"
              icon={ImageIcon}
              to={createPageUrl("CardMaker")}
              color="pink"
            />
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