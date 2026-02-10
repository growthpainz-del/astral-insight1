import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Deck, Reading as ReadingEntity } from "@/entities/all";
import { Play, Plus, Clock, TrendingUp, Sparkles, ChevronRight, Eye, Settings, RefreshCw, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { isNetworkError } from "@/components/utils/isNetworkError";
import { queueApiCall } from "@/components/utils/apiQueue";

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

        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
          <Link
            to={createPageUrl(`DeckGallery?deckId=${deck.id}`)}
            onClick={(e) => e.stopPropagation()}
            className="bg-black/70 hover:bg-black/90 backdrop-blur-sm p-2 rounded-lg border border-white/20 transition-all hover:scale-110"
            title="View Gallery"
          >
            <Eye className="w-4 h-4 text-white" />
          </Link>

          {isOwned && (
            <Link
              to={createPageUrl(`DeckView?id=${deck.id}`)}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/70 hover:bg-black/90 backdrop-blur-sm p-2 rounded-lg border border-purple-400/40 transition-all hover:scale-110"
              title="Edit Deck Settings"
            >
              <Settings className="w-4 h-4 text-purple-300" />
            </Link>
          )}
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

export default function Dashboard() {
  // Pull-to-refresh (mobile)
  const containerRef = React.useRef(null);
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startYRef = React.useRef(0);
  const atTop = () => (window.scrollY === 0) || ((containerRef.current && containerRef.current.scrollTop === 0));
  const onTouchStart = (e) => { if (!atTop()) return; startYRef.current = e.touches[0].clientY; setPull(0); };
  const onTouchMove = (e) => { if (!atTop()) return; const dy = e.touches[0].clientY - startYRef.current; if (dy>0) { e.preventDefault(); setPull(Math.min(120, dy)); } };
  const onTouchEnd = () => { if (pull>80 && !refreshing) { setRefreshing(true); window.location.reload(); } setPull(0); }
  const [publicDecks, setPublicDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [draftDecks, setDraftDecks] = useState([]);
  
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(undefined); // Start as undefined to distinguish from null (no user)
  const [error, setError] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);


  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // INCREASED: More retries and longer delay for user load
        const user = await queueApiCall(() => base44.auth.me(), 8, 3000, 20000); // 8 retries, 3s delay, 20s timeout
        setCurrentUser(user);
        console.log('✅ User loaded:', user?.email);
      } catch (e) {
        console.log("No user logged in:", e);
        setCurrentUser(null); // Set to null if no user or error fetching
      }
    };
    loadUser();
  }, []); // Runs once on mount

  // Load decks and readings once user is loaded (currentUser is not undefined)
  useEffect(() => {
    if (currentUser === undefined) return; // Still loading user for the first time

    let cancelled = false;
    let timeoutId;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        console.log('📊 Loading dashboard data...');

        // Set a hard timeout - INCREASED to 45 seconds
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.error("⏰ Dashboard load timeout!");
            setLoading(false);
            setError("⚠️ The server is taking longer than usual to respond. This is normal during high traffic. Please wait 30 seconds and click 'Try Again' below.");
          }
        }, 45000); // INCREASED to 45 seconds (was 30)

        // ENHANCED: Load decks with MORE retries and LONGER delays
        const allDecks = await queueApiCall(
          () => Deck.list("-created_date", 200), 
          8,     // INCREASED: 8 retries (was 5)
          4000,  // INCREASED: 4s base delay (was 2s)
          30000  // INCREASED: 30s timeout (was 15s default)
        );
        
        if (cancelled) return;
        console.log(`✅ Loaded ${allDecks?.length || 0} decks`);
        
        // INCREASED: Longer delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s (was 400ms)
        
        // ENHANCED: Load readings with MORE retries and LONGER delays
        const readings = await queueApiCall(
          () => ReadingEntity.list("-created_date", 10), 
          8,     // INCREASED: 8 retries (was 5)
          4000,  // INCREASED: 4s base delay (was 2s)
          30000  // INCREASED: 30s timeout (was 15s default)
        );
        
        if (cancelled) return;
        console.log(`✅ Loaded ${readings?.length || 0} readings`);

        // Filter decks safely
        const safeDecks = Array.isArray(allDecks) ? allDecks : [];
        
        const publicDecksList = safeDecks.filter(d => 
          d?.is_public && 
          d?.publish_status === "published"
        );
        
        // FIXED: Show ALL user's decks that aren't drafts
        const myDecksList = currentUser 
          ? safeDecks.filter(d => 
              d?.created_by && 
              d.created_by.toLowerCase() === currentUser.email?.toLowerCase() &&
              // Exclude only actual draft statuses
              d.publish_status !== "draft" && 
              d.publish_status !== "pending_review"
            )
          : [];

        // FIXED: Only actual drafts and pending
        const draftDecksList = currentUser
          ? safeDecks.filter(d =>
              d?.created_by &&
              d.created_by.toLowerCase() === currentUser.email?.toLowerCase() &&
              (d.publish_status === "draft" || d.publish_status === "pending_review" || d.publish_status === "rejected")
            )
          : [];



        if (cancelled) return; // Check again before setting state

        setPublicDecks(publicDecksList);
        setMyDecks(myDecksList);
        setDraftDecks(draftDecksList);

        setRecentReadings(Array.isArray(readings) ? readings : []);
        
        console.log('✅ Dashboard loaded successfully');
        console.log(`Total decks loaded: ${safeDecks.length}`);
        console.log(`Displayed: ${publicDecksList.length} public, ${myDecksList.length} my decks, ${draftDecksList.length} drafts`);
        
      } catch (error) {
        if (cancelled) return; // Don't update state if component unmounted or load was cancelled
        
        console.error("❌ Dashboard error:", error);
        
        const isNetworkErr = isNetworkError(error);
        const isTimeout = error.message?.includes('timeout') || (error.code === 'ECONNABORTED');
        
        if (isNetworkErr || isTimeout) {
          // ENHANCED: More helpful error message
          setError("🔌 Network connection issue detected. The server may be slow or overloaded. Please wait 30-60 seconds and click 'Try Again'. If this persists, check your internet connection.");
        } else if (error.response?.status === 429) {
          setError("⏱️ Rate limit reached. Please wait 1 minute before trying again.");
        } else if (error.response?.status >= 500) {
          setError("🔧 Server is experiencing issues. This is temporary. Please wait 1-2 minutes and try again.");
        } else {
          setError("❌ Failed to load dashboard. Please wait a moment and try again.");
        }
        
        // Set empty states to clear any partial data
        setPublicDecks([]);
        setMyDecks([]);
        setDraftDecks([]);

        setRecentReadings([]);
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId); // Clear the timeout if data loaded or errored before timeout
          setLoading(false);
          setIsRetrying(false);
        }
      }
    };

    loadData();

    return () => {
      // Cleanup function: set cancelled flag and clear timeout
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentUser]); // Dependency on currentUser: re-runs when user state is known

  const handleRetry = () => {
    setIsRetrying(true);
    setError("");
    // Reload the page to re-trigger all data fetching
    window.location.reload(); 
  };

  const isOwnedByUser = (deck) => {
    if (!currentUser || !deck || !deck.created_by) return false;
    return deck.created_by.toLowerCase() === currentUser.email?.toLowerCase();
  };



  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <div className="text-white">Loading your decks...</div>
          <p className="text-white/60 text-sm mt-2">This may take a moment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/20 border border-red-500/40 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connection Issue</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-red-600 hover:bg-red-700 w-full"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
          <p className="text-white/60 text-xs mt-4">
            If this persists, try refreshing the page or checking your internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white">
      {/* Pull-to-refresh indicator */}
      <div style={{height: pull, transition: pull===0 ? 'height .2s ease' : 'none'}} className="flex items-center justify-center text-white/70">
        {pull>0 && (refreshing ? 'Refreshing…' : 'Pull to refresh')}
      </div>

      {/* NETFLIX-STYLE HERO SECTION */}
      <div className="relative h-[70vh] mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/700bd7a94_0DC18799-794E-447B-AD87-0A5B20D22CE5.png"
            alt="Hero"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Astral Insight
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-6 max-w-2xl">
            Your mystical journey into oracle readings, tarot, and cosmic guidance
          </p>
          <div className="flex gap-4">
            <Link to={createPageUrl("ReadingRoom")}>
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold">
                <Play className="w-5 h-5 mr-2" />
                Start Reading
              </Button>
            </Link>
            <Link to={createPageUrl("Help")}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          Quick Actions
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pan-2d">
          {draftDecks.length > 0 && (
            <QuickAction
              label={`My Drafts (${draftDecks.length})`}
              icon={Clock}
              to={createPageUrl(`DeckView?id=${draftDecks[0].id}`)}
              gradient="bg-gradient-to-br from-amber-600 to-orange-600"
            />
          )}
          <QuickAction
            label="Create New Deck"
            icon={Plus}
            to={createPageUrl("CreateDeck")}
            gradient="bg-gradient-to-br from-purple-600 to-blue-600"
          />
          <QuickAction
            label="Reading History"
            icon={Clock}
            to={createPageUrl("History")}
            gradient="bg-gradient-to-br from-indigo-600 to-purple-600"
          />
          <QuickAction
            label="Explore Decks"
            icon={Sparkles}
            to={createPageUrl("ReadingRoom")}
            gradient="bg-gradient-to-br from-cyan-600 to-blue-600"
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
            <Link to={createPageUrl("ReadingRoom")} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
              Browse All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pan-2d">
            {publicDecks.slice(0, 12).map(deck => (
              <DeckCard key={deck.id} deck={deck} isOwned={isOwnedByUser(deck)} />
            ))}
          </div>
        </div>
      )}

      {/* My Decks */}
      {myDecks.length > 0 && (
        <div className="px-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Decks ({myDecks.length})</h2>
            <Link to={createPageUrl("CreateDeck")} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
              Create New <Plus className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pan-2d">
            {myDecks.map(deck => (
              <DeckCard key={deck.id} deck={deck} isOwned={true} />
            ))}
          </div>
        </div>
      )}

      {/* My Drafts */}
      {draftDecks.length > 0 && (
        <div className="px-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-400" />
              My Drafts ({draftDecks.length})
            </h2>
            <Link to={createPageUrl("CreateDeck")} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
              Create New <Plus className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pan-2d">
            {draftDecks.map(deck => (
              <Link key={deck.id} to={createPageUrl(`DeckView?id=${deck.id}`)} className="group block">
                <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-amber-900/40 to-slate-900/40 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 hover:scale-105">
                  {deck.cover_image ? (
                    <img src={deck.cover_image} alt={deck.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Clock className="w-12 h-12" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2">
                    {deck.publish_status === "pending_review" && (
                      <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">PENDING</div>
                    )}
                    {deck.publish_status === "rejected" && (
                      <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">REJECTED</div>
                    )}
                    {deck.publish_status === "draft" && (
                      <div className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">DRAFT</div>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                    <div className="bg-black/70 hover:bg-black/90 backdrop-blur-sm p-2 rounded-lg border border-amber-400/40">
                      <Settings className="w-4 h-4 text-amber-300" />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-white font-semibold truncate">{deck.name}</h4>
                  <p className="text-white/60 text-sm">{deck.publish_status}</p>
                </div>
              </Link>
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
            <Link to={createPageUrl("History")} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pan-2d">
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

      {/* Footer */}
      <div className="px-8 py-12 text-center text-white/30 text-sm">
        Astral Insight • Your Gateway to Cosmic Wisdom
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Independent 2D pan/scroll areas for mobile */
        .pan-2d { 
          touch-action: pan-x pan-y; 
          overscroll-behavior: contain; 
          -webkit-overflow-scrolling: touch; 
        }

      `}</style>
    </div>
  );
}