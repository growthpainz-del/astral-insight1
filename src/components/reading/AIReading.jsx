import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, AlertTriangle, Copy, Check, Volume2, StopCircle, Mic, Moon, Heart, Download, FileText } from "lucide-react";
// removed: AudioPlayer import (switched to SpeechSynthesis)

import FreeLimitReached from "@/components/pricing/FreeLimitReached";
import TokenCostPreview from "@/components/pricing/TokenCostPreview";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function ChanneledReading({ isOpen, drawnCards, deck, spread, question, onClose }) {
  const [interpretation, setInterpretation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState("quick");
  const [includeMoonPhase, setIncludeMoonPhase] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  
  // ElevenLabs TTS
  const [elevenVoices, setElevenVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedReadingId, setSavedReadingId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const audioRef = useRef(null);
  const webSpeechUtteranceRef = useRef(null);
  const usingWebSpeechRef = useRef(false);
  // TTS chunking
  const [ttsSegments, setTtsSegments] = useState([]);
  const ttsAudioMapRef = useRef({});
  const [ttsIndex, setTtsIndex] = useState(0);
  const ttsIndexRef = useRef(0);
  const ttsSegmentsRef = useRef([]);
  const ttsAbortRef = useRef(false);
  const [isTtsPreparing, setIsTtsPreparing] = useState(false);

  // Concise mode + Summary
  const [conciseMode, setConciseMode] = useState(false);
  const [activeTab, setActiveTab] = useState("full");
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // AI Coach customizations
  const [coachPersona, setCoachPersona] = useState("");
  const [coachTone, setCoachTone] = useState("warm"); // warm | direct | poetic | mystical | humorous | compassionate
  const [coachAdviceDepth, setCoachAdviceDepth] = useState("balanced"); // concise | balanced | detailed
  const [coachLanguage, setCoachLanguage] = useState("auto"); // auto | en | es | fr | de | pt | it | hi | ja | zh

  useEffect(() => {
    if (isOpen) {
      base44.auth.me().then(setUser).catch(() => setUser(null));
    }
  }, [isOpen]);

  // Force default reading voice to the user's preferred voice ID
  useEffect(() => {
    if (!isOpen) return;
    setSelectedVoiceId('X8Na0RDzhqa1gJFsWu5a');
  }, [isOpen]);

  const generateInterpretation = async (tier = "quick") => {
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
      const defaultPersonaName = user?.reading_persona_name || userPersona.name || "Mystical Guide";
      const defaultPreamble = user?.reading_persona_preamble || userPersona.tone || "Provide insightful and empowering guidance";

      const toneMap = {
        warm: "Warm, compassionate, supportive tone",
        direct: "Direct, grounded, and practical tone",
        poetic: "Poetic, metaphor-rich tone",
        mystical: "Mystical, esoteric tone with gentle reverence",
        humorous: "Light, encouraging tone with gentle humor",
        compassionate: "Compassionate, validating, trauma-informed tone"
      };
      const adviceMap = {
        concise: "Keep coaching succinct and action-oriented",
        balanced: "Provide clear, practical coaching with moderate detail",
        detailed: "Provide deeper, step-by-step coaching with nuanced guidance"
      };

      const personaNameEff = (coachPersona || defaultPersonaName).trim();
      const personaPreambleEff = `${toneMap[coachTone] || defaultPreamble}. ${adviceMap[coachAdviceDepth] || ''}`.trim();

      setProgress({ current: 3, total: 5, message: includeMoonPhase ? "Consulting the Moon..." : "Channeling cosmic wisdom..." });

      // Prompt generation moved to backend

setProgress({ current: 4, total: 5, message: "Weaving your interpretation..." });

// Call backend function
const { data } = await base44.functions.invoke('generateAdvancedReading', {
  drawnCards: relevantCards,
  deck,
  spread,
  question,
  tier,
  includeMoonPhase,
  personaName: personaNameEff,
  personaPreamble: personaPreambleEff,
  adviceDepth: coachAdviceDepth,
  language: coachLanguage,
  conciseMode: conciseMode
});

if (data.error) throw new Error(data.error);

setInterpretation((data.interpretation || "").replace(/\*/g, ""));
setSavedReadingId(null);
setIsFavorite(false);

// Auto-save reading to history
try {
  const deckId = deck?.id || deck?.deck_id;
  if (deckId) {
    const spreadPositions = spread?.positions || [];
    const numPositions = spreadPositions.length || (drawnCards?.length || 0);
    const relevantCards = (drawnCards || []).slice(0, numPositions);
    const payload = {
      title: (question?.trim()) || `${deck?.name || 'Reading'} — ${new Date().toLocaleString()}`,
      spread_type: spread?.name || spread?.type || (spreadPositions.length ? `custom_${spreadPositions.length}` : 'custom'),
      deck_id: deckId,
      cards_drawn: relevantCards.map((c, idx) => ({
        card_id: c.id || c.card_id || null,
        position: (spreadPositions[idx]?.name) || c.position || `Position ${idx + 1}`,
        is_reversed: !!(c.is_reversed || c.isReversed),
        card_name: c.name,
        image_url: c.image_url
      })),
      interpretation: (data.interpretation || ""),
      date: new Date().toISOString().slice(0,10),
      tags: []
    };
    const res = await base44.entities.Reading.create(payload);
    if (res?.id) setSavedReadingId(res.id);
  }
} catch (e) {
  console.warn('Auto-save reading failed:', e?.message || e);
}

// Auto-save reading to history
try {
  const deckId = deck?.id || deck?.deck_id;
  if (deckId) {
    const spreadPositions = spread?.positions || [];
    const numPositions = spreadPositions.length || (drawnCards?.length || 0);
    const relevantCards = (drawnCards || []).slice(0, numPositions);
    const payload = {
      title: (question?.trim()) || `${deck?.name || 'Reading'} — ${new Date().toLocaleString()}`,
      spread_type: spread?.name || spread?.type || (spreadPositions.length ? `custom_${spreadPositions.length}` : 'custom'),
      deck_id: deckId,
      cards_drawn: relevantCards.map((c, idx) => ({
        card_id: c.id || c.card_id || null,
        position: (spreadPositions[idx]?.name) || c.position || `Position ${idx + 1}`,
        is_reversed: !!(c.is_reversed || c.isReversed),
        card_name: c.name,
        image_url: c.image_url
      })),
      interpretation: (data.interpretation || ""),
      date: new Date().toISOString().slice(0,10),
      tags: []
    };
    const res = await base44.entities.Reading.create(payload);
    if (res?.id) setSavedReadingId(res.id);
  }
} catch (e) {
  console.warn('Auto-save reading failed:', e?.message || e);
}

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

  const speakWithWebAPI = async (text) => {
    try {
      if (!('speechSynthesis' in window)) {
        throw new Error('Web Speech API not supported');
      }
      usingWebSpeechRef.current = true;
      const utter = new SpeechSynthesisUtterance(text);
      webSpeechUtteranceRef.current = utter;
      // Try to pick a pleasant default voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => /female|en\-|us|UK|English/i.test(`${v.name} ${v.lang}`)) || voices[0];
      if (preferred) utter.voice = preferred;
      utter.rate = 1.0;
      utter.pitch = 1.0;
      return new Promise((resolve, reject) => {
        utter.onend = () => { setIsSpeaking(false); usingWebSpeechRef.current = false; resolve(); };
        utter.onerror = (e) => { usingWebSpeechRef.current = false; reject(e.error || 'speech error'); };
        window.speechSynthesis.cancel(); // clear any existing
        window.speechSynthesis.speak(utter);
      });
    } catch (e) {
      throw e;
    }
  };

  // Split text into natural chunks (~900 chars) at sentence boundaries
  const chunkText = (text, maxLen = 900) => {
    const parts = [];
    const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    for (const para of paras) {
      const sentences = para.split(/(?<=[.!?])\s+/);
      let buf = '';
      for (const s of sentences) {
        if ((buf + ' ' + s).trim().length <= maxLen) {
          buf = (buf ? buf + ' ' : '') + s;
        } else {
          if (buf) parts.push(buf);
          if (s.length > maxLen) {
            let i = 0;
            while (i < s.length) {
              parts.push(s.slice(i, i + maxLen));
              i += maxLen;
            }
            buf = '';
          } else {
            buf = s;
          }
        }
      }
      if (buf) { parts.push(buf); buf = ''; }
    }
    return parts.length ? parts : [text];
  };

  const fetchTtsForIndex = async (idx, voiceId) => {
    if (ttsAbortRef.current) return;
    if (ttsAudioMapRef.current[idx]) return;
    const seg = (ttsSegmentsRef.current && ttsSegmentsRef.current[idx]) || ttsSegments[idx];
    if (!seg) return;
    const { data } = await base44.functions.invoke('generateSpeech', {
      text: seg,
      voiceId: voiceId || selectedVoiceId || "X8Na0RDzhqa1gJFsWu5a",
    });
    const b64 = data?.audioContent;
    if (!b64) throw new Error('No audio returned from TTS');
    ttsAudioMapRef.current[idx] = `data:audio/mpeg;base64,${b64}`;
  };

  const handleSpeak = async () => {
    if (!interpretation) return;
    setError("");
    setIsSpeaking(true);
    setIsTtsPreparing(true);
    ttsAbortRef.current = false;
    ttsAudioMapRef.current = {};
    try {
      const segs = chunkText(interpretation);
      ttsSegmentsRef.current = segs;
      setTtsSegments(segs);
      setTtsIndex(0);
      ttsIndexRef.current = 0;
      // Generate first segment immediately using local 'segs' to avoid state race
      const firstSeg = segs[0];
      const { data: ttsData0 } = await base44.functions.invoke('generateSpeech', {
        text: firstSeg,
        voiceId: selectedVoiceId || "X8Na0RDzhqa1gJFsWu5a",
      });
      const b64_0 = ttsData0?.audioContent;
      if (!b64_0) throw new Error('No audio returned from TTS');
      ttsAudioMapRef.current[0] = `data:audio/mpeg;base64,${b64_0}`;
      if (!audioRef.current) return;
      // Reset and set source, then explicitly load metadata (iOS Safari needs this)
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ttsAudioMapRef.current[0];
      audioRef.current.muted = false;
      audioRef.current.volume = 1.0;
      audioRef.current.onloadedmetadata = async () => {
        try { await audioRef.current?.play(); } catch (_) {}
      };
      audioRef.current.onended = async () => {
        if (ttsAbortRef.current) { setIsSpeaking(false); return; }
        const next = ttsIndexRef.current + 1;
        if (next >= segs.length) { setIsSpeaking(false); return; }
        setTtsIndex(next);
        ttsIndexRef.current = next;
        try {
          if (!ttsAudioMapRef.current[next]) {
            await fetchTtsForIndex(next, selectedVoiceId || "X8Na0RDzhqa1gJFsWu5a");
          }
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = ttsAudioMapRef.current[next];
            audioRef.current.load();
            await audioRef.current.play();
          }
          const ahead = next + 1;
          if (ahead < segs.length) {
            fetchTtsForIndex(ahead, selectedVoiceId || "X8Na0RDzhqa1gJFsWu5a").catch(()=>{});
          }
        } catch (e) {
          try {
            const remaining = segs.slice(next).join(' ');
            await speakWithWebAPI(remaining);
            setError('Using device voice (local) for remaining.');
          } catch {
            setError('Playback issue. Try again.');
          } finally {
            setIsSpeaking(false);
          }
        }
      };
      audioRef.current.load();
      try {
        await audioRef.current.play();
        if (segs.length > 1) {
          fetchTtsForIndex(1, selectedVoiceId || "X8Na0RDzhqa1gJFsWu5a").catch(()=>{});
        }
      } catch (e) {
        try {
          await speakWithWebAPI(interpretation);
          setError('Using device voice (local).');
        } catch {
          setError('Playback blocked by browser. Press the Play button.');
        } finally {
          setIsSpeaking(false);
        }
      }
    } catch (err) {
      console.error('TTS error:', err);
      const msg = String(err?.message || '');
      const code = err?.response?.status || (/(\b401\b|\b403\b|\b404\b)/.test(msg) ? 401 : 0);
      if (code === 401 || code === 403) {
        try {
          await fetchTtsForIndex(0, "21m00Tcm4TlvDq8ikWAM");
          if (audioRef.current) {
            audioRef.current.src = ttsAudioMapRef.current[0];
            await audioRef.current.play();
          }
        } catch (err2) {
          try {
            await speakWithWebAPI(interpretation);
            setError('Using device voice (local).');
          } catch {
            setError('Text-to-speech failed (auth).');
          } finally {
            setIsSpeaking(false);
          }
        }
      } else {
        try {
          await speakWithWebAPI(interpretation);
          setError('Using device voice (local).');
        } catch {
          setError(`Text-to-speech failed: ${err.message || 'Unknown error'}`);
        } finally {
          setIsSpeaking(false);
        }
      }
    } finally {
      setIsTtsPreparing(false);
    }
  };

  const handleStop = () => {
    try {
      ttsAbortRef.current = true;
      ttsAudioMapRef.current = {};
      setTtsSegments([]);
      setTtsIndex(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
      if (usingWebSpeechRef.current && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        usingWebSpeechRef.current = false;
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  // Favorite save and export handlers
  const handleToggleFavorite = async () => {
    if (!interpretation) return;
    const deckId = deck?.id || deck?.deck_id;
    if (!deckId) { setError('Deck missing; cannot save.'); return; }
    try {
      setSavingFavorite(true);
      if (!savedReadingId) {
        const title = (question?.trim()) || `${deck?.name || 'Reading'} — ${new Date().toLocaleString()}`;
        const payload = {
          title,
          spread_type: 'custom',
          deck_id: deckId,
          interpretation,
          date: new Date().toISOString().slice(0,10),
          is_public: false,
          is_favorite: true
        };
        const res = await base44.entities.Reading.create(payload);
        setSavedReadingId(res.id);
        setIsFavorite(true);
      } else {
        await base44.entities.Reading.update(savedReadingId, { is_favorite: !isFavorite });
        setIsFavorite(prev => !prev);
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        setError('Please log in to save favorites.');
      } else {
        setError(e?.message || 'Failed to save favorite');
      }
    } finally {
      setSavingFavorite(false);
    }
  };

  const exportAsPdf = async () => {
    if (!interpretation) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const usableW = pageW - margin * 2;

    const title = (question?.trim()) || `${deck?.name || 'Reading'}`;
    const header = `${title}`;
    const meta = `Deck: ${deck?.name || '-'} | Spread: ${spread?.name || 'Custom'} | Date: ${new Date().toLocaleString()}`;

    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.text(header, margin, 64);
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.text(meta, margin, 84);

    let y = 110;

    // Helper: load image to canvas -> data URL (more reliable across CORS)
    const imageToDataUrl = (url, targetW, targetH) => {
      return new Promise((resolve) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const iw = img.naturalWidth || img.width;
              const ih = img.naturalHeight || img.height;
              const ratio = Math.min(targetW / iw, targetH / ih);
              const w = Math.max(1, Math.floor(iw * ratio));
              const h = Math.max(1, Math.floor(ih * ratio));
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/jpeg', 0.92));
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        } catch {
          resolve(null);
        }
      });
    };

    // Cards section with images
    if (drawnCards && drawnCards.length > 0) {
      doc.setFont('helvetica','bold');
      doc.setFontSize(13);
      doc.text('Cards Drawn', margin, y);
      y += 14;

      const cols = 3;
      const gap = 12;
      const imgW = (usableW - gap * (cols - 1)) / cols;
      const imgH = imgW * 1.5; // approx 2:3 card ratio

      let rowY = y;
      for (let i = 0; i < drawnCards.length; i++) {
        const dc = drawnCards[i];
        const col = i % cols;
        if (col === 0 && i > 0) {
          rowY += imgH + 36; // image + caption space
          if (rowY + imgH + margin > pageH) {
            doc.addPage();
            rowY = margin;
          }
        }
        const x = margin + col * (imgW + gap);

        const name = dc?.name || dc?.card_name || 'Card';
        const pos = dc?.position ? ` — ${dc.position}` : '';
        const rev = dc?.isReversed || dc?.is_reversed ? ' (Reversed)' : '';
        const caption = `${name}${rev}${pos}`;

        const url = dc?.image_url;
        if (url) {
          const dataUrl = await imageToDataUrl(url, imgW, imgH);
          if (dataUrl) {
            try {
              doc.addImage(dataUrl, 'JPEG', x, rowY, imgW, imgH);
            } catch (_) {
              // If addImage fails, skip image and still print caption
            }
          }
        }
        // Caption
        doc.setFont('helvetica','normal');
        doc.setFontSize(10);
        const capLines = doc.splitTextToSize(caption, imgW);
        doc.text(capLines, x, rowY + imgH + 12);
      }

      y = rowY + imgH + 48;
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    }

    // Interpretation section
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.text('Interpretation', margin, y);
    y += 14;

    doc.setFont('helvetica','normal');
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(interpretation, usableW);
    const lineHeight = 16;
    lines.forEach(line => {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    const fname = `reading-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`;
    doc.save(fname);
  };


  const exportAsText = () => {
    if (!interpretation) return;
    const title = (question?.trim()) || `${deck?.name || 'Reading'}`;
    const meta = `Deck: ${deck?.name || '-'} | Spread: ${spread?.name || 'Custom'} | Date: ${new Date().toLocaleString()}`;
    const content = `${title}\n${meta}\n\n${interpretation}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const summarizeInterpretation = async () => {
    if (!interpretation) return;
    setIsSummarizing(true);
    setSummaryError('');
    try {
      const prompt = `Summarize the following tarot/oracle reading into one short paragraph (3–5 sentences, ~80–120 words). Be direct, empowering, and practical. No markdown, no lists, no asterisks.\n\nREADING:\n${interpretation}`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });
      if (typeof res === 'string') {
        setSummary(res.trim());
      } else if (res && res.summary) {
        setSummary(String(res.summary).trim());
      } else {
        setSummaryError('Failed to generate summary.');
      }
    } catch (e) {
      setSummaryError(e?.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Stop TTS on unmount or when regenerating
  useEffect(() => {
    if (isGenerating) {
      handleStop();
    }
    return () => handleStop();
  }, [isGenerating]);

  if (!isOpen) return null;

  const hasInsufficientTokens = !!user && typeof user.token_balance === "number" && user.token_balance < 1;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          Channeled Interpretation
        </h2>
        <p className="text-purple-200 text-sm md:text-base">
          {deck?.name ? `${deck.name} Reading` : "Your Reading"}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs text-white/70">Concise</span>
          <Switch checked={conciseMode} onCheckedChange={setConciseMode} />
        </div>
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

              <div className="bg-slate-900/50 rounded-xl p-4 border border-purple-500/30">
                <h3 className="text-sm font-semibold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Coach Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Persona Name</div>
                    <Input
                      value={coachPersona}
                      onChange={(e) => setCoachPersona(e.target.value)}
                      placeholder="e.g., Mystic Sage"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Tone</div>
                    <Select value={coachTone} onValueChange={setCoachTone}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="warm">Warm & Compassionate</SelectItem>
                        <SelectItem value="direct">Direct & Practical</SelectItem>
                        <SelectItem value="poetic">Poetic & Metaphoric</SelectItem>
                        <SelectItem value="mystical">Mystical & Esoteric</SelectItem>
                        <SelectItem value="humorous">Light & Encouraging</SelectItem>
                        <SelectItem value="compassionate">Trauma-Informed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Advice Depth</div>
                    <Select value={coachAdviceDepth} onValueChange={setCoachAdviceDepth}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select depth" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Language</div>
                    <Select value={coachLanguage} onValueChange={setCoachLanguage}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="zh">简体中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/30">
                <h3 className="text-sm font-semibold text-emerald-300 mb-3 uppercase tracking-wider">
                  Concise Mode
                </h3>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/80">
                    Shorten the reading while keeping the core insight.
                  </div>
                  <Switch checked={conciseMode} onCheckedChange={setConciseMode} />
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
              {/* Voice selection hidden – forced voice in use */
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-white/70">Concise</span>
                <Switch checked={conciseMode} onCheckedChange={setConciseMode} />
              </div>}

              {!isSpeaking ? (
                <Button
                  onClick={handleSpeak}
                  variant="ghost"
                  size="sm"
                  className="text-purple-300 hover:text-white"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Listen
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="ghost"
                  size="sm"
                  className="text-purple-300 hover:text-white"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
              <Button
                onClick={handleToggleFavorite}
                variant="ghost"
                size="sm"
                disabled={savingFavorite || !(deck && (deck.id || deck.deck_id))}
                className={`${isFavorite ? 'text-rose-400' : 'text-purple-300'} hover:text-white`}
              >
                <Heart className="w-4 h-4 mr-2" />
                {isFavorite ? 'Unfavorite' : 'Save Favorite'}
              </Button>
              <Button
                onClick={exportAsPdf}
                variant="ghost"
                size="sm"
                className="text-purple-300 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={exportAsText}
                variant="ghost"
                size="sm"
                className="text-purple-300 hover:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export TXT
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



          <audio
            ref={audioRef}
            playsInline
            preload="auto"
            controls
            className="w-full max-w-md mx-auto mt-2 opacity-60 hover:opacity-100"
          />

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            if (v === 'summary' && !summary && !isSummarizing) {
              summarizeInterpretation();
            }
          }} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="full">Full</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="full">
              <div className="prose prose-invert prose-purple max-w-none">
                <div className="text-white/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {interpretation}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="summary">
              {isSummarizing ? (
                <div className="flex items-center gap-2 text-purple-300"><Loader2 className="w-4 h-4 animate-spin" /> Summarizing…</div>
              ) : summary ? (
                <div className="text-white/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">{summary}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {summaryError && <div className="text-red-300 text-sm">{summaryError}</div>}
                  <Button onClick={summarizeInterpretation} variant="outline" className="w-fit border-white/20 text-white hover:bg-white/10">Generate Summary</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-white/10">
            <Button
              onClick={() => {
                setInterpretation("");
                setError("");
                setSummary("");
                setActiveTab("full");
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