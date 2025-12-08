
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, XCircle, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { Card as CardEntity } from "@/entities/Card";
import { GenerateImage } from "@/integrations/Core";
import { retryAsync } from "@/components/utils/retry";
import { safeUploadFile } from "@/components/utils/safeUpload";

// simple file validator
const isValidFile = (f) => {
  if (!f || typeof f !== "object") return false;
  const looksLikeBlob =
    typeof f.arrayBuffer === "function" ||
    typeof f.stream === "function" ||
    typeof f.slice === "function" ||
    (typeof f.size === "number" && typeof f.type === "string");
  return (typeof File !== "undefined" && f instanceof File) || looksLikeBlob;
};

// Add a default AR constant at top for clarity (matches importer)
const DEFAULT_ASPECT_RATIO = "9:16";

const RATIO_OPTIONS = [
  { value: "1:1", label: "Square 1:1" },
  { value: "9:16", label: "Portrait 9:16" },
  { value: "3:4", label: "Portrait 3:4" },
  { value: "4:5", label: "Portrait 4:5" },
  { value: "3:2", label: "Landscape 3:2" },
  { value: "16:9", label: "Landscape 16:9" }
];

// Helper: ensure prompt contains a single, correct aspect ratio line
function sanitizePromptAspectRatio(text = "", ratio = "9:16") {
  // Normalize inputs
  let s = String(text || "");

  // 1) Remove any previous AR directives or hints in common formats
  //    - "Aspect ratio: X:Y"
  //    - "--ar X:Y" or "—ar X:Y" (different dashes)
  //    - "ar X:Y", "x:y ratio", "XxY", "X:Y", "portrait 9:16" tokens, etc.
  s = s
    .replace(/(^|\n)\s*Aspect\s*ratio\s*:\s*\d+\s*:\s*\d+\s*/gi, "$1") // "Aspect ratio: X:Y"
    .replace(/(^|\n)\s*--?ar\s*\d+\s*:\s*\d+\s*/gi, "$1") // "--ar X:Y" or "—ar X:Y"
    .replace(/\bar\s*\d+\s*:\s*\d+\b/gi, "") // "ar X:Y"
    .replace(/\b\d+\s*:\s*\d+\s*ratio\b/gi, "") // "X:Y ratio"
    .replace(/\bportrait\s*\d+\s*:\s*\d+\b/gi, "") // "portrait 9:16"
    .replace(/\b\d+\s*x\s*\d+\b/gi, "") // "XxY"
    .replace(/\b(9\s*:\s*16|16\s*:\s*9|4\s*:\s*5|3\s*:\s*4|3\s*:\s*2|1\s*:\s*1)\b/gi, ""); // "9:16", "1:1", etc.

  // Clean extra blank lines
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  // 2) Build a strong, duplicate-safe AR directive
  const arHeader = `Generate a vertical portrait image in exact ${ratio} aspect ratio (full frame, no borders, no letterboxing).`;
  const arFlag = `--ar ${ratio}`;
  const arLine = `Aspect ratio: ${ratio}`;

  // 3) Prepend the header and append a single normalized AR line
  const core = s.length ? s : "";
  const result = [arHeader, core, arFlag, arLine].filter(Boolean).join("\n");

  return result.trim();
}

// Add banner component near top
function GeneratingBanner() {
  return (
    <div className="sticky top-0 z-20 bg-amber-500/10 border border-amber-400/30 text-amber-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Prompt received. Generating image… You can close this dialog; the card will update shortly.</span>
    </div>
  );
}

