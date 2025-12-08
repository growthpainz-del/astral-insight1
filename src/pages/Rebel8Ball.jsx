
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skull, ArrowLeft, History, Trash2, Zap, Flame, Heart, Briefcase, Sparkles, Filter, Loader2, VideoOff, AlertCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ScrollArea } from "@/components/ui/scroll-area";
import TokenCostPreview from "@/components/pricing/TokenCostPreview";

// Simple 8-ball answers (YES/NO/MAYBE/ASK AGAIN)
const simple8BallAnswers = [
  // YES answers
  { text: "YES", type: "affirmative" },
  { text: "HELL YES", type: "affirmative" },
  { text: "ABSOLUTELY", type: "affirmative" },
  { text: "FOR SURE", type: "affirmative" },
  { text: "COUNT ON IT", type: "affirmative" },
  
  // NO answers
  { text: "NO", type: "negative" },
  { text: "HELL NO", type: "negative" },
  { text: "NOT A CHANCE", type: "negative" },
  { text: "FORGET IT", type: "negative" },
  { text: "NEVER", type: "negative" },
  
  // MAYBE answers
  { text: "MAYBE", type: "neutral" },
  { text: "UNCLEAR", type: "neutral" },
  { text: "POSSIBLY", type: "neutral" },
  { text: "CAN'T SAY", type: "neutral" },
  
  // ASK AGAIN answers
  { text: "ASK AGAIN", type: "neutral" },
  { text: "TRY LATER", type: "neutral" },
  { text: "NOT NOW", type: "neutral" },
];

// AI Personas with their personality descriptions
const AI_PERSONAS = [
  {
    id: "attenborough",
    name: "David Attenborough",
    icon: "🎬",
    description: "Nature documentary narrator with observational wisdom",
    systemPrompt: "You are David Attenborough providing commentary on life decisions as if narrating a nature documentary. Be observational, wise, and poetic. Reference nature and survival. Keep it under 3 sentences."
  },
  {
    id: "trump",
    name: "Donald Trump",
    icon: "💼",
    description: "Bombastic businessman with superlatives",
    systemPrompt: "You are Donald Trump giving advice. Use superlatives like 'tremendous', 'huge', 'the best'. Be confident and bombastic. Occasionally mention deals and winning. Keep it under 3 sentences."
  },
  {
    id: "roseanne",
    name: "Roseanne",
    icon: "🏠",
    description: "Sarcastic working-class realism",
    systemPrompt: "You are Roseanne Barr giving blunt, sarcastic advice from a working-class perspective. Be realistic, funny, and don't sugarcoat things. Keep it under 3 sentences."
  },
  {
    id: "vedder",
    name: "Eddie Vedder",
    icon: "🎸",
    description: "Grunge philosopher with introspective wisdom",
    systemPrompt: "You are Eddie Vedder from Pearl Jam giving philosophical, introspective advice. Be poetic, slightly melancholic, and deep. Reference struggle and authenticity. Keep it under 3 sentences."
  },
  {
    id: "grumpy",
    name: "Grumpy Old Man",
    icon: "👴",
    description: "Complaints and 'back in my day' wisdom",
    systemPrompt: "You are a grumpy old man complaining about everything. Start with 'Back in my day...' or similar. Be cranky but occasionally accidentally wise. Keep it under 3 sentences."
  },
  {
    id: "pretentious",
    name: "Pretentious Intellectual",
    icon: "🎩",
    description: "Verbose intellectual elitism",
    systemPrompt: "You are a pretentious intellectual giving overly verbose advice. Use big words, reference obscure philosophy, and be condescending. Act superior. Keep it under 3 sentences but make them dense."
  },
  {
    id: "brat",
    name: "Spoiled Brat",
    icon: "👑",
    description: "Entitled and whiny demands",
    systemPrompt: "You are a spoiled brat giving entitled, whiny advice. Complain about things being unfair, demand things, and be bratty. Use phrases like 'I want' and 'It's not fair'. Keep it under 3 sentences."
  },
  {
    id: "stoic",
    name: "Stoic Philosopher",
    icon: "🏛️",
    description: "Marcus Aurelius-style emotionless wisdom",
    systemPrompt: "You are a Stoic philosopher like Marcus Aurelius. Give emotionless, rational wisdom about accepting what you cannot control. Be calm and philosophical. Keep it under 3 sentences."
  },
  {
    id: "military",
    name: "Military Officer",
    icon: "⭐",
    description: "Authoritative disciplined commands",
    systemPrompt: "You are a military officer giving orders disguised as advice. Be authoritative, disciplined, and direct. Use military terminology. End with 'Dismissed!' or similar. Keep it under 3 sentences."
  },
  {
    id: "rogers",
    name: "Mr. Rogers",
    icon: "🏡",
    description: "Gentle, kind neighborly advice",
    systemPrompt: "You are Mr. Rogers from Mr. Rogers' Neighborhood. Be gentle, kind, and nurturing. Make the person feel special and valued. Use phrases like 'neighbor' and be wholesome. Keep it under 3 sentences."
  },
  {
    id: "irish",
    name: "Irish Police Officer",
    icon: "🍀",
    description: "Procedural wisdom with Irish charm",
    systemPrompt: "You are an Irish police officer (Garda) giving advice. Use Irish expressions, be charming but firm. Say things like 'Now, now' and 'Right so'. Keep it under 3 sentences."
  },
];

