import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Sparkles, AlertCircle, RotateCcw, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queueApiCall } from "@/components/utils/apiQueue";
import PullToRefresh from "@/components/common/PullToRefresh";

import CoverflowDeckSelector from "@/components/reading/CoverflowDeckSelector";
import ReadingStage from "@/components/reading/ReadingStage";

export default function ReadingRoom() {
  const [searchParams] = useSearchParams();
  const [publicDecks, setPublicDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [connectingReader, setConnectingReader] = useState(null);
  const [liveSessionUrl, setLiveSessionUrl] = useState(null);
  const [joinInput, setJoinInput] = useState("");
  const [hostedToken, setHostedToken] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [deckCards, setDeckCards] = useState([]);

  const handleCopyInvite = () => {
    const url = `${window.location.origin}${createPageUrl("ReadingRoom")}`;
    const text = `Join my live reading session! Go to ${url} and enter invite code: ${hostedToken}`;
    navigator.clipboard.writeText(text);
    alert("Invite copied to clipboard!");
  };

  const createHostSession = async () => {
    setConnectingReader('creating');
    try {
      const res = await base44.functions.invoke('createLiveRoom', {});
      if (res.data?.roomUrl) {
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();
        const defaultDeckId = publicDecks[0]?.id || myDecks[0]?.id;
        const session = await base44.entities.ReadingSession.create({
          reader_id: currentUser?.id || "guest",
          invite_token: token,
          spread_type: 'live_video',
          deck_id: defaultDeckId,
          card_positions: [],
          status: 'active',
          room_url: res.data.roomUrl,
          host_room_url: res.data.hostRoomUrl
        });
        setHostedToken(token);
        setLiveSessionUrl(res.data.hostRoomUrl);
        setActiveSession(session);
      } else {
        alert('Failed to create room: ' + JSON.stringify(res.data || res.error || res));
      }
    } catch (e) {
      alert('Error creating live session: ' + e.message);
    } finally {
      setConnectingReader(null);
    }
  };

  const joinSession = async () => {
    if (!joinInput.trim()) return;
    setConnectingReader('joining');
    try {
      const sessions = await base44.entities.ReadingSession.filter({ invite_token: joinInput.trim().toUpperCase() });
      if (sessions && sessions.length > 0) {
        setLiveSessionUrl(sessions[0].room_url);
        setActiveSession(sessions[0]);
      } else {
        alert("Invalid invite code. Please check and try again.");
      }
    } catch(e) {
       alert("Error joining session: " + e.message);
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

  useEffect(() => {
    if (activeSession?.deck_id) {
      base44.entities.Card.filter({ deck_id: activeSession.deck_id }).then(setDeckCards);
    }
  }, [activeSession?.deck_id]);



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

      {/* Live Video Readings Section */}
      <div className="max-w-6xl mx-auto px-[18px] py-12 border-t border-[#a078ff]/15 mt-8">
        {activeSession ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                Active Session
              </h2>
              {hostedToken && <p className="text-sm text-purple-200">Invite Code: <strong>{hostedToken}</strong></p>}
            </div>
            
            <ReadingStage 
              session={activeSession} 
              interactive={activeSession.reader_id === (currentUser?.id || "guest")} 
              deckCards={deckCards} 
            />

            {liveSessionUrl && (
               <div className="mt-8 h-[120px] rounded-xl overflow-hidden border border-[#a078ff]/30 bg-[#0a0618]">
                 <iframe 
                   src={`${liveSessionUrl}${liveSessionUrl.includes('?') ? '&' : '?'}embed=true&audio=on&video=off&background=off&leaveButton=off&chat=off&people=off`} 
                   allow="camera; microphone; fullscreen; speaker; display-capture" 
                   className="w-full h-full border-0"
                 />
               </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                Live 1-on-1 Readings
              </h2>
              <p className="text-sm text-purple-200/60 max-w-xl mx-auto">Connect directly in a private live video space. Host a reading for a client, or join an existing session using an invite code.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Join Session Card */}
              <div className="bg-gradient-to-b from-[#1a0f35]/80 to-[#0a0618]/80 border border-[#a078ff]/30 rounded-2xl p-6 md:p-8 hover:border-cyan-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-300">
                      <Video className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-['Cinzel'] tracking-wide">Join a Session</h3>
                  </div>
                  <p className="text-sm text-purple-200/70 mb-6 leading-relaxed">
                    Have an invite code from your reader? Enter it below to join your private video reading immediately.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Enter Invite Code (e.g. AB12CD)" 
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#07050f] border border-purple-500/40 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 text-center tracking-widest font-mono"
                  />
                  <Button 
                    onClick={joinSession} 
                    disabled={!joinInput.trim() || connectingReader === 'joining'}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold tracking-wider uppercase py-6"
                  >
                    {connectingReader === 'joining' ? 'Joining...' : 'Join Reading'}
                  </Button>
                </div>
              </div>

              {/* Host Session Card */}
              <div className="bg-gradient-to-b from-[#1a0f35]/80 to-[#0a0618]/80 border border-[#a078ff]/30 rounded-2xl p-6 md:p-8 hover:border-purple-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-purple-500/20 text-purple-300">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-['Cinzel'] tracking-wide">Host a Session</h3>
                  </div>
                  <p className="text-sm text-purple-200/70 mb-6 leading-relaxed">
                    Are you an oracle or reader? Generate an instant live session room and share the invite code with your client.
                  </p>
                </div>

                <div className="space-y-4">
                  {hostedToken && (
                    <div className="bg-purple-900/40 border border-purple-500/50 rounded-xl p-4 text-center relative group">
                      <p className="text-xs text-purple-200 uppercase tracking-widest mb-2">Your Invite Code</p>
                      <p className="text-3xl font-bold text-white tracking-widest font-mono select-all mb-4">{hostedToken}</p>
                      <Button 
                        onClick={handleCopyInvite}
                        variant="outline" 
                        className="w-full bg-[#0a0618] border-purple-500/50 hover:bg-purple-800 hover:text-white"
                      >
                        Copy Invite Message
                      </Button>
                    </div>
                  )}
                  <Button 
                    onClick={createHostSession} 
                    disabled={connectingReader === 'creating'}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold tracking-wider uppercase py-6"
                  >
                    {connectingReader === 'creating' ? 'Creating Room...' : hostedToken ? 'Re-open Room' : 'Start Hosting'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>



          </div>
          </PullToRefresh>
          );
          }