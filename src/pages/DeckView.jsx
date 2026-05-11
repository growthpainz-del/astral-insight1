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
  Loader2,
  Play,
  Settings, // Changed SettingsIcon to Settings for consistency with outline
  Image as ImageIcon,
  Upload,
  BookOpen,
  Trash2,
  Link as LinkIcon,
  FileJson,
  Wand2,
  Images,
  Layers,
  RefreshCw,
  FileSpreadsheet,
  Eye,
  Pencil,
  Download, // Added Download icon import
  Sparkles, // Added Sparkles icon for AI Reading Coach
  LayoutGrid, // Added LayoutGrid icon for new tab navigation
  FileText, // ADDED: FileText icon for PDF manuals
  Send, // NEW: Added Send icon for Publishing
  Palette, // NEW: Added Palette icon for Style Extractor
  AlertTriangle // ADDED: AlertTriangle for error state in Publishing tab
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Inline controllers (already in codebase)
import AIManualBuilder from "@/components/deck/AIManualBuilder";
import BulkImageUrlMatcher from "@/components/deck/BulkImageUrlMatcher";
import BulkLocalImageUploaderInline from "@/components/deck/BulkLocalImageUploaderInline";
import BulkSpreadImporter from "@/components/deck/BulkSpreadImporter";
import CombinedImporter from "@/components/deck/CombinedImporter";
// import QuickImageFix from "@/components/deck/QuickImageFix"; // REMOVED: QuickImageFix import
import BulkRehoster from "@/components/deck/BulkRehoster";
import DeckCoverEditor from "@/components/deck/DeckCoverEditor";
import QuickCustomNotes from "@/components/deck/QuickCustomNotes";
import ManualManager from "@/components/deck/ManualManager";
import DeckVersionManager from "@/components/deck/DeckVersionManager";
import DeckSettings from "@/components/deck/DeckSettings";
import JsonCardUpdater from "@/components/deck/JsonCardUpdater";
import CardManager from "@/components/deck/CardManager";
// ADD: Import JSON importer
import JsonCardImporter from "@/components/deck/JsonCardImporter";
// NEW: Import BulkAIImageGenerator
import BulkAIImageGenerator from "@/components/deck/BulkAIImageGenerator";
// NEW: Import AICoachEditor
import AICoachEditor from "@/components/deck/AICoachEditor";
// NEW: Import PublishingDashboard
import PublishingDashboard from "@/components/deck/PublishingDashboard";
// NEW: Import StyleExtractor
import StyleExtractor from "@/components/deck/StyleExtractor";
import ImageUrlDiagnostics from "@/components/deck/ImageUrlDiagnostics";
import CardRelationshipVisualizer from "@/components/deck/CardRelationshipVisualizer";
import DeckInsightsAnalyzer from "@/components/deck/DeckInsightsAnalyzer";
import PersonaFromInsights from "@/components/deck/PersonaFromInsights";


