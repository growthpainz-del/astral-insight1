import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Wand2, Image as ImageIcon, X, Upload, FolderOpen, Sparkles, Zap } from "lucide-react";
import { Card as CardEntity } from "@/entities/Card";
import AIImageGenModal from "@/components/deck/AIImageGenModal";
import PhotoLibraryPicker from "@/components/media/PhotoLibraryPicker";
import { UploadAsset } from "@/entities/UploadAsset";

// New imports
import { UploadFile } from "@/integrations/Core";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "@/components/deck/_cardUpdatePatch";

const ELEMENTS = ["air", "fire", "water", "earth", "spirit", "none"];

const PRESET_SYMBOLS = [
  { icon: "✨", label: "Sparkles" },
  { icon: "🔥", label: "Fire" },
  { icon: "💨", label: "Air" },
  { icon: "🌊", label: "Water" },
  { icon: "🌍", label: "Earth" },
  { icon: "☀️", label: "Sun" },
  { icon: "🌙", label: "Moon" },
  { icon: "🌟", label: "Star" },
  { icon: "♈", label: "Aries" },
  { icon: "♉", label: "Taurus" },
  { icon: "♊", label: "Gemini" },
  { icon: "♋", label: "Cancer" },
  { icon: "♌", label: "Leo" },
  { icon: "♍", label: "Virgo" },
  { icon: "♎", label: "Libra" },
  { icon: "♏", label: "Scorpio" },
  { icon: "♐", label: "Sagittarius" },
  { icon: "♑", label: "Capricorn" },
  { icon: "♒", label: "Aquarius" },
  { icon: "♓", label: "Pisces" },
  { icon: "❤️", label: "Heart" },
  { icon: "👁️", label: "Eye" },
  { icon: "⏳", label: "Hourglass" },
  { icon: "🛡️", label: "Shield" },
  { icon: "🗝️", label: "Key" },
  { icon: "⚔️", label: "Swords" },
  { icon: "🏆", label: "Cup" },
  { icon: "🪙", label: "Coin" },
  { icon: "🌿", label: "Leaf" },
  { icon: "🦋", label: "Butterfly" },
  { icon: "🦉", label: "Owl" },
  { icon: "🐺", label: "Wolf" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dd1c9186e_D0009B98-FAD8-4CC4-BADF-A7DC8D7178F3.png", label: "Dragon" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6ae050f51_C3C1871F-D9A3-42AB-AAE1-915196101169.png", label: "Rooted Heart" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/03b87e7d6_526B0A26-D804-4C5C-B5A7-4C76D815ABD9.png", label: "Arrow Circle" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/b386bf4cf_AC082A3F-8854-4DD6-BB68-AA607E096D32.png", label: "Flame Circle" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/88ee8ec8d_32DB718D-EFA1-4827-8AEC-6AB91A8BF329.png", label: "Tree Roots" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/3bd854cd9_6381CF9C-029F-4D2C-84BA-81168C947FE3.png", label: "Lightning" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a28758f63_8501F496-2B70-4F65-B2BA-FAFEA987F484.png", label: "Water Drops" },
  { icon: "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d7e717c9b_3F39BC02-39E5-47A7-AC4D-3DD487C9C369.png", label: "Comet" }
];

const isImageSymbol = (id) => {
  if (!id || typeof id !== 'string') return false;
  const s = id.trim().toLowerCase();
  return s.startsWith('http') || s.startsWith('data:image') || /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/.test(s);
};

function ChipInput({ value = [], onChange, placeholder = "Add keyword and press Enter" }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    if (!value.includes(t)) onChange([...(value || []), t]);
    setDraft("");
  };
  const remove = (k) => onChange((value || []).filter((x) => x !== k));
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(value || []).map((k, i) => (
          <Badge key={`${k}-${i}`} className="bg-white/10 border-white/20 text-white">
            {k}
            <button onClick={() => remove(k)} className="ml-2 text-xs opacity-70 hover:opacity-100">×</button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        className="bg-slate-800 border-slate-700 text-white"
      />
    </div>
  );
}

export default function CardEditor({ deckId, card, isOpen, onClose, onSave }) {
  const [saving, setSaving] = React.useState(false);
  const [showAI, setShowAI] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [libraryTargetField, setLibraryTargetField] = React.useState(null);

  const [form, setForm] = React.useState({
    name: "",
    subtitle: "",
    number: "",
    element: "none",
    keywords: [],
    image_url: "",
    ai_image_prompt: "",
    overall_meaning: "",
    upright_meaning: "",
    reversed_meaning: "",
    upright_insight: "",
    reversed_insight: "",
    upright_action: "",
    reversed_action: "",
    interaction: "",
    musician_quote: "",
    facedown_meaning: "",
    custom: "",
    video_url: "",
    frame_style: "none",
    spirit_wheel_icon_url: "",
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const c = card || {};
    setForm({
      name: c.name || "",
      subtitle: c.subtitle || "",
      number: c.number ?? "",
      element: c.element || "none",
      keywords: Array.isArray(c.keywords) ? c.keywords : [],
      image_url: c.image_url || "",
      ai_image_prompt: c.ai_image_prompt || "",
      overall_meaning: c.overall_meaning || "",
      upright_meaning: c.upright_meaning || "",
      reversed_meaning: c.reversed_meaning || "",
      upright_insight: c.upright_insight || "",
      reversed_insight: c.reversed_insight || "",
      upright_action: c.upright_action || "",
      reversed_action: c.reversed_action || "",
      interaction: c.interaction || "",
      musician_quote: c.musician_quote || "",
      facedown_meaning: c.facedown_meaning || "",
      custom: c.custom || "",
      video_url: c.video_url || "",
      frame_style: c.frame_style || "none",
      spirit_wheel_icon_url: c.spirit_wheel_icon_url || "",
    });
  }, [isOpen, card?.id]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: String(form.name || "").trim(),
        subtitle: form.subtitle || "",
        image_url: form.image_url || "",
        video_url: form.video_url || "",
        frame_style: form.frame_style || "none",
        element: form.element || "none",
        keywords: Array.isArray(form.keywords) ? form.keywords : [],
        ai_image_prompt: form.ai_image_prompt || "",
        overall_meaning: form.overall_meaning || "",
        upright_meaning: form.upright_meaning || "",
        reversed_meaning: form.reversed_meaning || "",
        upright_insight: form.upright_insight || "",
        reversed_insight: form.reversed_insight || "",
        upright_action: form.upright_action || "",
        reversed_action: form.reversed_action || "",
        interaction: form.interaction || "",
        musician_quote: form.musician_quote || "",
        facedown_meaning: form.facedown_meaning || "",
        custom: form.custom || "",
        spirit_wheel_icon_url: form.spirit_wheel_icon_url || "",
      };
      if (form.number !== "" && form.number !== null && form.number !== undefined) {
        const n = parseInt(form.number, 10);
        if (!isNaN(n)) payload.number = n;
      }

      let updatedCard;
      
      if (card?.id) {
        updatedCard = await CardEntity.update(card.id, payload);
      } else {
        updatedCard = await CardEntity.create({ deck_id: deckId, ...payload });
      }

      if (onSave) {
        const completeCard = card?.id 
          ? { ...card, ...payload, id: card.id }
          : { ...payload, id: updatedCard?.id, deck_id: deckId };
        onSave(completeCard);
      }
      
      if (onClose) onClose();
    } finally {
      setSaving(false);
    }
  };

  const generatedApplied = (url) => {
    update({ image_url: url });
  };

  const onLocalFilePicked = async (file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      update({ image_url: file_url });
      try {
        await UploadAsset.create({
          file_url,
          file_name: file.name,
          mime_type: file.type || "",
          size: typeof file.size === "number" ? file.size : null,
          linked_deck_id: deckId || null,
          linked_card_id: card?.id || null
        });
      } catch (error) {
        console.error("Failed to log uploaded asset:", error);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
        <DialogContent className="max-w-4xl bg-slate-900 text-white border border-purple-500/30">
          <DialogHeader className="flex items-center justify-between border-b border-white/10 pb-4">
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {card?.id ? "Edit Card" : "Create Card"}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Card Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white focus:border-purple-500 transition-colors"
                    placeholder='e.g., "The Magician"'
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Subtitle (optional)</Label>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => update({ subtitle: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white focus:border-purple-500 transition-colors"
                    placeholder='e.g., "The Awakening"'
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Card Number</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.number}
                    onChange={(e) => update({ number: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white focus:border-purple-500 transition-colors"
                    placeholder="e.g., 1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Element</Label>
                  <Select value={form.element} onValueChange={(v) => update({ element: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select element" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {ELEMENTS.map((el) => (
                        <SelectItem key={el} value={el} className="hover:bg-purple-600/20">
                          {el.charAt(0).toUpperCase() + el.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Keywords</Label>
                  <ChipInput value={form.keywords} onChange={(v) => update({ keywords: v })} />
                </div>
              </div>
            </div>

            {/* ENHANCED AI IMAGE PROMPT SECTION - Now at the top for prominence */}
            <div className="relative">
              {/* Animated gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-xl opacity-75 blur animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-purple-900/60 via-slate-900 to-pink-900/40 border-2 border-purple-500/60 rounded-xl p-6 shadow-2xl shadow-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600/30 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-300 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 flex items-center gap-2">
                      AI Image Prompt
                    </Label>
                    <p className="text-xs text-purple-300/80 mt-1">
                      ✨ Describe the visual style to generate stunning card artwork with AI
                    </p>
                  </div>
                </div>
                
                <Textarea
                  value={form.ai_image_prompt || ""}
                  onChange={(e) => update({ ai_image_prompt: e.target.value })}
                  placeholder="Example: A mystical oracle card depicting a glowing circle of wisdom, ethereal purple and gold energy, symbolic sacred geometry, professional tarot illustration, detailed and artistic"
                  className="min-h-[120px] bg-slate-900/80 border-purple-500/40 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                />
                
                {form.ai_image_prompt ? (
                  <div className="mt-3 flex items-center gap-2 text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">
                      Prompt saved! ({form.ai_image_prompt.length} characters) - Ready for AI generation
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-amber-300 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <Wand2 className="w-4 h-4" />
                    <span className="text-sm">
                      💡 Add a prompt here to generate images with AI, or leave blank to use the card name
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Spirit Wheel Icon Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Spirit Wheel Icon
              </h3>
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                <Label className="text-sm text-white/80 mb-2 block">Choose an icon or enter a custom symbol/URL for the Spirit Wheel</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={form.spirit_wheel_icon_url}
                    onChange={(e) => update({ spirit_wheel_icon_url: e.target.value })}
                    className="flex-1 bg-slate-800 border-slate-700 text-white focus:border-amber-500 transition-colors"
                    placeholder="Emoji, symbol, or image URL..."
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    className="border-amber-500/60 text-amber-300 hover:bg-amber-500/20 transition-all shrink-0"
                    onClick={() => setLibraryTargetField('spirit_wheel_icon_url')}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Gallery
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-900/50 rounded-md border border-slate-700">
                  {PRESET_SYMBOLS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => update({ spirit_wheel_icon_url: p.icon })}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl hover:bg-slate-700 transition-all ${form.spirit_wheel_icon_url === p.icon ? 'bg-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-800 border border-slate-700'}`}
                      title={p.label}
                    >
                      {isImageSymbol(p.icon) ? (
                        <img src={p.icon} alt={p.label} className="w-6 h-6 object-contain mix-blend-screen filter drop-shadow-md" />
                      ) : (
                        p.icon
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Image Management
              </h3>
              
              <div>
                <Label className="text-sm text-white/80 mb-2 block">Image URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => update({ image_url: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white focus:border-cyan-500 transition-colors mb-3"
                  placeholder="https://..."
                />
                
                {/* ENHANCED: Visually distinct, grouped image action buttons */}
                <div className="space-y-3">
                  {/* Primary Actions - Creating new images */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Create New Image</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowAI(true)}
                        className="flex-1 min-w-[140px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        AI Generate
                      </Button>

                      <label
                        className={`flex-1 min-w-[140px] inline-flex items-center justify-center px-4 py-2 rounded-md border-2 cursor-pointer font-semibold transition-all
                          ${isUploadingImage 
                            ? "opacity-70 bg-blue-600 border-blue-600" 
                            : "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-500 text-white shadow-lg shadow-blue-500/20"
                          }`}
                        title="Upload an image from your device"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploadingImage ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={(e) => e.target.files?.[0] && onLocalFilePicked(e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Secondary Actions - Using existing images */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Use Existing Image</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 min-w-[140px] border-2 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 font-semibold transition-all"
                        onClick={() => setLibraryTargetField('image_url')}
                        title="Choose from previously uploaded images"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Photo Library
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="flex-1 min-w-[140px] border-2 border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 font-semibold transition-all"
                        title="Manage all uploaded files"
                      >
                        <Link to={createPageUrl('PhotoUploader')} target="_blank" rel="noopener noreferrer">
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Manage Files
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Image Preview */}
                {form.image_url && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative group inline-block">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg opacity-50 group-hover:opacity-75 blur transition-opacity"></div>
                      <div className="relative">
                        <img 
                          src={form.image_url} 
                          alt="Card preview" 
                          className="h-48 w-auto min-w-[120px] max-w-[200px] object-contain bg-black/40 rounded-lg border-2 border-cyan-500/40 shadow-xl p-1" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium">Card Image</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Meanings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Card Meanings & Interpretations
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Overall Meaning</Label>
                  <Textarea
                    value={form.overall_meaning}
                    onChange={(e) => update({ overall_meaning: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[90px] focus:border-blue-500 transition-colors"
                    placeholder="The core essence and message of this card..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Interaction / Notes</Label>
                  <Textarea
                    value={form.interaction}
                    onChange={(e) => update({ interaction: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[90px] focus:border-blue-500 transition-colors"
                    placeholder="How this card interacts with others..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Upright Meaning</Label>
                  <Textarea
                    value={form.upright_meaning}
                    onChange={(e) => update({ upright_meaning: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[80px] focus:border-blue-500 transition-colors"
                    placeholder="When the card appears upright..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Reversed Meaning</Label>
                  <Textarea
                    value={form.reversed_meaning}
                    onChange={(e) => update({ reversed_meaning: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[80px] focus:border-blue-500 transition-colors"
                    placeholder="When the card appears reversed..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Upright Insight</Label>
                  <Textarea
                    value={form.upright_insight}
                    onChange={(e) => update({ upright_insight: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[70px] focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Reversed Insight</Label>
                  <Textarea
                    value={form.reversed_insight}
                    onChange={(e) => update({ reversed_insight: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[70px] focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Upright Action</Label>
                  <Textarea
                    value={form.upright_action}
                    onChange={(e) => update({ upright_action: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[70px] focus:border-blue-500 transition-colors"
                    placeholder="Suggested actions when upright..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Reversed Action</Label>
                  <Textarea
                    value={form.reversed_action}
                    onChange={(e) => update({ reversed_action: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[70px] focus:border-blue-500 transition-colors"
                    placeholder="Suggested actions when reversed..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Quotes (optional)</Label>
                  <Textarea
                    value={form.musician_quote}
                    onChange={(e) => update({ musician_quote: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[60px] focus:border-blue-500 transition-colors"
                    placeholder="Inspirational quote..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-white/80 mb-2 block">Face-down Meaning (optional)</Label>
                  <Textarea
                    value={form.facedown_meaning}
                    onChange={(e) => update({ facedown_meaning: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[60px] focus:border-blue-500 transition-colors"
                    placeholder="Meaning when face-down..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm text-white/80 mb-2 block">Custom AI Notes</Label>
                  <Textarea
                    value={form.custom}
                    onChange={(e) => update({ custom: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[70px] focus:border-blue-500 transition-colors"
                    placeholder="Additional notes to guide AI readings..."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/30 text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/30 min-w-[120px] transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Card
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIImageGenModal
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        card={card ? { ...card, ...form } : form}
        onApplied={generatedApplied}
      />
      <PhotoLibraryPicker
        isOpen={!!libraryTargetField}
        onClose={() => setLibraryTargetField(null)}
        deckId={deckId}
        onSelect={(url) => {
          if (libraryTargetField) {
            update({ [libraryTargetField]: url });
          }
          setLibraryTargetField(null);
        }}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #a855f7, #06b6d4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #9333ea, #0891b2);
        }
      `}</style>
    </>
  );
}