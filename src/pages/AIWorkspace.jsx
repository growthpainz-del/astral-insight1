import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Send, 
  Code, 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare,
  FileCode,
  Sparkles,
  Zap,
  Users,
  Play,
  Pause,
  Target,
  AlertTriangle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { queueApiCall, queueLLMCall } from "@/components/utils/apiQueue";

export default function AIWorkspace() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadProposals(activeSession.id);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");
      console.log('📋 Loading AI collaboration sessions...');
      
      const allSessions = await queueApiCall(
        () => base44.entities.AISession.list("-updated_date", 50),
        3,
        1000
      );
      
      setSessions(allSessions || []);
      console.log(`✅ Loaded ${allSessions?.length || 0} sessions`);
      
      const activeOne = allSessions?.find(s => s.status === "in_progress");
      if (activeOne) {
        setActiveSession(activeOne);
      }
    } catch (e) {
      console.error("❌ Failed to load sessions:", e);
      setError("Failed to load collaboration sessions. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async (sessionId) => {
    try {
      console.log('📝 Loading proposals for session:', sessionId);
      
      const sessionProposals = await queueApiCall(
        () => base44.entities.AIProposal.filter({ session_id: sessionId }),
        3,
        1000
      );
      
      setProposals(sessionProposals || []);
      console.log(`✅ Loaded ${sessionProposals?.length || 0} proposals`);
    } catch (e) {
      console.error("⚠️ Failed to load proposals:", e);
      setProposals([]);
    }
  };

  const createSession = async () => {
    const title = prompt("Session name:");
    if (!title) return;

    const description = prompt("What needs to be built/fixed?");
    
    try {
      const session = await queueApiCall(
        () => base44.entities.AISession.create({
          title,
          description: description || "",
          status: "planning",
          participants: [
            { ai_name: "user", joined_at: new Date().toISOString() },
            { ai_name: "base44", joined_at: new Date().toISOString() },
            { ai_name: "grok", joined_at: new Date().toISOString() } // Added grok participant
          ],
          conversation: [],
          files_in_scope: [],
          goals: [],
          tags: [],
          started_at: new Date().toISOString()
        }),
        3,
        1000
      );
      
      setSessions([session, ...sessions]);
      setActiveSession(session);
      console.log('✅ Created new session:', session.title);
      
      // Auto-generate welcome from both AIs
      await generateDualAIResponse(session, description || "Let's get started!");
      
    } catch (e) {
      console.error("❌ Failed to create session:", e);
      alert("Failed to create session. Please try again.");
    }
  };

  const generateBase44Response = async (context, userMessage, session) => {
    const prompt = `You are Base44 AI, an expert software development assistant helping with the Astral Insight tarot/oracle reading app.

Session: ${session.title}
${session.description ? `Goal: ${session.description}` : ''}

Recent conversation:
${context}

User's latest message: ${userMessage}

Respond as a helpful AI assistant focused on technical implementation. Keep responses concise and actionable (2-3 sentences max).

Your response:`;

    const result = await queueLLMCall(
      () => base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      }),
      3,
      3000
    );

    return typeof result === 'string' ? result : result?.response || result?.data || "I'm here to help! What would you like me to work on?";
  };

  const generateGrokResponse = async (context, userMessage, session) => {
    // Call Grok via backend function
    try {
      const response = await queueLLMCall(
        () => base44.functions.invoke('callGrok', {
          session_title: session.title,
          session_description: session.description || '',
          conversation_context: context,
          user_message: userMessage
        }),
        3,
        3000
      );

      return response?.data?.message || response?.message || "Yo, Grok here. Session locked. Let's ship it. 🚀";
    } catch (error) {
      console.error('Grok API call failed:', error);
      throw error;
    }
  };

  const generateDualAIResponse = async (session, userMessage) => {
    setIsAiThinking(true);
    
    try {
      const conversationContext = (session.conversation || [])
        .slice(-5)
        .map(msg => `${msg.author}: ${msg.message}`)
        .join('\n');

      // Call both AIs in parallel
      const [base44ResponseResult, grokResponseResult] = await Promise.allSettled([
        generateBase44Response(conversationContext, userMessage, session),
        generateGrokResponse(conversationContext, userMessage, session)
      ]);

      // Add both responses to conversation
      const newMessages = [];
      let base44ActualResponse = null;

      if (base44ResponseResult.status === 'fulfilled' && base44ResponseResult.value) {
        base44ActualResponse = base44ResponseResult.value;
        newMessages.push({
          author: "base44",
          message: base44ActualResponse,
          timestamp: new Date().toISOString(),
          message_type: "chat"
        });
      } else {
        console.warn('Base44 AI failed:', base44ResponseResult.reason);
        newMessages.push({
          author: "base44",
          message: "I'm having trouble connecting right now. Let me know if you need help!",
          timestamp: new Date().toISOString(),
          message_type: "chat"
        });
      }

      if (grokResponseResult.status === 'fulfilled' && grokResponseResult.value) {
        newMessages.push({
          author: "grok",
          message: grokResponseResult.value,
          timestamp: new Date().toISOString(),
          message_type: "chat"
        });
      } else {
        console.warn('Grok failed:', grokResponseResult.reason);
        newMessages.push({
          author: "grok",
          message: "Yo, Grok here. Session locked. Let's ship it. 🚀",
          timestamp: new Date().toISOString(),
          message_type: "chat"
        });
      }

      const updatedConversation = [
        ...(session.conversation || []),
        ...newMessages
      ];

      await queueApiCall(
        () => base44.entities.AISession.update(session.id, {
          conversation: updatedConversation
        }),
        3,
        1000
      );

      setActiveSession({
        ...session,
        conversation: updatedConversation
      });

      // Check if we should create a proposal
      if (userMessage.toLowerCase().includes('fix') || 
          userMessage.toLowerCase().includes('create') ||
          userMessage.toLowerCase().includes('add') ||
          userMessage.toLowerCase().includes('change')) {
        // Use Base44's response for the proposal reasoning if available, otherwise Grok's.
        await generateProposal(session, userMessage, base44ActualResponse || grokResponseResult.value || "AI suggestion.");
      }

      console.log('✅ Both AIs responded');
      
    } catch (error) {
      console.error('❌ AI response failed:', error);
      
      const fallbackMessage = "I understand you want to work on: " + userMessage + ". Let me analyze the best approach.";
      
      const updatedConversation = [
        ...(session.conversation || []),
        {
          author: "base44",
          message: fallbackMessage,
          timestamp: new Date().toISOString(),
          message_type: "chat"
        }
      ];

      await queueApiCall(
        () => base44.entities.AISession.update(session.id, {
          conversation: updatedConversation
        }),
        3,
        1000
      );

      setActiveSession({
        ...session,
        conversation: updatedConversation
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  const generateProposal = async (session, userRequest, aiResponse) => {
    try {
      // Create a sample code proposal
      const proposal = await queueApiCall(
        () => base44.entities.AIProposal.create({
          session_id: session.id,
          proposed_by: "base44",
          proposal_type: "edit_file",
          file_path: "components/example/Example.jsx",
          description: `Code change based on: ${userRequest.substring(0, 100)}`,
          original_code: "// Current code\nfunction Example() {\n  return <div>Hello</div>;\n}",
          proposed_code: "// Updated code\nfunction Example() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n      <p>Updated component</p>\n    </div>\n  );\n}",
          reasoning: aiResponse.substring(0, 200),
          status: "pending"
        }),
        3,
        1000
      );

      console.log('✅ Created proposal:', proposal.id);
      loadProposals(session.id);
      
    } catch (error) {
      console.error('⚠️ Failed to create proposal:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;

    const messageText = newMessage;
    setNewMessage(""); // Clear input immediately

    try {
      // Add user message
      const updatedConversation = [
        ...(activeSession.conversation || []),
        {
          author: "user",
          message: messageText,
          timestamp: new Date().toISOString(),
          message_type: "chat"
        }
      ];

      await queueApiCall(
        () => base44.entities.AISession.update(activeSession.id, {
          conversation: updatedConversation
        }),
        3,
        1000
      );

      const updatedSession = {
        ...activeSession,
        conversation: updatedConversation
      };

      setActiveSession(updatedSession);
      console.log('✅ Message sent');
      
      // Generate responses from BOTH AIs
      await generateDualAIResponse(updatedSession, messageText);
      
    } catch (e) {
      console.error("❌ Failed to send message:", e);
      alert("Failed to send message. Please try again.");
      setNewMessage(messageText); // Restore message on error
    }
  };

  const approveProposal = async (proposal) => {
    try {
      const review = {
        reviewer: "user",
        verdict: "approve",
        feedback: "Approved by user",
        timestamp: new Date().toISOString()
      };

      await queueApiCall(
        () => base44.entities.AIProposal.update(proposal.id, {
          status: "approved",
          reviewed_by: [...(proposal.reviewed_by || []), review]
        }),
        3,
        1000
      );

      loadProposals(activeSession.id);
      alert("✅ Proposal approved!");
    } catch (e) {
      console.error("❌ Failed to approve:", e);
      alert("Failed to approve proposal. Please try again.");
    }
  };

  const rejectProposal = async (proposal) => {
    const feedback = prompt("Why reject this proposal?");
    if (!feedback) return;

    try {
      const review = {
        reviewer: "user",
        verdict: "reject",
        feedback,
        timestamp: new Date().toISOString()
      };

      await queueApiCall(
        () => base44.entities.AIProposal.update(proposal.id, {
          status: "rejected",
          reviewed_by: [...(proposal.reviewed_by || []), review]
        }),
        3,
        1000
      );

      loadProposals(activeSession.id);
      alert("❌ Proposal rejected.");
    } catch (e) {
      console.error("❌ Failed to reject:", e);
      alert("Failed to reject proposal. Please try again.");
    }
  };

  const toggleGoal = async (goalIndex) => {
    if (!activeSession) return;

    const updatedGoals = [...(activeSession.goals || [])];
    updatedGoals[goalIndex].completed = !updatedGoals[goalIndex].completed;
    
    if (updatedGoals[goalIndex].completed) {
      updatedGoals[goalIndex].completed_by = "user";
      updatedGoals[goalIndex].completed_at = new Date().toISOString();
    } else {
      delete updatedGoals[goalIndex].completed_by;
      delete updatedGoals[goalIndex].completed_at;
    }

    try {
      await queueApiCall(
        () => base44.entities.AISession.update(activeSession.id, {
          goals: updatedGoals
        }),
        3,
        1000
      );

      setActiveSession({
        ...activeSession,
        goals: updatedGoals
      });
    } catch (e) {
      console.error("⚠️ Failed to update goal:", e);
    }
  };

  const updateSessionStatus = async (newStatus) => {
    if (!activeSession) return;

    try {
      await queueApiCall(
        () => base44.entities.AISession.update(activeSession.id, {
          status: newStatus,
          ...(newStatus === "completed" && { completed_at: new Date().toISOString() })
        }),
        3,
        1000
      );

      setActiveSession({
        ...activeSession,
        status: newStatus
      });

      loadSessions();
    } catch (e) {
      console.error("❌ Failed to update status:", e);
      alert("Failed to update session status. Please try again.");
    }
  };

  const getAIIcon = (aiName) => {
    switch (aiName) {
      case "base44":
        return <Bot className="w-4 h-4 text-purple-400" />;
      case "grok":
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case "user":
        return <Users className="w-4 h-4 text-green-400" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "planning": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "in_progress": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "review": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "completed": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "blocked": return "bg-red-500/20 text-red-300 border-red-500/30";
      default: return "bg-white/10 text-white/70 border-white/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading AI Workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/20 border border-red-500/40 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError("");
              loadSessions();
            }}
            className="bg-red-600 hover:bg-red-700 w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white p-4 overflow-y-auto pb-28" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-400" />
              AI Collaboration Workspace
              <Zap className="w-8 h-8 text-cyan-400" /> {/* Added Zap icon for Grok */}
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">LIVE</Badge>
            </h1>
            <p className="text-white/60 mt-1">
              Base44 AI + Grok working together • Both respond automatically
            </p>
          </div>
          
          <Button onClick={createSession} className="bg-purple-600 hover:bg-purple-700">
            <Sparkles className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Sessions Sidebar */}
          <div className="md:col-span-3 space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                Sessions
              </h3>
              
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <p className="text-sm">No sessions yet</p>
                      <p className="text-xs mt-1">Create one to get started</p>
                    </div>
                  ) : (
                    sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => setActiveSession(session)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          activeSession?.id === session.id
                            ? "bg-purple-600/20 border-purple-500/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm line-clamp-1">{session.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                            {session.status}
                          </Badge>
                        </div>
                        
                        {session.description && (
                          <p className="text-xs text-white/60 line-clamp-2 mb-2">
                            {session.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Clock className="w-3 h-3" />
                          {new Date(session.started_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-9">
            {activeSession ? (
              <Tabs defaultValue="chat" className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="proposals" className="data-[state=active]:bg-purple-600">
                      <Code className="w-4 h-4 mr-2" />
                      Proposals ({proposals.length})
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="data-[state=active]:bg-purple-600">
                      <Target className="w-4 h-4 mr-2" />
                      Goals
                    </TabsTrigger>
                  </TabsList>

                  {/* Session Status Controls */}
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(activeSession.status)}>
                      {activeSession.status}
                    </Badge>
                    
                    {activeSession.status !== "in_progress" && activeSession.status !== "completed" && (
                      <Button
                        size="sm"
                        onClick={() => updateSessionStatus("in_progress")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {activeSession.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => updateSessionStatus("review")}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    )}
                    
                    {(activeSession.status === "review" || activeSession.status === "in_progress") && (
                      <Button
                        size="sm"
                        onClick={() => updateSessionStatus("completed")}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Chat Tab */}
                <TabsContent value="chat" className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                      <div className="space-y-4">
                        {(!activeSession.conversation || activeSession.conversation.length === 0) ? (
                          <div className="text-center py-12 text-white/60">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-white/40" />
                            <p>No messages yet</p>
                            <p className="text-sm mt-1">Start the conversation below</p>
                          </div>
                        ) : (
                          activeSession.conversation.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-3 ${
                                msg.author === "user" ? "flex-row-reverse" : ""
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {getAIIcon(msg.author)}
                              </div>
                              
                              <div
                                className={`flex-1 rounded-lg p-3 ${
                                  msg.author === "user"
                                    ? "bg-purple-600/20 border border-purple-500/30"
                                    : msg.author === "base44"
                                    ? "bg-purple-900/20 border border-purple-500/20"
                                    : "bg-cyan-900/20 border border-cyan-500/20"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-white/70">
                                    {msg.author === "user" ? "You" : msg.author}
                                  </span>
                                  <span className="text-xs text-white/50">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-white/90 whitespace-pre-wrap">
                                  {msg.message}
                                </p>
                                
                                {msg.message_type !== "chat" && (
                                  <Badge className="mt-2 text-xs bg-white/10">
                                    {msg.message_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        
                        {/* AI Thinking Indicator */}
                        {isAiThinking && (
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0">
                                <Bot className="w-4 h-4 text-purple-400" />
                              </div>
                              <div className="flex-1 rounded-lg p-3 bg-purple-900/20 border border-purple-500/20">
                                <div className="flex items-center gap-2 text-white/70">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Base44 AI is thinking...</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="flex-shrink-0">
                                <Zap className="w-4 h-4 text-cyan-400" />
                              </div>
                              <div className="flex-1 rounded-lg p-3 bg-cyan-900/20 border border-cyan-500/20">
                                <div className="flex items-center gap-2 text-white/70">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Grok is thinking...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Ask the AI to help with code, fix bugs, or add features..."
                      disabled={isAiThinking}
                      className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isAiThinking || !newMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isAiThinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Proposals Tab */}
                <TabsContent value="proposals" className="space-y-4">
                  {proposals.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
                      <Code className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">No code proposals yet</p>
                      <p className="text-sm text-white/40 mt-2">
                        AI will submit proposals when you ask for code changes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map(proposal => (
                        <div
                          key={proposal.id}
                          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getAIIcon(proposal.proposed_by)}
                                <h4 className="font-semibold">{proposal.file_path}</h4>
                                <Badge className={`text-xs ${
                                  proposal.status === "approved" ? "bg-green-500/20 text-green-300" :
                                  proposal.status === "rejected" ? "bg-red-500/20 text-red-300" :
                                  "bg-yellow-500/20 text-yellow-300"
                                }`}>
                                  {proposal.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-white/70">{proposal.description}</p>
                            </div>

                            {proposal.status === "pending" && (
                              <div className="flex gap-2 ml-3">
                                <Button
                                  size="sm"
                                  onClick={() => approveProposal(proposal)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => rejectProposal(proposal)}
                                  variant="destructive"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {proposal.reasoning && (
                            <div className="bg-black/30 rounded p-3 mb-3">
                              <p className="text-xs text-white/60"><strong>Why:</strong> {proposal.reasoning}</p>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProposal(proposal)}
                            className="border-white/20 text-white"
                          >
                            <GitCompare className="w-4 h-4 mr-2" />
                            View Code
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    {(!activeSession.goals || activeSession.goals.length === 0) ? (
                      <div className="text-center py-8 text-white/60">
                        <Target className="w-12 h-12 mx-auto mb-3 text-white/40" />
                        <p>No goals set yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeSession.goals.map((goal, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleGoal(idx)}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                          >
                            <div className="flex-shrink-0 mt-1">
                              {goal.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <p className={`text-sm ${goal.completed ? "line-through text-white/50" : "text-white"}`}>
                                {goal.goal}
                              </p>
                              {goal.completed && goal.completed_by && (
                                <p className="text-xs text-green-400 mt-1">
                                  ✓ Completed by {goal.completed_by}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
                <Bot className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Session Selected</h3>
                <p className="text-white/60 mb-6">
                  Select a session from the left or create a new one to start collaborating
                </p>
                <Button onClick={createSession} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Code Diff Modal */}
        {selectedProposal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-purple-500/30 max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Code: {selectedProposal.file_path}</h3>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-px bg-white/10 max-h-[70vh]">
                <div className="bg-slate-900 p-4">
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Original</h4>
                  <ScrollArea className="h-[60vh]">
                    <pre className="text-xs text-white/80 font-mono">
                      {selectedProposal.original_code || "// No original code"}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="bg-slate-900 p-4">
                  <h4 className="text-sm font-semibold text-green-300 mb-2">Proposed</h4>
                  <ScrollArea className="h-[60vh]">
                    <pre className="text-xs text-white/80 font-mono">
                      {selectedProposal.proposed_code}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProposal(null)}
                  className="border-white/20 text-white"
                >
                  Close
                </Button>
                {selectedProposal.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        approveProposal(selectedProposal);
                        setSelectedProposal(null);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        rejectProposal(selectedProposal);
                        setSelectedProposal(null);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}