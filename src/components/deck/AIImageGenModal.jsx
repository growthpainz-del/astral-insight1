import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Image as ImageIcon, Check, Copy, AlertTriangle, Heart } from "lucide-react";
import { GenerateImage } from "@/integrations/Core";
import { Card as CardEntity } from "@/entities/Card";
import { base44 } from "@/api/base44Client";

const ASPECTS = [
  { id: "portrait", label: "Portrait (2:3)", w: 2, h: 3, promptHint: "portrait 2:3 aspect ratio" },
  { id: "square", label: "Square (1:1)", w: 1, h: 1, promptHint: "square 1:1 aspect ratio" },
  { id: "landscape", label: "Landscape (16:9)", w: 16, h: 9, promptHint: "landscape 16:9 aspect ratio" },
  { id: "classic", label: "Classic (3:2)", w: 3, h: 2, promptHint: "classic 3:2 aspect ratio" },
];

const BASE_SIZES = [
  { id: "512", label: "Small (512 width)" },
  { id: "768", label: "Medium (768 width)" },
  { id: "1024", label: "Large (1024 width)" },
];

function computeDims(aspectId, baseWidth) {
  const a = ASPECTS.find((x) => x.id === aspectId) || ASPECTS[0];
  if (a.id === "square") return { width: baseWidth, height: baseWidth };
  // portrait: 2:3
  const height = Math.round((baseWidth * a.h) / a.w);
  return { width: baseWidth, height };
}

export default function AIImageGenModal({ isOpen, onClose, card, defaultPrompt, onApplied }) {
  const [prompt, setPrompt] = React.useState(defaultPrompt || "");
  const [negative, setNegative] = React.useState("");
  const [style, setStyle] = React.useState("photorealistic");
  const [seed, setSeed] = React.useState("");
  const [aspect, setAspect] = React.useState("portrait");
  const [baseSize, setBaseSize] = React.useState("1024");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSavingInspiration, setIsSavingInspiration] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resultUrl, setResultUrl] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      const base = defaultPrompt || buildPromptFromCard(card);
      setPrompt(base);
      setNegative(card?.ai_image_negative_prompt || "");
      setStyle("photorealistic");
      setSeed("");
      setResultUrl("");
      setError("");
      setIsGenerating(false);
      setAspect("portrait");
      setBaseSize("1024");
    }
     
  }, [isOpen, card?.id, defaultPrompt]);

  const buildPromptFromCard = (c) => {
    if (!c) return "High-detail illustration of an oracle card. Elegant, mystical, cinematic lighting, sharp focus, no text, no watermark";
    const parts = [];
    if (c.name) parts.push(`Oracle card titled "${c.name}"`);
    if (c.element && c.element !== "none") parts.push(`elemental theme: ${c.element}`);
    if (Array.isArray(c.keywords) && c.keywords.length) parts.push(`keywords: ${c.keywords.slice(0, 6).join(", ")}`);
    if (c.overall_meaning) parts.push(`tone: ${String(c.overall_meaning).slice(0, 120)}`);
    parts.push("intricate linework, rich color grading, sharp focus, 4k, suitable as card art, no text, no watermark");
    return parts.join("; ");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setResultUrl("");
    try {
      const baseW = parseInt(baseSize, 10);
      const dims = computeDims(aspect, baseW);
      const aspectHint = (ASPECTS.find((a) => a.id === aspect)?.promptHint) || "";
      const sizeHint = `target size ${dims.width}x${dims.height} pixels`;
      const styleHint = style && style !== "none" ? `style: ${style}` : "";
      const negativeHint = negative ? `negative prompt: ${negative}` : "";
      const fullPrompt =
        (seed ? `${prompt}\nseed: ${seed}` : prompt) +
        `; ${aspectHint}; ${sizeHint}; ${styleHint}; centered composition` +
        (negativeHint ? `\n${negativeHint}` : "");

      const { url } = await GenerateImage({ prompt: fullPrompt });
      if (!url) {
        setError("No image returned. Try again or tweak the prompt/size.");
      } else {
        setResultUrl(url);
      }
    } catch (e) {
      setError(e?.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyToCard = async () => {
    if (!resultUrl) return;
    try {
      if (card?.id) {
        await CardEntity.update(card.id, { image_url: resultUrl });
      }
      if (onApplied) onApplied(resultUrl);
      if (onClose) onClose();
    } catch (e) {
      setError(e?.message || "Failed to save image to card");
    }
  };

  const copyUrl = async () => {
    if (!resultUrl) return;
    try {
      await navigator.clipboard.writeText(resultUrl);
    } catch {
      /* ignore copy errors */
    }
  };

  const saveInspiration = async () => {
    if (!resultUrl) return;
    setIsSavingInspiration(true);
    setError("");
    try {
      if (card?.id) {
        const newHistory = [...(card.ai_prompt_history || []), {
          prompt,
          timestamp: new Date().toISOString(),
          created_by: undefined,
          source: "regeneration",
          image_url: resultUrl,
          generation_success: true,
          notes: [style && style !== "none" ? `style=${style}` : null, negative ? `negative=${negative}` : null].filter(Boolean).join("; ")
        }];
        const newImages = Array.isArray(card.ai_generated_images) ? [...card.ai_generated_images, resultUrl] : [resultUrl];
        await CardEntity.update(card.id, { ai_generated_images: newImages, ai_prompt_history: newHistory });
      }
      await base44.entities.UploadAsset.create({
        file_url: resultUrl,
        linked_card_id: card?.id || undefined,
        file_name: `AI Inspiration - ${card?.name || "Card"}`,
        tags: ["ai_generated", "inspiration"]
      });
    } catch (e) {
      setError(e?.message || "Failed to save inspiration");
    } finally {
      setIsSavingInspiration(false);
    }
  };

  const baseW = parseInt(baseSize, 10);
  const dims = computeDims(aspect, baseW);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 text-white border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-300" />
            Generate AI Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-3 space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-slate-800 border-slate-700 min-h-[120px]"
                placeholder="Describe the card artwork you want..."
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <Label>Negative prompt (things to avoid)</Label>
              <Textarea
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                className="bg-slate-800 border-slate-700 min-h-[80px]"
                placeholder="blurry, text, watermark, extra fingers, low quality"
              />
            </div>

            <div>
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="photorealistic">Photorealistic</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="oil painting">Oil painting</SelectItem>
                  <SelectItem value="watercolor">Watercolor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Aspect</Label>
              <Select value={aspect} onValueChange={setAspect}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select aspect" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {ASPECTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Size</Label>
              <Select value={baseSize} onValueChange={setBaseSize}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {BASE_SIZES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-white/60 mt-1">
                Target dimensions: {dims.width} × {dims.height}px
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          </div>

          {/* Result */}
          {error && (
            <div className="text-sm text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded p-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {resultUrl && (
            <div className="space-y-2">
              <div className="rounded border border-white/10 bg-black/30 p-3">
                <img
                  src={resultUrl}
                  alt="Generated"
                  className="max-h-[360px] w-auto mx-auto rounded"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={applyToCard} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-4 h-4 mr-2" />
                  Apply to card
                </Button>
                <Button variant="outline" onClick={saveInspiration} disabled={isSavingInspiration} className="border-white/20">
                  {isSavingInspiration ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                  Save inspiration
                </Button>
                <Button variant="outline" onClick={copyUrl} className="border-white/20">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>
              <div className="text-xs text-white/50">
                Note: We request the selected size/aspect from the AI by adding it to the prompt. Some models may return nearby dimensions.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}