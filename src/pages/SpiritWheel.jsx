import React, { useState, useEffect, useMemo } from 'react';
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

  const [category, setCategory] = useState("General");
  const [blankMode, setBlankMode] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [spinState, setSpinState] = useState("idle"); // idle, spinning
  const [spinSpeed, setSpinSpeed] = useState(1);
  const [rotations, setRotations] = useState({ outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0 });
  const [selectedIndices, setSelectedIndices] = useState({ outer1: 0, outer2: 0, middle: 0, inner: 0, rune: 0 });
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
    if (selectedWheelId !== "default") {
      const w = customWheels.find(cw => cw.id === selectedWheelId);
      if (w) {
        const outerAll = (w.outer_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, general: `${r.label}: ${r.meaning}` }));
        const half = Math.ceil(outerAll.length / 2);
        return {
          outer1: outerAll.slice(0, half),
          outer2: outerAll.slice(half),
          middle: (w.middle_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` })),
          inner: (w.inner_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` })),
          rune: (w.rune_ring || []).map((r, i) => ({ id: r.icon || String(i + 1), name: r.label, meaning: r.meaning, general: `${r.label}: ${r.meaning}` }))
        };
      }
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
  }, [selectedWheelId, customWheels]);

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
    if (selectedWheelId !== "default") {
      const w = customWheels.find(cw => cw.id === selectedWheelId);
      if (w?.theme_id) setThemeId(w.theme_id);
      if (w?.custom_theme) setCustomTheme(w.custom_theme);
    }
  }, [selectedWheelId, customWheels]);

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

    setSelectedIndices({
      outer1: outer1Winner,
      outer2: outer2Winner,
      middle: middleWinner,
      inner: innerWinner,
      rune: runeWinner
    });

    // 3. Calculate target angles
    const extraSpins = 4 * spinSpeed;
    const targetRotations = {
      outer1: calculateTargetAngle(rotations.outer1, extraSpins + 1, outer1Winner, wheelData.outer1.length),
      outer2: -calculateTargetAngle(Math.abs(rotations.outer2), extraSpins + 2, outer2Winner, wheelData.outer2.length), 
      middle: calculateTargetAngle(rotations.middle, extraSpins + 3, middleWinner, wheelData.middle.length),
      inner: -calculateTargetAngle(Math.abs(rotations.inner), extraSpins + 4, innerWinner, wheelData.inner.length),
      rune: calculateTargetAngle(rotations.rune || 0, extraSpins + 5, runeWinner, wheelData.rune?.length || 0)
    };

    // Calculate Metatron zone based on outer1 target angle
    const finalOuter1Angle = targetRotations.outer1 % 360;
    const zoneInfo = calculateMetatronZone(finalOuter1Angle, activeTheme.metatron?.rotation || 0);

    // 4. Animate to targets
    const duration = 4000;
    const startRots = { ...rotations };
    const startTime = performance.now();

    const animate = (time) => {
      let progress = (time - startTime) / duration;
      if (progress > 1) progress = 1;
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const currentRots = {
        outer1: startRots.outer1 + (targetRotations.outer1 - startRots.outer1) * ease,
        outer2: startRots.outer2 + (targetRotations.outer2 - startRots.outer2) * ease,
        middle: startRots.middle + (targetRotations.middle - startRots.middle) * ease,
        inner: startRots.inner + (targetRotations.inner - startRots.inner) * ease,
        rune: (startRots.rune || 0) + (targetRotations.rune - (startRots.rune || 0)) * ease
      };

      setRotations(currentRots);

      if (progress < 1) {
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
      const outerItem1 = wheelData.outer1[selectedIndices.outer1] || {};
      const outerItem2 = wheelData.outer2[selectedIndices.outer2] || {};
      const middleItem = wheelData.middle[selectedIndices.middle] || {};
      const innerItem = wheelData.inner[selectedIndices.inner] || {};
      const runeItem = wheelData.rune?.[selectedIndices.rune] || null;

      // Database-driven reading based on combinations (Bypasses AI)
      const coreTheme1 = outerItem1.general ? outerItem1.general.split(":")[0] : (outerItem1.name || "Unknown theme");
      const coreTheme2 = outerItem2.general ? outerItem2.general.split(":")[0] : (outerItem2.name || "Unknown theme");
      
      const timingModifier = middleItem.meaning || middleItem.general || "Unknown modifier";
      const actionGuidance = innerItem.meaning || innerItem.general || "Unknown guidance";
      const runeGuidance = runeItem ? (runeItem.meaning || runeItem.general || "Unknown ancient wisdom") : null;
      
      const categoryName = selectedWheelId === "default" ? category : customWheels.find(w => w.id === selectedWheelId)?.name || "Custom Reading";
      
      let staticReading = `Your reading focuses on ${categoryName}. The core themes are ${coreTheme1} and ${coreTheme2}. `;
      
      const relationshipInsight = selectedWheelId === "default" ? await getCardRelationship(outerItem1.id, outerItem2.id) : null;
      
      if (outerItem1.meaning || outerItem1.general?.includes(":")) {
        staticReading += `\n(${outerItem1.meaning || outerItem1.general.split(":")[1]?.trim()}) \n`;
      }
      if (outerItem2.meaning || outerItem2.general?.includes(":")) {
        staticReading += `\n(${outerItem2.meaning || outerItem2.general.split(":")[1]?.trim()}) \n\n`;
      }
      
      if (relationshipInsight) {
        staticReading += `✨ Cosmic Synergy: ${relationshipInsight}\n\n`;
      }

      if (metatronResult && activeTheme.metatron?.enabled) {
        staticReading += `🔮 Sacred Geometry Alignment: The pointer landed in the ${metatronResult.zone} zone (${Math.round(metatronResult.sectorAngle)}°). ${metatronResult.description}.\n\n`;
      }
      
      staticReading += `Your modifier indicates "${timingModifier}", suggesting the context of your situation. `;
      staticReading += `Your action guidance is "${actionGuidance}". `;
      
      if (runeGuidance) {
        staticReading += `\nThe ancient runes whisper: "${runeGuidance}". `;
      }
      
      staticReading += `\n\nReflect on how ${actionGuidance.toLowerCase()} can be integrated with ${coreTheme1} and ${coreTheme2}.`;
      
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
      <div className="max-w-[100rem] mx-auto mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div data-html2canvas-ignore="true">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/50 pl-2 pr-4">
                <ChevronLeft className="w-6 h-6 mr-1" />
                <span className="hidden sm:inline font-semibold">Dashboard</span>
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Spirit Wheel</h1>
            <p className="text-sm md:text-base text-amber-200/80">Astro Insights Digital Reading Room</p>
          </div>
        </div>

        <div data-html2canvas-ignore="true" className="flex flex-wrap items-center gap-2 justify-end">
          <CelestialMapWidget onApplyEnergy={() => {
            setCategory("Astrology");
            // If they are on a custom wheel, maybe switch to the default one to use categories
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
      </div>

      <div className="max-w-[100rem] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Visual Wheel & Controls */}
        <div className="flex-[1.5] flex flex-col items-center justify-start p-2 lg:p-4 relative min-h-[350px] lg:min-h-[600px] order-1 overflow-hidden lg:overflow-visible">
          
          {/* Zoom Controls */}
          <div data-html2canvas-ignore="true" className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/50 p-1.5 rounded-lg border border-[#8b5a2b] shadow-lg backdrop-blur-sm">
            <Button size="icon" variant="ghost" onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))} className="text-amber-300 hover:text-amber-100 hover:bg-[#8b5a2b]/50 h-8 w-8">
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setZoomLevel(1)} className="text-amber-300 hover:text-amber-100 hover:bg-[#8b5a2b]/50 h-8 w-8 text-[10px] font-bold">
              {Math.round(zoomLevel * 100)}%
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.25))} className="text-amber-300 hover:text-amber-100 hover:bg-[#8b5a2b]/50 h-8 w-8">
              <ZoomOut className="w-5 h-5" />
            </Button>
          </div>

          <div 
            className="relative w-[340px] h-[340px] sm:w-[450px] sm:h-[450px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] xl:w-[700px] xl:h-[700px] shrink-0 mt-6 lg:mt-0 transition-transform duration-300 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => !isSpinning && spinWheel()}>
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

      <div className="max-w-[100rem] mx-auto pb-12 mt-8 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 p-4 md:p-6 rounded-xl border border-[#8b5a2b] shadow-[0_4px_20px_rgba(0,0,0,0.5)] space-y-5">
              <SpiritWheelThemeSelector
                themeId={themeId}
                setThemeId={setThemeId}
                customTheme={customTheme}
                setCustomTheme={setCustomTheme}
              />
          </div>
          
          <div className="bg-slate-900/90 p-4 md:p-6 rounded-xl border border-[#8b5a2b] shadow-[0_4px_20px_rgba(0,0,0,0.5)] space-y-5">
              <SpiritWheelConfigSelector
                selectedWheelId={selectedWheelId}
                setSelectedWheelId={setSelectedWheelId}
                customWheels={customWheels}
                category={category}
                setCategory={setCategory}
                currentUser={currentUser}
              />
              
              <div className="pt-4 border-t border-[#5c3a21] space-y-4">
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