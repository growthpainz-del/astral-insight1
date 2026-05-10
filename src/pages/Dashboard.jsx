import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

import { Play, Plus, Clock, TrendingUp, Sparkles, ChevronRight, Eye, Settings, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNetworkError } from "@/components/utils/isNetworkError";
import { queueApiCall } from "@/components/utils/apiQueue";
import AudioOrb from "@/components/reading/AudioOrb";
import MoonPhaseWidget from "@/components/dashboard/MoonPhaseWidget";
import { getThumbnailUrl } from "@/lib/utils";
import DisablePullToRefresh from "@/components/common/DisablePullToRefresh";

function DeckCard({ deck, isOwned = false }) {
  const navigate = useNavigate();
  const goToReading = () => navigate(createPageUrl(`Reading?deckId=${deck.id}`));
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToReading(); } };
  return (
    <div className="group block cursor-pointer" onClick={goToReading} role="button" tabIndex={0} onKeyDown={onKey}>
      <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900/40 border border-white/10 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30">
        {deck.cover_image ? (
          <img
            src={getThumbnailUrl(deck.cover_image, 400)}
            alt={deck.name}
            loading="lazy"
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
    </div>
  );
}

function ReadingCard({ reading, deck }) {
  return (
    <Link to={createPageUrl(`History`)} className="group">
      <div className="relative flex-shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-white/10 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30">
        {deck?.cover_image ? (
          <img
            src={getThumbnailUrl(deck.cover_image, 400)}
            alt={reading.title}
            loading="lazy"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white force-white p-4">
          <Icon className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-center">{label}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [publicDecks, setPublicDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [draftDecks, setDraftDecks] = useState([]);
  
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [error, setError] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  // New UI State
  const [mode, setMode] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState('three_card');

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = React.useRef(0);


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
        const [publicDecksRes, myDecksRes] = await Promise.all([
          queueApiCall(() => base44.entities.Deck.filter({ is_public: true, publish_status: "published" }, "-updated_date", 100), 8, 4000, 30000),
          currentUser ? queueApiCall(() => base44.entities.Deck.filter({ created_by: currentUser.email }, "-updated_date", 500), 8, 4000, 30000) : Promise.resolve([])
        ]);
        
        if (cancelled) return;
        console.log(`✅ Loaded decks`);
        
        // INCREASED: Longer delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s (was 400ms)
        
        // ENHANCED: Load readings with MORE retries and LONGER delays
        const readings = await queueApiCall(
          () => base44.entities.Reading.list("-created_date", 10), 
          8,     // INCREASED: 8 retries (was 5)
          4000,  // INCREASED: 4s base delay (was 2s)
          30000  // INCREASED: 30s timeout (was 15s default)
        );
        
        if (cancelled) return;
        console.log(`✅ Loaded ${readings?.length || 0} readings`);

        const safePublicDecks = Array.isArray(publicDecksRes) ? publicDecksRes : [];
        const safeMyDecks = Array.isArray(myDecksRes) ? myDecksRes : [];
        
        const publicDecksList = safePublicDecks;
        
        const myDecksList = safeMyDecks.filter(d => d.publish_status === "published");
        const draftDecksList = safeMyDecks.filter(d => d.publish_status === "draft" || d.publish_status === "pending_review" || d.publish_status === "rejected" || !d.publish_status);



        if (cancelled) return; // Check again before setting state

        setPublicDecks(publicDecksList);
        setMyDecks(myDecksList);
        setDraftDecks(draftDecksList);

        setRecentReadings(Array.isArray(readings) ? readings : []);
        
        console.log('✅ Dashboard loaded successfully');
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
        } else if (error.response?.status === 508) {
          setError("🔁 Temporary server loop detected (508). Please wait a minute and refresh.");
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

  const handlePointerDown = (e) => {
    setIsDragging(true);
    startXRef.current = e.clientX || e.touches?.[0]?.clientX || 0;
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const endX = e.clientX || e.changedTouches?.[0]?.clientX || 0;
    const diff = endX - startXRef.current;
    if (Math.abs(diff) > 28) {
      if (diff < 0) setFocusIdx(f => f + 1);
      else if (diff > 0) setFocusIdx(f => Math.max(0, f - 1));
    }
  };

  const handleDownloadManuals = async (zip = false) => {
    try {
      const { data } = await base44.functions.invoke('exportDeckManuals', zip ? { per_deck_zip: true } : {});
      if (zip) {
        const blob = new Blob([data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deck_exports.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cosmic_chronicle_manuals.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Failed to download manuals JSON', e);
      alert('Failed to export manuals. Please try again.');
    }
  };

  const isOwnedByUser = (deck) => {
    if (!currentUser || !deck || !deck.created_by) return false;
    return deck.created_by.toLowerCase() === currentUser.email?.toLowerCase();
  };



  const activePoolRaw = mode === 'personal' ? myDecks : publicDecks;
  const activePool = activePoolRaw.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  React.useEffect(() => {
    if (focusIdx >= activePool.length && activePool.length > 0) {
      setFocusIdx(activePool.length - 1);
    }
  }, [activePool.length, focusIdx]);

  const selectedDeck = activePool[focusIdx] || null;

  const handleDrawCards = () => {
    if (!selectedDeck) return;
    const query = new URLSearchParams();
    query.set('deckId', selectedDeck.id);
    if (spread) query.set('spread', spread);
    if (question) query.set('question', question);
    navigate(createPageUrl(`Reading?${query.toString()}`));
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07050f' }}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#a78bfa] mx-auto mb-4 animate-pulse" />
          <div className="text-[rgba(225,215,255,.9)] font-serif">Loading your decks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07050f' }}>
        <div className="max-w-md w-full bg-[#160f2a] border border-[#ef4444] rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[rgba(225,215,255,.9)] font-serif mb-2">Connection Issue</h2>
          <p className="text-[rgba(180,160,220,.42)] mb-6">{error}</p>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-[#ef4444] hover:bg-[#b91c1c] w-full text-white font-serif"
          >
            {isRetrying ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-serif" style={{ background: '#07050f', color: 'rgba(225,215,255,.9)', paddingBottom: '72px' }}>
      <DisablePullToRefresh targetSelector="body" />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseBtn { 0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,.35); } 50% { box-shadow: 0 0 0 8px rgba(167,139,250,0); } }
      `}</style>

      <div className="max-w-[430px] mx-auto pt-6">
        <div className="flex items-center gap-2 px-5 mb-4 text-[9px] uppercase tracking-[0.28em] text-[rgba(180,160,220,.42)]" style={{ fontFamily: "'Cinzel', serif" }}>
          Choose Your Deck
          <div className="flex-1 h-[1px] bg-[rgba(160,120,255,.16)] ml-2"></div>
        </div>

        <div className="px-5 flex gap-2.5 items-center mb-4">
          <div className="flex-1 flex items-center gap-2 bg-[#160f2a] border border-[rgba(160,120,255,.16)] rounded-full px-4 py-2.5 transition-colors focus-within:border-[rgba(167,139,250,.45)]">
            <span className="text-[13px] text-[rgba(180,160,220,.42)] shrink-0">🔍</span>
            <input 
              type="text" 
              placeholder="Search decks…" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[15px] text-[rgba(225,215,255,.9)] font-serif placeholder:text-[rgba(180,160,220,.42)]"
            />
          </div>
          <div className="flex bg-[#160f2a] border border-[rgba(160,120,255,.16)] rounded-full p-[3px] gap-[2px] shrink-0">
            <button 
              className={`px-3 py-1.5 rounded-full border-none cursor-pointer uppercase text-[8px] tracking-[0.12em] whitespace-nowrap transition-all ${mode === 'personal' ? 'bg-[#a78bfa] text-white shadow-[0_0_12px_rgba(167,139,250,.4)]' : 'bg-transparent text-[rgba(180,160,220,.42)]'}`}
              style={{ fontFamily: "'Cinzel', serif" }}
              onClick={() => setMode('personal')}
            >
              Mine
            </button>
            <button 
              className={`px-3 py-1.5 rounded-full border-none cursor-pointer uppercase text-[8px] tracking-[0.12em] whitespace-nowrap transition-all ${mode === 'public' ? 'bg-[#a78bfa] text-white shadow-[0_0_12px_rgba(167,139,250,.4)]' : 'bg-transparent text-[rgba(180,160,220,.42)]'}`}
              style={{ fontFamily: "'Cinzel', serif" }}
              onClick={() => setMode('public')}
            >
              Public
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden py-1.5" style={{ WebkitMaskImage: 'linear-gradient(to right,transparent 0%,#000 18%,#000 82%,transparent 100%)' }}>
          <div 
            className="flex items-center gap-3 px-[calc(50%-58px)] transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
            style={{ transform: `translateX(${-focusIdx * 128}px)` }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {activePool.map((d, i) => {
              const diff = Math.abs(i - focusIdx);
              const scale = diff === 0 ? 1 : diff === 1 ? 0.87 : 0.74;
              const opacity = diff === 0 ? 1 : diff === 1 ? 0.62 : 0.38;
              const translateY = diff === 0 ? 0 : diff === 1 ? 5 : 10;
              const isFocus = diff === 0;

              return (
                <div 
                  key={d.id} 
                  className="shrink-0 w-[116px] flex flex-col items-center gap-2 transition-all duration-300 ease-out"
                  style={{ transform: `scale(${scale}) translateY(${translateY}px)`, opacity }}
                  onClick={() => setFocusIdx(i)}
                >
                  <div className={`w-[116px] h-[164px] rounded-[13px] overflow-hidden border-[1.5px] bg-[#160f2a] flex items-center justify-center text-[40px] transition-all duration-300 ${isFocus ? 'border-[rgba(167,139,250,.6)] shadow-[0_0_0_1px_rgba(167,139,250,.2),0_10px_32px_rgba(100,50,200,.5),0_0_50px_rgba(100,50,200,.1)]' : 'border-[rgba(160,120,255,.16)]'}`}>
                    {d.cover_image ? (
                      <img src={d.cover_image} alt={d.name} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <span>{isFocus ? '✨' : '📖'}</span>
                    )}
                  </div>
                  <div className={`text-[8.5px] uppercase tracking-[0.12em] text-center max-w-[108px] leading-[1.4] transition-colors duration-300 ${isFocus ? 'text-[#a78bfa]' : 'text-[rgba(180,160,220,.42)]'}`} style={{ fontFamily: "'Cinzel', serif" }}>
                    {d.name}
                  </div>
                  <div className={`text-[11px] italic transition-colors duration-300 ${isFocus ? 'text-[rgba(167,139,250,.65)]' : 'text-[rgba(167,139,250,.38)]'}`} style={{ fontFamily: "'IM Fell English', serif" }}>
                    {d.category || 'Oracle'}
                  </div>
                </div>
              );
            })}
            {activePool.length === 0 && (
              <div className="w-full text-center text-[rgba(180,160,220,.42)] italic text-[15px] py-10 w-[116px] shrink-0" style={{ fontFamily: "'IM Fell English', serif" }}>
                No decks.
              </div>
            )}
          </div>
        </div>

        {activePool.length > 0 && (
          <div className="flex justify-center gap-1.5 py-2">
            {activePool.map((_, i) => (
              <div 
                key={i} 
                className={`h-[5px] rounded-full transition-all duration-300 cursor-pointer ${i === focusIdx ? 'w-4 bg-[#a78bfa]' : 'w-[5px] bg-[rgba(160,120,255,.3)]'}`}
                onClick={() => setFocusIdx(i)}
              />
            ))}
          </div>
        )}

        {selectedDeck && (
          <div className="mx-5 mt-2.5 mb-1 px-4 py-3 bg-[#160f2a] border border-[rgba(167,139,250,.2)] rounded-[13px] flex items-center justify-between animate-[fadeUp_0.3s_ease]">
            <div>
              <div className="text-[13px] tracking-[0.08em] text-white" style={{ fontFamily: "'Cinzel', serif" }}>{selectedDeck.name}</div>
              <div className="text-[12px] italic text-[rgba(180,160,220,.42)] mt-0.5" style={{ fontFamily: "'IM Fell English', serif" }}>
                {selectedDeck.category || 'Oracle'}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[rgba(167,139,250,.12)] border border-[rgba(167,139,250,.3)] flex items-center justify-center text-[12px] text-[#a78bfa]">
              ✦
            </div>
          </div>
        )}

        <div className="mx-5 my-3 p-[17px] bg-[#0f0b1e] border border-[rgba(160,120,255,.16)] rounded-[14px] flex flex-col gap-[13px]">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(180,160,220,.42)] mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>Your Question</div>
            <textarea 
              className="w-full bg-[#160f2a] border border-[rgba(160,120,255,.16)] rounded-[10px] p-3 text-[16px] text-[rgba(225,215,255,.9)] font-serif resize-none outline-none min-h-[78px] leading-[1.5] transition-colors focus:border-[rgba(167,139,250,.45)] placeholder:text-[rgba(180,160,220,.42)]"
              placeholder="What guidance do you seek?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(180,160,220,.42)] mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>Spread</div>
            <select 
              className="w-full bg-[#160f2a] border border-[rgba(160,120,255,.16)] rounded-[10px] py-[11px] px-[14px] text-[15px] text-[rgba(225,215,255,.9)] font-serif outline-none cursor-pointer appearance-none transition-colors focus:border-[rgba(167,139,250,.45)]"
              style={{
                backgroundImage: \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23a78bfa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")\`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 13px center'
              }}
              value={spread}
              onChange={e => setSpread(e.target.value)}
            >
              <option value="single">Single Card — 1 card</option>
              <option value="three_card">Past, Present, Future — 3 cards</option>
              <option value="celtic_cross">Celtic Cross — 10 cards</option>
              <option value="diamond">7 Card Diamond</option>
              <option value="horseshoe">Horseshoe — 7 cards</option>
              <option value="relationship">Relationship — 6 cards</option>
            </select>
          </div>
          <button 
            className="w-full p-[14px] rounded-full border-none cursor-pointer text-[11.5px] tracking-[0.18em] uppercase text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{ 
              background: 'linear-gradient(135deg,#6d28d9,#7c3aed,#a78bfa)', 
              boxShadow: '0 4px 20px rgba(124,58,237,.45)',
              fontFamily: "'Cinzel', serif",
              animation: 'pulseBtn 2.5s ease infinite'
            }}
            onClick={handleDrawCards}
            disabled={!selectedDeck}
          >
            ✦ Draw Cards
          </button>
        </div>
        <div className="text-center italic text-[11px] text-[rgba(160,140,200,.3)] px-5 pb-1 leading-[1.5]" style={{ fontFamily: "'Crimson Text', serif" }}>
          Readings are for entertainment purposes only and do not constitute professional advice.
        </div>
      </div>
    </div>
  );
}