import React, { useEffect, useState } from "react";
import { Deck } from "@/entities/Deck";
import { Card } from "@/entities/Card";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Play, Settings, Image as ImageIcon, Upload, BookOpen,
  Trash2, Link as LinkIcon, FileJson, Wand2, Images, Layers,
  RefreshCw, FileSpreadsheet, Eye, Pencil, Download, Sparkles,
  FileText, Send, Palette, AlertTriangle, Globe, Lock, ChevronLeft,
} from "lucide-react";

import AIManualBuilder            from "@/components/deck/AIManualBuilder";
import BulkImageUrlMatcher        from "@/components/deck/BulkImageUrlMatcher";
import BulkLocalImageUploaderInline from "@/components/deck/BulkLocalImageUploaderInline";
import BulkSpreadImporter         from "@/components/deck/BulkSpreadImporter";
import CombinedImporter           from "@/components/deck/CombinedImporter";
import BulkRehoster               from "@/components/deck/BulkRehoster";
import DeckCoverEditor            from "@/components/deck/DeckCoverEditor";
import QuickCustomNotes           from "@/components/deck/QuickCustomNotes";
import ManualManager              from "@/components/deck/ManualManager";
import DeckVersionManager         from "@/components/deck/DeckVersionManager";
import DeckSettings               from "@/components/deck/DeckSettings";
import JsonCardUpdater            from "@/components/deck/JsonCardUpdater";
import CardManager                from "@/components/deck/CardManager";
import JsonCardImporter           from "@/components/deck/JsonCardImporter";
import BulkCsvUploader            from "@/components/deck/BulkCsvUploader";
import BulkAIImageGenerator       from "@/components/deck/BulkAIImageGenerator";
import AICoachEditor              from "@/components/deck/AICoachEditor";
import PublishingDashboard        from "@/components/deck/PublishingDashboard";
import StyleExtractor             from "@/components/deck/StyleExtractor";
import ImageUrlDiagnostics        from "@/components/deck/ImageUrlDiagnostics";
import CardRelationshipVisualizer from "@/components/deck/CardRelationshipVisualizer";
import DeckInsightsAnalyzer       from "@/components/deck/DeckInsightsAnalyzer";
import PersonaFromInsights        from "@/components/deck/PersonaFromInsights";

