import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Sparkles, AlertCircle, RotateCcw, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queueApiCall } from "@/components/utils/apiQueue";
import PullToRefresh from "@/components/common/PullToRefresh";

import CoverflowDeckSelector from "@/components/reading/CoverflowDeckSelector";

export default function ReadingRoom() {
  const [searchParams] = useSearchParams();
  const [publicDecks, setPublicDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [connectingReader, setConnectingReader] = useState(null);
  const [liveSessionUrl, setLiveSessionUrl] = useState(null);

  const handleConnectLive = async (reader) => {
    if (reader.status !== 'Online') return;
    try {
      setConnectingReader(reader.name);
      const res = await base44.functions.invoke('createLiveRoom', {});
      if (res.data?.roomUrl) {
        setLiveSessionUrl(res.data.roomUrl);
      } else {
        alert('Failed to connect: ' + JSON.stringify(res.data || res.error || res));
      }
    } catch (e) {
      alert('Error starting live session: ' + e.message);
    } finally {
      setConnectingReader(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      let user = null;
      try {
        user = await queueApiCall(() => base44.auth.me());
        setCurrentUser(user);
      } catch (e) {
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const allDecks = await queueApiCall(() => base44.entities.Deck.list("-created_date", 200));
      
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
      
    } catch (error) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-8 text-center max-w-md w-full shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <Button onClick={loadData} className="bg-red-500 hover:bg-red-600 text-white w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen relative bg-[#07050f] text-white font-sans">

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-[18px] py-[11px] bg-[#07050f]/92 border-b border-[#a078ff]/15 backdrop-blur-[16px]">
        <Link to={createPageUrl("DashboardHub")} className="text-xs font-semibold tracking-wider uppercase text-purple-200/60 flex items-center gap-[5px] cursor-pointer transition-colors bg-transparent border-none hover:text-purple-400">
          ‹ Back
        </Link>
        <div className="flex items-center gap-[9px] text-decoration-none">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#1a0f35] to-[#0a0618] flex items-center justify-center text-[16px] shadow-[0_0_10px_rgba(167,139,250,0.25)]">
            🌙
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-purple-200/60">
            Reading Room
          </span>
        </div>
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#67e8f9] flex items-center justify-center text-xs text-white font-bold shadow-[0_0_10px_rgba(103,232,249,0.2)]">
          {currentUser ? (currentUser.full_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase() : 'GR'}
        </div>
      </nav>

      {/* Deck Selector Coverflow Design */}
      <CoverflowDeckSelector 
        publicDecks={publicDecks} 
        myDecks={myDecks} 
        onDrawCards={(deck) => {
          window.location.href = createPageUrl(`ReadingSetup?deckId=${deck.id}`);
        }} 
      />

      {/* Live Professional Reads (Supposed Integration) */}
      <div className="max-w-6xl mx-auto px-[18px] py-12 border-t border-[#a078ff]/15 mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Live Professional Readers
            </h2>
            <p className="text-sm text-purple-200/60">Connect with experienced oracles for a 1-on-1 live session.</p>
          </div>
          <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-900/40 rounded-full text-xs tracking-wider uppercase">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { name: "Sister Solstice", specialty: "Astrology & Tarot", status: "Online", rating: "4.9 (120)", price: "$2.99/min", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/c2f7036a0_GuardianofIn_Essence.JPEG" },
            { name: "Orion The Seer", specialty: "Spirit Wheel & Runes", status: "Busy", rating: "5.0 (84)", price: "$3.50/min", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/267d3a013_TheSilentObserver.JPEG" },
            { name: "Lyra Moon", specialty: "Shadow Work & Dreams", status: "Offline", rating: "4.8 (215)", price: "$2.50/min", img: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/8470a7550_LunaDuala.JPEG" },
          ].map((reader, idx) => (
            <div key={idx} className="bg-gradient-to-b from-[#1a0f35]/80 to-[#0a0618]/80 border border-[#a078ff]/20 rounded-2xl p-5 hover:border-cyan-400/40 transition-colors group">
              <div className="flex gap-4 items-start mb-4">
                <div className="relative">
                  <img src={reader.img} alt={reader.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30" />
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0a0618] ${reader.status === 'Online' ? 'bg-green-500' : reader.status === 'Busy' ? 'bg-amber-500' : 'bg-gray-500'}`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-100 tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>{reader.name}</h3>
                  <p className="text-xs text-cyan-300/80 mb-1">{reader.specialty}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-200/80">
                    <Sparkles className="w-3 h-3" /> {reader.rating}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-800/20">
                <span className="text-sm font-medium text-purple-200">{reader.price}</span>
                <Button 
                  size="sm" 
                  disabled={reader.status === 'Offline' || connectingReader === reader.name}
                  onClick={() => handleConnectLive(reader)}
                  className={`rounded-full px-5 text-xs tracking-wider uppercase font-semibold ${reader.status === 'Online' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0' : 'bg-white/5 text-white/40'}`}
                >
                  {connectingReader === reader.name ? 'Connecting...' : reader.status === 'Online' ? 'Connect Live' : reader.status === 'Busy' ? 'Join Queue' : 'Offline'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Video Session Overlay */}
      {liveSessionUrl && (
        <div className="fixed inset-0 z-[200] bg-[#07050f] flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4 border-b border-[#a078ff]/15 bg-[#1a0f35]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
              <span className="font-bold tracking-widest uppercase text-sm text-purple-100" style={{ fontFamily: "'Cinzel', serif" }}>
                Live Reading in Progress
              </span>
            </div>
            <Button variant="ghost" className="text-purple-300 hover:text-white hover:bg-red-900/50 rounded-full" onClick={() => setLiveSessionUrl(null)}>
              <X className="w-5 h-5 mr-2" /> End Session
            </Button>
          </div>
          <iframe 
            src={liveSessionUrl} 
            allow="camera; microphone; fullscreen; speaker; display-capture" 
            className="flex-1 w-full border-0 bg-black"
          />
        </div>
      )}

          </div>
          </PullToRefresh>
          );
          }