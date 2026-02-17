import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, X, ChevronUp, ChevronDown } from "lucide-react";
import OracleAvatarSVG from "@/components/avatar/OracleAvatarSVG";
import { base44 } from "@/api/base44Client";
import { queueLLMCall } from "@/components/utils/apiQueue";

const KB_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d2a300021f94d0f312c039/63b9fd985_agentcosmicchronicles.txt";

export default function VoiceAvatarBubble({ deck = null, spread = null, cards = [], question = "" }) {
  const [open, setOpen] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [speakText, setSpeakText] = React.useState("");
  const [voices, setVoices] = React.useState([]);
  const [selectedVoice, setSelectedVoice] = React.useState(null);
  const [responseText, setResponseText] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);

  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;
  const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supportsSTT = Boolean(SpeechRecognition);
  const recognitionRef = React.useRef(null);
  const lastHeardRef = React.useRef("");

  // Load voices and pick a soothing feminine default where available
  React.useEffect(() => {
    if (!supportsTTS) return;
    const pick = (list) => {
      if (!list?.length) return null;
      const en = list.filter(v => /en/i.test(v.lang));
      const candidates = [
        'Samantha','Victoria','Google UK English Female','Google US English',
        'Microsoft Zira','Microsoft Aria','Microsoft Hazel','Veena'
      ];
      for (const name of candidates) {
        const m = en.find(v => v.name.includes(name)) || list.find(v => v.name.includes(name));
        if (m) return m;
      }
      return en[0] || list[0] || null;
    };
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      setSelectedVoice(prev => prev || pick(v));
    };
    loadVoices();
    try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (_) {}
    return () => { try { window.speechSynthesis.onvoiceschanged = null; } catch (_) {} };
  }, [supportsTTS]);

  const stopAllSpeech = React.useCallback(() => {
    try {
      if (supportsTTS) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
    } catch (_) {}
  }, [supportsTTS]);

  const speak = React.useCallback((text) => {
    if (!supportsTTS || !text) return;
    stopAllSpeech();
    const utter = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utter.voice = selectedVoice;
    utter.rate = 0.95; // calmer pace
    utter.pitch = 1.12; // gentle, soothing
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [supportsTTS, stopAllSpeech, selectedVoice]);

  const startListening = React.useCallback(() => {
    if (!supportsSTT || listening) return;
    try {
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onerror = () => setListening(false);
      rec.onend = () => {
        setListening(false);
        const said = (lastHeardRef.current || transcript || "").trim();
        if (said) {
          generateResponse(said);
        }
      };
      rec.onresult = (event) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          finalText += event.results[i][0].transcript;
        }
        lastHeardRef.current = finalText;
        setTranscript((prev) => (finalText?.trim() ? finalText : prev));
      };
      rec.start();
    } catch (_) {
      setListening(false);
    }
  }, [supportsSTT, listening, SpeechRecognition, transcript]);

  const stopListening = React.useCallback(() => {
    try {
      recognitionRef.current && recognitionRef.current.stop();
    } catch (_) {}
    setListening(false);
  }, []);

  const generateResponse = React.useCallback(async (userText) => {
    setIsThinking(true);
    const cardLine = (cards || []).map(c => `${c.name || c.card_name || 'Card'}${c.isReversed ? ' (reversed)' : ''}`).join(', ');
    const deckName = deck?.name || 'Selected Deck';
    const spreadName = spread?.name || spread?.id || 'selected spread';
    const q = question || 'No specific question provided';

    const prompt = `You are Cosmic Oracle Chronicler (Frenzie), an empathetic oracle reader.\n` +
      `User asked (voice): "${userText}".\n` +
      `Reading context: Deck: ${deckName}; Spread: ${spreadName}; Question: ${q}; Drawn: ${cardLine || 'n/a'}.\n` +
      `Using the attached Rooted Crescent Oracle notes when relevant, give a concise, spoken-style response (2-5 sentences), mystical yet grounded, with 1 clear takeaway.`;

    const res = await queueLLMCall(() => base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      file_urls: [KB_URL]
    }), 3, 3000);

    const answer = typeof res === 'string' ? res : (res?.output || res?.content || JSON.stringify(res));
    setResponseText(answer || 'I sense a gentle shift—could you say that again?');
    setSpeakText(answer || 'I sense a gentle shift—could you say that again?');
    if (answer) speak(answer);
    setIsThinking(false);
  }, [cards, deck, question, spread, speak]);

  React.useEffect(() => () => stopAllSpeech(), [stopAllSpeech]);

  const bubblePulse = speaking ? "animate-pulse" : listening ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900" : "";

  return (
    <div className="fixed z-[9998] right-4 md:right-6" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)" }}>
      <div className="flex flex-col items-end gap-2">
        {open && (
          <div className="w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <OracleAvatarSVG size={28} talking={speaking} listening={listening} />
                <div className="text-sm font-semibold">Frenzie</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-white/70 mb-2">Speak or ask anything about your reading. I can listen and talk back.</div>

            <div className="bg-black/40 rounded-lg p-2 min-h-[72px] text-sm text-white/90 border border-white/10 mb-2 space-y-1">
              {responseText && (
                <div className="whitespace-pre-wrap break-words"><span className="text-cyan-300">Frenzie:</span> {responseText}</div>
              )}
              {transcript && (
                <div className="text-white/70 text-xs"><span className="text-white/50">You:</span> {transcript}</div>
              )}
              {!responseText && !transcript && (
                <div className="text-white/50">Speak and I will answer. {isThinking ? 'Thinking…' : ''}</div>
              )}
            </div>

            <div className="flex gap-2 mb-2">
              <Button
                onClick={listening ? stopListening : startListening}
                variant={listening ? "destructive" : "default"}
                className={`${listening ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"} flex-1`}
              >
                {listening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {listening ? "Stop" : supportsSTT ? (isThinking ? "Listening…" : "Listen") : "No STT"}
              </Button>
              <Button
                onClick={() => (speaking ? stopAllSpeech() : (responseText ? speak(responseText) : speak(speakText || "Blessings, seeker. Shall we begin?")))}
                variant="outline"
                className="flex-1 border-purple-500/40 text-purple-200 hover:bg-purple-500/10"
                disabled={!supportsTTS}
              >
                {speaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {speaking ? "Stop" : supportsTTS ? (responseText ? "Replay" : "Speak") : "No TTS"}
              </Button>
            </div>

            <input
              value={speakText}
              onChange={(e) => setSpeakText(e.target.value)}
              placeholder="Type something for Frenzie to say…"
              className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-purple-400"
            />

            <div className="mt-2 text-[11px] text-white/50">
              Tip: Browser TTS/STT varies by device. If voice buttons are disabled, try another browser.
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className={`h-14 w-14 rounded-full shadow-lg shadow-purple-900/30 bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center border border-white/10 active:scale-95 transition ${bubblePulse}`}
          title="Open voice guide"
        >
          <OracleAvatarSVG size={22} talking={speaking} listening={listening} />
        </button>
      </div>
    </div>
  );
}