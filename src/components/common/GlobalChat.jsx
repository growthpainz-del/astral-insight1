import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, X, Send, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load initial messages
    base44.entities.ChatMessage.list("-created_date", 50)
      .then(res => {
        const sorted = (res || []).reverse();
        setMessages(sorted);
      })
      .catch(console.error);

    // Subscribe to new messages
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => {
          // avoid duplicates if we just sent it
          if (prev.find(m => m.id === event.id)) return prev;
          return [...prev, event.data];
        });
        
        // Increase unread count if panel is closed
        setIsOpen(prevIsOpen => {
          if (!prevIsOpen) {
            setUnreadCount(c => c + 1);
          }
          return prevIsOpen;
        });
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user || isSending) return;
    
    setIsSending(true);
    const text = input.trim();
    setInput("");
    
    try {
      await base44.entities.ChatMessage.create({
        user_id: user.id,
        user_name: user.full_name || user.email?.split("@")[0] || "Mystic",
        message: text,
        room_id: "global"
      });
    } catch(err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message");
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed z-50 bottom-24 right-4 md:bottom-6 md:right-6">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] border-2 border-purple-400/50 text-white relative flex items-center justify-center p-0 transition-transform hover:scale-105"
        >
          {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-[#07050f]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[60] bottom-40 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] md:w-[380px] h-[450px] max-h-[60vh] bg-[#0c081c]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-purple-900/40 border-b border-purple-500/30 p-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></div>
                <h3 className="text-sm font-bold text-purple-200 tracking-wider font-['Cinzel'] uppercase">Live Cosmic Chat</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-purple-300 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                  <MessageSquare className="w-8 h-8 text-purple-400 mb-2" />
                  <p className="text-sm text-purple-300">It's quiet in the cosmos...</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = user?.id === msg.user_id;
                  const showHeader = i === 0 || messages[i-1].user_id !== msg.user_id;
                  
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <span className={`text-[10px] text-purple-300/70 mb-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {isMe ? 'You' : msg.user_name}
                        </span>
                      )}
                      <div 
                        className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words ${
                          isMe 
                            ? 'bg-purple-600 text-white rounded-br-sm' 
                            : 'bg-slate-800/80 border border-purple-500/20 text-purple-100 rounded-bl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {user ? (
              <form onSubmit={handleSend} className="p-3 bg-black/40 border-t border-purple-500/30 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Whisper to the cosmos..."
                  className="flex-1 bg-slate-900/60 border border-purple-500/40 rounded-full px-4 py-2 text-sm text-white placeholder-purple-300/50 focus:outline-none focus:border-cyan-400"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isSending}
                  className="w-10 h-10 rounded-full p-0 shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.4)]"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </form>
            ) : (
              <div className="p-3 bg-black/40 border-t border-purple-500/30 text-center shrink-0">
                <p className="text-xs text-purple-300 opacity-70">Login to join the conversation</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}