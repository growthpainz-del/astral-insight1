import React, { useState, useEffect } from "react";
import { Card as CardEntity } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, CheckCircle2, AlertTriangle, XCircle, Info, Zap, Sparkles, Palette, ImageIcon, RefreshCw, Edit3, Shuffle, Eye, Copy, FileText, AlertCircleIcon, History, Clock, User, Download, Lock, Unlock } from "lucide-react";
import TokenCostPreview, { TOKEN_COSTS } from "@/components/pricing/TokenCostPreview";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queueApiCall } from "@/components/utils/apiQueue";

// Helper to detect network errors
const isNetworkError = (error) => {
  if (!error) return false;
  const msg = (error.message || error.toString() || "").toLowerCase();
  return (
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("network request failed") ||
    msg.includes("timeout") ||
    msg.includes("timed out") || // ADDED: Catch "timed out" errors
    msg.includes("timeoutms") || // ADDED: Catch MongoDB timeout errors
    msg.includes("connecttimeoutms") || // ADDED: Catch connection timeout errors
    error.code === "ERR_NETWORK" ||
    error.code === "ETIMEDOUT" || // ADDED: Network timeout code
    !error.response
  );
};

// Aggressive retry wrapper specifically for image generation
const retryImageGeneration = async (generateFn, cardName, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎨 Attempt ${attempt}/${maxRetries} for "${cardName}"`);
      const result = await generateFn();
      console.log(`✅ Success on attempt ${attempt} for "${cardName}"`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed for "${cardName}":`, error);

      // ENHANCED: Better error handling for payment/credits issues, rate limits, and server issues
      const errorStatus = error.response?.status || error.status;
      const errorMsg = error.message || error.response?.data?.error || "Generation failed";
      
      if (errorStatus === 402 || errorMsg.includes('Payment Required') || errorMsg.includes('402')) {
        throw new Error("⚠️ Image generation credits needed. Please add credits to continue, or upload images manually instead.");
      } else if (errorStatus === 429 || errorMsg.includes('rate limit')) {
        throw new Error("⏱️ Rate limit reached. Please wait before generating more images.");
      } else if (errorStatus >= 500) {
        throw new Error("🔧 Image service temporarily unavailable. Try again later.");
      }

      const isNetErr = isNetworkError(error);
      const isTimeout = error.message?.toLowerCase().includes('timeout') ||
                       error.message?.toLowerCase().includes('timed out');

      if (attempt < maxRetries) {
        // INCREASED: Longer delays for timeout errors (5s, 10s, 20s)
        const delayMs = isTimeout
          ? 5000 * Math.pow(2, attempt - 1)
          : 3000 * Math.pow(2, attempt - 1);

        const errorType = isTimeout ? "TIMEOUT" : isNetErr ? "NETWORK" : "ERROR";
        console.log(`⏳ ${errorType} - Waiting ${delayMs/1000}s before retry ${attempt + 1} for "${cardName}"`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        // Final attempt failed
        if (isNetErr || isTimeout) {
          throw new Error(`Service timeout after ${maxRetries} attempts. The AI image service is overloaded. Please wait 30 seconds and try again.`);
        }
        throw error;
      }
    }
  }

  throw lastError;
};

