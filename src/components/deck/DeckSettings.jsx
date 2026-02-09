import React from "react";
import { Deck } from "@/entities/Deck";
import { Card as CardEntity } from "@/entities/Card";
import { safeUploadFile } from "@/components/utils/safeUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Image as ImageIcon, Trash2, AlertTriangle, Sparkles, FileText } from "lucide-react";
import FloatingSave from "@/components/common/FloatingSave";
import { base44 } from "@/api/base44Client";

if (!Deck.update) {
  Deck.update = async function(id, data) {
    return base44.entities.Deck.update(id, data);
  };
}
if (!Deck.get) {
  Deck.get = async function(id) {
    return base44.entities.Deck.get(id);
  };
}
if (!Deck.delete) {
  Deck.delete = async function(id) {
    return base44.entities.Deck.delete(id);
  };
}

const CATEGORIES = ["tarot", "oracle", "lenormand", "runes", "custom"];

export default function DeckSettings({ deckId, isOpen, onClose, onSaved, initialDeck, inline = false }) {
  const effectiveIsOpen = inline ? true : isOpen;

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState("");
  const [deck, setDeck] = React.useState(initialDeck || null);
  const [error, setError] = React.useState("");
  const [insightsText, setInsightsText] = React.useState("");
  const [insightsError, setInsightsError] = React.useState("");

  const [basicName, setBasicName] = React.useState(initialDeck?.name || "");
  const [basicPublic, setBasicPublic] = React.useState(!!initialDeck?.is_public);

  React.useEffect(() => {
    if (!effectiveIsOpen) return;
    setError("");
    setLoading(true);
    const loadDeck = async () => {
      try {
        const d = await Deck.get(deckId);
        setDeck(d);
        setBasicName(d.name || "");
        setBasicPublic(!!d.is_public);
        try {
          const txt = d.ai_deck_insights ? JSON.stringify(d.ai_deck_insights, null, 2) : "";
          setInsightsText(txt);
          setInsightsError("");
        } catch (_) {
          setInsightsText("");
        }
      } finally {
        setLoading(false);
      }
    };
    loadDeck();
  }, [effectiveIsOpen, deckId]);

  React.useEffect(() => {
    setBasicName(initialDeck?.name || "");
    setBasicPublic(!!initialDeck?.is_public);
  }, [initialDeck?.id]);

  const patch = (p) => setDeck((d) => ({ ...(d || {}), ...p }));

  const isValidFile = (f) => {
    if (!f || typeof f !== "object") return false;
    const looksLikeBlob = typeof f.arrayBuffer === "function" || typeof f.stream === "function" || typeof f.slice === "function";
    return (typeof File !== "undefined" && f instanceof File) || looksLikeBlob;
  };

  const uploadAndSet = async (file, field) => {
    if (!isValidFile(file)) return;
    setSaving(true);
    try {
      const file_url = await safeUploadFile(file);
      patch({ [field]: file_url });
    } finally {
      setSaving(false);
    }
  };

  // New: validate and upload shuffle animation (<=10s)
  const validateVideoDuration = (file) => new Promise((resolve) => {
    try {
      if (!file || !file.type?.startsWith('video')) return resolve(true); // only validate videos
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const dur = Number(video.duration || 0);
        resolve(!Number.isFinite(dur) || dur <= 10.2); // tiny buffer
      };
      video.onerror = () => resolve(true); // if unknown, allow
      video.src = url;
    } catch (_) {
      resolve(true);
    }
  });

  const uploadShuffleAnimation = async (file) => {
    if (!isValidFile(file)) return;
    const ok = await validateVideoDuration(file);
    if (!ok) {
      setError('Please select a video that is 10 seconds or less.');
      return;
    }
    setSaving(true);
    try {
      const file_url = await safeUploadFile(file);
      patch({ shuffle_animation_url: file_url });
    } finally {
      setSaving(false);
    }
  };

  const [savingBasic, setSavingBasic] = React.useState(false);
  const handleSaveBasic = async () => {
    if (!deckId) return;
    setSavingBasic(true);
    setError("");
    try {
      if ((deck?.name || "") !== (basicName || "")) {
        await Deck.update(deckId, { name: basicName });
      }

      const targetPublic = !!basicPublic;
      if ((!!deck?.is_public) !== targetPublic) {
        try {
          await Deck.update(deckId, { is_public: targetPublic });
        } catch (userErr) {
          console.warn("User-scoped update failed, trying service role:", userErr);
          const response = await base44.functions.invoke("updateDeckVisibility", {
            deckId,
            isPublic: targetPublic,
          });
          if (response.data?.error) throw new Error(response.data.error);
        }
      }

      const refreshed = await Deck.get(deckId);
      setDeck(refreshed);
      setBasicName(refreshed.name || "");
      setBasicPublic(!!refreshed.is_public);
      if (typeof onSaved === "function") onSaved();
    } catch (e) {
      console.error("Failed to save basic settings:", e);
      setError(e.message || "Failed to save basic settings");
    } finally {
      setSavingBasic(false);
    }
  };

  const handleToggleAutoRemoveBg = async (checked) => {
    setSaving(true);
    try {
      patch({ auto_remove_bg: !!checked });
      await Deck.update(deckId, { auto_remove_bg: !!checked });
      const refreshed = await Deck.get(deckId);
      setDeck(refreshed);
      if (onSaved) onSaved();
    } catch (e) {
      console.error("Failed to update auto_remove_bg setting:", e);
      setError(e.message || "Failed to save auto remove background setting");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!deck) return;
    setSaving(true);
    setError("");
    try {
      // Validate AI Deck Insights JSON if provided
      let insightsObj = undefined;
      if (insightsText && insightsText.trim()) {
        try {
          insightsObj = JSON.parse(insightsText);
          setInsightsError("");
        } catch (e) {
          setInsightsError("Invalid JSON in AI Deck Insights");
          throw new Error("AI Deck Insights JSON is invalid");
        }
      }
      const payload = {
        name: deck.name || "",
        description: deck.description || "",
        author: deck.author || "",
        category: deck.category || "oracle",
        cover_image: deck.cover_image || "",
        back_image_url: deck.back_image_url || "",
        manual_url: deck.manual_url || "",
        is_public: !!basicPublic,
        is_premium: !!deck.is_premium,

        auto_remove_bg: !!deck.auto_remove_bg,
        ai_reading_coach: deck.ai_reading_coach || "",
        shuffle_animation_url: deck.shuffle_animation_url || "",
        ai_deck_insights: insightsObj !== undefined ? insightsObj : (deck.ai_deck_insights || undefined),
        };
      
      await Deck.update(deckId, payload);

      const targetPublic = !!basicPublic;
      if ((!!deck.is_public) !== targetPublic) {
        try {
          await Deck.update(deckId, { is_public: targetPublic });
        } catch (_e) {
          console.warn("User-scoped visibility update failed during main save, trying service role:", _e);
          const response = await base44.functions.invoke("updateDeckVisibility", {
            deckId,
            isPublic: targetPublic,
          });
          if (response.data?.error) throw new Error(response.data.error);
        }
      }

      const refreshed = await Deck.get(deckId);
      setDeck(refreshed);
      setBasicPublic(!!refreshed.is_public);
      if (onSaved) onSaved();
      if (onClose && !inline) onClose();
    } catch (e) {
      console.error("Failed to save settings:", e);
      setError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCoaching = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
      setError("Please upload a .txt file.");
      return;
    }

    try {
      const text = await file.text();
      patch({ ai_reading_coach: text });
      e.target.value = ''; 
    } catch (e) {
      setError("Failed to read file: " + (e.message || "Unknown error"));
    }
  };

  const canDelete = !!deck?.name && confirmName.trim() === deck.name;

  const handleDeleteDeck = async () => {
    if (!deckId || !deck) return;
    setDeleting(true);
    setError("");
    try {
      const cards = await CardEntity.filter({ deck_id: deckId });
      for (const c of cards) {
        await CardEntity.delete(c.id);
      }
      await Deck.delete(deckId);
      if (onClose && !inline) onClose();
      window.location.href = "/Dashboard";
    } catch (e) {
      setError(e.message || "Failed to delete deck");
    } finally {
      setDeleting(false);
    }
  };

  if (!effectiveIsOpen) return null;

  const settingsContent = (
    <div 
      className="overflow-y-auto overflow-x-hidden px-6 py-4" 
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        maxHeight: inline ? 'none' : 'calc(90vh - 140px)'
      }}
    >
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4">
            <h3 className="text-white font-semibold mb-3">Basic Settings</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic-deck-title" className="text-sm text-white/80">Deck title</Label>
                <Input
                  id="basic-deck-title"
                  value={basicName}
                  onChange={(e) => setBasicName(e.target.value)}
                  placeholder="Enter deck title"
                  className="bg-black border-white/20 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={basicPublic}
                    onCheckedChange={setBasicPublic}
                    className="bg-black border border-white/50 data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-black after:bg-white after:shadow-[0_0_10px_rgba(124,58,237,0.6)]"
                    aria-label="Toggle public visibility"
                  />
                  <span className={`text-sm ${basicPublic ? "text-emerald-300" : "text-white/70"}`}>
                    {basicPublic ? "Public (everyone can use this deck)" : "Private (only you can see this deck)"}
                  </span>
                </div>
                <Button
                  onClick={handleSaveBasic}
                  disabled={savingBasic}
                  className="btn-dark-outline px-4 py-2 rounded-full disabled:opacity-50"
                >
                  {savingBasic ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {savingBasic ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-white/80">Description</Label>
            <Textarea
              value={deck?.description || ""}
              onChange={(e) => patch({ description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white min-h-[90px]"
              placeholder="Describe this deck..."
            />
          </div>

          <div>
            <Label className="text-white/80">Author</Label>
            <Input
              value={deck?.author || ""}
              onChange={(e) => patch({ author: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Author name"
            />
          </div>

          <div>
            <Label className="text-white/80">Category</Label>
            <Select value={deck?.category || "oracle"} onValueChange={(v) => patch({ category: v })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/80">Cover Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={deck?.cover_image || ""}
                onChange={(e) => patch({ cover_image: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://..."
              />
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById("cover-upload").click()}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadAndSet(e.target.files[0], "cover_image")}
              />
            </div>
            {deck?.cover_image && (
              <img src={deck.cover_image} alt="Cover" className="mt-2 w-32 h-auto rounded border border-white/20" />
            )}
          </div>

          <div>
            <Label className="text-white/80">Card Back Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={deck?.back_image_url || ""}
                onChange={(e) => patch({ back_image_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://..."
              />
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById("back-upload").click()}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <input
                id="back-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadAndSet(e.target.files[0], "back_image_url")}
              />
            </div>
            {deck?.back_image_url && (
              <img src={deck.back_image_url} alt="Back" className="mt-2 w-32 h-auto rounded border border-white/20" />
            )}
          </div>

          <div>
            <Label className="text-white/80">Shuffle Animation (≤10s, MP4/WebM/GIF)</Label>
            <div className="flex gap-2">
              <Input
                value={deck?.shuffle_animation_url || ""}
                onChange={(e) => patch({ shuffle_animation_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://..."
              />
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById("shuffle-upload").click()}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <input
                id="shuffle-upload"
                type="file"
                accept="video/mp4,video/webm,image/gif"
                className="hidden"
                onChange={(e) => uploadShuffleAnimation(e.target.files[0])}
              />
            </div>
            {deck?.shuffle_animation_url && (
              deck.shuffle_animation_url.toLowerCase().endsWith('.gif') ? (
                <img src={deck.shuffle_animation_url} alt="Shuffle animation" className="mt-2 w-full max-w-md rounded border border-white/20" />
              ) : (
                <video
                  src={deck.shuffle_animation_url}
                  className="mt-2 w-full max-w-md rounded border border-white/20"
                  controls
                  loop
                  muted
                  playsInline
                />
              )
            )}
          </div>

          <div>
            <Label className="text-white/80">Manual/Guidebook URL</Label>
            <Input
              value={deck?.manual_url || ""}
              onChange={(e) => patch({ manual_url: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!deck?.is_premium}
                onCheckedChange={(v) => patch({ is_premium: v })}
              />
              <Label className="text-white/80">Premium Deck</Label>
            </div>
          </div>


          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!deck?.auto_remove_bg}
                onCheckedChange={handleToggleAutoRemoveBg}
              />
              <Label className="text-white/80">Auto Remove Backgrounds (for new uploads)</Label>
            </div>
          </div>

          <div>
            <Label className="text-white/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Reading Coach Instructions
            </Label>
            <Textarea
              value={deck?.ai_reading_coach || ""}
              onChange={(e) => patch({ ai_reading_coach: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
              placeholder="Custom instructions for AI readings with this deck..."
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById("coaching-upload").click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload .txt
              </Button>
              <input
                id="coaching-upload"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleUploadCoaching}
              />
            </div>
          </div>

          <div>
            <Label className="text-white/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Deck Insights (JSON)
            </Label>
            <Textarea
              value={insightsText}
              onChange={(e) => setInsightsText(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white min-h-[140px] font-mono text-xs"
              placeholder={`{\n  "common_themes": ["growth", "rebellion"],\n  "visual_style": { "color_palette": ["violet", "black"] }\n}`}
            />
            {insightsError && (
              <div className="mt-2 text-xs text-red-300">{insightsError}</div>
            )}
          </div>

          <div className="border-t border-red-500/30 pt-4 mt-6">
            <Label className="text-red-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </Label>
            <p className="text-sm text-white/60 mb-3">
              Deleting this deck will also delete all its cards. This action cannot be undone.
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`Type "${deck?.name}" to confirm deletion`}
              className="bg-slate-800 border-slate-700 text-white mb-3"
            />
            <Button
              variant="destructive"
              onClick={handleDeleteDeck}
              disabled={!canDelete || deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Deck Forever
            </Button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/40 rounded p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <>
        {settingsContent}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10 px-6">
          <Button
            data-save
            data-action="save"
            onClick={handleSave}
            disabled={saving || loading || deleting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save All Settings
          </Button>
        </div>
        <FloatingSave />
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border border-purple-500/30 max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-300" />
              Deck Settings
              {deck?.is_public && <Badge className="ml-2 bg-emerald-700/40">Public</Badge>}
              {deck?.is_premium && <Badge className="ml-1 bg-amber-700/40">Premium</Badge>}
            </DialogTitle>
          </DialogHeader>

          {settingsContent}

          <DialogFooter className="px-6 py-4 border-t border-white/10 flex-shrink-0 gap-2">
            <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
              Close
            </Button>
            <Button
              data-save
              data-action="save"
              onClick={handleSave}
              disabled={saving || loading || deleting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save All Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FloatingSave />
    </>
  );
}