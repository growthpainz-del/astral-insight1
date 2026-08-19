import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Activity, Sparkles, User, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLivePresence() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadPresence = async () => {
    setIsLoading(true);
    try {
      const res = await base44.entities.User.list("-last_active_at", 100);
      setUsers(res || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to load presence", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresence();
    const interval = setInterval(loadPresence, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatus = (u) => {
    if (!u.last_active_at) return "offline";
    const diff = Date.now() - new Date(u.last_active_at).getTime();
    if (u.is_online && diff < 5 * 60 * 1000) return "online"; // active in last 5 mins
    if (diff < 15 * 60 * 1000) return "idle"; // active in last 15 mins
    return "offline";
  };

  const onlineUsers = users.filter(u => getStatus(u) === "online");
  const idleUsers = users.filter(u => getStatus(u) === "idle");
  const offlineUsers = users.filter(u => getStatus(u) === "offline").slice(0, 12); // just show a few recent offline

  const renderUserCard = (user, status) => {
    const statusColors = {
      online: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]",
      idle: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]",
      offline: "bg-slate-600"
    };

    const statusBorder = {
      online: "border-green-500/30 bg-green-900/10",
      idle: "border-yellow-500/30 bg-yellow-900/10",
      offline: "border-slate-700 bg-slate-900/40"
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        key={user.id}
        className={`p-4 rounded-xl border ${statusBorder[status]} flex items-start gap-4 transition-all hover:scale-105`}
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-purple-500/30 flex items-center justify-center text-purple-300">
            <User className="w-6 h-6" />
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${statusColors[status]}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{user.full_name || "Unknown Wanderer"}</h3>
          <p className="text-xs text-purple-300/70 truncate mb-1">{user.email}</p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>
              {user.last_active_at 
                ? new Date(user.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Never"}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-500/30 ml-auto">
              {user.role}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#100a20] to-black text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-500/20 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold font-['Cinzel'] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-cyan-300">
                Live Presence
              </h1>
            </div>
            <p className="text-purple-200/70">Real-time overview of active beta testers and readers.</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="text-slate-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button 
              onClick={loadPresence} 
              disabled={isLoading}
              className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Online Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-green-500/30 pb-2">
              <h2 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                Online Now
              </h2>
              <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-xs font-bold">
                {onlineUsers.length}
              </span>
            </div>
            <div className="space-y-3">
              {onlineUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No one is currently online
                </div>
              ) : (
                onlineUsers.map(u => renderUserCard(u, "online"))
              )}
            </div>
          </div>

          {/* Idle Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-yellow-500/30 pb-2">
              <h2 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                Idle (Recent)
              </h2>
              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-bold">
                {idleUsers.length}
              </span>
            </div>
            <div className="space-y-3">
              {idleUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No idle users
                </div>
              ) : (
                idleUsers.map(u => renderUserCard(u, "idle"))
              )}
            </div>
          </div>

          {/* Offline (Recent) Column */}
          <div className="space-y-4 opacity-70">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h2 className="text-lg font-semibold text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                Offline (Recent)
              </h2>
            </div>
            <div className="space-y-3">
              {offlineUsers.map(u => renderUserCard(u, "offline"))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}