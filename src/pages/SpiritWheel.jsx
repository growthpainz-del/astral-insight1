import React, { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, Download, ZoomIn, ZoomOut } from 'lucide-react';
import ReportContentDialog from "@/components/common/ReportContentDialog";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AudioOrb from "@/components/reading/AudioOrb";
import CelestialMapWidget from "@/components/reading/CelestialMapWidget";
import html2canvas from 'html2canvas';
import ReadingShareModal from "@/components/reading/ReadingShareModal";
import { queueApiCall } from "@/components/utils/apiQueue";
import CanvasSpiritWheel from '@/components/reading/CanvasSpiritWheel';
import { hashSeed, seededRandom, pickWeighted, calculateTargetAngle, calculateMetatronZone } from '@/utils/spiritWheelEngine';

import SpiritWheelControls from '@/components/reading/SpiritWheelControls';
import SpiritWheelThemeSelector from '@/components/reading/SpiritWheelThemeSelector';
import SpiritWheelConfigSelector from '@/components/reading/SpiritWheelConfigSelector';
import SpiritWheelDisplayOptions from '@/components/reading/SpiritWheelDisplayOptions';
import SpiritWheelResults from '@/components/reading/SpiritWheelResults';

import { ROOTED_CARDS_DATA, WHEEL_MIDDLE, WHEEL_INNER, CATEGORIES } from '@/lib/spiritWheelData';
import { WHEEL_THEMES } from '@/lib/spiritWheelThemes';
import { getCardRelationship } from '@/lib/spiritWheelLogic';