const categoryIcons = {
  love: Heart,
  career: Briefcase,
  life: Sparkles,
  rebellion: Flame,
  custom: Zap
};

export default function Rebel8BallPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("life");
  const [customTone, setCustomTone] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("attenborough");
  const [isShaking, setIsShaking] = useState(false);
  const [answer, setAnswer] = useState({ text: null, type: 'initial' });
  const [aiCommentary, setAiCommentary] = useState("");
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [customVideoUrl, setCustomVideoUrl] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [activeTab, setActiveTab] = useState("fortune");
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const ballRef = useRef(null);
  const fileInputRef = useRef(null);
  const chimeAudioRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const userHistory = await base44.entities.Rebel8Ball.filter({ created_by: user.email }, "-created_date", 50);
      setHistory(userHistory);
      setFilteredHistory(userHistory);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError(`Failed to load history: ${err.message}.`);
    }
  }, [user]);

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser.rebel_8_ball_video_url) {
          setCustomVideoUrl(currentUser.rebel_8_ball_video_url);
        }
        
        // Load saved persona preference
        if (currentUser.rebel_8_ball_persona) {
          setSelectedPersona(currentUser.rebel_8_ball_persona);
        }
        
        setError(null);
      } catch (e) {
        console.log("Not logged in or failed to fetch user:", e);
      }
    };
    fetchUserAndHistory();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  useEffect(() => {
    if (historyFilter === "all") {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(item => item.category === historyFilter));
    }
  }, [history, historyFilter]);

  const handlePersonaChange = async (personaId) => {
    setSelectedPersona(personaId);
    
    // Save preference to user profile
    if (user) {
      try {
        await base44.auth.updateMe({ rebel_8_ball_persona: personaId });
      } catch (err) {
        console.error("Failed to save persona preference:", err);
      }
    }
  };

  const generateAICommentary = async (question, simpleAnswer, personaId) => {
    const persona = AI_PERSONAS.find(p => p.id === personaId);
    if (!persona) return "...";

    try {
      setIsGeneratingCommentary(true);

      const prompt = `${persona.systemPrompt}

Question: "${question}"
8-Ball Answer: ${simpleAnswer}

Provide your commentary on this answer in your unique voice. Be entertaining and stay in character.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      return response || "...";
    } catch (error) {
      console.error("AI commentary generation failed:", error);
      return "The spirits are unclear...";
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || isShaking) return;
    if (category === "custom" && !customTone.trim()) {
      alert("Please enter a custom tone/vibe for your question!");
      return;
    }

    setIsShaking(true);
    setAnswer({ text: '...', type: 'shaking' });
    setAiCommentary("");
    setError(null);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
    }

    try {
      // Wait for shake animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get simple 8-ball answer
      const selectedAnswer = simple8BallAnswers[Math.floor(Math.random() * simple8BallAnswers.length)];

      if (chimeAudioRef.current) {
        chimeAudioRef.current.currentTime = 0;
        chimeAudioRef.current.play().catch(e => console.warn("Chime audio play failed:", e));
      }

      setAnswer(selectedAnswer);
      setIsShaking(false);

      // Generate AI commentary
      const commentary = await generateAICommentary(question, selectedAnswer.text, selectedPersona);
      setAiCommentary(commentary);

      // Save to history
      if (user) {
        const newHistoryItemData = {
          question,
          category,
          custom_tone: category === "custom" ? customTone : undefined,
          answer: selectedAnswer.text,
          answer_type: selectedAnswer.type,
          ai_commentary: commentary,
          persona_id: selectedPersona,
          persona_name: AI_PERSONAS.find(p => p.id === selectedPersona)?.name,
          timestamp: new Date().toISOString()
        };
        await base44.entities.Rebel8Ball.create(newHistoryItemData);
        fetchHistory();
      }
      
      setQuestion("");

    } catch (err) {
      console.error("Error asking Rebel 8-Ball:", err);
      setError(`Failed to process your question: ${err.message}. Please try again.`);
      setAnswer({ text: "ERROR", type: "neutral" });
      setIsShaking(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await base44.entities.Rebel8Ball.delete(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      console.error("Failed to delete history item:", err);
      setError(`Failed to delete history item: ${err.message}.`);
    }
  };

  const getAnswerColor = (type) => {
    switch (type) {
      case 'affirmative': return 'text-green-400 shadow-green-400/50';
      case 'negative': return 'text-red-400 shadow-red-400/50';
      case 'neutral': return 'text-purple-400 shadow-purple-400/50';
      case 'shaking': return 'text-gray-400 shadow-gray-400/50';
      default: return 'text-white/80';
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      love: 'text-pink-400',
      career: 'text-green-400',
      life: 'text-purple-400',
      rebellion: 'text-red-400',
      custom: 'text-yellow-400'
    };
    return colors[cat] || 'text-gray-400';
  };

  const getBadgeColors = (category) => {
    switch (category) {
      case 'love': return { bg: 'bg-pink-500/20', text: 'text-pink-300' };
      case 'career': return { bg: 'bg-green-500/20', text: 'text-green-300' };
      case 'life': return { bg: 'bg-purple-500/20', text: 'text-purple-300' };
      case 'rebellion': return { bg: 'bg-red-500/20', text: 'text-red-300' };
      case 'custom': return { bg: 'bg-yellow-500/20', text: 'text-yellow-300' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-300' };
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Video file is too large. Please use a file under 50MB.');
      return;
    }

    setIsUploadingVideo(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCustomVideoUrl(file_url);

      if (user) {
        await base44.auth.updateMe({ rebel_8_ball_video_url: file_url });
        setUser(prevUser => ({ ...prevUser, rebel_8_ball_video_url: file_url }));
      }

      alert('Video uploaded successfully!');
    } catch (uploadError) {
      console.error('Video upload failed:', uploadError);
      setError(`Video upload failed: ${uploadError.message}.`);
      alert('Upload failed. Please try again.');
    } finally {
      e.target.value = '';
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    setError(null);
    try {
      setCustomVideoUrl(null);
      if (user) {
        await base44.auth.updateMe({ rebel_8_ball_video_url: null });
        setUser(prevUser => ({ ...prevUser, rebel_8_ball_video_url: null }));
      }
      alert('Custom video removed.');
    } catch (removeError) {
      console.error('Failed to remove video:', removeError);
      setError(`Failed to remove video: ${removeError.message}.`);
      alert('Failed to remove video.');
    }
  };

  const currentPersona = AI_PERSONAS.find(p => p.id === selectedPersona);

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-texture-grunge opacity-10"></div>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent"></div>
      </div>

      <audio ref={audioRef} src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/c03d15479_bell.mp3" preload="auto"></audio>
      <audio ref={chimeAudioRef} src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/4a3f338d-8a21-4f11-85e7-a9a51d95015e.mp3" preload="auto"></audio>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate(createPageUrl("ReadingRoom"))}
            variant="outline"
            className="border-pink-500 text-pink-400 hover:bg-pink-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-2">
              REBEL 8-BALL
            </h1>
            <p className="text-gray-400">AI-Powered Fortune Teller</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingVideo}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isUploadingVideo ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isUploadingVideo ? "Uploading..." : "Upload Video"}
            </Button>

            {customVideoUrl && (
              <Button
                onClick={handleRemoveVideo}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <VideoOff className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center gap-2 mb-6"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-semibold">{error}</p>
          </motion.div>
        )}

        <Tabs defaultValue="fortune" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-purple-500/30 backdrop-blur-sm">
            <TabsTrigger value="fortune" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Skull className="w-4 h-4 mr-2" />
              Ask the Rebel
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fortune" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Question Form */}
              
              <Card className="bg-gray-900/50 border border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <Skull className="w-12 h-12 mx-auto mb-4 text-pink-400" />
                    <h2 className="text-2xl font-bold text-pink-400 mb-2">Ask Your Question</h2>
                    <p className="text-gray-400">Choose a persona and category</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-purple-300 mb-2 block font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        AI Persona
                      </Label>
                      <Select value={selectedPersona} onValueChange={handlePersonaChange}>
                        <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30 max-h-[300px]">
                          {AI_PERSONAS.map(persona => (
                            <SelectItem key={persona.id} value={persona.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{persona.icon}</span>
                                <div>
                                  <div className="font-semibold">{persona.name}</div>
                                  <div className="text-xs text-gray-400">{persona.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currentPersona && (
                        <p className="text-xs text-gray-500 mt-1">
                          {currentPersona.icon} {currentPersona.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-purple-300 mb-2 block font-semibold">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30">
                          <SelectItem value="love">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-pink-400" />
                              Love & Relationships
                            </div>
                          </SelectItem>
                          <SelectItem value="career">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-green-400" />
                              Career & Work
                            </div>
                          </SelectItem>
                          <SelectItem value="life">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              Life & General
                            </div>
                          </SelectItem>
                          <SelectItem value="rebellion">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-red-400" />
                              Rebellion & Chaos
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              Custom Vibe
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {category === "custom" && (
                      <div>
                        <Label className="text-purple-300 mb-2 block font-semibold">Custom Vibe</Label>
                        <Input
                          value={customTone}
                          onChange={(e) => setCustomTone(e.target.value)}
                          placeholder="e.g., sarcastic, dark, optimistic..."
                          className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-purple-300 mb-2 block font-semibold">Your Question</Label>
                      <Input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
                        placeholder="Ask a yes/no question..."
                        className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">{question.length}/100 characters</p>
                    </div>

                    {/* Token Cost Preview */}
                    <div className="flex items-center justify-between bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                      <span className="text-sm text-purple-300">AI Commentary Cost:</span>
                      <TokenCostPreview action="reading_standard" quantity={1} />
                    </div>

                    <Button
                      onClick={handleAsk}
                      disabled={!question.trim() || isShaking || (category === "custom" && !customTone.trim()) || isGeneratingCommentary}
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-lg py-3"
                    >
                      {isShaking ? (
                        "Shaking the Rebel..."
                      ) : isGeneratingCommentary ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Commentary...
                        </>
                      ) : (
                        <>
                          <Skull className="w-5 h-5 mr-2" />
                          Ask the Rebel
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 8-Ball Display with Speech Bubble */}
              <div className="space-y-6">
                {/* Speech Bubble - AI Commentary */}
                <AnimatePresence>
                  {aiCommentary && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="relative"
                    >
                      <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-400/50 shadow-2xl shadow-purple-500/30">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-3xl">{currentPersona?.icon}</span>
                          <div>
                            <h3 className="font-bold text-purple-200">{currentPersona?.name} says:</h3>
                            <p className="text-xs text-purple-300">AI Commentary</p>
                          </div>
                        </div>
                        <p className="text-white text-lg leading-relaxed font-sans">
                          {aiCommentary}
                        </p>
                      </div>
                      {/* Speech bubble pointer */}
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-purple-400/50"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 8-Ball */}
                <div className="flex justify-center items-center">
                  <div className="relative w-full max-w-md aspect-square">
                    {customVideoUrl ? (
                      <motion.div
                        ref={ballRef}
                        className="relative w-full h-full"
                        animate={isShaking ? {
                          rotateZ: [0, 5, -5, 3, -3, 0],
                          scale: [1, 1.05, 0.95, 1.02, 1]
                        } : { rotateZ: 0, scale: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      >
                        <video
                          key={customVideoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none"
                          style={{
                            filter: 'brightness(0.7) contrast(1.1)',
                            opacity: 0.9
                          }}
                          src={customVideoUrl}
                        >
                          Your browser does not support the video tag.
                        </video>

                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <div
                            className="flex items-center justify-center"
                            style={{
                              position: 'absolute',
                              width: '35%',
                              height: '30%',
                              top: '54%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <AnimatePresence>
                              {answer.text && answer.text !== '...' && (
                                <motion.div
                                  key={answer.text}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.5, ease: "easeIn" }}
                                  className="w-full h-full flex items-center justify-center p-1"
                                >
                                  <motion.span
                                    className={`font-bold text-center leading-tight ${getAnswerColor(answer.type)} drop-shadow-2xl`}
                                    style={{
                                      fontSize: 'clamp(0.75rem, 2.2vw, 1.2rem)',
                                      lineHeight: '1.2',
                                      textShadow: '2px 2px 5px rgba(0,0,0,1), 0 0 12px rgba(255,255,255,0.7)',
                                      wordWrap: 'break-word',
                                    }}
                                    animate={{
                                      textShadow: [
                                        '2px 2px 5px rgba(0,0,0,1), 0 0 12px rgba(255,255,255,0.7)',
                                        '2px 2px 5px rgba(0,0,0,1), 0 0 20px rgba(255,255,255,1)',
                                        '2px 2px 5px rgba(0,0,0,1), 0 0 12px rgba(255,255,255,0.7)'
                                      ]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      repeatType: "reverse",
                                      ease: "easeInOut"
                                    }}
                                  >
                                    {answer.text}
                                  </motion.span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        ref={ballRef}
                        className={`w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 border-4 border-gray-600 shadow-2xl flex items-center justify-center relative overflow-hidden`}
                        animate={isShaking ? {
                          rotateZ: [0, 5, -5, 3, -3, 0],
                          scale: [1, 1.05, 0.95, 1.02, 1]
                        } : { rotateZ: 0, scale: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent rounded-full"></div>

                        <div className="absolute w-3/5 h-3/5 bg-gradient-to-br from-blue-900/50 via-purple-800/40 to-indigo-900/60 rounded-full border-2 border-purple-500/30 backdrop-blur-sm z-[5]"></div>

                        <div className="absolute inset-0 flex items-center justify-center z-[15]">
                          <div className="w-32 h-24 bg-gradient-to-b from-blue-900 to-black rounded-lg border border-blue-400/30 flex items-center justify-center p-2 shadow-inner">
                            <AnimatePresence mode="wait">
                              {answer.text && (
                                <motion.span
                                  key={answer.text}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.5 }}
                                  className={`text-center font-bold leading-tight ${getAnswerColor(answer.type)}`}
                                  style={{
                                    fontSize: 'clamp(0.6rem, 1.8vw, 1rem)',
                                    textShadow: '0 0 8px rgba(255,255,255,0.5)',
                                    wordWrap: 'break-word'
                                  }}
                                >
                                  {answer.text}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-black/30 border-purple-500/30">
              <CardContent className="p-4 space-y-4">
                {history.length > 0 && (
                  <div className="flex items-center gap-4 mb-4">
                    <Filter className="w-4 h-4 text-purple-400" />
                    <Select value={historyFilter} onValueChange={setHistoryFilter}>
                      <SelectTrigger className="w-48 bg-black/30 border-purple-500/30 text-white font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-purple-500/50 font-mono">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="love">Love</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="life">Life</SelectItem>
                        <SelectItem value="rebellion">Rebellion</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <ScrollArea className="h-[60vh] rounded-md border border-purple-500/30 p-2">
                  <div className="space-y-3">
                    {filteredHistory.length === 0 ? (
                      <p className="text-center text-gray-400 font-mono py-8">
                        {historyFilter === "all" ? "No questions asked yet." : `No ${historyFilter} questions asked yet.`}
                      </p>
                    ) : (
                      filteredHistory.map(item => {
                        const CategoryIcon = categoryIcons[item.category] || Zap;
                        const badgeColors = getBadgeColors(item.category);
                        return (
                          <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg border border-purple-500/20">
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CategoryIcon className={`w-4 h-4 ${getCategoryColor(item.category)}`} />
                                  <Badge className={`${badgeColors.bg} ${badgeColors.text} border-0 font-mono text-xs`}>
                                    {item.category}
                                  </Badge>
                                  {item.persona_name && (
                                    <Badge className="bg-blue-500/20 text-blue-300 border-0 font-mono text-xs">
                                      {item.persona_name}
                                    </Badge>
                                  )}
                                  {item.custom_tone && (
                                    <Badge className="bg-purple-500/20 text-purple-300 border-0 font-mono text-xs">
                                      {item.custom_tone}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 font-sans mb-2">"{item.question}"</p>
                                <p className={`font-mono text-xl font-bold mb-2 ${getAnswerColor(item.answer_type)}`}>{item.answer}</p>
                                {item.ai_commentary && (
                                  <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-3 mt-2">
                                    <p className="text-sm text-purple-200 font-sans italic">{item.ai_commentary}</p>
                                  </div>
                                )}
                              </div>
                              <Button variant="destructive" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => deleteHistoryItem(item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
