import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import MessageBubble from "@/components/agents/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquarePlus, Sparkles, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isUserAdmin } from "@/components/utils/adminGuard";

export default function AgentChat() {
    const [agentName, setAgentName] = useState("cosmic_oracle_chronicler");
    const [conversationId, setConversationId] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const scrollRef = useRef(null);

    // List of agents
    const agents = [
        { id: "cosmic_oracle_chronicler", name: "Oracle Chronicler (Frenzie)" },
        { id: "astral_insight_guide", name: "Astral Insight Guide (Admin)" },
    ];

    useEffect(() => {
        base44.auth.me().then(setUser).catch(console.error);
    }, []);

    // Create/Load on mount or agent change
    useEffect(() => {
        const initChat = async () => {
            setLoading(true);
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const initialMessage = searchParams.get("initialMessage");

                let currentConv;
                if (initialMessage) {
                    currentConv = await base44.agents.createConversation({
                        agent_name: agentName,
                        metadata: { name: `Chat with ${agentName}` }
                    });
                    await base44.agents.addMessage(currentConv, { role: "user", content: initialMessage });
                    // Clear the parameter to avoid resending on refresh
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    const convos = await base44.agents.listConversations({ agent_name: agentName });
                    if (convos && convos.length > 0) {
                        currentConv = convos[0];
                    } else {
                        currentConv = await base44.agents.createConversation({
                            agent_name: agentName,
                            metadata: { name: `Chat with ${agentName}` }
                        });
                    }
                }
                setConversation(currentConv);
                setConversationId(currentConv.id);
            } catch (err) {
                console.error("Failed to init chat:", err);
            } finally {
                setLoading(false);
            }
        };
        initChat();
    }, [agentName]);

    // Subscription effect
    useEffect(() => {
        if (!conversationId) return;
        
        const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
            setMessages(data.messages || []);
        });

        return () => {
            unsubscribe();
        };
    }, [conversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || !conversation) return;
        
        const userMsg = input.trim();
        setInput("");
        
        try {
            await base44.agents.addMessage(conversation, {
                role: "user",
                content: userMsg
            });
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleNewChat = async () => {
        setLoading(true);
        try {
            const currentConv = await base44.agents.createConversation({
                agent_name: agentName,
                metadata: { name: `New Chat with ${agentName}` }
            });
            setConversation(currentConv);
            setConversationId(currentConv.id);
            setMessages([]);
        } catch (err) {
            console.error("Failed to create new chat:", err);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user ? isUserAdmin(user) : false;
    const availableAgents = isAdmin ? agents : agents.filter(a => a.id === "cosmic_oracle_chronicler");

    return (
        <div className="p-4 md:p-6 h-[calc(100dvh-4rem)] md:h-[calc(100vh-2rem)] max-h-screen">
            <div className="flex flex-col h-full bg-slate-900/80 border border-purple-500/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-purple-500/20 bg-slate-900/90 z-10 relative">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-purple-400 hidden md:block" />
                        <Select value={agentName} onValueChange={setAgentName}>
                            <SelectTrigger className="w-[200px] md:w-[250px] bg-slate-800 border-slate-700 text-white font-medium">
                                <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {availableAgents.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleNewChat} variant="outline" size="sm" className="border-purple-500/30 hover:bg-purple-500/20 text-purple-300">
                        <MessageSquarePlus className="w-4 h-4 mr-2 hidden md:block" />
                        New Chat
                    </Button>
                </div>

                {/* Chat Area */}
                <ScrollArea className="flex-1 p-4 md:p-6">
                    <div className="max-w-3xl mx-auto space-y-6 pb-6">
                        {messages.length === 0 && !loading && (
                            <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-4">
                                    <Sparkles className="w-8 h-8 text-purple-400 opacity-80" />
                                </div>
                                <p className="text-lg font-medium text-slate-300">Start a conversation with {agents.find(a => a.id === agentName)?.name}</p>
                                <p className="text-sm mt-2 max-w-md">Ask questions, draw cards, or explore the mysteries of the oracle.</p>
                            </div>
                        )}
                        
                        {messages.map((msg, idx) => (
                            <MessageBubble key={idx} message={msg} />
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/95 border-t border-purple-500/20 z-10 relative">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask the oracle a question..."
                            className="w-full bg-slate-800/80 border-slate-700 text-white pr-12 py-6 rounded-2xl focus-visible:ring-purple-500 shadow-inner"
                        />
                        <Button 
                            type="submit" 
                            size="icon"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}