import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, Eye, Info, Sparkles,
  ChevronLeft, ChevronRight, Loader2, Shuffle, RotateCcw,
} from "lucide-react";
import SpreadDesignCanvas from "@/components/spread/SpreadDesignCanvas";
import SpreadLayout       from "@/components/reading/SpreadLayout";
import AISpreadAssistant  from "@/components/spread/AISpreadAssistant";
import { getDesignerAspectRatio } from "@/components/utils/cardSizing";

// ─── Nav tab pill ─────────────────────────────────────────────────────────────
function Tab({ id, label, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
      style={active
        ? { background: "rgba(167,139,250,0.25)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.45)" }
        : { background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
      {label}
    </button>
  );
}

// ─── Position coverflow (looping) ─────────────────────────────────────────────
function PositionCoverflow({ positions, activeIdx, onSelect, onAdd, onRemove }) {
  const CARD_W = 150;
  const CARD_GAP = 14;
  const startX = useRef(0);
  const dragging = useRef(false);
  const total = positions.length;
  const wrap = (i) => ((i % total) + total) % total;

  const scrollTo = useCallback((raw) => { if (total) onSelect(wrap(raw)); }, [total, onSelect]);

  if (!total) return (
    <div className="flex items-center justify-center rounded-2xl" style={{ height: 180, border: "2px dashed rgba(167,139,250,0.2)", background: "rgba(255,255,255,0.03)" }}>
      <div className="text-center">
        <p className="text-white/40 text-sm mb-3">No positions yet</p>
        <Button size="sm" onClick={onAdd} className="rounded-full bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-1" /> Add First</Button>
      </div>
    </div>
  );

  return (
    <div className="relative select-none" style={{ height: 200 }}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onMouseDown={e => { startX.current = e.clientX; dragging.current = true; }}
        onMouseUp={e => { if (!dragging.current) return; dragging.current = false; const d = startX.current - e.clientX; if (Math.abs(d) > 30) scrollTo(activeIdx + (d > 0 ? 1 : -1)); }}
        onTouchStart={e => { startX.current = e.touches[0].clientX; dragging.current = true; }}
        onTouchEnd={e => { if (!dragging.current) return; dragging.current = false; const d = startX.current - e.changedTouches[0].clientX; if (Math.abs(d) > 30) scrollTo(activeIdx + (d > 0 ? 1 : -1)); }}
      >
        {[-2, -1, 0, 1, 2].map(dist => {
          const idx = wrap(activeIdx + dist);
          const pos = positions[idx];
          const scale = dist === 0 ? 1 : Math.max(0.70, 1 - Math.abs(dist) * 0.14);
          const opacity = dist === 0 ? 1 : Math.max(0.30, 1 - Math.abs(dist) * 0.24);
          const tx = dist * (CARD_W + CARD_GAP) * 0.86;
          const isActive = dist === 0;
          return (
            <div key={`${dist}-${idx}`} onClick={() => dist !== 0 && scrollTo(activeIdx + dist)}
              className="absolute cursor-pointer rounded-2xl flex flex-col items-center justify-between py-3 px-3 transition-all duration-300"
              style={{
                width: CARD_W, height: 160, transform: `translateX(${tx}px) scale(${scale}) perspective(600px) rotateY(${dist * -12}deg)`, opacity, zIndex: 5 - Math.abs(dist),
                background: isActive ? "radial-gradient(135% 135% at 25% 20%, rgba(124,58,237,0.4) 0%, #0f0b1e 100%)" : "rgba(255,255,255,0.04)",
                border: isActive ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isActive ? "0 0 28px rgba(124,58,237,0.3), 0 6px 24px rgba(0,0,0,0.5)" : "none"
              }}>
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="text-[10px] px-1.5 py-0" style={{ background: "rgba(124,58,237,0.4)", color: "#c4b5fd", border: "none" }}>{idx + 1}</Badge>
                  {isActive && <button onClick={e => { e.stopPropagation(); onRemove(idx); }} className="text-red-400/70 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>}
                </div>
                <p className="text-white text-xs font-semibold leading-tight truncate">{pos.name || `Position ${idx + 1}`}</p>
                {isActive && pos.meaning && <p className="text-white/50 text-[10px] mt-1 line-clamp-2 leading-tight">{pos.meaning}</p>}
              </div>
              {isActive && (
                <div className="text-[10px] px-2 py-0.5 rounded-full w-full text-center" style={{ background: "rgba(124,58,237,0.25)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.35)" }}>
                  {Math.round(pos.x ?? 50)}%, {Math.round(pos.y ?? 50)}%{pos.rotation ? ` · ${pos.rotation}°` : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* dots */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5">
        {positions.map((_, i) => (
          <button key={i} onClick={() => onSelect(i)} className="rounded-full transition-all"
            style={{ width: i === activeIdx ? 20 : 5, height: 5, background: i === activeIdx ? "#a78bfa" : "rgba(255,255,255,0.2)" }} />
        ))}
      </div>
      <button onClick={() => scrollTo(activeIdx - 1)} className="absolute left-1 top-[72px] w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white" style={{ zIndex: 10 }}><ChevronLeft className="w-4 h-4" /></button>
      <button onClick={() => scrollTo(activeIdx + 1)} className="absolute right-1 top-[72px] w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white" style={{ zIndex: 10 }}><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Mock tester data ─────────────────────────────────────────────────────────
const TESTER_IMGS = [
  "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551269901-5c40c0e6a2ec?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop",
];
const CARD_NAMES = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"];

function buildMockCards(positions) {
  const names = [...CARD_NAMES].sort(() => Math.random() - 0.5);
  return positions.map((pos, idx) => ({
    id: `mock-${idx}`, name: names[idx % names.length],
    image_url: TESTER_IMGS[idx % TESTER_IMGS.length],
    overall_meaning: pos.meaning || "Draw meaning from within.",
    isFlipped: true, position_number: idx + 1,
    position: pos.name, isReversed: Math.random() > 0.75,
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SpreadDesigner() {
  const [searchParams] = useSearchParams();
  const spreadId = searchParams.get("id");

  const [spreadName, setSpreadName] = useState("");
  const [spreadDescription, setSpreadDescription] = useState("");
  const [spreadCategory, setSpreadCategory] = useState("General");
  const [positions, setPositions] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [requiresPositions, setRequiresPositions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!spreadId);
  const [activeTab, setActiveTab] = useState("design");
  const [activePosIdx, setActivePosIdx] = useState(0);

  // Tester
  const [testCards, setTestCards] = useState([]);
  const [testRevealed, setTestRevealed] = useState(new Set());
  const [testDrawn, setTestDrawn] = useState(false);
  const [testShuffling, setTestShuffling] = useState(false);

  const aspectRatio = getDesignerAspectRatio(positions.length);

  useEffect(() => {
    if (!spreadId) return;
    (async () => {
      try {
        const s = await base44.entities.Spread.get(spreadId);
        setSpreadName(s.name || ""); setSpreadDescription(s.description || "");
        setSpreadCategory(s.category || "General"); setPositions(s.positions || []);
        setIsPublic(s.is_public || false); setRequiresPositions(s.requires_positions !== false);
      } catch { toast.error("Failed to load spread."); }
      finally { setIsLoading(false); }
    })();
  }, [spreadId]);

  useEffect(() => {
    if (positions.length > 0 && activePosIdx >= positions.length) setActivePosIdx(positions.length - 1);
  }, [positions.length, activePosIdx]);

  const addPosition = () => {
    const next = [...positions, { name: `Position ${positions.length + 1}`, meaning: "", x: 50, y: 50, rotation: 0 }];
    setPositions(next); setActivePosIdx(next.length - 1);
  };
  const removePosition = (idx) => { setPositions(p => p.filter((_, i) => i !== idx)); setActivePosIdx(p => Math.max(0, p > idx ? p - 1 : p)); };
  const updatePosition = (idx, field, value) => setPositions(p => p.map((x, i) => i === idx ? { ...x, [field]: value } : x));

  const handleSave = async () => {
    if (!spreadName.trim()) { toast.error("Please enter a spread name."); return; }
    if (!positions.length) { toast.error("Please add at least one position."); return; }
    for (let i = 0; i < positions.length; i++) {
      if (!positions[i].name?.trim()) { toast.error(`Position ${i + 1} needs a name.`); return; }
      if (!positions[i].meaning?.trim()) { toast.error(`Position ${i + 1} needs a meaning.`); return; }
    }
    setIsSaving(true);
    try {
      const data = { name: spreadName.trim(), description: spreadDescription.trim(), category: spreadCategory, positions, is_public: isPublic, requires_positions: requiresPositions };
      if (spreadId) { await base44.entities.Spread.update(spreadId, data); toast.success("Spread updated!"); }
      else { await base44.entities.Spread.create(data); toast.success("Spread created!"); setSpreadName(""); setSpreadDescription(""); setPositions([]); }
    } catch { toast.error("Failed to save spread."); }
    finally { setIsSaving(false); }
  };

  const mockCards = useMemo(() => positions.map((pos, idx) => ({
    id: `preview-${idx}`, name: pos.name || `Card ${idx + 1}`,
    image_url: TESTER_IMGS[idx % TESTER_IMGS.length],
    overall_meaning: pos.meaning || "", isFlipped: true, position_number: idx + 1,
  })), [positions]);

  const TABS = [
    { id: "design", label: "Design" },
    { id: "positions", label: `Positions (${positions.length})` },
    { id: "preview", label: "Preview" },
    { id: "test", label: "Test" },
    { id: "ai", label: "✨ AI" },
  ];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" /><p className="text-white/60">Loading spread…</p></div>
    </div>
  );

  return (
    <div className="min-h-screen text-white pb-28" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(49,10,84,0.5) 0%, #07050f 60%)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: "rgba(7,5,15,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link to={createPageUrl("SpreadManager")}>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white rounded-full"><ChevronLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{spreadId ? "Edit Spread" : "Create Spread"}</p>
          {spreadName && <p className="text-xs text-purple-400">{spreadName}</p>}
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-full bg-purple-600 hover:bg-purple-700 text-xs px-3">
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" />Save</>}
        </Button>
      </div>

      {/* Tab strip */}
      <div className="sticky top-[52px] z-30 px-4 py-2.5 border-b border-white/6" style={{ background: "rgba(7,5,15,0.88)", backdropFilter: "blur(10px)" }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map(t => <Tab key={t.id} id={t.id} label={t.label} active={activeTab === t.id} onClick={setActiveTab} />)}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* DESIGN */}
        {activeTab === "design" && (
          <motion.div key="design" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="rounded-xl px-4 py-3 flex gap-3 items-start" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-200/80"><strong>Drag</strong> cards to position. <strong>Tap</strong> to select then use the rotation slider. Long-press on mobile to drag.</p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                <span className="text-sm font-semibold text-white/70">Visual Layout</span>
                <Button size="sm" onClick={addPosition} className="rounded-full bg-purple-600 hover:bg-purple-700 text-xs px-3"><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
              </div>
              <div className="p-3">
                {positions.length > 0 ? (
                  <SpreadDesignCanvas positions={positions} onChange={setPositions} showGrid={true} aspectRatio={aspectRatio} />
                ) : (
                  <div className="flex items-center justify-center rounded-xl" style={{ minHeight: 280, border: "2px dashed rgba(167,139,250,0.2)" }}>
                    <div className="text-center">
                      <p className="text-white/40 text-sm mb-3">Add positions to start designing</p>
                      <Button size="sm" onClick={addPosition} className="rounded-full bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-1.5" />Add First Position</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-4 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Spread Details</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-white/60 mb-1 block">Name *</Label>
                  <Input value={spreadName} onChange={e => setSpreadName(e.target.value)} placeholder="e.g., Celtic Cross" className="bg-black/40 border-white/15 text-white text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-white/60 mb-1 block">Description</Label>
                  <Textarea value={spreadDescription} onChange={e => setSpreadDescription(e.target.value)} placeholder="What is this spread for?" className="bg-black/40 border-white/15 text-white text-sm resize-none" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-white/60 mb-1 block">Category</Label>
                    <Select value={spreadCategory} onValueChange={setSpreadCategory}>
                      <SelectTrigger className="bg-black/40 border-white/15 text-white text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/15 text-white">
                        {["General", "Love", "Career", "Spiritual", "Runes", "Custom"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between"><span className="text-xs text-white/60">Position Labels</span><Switch checked={requiresPositions} onCheckedChange={setRequiresPositions} /></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-white/60">Make Public</span><Switch checked={isPublic} onCheckedChange={setIsPublic} /></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* POSITIONS */}
        {activeTab === "positions" && (
          <motion.div key="positions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <PositionCoverflow positions={positions} activeIdx={activePosIdx} onSelect={setActivePosIdx} onAdd={addPosition} onRemove={removePosition} />

            {positions.length > 0 && positions[activePosIdx] && (
              <motion.div key={activePosIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 space-y-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Position {activePosIdx + 1} of {positions.length}</span>
                  <button onClick={() => removePosition(activePosIdx)} className="text-red-400/70 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div>
                  <Label className="text-xs text-white/60 mb-1 block">Name *</Label>
                  <Input value={positions[activePosIdx].name || ""} onChange={e => updatePosition(activePosIdx, "name", e.target.value)} className="bg-black/40 border-white/15 text-white text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-white/60 mb-1 block">Meaning *</Label>
                  <Textarea value={positions[activePosIdx].meaning || ""} onChange={e => updatePosition(activePosIdx, "meaning", e.target.value)} className="bg-black/40 border-white/15 text-white text-sm resize-none" rows={2} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1"><Label className="text-xs text-white/60">Rotation</Label><span className="text-xs text-purple-400 font-mono">{positions[activePosIdx].rotation ?? 0}°</span></div>
                  <input type="range" min={0} max={360} step={1} value={positions[activePosIdx].rotation ?? 0} onChange={e => updatePosition(activePosIdx, "rotation", parseInt(e.target.value, 10))} className="w-full accent-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["x", "y"].map(axis => (
                    <div key={axis}>
                      <div className="flex items-center justify-between mb-1"><Label className="text-xs text-white/60">{axis.toUpperCase()} position</Label><span className="text-xs text-white/50 font-mono">{Math.round(positions[activePosIdx][axis] ?? 50)}%</span></div>
                      <input type="range" min={0} max={100} step={1} value={Math.round(positions[activePosIdx][axis] ?? 50)} onChange={e => updatePosition(activePosIdx, axis, parseInt(e.target.value, 10))} className="w-full accent-purple-500" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setActivePosIdx(p => ((p - 1 + positions.length) % positions.length))} className="flex-1 rounded-xl border-white/15 text-white hover:bg-white/10"><ChevronLeft className="w-4 h-4 mr-1" />Prev</Button>
                  <Button size="sm" variant="outline" onClick={() => setActivePosIdx(p => (p + 1) % positions.length)} className="flex-1 rounded-xl border-white/15 text-white hover:bg-white/10">Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </motion.div>
            )}

            <Button onClick={addPosition} variant="outline" className="w-full rounded-2xl border-purple-500/30 text-purple-300 hover:bg-purple-500/10"><Plus className="w-4 h-4 mr-2" />Add Another Position</Button>
          </motion.div>
        )}

        {/* PREVIEW */}
        {activeTab === "preview" && (
          <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.3)", background: "rgba(0,0,0,0.3)" }}>
              <div className="px-4 py-3 border-b border-cyan-500/15">
                <p className="text-sm font-semibold text-cyan-300">Reading Preview</p>
                <p className="text-xs text-white/40 mt-0.5">Exactly how this spread appears during readings</p>
              </div>
              <div className="p-4" style={{ minHeight: 320 }}>
                {positions.length > 0 ? (
                  <SpreadLayout spread={{ name: spreadName || "Preview Spread", positions, requires_positions: requiresPositions }} positions={positions} cards={mockCards} requiresPositions={requiresPositions} showPositionLabels={requiresPositions} hideEmptySlots={false} revealMode="instant" animateSpread={false} containerMinH="300px" />
                ) : (
                  <div className="flex items-center justify-center h-60"><p className="text-white/30 text-sm">Add positions in the Design tab to preview</p></div>
                )}
              </div>
            </div>
            <div className="rounded-xl px-4 py-3 text-xs text-cyan-200/60" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
              💡 Preview uses placeholder images. Go to <strong>Test</strong> to draw cards and interact.
            </div>
          </motion.div>
        )}

        {/* TEST */}
        {activeTab === "test" && (
          <motion.div key="test" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {!testDrawn && !testShuffling && (
              <div className="rounded-2xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="text-5xl mb-4">🃏</div>
                <h3 className="text-white font-bold text-lg mb-1">Test Your Spread</h3>
                <p className="text-white/50 text-sm mb-6">Draw {positions.length} mock card{positions.length !== 1 ? "s" : ""} to feel how your spread works.</p>
                <motion.button onClick={() => { if (!positions.length) { toast.error("Add positions first."); return; } setTestShuffling(true); setTimeout(() => { setTestCards(buildMockCards(positions)); setTestRevealed(new Set()); setTestDrawn(true); setTestShuffling(false); }, 1200); }}
                  disabled={!positions.length} className="px-8 py-4 rounded-2xl font-bold text-white text-base disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#be185d)" }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Shuffle className="w-5 h-5 inline mr-2" />Draw Cards
                </motion.button>
              </div>
            )}

            {testShuffling && (
              <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(167,139,250,0.2)", background: "rgba(0,0,0,0.3)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-4xl mx-auto mb-4 w-fit text-purple-400">✦</motion.div>
                <p className="text-purple-300 font-semibold">Shuffling…</p>
              </div>
            )}

            {testDrawn && !testShuffling && (
              <>
                <div className="flex gap-3 flex-wrap justify-center py-2">
                  {testCards.map((card, i) => {
                    const revealed = testRevealed.has(i);
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        {revealed ? (
                          <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.35 }}
                            className="w-20 h-32 rounded-xl overflow-hidden border-2 border-purple-400/50 relative cursor-pointer" style={{ boxShadow: "0 0 18px rgba(167,139,250,0.35)" }}>
                            <img src={card.image_url} alt={card.name} className={`w-full h-full object-cover ${card.isReversed ? "rotate-180" : ""}`} />
                            {card.isReversed && <div className="absolute top-1 right-1 bg-amber-500/80 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-[8px] font-bold text-white">R</span></div>}
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            onClick={() => setTestRevealed(p => { const n = new Set(p); n.add(i); return n; })}
                            className="w-20 h-32 rounded-xl border-2 border-purple-400/40 cursor-pointer flex items-center justify-center"
                            style={{ background: "radial-gradient(135% 135% at 30% 20%, rgba(124,58,237,0.35) 0%, #0f0b1e 100%)" }}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
                            <span className="text-purple-400/60 text-2xl select-none">✦</span>
                          </motion.div>
                        )}
                        <span className="text-[10px] text-white/40 max-w-[80px] truncate text-center">{card.position}</span>
                        {revealed && <span className="text-[9px] text-purple-300 max-w-[80px] truncate text-center">{card.name}</span>}
                      </div>
                    );
                  })}
                </div>

                {testRevealed.size > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <SpreadLayout spread={{ name: spreadName || "Test", positions, requires_positions: requiresPositions }} positions={positions}
                      cards={testCards.map((c, i) => ({ ...c, image_url: testRevealed.has(i) ? c.image_url : null }))}
                      requiresPositions={requiresPositions} showPositionLabels={true} hideEmptySlots={false} revealMode="instant" animateSpread={false} containerMinH="280px" />
                  </div>
                )}

                <div className="flex gap-3">
                  {testRevealed.size < testCards.length && (
                    <Button onClick={() => setTestRevealed(new Set(testCards.map((_, i) => i)))} className="flex-1 rounded-2xl" style={{ background: "linear-gradient(135deg,#7c3aed,#be185d)" }}>
                      <Eye className="w-4 h-4 mr-2" />Reveal All
                    </Button>
                  )}
                  <Button onClick={() => { setTestCards([]); setTestRevealed(new Set()); setTestDrawn(false); }} variant="outline"
                    className={`rounded-2xl border-white/20 text-white hover:bg-white/10 ${testRevealed.size < testCards.length ? "" : "flex-1"}`}>
                    <RotateCcw className="w-4 h-4 mr-2" />New Draw
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* AI */}
        {activeTab === "ai" && (
          <motion.div key="ai" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-xl px-4 py-3 flex gap-3 items-start" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-200/80">Describe the reading you want and the AI will generate positions, meanings, and coordinates — ready to edit.</p>
            </div>
            <AISpreadAssistant onApply={s => {
              try {
                if (s?.spread_name) setSpreadName(s.spread_name);
                if (s?.description) setSpreadDescription(s.description);
                if (s?.category) setSpreadCategory(s.category);
                if (Array.isArray(s?.positions)) {
                  setPositions(s.positions.map((p, i) => ({ name: p.name || `Position ${i + 1}`, meaning: p.meaning || "", x: typeof p.x === "number" ? Math.max(0, Math.min(100, p.x)) : 50, y: typeof p.y === "number" ? Math.max(0, Math.min(100, p.y)) : 50, rotation: typeof p.rotation === "number" ? p.rotation : 0 })));
                  setActivePosIdx(0);
                }
                setActiveTab("design");
              } catch (_) { }
            }} />
          </motion.div>
        )}

        {/* Bottom save */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full py-5 rounded-2xl font-bold text-base" style={{ background: "linear-gradient(135deg,#7c3aed,#0ea5e9)" }}>
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : <><Save className="w-4 h-4 mr-2" />{spreadId ? "Update Spread" : "Create Spread"}</>}
        </Button>

      </div>
    </div>
  );
}