
import React from "react";
import { Deck, Card } from "@/entities/all";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image as ImageIcon, Upload, Link as LinkIcon, Wand2, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { safeUploadFile } from "@/components/utils/safeUpload";
import { base44 } from "@/api/base44Client";

export default function DeckCoverEditor({ deckId, isOpen, onClose, initialCover, initialBack, onSaved }) {
  const [coverUrl, setCoverUrl] = React.useState(initialCover || "");
  const [backUrl, setBackUrl] = React.useState(initialBack || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const [isUploadingBack, setIsUploadingBack] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState("");
  const [removeBg, setRemoveBg] = React.useState(false);
  
  // AI Generation state
  const [deck, setDeck] = React.useState(null);
  const [cards, setCards] = React.useState([]);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [basePrompt, setBasePrompt] = React.useState(""); // Store original prompt for refinement
  const [aspectRatio, setAspectRatio] = React.useState("1:1");
  const [refinementPrompt, setRefinementPrompt] = React.useState("");
  const [styleProfile, setStyleProfile] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [generationHistory, setGenerationHistory] = React.useState([]);

  React.useEffect(() => {
    if (isOpen) {
      setCoverUrl(initialCover || "");
      setBackUrl(initialBack || "");
      setError("");
      setIsSaving(false);
      setIsUploadingCover(false);
      setIsUploadingBack(false);
      setIsGenerating(false);
      setStyleProfile(null);
      setBasePrompt("");
      setAspectRatio("1:1");
      setRefinementPrompt("");
      setGenerationHistory([]);
      loadDeckData();
    }
  }, [isOpen, initialCover, initialBack, deckId]);

  const loadDeckData = async () => {
    if (!deckId) return;
    try {
      const [deckData, cardsData] = await Promise.all([
        Deck.get(deckId),
        Card.filter({ deck_id: deckId })
      ]);
      setDeck(deckData);
      setCards(cardsData.filter(c => c.image_url));
      setRemoveBg(!!deckData.auto_remove_bg);
    } catch (e) {
      console.error("Failed to load deck data:", e);
      setError("Failed to load deck data. Please try again.");
    }
  };

  const upload = async (file, setUrl, setUploading) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fileUrl = await safeUploadFile(file);
      let finalUrl = fileUrl;

      if (removeBg && fileUrl) {
        try {
          const { data } = await base44.functions.invoke('removeBackground', { image_url: fileUrl });
          if (data?.status === 'ok' && data?.file_url) {
            finalUrl = data.file_url;
          } else if (data?.status === 'error') {
            setError(data.message || "Background removal failed. Uploading original image.");
          }
        } catch (bgError) {
          console.error("Error during background removal:", bgError);
          setError("Failed to remove background. Uploading original image.");
        }
      }

      setUrl(finalUrl);
    } catch (e) {
      const msg = e?.message?.toLowerCase?.().includes("network")
        ? "Network error while uploading. Please check your connection and try again."
        : (e?.message || "Upload failed. Please try again.");
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const analyzeStyle = async () => {
    if (cards.length < 3) {
      setError("Need at least 3 cards with images to analyze deck style");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Select up to 5 representative cards
      const sampleCards = cards
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(c => c.id);

      const { data } = await base44.functions.invoke('extractDeckStyle', {
        card_ids: sampleCards,
        deck_id: deckId
      });

      console.log('[DeckCoverEditor] Style analysis response:', data);

      if (data.status === 'error') {
        setError(data.error || "Failed to analyze deck style");
      } else if (data.status === 'success' && data.style_profile) {
        setStyleProfile(data.style_profile);
        
        // Pre-fill prompt with style-aware suggestion
        const deckName = deck?.name || "Oracle Deck";
        const keywords = data.style_profile.style_keywords?.slice(0, 5).join(', ') || '';
        const suggestedPrompt = `Book cover for "${deckName}" oracle deck, ${keywords}, mystical and professional, centered title text, symbolic artwork`;
        setCustomPrompt(suggestedPrompt);
        setBasePrompt(suggestedPrompt); // Also set base prompt initially
      } else {
        setError("Unexpected response from style analysis");
      }
    } catch (err) {
      console.error("Style analysis error:", err);
      setError(err.message || "Failed to analyze deck style");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCover = async (isRefinement = false) => {
    if (!deck) {
      setError("Deck data not loaded");
      return;
    }

    if (!customPrompt || !customPrompt.trim()) {
      setError("Please enter a prompt for the cover image");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      let prompt = isRefinement ? (basePrompt || customPrompt.trim()) : customPrompt.trim();
      
      // If this is a refinement, append the refinement instructions
      if (isRefinement && refinementPrompt.trim()) {
        prompt = `${prompt}. ${refinementPrompt.trim()}`;
      }
      
      // Append style DNA if available
      if (styleProfile?.ai_prompt_suggestions?.style_prefix) {
        prompt = `${prompt}. ${styleProfile.ai_prompt_suggestions.style_prefix}. ${styleProfile.ai_prompt_suggestions.color_guidance}`;
      }

      // CRITICAL: Add EXPLICIT aspect ratio instructions at the BEGINNING of the prompt
      const aspectRatioInstructions = {
        "1:1": "ASPECT RATIO 1:1 (SQUARE FORMAT, EQUAL WIDTH AND HEIGHT, 1024x1024 dimensions). ",
        "2:3": "ASPECT RATIO 2:3 (PORTRAIT FORMAT, TAROT CARD PROPORTIONS, VERTICAL ORIENTATION, 682x1024 dimensions). ",
        "9:16": "ASPECT RATIO 9:16 (TALL PORTRAIT FORMAT, MOBILE-OPTIMIZED VERTICAL, 576x1024 dimensions). ",
        "3:4": "ASPECT RATIO 3:4 (PORTRAIT FORMAT, ORACLE CARD PROPORTIONS, VERTICAL ORIENTATION, 768x1024 dimensions). "
      };

      // Prepend aspect ratio instruction to the very beginning
      prompt = aspectRatioInstructions[aspectRatio] + prompt;

      // Add compositional guidance based on aspect ratio
      const compositionalHints = {
        "1:1": "Balanced, centered composition with equal visual weight on all sides. Square format.",
        "2:3": "Vertical composition with top-to-bottom visual flow. Portrait orientation, tarot card style.",
        "9:16": "Tall vertical format optimized for mobile devices. Strong vertical elements.",
        "3:4": "Vertical portrait composition typical of oracle cards. Upright rectangular format."
      };
      
      if (compositionalHints[aspectRatio]) {
        prompt = `${prompt}. ${compositionalHints[aspectRatio]}`;
      }

      // Add final emphasis on aspect ratio
      const dimensionReminders = {
        "1:1": "Square image, 1:1 ratio, equal dimensions",
        "2:3": "Portrait image, 2:3 ratio, vertical format",
        "9:16": "Tall portrait, 9:16 ratio, vertical phone format",
        "3:4": "Portrait card, 3:4 ratio, vertical orientation"
      };
      
      prompt = `${prompt}. FORMAT: ${dimensionReminders[aspectRatio]}.`;

      console.log('🎨 Generating cover with prompt:', prompt);
      console.log('📐 Aspect ratio:', aspectRatio);

      // Try Gemini first (free with API key), fallback to GetImg.ai if needed
      let response;
      let usedGemini = false;
      
      try {
        // Map aspect ratios for Gemini
        const geminiAspectMap = {
          "1:1": "1:1",
          "2:3": "3:4", // Closest match
          "9:16": "9:16",
          "3:4": "3:4"
        };
        
        console.log('🤖 Trying Gemini image generation first...');
        const { data: geminiData } = await base44.functions.invoke('generateImageGemini', {
          prompt: prompt,
          aspectRatio: geminiAspectMap[aspectRatio] || "1:1"
        });
        
        if (geminiData?.url) {
          response = { url: geminiData.url };
          usedGemini = true;
          console.log('✅ Gemini generation successful!');
        } else {
          throw new Error('No URL in Gemini response');
        }
      } catch (geminiError) {
        console.warn('⚠️ Gemini failed, falling back to GetImg.ai:', geminiError.message);
        
        // Fallback to GetImg.ai
        try {
          response = await base44.integrations.Core.GenerateImage({ prompt });
        } catch (getimgError) {
          // Check if it's a payment error
          if (getimgError.response?.status === 402 || getimgError.message?.includes('Payment Required')) {
            throw new Error('💳 Image generation requires credits. Both Gemini and GetImg.ai services are unavailable. Please check your API keys or upload images manually instead (use the "Upload Images" tab).');
          }
          throw getimgError;
        }
      }

      console.log('📦 Image generation response:', response, usedGemini ? '(Gemini)' : '(GetImg.ai)');

      let imageUrl = null;
      if (response?.data?.url) {
        imageUrl = response.data.url;
      } else if (response?.url) {
        imageUrl = response.url;
      } else if (response?.data?.image_url) {
        imageUrl = response.data.image_url;
      }

      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
        console.error('❌ Invalid image URL in response:', response);
        throw new Error('No valid image URL in response');
      }

      console.log('✅ Got image URL:', imageUrl);
      
      // Save to history before updating
      if (coverUrl) {
        setGenerationHistory(prev => [coverUrl, ...prev].slice(0, 5)); // Keep last 5
      }
      
      setCoverUrl(imageUrl);
      
      // Store the base prompt (without refinements) for future iterations
      if (!isRefinement) {
        setBasePrompt(customPrompt.trim());
      }
      
      // Clear refinement prompt after use
      if (isRefinement) {
        setRefinementPrompt("");
      }
      
      setError(""); // Clear any previous errors

    } catch (err) {
      console.error("Cover generation error:", err);
      
      // ENHANCED: Better error handling for payment/credits issues
      const errorMsg = err.message || err.response?.data?.error || "Failed to generate cover image";
      const errorStatus = err.response?.status || err.status;
      
      if (errorStatus === 402 || errorMsg.includes('Payment Required') || errorMsg.includes('402')) {
        setError("⚠️ Image generation credits needed. Please add credits to your image generation service, or manually upload a cover image instead (use the 'Upload Images' tab).");
      } else if (errorStatus === 429 || errorMsg.includes('rate limit')) {
        setError("⏱️ Rate limit reached. Please wait a minute and try again.");
      } else if (errorStatus >= 500) {
        setError("🔧 Image service is temporarily unavailable. Try again in a few minutes or use manual upload.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const applyQuickRefinement = (adjustment) => {
    const refinements = {
      'bw': 'convert to black and white, monochrome, high contrast',
      'simpler': 'simplify the design, less busy, cleaner composition, minimal details',
      'colorful': 'more vibrant colors, saturated hues, rich color palette',
      'detailed': 'add more intricate details, elaborate design, complex patterns',
      'minimalist': 'ultra minimalist, simple geometric shapes, clean lines',
      'mystical': 'enhance mystical elements, add magical glow, ethereal atmosphere'
    };
    
    setRefinementPrompt(refinements[adjustment] || adjustment);
    generateCover(true); // Trigger generation immediately with the quick refinement
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      await Deck.update(deckId, {
        cover_image: coverUrl?.trim() || null,
        back_image_url: backUrl?.trim() || null,
        auto_remove_bg: removeBg,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (e) {
      console.error("Save error:", e);
      setError(e.message || "Failed to save deck images");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptChange = (e) => {
    try {
      const value = e.target.value;
      setCustomPrompt(value);
    } catch (err) {
      console.error("Error updating prompt:", err);
      setError("Failed to update prompt. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white border border-purple-800/40 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="w-6 h-6 text-purple-300" />
            Deck Cover & Back Images
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="upload">Upload Images</TabsTrigger>
            <TabsTrigger value="generate">
              <Wand2 className="w-4 h-4 mr-2" />
              AI Generate Cover
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6 mt-4">
            {/* Background removal toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remove-bg-toggle"
                checked={removeBg}
                onChange={e => setRemoveBg(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="remove-bg-toggle" className="text-sm text-white/80 cursor-pointer">
                Automatically remove background from new uploads
              </label>
            </div>

            {/* Cover image */}
            <div className="space-y-2">
              <Label className="text-purple-200">Front Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20"
                  onClick={() => {
                    const url = prompt("Paste image URL");
                    if (url) setCoverUrl(url);
                  }}
                  title="Paste URL"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
                <label className={`inline-flex items-center justify-center px-3 rounded border border-white/20 cursor-pointer ${isUploadingCover ? "opacity-70" : ""}`}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploadingCover ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], setCoverUrl, setIsUploadingCover)}
                    className="hidden"
                    disabled={isUploadingCover}
                  />
                </label>
              </div>
              {coverUrl && (
                <div className="mt-2">
                  <img src={coverUrl} alt="Cover preview" className="w-48 h-48 rounded border border-slate-700 object-cover" />
                </div>
              )}
              <p className="text-xs text-white/60 flex items-center gap-1">
                Recommended: square image (e.g., 800x800). Supports JPG, PNG, WebP, and GIF formats.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Back image */}
            <div className="space-y-2">
              <Label className="text-purple-200">Back Image (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={backUrl}
                  onChange={(e) => setBackUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20"
                  onClick={() => {
                    const url = prompt("Paste image URL");
                    if (url) setBackUrl(url);
                  }}
                  title="Paste URL"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
                <label className={`inline-flex items-center justify-center px-3 rounded border border-white/20 cursor-pointer ${isUploadingBack ? "opacity-70" : ""}`}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploadingBack ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], setBackUrl, setIsUploadingBack)}
                    className="hidden"
                    disabled={isUploadingBack}
                  />
                </label>
              </div>
              {backUrl && (
                <div className="mt-2">
                  <img src={backUrl} alt="Back preview" className="w-48 h-48 rounded border border-slate-700 object-cover" />
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Generate Tab */}
          <TabsContent value="generate" className="space-y-6 mt-4">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-200">AI-Powered Cover Generation</h3>
                  <p className="text-sm text-purple-300/80 mt-1">
                    Generate a professional cover image that matches your deck's visual style
                  </p>
                </div>
              </div>

              {cards.length < 3 ? (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded p-3 text-sm text-amber-200">
                  ⚠️ You need at least 3 cards with images to analyze deck style. Upload card images first!
                </div>
              ) : (
                <>
                  {/* Step 1: Analyze Style */}
                  {!styleProfile && (
                    <div className="space-y-3">
                      <p className="text-sm text-white/70">
                        Step 1: Analyze your deck's visual style from existing cards (optional)
                      </p>
                      <Button
                        onClick={analyzeStyle}
                        disabled={isAnalyzing || cards.length < 3}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing {cards.length} cards...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analyze Deck Style ({cards.length} cards)
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Style Profile Display */}
                  {styleProfile && (
                    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-300">✅ Style analyzed!</span>
                        <Button
                          onClick={analyzeStyle}
                          size="sm"
                          variant="ghost"
                          className="text-xs text-purple-300 hover:text-purple-200"
                        >
                          Re-analyze
                        </Button>
                      </div>
                      <div className="text-xs text-white/60">
                        🎨 Colors: {styleProfile.color_palette?.join(', ')}
                      </div>
                      <div className="text-xs text-white/60">
                        🏷️ Style: {styleProfile.style_keywords?.slice(0, 5).join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Choose Aspect Ratio */}
                  <div className="space-y-2 mt-4">
                    <Label className="text-white">Cover Aspect Ratio</Label>
                    <p className="text-xs text-white/60 mb-2">
                      ⚠️ Choose carefully - this determines the final image dimensions
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setAspectRatio("1:1")}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          aspectRatio === "1:1"
                            ? "border-purple-500 bg-purple-500/20 ring-2 ring-purple-400/50"
                            : "border-white/20 bg-black/20 hover:border-white/40"
                        }`}
                      >
                        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                        <div className="text-xs mt-2 font-semibold">Square</div>
                        <div className="text-xs text-white/60">1:1</div>
                        <div className="text-[10px] text-white/40">1024×1024</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("2:3")}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          aspectRatio === "2:3"
                            ? "border-purple-500 bg-purple-500/20 ring-2 ring-purple-400/50"
                            : "border-white/20 bg-black/20 hover:border-white/40"
                        }`}
                      >
                        <div className="w-8 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                        <div className="text-xs mt-2 font-semibold">Tarot</div>
                        <div className="text-xs text-white/60">2:3</div>
                        <div className="text-[10px] text-white/40">682×1024</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("9:16")}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          aspectRatio === "9:16"
                            ? "border-purple-500 bg-purple-500/20 ring-2 ring-purple-400/50"
                            : "border-white/20 bg-black/20 hover:border-white/40"
                        }`}
                      >
                        <div className="w-7 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                        <div className="text-xs mt-2 font-semibold">Portrait</div>
                        <div className="text-xs text-white/60">9:16</div>
                        <div className="text-[10px] text-white/40">576×1024</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("3:4")}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          aspectRatio === "3:4"
                            ? "border-purple-500 bg-purple-500/20 ring-2 ring-purple-400/50"
                            : "border-white/20 bg-black/20 hover:border-white/40"
                        }`}
                      >
                        <div className="w-9 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                        <div className="text-xs mt-2 font-semibold">Oracle</div>
                        <div className="text-xs text-white/60">3:4</div>
                        <div className="text-[10px] text-white/40">768×1024</div>
                      </button>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-2">
                      <p className="text-xs text-blue-200">
                        💡 <strong>Selected: {aspectRatio}</strong> - The AI will generate an image specifically for this aspect ratio
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Customize Prompt */}
                  <div className="space-y-2 mt-4">
                    <Label className="text-white">Cover Image Prompt</Label>
                    <Textarea
                      value={customPrompt}
                      onChange={handlePromptChange}
                      placeholder={`Book cover for "${deck?.name || 'Oracle Deck'}", mystical and professional, centered title text, symbolic artwork`}
                      className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                    />
                    <p className="text-xs text-white/60">
                      💡 Tip: Include "{deck?.name}" in your prompt to add the deck title to the cover
                    </p>
                    <p className="text-xs text-amber-300">
                      ⚠️ Don't include aspect ratio in your prompt - it's automatically added based on your selection above
                    </p>
                  </div>

                  {/* Step 4: Generate */}
                  <Button
                    onClick={() => generateCover(false)}
                    disabled={isGenerating || !customPrompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-4"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating {aspectRatio} cover...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Cover Image ({aspectRatio})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Refinement Controls (show after first generation) */}
            {coverUrl && basePrompt && (
              <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-semibold text-purple-200 mb-3">🎨 Refine Result</h4>
                
                {/* Quick Adjustments */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickRefinement('bw')}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    ⚫ Black & White
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickRefinement('simpler')}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    ✂️ Simpler
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickRefinement('colorful')}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    🌈 More Color
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickRefinement('detailed')}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    ✨ More Detail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickRefinement('minimalist')}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    ⬜ Minimalist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickRefinement('mystical')}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    🔮 More Mystical
                  </Button>
                </div>

                {/* Custom Refinement */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/80">Or describe your adjustment:</Label>
                  <Input
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g., make it darker, add gold accents, remove text..."
                    className="bg-slate-900 border-slate-700 text-white text-sm"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={() => generateCover(true)}
                    disabled={isGenerating || !refinementPrompt.trim()}
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Regenerate with Changes
                      </>
                    )}
                  </Button>
                </div>

                {/* Generation History */}
                {generationHistory.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-xs text-white/60 mb-2 block">Previous versions:</Label>
                    <div className="flex gap-2 overflow-x-auto">
                      {generationHistory.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Version ${idx + 1}`}
                          className="w-20 h-20 rounded border border-white/20 object-cover cursor-pointer hover:border-purple-400 transition-colors"
                          onClick={() => setCoverUrl(url)}
                          title="Click to restore this version"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generated Cover Preview */}
            {coverUrl && (
              <div className="space-y-2">
                <Label className="text-purple-200">Generated Cover Preview</Label>
                <img src={coverUrl} alt="Generated cover" className="w-full max-w-md rounded border border-purple-500/30 object-cover mx-auto" />
                <p className="text-xs text-center text-green-300">
                  ✨ Cover generated! Click "Save" below to apply it to your deck.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-sm text-red-300 flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded p-3">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white">
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
