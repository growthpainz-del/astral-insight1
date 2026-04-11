import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Plus, Trash2, Download, Upload, Save, Copy, Sparkles, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const DEFAULT_SEGMENT = { label: "", meaning: "", type: "custom", icon: "", card_id: "" };

const RING_LABELS = {
  outer_ring: { label: "Outer Ring", color: "amber", hint: "Cards, archetypes, core energies — the largest ring" },
  middle_ring: { label: "Middle Ring", color: "orange", hint: "Modifiers, context, timing symbols" },
  inner_ring: { label: "Inner Ring", color: "yellow", hint: "Action guidance, yes/no, directional symbols" },
};

const THEME_PACKS = {
  yes_no: [
    { label: "Yes", meaning: "Yes — the answer is affirmative", type: "symbol", icon: "✅", card_id: "" },
    { label: "No", meaning: "No — the answer is negative", type: "symbol", icon: "❌", card_id: "" },
    { label: "Maybe", meaning: "Unclear, ask again later", type: "symbol", icon: "🤷", card_id: "" }
  ],
  elements: [
    { label: "Fire", meaning: "Passion and transformation", type: "symbol", icon: "🔥", card_id: "" },
    { label: "Air", meaning: "Thought, communication, movement", type: "symbol", icon: "💨", card_id: "" },
    { label: "Water", meaning: "Emotion, intuition, flow", type: "symbol", icon: "🌊", card_id: "" },
    { label: "Earth", meaning: "Stability, grounding, manifestation", type: "symbol", icon: "🌍", card_id: "" }
  ],
  timing: [
    { label: "Soon", meaning: "It will happen soon", type: "symbol", icon: "⏳", card_id: "" },
    { label: "Patience", meaning: "It will take time", type: "symbol", icon: "🕰️", card_id: "" },
    { label: "Now", meaning: "Immediate action required", type: "symbol", icon: "🚀", card_id: "" }
  ],
  directions: [
    { label: "North", meaning: "Look North / move forward", type: "symbol", icon: "⬆️", card_id: "" },
    { label: "South", meaning: "Look South / retreat inward", type: "symbol", icon: "⬇️", card_id: "" },
    { label: "East", meaning: "New beginnings, the rising sun", type: "symbol", icon: "➡️", card_id: "" },
    { label: "West", meaning: "Endings, reflection, the setting sun", type: "symbol", icon: "⬅️", card_id: "" }
  ],
  zodiac: [
    { label: "Aries", meaning: "Bold, pioneering, courageous", type: "symbol", icon: "♈", card_id: "" },
    { label: "Taurus", meaning: "Steadfast, grounded, reliable", type: "symbol", icon: "♉", card_id: "" },
    { label: "Gemini", meaning: "Versatile, expressive, curious", type: "symbol", icon: "♊", card_id: "" },
    { label: "Cancer", meaning: "Intuitive, protective, nurturing", type: "symbol", icon: "♋", card_id: "" },
    { label: "Leo", meaning: "Dramatic, generous, proud", type: "symbol", icon: "♌", card_id: "" },
    { label: "Virgo", meaning: "Practical, analytical, humble", type: "symbol", icon: "♍", card_id: "" },
    { label: "Libra", meaning: "Diplomatic, harmonious, fair", type: "symbol", icon: "♎", card_id: "" },
    { label: "Scorpio", meaning: "Intense, transformative, passionate", type: "symbol", icon: "♏", card_id: "" },
    { label: "Sagittarius", meaning: "Adventurous, optimistic, free", type: "symbol", icon: "♐", card_id: "" },
    { label: "Capricorn", meaning: "Ambitious, disciplined, responsible", type: "symbol", icon: "♑", card_id: "" },
    { label: "Aquarius", meaning: "Innovative, progressive, humanitarian", type: "symbol", icon: "♒", card_id: "" },
    { label: "Pisces", meaning: "Compassionate, artistic, empathetic", type: "symbol", icon: "♓", card_id: "" }
  ],
  planets: [
    { label: "Sun", meaning: "Ego, vitality, consciousness", type: "symbol", icon: "☀️", card_id: "" },
    { label: "Moon", meaning: "Emotions, instincts, habits", type: "symbol", icon: "🌙", card_id: "" },
    { label: "Mercury", meaning: "Communication, intellect, reason", type: "symbol", icon: "☿", card_id: "" },
    { label: "Venus", meaning: "Love, beauty, harmony", type: "symbol", icon: "♀", card_id: "" },
    { label: "Mars", meaning: "Action, desire, aggression", type: "symbol", icon: "♂", card_id: "" },
    { label: "Jupiter", meaning: "Expansion, luck, philosophy", type: "symbol", icon: "♃", card_id: "" },
    { label: "Saturn", meaning: "Restriction, discipline, structure", type: "symbol", icon: "♄", card_id: "" },
    { label: "Uranus", meaning: "Innovation, rebellion, unpredictability", type: "symbol", icon: "♅", card_id: "" },
    { label: "Neptune", meaning: "Dreams, illusion, spirituality", type: "symbol", icon: "♆", card_id: "" },
    { label: "Pluto", meaning: "Transformation, power, rebirth", type: "symbol", icon: "♇", card_id: "" }
  ],
  chakras: [
    { label: "Root", meaning: "Survival, grounding, security", type: "symbol", icon: "🔴", card_id: "" },
    { label: "Sacral", meaning: "Emotions, creativity, sexuality", type: "symbol", icon: "🟠", card_id: "" },
    { label: "Solar Plexus", meaning: "Willpower, confidence, identity", type: "symbol", icon: "🟡", card_id: "" },
    { label: "Heart", meaning: "Love, compassion, connection", type: "symbol", icon: "🟢", card_id: "" },
    { label: "Throat", meaning: "Communication, truth, expression", type: "symbol", icon: "🔵", card_id: "" },
    { label: "Third Eye", meaning: "Intuition, imagination, wisdom", type: "symbol", icon: "🟣", card_id: "" },
    { label: "Crown", meaning: "Spirituality, connection to divine", type: "symbol", icon: "⚪", card_id: "" }
  ]
};