// ─── Tool button ──────────────────────────────────────────────────────────────
function ToolBtn({ label, icon: Icon, onClick, color, asLink = false, to = "#" }) {
  const inner = (
    <div
      onClick={asLink ? undefined : onClick}
      className="w-full cursor-pointer rounded-2xl px-4 py-3 text-white transition-all hover:opacity-90 active:scale-95"
      style={{ background: color }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-black/20 flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-semibold text-sm leading-tight">{label}</span>
      </div>
    </div>
  );
  return asLink ? <Link to={to} className="w-full block">{inner}</Link> : inner;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label, color }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-7 first:mt-0">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────
function Tab({ id, label, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
      style={
        active
          ? { background: "rgba(167,139,250,0.25)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.45)" }
          : { background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }
      }
    >
      {label}
    </button>
  );
}

// ─── Inline tool panel ────────────────────────────────────────────────────────
function ToolPanel({ tool, deck, cards, setDeck, setCards, reloadCards }) {
  if (!tool) return null;

  const map = {
    aiCoach:            { title: "AI Reading Coach",      icon: Sparkles, color: "text-purple-300", node: <AICoachEditor deckId={deck.id} deck={deck} onDone={() => Deck.get(deck.id).then(setDeck)} /> },
    styleExtractor:     { title: "Style DNA Extractor",   icon: Palette,  color: "text-pink-300",   node: <StyleExtractor deckId={deck.id} onStyleExtracted={() => {}} /> },
    personaFromInsights:{ title: "Persona from Insights", icon: Sparkles, color: "text-purple-300", node: <PersonaFromInsights deckId={deck.id} deck={deck} onSaved={(p) => setDeck(prev => ({ ...prev, ai_reading_coach: p }))} /> },
    bulkImageUrls:      { title: "Bulk Image URLs",       icon: LinkIcon, color: "text-cyan-300",   node: <BulkImageUrlMatcher deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} /> },
    bulkLocalImages:    { title: "Bulk Local Images",     icon: Images,   color: "text-rose-300",   node: <BulkLocalImageUploaderInline deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} /> },
    bulkSpreads:        { title: "Bulk Spreads Import",   icon: Layers,   color: "text-indigo-300", node: <BulkSpreadImporter deckId={deck.id} /> },
    combinedImport:     { title: "All-in-One Import",     icon: FileSpreadsheet, color: "text-pink-300", node: <CombinedImporter deckId={deck.id} /> },
    bulkAIImages:       { title: "Bulk AI Image Generator", icon: Wand2,  color: "text-purple-300", node: <BulkAIImageGenerator deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} /> },
    rehost:             { title: "Rehost Images",         icon: RefreshCw,color: "text-amber-300",  node: <BulkRehoster deckId={deck.id} /> },
    customNotes:        { title: "Custom Notes",          icon: FileJson, color: "text-yellow-300", node: <QuickCustomNotes deckId={deck.id} /> },
    settingsInline:     { title: "Deck Settings",         icon: Settings, color: "text-slate-300",  node: <DeckSettings deckId={deck.id} deck={deck} inline={true} onSaved={() => Deck.get(deck.id).then(setDeck)} /> },
    csvImport:          { title: "CSV Import",            icon: FileSpreadsheet, color: "text-blue-300", node: <BulkCsvUploader deckId={deck.id} onDone={() => { Deck.get(deck.id).then(setDeck); reloadCards(); }} /> },
    jsonUpdater:        { title: "JSON Updater",          icon: FileJson, color: "text-violet-300", node: <JsonCardUpdater deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} /> },
    jsonImport:         { title: "Import JSON",           icon: Upload,   color: "text-cyan-300",   node: <JsonCardImporter deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} /> },
    cardManager:        { title: "Card Manager",          icon: Pencil,   color: "text-teal-300",   node: <CardManager deckId={deck.id} cards={cards} onUpdate={(c) => { setCards(c); reloadCards(); }} /> },
  };

  const p = map[tool];
  if (!p) return null;
  const Icon = p.icon;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        <Icon className={`w-5 h-5 ${p.color}`} />
        <h3 className="font-bold text-white">{p.title}</h3>
      </div>
      <div className="p-5">{p.node}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DeckView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const deckIdFromUrl = searchParams.get("id") || searchParams.get("deckId");

  const [deck, setDeck]                   = useState(null);
  const [cards, setCards]                 = useState([]);
  const [loading, setLoading]             = useState(!!deckIdFromUrl);
  const [error, setError]                 = useState("");
  const [selectedTool, setSelectedTool]   = useState("");
  const [activeTab, setActiveTab]         = useState("cards");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicateDeck = async () => {
    if (!deck?.id) return;
    setIsDuplicating(true);
    try {
      const { id, created_date, updated_date, created_by, ...deckData } = deck;
      deckData.name = deckData.name + ' (Copy)';
      deckData.is_public = false;
      
      const newDeck = await base44.entities.Deck.create(deckData);
      
      const newCards = cards.map(c => {
        const { id, created_date, updated_date, created_by, ...cardData } = c;
        cardData.deck_id = newDeck.id;
        return cardData;
      });
      
      const chunkSize = 50;
      for (let i = 0; i < newCards.length; i += chunkSize) {
        await base44.entities.Card.bulkCreate(newCards.slice(i, i + chunkSize));
      }
      
      toast.success(`Duplicated "${deck.name}" successfully!`);
      navigate(createPageUrl(`DeckView?id=${newDeck.id}`));
    } catch (err) {
      toast.error('Failed to duplicate deck.');
    } finally {
      setIsDuplicating(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!deckIdFromUrl) { setLoading(false); setError("No deck id provided."); return; }
      setLoading(true); setError("");
      try {
        const [d, cardsList] = await Promise.all([
          queueApiCall(() => Deck.get(deckIdFromUrl), 5, 2000),
          queueApiCall(() => Card.filter({ deck_id: deckIdFromUrl }), 5, 2000),
        ]);
        if (active) { setDeck(d); setCards(cardsList || []); }
      } catch (e) {
        if (!active) return;
        if (isNetworkError(e))               setError("Network issue. Check your connection and refresh.");
        else if (e.response?.status === 404) setError("Deck not found. It may have been deleted.");
        else                                 setError("Failed to load deck. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [deckIdFromUrl]);

  const reloadCards = async () => {
    try {
      const c = await queueApiCall(() => Card.filter({ deck_id: deckIdFromUrl }), 5, 2000);
      setCards(c || []);
    } catch (_) {}
  };

  const handleExportJson = async () => {
    if (!deck?.id) return;
    try {
      const allCards = await Card.filter({ deck_id: deck.id });
      const data = {
        deck: { name: deck.name, description: deck.description, author: deck.author, category: deck.category, cover_image: deck.cover_image, back_image_url: deck.back_image_url, is_public: deck.is_public, is_premium: deck.is_premium, ai_reading_coach: deck.ai_reading_coach, manual_url: deck.manual_url, manual_content: deck.manual_content, censor_mode: deck.censor_mode, suggested_questions: deck.suggested_questions },
        cards: allCards.map(c => ({ name: c.name, number: c.number, subtitle: c.subtitle, image_url: c.image_url, video_url: c.video_url, frame_style: c.frame_style, element: c.element, keywords: c.keywords, ancient_wisdom: c.ancient_wisdom, overall_meaning: c.overall_meaning, upright_meaning: c.upright_meaning, upright_insight: c.upright_insight, upright_action: c.upright_action, reversed_meaning: c.reversed_meaning, reversed_insight: c.reversed_insight, reversed_action: c.reversed_action, interaction: c.interaction, musician_quote: c.musician_quote, facedown_meaning: c.facedown_meaning, custom: c.custom, custom_ai_notes: c.custom_ai_notes, custom_ai_helper: c.custom_ai_helper, custom_fields: c.custom_fields, ai_image_prompt: c.ai_image_prompt, ai_image_negative_prompt: c.ai_image_negative_prompt, ai_prompt_style: c.ai_prompt_style, ai_reference_image_url: c.ai_reference_image_url })),
        exported_date: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${deck.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_export.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Deck exported!");
    } catch (e) { toast.error("Failed to export: " + (e.message || "Unknown error")); }
  };

  const handleDeleteDeck = async () => {
    if (!deck?.id) return;
    setIsDeleting(true);
    try {
      const { data } = await base44.functions.invoke("deleteDeckCascade", { deckId: deck.id });
      if (data?.error) throw new Error(data.error);
      toast.success("Deck deleted.");
      navigate(createPageUrl("Dashboard"));
    } catch (e) {
      toast.error(`Delete failed: ${e.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto mb-3" />
          <p className="text-white/60">Loading deck…</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/80 mb-6">{error || "Deck not found."}</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const galleryUrl = createPageUrl(`DeckGallery?deckId=${deck.id}`);

  const TABS = [
    { id: "cards",         label: "Cards"          },
    { id: "insights",      label: "AI Insights"    },
    { id: "relationships", label: "Relationships"  },
    { id: "manual",        label: "Manual Builder" },
    { id: "settings",      label: "Settings"       },
    { id: "publishing",    label: "Publishing"     },
  ];

  return (
    <div className="min-h-screen text-white pb-24">

      {/* ── Hero ── */}
      <div style={{ background: "radial-gradient(ellipse 140% 100% at 50% 0%, rgba(124,58,237,0.22) 0%, transparent 70%)" }}>
        <div className="relative w-full overflow-hidden" style={{ maxHeight: 280 }}>
          {deck.cover_image ? (
            <img src={deck.cover_image} alt={deck.name} className="w-full object-cover" style={{ maxHeight: 280 }} />
          ) : (
            <div className="w-full flex items-center justify-center" style={{ height: 200, background: "rgba(124,58,237,0.12)" }}>
              <Palette className="w-16 h-16 text-purple-400/30" />
            </div>
          )}
          <Link to={galleryUrl}>
            <button
              className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Eye className="w-4 h-4" /> Gallery
            </button>
          </Link>
        </div>

        <div className="px-4 pt-4 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Creator Studio</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight mb-2">{deck.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {deck.category && <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">{deck.category}</Badge>}
            {deck.is_public ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1"><Globe className="w-3 h-3" /> Public</Badge>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1"><Lock className="w-3 h-3" /> Private</Badge>
            )}
            {deck.is_premium && <Badge className="bg-pink-500/20 text-pink-200 border-pink-500/30">Premium</Badge>}
            <span className="text-white/40 text-xs ml-auto">{cards.length} cards</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={createPageUrl(`Reading?deckId=${deck.id}`)}>
              <Button size="sm" className="rounded-full font-semibold" style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                <Play className="w-3.5 h-3.5 mr-1.5" /> Start Reading
              </Button>
            </Link>
            <Link to={galleryUrl}>
              <Button size="sm" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Browse Cards
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={handleExportJson} className="rounded-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tab strip ── */}
      <div className="sticky top-0 z-30 px-4 py-3 border-b border-white/8" style={{ background: "rgba(7,5,15,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pan-2d">
          {TABS.map(t => (
            <Tab key={t.id} id={t.id} label={t.label} active={activeTab === t.id}
              onClick={(id) => { setActiveTab(id); setSelectedTool(""); }} />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-6">

        {activeTab === "cards" && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 mb-6">
              <ImageUrlDiagnostics deckId={deck?.id} />
            </div>

            <SectionLabel icon={ImageIcon} label="Images & Media" color="#67e8f9" />
            <div className="space-y-2">
              <ToolBtn label="Bulk Image URLs"   icon={LinkIcon}  onClick={() => setSelectedTool("bulkImageUrls")}   color="#0e7490" />
              <ToolBtn label="Bulk Local Images" icon={Images}    onClick={() => setSelectedTool("bulkLocalImages")} color="#9f1239" />
              <ToolBtn label="Bulk AI Images"    icon={Wand2}     onClick={() => setSelectedTool("bulkAIImages")}    color="linear-gradient(135deg,#be185d,#7c3aed)" />
              <ToolBtn label="Rehost Images"     icon={RefreshCw} onClick={() => setSelectedTool("rehost")}          color="#b45309" />
              <ToolBtn label="Update Cover"      icon={ImageIcon} onClick={() => setSelectedTool("updateCover")}     color="#92400e" />
            </div>

            <SectionLabel icon={Pencil} label="Content & Cards" color="#34d399" />
            <div className="space-y-2">
              <ToolBtn label="Card Manager"      icon={Pencil}          onClick={() => setSelectedTool("cardManager")}    color="#0f766e" />
              <ToolBtn label="Custom Notes"      icon={FileJson}        onClick={() => setSelectedTool("customNotes")}    color="#92400e" />
              <ToolBtn label="Import CSV"        icon={FileSpreadsheet} onClick={() => setSelectedTool("csvImport")}      color="#2563eb" />
              <ToolBtn label="JSON Updater"      icon={FileJson}        onClick={() => setSelectedTool("jsonUpdater")}    color="#5b21b6" />
              <ToolBtn label="Import JSON"       icon={Upload}          onClick={() => setSelectedTool("jsonImport")}     color="#155e75" />
              <ToolBtn label="All-in-One Import" icon={FileSpreadsheet} onClick={() => setSelectedTool("combinedImport")} color="#9d174d" />
            </div>

            <SectionLabel icon={Sparkles} label="AI & Generation" color="#f472b6" />
            <div className="space-y-2">
              <ToolBtn label="📖 AI Manual Builder"   icon={Wand2}    onClick={() => { setSelectedTool(""); setActiveTab("manual"); }} color="linear-gradient(135deg,#86198f,#5b21b6)" />
              <ToolBtn label="AI Reading Coach"        icon={Sparkles} onClick={() => setSelectedTool("aiCoach")}            color="linear-gradient(135deg,#7c3aed,#be185d)" />
              <ToolBtn label="Persona from Insights"   icon={Sparkles} onClick={() => setSelectedTool("personaFromInsights")} color="linear-gradient(135deg,#3730a3,#7c3aed)" />
              <ToolBtn label="Style Extractor"         icon={Palette}  onClick={() => setSelectedTool("styleExtractor")}      color="linear-gradient(135deg,#be185d,#ea580c)" />
            </div>

            <SectionLabel icon={Settings} label="Settings & Admin" color="#94a3b8" />
            <div className="space-y-2">
              <ToolBtn label="Bulk Spreads"        icon={Layers}   onClick={() => setSelectedTool("bulkSpreads")}    color="#3730a3" />
              <ToolBtn label="Deck Settings"       icon={Settings} onClick={() => setSelectedTool("settingsInline")} color="#334155" />
              <ToolBtn label="Spread Designer"     icon={Layers}   asLink to={createPageUrl(`SpreadDesigner?deckId=${deck?.id || ""}`)} color="rgba(99,102,241,0.3)" />
              <ToolBtn label="Duplicate Deck"      icon={Layers}   onClick={handleDuplicateDeck}          color="#0891b2" />
              <ToolBtn label="Export Deck JSON"    icon={Download} onClick={handleExportJson}             color="#065f46" />
              <ToolBtn label="Delete Deck"         icon={Trash2}   onClick={() => setDeleteDialogOpen(true)} color="#991b1b" />
            </div>

            <ToolPanel tool={selectedTool} deck={deck} cards={cards} setDeck={setDeck} setCards={setCards} reloadCards={reloadCards} />
          </>
        )}

        {activeTab === "insights" && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <DeckInsightsAnalyzer deckId={deck.id} deck={deck} onInsightsGenerated={() => Deck.get(deck.id).then(setDeck)} />
          </div>
        )}

        {activeTab === "relationships" && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <CardRelationshipVisualizer deckId={deck.id} />
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.35),rgba(162,28,175,0.25))", border: "1px solid rgba(167,139,250,0.4)" }}>
              <Wand2 className="w-14 h-14 mx-auto mb-4 text-purple-300" />
              <h2 className="text-2xl font-bold text-white mb-2">AI Manual Builder</h2>
              <p className="text-purple-200 mb-5 max-w-lg mx-auto text-sm">Generate a comprehensive reading guide for your entire deck.</p>
              {deck?.manual_content
                ? <Badge className="bg-emerald-600 text-white px-4 py-1.5">✅ Manual Generated</Badge>
                : <Badge className="bg-amber-600 text-white px-4 py-1.5">⚠️ No Manual Yet</Badge>}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Wand2 className="w-5 h-5 text-purple-400" /> Generate Your Manual</h3>
              <AIManualBuilder deckId={deck.id} deck={deck} onDone={() => Deck.get(deck.id).then(setDeck)} />
            </div>
            {deck?.manual_content && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-400" /> Your Reading Guide</h3>
                <div className="rounded-xl bg-black/30 border border-purple-500/20 p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-purple-100 whitespace-pre-wrap font-sans">{deck.manual_content}</pre>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Uploaded PDF Manuals</h3>
              <p className="text-sm text-white/50 mb-4">Upload PDF guides or reference materials for this deck.</p>
              <ManualManager deckId={deck.id} />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-white/60" /> Deck Settings</h3>
              <DeckSettings deckId={deck.id} deck={deck} onSaved={() => Deck.get(deck.id).then(setDeck)} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-lg font-bold text-white mb-4">Backups</h3>
              <DeckVersionManager deck={deck} deckId={deck?.id} currentDeck={deck} currentCards={[]} onRestore={() => Deck.get(deck.id).then(setDeck)} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h3 className="text-lg font-bold text-white mb-4">Manuals (Management)</h3>
              <ManualManager deckId={deck.id} />
            </div>
          </div>
        )}

        {activeTab === "publishing" && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2"><Send className="w-5 h-5 text-purple-400" /> Publishing Dashboard</h2>
            {deck?.id ? (
              <PublishingDashboard deck={deck} onUpdate={async () => { const r = await Deck.get(deckIdFromUrl); setDeck(r); }} />
            ) : (
              <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-6 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-200">Unable to load publishing dashboard. Try refreshing.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Cover editor modal */}
      {deck && (
        <DeckCoverEditor
          deckId={deck.id}
          isOpen={selectedTool === "updateCover"}
          onClose={() => setSelectedTool(null)}
          initialCover={deck.cover_image}
          initialBack={deck.back_image_url || ""}
          onSaved={async () => { const r = await Deck.get(deck.id); setDeck(r); }}
        />
      )}

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Delete <span className="font-semibold text-white">"{deck?.name}"</span> and all its cards? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeck} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}