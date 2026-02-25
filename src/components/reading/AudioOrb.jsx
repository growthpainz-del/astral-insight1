import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, X, Loader2, Sparkles, StopCircle, Play } from 'lucide-react';
import { base44 } from "@/api/base44Client";

import { useNavigate } from 'react-router-dom';

export default function AudioOrb({ textToSpeak, onComplete, autoPlay = false, variant = 'player', to }) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  


  // Auto-play when text changes
  useEffect(() => {
    if (textToSpeak && autoPlay) {
      handleSpeak(textToSpeak);
    }
  }, [textToSpeak, autoPlay]);

  const cleanupAudio = () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.suspend();
      }
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    return cleanupAudio;
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // 1. Setup Main Voice Path
      if (audioRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }

    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };



  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, width, height);
      
      // Calculate average volume for glow intensity
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const glowIntensity = Math.max(0.2, average / 100);
      
      // Draw glowing background orb
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 2.5);
      gradient.addColorStop(0, `rgba(251, 191, 36, ${glowIntensity})`); // Gold/Amber center
      gradient.addColorStop(0.5, `rgba(249, 115, 22, ${glowIntensity * 0.6})`); // Orange mid
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw circular waveform ring
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(254, 240, 138, ${0.5 + glowIntensity * 0.5})`; // Light gold
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f59e0b'; // Amber shadow
      
      const sliceAngle = (Math.PI * 2) / bufferLength;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // Normalized 0-2 (approx)
        const currentRadius = radius + (v * radius * 0.4); // Distort radius based on volume
        
        const angle = i * sliceAngle;
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();
      
      // Inner circle (core)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.8})`; // Amber
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    
    draw();
  };

  const segmentsRef = useRef([]);
  const currentSegmentIndexRef = useRef(0);
  const audioMapRef = useRef({});
  const abortRef = useRef(false);

  // Split text into natural chunks (~900 chars)
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

  const fetchTtsForIndex = async (idx) => {
    if (abortRef.current || audioMapRef.current[idx]) return;
    const seg = segmentsRef.current[idx];
    if (!seg) return;
    
    try {
      const { data } = await base44.functions.invoke('generateSpeech', {
        text: seg,
        forceElevenLabs: true
      });
      if (data?.audioContent) {
        audioMapRef.current[idx] = `data:audio/mpeg;base64,${data.audioContent}`;
      }
    } catch (e) {
      console.error("Failed to pre-fetch audio segment:", e);
    }
  };

  const playSegment = async (index) => {
    if (abortRef.current) return;
    
    const url = audioMapRef.current[index];
    if (!url) {
      // If not prefetched, wait for it
      setIsLoading(true);
      await fetchTtsForIndex(index);
      setIsLoading(false);
      if (abortRef.current) return;
    }
    
    const audioUrl = audioMapRef.current[index];
    if (!audioUrl) {
      setIsPlaying(false);
      if (onComplete) onComplete();
      return; // Failed to get audio
    }

    setAudioUrl(audioUrl);
    
    setTimeout(async () => {
      if (audioRef.current && !abortRef.current) {
        initAudioContext();
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setIsPlaying(true);
          drawVisualizer();
          
          // Pre-fetch next segment
          if (index + 1 < segmentsRef.current.length) {
            fetchTtsForIndex(index + 1);
          }
        } catch (e) {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        }
      }
    }, 50);
  };

  const handleEnded = () => {
    const nextIndex = currentSegmentIndexRef.current + 1;
    if (nextIndex < segmentsRef.current.length && !abortRef.current) {
      currentSegmentIndexRef.current = nextIndex;
      playSegment(nextIndex);
    } else {
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (onComplete) onComplete();
    }
  };

  const handleSpeak = async (text) => {
    if (!text) return;
    
    abortRef.current = false;
    audioMapRef.current = {};
    const segments = chunkText(text);
    segmentsRef.current = segments;
    currentSegmentIndexRef.current = 0;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsLoading(true);
    setIsPlaying(false);
    setExpanded(true);
    
    await playSegment(0);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      abortRef.current = true;
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      // Re-trigger from start if aborted
      if (abortRef.current && textToSpeak) {
        handleSpeak(textToSpeak);
      } else if (audioUrl) {
        initAudioContext();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          drawVisualizer();
        }).catch(e => console.error(e));
      } else if (textToSpeak) {
        handleSpeak(textToSpeak);
      }
    }
  };

  const handleClick = (e) => {
    if (variant === 'link') {
      if (to) navigate(to);
    } else {
      if (!expanded) setExpanded(true);
    }
  };

  const containerClasses = variant === 'link' 
    ? 'relative w-16 h-16' // Widget is static relative element when used inline
    : `fixed z-[100] right-4 md:right-8 transition-all duration-500 ease-in-out ${
        expanded ? 'bottom-24 w-80 md:w-96' : 'bottom-24 w-20 h-20' // Bigger for readings
      }`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={containerClasses}
    >
      <div className={`relative bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)] overflow-hidden transition-all duration-500 ${
        expanded ? 'rounded-2xl p-6' : 'rounded-full w-full h-full flex items-center justify-center cursor-pointer hover:border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-105'
      }`}
      onClick={handleClick}
      >
        
        {/* Minimized View */}
        {!expanded && (
          <div className="relative w-full h-full flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            ) : isPlaying ? (
              <div className="relative w-full h-full flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full animate-ping bg-amber-500/20"></div>
                 <Volume2 className="w-8 h-8 text-amber-400 relative z-10" />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                 {variant === 'link' && <div className="absolute inset-0 rounded-full animate-pulse bg-orange-500/10"></div>}
                 <Sparkles className={`w-8 h-8 ${variant === 'link' ? 'text-amber-400' : 'text-orange-400'} relative z-10`} />
              </div>
            )}
          </div>
        )}

        {/* Expanded View */}
        {expanded && (
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-sm font-bold tracking-wider text-amber-100 uppercase">Cosmic Oracle</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visualizer Canvas */}
            <div className="relative w-56 h-56 md:w-64 md:h-64 mb-6">
              <canvas 
                ref={canvasRef} 
                width={256} 
                height={256} 
                className="w-full h-full rounded-full bg-black/40 border border-white/5"
              />
              
              {/* Center Icon/Status */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {isLoading ? (
                  <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                ) : !isPlaying && !audioUrl ? (
                  <Sparkles className="w-10 h-10 text-orange-400/50" />
                ) : null}
              </div>
            </div>

            {/* Controls */}
            <div className="w-full flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
                disabled={isLoading || !textToSpeak}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-base transition-all ${
                  isPlaying 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30' 
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20'
                }`}
              >
                {isLoading ? (
                  <span>Channeling...</span>
                ) : isPlaying ? (
                  <>
                    <StopCircle className="w-5 h-5" /> Stop Reading
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> {audioUrl ? 'Replay Message' : 'Read Interpretation'}
                  </>
                )}
              </button>
            </div>
            
            {/* Status Text */}
            <div className="mt-3 text-[10px] text-center text-white/40 font-mono">
              {isLoading ? "Synthesizing voice..." : isPlaying ? "Speaking..." : "Ready"}
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          src={audioUrl}
          onEnded={handleEnded}
          onPause={() => {
            // Only toggle off if it's an actual pause, not just between segments
            if (abortRef.current) setIsPlaying(false);
          }}
          className="hidden"
          crossOrigin="anonymous"
        />
      </div>
    </motion.div>
  );
}