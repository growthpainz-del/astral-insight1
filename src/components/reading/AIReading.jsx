import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, AlertTriangle, Copy, Check, Volume2, StopCircle, Mic, Moon } from "lucide-react";
import AudioPlayer from "@/components/reading/AudioPlayer";
import { User } from "@/entities/User";
import FreeLimitReached from "@/components/pricing/FreeLimitReached";
import TokenCostPreview from "@/components/pricing/TokenCostPreview";
import { Progress } from "@/components/ui/progress";

export default function ChanneledReading({ isOpen, drawnCards, deck, spread, question, onClose }) {
  const [interpretation, setInterpretation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState("standard");
  const [includeMoonPhase, setIncludeMoonPhase] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  
  // Audio state
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM"); // Default to Rachel

  const AVAILABLE_VOICES = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Calm & Clear)", gender: "Female" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (Strong & Confident)", gender: "Female" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Soft & Serious)", gender: "Female" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Deep & Resonant)", gender: "Male" },
    { id: "VR6AewLTigWg4xSOukaG", name: "Arnold (Crisp & Authoritative)", gender: "Male" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam (Deep Narrator)", gender: "Male" },
    { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Young & Bright)", gender: "Female" },
  ];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    if (isOpen) {
      User.me().then(setUser).catch(() => setUser(null));
    }
  }, [isOpen]);

  const generateInterpretation = async (tier = "standard") => {
    if (!drawnCards || drawnCards.length === 0) {
      setError("No cards drawn to interpret");
      return;
    }

    setIsGenerating(true);
    setError("");
    setInterpretation("");
    setSelectedTier(tier);
    setProgress({ current: 1, total: 5, message: "Connecting to source..." });

    try {
      let tokenCost = tier === "quick" ? 1 : tier === "deep" ? 4 : 2;
      if (includeMoonPhase) tokenCost += 1;

      if (user && typeof user.token_balance === "number" && user.token_balance < tokenCost) {
        setError(`Insufficient tokens. This reading costs ${tokenCost} token${tokenCost > 1 ? 's' : ''}.`);
        setProgress({ current: 0, total: 0, message: "" });
        setIsGenerating(false);
        return;
      }

      setProgress({ current: 2, total: 5, message: includeMoonPhase ? "Aligning with lunar cycles..." : "Reading the energy..." });

      // FIXED: Build spread position structure from spread.positions to ensure accuracy
      const spreadPositions = spread?.positions || [];
      const numPositions = spreadPositions.length;
      
      // CRITICAL: Only include cards up to the number of positions in the spread
      const relevantCards = drawnCards.slice(0, numPositions);
      
      // Card descriptions and spread structure generation moved to backend
      const userPersona = user?.reading_persona || {};
      const personaName = user?.reading_persona_name || userPersona.name || "Mystical Guide";
      const personaPreamble = user?.reading_persona_preamble || userPersona.tone || "Provide insightful and empowering guidance";

      setProgress({ current: 3, total: 5, message: includeMoonPhase ? "Consulting the Moon..." : "Channeling cosmic wisdom..." });

      // Prompt generation moved to backend

setProgress({ current: 4, total: 5, message: "Weaving your interpretation..." });

// Call backend function
const { data } = await base44.functions.invoke('generateAdvancedReading', {
  drawnCards: relevantCards, // Use the prepared cards from frontend logic or rely on backend to slice
  // Actually, let's pass the raw cards and let backend handle slicing to match existing logic
  drawnCards, 
  deck,
  spread,
  question,
  tier,
  includeMoonPhase,
  personaName,
  personaPreamble
});

if (data.error) throw new Error(data.error);

setInterpretation(data.interpretation);

setProgress({ current: 5, total: 5, message: "Reading complete!" });

// Update local user state for UI responsiveness (backend handles actual DB update)
if (user && typeof user.token_balance === "number") {
  const newBalance = Math.max(0, user.token_balance - tokenCost);
  setUser(prev => ({ ...prev, token_balance: newBalance }));
}

      setTimeout(() => {
        setProgress({ current: 0, total: 0, message: "" });
      }, 1500);

    } catch (err) {
      console.error("Error generating interpretation:", err);
      setError(err.message || "Failed to generate reading. Please try again.");
      setProgress({ current: 0, total: 0, message: "" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(interpretation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSpeech = async () => {
    if (!interpretation) return;
    
    setIsGeneratingAudio(true);
    setError("");

    try {
      // Clear previous audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const { data } = await base44.functions.invoke('generateSpeech', { 
        text: interpretation,
        voiceId: selectedVoice
      });

      if (data.error) throw new Error(data.error);
      
      if (data.audioContent) {
        // Convert base64 to blob
        const byteCharacters = atob(data.audioContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsSpeaking(true);
      }
    } catch (err) {
      console.error("Speech generation error:", err);
      setError("Failed to generate audio. Please check API configuration.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Cleanup audio URL on unmount or when interpretation changes
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Reset audio when new interpretation is generated
  useEffect(() => {
    if (isGenerating) {
      setAudioUrl(null);
      setIsSpeaking(false);
    }
  }, [isGenerating]);

  if (!isOpen) return null;

  const hasInsufficientTokens = user && typeof user.token_balance === "number" && user.token_balance < 1;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          Channeled Interpretation
        </h2>
        <p className="text-purple-200 text-sm md:text-base">
          {deck?.name ? `${deck.name} Reading` : "Your Reading"}
        </p>
      </div>

      {hasInsufficientTokens && (
        <FreeLimitReached />
      )}

      {!interpretation && !isGenerating && !hasInsufficientTokens && (
        <div className="space-y-6">
          {/* Cosmic Influences Toggle */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-indigo-500/30">
             <h3 className="text-sm font-semibold text-indigo-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Cosmic Influences
             </h3>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${includeMoonPhase ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                      <Moon className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="font-medium text-white">Moon Phase Alignment</div>
                      <div className="text-xs text-white/50">Analyze lunar cycle influence (+1 Token)</div>
                   </div>
                </div>
                <button
                   onClick={() => setIncludeMoonPhase(!includeMoonPhase)}
                   className={`w-12 h-6 rounded-full transition-colors relative ${includeMoonPhase ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${includeMoonPhase ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <p className="text-white/80 text-center text-sm md:text-base">
              Choose your reading depth:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => generateInterpretation("quick")}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white flex flex-col items-center gap-2 py-6"
            >
              <Sparkles className="w-5 h-5" />
              <div>
                <div className="font-bold">Quick Reading</div>
                <div className="text-xs opacity-80">1-2 paragraphs</div>
                <div className="text-xs font-mono mt-1 bg-black/20 px-2 py-0.5 rounded">
                   {1 + (includeMoonPhase ? 1 : 0)} Tokens
                </div>
              </div>
            </Button>

            <Button
              onClick={() => generateInterpretation("standard")}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex flex-col items-center gap-2 py-6 border-2 border-amber-400/50"
            >
              <Sparkles className="w-5 h-5" />
              <div>
                <div className="font-bold">Standard Reading</div>
                <div className="text-xs opacity-80">3-4 paragraphs</div>
                <div className="text-xs font-mono mt-1 bg-black/20 px-2 py-0.5 rounded">
                   {2 + (includeMoonPhase ? 1 : 0)} Tokens
                </div>
              </div>
            </Button>

            <Button
              onClick={() => generateInterpretation("deep")}
              disabled={isGenerating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex flex-col items-center gap-2 py-6"
            >
              <Sparkles className="w-5 h-5" />
              <div>
                <div className="font-bold">Deep Reading</div>
                <div className="text-xs opacity-80">5-7 paragraphs</div>
                <div className="text-xs font-mono mt-1 bg-black/20 px-2 py-0.5 rounded">
                   {4 + (includeMoonPhase ? 1 : 0)} Tokens
                </div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {isGenerating && progress.total > 0 && (
        <div className="bg-purple-900/20 border border-purple-500/40 rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-purple-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-purple-300 text-sm md:text-base">{progress.message}</p>
              <p className="text-xs text-purple-200 mt-1">
                Step {progress.current} of {progress.total}
              </p>
            </div>
          </div>
          <Progress
            value={(progress.current / progress.total) * 100}
            className="h-2"
          />
          <p className="text-xs text-purple-300 text-center mt-3">
            Channeling your {selectedTier} reading... This may take 10-30 seconds.
          </p>
        </div>
      )}

      {error && (
        <Alert className="bg-red-900/20 border-red-500/40 text-red-200">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {interpretation && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-purple-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Your {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Reading
            </h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="w-[180px]">
                <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isGeneratingAudio || isSpeaking}>
                  <SelectTrigger className="h-8 bg-black/40 border-purple-500/30 text-xs text-purple-200">
                    <SelectValue placeholder="Select Voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-500/30 text-purple-200">
                    {AVAILABLE_VOICES.map(voice => (
                      <SelectItem key={voice.id} value={voice.id} className="text-xs focus:bg-purple-900/50 focus:text-white">
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateSpeech}
                variant="ghost"
                size="sm"
                disabled={isGeneratingAudio}
                className="text-purple-300 hover:text-white"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 mr-2" />
                )}
                Listen
              </Button>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="text-purple-300 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {audioUrl && (
            <div className="mb-4">
              <AudioPlayer src={audioUrl} title="AI Interpretation" />
            </div>
          )}

          <div className="prose prose-invert prose-purple max-w-none">
            <div className="text-white/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {interpretation}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <Button
              onClick={() => {
                setInterpretation("");
                setError("");
              }}
              variant="outline"
              className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
            >
              Generate Another Reading
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}