function ToolButton({ label, icon: Icon, onClick, className = "", asLink = false, to = "#" }) {
  const content = (
    <div
      onClick={asLink ? undefined : onClick}
      className={`w-full cursor-pointer rounded-xl px-4 py-3 text-white shadow-md hover:opacity-90 active:opacity-80 transition ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-black/20">
          <Icon className="w-5 h-5" />
        </div>
        <div className="font-semibold">{label}</div>
      </div>
    </div>
  );
  if (asLink) {
    return (
      <Link to={to} onClick={onClick} className="w-full block">
        {content}
      </Link>
    );
  }
  return content;
}

export default function DeckView() {
  const [searchParams] = useSearchParams();
  const deckIdFromUrl = searchParams.get("id") || searchParams.get("deckId");
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]); // ADD: State for cards
  const [loading, setLoading] = useState(!!deckIdFromUrl);
  const [error, setError] = useState("");
  const [selectedTool, setSelectedTool] = useState("");
  const [activeTab, setActiveTab] = useState("cards"); // cards, insights, relationships, settings, manual, publishing

  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // MODIFIED: Load deck AND cards
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!deckIdFromUrl) {
        setLoading(false);
        setError("No deck id provided.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        // Load deck and cards in parallel
        const [d, cardsList] = await Promise.all([
          queueApiCall(() => Deck.get(deckIdFromUrl), 5, 2000),
          queueApiCall(() => Card.filter({ deck_id: deckIdFromUrl }), 5, 2000)
        ]);
        
        if (active) {
          setDeck(d);
          setCards(cardsList || []);
        }
      } catch (e) {
        if (active) {
          
          if (isNetworkError(e)) {
            setError("Network connection issue. Please check your internet and try refreshing the page.");
          } else if (e.response?.status === 404) {
            setError("Deck not found. It may have been deleted.");
          } else if (e.response?.status === 429) {
            setError("Too many requests. Please wait a moment and refresh.");
          } else {
            setError("Failed to load deck. Please try again.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [deckIdFromUrl]);

  // ADD: Helper to reload cards after updates
  const reloadCards = async () => {
    try {
      const cardsList = await queueApiCall(
        () => Card.filter({ deck_id: deckIdFromUrl }), 
        5, 
        2000
      );
      setCards(cardsList || []);
    } catch (e) {
    }
  };

  const handleExportJson = async () => {
    if (!deck?.id) return;
    try {
      const cards = await Card.filter({ deck_id: deck.id }); // Changed to Card entity
      const exportData = {
        deck: {
          name: deck.name,
          description: deck.description,
          author: deck.author,
          category: deck.category,
          cover_image: deck.cover_image,
          back_image_url: deck.back_image_url,
          is_public: deck.is_public,
          is_premium: deck.is_premium,

          ai_reading_coach: deck.ai_reading_coach,
          manual_url: deck.manual_url,
          manual_content: deck.manual_content,
          censor_mode: deck.censor_mode,
          suggested_questions: deck.suggested_questions,
        },
        cards: cards.map(c => ({
          name: c.name,
          number: c.number,
          subtitle: c.subtitle,
          image_url: c.image_url,
          video_url: c.video_url,
          frame_style: c.frame_style,
          element: c.element,
          keywords: c.keywords,
          ancient_wisdom: c.ancient_wisdom,
          overall_meaning: c.overall_meaning,
          upright_meaning: c.upright_meaning,
          upright_insight: c.upright_insight,
          upright_action: c.upright_action,
          reversed_meaning: c.reversed_meaning,
          reversed_insight: c.reversed_insight,
          reversed_action: c.reversed_action,
          interaction: c.interaction,
          musician_quote: c.musician_quote,
          facedown_meaning: c.facedown_meaning,
          custom: c.custom,
          custom_ai_notes: c.custom_ai_notes,
          custom_ai_helper: c.custom_ai_helper,
          custom_fields: c.custom_fields,
          ai_image_prompt: c.ai_image_prompt,
          ai_image_negative_prompt: c.ai_image_negative_prompt,
          ai_prompt_style: c.ai_prompt_style,
          ai_reference_image_url: c.ai_reference_image_url,
        })),
        exported_date: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to export deck: " + (e.message || "Unknown error"));
    }
  };

  const handleDeleteDeck = async () => {
    if (!deck?.id) return;
    if (!window.confirm(`Delete "${deck.name}" and all its cards? This cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await base44.functions.invoke("deleteDeckCascade", { deckId: deck.id });
      if (data?.error) throw new Error(data.error);
      toast.success("Deck deleted successfully.");
      window.location.href = createPageUrl("Dashboard");
    } catch (e) {
      toast.error(`Delete failed: ${e.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 text-white/80">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading deck…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <UICard className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-red-300">Deck not available</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80">
            <p className="mb-4">{error}</p>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </UICard>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-white/80">
        <p>No deck found.</p>
      </div>
    );
  }

  const galleryUrl = createPageUrl(`DeckGallery?deckId=${deck.id}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 pan-2d">
        {/* Tab Navigation - ENHANCED: Made scrollable on mobile */}
        <div className="flex gap-2 mb-6 border-b border-white/10 overflow-auto pb-2 scrollbar-hide pan-2d">
          <Button
            variant={activeTab === "cards" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("cards");
            }}
            className={`${activeTab === "cards" ? "bg-purple-600" : "text-white/70 hover:text-white"} whitespace-nowrap`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={activeTab === "insights" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("insights");
            }}
            className={`${activeTab === "insights" ? "bg-purple-600" : "text-white/70 hover:text-white"} whitespace-nowrap`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
          <Button
            variant={activeTab === "relationships" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("relationships");
            }}
            className={`${activeTab === "relationships" ? "bg-purple-600" : "text-white/70 hover:text-white"} whitespace-nowrap`}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Relationships
          </Button>
          
          {/* Manual Builder Tab */}
          <Button
            variant={activeTab === "manual" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("manual");
            }}
            className={`${activeTab === "manual" ? "bg-purple-600" : "text-white/70 hover:text-white"} relative whitespace-nowrap`}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Manual Builder
            {!deck?.manual_content && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            )}
          </Button>
          
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("settings");
            }}
            className={`${activeTab === "settings" ? "bg-purple-600" : "text-white/70 hover:text-white"} whitespace-nowrap`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          {/* FIXED: Publishing Tab - Added debug logging */}
          <Button
            variant={activeTab === "publishing" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("publishing");
            }}
            className={`${activeTab === "publishing" ? "bg-purple-600" : "text-white/70 hover:text-white"} whitespace-nowrap`}
          >
            <Send className="w-4 h-4 mr-2" />
            Publishing
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "cards" && (
          <>
            <div className="grid gap-6 md:grid-cols-[320px,1fr]">
              <div>
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  {deck.cover_image ? (
                    <img src={deck.cover_image} alt={deck.name} className="w-full h-auto object-cover" />
                  ) : (
                    <div className="aspect-[3/4] flex items-center justify-center text-white/60">
                      No cover image
                    </div>
                  )}
                  <Link to={galleryUrl}>
                    <Button
                      size="sm"
                      className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/80 backdrop-blur border border-white/20"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Gallery
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {deck.category ? (
                    <Badge className="bg-purple-500/20 text-purple-200 border border-purple-500/30">
                      {deck.category}
                    </Badge>
                  ) : null}
                  {deck.is_public ? (
                    <Badge className="bg-blue-500/20 text-blue-200 border border-blue-500/30">Public</Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-200 border border-amber-500/30">Personal</Badge>
                  )}
                  {deck.is_premium && (
                    <Badge className="bg-pink-500/20 text-pink-200 border border-pink-500/30">Premium</Badge>
                  )}
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  {deck.name}
                  {/* Clear visibility indicator */}
                  {deck.is_public ? (
                    <span className="text-sm font-normal bg-emerald-600/80 text-white px-3 py-1 rounded-full">
                      🌍 Public Deck
                    </span>
                  ) : (
                    <span className="text-sm font-normal bg-purple-600/80 text-white px-3 py-1 rounded-full">
                      🔒 Your Private Deck
                    </span>
                  )}
                </h1>
                <p className="text-white/80 mb-4">{deck.description || "No description yet."}</p>
                <div className="flex flex-wrap gap-2">
                  <Link to={createPageUrl(`Reading?deckId=${deck.id}`)}>
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Reading
                    </Button>
                  </Link>
                  <Link to={galleryUrl}>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" /> Browse Cards
                    </Button>
                  </Link>
                  <Button
                    onClick={handleExportJson}
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </div>

            {/* ADD: Image URL Diagnostics before controllers */}
            <div className="mt-8 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <ImageUrlDiagnostics deckId={deck?.id} />
              </div>
            </div>

            {/* Controllers grid - Mobile Accordion, Desktop Grid */}
            {isMobileView ? (
              <div className="mt-8">
                <Accordion type="multiple" defaultValue={["images"]} className="space-y-2">
                  <AccordionItem value="images" className="bg-white/5 border border-white/10 rounded-xl">
                    <AccordionTrigger className="px-4 text-white hover:no-underline">
                      <span className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold">Images & Media</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-2">
                      <ToolButton label="Bulk Image URLs" icon={LinkIcon} onClick={() => setSelectedTool("bulkImageUrls")} className="bg-cyan-700" />
                      <ToolButton label="Bulk Local Images" icon={Images} onClick={() => setSelectedTool("bulkLocalImages")} className="bg-rose-700" />
                      <ToolButton label="Bulk AI Images" icon={Wand2} onClick={() => setSelectedTool("bulkAIImages")} className="bg-gradient-to-r from-pink-700 to-purple-700" />
                      <ToolButton label="Rehost Images" icon={RefreshCw} onClick={() => setSelectedTool("rehost")} className="bg-amber-600" />
                      <ToolButton label="Update Cover" icon={ImageIcon} onClick={() => setSelectedTool("updateCover")} className="bg-amber-700" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="content" className="bg-white/5 border border-white/10 rounded-xl">
                    <AccordionTrigger className="px-4 text-white hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold">Content & Cards</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-2">
                      <ToolButton label="Card Manager" icon={Pencil} onClick={() => setSelectedTool("cardManager")} className="bg-teal-700" />
                      <ToolButton label="Custom Notes" icon={FileJson} onClick={() => setSelectedTool("customNotes")} className="bg-yellow-700" />
                      <ToolButton label="JSON Updater" icon={FileJson} onClick={() => setSelectedTool("jsonUpdater")} className="bg-violet-700" />
                      <ToolButton label="Import JSON" icon={Upload} onClick={() => setSelectedTool("jsonImport")} className="bg-cyan-800" />
                      <ToolButton label="All‑in‑One Import" icon={FileSpreadsheet} onClick={() => setSelectedTool("combinedImport")} className="bg-pink-700" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ai" className="bg-white/5 border border-white/10 rounded-xl">
                    <AccordionTrigger className="px-4 text-white hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-400" />
                        <span className="font-semibold">AI & Generation</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-2">
                      {/* ENHANCED: Make Manual Builder first and more prominent */}
                      <ToolButton 
                        label="📖 AI Manual Builder" 
                        icon={Wand2} 
                        onClick={() => { setSelectedTool(""); setActiveTab("manual"); }} 
                        className="bg-gradient-to-r from-fuchsia-700 to-purple-700 border-2 border-purple-400" 
                      />
                      <ToolButton label="AI Reading Coach" icon={Sparkles} onClick={() => setSelectedTool("aiCoach")} className="bg-gradient-to-r from-purple-600 to-pink-600" />
                      <ToolButton label="Persona from Insights" icon={Sparkles} onClick={() => setSelectedTool("personaFromInsights")} className="bg-gradient-to-r from-indigo-600 to-purple-600" />
                      <ToolButton label="Style Extractor" icon={Palette} onClick={() => setSelectedTool("styleExtractor")} className="bg-gradient-to-r from-pink-600 to-orange-600" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="settings" className="bg-white/5 border border-white/10 rounded-xl">
                    <AccordionTrigger className="px-4 text-white hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold">Settings & Admin</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-2">
                      <ToolButton label="Bulk Spreads" icon={Layers} onClick={() => setSelectedTool("bulkSpreads")} className="bg-indigo-700" />
                      <ToolButton label="Deck Settings" icon={Settings} onClick={() => setSelectedTool("settingsInline")} className="bg-slate-700" />
                      <ToolButton label="Spread Designer" icon={Layers} asLink to={createPageUrl(`SpreadDesigner?deckId=${deck?.id || ""}`)} className="bg-indigo-600/30" />
                      <ToolButton label="Export Deck JSON" icon={Download} onClick={handleExportJson} className="bg-emerald-700" />
                      <ToolButton label="Delete Deck" icon={Trash2} onClick={handleDeleteDeck} className="bg-red-700" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* ENHANCED: Make Manual Builder first and more prominent */}
                <ToolButton 
                  label="📖 AI Manual Builder" 
                  icon={Wand2} 
                  onClick={() => { setSelectedTool(""); setActiveTab("manual"); }} 
                  className="bg-gradient-to-r from-fuchsia-700 to-purple-700 col-span-2 sm:col-span-1 border-2 border-purple-400 shadow-lg shadow-purple-500/50" 
                />
                <ToolButton label="AI Reading Coach" icon={Sparkles} onClick={() => setSelectedTool("aiCoach")} className="bg-gradient-to-r from-purple-600 to-pink-600" />
                <ToolButton label="Persona from Insights" icon={Sparkles} onClick={() => setSelectedTool("personaFromInsights")} className="bg-gradient-to-r from-indigo-600 to-purple-600" />
                <ToolButton label="Style Extractor" icon={Palette} onClick={() => setSelectedTool("styleExtractor")} className="bg-gradient-to-r from-pink-600 to-orange-600" />
                <ToolButton label="Bulk Image URLs" icon={LinkIcon} onClick={() => setSelectedTool("bulkImageUrls")} className="bg-cyan-700" />
                <ToolButton label="Bulk Local Images" icon={Images} onClick={() => setSelectedTool("bulkLocalImages")} className="bg-rose-700" />
                <ToolButton label="Bulk Spreads" icon={Layers} onClick={() => setSelectedTool("bulkSpreads")} className="bg-indigo-700" />
                <ToolButton label="All‑in‑One Import" icon={FileSpreadsheet} onClick={() => setSelectedTool("combinedImport")} className="bg-pink-700" />
                <ToolButton label="Bulk AI Images" icon={Wand2} onClick={() => setSelectedTool("bulkAIImages")} className="bg-gradient-to-r from-pink-700 to-purple-700" />
                <ToolButton label="Rehost Images" icon={RefreshCw} onClick={() => setSelectedTool("rehost")} className="bg-amber-600" />
                <ToolButton label="Update Cover" icon={ImageIcon} onClick={() => setSelectedTool("updateCover")} className="bg-amber-700" />
                <ToolButton label="Custom Notes" icon={FileJson} onClick={() => setSelectedTool("customNotes")} className="bg-yellow-700" />
                <ToolButton label="Import JSON" icon={Upload} onClick={() => setSelectedTool("jsonImport")} className="bg-cyan-800" />
                <ToolButton label="Deck Settings" icon={Settings} onClick={() => setSelectedTool("settingsInline")} className="bg-slate-700" />
                <ToolButton label="JSON Updater" icon={FileJson} onClick={() => setSelectedTool("jsonUpdater")} className="bg-violet-700" />
                <ToolButton label="Card Manager" icon={Pencil} onClick={() => setSelectedTool("cardManager")} className="bg-teal-700" />
                <ToolButton label="Spread Designer (Edit existing)" icon={Layers} asLink to={createPageUrl(`SpreadDesigner?deckId=${deck?.id || ""}`)} className="bg-indigo-600/30 hover:bg-indigo-600/40" />
                <ToolButton label="Export Deck JSON" icon={Download} onClick={handleExportJson} className="bg-emerald-700" />
                <ToolButton label="Delete Deck" icon={Trash2} onClick={handleDeleteDeck} className="bg-red-700" />
              </div>
            )}

            {/* Inline tool panel */}
            <div className="mt-4 space-y-4">
              {selectedTool === "aiCoach" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                    AI Reading Coach
                  </CardTitle></CardHeader>
                  <CardContent>
                    <AICoachEditor deckId={deck.id} deck={deck} onDone={() => Deck.get(deck.id).then(setDeck)} />
                  </CardContent>
                </UICard>
              )}

              {selectedTool === "styleExtractor" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-300" />
                      Style DNA Extractor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StyleExtractor
                      deckId={deck.id}
                      onStyleExtracted={(profile) => {
                        // No onDone prop to call directly here from DeckView,
                        // this callback handles the extracted profile
                      }}
                    />
                  </CardContent>
                </UICard>
              )}

              {selectedTool === "personaFromInsights" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-300" />
                      Persona from Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PersonaFromInsights deckId={deck.id} deck={deck} onSaved={(prompt) => setDeck(prev => ({ ...prev, ai_reading_coach: prompt }))} />
                  </CardContent>
                </UICard>
              )}

              {selectedTool === "bulkImageUrls" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Bulk Image URLs</CardTitle></CardHeader>
                  <CardContent>
                    <BulkImageUrlMatcher deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "bulkLocalImages" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Bulk Local Images</CardTitle></CardHeader>
                  <CardContent>
                    <BulkLocalImageUploaderInline
                      deckId={deck.id}
                      onDone={() => Deck.get(deck.id).then(setDeck)}
                    />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "bulkSpreads" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Bulk Spreads Import</CardTitle></CardHeader>
                  <CardContent>
                    <BulkSpreadImporter deckId={deck.id} />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "combinedImport" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">All‑in‑One Import</CardTitle></CardHeader>
                  <CardContent>
                    <CombinedImporter deckId={deck.id} />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "bulkAIImages" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Bulk AI Image Generator</CardTitle></CardHeader>
                  <CardContent>
                    <BulkAIImageGenerator
                      deckId={deck.id}
                      onDone={() => Deck.get(deck.id).then(setDeck)}
                    />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "rehost" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Rehost Images</CardTitle></CardHeader>
                  <CardContent>
                    <BulkRehoster deckId={deck.id} />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "customNotes" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Custom Notes</CardTitle></CardHeader>
                  <CardContent>
                    <QuickCustomNotes deckId={deck.id} />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "settingsInline" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Deck Settings</CardTitle></CardHeader>
                  <CardContent>
                    <DeckSettings 
                      deckId={deck.id} 
                      deck={deck} 
                      initialDeck={deck}
                      inline={true}
                      onSaved={() => Deck.get(deck.id).then(setDeck)} 
                    />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "jsonUpdater" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">JSON Updater</CardTitle></CardHeader>
                  <CardContent>
                    <JsonCardUpdater deckId={deck.id} onDone={() => Deck.get(deck.id).then(setDeck)} />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "jsonImport" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Import JSON</CardTitle></CardHeader>
                  <CardContent>
                    <JsonCardImporter
                      deckId={deck.id}
                      onDone={() => Deck.get(deck.id).then(setDeck)}
                    />
                  </CardContent>
                </UICard>
              )}
              {selectedTool === "cardManager" && (
                <UICard className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Card Manager</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardManager
                      deckId={deck.id}
                      cards={cards}
                      onUpdate={(updatedCards) => {
                        setCards(updatedCards);
                        reloadCards(); // Reload to ensure consistency
                      }}
                    />
                  </CardContent>
                </UICard>
              )}
            </div>
          </>
        )}

        {activeTab === "insights" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <DeckInsightsAnalyzer
              deckId={deck.id}
              deck={deck}
              onInsightsGenerated={() => {
                // Reload deck to get updated insights
                Deck.get(deck.id).then(setDeck);
              }}
            />
          </div>
        )}

        {activeTab === "relationships" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <CardRelationshipVisualizer deckId={deck.id} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <UICard className="bg-white/5 border-white/10 shadow-none">
              <CardHeader><CardTitle className="text-white">Deck Settings</CardTitle></CardHeader>
              <CardContent>
                <DeckSettings deckId={deck.id} deck={deck} onSaved={() => Deck.get(deck.id).then(setDeck)} />
              </CardContent>
            </UICard>
            <UICard className="bg-white/5 border-white/10 shadow-none mt-4">
              <CardHeader><CardTitle className="text-white">Backups</CardTitle></CardHeader>
              <CardContent>
                <DeckVersionManager
                  deck={deck}
                  deckId={deck?.id}
                  currentDeck={deck}
                  currentCards={[]}
                  onRestore={() => Deck.get(deck.id).then(setDeck)}
                />
              </CardContent>
            </UICard>
            <UICard className="bg-white/5 border-white/10 shadow-none mt-4">
              <CardHeader><CardTitle className="text-white">Manuals (Management)</CardTitle></CardHeader>
              <CardContent>
                <ManualManager deckId={deck.id} />
              </CardContent>
            </UICard>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6">
            {/* ENHANCED: Prominent CTA for Manual Builder */}
            <div className="bg-gradient-to-r from-purple-900/60 to-fuchsia-900/60 border-2 border-purple-500/50 rounded-xl p-8 text-center shadow-2xl">
              <Wand2 className="w-16 h-16 mx-auto mb-4 text-purple-300" />
              <h2 className="text-3xl font-bold text-white mb-3">
                AI Manual Builder
              </h2>
              <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
                Generate a comprehensive reading guide for your entire deck! Perfect for learning without AI assistance or sharing with others.
              </p>
              
              {deck?.manual_content ? (
                <div className="space-y-4">
                  <Badge className="bg-emerald-600 text-white px-4 py-2 text-base">
                    ✅ Manual Already Generated
                  </Badge>
                  <p className="text-sm text-purple-200">
                    Your manual is ready below. You can regenerate it anytime if you've updated your cards.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge className="bg-amber-600 text-white px-4 py-2 text-base">
                    ⚠️ No Manual Yet
                  </Badge>
                  <p className="text-sm text-purple-200">
                    Click below to generate your first reading guide!
                  </p>
                </div>
              )}
            </div>

            {/* AI Manual Builder Tool - Always Visible */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-purple-400" />
                Generate Your Manual
              </h3>
              <AIManualBuilder deckId={deck.id} deck={deck} onDone={() => Deck.get(deck.id).then(setDeck)} />
            </div>

            {/* AI-Generated Manual Display Section */}
            {deck?.manual_content && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  Your AI-Generated Reading Guide
                </h2>

                <div className="prose prose-invert max-w-none">
                  <div className="bg-black/30 border border-purple-500/30 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm text-purple-100 whitespace-pre-wrap font-sans">
                      {deck.manual_content}
                    </pre>
                  </div>
                  <p className="text-xs text-white/50 mt-4">
                    💡 This manual was AI-generated to help you read without AI assistance.
                    Use the tool above to regenerate it anytime.
                  </p>
                </div>
              </div>
            )}

            {/* Uploaded PDF Manuals Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-400" />
                Uploaded PDF Manuals
              </h2>
              <p className="text-sm text-white/60 mb-4">
                Upload PDF guides, tutorials, or reference materials for this deck.
              </p>
              <ManualManager deckId={deck.id} />
            </div>
          </div>
        )}

        {/* FIXED: Publishing Tab - Added error boundary and loading state */}
        {activeTab === "publishing" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-6 h-6 text-purple-400" />
              Publishing Dashboard
            </h2>
            
            {/* Debug Info */}
            <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
              <div>✅ Publishing tab loaded</div>
              <div>📦 Deck ID: {deck?.id || 'Missing'}</div>
              <div>📝 Deck Name: {deck?.name || 'Missing'}</div>
            </div>

            {deck && deck.id ? (
              <PublishingDashboard
                deck={deck}
                onUpdate={async () => {
                  const refreshed = await Deck.get(deckIdFromUrl);
                  setDeck(refreshed);
                }}
              />
            ) : (
              <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-200">
                  ❌ Unable to load publishing dashboard. Deck data is missing.
                </p>
                <p className="text-red-300 text-sm mt-2">
                  Try refreshing the page or going back to Dashboard.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mount the cover editor modal and open it when selectedTool is updateCover */}
      {deck && (
        <DeckCoverEditor
          deckId={deck.id}
          isOpen={selectedTool === "updateCover"}
          onClose={() => setSelectedTool(null)}
          initialCover={deck.cover_image}
          initialBack={deck.back_image_url || ''}
          onSaved={async () => {
            const refreshed = await Deck.get(deck.id);
            setDeck(refreshed);
          }}
        />
      )}
    </div>
  );
}