export default function SpiritWheel() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const initialWheelId = urlParams.get("id");
  const tabFromUrl = urlParams.get("tab") || 'spin';

  const [category, setCategory] = useState("General");
  const [blankMode, setBlankMode] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [spinState, setSpinState] = useState("idle"); // idle, spinning
  const [spinSpeed, setSpinSpeed] = useState(1);
  const [rotations, setRotations] = useState({ outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0, marble1: -90, marble2: 30, marble3: 150 });
  const [selectedIndices, setSelectedIndices] = useState({
    past: { outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0 },
    present: { outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0 },
    future: { outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0 }
  });
  const [intentionPhrase, setIntentionPhrase] = useState("");
  const [metatronResult, setMetatronResult] = useState(null);

  const isSpinning = spinState !== "idle";
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPan.current = { ...panPos };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDragged.current = true;
    }
    setPanPos({
      x: lastPan.current.x + dx,
      y: lastPan.current.y + dy
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDownloadImage = async () => {
    setIsCapturing(true);
    setTimeout(async () => {
      try {
        const element = document.getElementById("spirit-wheel-capture-area");
        if (!element) return;
        
        const canvas = await html2canvas(element, {
          scale: 2, // High resolution
          useCORS: true,
          backgroundColor: activeTheme.pageBg || '#0f172a',
        });
        
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `spirit-wheel-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to capture image", err);
        alert("Failed to capture image");
      } finally {
        setIsCapturing(false);
      }
    }, 100);
  };

  const handleSaveReading = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Reading.create({
        title: `Spirit Wheel: ${category}`,
        spread_type: "custom",
        deck_id: "spirit_wheel",
        cards_drawn: [],
        interpretation: aiInterpretation,
        date: new Date().toISOString().split('T')[0],
        category: "Spirit Wheel"
      });
      alert("Reading saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save reading.");
    } finally {
      setIsSaving(false);
    }
  };

  const [customWheels, setCustomWheels] = useState([]);
  const [selectedWheelId, setSelectedWheelId] = useState(initialWheelId || "default");
  const [deckCards, setDeckCards] = useState({});
  const [defaultWheelJson, setDefaultWheelJson] = useState(null);

  useEffect(() => {
    fetch("https://media.base44.com/files/public/68d2a300021f94d0f312c039/730076266_all-wheel-configs.json")
      .then(res => res.json())
      .then(data => {
        let rootedConfig = data.find(w => 
            w.outer_ring && w.outer_ring.some(r => r.label && r.label.toUpperCase().includes('ROOTED JOURNEY'))
        );
        if (!rootedConfig && data.length > 0) {
            rootedConfig = data[0];
        }
        if (rootedConfig) {
          setDefaultWheelJson(rootedConfig);
        }
      })
      .catch(err => console.error("Error loading default wheel json", err));
  }, []);

  const [themeId, setThemeId] = useState("wood");
  const [customTheme, setCustomTheme] = useState({
    outerBg: "#e6b981", outerGrad: "#c48b53", outerBorder: "#2b1810",
    middleBg: "#d4a373", middleGrad: "#b57a42", middleBorder: "#2b1810",
    innerBg: "#b57a42", innerGrad: "#9c602d", innerBorder: "#2b1810",
    hubBorder: "#2b1810", hubBg: "black",
    textOuter: "#2b1810", textMiddle: "#2b1810", textInner: "#2b1810",
    divider: "#2b1810", pin: "#e2e8f0",
    textureUrl: "https://www.transparenttextures.com/patterns/wood-pattern.png",
    pageBg: "#0f172a",
    pageBgImage: "",
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif'
  });

  const activeTheme = themeId === 'custom' ? customTheme : WHEEL_THEMES[themeId];

  const wheelData = React.useMemo(() => {
    let w = null;
    
    if (selectedWheelId !== "default") {
      w = customWheels.find(cw => cw.id === selectedWheelId);
    } else if (defaultWheelJson) {
      w = defaultWheelJson;
    }

    if (w) {
      const cards = w.deck_id ? (deckCards[w.deck_id] || []) : [];
      const getIcon = (r) => {
        if (r.type === 'card' && r.card_id) {
          const c = cards.find(card => card.id === r.card_id);
          if (c) {
            const customSym = Object.values(c.custom_fields || {}).find(cf => cf.label?.toLowerCase() === 'symbol' || cf.label?.toLowerCase() === 'icon');
            return c.spirit_wheel_icon_url || c.image_url || customSym?.value || r.icon;
          }
        }
        return r.icon;
      };

      const outerAll = (w.outer_ring || []).map((r, i) => {
        const icon = getIcon(r);
        return { id: icon || String(i + 1), name: r.label, general: `${r.label}: ${r.meaning}` };
      });
      
      let outer1 = [];
      let outer2 = [];
      if (w.outer2_ring && w.outer2_ring.length > 0) {
        outer1 = outerAll;
        outer2 = w.outer2_ring.map((r, i) => {
          const icon = getIcon(r);
          return { id: icon || String(i + 1), name: r.label, general: `${r.label}: ${r.meaning}` };
        });
      } else {
        const half = Math.ceil(outerAll.length / 2);
        outer1 = outerAll.slice(0, half);
        outer2 = outerAll.slice(half);
      }

      return {
        outer1,
        outer2,
        middle: (w.middle_ring || []).map((r, i) => {
          const icon = getIcon(r);
          return { id: icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` };
        }),
        inner: (w.inner_ring || []).map((r, i) => {
          const icon = getIcon(r);
          return { id: icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` };
        }),
        rune: (w.rune_ring || []).map((r, i) => {
          const icon = getIcon(r);
          return { id: icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` };
        })
      };
    }

    const allOuter = ROOTED_CARDS_DATA.map(c => ({
      id: c.id,
      name: c.name,
      general: `${c.name} (${c.symbol}): ${c.meaning}`
    }));
    const half = Math.ceil(allOuter.length / 2);

    return {
      outer1: allOuter.slice(0, half),
      outer2: allOuter.slice(half),
      middle: WHEEL_MIDDLE,
      inner: WHEEL_INNER,
      rune: []
    };
  }, [selectedWheelId, customWheels, deckCards, defaultWheelJson]);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const user = await queueApiCall(() => base44.auth.me(), 3, 1000, 10000).catch(() => null);
        setCurrentUser(user);
        
        const [publicWheelsRes, myWheelsRes] = await Promise.all([
          queueApiCall(() => base44.entities.SpiritWheelConfiguration.filter({ is_public: true, publish_status: 'published' }, '-updated_date', 200), 3, 1000, 10000).catch(() => []),
          user?.email ? queueApiCall(() => base44.entities.SpiritWheelConfiguration.filter({ created_by: user.email }, '-updated_date', 200), 3, 1000, 10000).catch(() => []) : Promise.resolve([])
        ]);
        
        const publicWheels = Array.isArray(publicWheelsRes) ? publicWheelsRes : [];
        const myWheels = Array.isArray(myWheelsRes) ? myWheelsRes : [];
        
        const allWheelsMap = new Map();
        [...publicWheels, ...myWheels].forEach(w => allWheelsMap.set(w.id, w));
        setCustomWheels(Array.from(allWheelsMap.values()));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    fetchDecks();
  }, []);

  useEffect(() => {
    let w = null;
    if (selectedWheelId !== "default") {
      w = customWheels.find(cw => cw.id === selectedWheelId);
      if (w?.theme_id) setThemeId(w.theme_id);
      if (w?.custom_theme) {
        setCustomTheme(w.custom_theme);
      }
    } else if (defaultWheelJson) {
      w = defaultWheelJson;
      // We don't overwrite user's theme if they selected "default" after picking something else,
      // but let's set it if they just loaded.
      if (w?.theme_id) setThemeId(w.theme_id);
      if (w?.custom_theme) setCustomTheme(w.custom_theme);
    }

    if (w?.deck_id && !deckCards[w.deck_id]) {
      // Fetch up to 200 cards to cover large decks
      base44.entities.Card.filter({ deck_id: w.deck_id }, '-created_date', 200).then(cards => {
        setDeckCards(prev => ({ ...prev, [w.deck_id]: cards || [] }));
      }).catch(e => console.error("Failed to load cards for wheel", e));
    }
  }, [selectedWheelId, customWheels, deckCards, defaultWheelJson]);

  const spinWheel = () => {
    if (spinState !== "idle") return;
    setSpinState("spinning");
    setIsRevealed(false);
    setAiInterpretation("");
    setMetatronResult(null);

    // 1. Generate seed
    const seedPhrase = intentionPhrase.trim() || Date.now().toString();
    const seed = hashSeed(seedPhrase);
    
    // 2. Determine winners using seeded RNG
    const outer1Winner = pickWeighted(wheelData.outer1, seededRandom(seed + 1));
    const outer2Winner = pickWeighted(wheelData.outer2, seededRandom(seed + 2));
    const middleWinner = pickWeighted(wheelData.middle, seededRandom(seed + 3));
    const innerWinner = pickWeighted(wheelData.inner, seededRandom(seed + 4));
    const runeWinner = pickWeighted(wheelData.rune || [], seededRandom(seed + 5));

    // 3. Calculate target angles
    const baseSpins = 4 * spinSpeed;

    const targetMarble1Rot = (rotations.marble1 !== undefined ? rotations.marble1 : -90) - 360 * (baseSpins + 10) - Math.floor(seededRandom(seed + 10) * 360);
    const targetMarble2Rot = (rotations.marble2 !== undefined ? rotations.marble2 : 30) - 360 * (baseSpins + 11) - Math.floor(seededRandom(seed + 11) * 360);
    const targetMarble3Rot = (rotations.marble3 !== undefined ? rotations.marble3 : 150) - 360 * (baseSpins + 12) - Math.floor(seededRandom(seed + 12) * 360);

    // Using random target rotations that are seeded, so they are deterministic
    const targetRotations = {
      outer1: (rotations.outer1 || 0) + 360 * (baseSpins + 1) + Math.floor(seededRandom(seed + 1) * 360),
      outer2: (rotations.outer2 || 0) - 360 * (baseSpins + 3) - Math.floor(seededRandom(seed + 2) * 360),
      middle: (rotations.middle || 0) + 360 * (baseSpins + 5) + Math.floor(seededRandom(seed + 3) * 360),
      inner:  (rotations.inner || 0) - 360 * (baseSpins + 7) - Math.floor(seededRandom(seed + 4) * 360),
      rune:   (rotations.rune || 0) + 360 * (baseSpins + 9) + Math.floor(seededRandom(seed + 5) * 360),
      marble1: targetMarble1Rot,
      marble2: targetMarble2Rot,
      marble3: targetMarble3Rot
    };

    const getIndexAtAngle = (R, N, A) => {
      if (!N || N === 0) return 0;
      let i = Math.round( (A + 90 - R) * N / 360 ) % N;
      while (i < 0) i += N;
      return i;
    };

    const pastAngle = targetRotations.marble1;
    const presentAngle = targetRotations.marble2;
    const futureAngle = targetRotations.marble3;

    setSelectedIndices({
      past: {
        outer1: getIndexAtAngle(targetRotations.outer1, wheelData.outer1.length, pastAngle),
        outer2: getIndexAtAngle(targetRotations.outer2, wheelData.outer2.length, pastAngle),
        middle: getIndexAtAngle(targetRotations.middle, wheelData.middle.length, pastAngle),
        inner: getIndexAtAngle(targetRotations.inner, wheelData.inner.length, pastAngle),
        rune: getIndexAtAngle(targetRotations.rune, wheelData.rune?.length || 0, pastAngle),
      },
      present: {
        outer1: getIndexAtAngle(targetRotations.outer1, wheelData.outer1.length, presentAngle),
        outer2: getIndexAtAngle(targetRotations.outer2, wheelData.outer2.length, presentAngle),
        middle: getIndexAtAngle(targetRotations.middle, wheelData.middle.length, presentAngle),
        inner: getIndexAtAngle(targetRotations.inner, wheelData.inner.length, presentAngle),
        rune: getIndexAtAngle(targetRotations.rune, wheelData.rune?.length || 0, presentAngle),
      },
      future: {
        outer1: getIndexAtAngle(targetRotations.outer1, wheelData.outer1.length, futureAngle),
        outer2: getIndexAtAngle(targetRotations.outer2, wheelData.outer2.length, futureAngle),
        middle: getIndexAtAngle(targetRotations.middle, wheelData.middle.length, futureAngle),
        inner: getIndexAtAngle(targetRotations.inner, wheelData.inner.length, futureAngle),
        rune: getIndexAtAngle(targetRotations.rune, wheelData.rune?.length || 0, futureAngle),
      }
    });

    // Calculate Metatron zone based on outer1 target angle
    const finalOuter1Angle = targetRotations.outer1 % 360;
    const zoneInfo = calculateMetatronZone(finalOuter1Angle, activeTheme.metatron?.rotation || 0);

    // 4. Animate to targets with independent physics
    const ringPhysics = {
      outer1: { duration: 4000, ease: (t) => 1 - Math.pow(1 - t, 3) },
      outer2: { duration: 4800, ease: (t) => 1 - Math.pow(1 - t, 4) },
      middle: { duration: 5600, ease: (t) => { const c1 = 0.5; return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); } },
      inner:  { duration: 6400, ease: (t) => { const c1 = 0.8; return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); } },
      rune:   { duration: 7200, ease: (t) => 1 - Math.pow(1 - t, 5) },
      marble1: { duration: 7500, ease: (t) => 1 - Math.pow(1 - t, 3) },
      marble2: { duration: 8000, ease: (t) => 1 - Math.pow(1 - t, 3) },
      marble3: { duration: 8500, ease: (t) => 1 - Math.pow(1 - t, 3) }
    };

    const startRots = { ...rotations };
    const startTime = performance.now();
    let lastTicks = { outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0, marble1: 0, marble2: 0, marble3: 0 };

    const animate = (time) => {
      let isDone = true;
      const currentRots = { ...startRots };
      let tickOccurred = false;

      Object.keys(ringPhysics).forEach(key => {
        const { duration, ease } = ringPhysics[key];
        let progress = (time - startTime) / duration;
        
        if (progress < 1) {
          isDone = false;
        } else {
          progress = 1;
        }
        
        const eased = ease(progress);
        const currentRot = startRots[key] + (targetRotations[key] - startRots[key]) * eased;
        currentRots[key] = currentRot;

        // Collision/tick effect
        const segmentsCount = wheelData[key]?.length || (key.startsWith('marble') ? 36 : 1);
        const tickVal = Math.floor(Math.abs(currentRot) / (360 / Math.max(1, segmentsCount)));
        if (tickVal !== lastTicks[key] && progress > 0.05 && progress < 0.99) {
           lastTicks[key] = tickVal;
           tickOccurred = true;
        }
      });

      if (tickOccurred && typeof navigator !== 'undefined' && navigator.vibrate) {
         navigator.vibrate(2);
      }

      setRotations(currentRots);

      if (!isDone) {
        requestAnimationFrame(animate);
      } else {
        setSpinState("idle");
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
        setMetatronResult(zoneInfo);
        if (!blankMode) {
          setTimeout(() => setIsRevealed(true), 50);
        }
      }
    };
    
    requestAnimationFrame(animate);
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const getInterpretation = async () => {
    setIsAiLoading(true);
    try {
      const categoryName = selectedWheelId === "default" ? category : customWheels.find(w => w.id === selectedWheelId)?.name || "Custom Reading";
      
      let staticReading = `Your reading focuses on ${categoryName}.\n\n`;

      for (const [positionName, indices] of Object.entries(selectedIndices)) {
        const outerItem1 = wheelData.outer1[indices.outer1] || {};
        const outerItem2 = wheelData.outer2[indices.outer2] || {};
        const middleItem = wheelData.middle[indices.middle] || {};
        const innerItem = wheelData.inner[indices.inner] || {};
        const runeItem = wheelData.rune?.[indices.rune] || null;

        const coreTheme1 = outerItem1.general ? outerItem1.general.split(":")[0] : (outerItem1.name || "Unknown theme");
        const coreTheme2 = outerItem2.general ? outerItem2.general.split(":")[0] : (outerItem2.name || "Unknown theme");
        
        const timingModifier = middleItem.meaning || middleItem.general || "Unknown modifier";
        const actionGuidance = innerItem.meaning || innerItem.general || "Unknown guidance";
        const runeGuidance = runeItem ? (runeItem.meaning || runeItem.general || "Unknown ancient wisdom") : null;
        
        staticReading += `--- ${positionName.toUpperCase()} ---\n`;
        staticReading += `Core themes: ${coreTheme1} & ${coreTheme2}.\n`;
        
        const relationshipInsight = await getCardRelationship(outerItem1, outerItem2);
        
        if (outerItem1.meaning || outerItem1.general?.includes(":")) {
          staticReading += `• ${outerItem1.meaning || outerItem1.general.split(":")[1]?.trim()}\n`;
        }
        if (outerItem2.meaning || outerItem2.general?.includes(":")) {
          staticReading += `• ${outerItem2.meaning || outerItem2.general.split(":")[1]?.trim()}\n`;
        }
        
        if (relationshipInsight) {
          staticReading += `✨ Cosmic Synergy: ${relationshipInsight}\n`;
        }

        staticReading += `Modifier: "${timingModifier}"\n`;
        staticReading += `Action: "${actionGuidance}"\n`;
        
        if (runeGuidance) {
          staticReading += `Rune whisper: "${runeGuidance}"\n`;
        }
        
        staticReading += `\n`;
      }

      if (metatronResult && activeTheme.metatron?.enabled) {
        staticReading += `🔮 Sacred Geometry Alignment (Past Position): The pointer landed in the ${metatronResult.zone} zone (${Math.round(metatronResult.sectorAngle)}°). ${metatronResult.description}.\n\n`;
      }
      
      // Wait a short moment to simulate fetching
      await new Promise(resolve => setTimeout(resolve, 800));
      setAiInterpretation(staticReading);

    } catch (e) {
      console.error(e);
      setAiInterpretation("Failed to get interpretation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div 
      id="spirit-wheel-capture-area"
      className="min-h-screen text-amber-50 p-4 md:p-8 font-serif bg-blend-multiply overflow-x-hidden transition-colors duration-500"
      style={{ 
        backgroundColor: activeTheme.pageBg || '#0f172a',
        backgroundImage: activeTheme.pageBgImage ? `url('${activeTheme.pageBgImage}')` : (activeTheme.pageBg && !activeTheme.isTiles ? 'none' : `url('https://www.transparenttextures.com/patterns/wood-pattern.png')`),
        backgroundSize: activeTheme.pageBgImage ? 'cover' : 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: activeTheme.pageBgImage ? 'no-repeat' : 'repeat'
      }}
    >
      <style>{`
        .mode-tabs {
          display: flex; gap: 0; background: #160f2a; border-bottom: 1px solid rgba(160,120,255,0.16);
          position: sticky; z-index: 90; backdrop-filter: blur(10px);
          scrollbar-width: none;
        }
        .mode-tabs::-webkit-scrollbar { display: none; }
        .mode-tab {
          flex: 1; padding: 11px 0; font-family: 'Cinzel', serif; font-size: 8.5px; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(180,160,220,0.42); border: none; background: none; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.25s; text-align: center;
        }
        .mode-tab.on { color: #c9a84c; border-bottom-color: #c9a84c; }
        .mode-tab:hover:not(.on) { color: rgba(200,180,255,0.8); }

        @keyframes stoneBounce {
          0% { transform: translateX(-50%) scale(1); }
          100% { transform: translateX(-50%) scale(1.3); }
        }
        @keyframes strobeFlicker {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.8; filter: brightness(0.8); }
        }
        .stroboscopic-spin {
          animation: strobeFlicker 0.08s infinite linear !important;
        }
      `}</style>
      {/* Top Navigation Bar */}
      <nav data-html2canvas-ignore="true" className="sticky top-0 z-50 flex items-center justify-between px-[17px] py-[11px] bg-[#07050f]/95 border-b border-[#a078ff]/15 backdrop-blur-[16px] -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-0">
        <Link to={createPageUrl("Studio")} className="w-[34px] h-[34px] rounded-[9px] bg-[#160f2a] border border-[#a078ff]/15 flex flex-col items-center justify-center gap-[4px] cursor-pointer transition-colors hover:border-purple-400/40">
          <div className="w-[16px] h-[1.5px] bg-purple-200/60 rounded-[2px]"></div>
          <div className="w-[16px] h-[1.5px] bg-purple-200/60 rounded-[2px]"></div>
          <div className="w-[16px] h-[1.5px] bg-purple-200/60 rounded-[2px]"></div>
        </Link>
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#1a0f35] to-[#0a0618] border border-[#c9a84c]/25 flex items-center justify-center text-[15px] shadow-[0_0_12px_rgba(201,168,76,0.2)] text-[#c9a84c]">
            ⊙
          </div>
          <span className="font-['Cinzel'] text-[11px] tracking-[0.18em] uppercase text-purple-200/70">
            Spirit Wheel
          </span>
        </div>
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#67e8f9] flex items-center justify-center font-['Cinzel'] text-[10px] font-bold text-white shadow-[0_0_10px_rgba(103,232,249,0.2)] cursor-pointer">
          {currentUser ? (currentUser.full_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase() : 'GR'}
        </div>
      </nav>

      <div className="mode-tabs overflow-x-auto whitespace-nowrap -mx-4 md:-mx-8 mb-6" data-html2canvas-ignore="true" style={{ top: '53px' }}>
        <button className={`mode-tab ${activeTab === 'spin' ? 'on' : ''}`} onClick={() => setActiveTab('spin')}>Spin</button>
        <button className={`mode-tab ${activeTab === 'config' ? 'on' : ''}`} onClick={() => setActiveTab('config')}>Config</button>
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SpiritWheelDesigner${selectedWheelId !== "default" ? "?id=" + selectedWheelId : ""}`))}>Designer</button>
        <button className="mode-tab" onClick={() => navigate(createPageUrl(`SigilForge`))}>Sigil Forge</button>
      </div>

      <div data-html2canvas-ignore="true" className="flex flex-wrap items-center gap-2 justify-end w-full mb-6">
        <CelestialMapWidget onApplyEnergy={() => {
          setCategory("Astrology");
          setSelectedWheelId("default");
        }} />
        <Button 
          onClick={handleDownloadImage}
          disabled={isCapturing}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
        >
          {isCapturing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          <span className="hidden sm:inline">Download Image</span>
        </Button>
      </div>

      <div className="max-w-[100rem] mx-auto flex flex-col gap-8" style={{ display: activeTab === 'spin' ? 'flex' : 'none' }}>
        
        {/* Top/Full Width Column: Visual Wheel & Controls */}
        <div className="w-full flex flex-col items-center justify-start p-0 md:p-2 lg:p-4 relative min-h-[350px] lg:min-h-[600px] order-1 overflow-hidden lg:overflow-visible">
          <div 
            className="relative w-full flex flex-col items-center pb-[20px] pt-[24px] border-y sm:border border-[rgba(201,168,76,0.15)] overflow-hidden sm:rounded-xl shadow-2xl"
            style={{
              background: "linear-gradient(180deg, #0a0618 0%, #140d28 40%, #1a1008 100%)",
            }}
          >
            {/* cosmic bg dots */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.15) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }}
            ></div>
            
            {/* Zoom Controls */}
            <div data-html2canvas-ignore="true" className="absolute top-2 right-2 md:top-4 md:right-4 z-50 flex flex-row md:flex-col gap-[6px] bg-[rgba(2,1,10,0.5)] p-[6px] rounded-[10px] border border-[rgba(201,168,76,0.2)] shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <button onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))} className="w-[30px] h-[30px] rounded-[6px] text-[#c9a84c] hover:text-[#fff] hover:bg-[rgba(201,168,76,0.2)] transition-colors flex items-center justify-center cursor-pointer border-none bg-transparent">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoomLevel(1)} className="w-[30px] h-[30px] rounded-[6px] text-[#c9a84c] hover:text-[#fff] hover:bg-[rgba(201,168,76,0.2)] transition-colors flex items-center justify-center text-[9px] font-bold cursor-pointer border-none bg-transparent" style={{ fontFamily: "'Cinzel', serif" }}>
                {Math.round(zoomLevel * 100)}%
              </button>
              <button onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.25))} className="w-[30px] h-[30px] rounded-[6px] text-[#c9a84c] hover:text-[#fff] hover:bg-[rgba(201,168,76,0.2)] transition-colors flex items-center justify-center cursor-pointer border-none bg-transparent">
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <div 
              className="relative w-[90vw] h-[90vw] max-w-[320px] max-h-[320px] sm:max-w-none sm:max-h-none sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[650px] lg:h-[650px] xl:w-[800px] xl:h-[800px] shrink-0 origin-center my-4"
              style={{ 
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-in-out',
                touchAction: 'none'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div 
                className="absolute top-[-14px] left-1/2 z-10 w-0 h-0"
                style={{
                  transform: "translateX(-50%)",
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "20px solid #c9a84c",
                  filter: "drop-shadow(0 0 6px rgba(201,168,76,0.8))",
                  animation: "pointerBob 2s ease-in-out infinite"
                }}
              ></div>
              <style>{`
                @keyframes pointerBob {
                  0%, 100% { transform: translateX(-50%) translateY(0); }
                  50% { transform: translateX(-50%) translateY(-4px); }
                }
                @keyframes glowPulse {
                  0%, 100% { filter: drop-shadow(0 0 8px rgba(201,168,76,0.4)); }
                  50% { filter: drop-shadow(0 0 18px rgba(201,168,76,0.7)); }
                }
              `}</style>
              <div 
                className={`absolute inset-0 cursor-pointer rounded-full transition-all duration-300 ${isSpinning ? 'animate-[glowPulse_0.5s_ease-in-out_infinite]' : 'hover:drop-shadow-[0_0_30px_rgba(201,168,76,0.5)]'}`} 
                style={{ filter: isSpinning ? "none" : "drop-shadow(0 0 20px rgba(201,168,76,0.3)) drop-shadow(0 8px 30px rgba(0,0,0,0.6))" }}
                onClick={() => {
                  if (!hasDragged.current && !isSpinning) spinWheel();
                }}
              >
                <CanvasSpiritWheel 
                  wheelData={wheelData}
                  rotations={rotations}
                  activeTheme={activeTheme}
                  metatron={{ 
                    enabled: activeTheme.metatron?.enabled ?? true, 
                    color: activeTheme.metatron?.color || 'rgba(212, 175, 55, 0.4)', 
                    rotation: activeTheme.metatron?.rotation || 0 
                  }}
                  zoomLevel={1}
                  isSpinning={isSpinning}
                />
              </div>
            </div>

            {/* Spin controls underneath the wheel */}
            <SpiritWheelControls
              intentionPhrase={intentionPhrase}
              setIntentionPhrase={setIntentionPhrase}
              spinSpeed={spinSpeed}
              setSpinSpeed={setSpinSpeed}
              spinState={spinState}
              spinWheel={spinWheel}
            />
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0 space-y-6 z-10 order-2">
          {/* Results Area */}
          <SpiritWheelResults 
            isSpinning={isSpinning}
            blankMode={blankMode}
            isRevealed={isRevealed}
            rotations={rotations}
            handleReveal={handleReveal}
            wheelData={wheelData}
            selectedIndices={selectedIndices}
            metatronResult={metatronResult}
            activeTheme={activeTheme}
            getInterpretation={getInterpretation}
            isAiLoading={isAiLoading}
            aiInterpretation={aiInterpretation}
            setShowShareModal={setShowShareModal}
            handleSaveReading={handleSaveReading}
            isSaving={isSaving}
            setShowReportDialog={setShowReportDialog}
          />
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto pb-12 mt-8 z-10 relative" style={{ display: activeTab === 'config' ? 'block' : 'none' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-[18px] md:px-0">
          <div className="bg-[#0f0b1e] p-[16px] rounded-[14px] border border-[rgba(160,120,255,0.16)] space-y-[14px]">
              <SpiritWheelThemeSelector
                themeId={themeId}
                setThemeId={setThemeId}
                customTheme={customTheme}
                setCustomTheme={setCustomTheme}
              />
          </div>
          
          <div className="bg-[#0f0b1e] p-[16px] rounded-[14px] border border-[rgba(160,120,255,0.16)] space-y-[14px]">
              <SpiritWheelConfigSelector
                selectedWheelId={selectedWheelId}
                setSelectedWheelId={setSelectedWheelId}
                customWheels={customWheels}
                category={category}
                setCategory={setCategory}
                currentUser={currentUser}
              />
              
              <div className="pt-[11px] border-t border-[rgba(160,120,255,0.06)] space-y-[11px]">
                <SpiritWheelDisplayOptions
                  blankMode={blankMode}
                  setBlankMode={setBlankMode}
                  showLabels={showLabels}
                  setShowLabels={setShowLabels}
                />
              </div>
          </div>
        </div>
      </div>

      <div data-html2canvas-ignore="true">
        <AudioOrb 
          textToSpeak={aiInterpretation} 
          autoPlay={!!aiInterpretation} 
          variant="player"
        />
      </div>
      <div className="max-w-4xl mx-auto mt-12 text-center text-xs text-amber-200/50 pb-8">
        Disclaimer: The guidance provided is for entertainment purposes only and does not constitute professional advice. Client logins are secured and data can be deleted at any time.
      </div>
      
      <ReadingShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reading={{
          title: `Spirit Wheel: ${category}`,
          deck_id: "spirit_wheel",
          interpretation: aiInterpretation
        }}
        deckName="Rooted Crescent Wheel"
        spreadName="Spirit Wheel Reading"
        drawnCards={[]}
      />
      
      <ReportContentDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          contentType="reading_interpretation"
          contentContext={aiInterpretation?.substring(0, 100) + "..."}
      />
    </div>
  );
}