import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Sparkles, AlertCircle, RotateCcw } from "lucide-react";
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
      <div className="min-h-screen relative bg-[#07050f] text-white font-['Crimson_Text']">

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-[18px] py-[11px] bg-[#07050f]/92 border-b border-[#a078ff]/15 backdrop-blur-[16px]">
        <Link to={createPageUrl("DashboardHub")} className="font-['Cinzel'] text-[10px] tracking-[0.14em] uppercase text-purple-200/45 flex items-center gap-[5px] cursor-pointer transition-colors bg-transparent border-none hover:text-purple-400">
          ‹ Back
        </Link>
        <div className="flex items-center gap-[9px] text-decoration-none">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#1a0f35] to-[#0a0618] flex items-center justify-center text-[16px] shadow-[0_0_10px_rgba(167,139,250,0.25)]">
            🌙
          </div>
          <span className="font-['Cinzel'] text-[10px] tracking-[0.22em] uppercase text-purple-200/45">
            Reading Room
          </span>
        </div>
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#67e8f9] flex items-center justify-center font-['Cinzel'] text-[10px] text-white font-bold shadow-[0_0_10px_rgba(103,232,249,0.2)]">
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

          </div>
          </PullToRefresh>
          );
          }