export default function PromptViewer({ card, open, onClose, onStartGenerate, onFinishGenerate }) {
  const [localCard, setLocalCard] = React.useState(card || null);
  const [copied, setCopied] = React.useState({ prompt: false, negative: false });
  const [seedError, setSeedError] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [updatingRef, setUpdatingRef] = React.useState(false);
  const [genError, setGenError] = React.useState("");
  const [aspectRatio, setAspectRatio] = React.useState(DEFAULT_ASPECT_RATIO);
  // NEW: editable fields + saving state
  const [editPrompt, setEditPrompt] = React.useState("");
  const [editNegative, setEditNegative] = React.useState("");
  const [editStyle, setEditStyle] = React.useState("");
  const [savingEdits, setSavingEdits] = React.useState(false);

  React.useEffect(() => {
    setLocalCard(card || null);
    // Use default 9:16 if no metadata saved
    const ar = card?.ai_prompt_metadata?.aspect_ratio || DEFAULT_ASPECT_RATIO;
    setAspectRatio(typeof ar === "string" && ar.trim() ? ar : DEFAULT_ASPECT_RATIO);
    setSeedError("");
    setGenError("");
    setCopied({ prompt: false, negative: false });
    // NEW: initialize editors
    setEditPrompt(card?.ai_image_prompt || "");
    setEditNegative(card?.ai_image_negative_prompt || "");
    setEditStyle(card?.ai_prompt_style || "");
  }, [card, open]);

  const isDirty = React.useMemo(() => {
    return (
      (editPrompt || "") !== (localCard?.ai_image_prompt || "") ||
      (editNegative || "") !== (localCard?.ai_image_negative_prompt || "") ||
      (editStyle || "") !== (localCard?.ai_prompt_style || "")
    );
  }, [editPrompt, editNegative, editStyle, localCard]);

  const refImage = localCard?.ai_reference_image_url || localCard?.ai_prompt_metadata?.reference_image_url || "";

  const copy = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied((c) => ({ ...c, [which]: true }));
      setTimeout(() => setCopied((c) => ({ ...c, [which]: false })), 1200);
    } catch {
      // ignore
    }
  };

  const handleSeedUpload = async (file) => {
    if (!localCard?.id) return;
    if (!isValidFile(file)) {
      setSeedError("Please choose a valid image file (jpg, png, webp).");
      return;
    }
    setSeedError("");
    setUpdatingRef(true);
    try {
      // Resilient uploader with retry/backoff
      const file_url = await safeUploadFile(file);
      const updatedMeta = {
        ...(localCard.ai_prompt_metadata || {}),
        reference_image_url: file_url,
      };
      await CardEntity.update(localCard.id, {
        ai_reference_image_url: file_url,
        ai_prompt_metadata: updatedMeta,
      });
      setLocalCard({
        ...localCard,
        ai_reference_image_url: file_url,
        ai_prompt_metadata: updatedMeta,
      });
    } catch (e) {
      setSeedError(e?.message || "Upload failed. Please try again.");
    } finally {
      setUpdatingRef(false);
    }
  };

  const handleClearSeed = async () => {
    if (!localCard?.id) return;
    setUpdatingRef(true);
    try {
      const updatedMeta = { ...(localCard.ai_prompt_metadata || {}) };
      delete updatedMeta.reference_image_url;
      await CardEntity.update(localCard.id, {
        ai_reference_image_url: "",
        ai_prompt_metadata: updatedMeta,
      });
      setLocalCard({
        ...localCard,
        ai_reference_image_url: "",
        ai_prompt_metadata: updatedMeta,
      });
    } finally {
      setUpdatingRef(false);
    }
  };

  // NEW: clear main card image_url
  const handleClearCardImage = async () => {
    if (!localCard?.id) return;
    if (!window.confirm("Remove the current card image?")) return;
    await CardEntity.update(localCard.id, { image_url: "" });
    setLocalCard({ ...localCard, image_url: "" });
    // Let parent refresh if it listens
    if (onFinishGenerate) onFinishGenerate(localCard.id);
  };

  const saveAspectRatio = async (ratio) => {
    if (!localCard?.id) return;
    // persist to metadata so future opens keep it
    const updatedMeta = { ...(localCard.ai_prompt_metadata || {}), aspect_ratio: ratio };
    await CardEntity.update(localCard.id, { ai_prompt_metadata: updatedMeta });
    setLocalCard({ ...localCard, ai_prompt_metadata: updatedMeta });
  };

  const saveEdits = async () => {
    if (!localCard?.id || !isDirty) return;
    setSavingEdits(true);
    try {
      await CardEntity.update(localCard.id, {
        ai_image_prompt: editPrompt,
        ai_image_negative_prompt: editNegative,
        ai_prompt_style: editStyle,
      });
      setLocalCard({
        ...localCard,
        ai_image_prompt: editPrompt,
        ai_image_negative_prompt: editNegative,
        ai_prompt_style: editStyle,
      });
    } finally {
      setSavingEdits(false);
    }
  };

  // This function is not used currently, but kept for context.
  // If it were used for generating, it would need to reference editPrompt, editNegative, editStyle.
  const buildPromptWithContext = () => {
    const parts = [];
    if (editPrompt) parts.push(editPrompt); // Changed from 'prompt'
    if (editStyle) parts.push(`Style: ${editStyle}`); // Changed from 'style'
    if (editNegative) parts.push(`Negative prompt: ${editNegative}`); // Changed from 'negative'
    if (aspectRatio) parts.push(`Aspect ratio: ${aspectRatio}`);
    // Include title/subtitle for consistent typography if available
    if (localCard?.name) parts.push(`Card title text: "${localCard.name}"`);
    if (localCard?.subtitle) parts.push(`Card subtitle text: "${localCard.subtitle}"`);
    return parts.filter(Boolean).join("\n");
  };

  const handleGenerate = async () => {
    if (!localCard?.id) return;
    const basePromptCandidate = (editPrompt || "").trim(); // Use editable prompt
    if (!basePromptCandidate) {
      setGenError("No prompt found for this card.");
      return;
    }
    setIsGenerating(true);
    setGenError("");

    // notify parent to show overlays/global banner
    if (onStartGenerate) onStartGenerate(localCard.id);

    try {
      // Autosave unsaved edits before generating
      if (isDirty) {
        await CardEntity.update(localCard.id, {
          ai_image_prompt: editPrompt,
          ai_image_negative_prompt: editNegative,
          ai_prompt_style: editStyle,
        });
        setLocalCard({
          ...localCard,
          ai_image_prompt: editPrompt,
          ai_image_negative_prompt: editNegative,
          ai_prompt_style: editStyle,
        });
      }

      // Ensure only one, correct AR is present in the prompt
      const finalPrompt = sanitizePromptAspectRatio(basePromptCandidate, aspectRatio || DEFAULT_ASPECT_RATIO);

      // Call integration with only 'prompt' (per schema), with retry/backoff for transient errors
      const { url } = await retryAsync(
        () => GenerateImage({ prompt: finalPrompt }),
        2, // retries
        800 // initial delay ms
      );

      if (!url) {
        throw new Error("Image service returned no URL. Please try again.");
      }

      const nextMeta = { ...(localCard.ai_prompt_metadata || {}), aspect_ratio: aspectRatio || DEFAULT_ASPECT_RATIO };
      await CardEntity.update(localCard.id, {
        image_url: url,
        ai_prompt_metadata: nextMeta
      });

      setLocalCard({ ...localCard, image_url: url, ai_prompt_metadata: nextMeta });
    } catch (e) {
      // Show helpful guidance for intermittent infra errors
      setGenError((e && e.message) ? e.message : "Image generation failed. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
      if (onFinishGenerate) onFinishGenerate(localCard.id);
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center py-10 text-white/70">
      <XCircle className="w-8 h-8 mb-2 text-white/50" />
      <p>No AI prompt saved on this card yet.</p>
      <p className="text-xs text-white/50 mt-1">Import JSON with image_prompt (or ai_image_prompt), or add it in the editor.</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            AI Image Prompt — {localCard?.name || ""}
            {typeof localCard?.number === "number" && (
              <Badge variant="outline" className="ml-2 border-white/20">#{localCard.number}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* NEW: sticky in-modal banner while generating */}
          {isGenerating && <GeneratingBanner />}

          {!localCard?.ai_image_prompt && !localCard?.ai_image_negative_prompt && !localCard?.ai_prompt_style ? (
            <ScrollArea className="h-full pr-1">
              <EmptyState />
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full pr-1">
              <div className="space-y-5">
                {/* Prompt (editable) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-white/70">Prompt</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(editPrompt, "prompt")}
                      className="border-white/20"
                    >
                      {copied.prompt ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied.prompt ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="bg-black/40 border border-white/10 rounded text-sm min-h-[120px]"
                  />
                </div>

                {/* Negative + Style (editable) */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/70">Negative Prompt</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copy(editNegative, "negative")}
                        className="border-white/20"
                      >
                        {copied.negative ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied.negative ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <Textarea
                      value={editNegative}
                      onChange={(e) => setEditNegative(e.target.value)}
                      placeholder="Things to avoid..."
                      className="bg-black/30 border border-white/10 rounded text-sm min-h-[100px]"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-white/70 mb-1">Style</div>
                    <Input
                      value={editStyle}
                      onChange={(e) => setEditStyle(e.target.value)}
                      placeholder='e.g., "studio photo, neon noir, cyberpunk"'
                      className="bg-black/20 border border-white/10 rounded text-xs"
                    />
                  </div>
                </div>

                {/* Aspect ratio */}
                <div className="rounded border border-white/10 p-3 bg-white/5">
                  <div className="grid md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-1">
                      <div className="text-xs text-white/70 mb-1">Aspect Ratio</div>
                      <Select
                        value={aspectRatio}
                        onValueChange={(v) => {
                          setAspectRatio(v);
                          saveAspectRatio(v); // Persist immediately
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select ratio" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          {RATIO_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {genError && (
                    <div className="text-xs text-amber-300 mt-2">{genError}</div>
                  )}
                </div>

                {/* Seed / Reference image */}
                <div className="rounded border border-white/10 p-3 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-white/80">Reference / Seed Image</div>
                    {refImage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearSeed}
                        disabled={updatingRef}
                        className="border-red-500/40 text-red-300 hover:bg-red-900/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <Input
                        type="file"
                        accept="image/*"
                        className="bg-slate-800 border-slate-700 text-white"
                        onChange={(e) => e.target.files?.[0] && handleSeedUpload(e.target.files[0])}
                        disabled={updatingRef}
                      />
                    </label>
                    {refImage ? (
                      <div className="flex items-center gap-3">
                        <img src={refImage} alt="reference" className="w-20 h-20 object-cover rounded border border-white/10" />
                        <div className="text-xs text-white/60 break-all">{refImage}</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <ImageIcon className="w-4 h-4" />
                        No reference image set yet.
                      </div>
                    )}
                  </div>
                  {seedError && <div className="mt-2 text-xs text-amber-300">{seedError}</div>}
                  {updatingRef && (
                    <div className="flex items-center gap-2 text-xs text-white/70 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving reference…
                    </div>
                  )}
                </div>

                {/* Metadata quick view */}
                <div className="rounded border border-white/10 p-3 bg-white/5">
                  <div className="text-xs text-white/70 mb-2">Metadata</div>
                  <ScrollArea className="max-h-36">
                    <pre className="text-xs text-white/80 whitespace-pre-wrap">
{JSON.stringify(
  {
    aspect_ratio: aspectRatio,
    reference_image_url: refImage || null
  },
  null,
  2
)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          {/* NEW: Save edits button */}
          <Button
            variant="outline"
            onClick={saveEdits}
            disabled={!isDirty || savingEdits || isGenerating}
            className="border-white/20 text-white hover:bg-white/10 w-full md:w-auto"
          >
            {savingEdits ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save changes
          </Button>

          {/* NEW: Clear Image button */}
          <Button
            variant="outline"
            onClick={handleClearCardImage}
            disabled={isGenerating || !localCard?.image_url}
            className="border-red-500/40 text-red-300 hover:bg-red-900/20 w-full md:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Image
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !(editPrompt || localCard?.ai_image_prompt)}
            className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating…" : "Generate Image"}
          </Button>
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10 w-full md:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
