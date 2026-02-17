import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, X, ChevronUp, ChevronDown } from "lucide-react";

export default function VoiceAvatarBubble() {
  const [open, setOpen] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [speakText, setSpeakText] = React.useState("");

  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;
  const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supportsSTT = Boolean(SpeechRecognition);
  const recognitionRef = React.useRef(null);

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
    utter.rate = 1;
    utter.pitch = 1.05;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    try {
      window.speechSynthesis.speak(utter);
    } catch (_) {
      setSpeaking(false);
    }
  }, [supportsTTS, stopAllSpeech]);

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
      rec.onend = () => setListening(false);
      rec.onresult = (event) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          finalText += event.results[i][0].transcript;
        }
        setTranscript((prev) => (finalText?.trim() ? finalText : prev));
      };
      rec.start();
    } catch (_) {
      setListening(false);
    }
  }, [supportsSTT, listening, SpeechRecognition]);

  const stopListening = React.useCallback(() => {
    try {
      recognitionRef.current && recognitionRef.current.stop();
    } catch (_) {}
    setListening(false);
  }, []);

  React.useEffect(() => () => stopAllSpeech(), [stopAllSpeech]);

  const bubblePulse = speaking ? "animate-pulse" : listening ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900" : "";

  return (
    <div className="fixed z-[9998] right-4 md:right-6" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)" }}>
      <div className="flex flex-col items-end gap-2">
        {open && (
          <div className="w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 ${bubblePulse}`} />
                <div className="text-sm font-semibold">Frenzie</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-white/70 mb-2">Speak or ask anything about your reading. I can listen and talk back.</div>

            <div className="bg-black/40 rounded-lg p-2 min-h-[64px] text-sm text-white/90 border border-white/10 mb-2">
              {transcript ? (
                <div className="whitespace-pre-wrap break-words">{transcript}</div>
              ) : (
                <div className="text-white/50">Your voice transcript will appear here…</div>
              )}
            </div>

            <div className="flex gap-2 mb-2">
              <Button
                onClick={listening ? stopListening : startListening}
                variant={listening ? "destructive" : "default"}
                className={`${listening ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"} flex-1`}
              >
                {listening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {listening ? "Stop" : supportsSTT ? "Listen" : "No STT"}
              </Button>
              <Button
                onClick={() => (speaking ? stopAllSpeech() : speak(speakText || "Blessings, seeker. Shall we begin?"))}
                variant="outline"
                className="flex-1 border-purple-500/40 text-purple-200 hover:bg-purple-500/10"
                disabled={!supportsTTS}
              >
                {speaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {speaking ? "Stop" : supportsTTS ? "Speak" : "No TTS"}
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
          {open ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
        </button>
      </div>
    </div>
  );
}