export default function BulkAIImageGenerator({ deckId, onDone }) {
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]); // Stores IDs of cards selected for generation
  const [styleReferenceCards, setStyleReferenceCards] = useState([]); // Stores IDs of cards selected for style analysis
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyzingStyle, setAnalyzingStyle] = useState(false); // Renamed from isAnalyzingStyle
  const [autoFilling, setAutoFilling] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [error, setError] = useState(""); // For general errors and success messages
  const [styleError, setStyleError] = useState(""); // For style analysis specific errors
  const [generatedImages, setGeneratedImages] = useState({}); // To store successful image URLs
  const [batchPrompt, setBatchPrompt] = useState(""); // For the template prompt
  const [aspectRatio, setAspectRatio] = useState("1:1"); // Changed default from 2:3 to 1:1 as per outline
  const [styleProfile, setStyleProfile] = useState(null); // To store analyzed style
  const [user, setUser] = useState(null);
  const [showStyleSelector, setShowStyleSelector] = useState(false); // Toggle for style card selection
  const [deck, setDeck] = useState(null);
  const [consecutiveNetworkErrors, setConsecutiveNetworkErrors] = useState(0); // NEW: Track consecutive network errors
  
  // NEW: Style Lock state
  const [styleLocked, setStyleLocked] = useState(false);

  // Prompt preview & editing
  const [promptStats, setPromptStats] = useState({ hasPrompt: 0, fromName: 0, generic: 0 });
  const [showPromptPreview, setShowPromptPreview] = useState(false); // This state variable is declared but not explicitly used in the provided UI.
  const [editingPrompt, setEditingPrompt] = useState({ cardId: null, prompt: "" }); // This state variable is declared but not explicitly used in the provided UI.

  // NEW: Refinement modal state
  const [refinementModal, setRefinementModal] = useState({ open: false, cardId: null, result: null, card: null });
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // NEW: View prompt modal state
  const [viewPromptModal, setViewPromptModal] = useState({ open: false, card: null });

  // NEW: Prompt history modal state
  const [historyModal, setHistoryModal] = useState({ open: false, card: null });
  const [viewModal, setViewModal] = useState({ open: false, card: null, imageUrl: null });

  useEffect(() => {
    loadCards();
    loadUser();
    loadDeck();
  }, [deckId]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      console.error("Failed to load user:", e);
    }
  };

  const loadDeck = async () => {
    if (!deckId) return;
    try {
      const deckData = await base44.entities.Deck.filter({ id: deckId });
      if (deckData && deckData.length > 0) {
        setDeck(deckData[0]);
      }
    } catch (e) {
      console.error("Failed to load deck:", e);
    }
  };

  const loadCards = async () => {
    if (!deckId) {
      setError("❌ No deck ID provided");
      setLoading(false); // Ensure loading state is cleared even if no deckId
      return;
    }
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const allCards = await CardEntity.filter({ deck_id: deckId });
      setCards(allCards);

      // Auto-select cards without images for generation
      const missing = allCards.filter(c => !c.image_url).map(c => c.id);
      setSelectedCards(missing);

      // Auto-select up to 5 cards WITH images for style analysis
      const withImages = allCards.filter(c => c.image_url).slice(0, 5).map(c => c.id);
      setStyleReferenceCards(withImages);

      // Calculate prompt stats
      calculatePromptStats(allCards);
    } catch (err) {
      console.error("Failed to load cards:", err);
      setError("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  const calculatePromptStats = (cardList) => {
    const stats = {
      hasPrompt: 0,
      fromName: 0,
      generic: 0
    };

    cardList.forEach(card => {
      // FIXED: Check both ai_image_prompt and legacy ai_prompt field
      if ((card.ai_image_prompt && card.ai_image_prompt.trim()) ||
          (card.ai_prompt && card.ai_prompt.trim())) {
        stats.hasPrompt++;
      } else if (card.name && card.name.trim()) {
        stats.fromName++;
      } else {
        stats.generic++;
      }
    });

    setPromptStats(stats);
  };

  // NEW: Helper to add prompt to history
  const addPromptToHistory = async (cardId, prompt, source, imageUrl = null, success = null) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const historyEntry = {
        prompt: prompt,
        timestamp: new Date().toISOString(),
        created_by: user?.email || "unknown",
        source: source,
        image_url: imageUrl,
        generation_success: success,
      };

      const existingHistory = card.ai_prompt_history || [];
      const updatedHistory = [...existingHistory, historyEntry];

      await CardEntity.update(cardId, { // Changed: Removed queueApiCall wrapper
        ai_prompt_history: updatedHistory
      });

      // Update local state
      setCards(prevCards => prevCards.map(c =>
        c.id === cardId ? { ...c, ai_prompt_history: updatedHistory } : c
      ));

      console.log(`[BulkAI] Added prompt to history for card ${card.name}`);
    } catch (err) {
      console.error("[BulkAI] Failed to save prompt history:", err);
    }
  };

  // NEW: Open history modal
  const openHistoryModal = (card) => {
    setHistoryModal({ open: true, card });
  };

  // NEW: Close history modal
  const closeHistoryModal = () => {
    setHistoryModal({ open: false, card: null });
  };

  // NEW: Restore prompt from history
  const restorePromptFromHistory = async (historyEntry) => {
    if (!historyModal.card) return;

    if (!confirm(`Restore this prompt?\n\n"${historyEntry.prompt.substring(0, 100)}..."\n\nThis will replace the current prompt for "${historyModal.card.name}".`)) {
      return;
    }

    try {
      await queueApiCall(() => CardEntity.update(historyModal.card.id, {
        ai_image_prompt: historyEntry.prompt
      }));

      // Add restoration to history
      await addPromptToHistory(
        historyModal.card.id,
        historyEntry.prompt,
        "manual_edit", // Source for restoration
        historyEntry.image_url, // Carry over image if it exists from previous generation
        null // Success status not applicable for a restoration
      );

      // Refresh cards to get updated prompt and history
      await loadCards();
      closeHistoryModal();
      alert("✅ Prompt restored successfully!");
    } catch (err) {
      console.error("Failed to restore prompt:", err);
      alert("❌ Failed to restore prompt: " + (err.message || "Unknown error"));
    }
  };

  // Template-based fallback
  const generateTemplatePrompt = (card, deckData) => {
    if (!card) return "";

    const deckStyle = deckData?.description || deckData?.category || "mystical";
    const cardName = card.name || `Card ${card.number || ""}`;

    return `Oracle card artwork: ${cardName}, ${deckStyle}, symbolic imagery, mystical energy, ethereal atmosphere, professional oracle card illustration`;
  };

  // Generic fallback
  const generateGenericPrompt = (card, deckData) => {
    const deckName = deckData?.name || "mystical deck";
    const cardNum = card?.number || "unknown";
    return `Oracle card from ${deckName}, card #${cardNum}, symbolic artwork, mystical illustration`;
  };

  // LLM-enhanced prompt generation
  const generateSmartPrompt = async (card, deckData) => {
    try {
      const cardName = card.name || `Card ${card.number || ""}`;
      const deckName = deckData?.name || "Oracle Deck";
      const deckDesc = deckData?.description || "";
      const meaning = card.overall_meaning || card.upright_meaning || "";

      const prompt = [
        `Generate a concise AI image prompt for this oracle card:`,
        ``,
        `Card Name: "${cardName}"`,
        `Deck: "${deckName}"`,
        deckDesc ? `Deck Description: "${deckDesc}"` : "",
        meaning ? `Card Meaning: "${meaning.substring(0, 200)}"` : "",
        ``,
        `Create a vivid, detailed image prompt (max 150 characters).`,
        `Focus on: visual mood, symbolic elements, colors, composition, atmosphere.`,
        `Do NOT include aspect ratio or technical terms.`,
        `Make it evocative and specific to this card's energy.`
      ].filter(Boolean).join("\n");

      const response = await queueApiCall(() => base44.integrations.Core.InvokeLLM({ prompt }));
      const generatedPrompt = response?.output || response || generateTemplatePrompt(card, deckData);

      return generatedPrompt.trim();
    } catch (e) {
      console.error("LLM prompt generation failed, using template:", e);
      return generateTemplatePrompt(card, deckData);
    }
  };

  // Auto-fill missing prompts for selected cards
  const handleAutoFillPrompts = async () => {
    setAutoFilling(true);
    setError("");

    try {
      // Get cards that need prompts
      const cardsNeedingPrompts = cards.filter(c =>
        selectedCards.includes(c.id) &&
        (!c.ai_image_prompt || !c.ai_image_prompt.trim()) && // Check both for current and legacy
        (!c.ai_prompt || !c.ai_prompt.trim())
      );

      if (cardsNeedingPrompts.length === 0) {
        setError("✅ All selected cards already have prompts!");
        setAutoFilling(false);
        return;
      }

      // Estimate cost (roughly 0.1 tokens per card for LLM generation)
      const estimatedCost = Math.ceil(cardsNeedingPrompts.length * 0.1);
      const currentBalance = user?.token_balance || 0;

      if (currentBalance < estimatedCost) {
        setError(`❌ Insufficient tokens. Need ~${estimatedCost} tokens for auto-fill, you have ${currentBalance}.`);
        setAutoFilling(false);
        return;
      }

      if (!confirm(`Generate smart prompts for ${cardsNeedingPrompts.length} cards?\n\nThis will cost approximately ${estimatedCost} tokens and take 2-3 seconds per card.\n\nYou can review and edit prompts before generating images.`)) {
        setAutoFilling(false);
        return;
      }

      setProgress({
        current: 0,
        total: cardsNeedingPrompts.length,
        message: "Generating smart prompts..."
      });

      let tokensUsed = 0;
      let successCount = 0;

      for (let i = 0; i < cardsNeedingPrompts.length; i++) {
        const card = cardsNeedingPrompts[i];

        setProgress({
          current: i + 1,
          total: cardsNeedingPrompts.length,
          message: `Generating prompt for "${card.name}" (${i + 1}/${cardsNeedingPrompts.length})`
        });

        try {
          const smartPrompt = await generateSmartPrompt(card, deck);

          // Save prompt to card
          await queueApiCall(() => CardEntity.update(card.id, {
            ai_image_prompt: smartPrompt
          }));

          // NEW: Add to history
          await addPromptToHistory(card.id, smartPrompt, "auto_fill");

          successCount++;
          tokensUsed += 0.1; // Rough estimate

          // Update local state
          setCards(prevCards => prevCards.map(c =>
            c.id === card.id ? { ...c, ai_image_prompt: smartPrompt } : c
          ));

          // Small delay to avoid rate limits
          if (i < cardsNeedingPrompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (err) {
          console.error(`Failed to generate prompt for card ${card.name}:`, err);
        }
      }

      // Deduct tokens
      const actualCost = Math.ceil(tokensUsed);
      if (actualCost > 0) {
        const newBalance = Math.max(0, currentBalance - actualCost);
        await queueApiCall(() => base44.auth.updateMe({
          token_balance: newBalance,
          lifetime_tokens_used: (user.lifetime_tokens_used || 0) + actualCost,
        }));
        setUser(prevUser => ({
          ...prevUser,
          token_balance: newBalance,
          lifetime_tokens_used: (prevUser.lifetime_tokens_used || 0) + actualCost,
        }));
      }

      setProgress({
        current: successCount,
        total: cardsNeedingPrompts.length,
        message: `✅ Generated ${successCount} smart prompts!`
      });

      // Recalculate stats
      const updatedCards = await CardEntity.filter({ deck_id: deckId });
      setCards(updatedCards);
      calculatePromptStats(updatedCards);

      setTimeout(() => {
        setProgress({ current: 0, total: 0, message: "" });
        setError(`✅ Successfully generated ${successCount} prompts! Review them below before generating images.`);
      }, 2000);

    } catch (err) {
      console.error("Auto-fill prompts failed:", err);
      setError("❌ Failed to auto-fill prompts: " + (err.message || "Unknown error"));
    } finally {
      setAutoFilling(false);
    }
  };

  // Get effective prompt for a card (implements 3-tier fallback)
  const getEffectivePrompt = (card) => {
    // FIXED: Check for ai_image_prompt (the correct field name from JSON)
    if (card.ai_image_prompt && card.ai_image_prompt.trim()) {
      return { prompt: card.ai_image_prompt, source: "explicit" };
    }

    // LEGACY: Also check old field name for backward compatibility
    if (card.ai_prompt && card.ai_prompt.trim()) {
      return { prompt: card.ai_prompt, source: "explicit" };
    }

    // Priority 2: Generate from card name
    if (card.name && card.name.trim()) {
      return {
        prompt: generateTemplatePrompt(card, deck),
        source: "from_name"
      };
    }

    // Priority 3: Generic fallback
    return {
      prompt: generateGenericPrompt(card, deck),
      source: "generic"
    };
  };

  const toggleCardForGeneration = (cardId) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  const toggleCardForStyleAnalysis = (cardId) => {
    setStyleReferenceCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else if (prev.length < 5) { // Limit to 5 cards for style analysis
        return [...prev, cardId];
      }
      return prev;
    });
  };

  const selectAllForGeneration = () => {
    const missing = cards.filter(c => !c.image_url || c.image_url.trim() === "").map(c => c.id);
    setSelectedCards(missing);
  };

  const selectAllCards = () => {
    const allIds = cards.map(c => c.id);
    setSelectedCards(allIds);
  };

  const clearAllForGeneration = () => {
    setSelectedCards([]);
  };

  const selectAllForStyle = () => {
    const withImages = cards.filter(c => c.image_url).slice(0, 5).map(c => c.id);
    setStyleReferenceCards(withImages);
  };

  const clearAllForStyle = () => {
    setStyleReferenceCards([]);
  };

  const analyzeStyle = async () => {
    if (styleReferenceCards.length < 3) {
      setStyleError("Please select at least 3 cards with images to analyze");
      return;
    }

    setAnalyzingStyle(true);
    setStyleError("");

    try {
      const { data } = await queueApiCall(() => base44.functions.invoke('extractDeckStyle', {
        card_ids: styleReferenceCards,
        deck_id: deckId
      }));

      console.log("[BulkAIImageGenerator] Style analysis response:", data);

      if (data.status === 'error') {
        // Check if it's an API key issue
        if (data.details?.includes('Vision API not configured') || data.error?.includes('Vision API')) {
          // Don't show as error - just hide the feature
          setStyleError("");
          alert("💡 Style Extractor is not available right now (Vision API not configured). No worries! You can still generate amazing images - the AI will focus on each card's name and meaning automatically. ✨");
          setShowStyleSelector(false);
        } else {
          setStyleError(data.error || "Failed to analyze deck style");
        }
      } else if (data.status === 'success' && data.style_profile) {
        setStyleProfile(data.style_profile);
        setStyleError("");
        setShowStyleSelector(false); // Close selector after successful analysis

        // Auto-fill batch prompt with style template
        if (data.style_profile.ai_prompt_suggestions?.full_prompt_template) {
          const template = data.style_profile.ai_prompt_suggestions.full_prompt_template.replace('[CARD CONCEPT]', '{name}');
          setBatchPrompt(template);
        }
      } else {
        setStyleError("Unexpected response from style analysis");
      }
    } catch (err) {
      console.error("Style analysis error:", err);
      const errorMsg = err.message || "Failed to analyze images";

      // Check if it's an API key issue
      if (errorMsg.includes('Vision API') || errorMsg.includes('not configured') || errorMsg.includes('GOOGLE_CLOUD_VISION_API_KEY')) {
        setStyleError("");
        alert("💡 Style Extractor is not available right now. No worries! You can still generate amazing images - just leave the template blank and the AI will automatically focus on each card's unique name and meaning. ✨");
        setShowStyleSelector(false);
      } else {
        setStyleError(errorMsg);
      }
    } finally {
      setAnalyzingStyle(false);
    }
  };

  // NEW: Open refinement modal
  const openRefinementModal = (cardId, result) => {
    const card = cards.find(c => c.id === cardId);
    setRefinementModal({ open: true, cardId, result, card });
    setEditedPrompt(result.fullPrompt || "");
  };

  // NEW: Close refinement modal
  const closeRefinementModal = () => {
    setRefinementModal({ open: false, cardId: null, result: null, card: null });
    setEditedPrompt("");
    setIsRefining(false);
    setError(""); // Clear error on modal close
  };

  // NEW: Open view prompt modal
  const openViewPromptModal = (card) => {
    setViewPromptModal({ open: true, card }); // Corrected state variable
  };

  // NEW: Close view prompt modal
  const closeViewPromptModal = () => {
    setViewPromptModal({ open: false, card: null }); // Corrected state variable
  };

  // NEW: Copy prompt to clipboard
  const copyPromptToClipboard = (prompt) => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      alert("✅ Prompt copied to clipboard!");
    }
  };

  // NEW: Regenerate with same prompt or edited prompt
  const regenerateImage = async (useEditedPrompt = false) => {
    const { cardId, card } = refinementModal;
    if (!card) return;

    setIsRefining(true);
    setError(""); // Clear any previous error

    // Re-fetch user data to get the latest token balance before starting
    const currentUser = await queueApiCall(() => base44.auth.me());
    setUser(currentUser); // Update user state with fresh data

    if ((currentUser?.token_balance || 0) < TOKEN_COSTS.BULK_IMAGE) {
      setError(`❌ Insufficient tokens. Need ${TOKEN_COSTS.BULK_IMAGE} tokens for regeneration, you have ${currentUser?.token_balance || 0}.`);
      setIsRefining(false);
      return;
    }

    try {
      const promptToUse = useEditedPrompt ? editedPrompt : refinementModal.result.fullPrompt;

      if (!promptToUse.trim()) {
        throw new Error("Prompt is empty. Please provide a prompt to regenerate.");
      }

      console.log(`🎨 Regenerating for "${card.name}" with prompt:`, promptToUse);

      const response = await queueApiCall(() => base44.integrations.Core.GenerateImage({ prompt: promptToUse }));

      let imageUrl = null;
      if (response?.data?.url) {
        imageUrl = response.data.url;
      } else if (response?.url) {
        imageUrl = response.url;
      } else if (response?.data?.image_url) {
        imageUrl = response.data.image_url;
      } else if (response?.data?.output?.url) {
        imageUrl = response.data.output.url;
      } else if (typeof response?.data === 'string' && response.data.startsWith('http')) {
        imageUrl = response.data;
      } else if (typeof response === 'string' && response.startsWith('http')) {
        imageUrl = response;
      }

      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
        console.error(`❌ No valid image URL found in response for "${card.name}". Response:`, response);
        throw new Error(`No valid image URL in response. Got: ${JSON.stringify(response?.data || response)}`);
      }

      console.log(`✅ Got new image URL for "${card.name}":`, imageUrl);

      await queueApiCall(() => CardEntity.update(card.id, {
        image_url: imageUrl,
        ai_image_prompt: promptToUse
      }));

      // NEW: Add to history for regeneration
      await addPromptToHistory(card.id, promptToUse, "regeneration", imageUrl, true);

      // Update local state (generatedImages and the card in `cards` array)
      setGeneratedImages(prev => ({
        ...prev,
        [cardId]: { url: imageUrl, success: true, promptUsed: promptToUse.substring(0, 100) + (promptToUse.length > 100 ? "..." : ""), fullPrompt: promptToUse }
      }));

      // Update the cards array directly as well so the preview in the modal is correct on subsequent openings
      setCards(prevCards => prevCards.map(c =>
          c.id === cardId ? { ...c, image_url: imageUrl, ai_image_prompt: promptToUse } : c
      ));

      // Deduct tokens
      const newBalance = (currentUser.token_balance || 0) - TOKEN_COSTS.BULK_IMAGE;
      setUser(prevUser => ({
        ...prevUser,
        token_balance: newBalance,
        lifetime_tokens_used: (prevUser.lifetime_tokens_used || 0) + TOKEN_COSTS.BULK_IMAGE,
      }));
      await queueApiCall(() => base44.auth.updateMe({
        token_balance: newBalance,
        lifetime_tokens_used: (currentUser.lifetime_tokens_used || 0) + TOKEN_COSTS.BULK_IMAGE,
      }));

      alert("✅ Image regenerated successfully!");
      closeRefinementModal();
    } catch (err) {
      console.error("Failed to regenerate:", err);
      setError("❌ Failed to regenerate: " + (err.message || "Unknown error"));

      // NEW: Add failed attempt to history for regeneration
      await addPromptToHistory(card.id, useEditedPrompt ? editedPrompt : refinementModal.result.fullPrompt, "regeneration", null, false);

    } finally {
      setIsRefining(false);
    }
  };

  const generateBatch = async () => {
    if (selectedCards.length === 0) {
      setError("Please select cards to generate images for");
      return;
    }

    // Re-fetch user data to get the latest token balance before starting
    const currentUser = await queueApiCall(() => base44.auth.me());
    setUser(currentUser); // Update user state with fresh data

    const tokenCost = selectedCards.length * TOKEN_COSTS.BULK_IMAGE;
    const userBalance = currentUser?.token_balance || 0;

    if (userBalance < tokenCost) {
      setError(`❌ Insufficient tokens. Need ${tokenCost} tokens, you have ${userBalance}.`);
      return;
    }

    setGenerating(true);
    setError(""); // Clear general errors
    setProgress({ current: 0, total: selectedCards.length, message: "Starting image generation..." });
    setGeneratedImages({}); // Clear previous results
    setConsecutiveNetworkErrors(0);

    const results = {};
    let tokensUsedInBatch = 0;
    let networkErrorCount = 0;

    for (let i = 0; i < selectedCards.length; i++) {
      const cardId = selectedCards[i];
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        console.warn(`Card with ID ${cardId} not found, skipping.`);
        results[cardId] = { error: "Card not found", success: false };
        continue;
      }

      setProgress({
        current: i + 1,
        total: selectedCards.length,
        message: `Generating image for "${card.name}" (${i + 1}/${selectedCards.length})...`
      });

      let styleDNA = "";
      try {
        // Use 3-tier fallback system to get a base prompt
        const { prompt: defaultFallbackPrompt, source: fallbackSource } = getEffectivePrompt(card);

        // ENHANCED: Build style DNA prefix with SUPER-STRENGTH emphasis when Style Lock is ON
        if (styleProfile?.ai_prompt_suggestions) {
          const suggestions = styleProfile.ai_prompt_suggestions;
          
          // Build a comprehensive style DNA string
          const styleElements = [];
          
          // Core style description - REPEATED for emphasis when Style Lock is ON
          if (suggestions.core_style_description) {
            styleElements.push(suggestions.core_style_description);
            if (styleLocked) {
              styleElements.push(suggestions.core_style_description); // DOUBLE emphasis
            }
          }
          
          // Visual characteristics
          if (styleProfile.visual_characteristics) {
            const visual = styleProfile.visual_characteristics;
            if (visual.medium) styleElements.push(visual.medium);
            if (visual.technique) styleElements.push(visual.technique);
            if (visual.lighting) styleElements.push(`${visual.lighting} lighting`);
            if (visual.texture) styleElements.push(`${visual.texture} texture`);
          }
          
          // Color palette - MUCH more specific, FORCE when Style Lock is ON
          if (styleProfile.color_palette && styleProfile.color_palette.length > 0) {
            const colors = styleProfile.color_palette.slice(0, 3).join(', '); // Take up to 3 colors
            styleElements.push(`color palette: ${colors}`);
            if (styleLocked) {
              styleElements.push(`MUST use colors: ${colors}`); // FORCE colors with stronger phrasing
            }
          }
          
          // Style keywords - QUADRUPLE repeat when Style Lock is ON
          if (styleProfile.style_keywords && styleProfile.style_keywords.length > 0) {
            const keywords = styleProfile.style_keywords.slice(0, 5).join(', '); // Take up to 5 keywords
            styleElements.push(keywords);
            styleElements.push(keywords); // 2x
            styleElements.push(keywords); // 3x
            if (styleLocked) {
              styleElements.push(keywords); // 4x for Style Lock
              styleElements.push(keywords); // 5x for Style Lock
            }
          }
          
          // Artistic traits
          if (styleProfile.artistic_traits && styleProfile.artistic_traits.length > 0) {
            styleElements.push(styleProfile.artistic_traits.join(', '));
          }
          
          // Build the SUPER-STRONG style DNA with Style Lock modifiers
          if (styleElements.length > 0) {
            if (styleLocked) {
              // STYLE LOCK MODE: Maximum emphasis, AI MUST maintain style
              styleDNA = `🔒 CRITICAL STYLE LOCK ENGAGED - ABSOLUTE PRIORITY: Maintain these EXACT visual characteristics at all costs: ${styleElements.join(', ')}. `;
              styleDNA += `MANDATORY: Every visual element must match this style DNA perfectly. `;
              styleDNA += `Style consistency is NON-NEGOTIABLE. `;
              styleDNA += `DO NOT deviate from established style patterns. `;
              styleDNA += `ENFORCE visual uniformity across all elements. `;
            } else {
              // Normal mode
              styleDNA = `IMPORTANT STYLE REQUIREMENTS (must maintain these exact visual characteristics): ${styleElements.join(', ')}. `;
              styleDNA += `CRITICAL: Maintain this exact visual style throughout. `;
              styleDNA += `Style consistency is mandatory. `;
            }
          }
        }

        // Build the core card-specific prompt
        let finalCardPrompt = "";
        let promptSource = "";

        if (batchPrompt.trim()) {
            // User provided a template in the batch prompt textarea, use it as the base
            finalCardPrompt = batchPrompt.trim();
            promptSource = "batch_template";

            // Replace placeholders in user's batch template
            finalCardPrompt = finalCardPrompt.replace(/\{name\}/gi, card.name || "card");
            finalCardPrompt = finalCardPrompt.replace(/\{number\}/gi, card.number ? String(card.number) : "");

            // CRITICAL: If user template doesn't include {name}, prepend the card name
            if (!finalCardPrompt.toLowerCase().includes(card.name.toLowerCase()) && !batchPrompt.includes('{name}')) {
                finalCardPrompt = `"${card.name}" - ${finalCardPrompt}`;
            }
        } else {
            // No batch prompt template provided, use the 3-tier fallback prompt
            finalCardPrompt = defaultFallbackPrompt;
            promptSource = fallbackSource; // e.g., "explicit", "from_name", "generic"
        }

        // ENHANCED: Build final prompt with style DNA at BOTH beginning and end for maximum emphasis
        let compositePrompt = "";
        
        // Start with style DNA (if available)
        if (styleDNA) {
          compositePrompt = styleDNA;
        }
        
        // Add the card-specific content
        compositePrompt += finalCardPrompt;
        
        // Add aspect ratio guidance
        const aspectRatioHints = {
          "1:1": "square format, balanced composition",
          "2:3": "portrait format, vertical composition, tarot card proportions",
          "9:16": "tall portrait format, vertical design",
          "3:4": "portrait format, oracle card proportions"
        };

        if (aspectRatioHints[aspectRatio]) {
          compositePrompt += `, ${aspectRatioHints[aspectRatio]}`;
        }

        // CRITICAL: Add card name for subject focus
        compositePrompt += `. Subject: "${card.name}"`;
        
        // ENHANCED: Repeat style DNA at the END for reinforcement - TRIPLE reinforce when Style Lock is ON
        if (styleDNA && styleProfile?.style_keywords && styleProfile.style_keywords.length > 0) {
          const keywords = styleProfile.style_keywords.slice(0, 5).join(', '); // Re-use up to 5 keywords
          
          if (styleLocked) {
            // STYLE LOCK: Maximum reinforcement at end
            compositePrompt += `. 🔒 STYLE LOCK: ${keywords}. `;
            compositePrompt += `MANDATORY STYLE ENFORCEMENT: ${keywords}. `;
            compositePrompt += `Style consistency is ABSOLUTE REQUIREMENT. `;
          } else {
            // Normal mode
            compositePrompt += `. MAINTAIN STYLE: ${keywords}. Style consistency is critical.`;
          }
        }

        console.log(`🎨 Starting generation for "${card.name}" (Source: ${promptSource}, Style Lock: ${styleLocked ? 'ON 🔒' : 'OFF'})`);
        if (styleLocked) {
          console.log(`🔒 STYLE LOCK ACTIVE - Maximum style enforcement enabled`);
        }
        console.log(`📐 Final prompt length: ${compositePrompt.length} chars`);
        if (styleDNA) {
          console.log(`🎨 Style DNA applied: YES`);
        }

        // IMPROVED: Wrap in retry logic with EXTENDED timeout for image generation
        const response = await retryImageGeneration(async () => {
          return await queueApiCall(() =>
            base44.integrations.Core.GenerateImage({ prompt: compositePrompt }),
            3, // retries inside queue
            5000, // INCREASED: 5s base delay (was 3s)
            60000 // INCREASED: 60 second timeout per attempt (was 15s)
          );
        }, card.name, 3); // 3 attempts at the outer level

        let imageUrl = null;
        if (response?.data?.url) {
          imageUrl = response.data.url;
        } else if (response?.url) {
          imageUrl = response.url;
        } else if (response?.data?.image_url) {
          imageUrl = response.data.image_url;
        } else if (response?.data?.output?.url) {
          imageUrl = response.data.output.url;
        } else if (typeof response?.data === 'string' && response.data.startsWith('http')) {
          imageUrl = response.data;
        } else if (typeof response === 'string' && response.startsWith('http')) {
          imageUrl = response;
        }

        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
          console.error(`❌ No valid image URL found in response for "${card.name}". Response:`, response);
          throw new Error(`No valid image URL in response. Got: ${JSON.stringify(response?.data || response)}`);
        }

        console.log(`✅ Got image URL for "${card.name}":`, imageUrl);

        await queueApiCall(() => CardEntity.update(card.id, {
          image_url: imageUrl,
          ai_image_prompt: compositePrompt // Save the *actual* prompt used for this card
        }));

        // NEW: Add successful generation to history
        await addPromptToHistory(card.id, compositePrompt, "bulk_generator", imageUrl, true);

        results[card.id] = { url: imageUrl, success: true, promptUsed: compositePrompt.substring(0, 100) + (compositePrompt.length > 100 ? "..." : ""), fullPrompt: compositePrompt };
        tokensUsedInBatch += TOKEN_COSTS.BULK_IMAGE;

        // Update user's token balance locally immediately and also on server
        const newBalance = (currentUser.token_balance || 0) - TOKEN_COSTS.BULK_IMAGE;
        setUser(prevUser => ({
          ...prevUser,
          token_balance: newBalance,
          lifetime_tokens_used: (prevUser.lifetime_tokens_used || 0) + TOKEN_COSTS.BULK_IMAGE,
        }));
        await queueApiCall(() => base44.auth.updateMe({
          token_balance: newBalance,
          lifetime_tokens_used: (currentUser.lifetime_tokens_used || 0) + TOKEN_COSTS.BULK_IMAGE,
        }));

        // Reset consecutive error counter on success
        networkErrorCount = 0;
        setConsecutiveNetworkErrors(0);

      } catch (err) {
        console.error(`❌ Failed to generate for ${card.name}:`, err);

        const isNetErr = isNetworkError(err);
        const isTimeout = err.message?.toLowerCase().includes('timeout') ||
                         err.message?.toLowerCase().includes('timed out');

        // IMPROVED: Better error messages
        let errorMsg;
        // Check if the error is one of the specific ones from retryImageGeneration
        if (err.message.includes('Image generation credits needed') || 
            err.message.includes('Rate limit reached') || 
            err.message.includes('Image service temporarily unavailable')) {
          errorMsg = err.message;
        } else if (isTimeout) {
          errorMsg = "Service timeout - AI service overloaded. Wait 30s and retry this card.";
        } else if (isNetErr) {
          errorMsg = "Network error - check your connection and try again";
        } else {
          errorMsg = err.message || "Unknown error";
        }

        results[card.id] = { error: errorMsg, success: false };

        // NEW: Add failed attempt to history
        // Attempt to reconstruct the prompt that was intended to be used for logging
        let attemptedPrompt = "";
        if (batchPrompt.trim()) {
            attemptedPrompt = batchPrompt.trim()
                .replace(/\{name\}/gi, card.name || "card")
                .replace(/\{number\}/gi, card.number ? String(card.number) : "");
            if (!attemptedPrompt.toLowerCase().includes(card.name.toLowerCase()) && !batchPrompt.includes('{name}')) {
                attemptedPrompt = `"${card.name}" - ${attemptedPrompt}`;
            }
        } else {
            attemptedPrompt = getEffectivePrompt(card).prompt;
        }

        // Add style and aspect ratio hints if they were supposed to be applied
        if (styleDNA) {
            attemptedPrompt = `${styleDNA}${attemptedPrompt}`;
        }
        const aspectRatioHints = {
            "1:1": "square format, balanced composition",
            "2:3": "portrait format, vertical composition, tarot card proportions",
            "9:16": "tall portrait format, vertical design",
            "3:4": "portrait format, oracle card proportions"
        };
        if (aspectRatioHints[aspectRatio]) {
            attemptedPrompt += `, ${aspectRatioHints[aspectRatio]}`;
        }
        attemptedPrompt += `. Subject: "${card.name}"`;
        if (styleDNA && styleProfile?.style_keywords && styleProfile.style_keywords.length > 0) {
            const keywords = styleProfile.style_keywords.slice(0, 5).join(', ');
            if (styleLocked) { // Reflect style lock logic in history if it was active
                attemptedPrompt += `. 🔒 STYLE LOCK: ${keywords}. MANDATORY STYLE ENFORCEMENT: ${keywords}. Style consistency is ABSOLUTE REQUIREMENT. `;
            } else {
                attemptedPrompt += `. MAINTAIN STYLE: ${keywords}. Style consistency is critical.`;
            }
        }

        await addPromptToHistory(card.id, attemptedPrompt, "bulk_generator", null, false);

        // Only count network-related errors for consecutive error tracking
        if (isNetErr || isTimeout) {
          networkErrorCount++;
          setConsecutiveNetworkErrors(networkErrorCount);

          // Stop generation after 3 consecutive network errors
          if (networkErrorCount >= 3) {
            setError(`⚠️ Multiple consecutive errors detected (${networkErrorCount}). The AI service may be overloaded. Please wait 1-2 minutes and try again.`);
            break;
          }
        } else {
          // Reset if it's not a network/timeout error (e.g., specific credit error, bad prompt error)
          networkErrorCount = 0;
          setConsecutiveNetworkErrors(0);
        }
      }

      // INCREASED: Longer delay between cards (8 seconds instead of 5)
      if (i < selectedCards.length - 1) {
        console.log(`⏳ Waiting 8 seconds before next card to avoid overload...`);
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    setGeneratedImages(results);
    setGenerating(false);

    const successCount = Object.values(results).filter(r => r.success).length;
    const failCount = Object.values(results).filter(r => !r.success).length;

    setProgress({
      current: selectedCards.length,
      total: selectedCards.length,
      message: `Complete! ${successCount} succeeded, ${failCount} failed.`
    });

    if (successCount > 0) {
      setError(`✅ Generated ${successCount} images successfully!${failCount > 0 ? ` ${failCount} failed - click to retry.` : ''}`);
    } else if (failCount > 0) {
      setError(`❌ All generations failed. Please check your internet connection and try again.`);
    }

    await loadCards();

    if (onDone) onDone();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-xl font-bold text-purple-200 mb-2 flex items-center gap-2">
          <Wand2 className="w-6 h-6" />
          Bulk AI Image Generator
        </h3>
        <p className="text-sm text-purple-300">
          Generate images for multiple cards at once. Select cards and provide a template prompt.
        </p>

        {/* Token Cost Preview */}
        {selectedCards.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
            Estimated cost for {selectedCards.length} cards: <TokenCostPreview action="bulk_image" quantity={selectedCards.length} />
            <span className="ml-2">Your balance: {user?.token_balance || 0} tokens</span>
          </div>
        )}
      </div>

      {error && (
        <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2 text-sm ${error.startsWith('✅') ? 'bg-green-900/20 border-green-500/30 text-green-200' : 'text-red-200'}`}>
          {error.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
          <p>{error}</p>
        </div>
      )}

      {/* NEW: Prompt Status Dashboard */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <Label className="text-white text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Prompt Status
            </Label>
            <p className="text-xs text-white/60 mt-1">
              3-tier fallback system: JSON prompts → LLM-generated → Generic
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white">{promptStats.hasPrompt}</span>
            </div>
            <div className="text-xs text-emerald-200">Cards with explicit prompts</div>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white">{promptStats.fromName}</span>
            </div>
            <div className="text-xs text-amber-200">Will use LLM-generated prompt (can auto-fill)</div>
          </div>

          <div className="bg-gray-700/20 border border-gray-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircleIcon className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-white">{promptStats.generic}</span>
            </div>
            <div className="text-xs text-gray-300">Will use generic fallback</div>
          </div>
        </div>

        {promptStats.fromName > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-200">
                  {promptStats.fromName} cards can have smart prompts auto-generated
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Uses AI to create high-quality prompts from card names and meanings. Costs ~{Math.ceil(promptStats.fromName * 0.1)} tokens.
                </p>
              </div>
            </div>
            <Button
              onClick={handleAutoFillPrompts}
              disabled={autoFilling || !user || (user.token_balance || 0) < Math.ceil(promptStats.fromName * 0.1)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {autoFilling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Smart Prompts...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto-Fill {promptStats.fromName} Missing Prompts (~{Math.ceil(promptStats.fromName * 0.1)} tokens)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Style Analysis Section - ENHANCED with Style Lock */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Label className="text-white text-lg font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Style Analysis & Lock
            </Label>
            <p className="text-xs text-white/60 mt-1">
              Optional: Extract style DNA from existing cards for uniformity
            </p>
          </div>
          {cards.filter(c => c.image_url).length >= 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStyleSelector(!showStyleSelector)}
              className="border-purple-400/40 text-purple-300 hover:bg-purple-500/10"
            >
              {showStyleSelector ? "Hide" : "Select Cards"}
            </Button>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200">
            <p><strong>Style extraction is optional!</strong> If you skip this step, the AI will automatically create beautiful images by focusing on each card's unique name and meaning. Use style extraction only if you want to match an existing deck's visual style.</p>
          </div>
        </div>

        {/* Style Card Selection Grid - Collapsible */}
        {showStyleSelector && cards.filter(c => c.image_url).length >= 3 && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-white">
                Select Style Reference Cards ({styleReferenceCards.length}/5)
              </h5>
              <div className="flex gap-2">
                {styleReferenceCards.length >= 3 && (
                  <Badge className="bg-emerald-600">Ready!</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllForStyle}
                  disabled={analyzingStyle}
                  className="border-purple-400/40 text-purple-300 hover:bg-purple-500/10 text-xs"
                >
                  Select 5
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllForStyle}
                  disabled={analyzingStyle}
                  className="border-purple-400/40 text-purple-300 hover:bg-purple-500/10 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div >

            <ScrollArea className="h-[300px] border border-white/10 rounded-lg p-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {cards.filter(c => c.image_url).map((card) => {
                  const isSelected = styleReferenceCards.includes(card.id);
                  const isMaxed = styleReferenceCards.length >= 5 && !isSelected;

                  return (
                    <div
                      key={card.id}
                      onClick={() => !isMaxed && !analyzingStyle && toggleCardForStyleAnalysis(card.id)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-purple-400 shadow-lg shadow-purple-500/50 ring-2 ring-purple-400/50'
                          : isMaxed
                            ? 'border-white/10 opacity-40 cursor-not-allowed'
                            : 'border-white/20 hover:border-purple-300/60 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      {isSelected && (
                        <>
                          <div className="absolute top-1 right-1 bg-purple-600 rounded-full p-1 shadow-lg">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute top-1 left-1 bg-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                            {styleReferenceCards.indexOf(card.id) + 1}
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                        <p className="text-[10px] text-white font-semibold truncate">{card.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {styleReferenceCards.length < 3 && styleReferenceCards.length > 0 && (
              <p className="text-xs text-amber-300">
                ⚠️ Select at least 3 cards to analyze (currently {styleReferenceCards.length}/3)
              </p>
            )}

            {/* Analyze Button - Only shown when selector is open */}
            <Button
              onClick={analyzeStyle}
              disabled={analyzingStyle || styleReferenceCards.length < 3}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzingStyle ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing {styleReferenceCards.length} Cards...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Analyze Deck Style ({styleReferenceCards.length} cards selected)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display - Only if not API key issue */}
        {styleError && (
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{styleError}</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {styleProfile ? (
          <div className="space-y-3">
            <div className="bg-emerald-900/20 border border-emerald-500/40 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-300">Style Profile Extracted!</p>
                  <p className="text-xs text-emerald-200 mt-1">
                    Analyzed {styleProfile.reference_card_count} cards. Style DNA ready.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStyleProfile(null);
                    setStyleLocked(false); // Reset style lock when re-analyzing
                    setShowStyleSelector(true);
                  }}
                  className="text-emerald-300 hover:text-emerald-200 text-xs"
                >
                  Re-analyze
                </Button>
              </div>

              {styleProfile.color_palette?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {styleProfile.color_palette.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded border border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {styleProfile.style_keywords?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {styleProfile.style_keywords.slice(0, 8).map((keyword, idx) => (
                    <Badge key={idx} className="bg-emerald-600/40 border-emerald-400/40 text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* NEW: Style Lock Toggle */}
            <div className={`rounded-lg p-4 border-2 transition-all ${
              styleLocked 
                ? 'bg-amber-900/30 border-amber-500/50' 
                : 'bg-blue-900/20 border-blue-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {styleLocked ? (
                  <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Unlock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label className={`font-bold ${styleLocked ? 'text-amber-300' : 'text-blue-300'}`}>
                      🔒 Style Lock
                    </Label>
                    <Switch
                      checked={styleLocked}
                      onCheckedChange={setStyleLocked}
                      disabled={generating}
                    />
                  </div>
                  {styleLocked ? (
                    <p className="text-xs text-amber-200">
                      <strong>LOCKED:</strong> Maximum style enforcement enabled. AI will prioritize visual consistency over card-specific content. Perfect for uniform oracle decks with cohesive aesthetics.
                    </p>
                  ) : (
                    <p className="text-xs text-blue-200">
                      <strong>UNLOCKED:</strong> Style DNA will guide generation, but AI can interpret each card uniquely. Best for varied content while maintaining general style harmony.
                    </p>
                  )}
                </div>
              </div>

              {styleLocked && (
                <div className="mt-3 bg-amber-950/40 rounded-lg p-3 border border-amber-500/20">
                  <p className="text-xs text-amber-100 flex items-center gap-2">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Style Lock enforces 5x keyword repetition + mandatory color compliance for maximum uniformity
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Skip Button - Always visible */}
        {!styleProfile && (
          <div className="text-center">
            <Button
              onClick={() => setShowStyleSelector(false)}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white/80 text-xs"
            >
              Skip style analysis → Generate with card names only
            </Button>
          </div>
        )}
      </div>

      {/* Aspect Ratio Selection */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 space-y-4">
        <Label className="text-white">Image Aspect Ratio</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-white text-center">
          <button
            onClick={() => setAspectRatio("1:1")}
            className={`p-3 rounded-lg border-2 transition-all ${
              aspectRatio === "1:1"
                ? "border-purple-500 bg-purple-500/20"
                : "border-white/20 bg-black/20 hover:border-white/40"
            }`}
            disabled={generating}
          >
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
            <div className="text-xs mt-2 font-semibold">Square</div>
            <div className="text-xs text-white/60">1:1</div>
          </button>
          <button
            onClick={() => setAspectRatio("2:3")}
            className={`p-3 rounded-lg border-2 transition-all ${
              aspectRatio === "2:3"
                ? "border-purple-500 bg-purple-500/20"
                : "border-white/20 bg-black/20 hover:border-white/40"
            }`}
            disabled={generating}
          >
            <div className="w-8 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
            <div className="text-xs mt-2 font-semibold">Tarot</div>
            <div className="text-xs text-white/60">2:3 (recommended)</div>
          </button>
          <button
            onClick={() => setAspectRatio("9:16")}
            className={`p-3 rounded-lg border-2 transition-all ${
              aspectRatio === "9:16"
                ? "border-purple-500 bg-purple-500/20"
                : "border-white/20 bg-black/20 hover:border-white/40"
            }`}
            disabled={generating}
          >
            <div className="w-7 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
            <div className="text-xs mt-2 font-semibold">Portrait</div>
            <div className="text-xs text-white/60">9:16</div>
          </button>
          <button
            onClick={() => setAspectRatio("3:4")}
            className={`p-3 rounded-lg border-2 transition-all ${
              aspectRatio === "3:4"
                ? "border-purple-500 bg-purple-500/20"
                : "border-white/20 bg-black/20 hover:border-white/40"
            }`}
            disabled={generating}
          >
            <div className="w-9 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
            <div className="text-xs mt-2 font-semibold">Oracle</div>
            <div className="text-xs text-white/60">3:4</div>
          </button>
        </div>
      </div>

      {/* Batch Prompt Template */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 space-y-4">
        <Label className="text-white">Template Prompt (optional - leave blank for smart auto-generation)</Label>
        <Textarea
          value={batchPrompt}
          onChange={(e) => setBatchPrompt(e.target.value)}
          placeholder="e.g., A mystical tarot card depicting {name}, ethereal glow, detailed symbolism, professional oracle card illustration"
          className="bg-slate-900/50 border-purple-700/30 text-white min-h-[100px]"
          disabled={generating}
        />
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-blue-200 mb-2">
            💡 <strong>Placeholders:</strong> Use <code className="bg-white/10 p-0.5 rounded text-xs text-white">{"{name}"}</code> for card name, <code className="bg-white/10 p-0.5 rounded text-xs text-white">{"{number}"}</code> for card number.
          </p>
          <p className="text-xs text-blue-200">
            ✨ <strong>Leave blank</strong> for smart auto-generation that emphasizes each card's unique title and meaning!
          </p>
        </div>

        {/* Enhanced Example Prompts */}
        <div className="space-y-2">
          <p className="text-xs text-white/70 font-semibold">Quick Start Templates:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchPrompt('Mystical oracle card titled "{name}", professional tarot illustration, symbolic imagery representing the card\'s meaning, ethereal atmosphere, detailed and artistic')}
              className="text-xs text-left justify-start h-auto py-2"
              disabled={generating}
            >
              <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>Mystical Oracle Style</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchPrompt('Modern minimalist oracle card for "{name}", clean design, symbolic illustration, soft colors, professional digital art, elegant composition')}
              className="text-xs text-left justify-start h-auto py-2"
              disabled={generating}
            >
              <Palette className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>Modern Minimalist</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchPrompt('Vintage tarot card depicting "{name}", art nouveau style, ornate borders, rich jewel tones, gold accents, classical illustration')}
              className="text-xs text-left justify-start h-auto py-2"
              disabled={generating}
            >
              <Wand2 className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>Vintage Art Nouveau</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchPrompt('Photorealistic scene representing "{name}", cinematic lighting, detailed composition, symbolic elements, professional photography style')}
              className="text-xs text-left justify-start h-auto py-2"
              disabled={generating}
            >
              <ImageIcon className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>Photorealistic</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchPrompt('"{name}" - watercolor illustration, soft flowing colors, dreamy atmosphere, hand-painted oracle card art, delicate details')}
              className="text-xs text-left justify-start h-auto py-2"
              disabled={generating}
            >
              <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>Watercolor Dreams</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchPrompt('')}
              className="text-xs text-left justify-start h-auto py-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              disabled={generating}
            >
              <CheckCircle2 className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>Clear (Use Auto-Generation)</span>
            </Button>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
          <p className="text-xs text-amber-200 font-semibold mb-2">🎨 Pro Tips for Better Results:</p>
          <ul className="text-xs text-amber-200 space-y-1 list-disc list-inside">
            <li>Always include <code className="bg-white/10 px-1 rounded">{"{name}"}</code> placeholder to ensure card name is in the prompt</li>
            <li>If images seem random, try leaving the template blank for auto-generation</li>
            <li>Use descriptive style keywords: "ethereal", "detailed", "symbolic", "professional"</li>
            <li>Specify art style: "watercolor", "digital art", "illustration", "photorealistic"</li>
            <li>For consistency, use the Style Extractor first to analyze your existing cards</li>
          </ul>
        </div>
      </div>

      {/* Card Selection Grid for Generation */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white">Select Cards for Image Generation ({selectedCards.length} / {cards.length})</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAllForGeneration} disabled={generating}>
              Select Missing
            </Button>
            <Button variant="outline" size="sm" onClick={selectAllCards} disabled={generating} className="bg-purple-600/20 border-purple-400/40 text-purple-200 hover:bg-purple-600/30">
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllForGeneration} disabled={generating}>
              Deselect All
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map(card => (
              <div
                key={card.id}
                className={`relative p-2 border rounded-lg transition-all duration-200
                  ${selectedCards.includes(card.id)
                    ? "border-purple-500 bg-purple-900/20"
                    : "border-slate-700 bg-slate-900/20 hover:border-slate-500"
                  }
                `}
              >
                {/* Card Image - clickable to select */}
                <div
                  className="cursor-pointer"
                  onClick={() => !generating && toggleCardForGeneration(card.id)}
                >
                  {card.image_url && (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  {!card.image_url && (
                    <div className="w-full h-32 bg-slate-700/50 flex items-center justify-center rounded-md mb-2 text-sm text-slate-400">
                      No Image
                    </div>
                  )}
                  <div className="text-sm font-semibold text-white truncate">{card.name}</div>
                  {selectedCards.includes(card.id) && (
                    <CheckCircle2 className="absolute top-3 right-3 text-purple-400 w-5 h-5" />
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex gap-1 mt-2">
                  {/* View Prompt Button - FIXED: Check both field names */}
                  {(card.ai_image_prompt || card.ai_prompt) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewPromptModal(card);
                      }}
                      className="flex-1 h-7 text-xs text-blue-300 hover:bg-blue-500/10 border border-blue-500/30"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Prompt
                    </Button>
                  )}

                  {/* NEW: History Button - always show, but indicate if empty */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openHistoryModal(card);
                    }}
                    className={`flex-1 h-7 text-xs hover:bg-amber-500/10 border ${
                      card.ai_prompt_history && card.ai_prompt_history.length > 0
                        ? "text-amber-300 border-amber-500/30"
                        : "text-white/40 border-white/10"
                    }`}
                    title={
                      card.ai_prompt_history && card.ai_prompt_history.length > 0
                        ? `View ${card.ai_prompt_history.length} prompt versions`
                        : "No history yet"
                    }
                  >
                    <History className="w-3 h-3 mr-1" />
                    {card.ai_prompt_history && card.ai_prompt_history.length > 0
                      ? card.ai_prompt_history.length
                      : "0"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Generate Button */}
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
        {consecutiveNetworkErrors > 0 && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold">Network Issues Detected</p>
              <p>Experiencing {consecutiveNetworkErrors} consecutive network error(s). Generation will stop after 3 consecutive failures.</p>
            </div>
          </div>
        )}

        <Button
          onClick={generateBatch}
          disabled={generating || selectedCards.length === 0 || (user?.token_balance || 0) < (selectedCards.length * TOKEN_COSTS.BULK_IMAGE)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Generating... {progress.current}/{progress.total}
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-3" />
              Generate Images for {selectedCards.length} Card(s)
            </>
          )}
        </Button>
        {(user && (user.token_balance || 0) < (selectedCards.length * TOKEN_COSTS.BULK_IMAGE)) && (
          <p className="text-sm text-red-400 text-center mt-2">
            Insufficient tokens to generate all selected images ({selectedCards.length * TOKEN_COSTS.BULK_IMAGE} needed). Please purchase more tokens.
          </p>
        )}

        {/* Generation Tips */}
        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-blue-200 font-semibold mb-2">💡 Generation Tips:</p>
          <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
            <li>Each card takes ~10-15 seconds (includes 3 automatic retries per card)</li>
            <li>Don't close this page during generation</li>
            <li><strong>If you see timeout errors:</strong> The AI service is overloaded. Wait 30-60 seconds, then retry failed cards individually.</li>
            <li>Generation stops after 3 consecutive failures to prevent further errors</li>
            <li>Failed cards can be regenerated individually afterward</li>
          </ul>
        </div>
      </div>

      {/* Generation Progress and Results - UPDATED WITH CLICK HANDLER */}
      {(generating || Object.keys(generatedImages).length > 0) && (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-6">
          <h4 className="text-lg font-bold text-white mb-4">Generation Status & Results</h4>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm text-white">
              <span>{progress.message}</span>
              <span>{progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%"}</span>
            </div>
            <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} className="h-2" />
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {Object.keys(generatedImages).map(cardId => {
                const result = generatedImages[cardId];
                const card = cards.find(c => c.id === cardId);
                if (!card) return null;

                return (
                  <div
                    key={cardId}
                    onClick={() => result.success && openRefinementModal(cardId, result)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      result.success
                        ? "bg-green-900/20 border-green-500/30 hover:bg-green-900/30 hover:border-green-500/50"
                        : "bg-red-900/20 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1">
                        <p className="font-semibold text-white">{card.name}</p>
                        {result.success ? (
                          <>
                            <p className="text-xs text-gray-400 mt-1">
                              Prompt: {result.promptUsed}
                            </p>
                            <p className="text-xs text-green-300 mt-1 flex items-center gap-1">
                              <Wand2 className="w-3 h-3" />
                              Click to refine, regenerate, or create variations
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-red-300 mt-1">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* NEW: View Prompt Modal - FIXED: Display both field names */}
      <Dialog open={viewPromptModal.open} onOpenChange={closeViewPromptModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              AI Prompt: {viewPromptModal.card?.name}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              The prompt used to generate this card's image
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {viewPromptModal.card?.image_url && (
              <div className="flex justify-center">
                <img
                  src={viewPromptModal.card.image_url}
                  alt={viewPromptModal.card.name}
                  className="max-w-xs rounded-lg border border-purple-500/30"
                />
              </div>
            )}

            {/* Prompt Display - FIXED: Show correct field */}
            <div>
              <Label className="text-white text-sm mb-2 block">Full Prompt:</Label>
              <div className="bg-slate-800 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200 font-mono max-h-64 overflow-y-auto">
                {viewPromptModal.card?.ai_image_prompt || viewPromptModal.card?.ai_prompt || "No prompt saved for this card."}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between">
              <p className="text-xs text-blue-200">
                💡 Copy this prompt to reuse it for other cards or make variations
              </p>
              <Button
                size="sm"
                onClick={() => copyPromptToClipboard(viewPromptModal.card?.ai_image_prompt || viewPromptModal.card?.ai_prompt)}
                disabled={!(viewPromptModal.card?.ai_image_prompt || viewPromptModal.card?.ai_prompt)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeViewPromptModal}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Refinement Modal */}
      <Dialog open={refinementModal.open} onOpenChange={closeRefinementModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" />
              Refine Image: {refinementModal.card?.name}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Regenerate, edit prompt, or create variations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {refinementModal.result?.url && (
              <div className="flex justify-center">
                <img
                  src={refinementModal.result.url}
                  alt={refinementModal.card?.name}
                  className="max-w-xs rounded-lg border border-purple-500/30"
                />
              </div>
            )}

            {/* Prompt Editor */}
            <div>
              <Label className="text-white text-sm mb-2 block">Edit Prompt (optional)</Label>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white min-h-[100px]"
                placeholder="Edit the prompt to adjust the image..."
                disabled={isRefining}
              />
            </div>

            {/* Token Cost Warning */}
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <p className="text-xs text-amber-200">
                Each regeneration costs {TOKEN_COSTS.BULK_IMAGE} tokens. Your balance: {user?.token_balance || 0}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeRefinementModal}
              disabled={isRefining}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>

            <Button
              onClick={() => regenerateImage(false)}
              disabled={isRefining || (user?.token_balance || 0) < TOKEN_COSTS.BULK_IMAGE}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Same
                </>
              )}
            </Button>

            <Button
              onClick={() => regenerateImage(true)}
              disabled={isRefining || !editedPrompt.trim() || (user?.token_balance || 0) < TOKEN_COSTS.BULK_IMAGE}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Regenerate with Edits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Prompt History Modal */}
      <Dialog open={historyModal.open} onOpenChange={closeHistoryModal}>
        <DialogContent className="max-w-3xl bg-slate-900 border-purple-500/30 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Prompt History: {historyModal.card?.name}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              All prompts used for this card over time. Click to restore previous versions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {historyModal.card?.ai_prompt_history && historyModal.card.ai_prompt_history.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {[...historyModal.card.ai_prompt_history].reverse().map((entry, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${
                        entry.generation_success === true
                          ? "bg-emerald-900/10 border-emerald-500/30"
                          : entry.generation_success === false
                          ? "bg-red-900/10 border-red-500/30"
                          : "bg-slate-800/50 border-slate-700/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {entry.source && (
                              <Badge className="text-xs">
                                {entry.source === "auto_fill" && "🤖 Auto-Fill"}
                                {entry.source === "manual_edit" && "✏️ Manual Edit"}
                                {entry.source === "json_import" && "📥 JSON Import"}
                                {entry.source === "bulk_generator" && "🎨 Bulk Generated"}
                                {entry.source === "regeneration" && "🔄 Regenerated"}
                                {entry.source === "initial" && "🆕 Initial"}
                                {!entry.source && "❓ Unknown"}
                              </Badge>
                            )}
                            {entry.generation_success === true && (
                              <Badge className="bg-emerald-600 text-xs">✅ Success</Badge>
                            )}
                            {entry.generation_success === false && (
                              <Badge className="bg-red-600 text-xs">❌ Failed</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            {entry.created_by && entry.created_by !== "unknown" && (
                              <>
                                <span>•</span>
                                <User className="w-3 h-3" />
                                <span>{entry.created_by}</span>
                              </>
                            )}
                          </div>

                          <div className="bg-black/30 rounded p-3 text-sm text-white/90 font-mono mb-2">
                            {entry.prompt}
                          </div>

                          {entry.image_url && (
                            <div className="mt-2">
                              <img
                                src={entry.image_url}
                                alt="Generated"
                                className="w-32 h-48 object-cover rounded border border-white/20"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restorePromptFromHistory(entry)}
                          className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPromptToClipboard(entry.prompt)}
                          className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-white/50">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No prompt history yet for this card.</p>
                <p className="text-xs mt-2">History is saved when you auto-fill or generate images.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeHistoryModal}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}