const PRESET_SYMBOLS = [
  ...THEME_PACKS.yes_no,
  ...THEME_PACKS.elements,
  ...THEME_PACKS.timing,
  ...THEME_PACKS.directions,
  ...THEME_PACKS.zodiac,
  ...THEME_PACKS.planets,
  ...THEME_PACKS.chakras
];

function RingEditor({ ringKey, segments, setSegments, deckCards }) {
  const meta = RING_LABELS[ringKey];
  const [isHarvesting, setIsHarvesting] = useState(false);

  const addSegment = () => setSegments([...segments, { ...DEFAULT_SEGMENT }]);

  const handleHarvestSymbols = async () => {
    if (segments.length === 0) return;
    setIsHarvesting(true);
    try {
      const items = segments.map(s => ({ label: s.label, meaning: s.meaning }));
      const res = await base44.functions.invoke("harvestSymbols", { items });
      if (res.data && res.data.emojis) {
        const updated = segments.map((seg, i) => ({
          ...seg,
          icon: seg.icon || res.data.emojis[i] || "✨"
        }));
        setSegments(updated);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to harvest symbols.");
    } finally {
      setIsHarvesting(false);
    }
  };

  const addAllCards = () => {
    if (!deckCards || deckCards.length === 0) return;
    const newSegments = deckCards.map(card => ({
      label: card.name || "",
      meaning: card.overall_meaning || card.upright_meaning || (card.keywords ? card.keywords.join(", ") : "") || card.name || "",
      type: "card",
      icon: card.spirit_wheel_icon_url || "",
      card_id: card.id
    }));
    setSegments([...segments, ...newSegments]);
  };

  const removeSegment = (i) => setSegments(segments.filter((_, idx) => idx !== i));

  const updateSegment = (i, field, value) => {
    const updated = [...segments];
    updated[i] = { ...updated[i], [field]: value };
    // If selecting a card, auto-fill label and meaning
    if (field === "card_id" && value) {
      const card = deckCards.find(c => c.id === value);
      if (card) {
        updated[i].label = card.name;
        updated[i].meaning = card.overall_meaning || card.upright_meaning || card.keywords?.join(", ") || card.name;
        updated[i].icon = card.spirit_wheel_icon_url || "";
        updated[i].type = "card";
      }
    }
    setSegments(updated);
  };

  const applyPreset = (i, preset) => {
    const updated = [...segments];
    updated[i] = { ...updated[i], icon: preset.icon, label: preset.label, meaning: preset.meaning, type: "symbol" };
    setSegments(updated);
  };

  const colorMap = {
    amber: "border-amber-500/40 bg-amber-950/20",
    orange: "border-orange-500/40 bg-orange-950/20",
    yellow: "border-yellow-500/40 bg-yellow-950/20",
  };

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${colorMap[meta.color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-amber-300">{meta.label}</h3>
          <p className="text-xs text-amber-200/60">{meta.hint} — {segments.length} segments</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {segments.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleHarvestSymbols} disabled={isHarvesting} className="border-amber-600/40 text-amber-300 hover:bg-amber-900/20 h-8">
              {isHarvesting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Harvest Symbols
            </Button>
          )}
          {deckCards && deckCards.length > 0 && (
            <Button size="sm" variant="outline" onClick={addAllCards} className="border-amber-600/40 text-amber-300 hover:bg-amber-900/20 h-8">
              <Sparkles className="w-4 h-4 mr-1" /> Add All Cards
            </Button>
          )}
          <Select onValueChange={(v) => {
            if(v && THEME_PACKS[v]) setSegments([...segments, ...THEME_PACKS[v]]);
          }} value="">
            <SelectTrigger className="w-40 bg-amber-900/40 hover:bg-amber-800/60 border-amber-600/40 text-amber-100 h-8 text-xs focus:ring-0">
              <SelectValue placeholder="Add Theme Pack..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="yes_no">Yes / No / Maybe</SelectItem>
              <SelectItem value="elements">Elements</SelectItem>
              <SelectItem value="timing">Timing</SelectItem>
              <SelectItem value="directions">Directions</SelectItem>
              <SelectItem value="zodiac">Zodiac Signs</SelectItem>
              <SelectItem value="planets">Planets</SelectItem>
              <SelectItem value="chakras">Chakras</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={addSegment} className="bg-amber-700 hover:bg-amber-600 text-white h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Custom
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {segments.length === 0 && (
          <div className="text-center text-amber-200/40 py-8 italic">No segments yet. Add one or import JSON.</div>
        )}
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-lg p-3 space-y-2 border border-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs w-5 shrink-0">#{i + 1}</span>
              <Input
                value={seg.icon}
                onChange={e => updateSegment(i, "icon", e.target.value)}
                placeholder="Icon/Emoji"
                className="w-20 bg-black/40 border-white/10 text-center text-lg"
              />
              <Input
                value={seg.label}
                onChange={e => updateSegment(i, "label", e.target.value)}
                placeholder="Label (shown on wheel)"
                className="flex-1 bg-black/40 border-white/10"
              />
              <Select value={seg.type} onValueChange={v => updateSegment(i, "type", v)}>
                <SelectTrigger className="w-28 bg-black/40 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="symbol">Symbol</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" onClick={() => removeSegment(i)} className="text-red-400 hover:text-red-300 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {seg.type === "card" && deckCards.length > 0 && (
              <Select value={seg.card_id || ""} onValueChange={v => updateSegment(i, "card_id", v)}>
                <SelectTrigger className="bg-black/40 border-white/10 text-xs">
                  <SelectValue placeholder="Select a card..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-48">
                  {deckCards.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {seg.type === "symbol" && (
              <div className="flex flex-wrap gap-1">
                {PRESET_SYMBOLS.map(p => (
                  <button
                    key={p.icon}
                    onClick={() => applyPreset(i, p)}
                    title={p.meaning}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {p.icon}
                  </button>
                ))}
              </div>
            )}

            <Input
              value={seg.meaning}
              onChange={e => updateSegment(i, "meaning", e.target.value)}
              placeholder="Full meaning (revealed after spin)"
              className="bg-black/40 border-white/10 text-sm"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function SpiritWheelDesigner() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deckId, setDeckId] = useState("none");
  const [themeId, setThemeId] = useState("wood");
  const [isPublic, setIsPublic] = useState(false);
  const [outerRing, setOuterRing] = useState([]);
  const [middleRing, setMiddleRing] = useState([]);
  const [innerRing, setInnerRing] = useState([]);
  const [decks, setDecks] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jsonImportText, setJsonImportText] = useState("");
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const user = await base44.auth.me().catch(() => null);
        let allDecks = await base44.entities.Deck.list("-updated_date", 200);
        if (user?.email) {
          allDecks = allDecks.filter(d => d.created_by?.toLowerCase() === user.email.toLowerCase() || d.is_public);
        }
        setDecks(allDecks || []);

        if (editId) {
          const config = await base44.entities.SpiritWheelConfiguration.get(editId);
          if (config) {
            setName(config.name || "");
            setDescription(config.description || "");
            setDeckId(config.deck_id || "none");
            setThemeId(config.theme_id || "wood");
            setIsPublic(config.is_public || false);
            setOuterRing(config.outer_ring || []);
            setMiddleRing(config.middle_ring || []);
            setInnerRing(config.inner_ring || []);
            if (config.deck_id) {
              const cards = await base44.entities.Card.filter({ deck_id: config.deck_id });
              setDeckCards(cards || []);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [editId]);

  useEffect(() => {
    if (!deckId || deckId === "none") { setDeckCards([]); return; }
    base44.entities.Card.filter({ deck_id: deckId }).then(cards => setDeckCards(cards || []));
  }, [deckId]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this wheel configuration?")) {
      setIsSaving(true);
      try {
        await base44.entities.SpiritWheelConfiguration.delete(editId);
        alert("Deleted successfully!");
        navigate(createPageUrl("SpiritWheel"));
      } catch (e) {
        console.error(e);
        alert("Failed to delete.");
        setIsSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { alert("Please give this wheel a name."); return; }
    setIsSaving(true);
    try {
      const data = {
        name,
        description,
        deck_id: deckId !== "none" ? deckId : null,
        theme_id: themeId,
        is_public: isPublic,
        outer_ring: outerRing,
        middle_ring: middleRing,
        inner_ring: innerRing,
      };
      if (editId) {
        await base44.entities.SpiritWheelConfiguration.update(editId, data);
      } else {
        const created = await base44.entities.SpiritWheelConfiguration.create(data);
        navigate(`/SpiritWheelDesigner?id=${created.id}`);
      }
      alert("Saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const config = { name, description, deck_id: deckId !== "none" ? deckId : null, theme_id: themeId, is_public: isPublic, outer_ring: outerRing, middle_ring: middleRing, inner_ring: innerRing };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "spirit-wheel"}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonImportText);
      if (parsed.name) setName(parsed.name);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.deck_id) setDeckId(parsed.deck_id);
      if (parsed.theme_id) setThemeId(parsed.theme_id);
      if (parsed.outer_ring) setOuterRing(parsed.outer_ring);
      if (parsed.middle_ring) setMiddleRing(parsed.middle_ring);
      if (parsed.inner_ring) setInnerRing(parsed.inner_ring);
      setShowJsonPanel(false);
      setJsonImportText("");
    } catch (e) {
      setJsonError("Invalid JSON: " + e.message);
    }
  };

  const handleCopyJson = () => {
    const config = { name, description, outer_ring: outerRing, middle_ring: middleRing, inner_ring: innerRing };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert("JSON copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("SpiritWheel")}>
            <Button variant="ghost" size="icon" className="text-amber-300 hover:text-amber-100">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> Spirit Wheel Designer
            </h1>
            <p className="text-sm text-amber-200/60">Build your custom oracle wheel — form-based with JSON import/export</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowJsonPanel(!showJsonPanel)} className="border-amber-600/40 text-amber-300 hover:bg-amber-900/20">
              <Upload className="w-4 h-4 mr-2" /> Import JSON
            </Button>
            <Button variant="outline" onClick={handleExportJson} className="border-amber-600/40 text-amber-300 hover:bg-amber-900/20">
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            <Button variant="outline" onClick={handleCopyJson} className="border-amber-600/40 text-amber-300 hover:bg-amber-900/20">
              <Copy className="w-4 h-4 mr-2" /> Copy JSON
            </Button>
            {editId && (
              <Button variant="outline" onClick={handleDelete} disabled={isSaving} className="border-red-600/40 text-red-400 hover:bg-red-900/20">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 text-white">
              <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* JSON Import Panel */}
        {showJsonPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-amber-600/30 rounded-xl p-5 space-y-3"
          >
            <h3 className="font-semibold text-amber-300">Paste your JSON configuration below:</h3>
            <Textarea
              value={jsonImportText}
              onChange={e => setJsonImportText(e.target.value)}
              placeholder='{"name": "My Wheel", "outer_ring": [...], "middle_ring": [...], "inner_ring": [...]}'
              className="min-h-[180px] bg-black/50 border-white/10 font-mono text-sm"
            />
            {jsonError && <p className="text-red-400 text-sm">{jsonError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleImportJson} className="bg-emerald-600 hover:bg-emerald-500">Import</Button>
              <Button variant="ghost" onClick={() => setShowJsonPanel(false)} className="text-white/60">Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Basic Info */}
        <div className="bg-slate-900/70 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-lg">Wheel Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-200/80">Wheel Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Love Reading Wheel" className="bg-black/40 border-white/10 mt-1" />
            </div>
            <div>
              <Label className="text-amber-200/80">Source Deck (for card segments)</Label>
              <Select value={deckId} onValueChange={setDeckId}>
                <SelectTrigger className="bg-black/40 border-white/10 mt-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-64">
                  <SelectItem value="none">None</SelectItem>
                  {decks.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-amber-200/80">Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this wheel for?" className="bg-black/40 border-white/10 mt-1" />
            </div>
            <div>
              <Label className="text-amber-200/80">Default Visual Theme</Label>
              <Select value={themeId} onValueChange={setThemeId}>
                <SelectTrigger className="bg-black/40 border-white/10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="wood">Classic Wood</SelectItem>
                  <SelectItem value="galaxy">Cosmic Galaxy</SelectItem>
                  <SelectItem value="neon">Cyber Neon</SelectItem>
                  <SelectItem value="parchment">Ancient Parchment</SelectItem>
                  <SelectItem value="stone_led">Stone + LED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="public-check" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-amber-500 w-4 h-4" />
              <Label htmlFor="public-check" className="text-amber-200/80 cursor-pointer">Make this wheel publicly available</Label>
            </div>
          </div>
        </div>

        {/* Ring Editors */}
        <RingEditor ringKey="outer_ring" segments={outerRing} setSegments={setOuterRing} deckCards={deckCards} />
        <RingEditor ringKey="middle_ring" segments={middleRing} setSegments={setMiddleRing} deckCards={deckCards} />
        <RingEditor ringKey="inner_ring" segments={innerRing} setSegments={setInnerRing} deckCards={deckCards} />

        {/* Bottom save */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-6 text-lg">
            <Save className="w-5 h-5 mr-2" /> {isSaving ? "Saving..." : "Save Wheel Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}