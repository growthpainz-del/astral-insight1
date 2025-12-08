import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertTriangle, Lightbulb, Copy, Check } from "lucide-react";
import TokenCostPreview from "@/components/pricing/TokenCostPreview";
import FreeLimitReached from "@/components/pricing/FreeLimitReached";

/**
 * AI Helper Component - Manual trigger AI assistant for deck creation
 * Costs 1 token per suggestion
 * 
 * Props:
 * - context: string - What the user is working on (e.g., "card_name", "card_meaning", "deck_description")
 * - currentData: object - Current data being edited (card, deck, etc.)
 * - onSuggestionApply: function - Callback when user applies a suggestion
 * - deck: object - Deck context for better suggestions
 */
export default function AIHelper({ context, currentData, onSuggestionApply, deck }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      User.me().then(setUser).catch(() => setUser(null));
    }
  }, [isOpen]);

  const contextPrompts = {
    card_name: {
      label: "Suggest Card Names",
      prompt: (data) => `You are an expert oracle/tarot deck creator. Suggest 5 unique, evocative card names for this deck.

Deck: ${deck?.name || "Oracle Deck"}
${deck?.description ? `Theme: ${deck.description}` : ""}
${deck?.category ? `Category: ${deck.category}` : ""}

${data?.partial_name ? `Current partial name: "${data.partial_name}"` : ""}
${data?.card_number ? `Card number: ${data.card_number}` : ""}

Provide 5 creative card name suggestions that fit this deck's theme. List them numbered 1-5, one per line.`,
    },
    card_meaning: {
      label: "Generate Card Meaning",
      prompt: (data) => `You are an expert oracle/tarot card interpreter. Write a comprehensive meaning for this card.

Deck: ${deck?.name || "Oracle Deck"}
${deck?.description ? `Theme: ${deck.description}` : ""}
Card Name: ${data?.name || "Unknown Card"}
${data?.keywords ? `Keywords: ${data.keywords.join(", ")}` : ""}

Write a detailed overall meaning (3-4 sentences) that captures the essence of this card. Be poetic but practical.`,
    },
    card_keywords: {
      label: "Generate Keywords",
      prompt: (data) => `Generate 5-7 relevant keywords for this oracle card.

Card Name: ${data?.name || "Unknown Card"}
${data?.overall_meaning ? `Meaning: ${data.overall_meaning}` : ""}
Deck Theme: ${deck?.name || "Oracle Deck"}

Provide keywords as a comma-separated list.`,
    },
    upright_meaning: {
      label: "Write Upright Meaning",
      prompt: (data) => `Write an upright (positive) interpretation for this card (2-3 sentences).

Card: ${data?.name || "Unknown Card"}
${data?.overall_meaning ? `Overall Theme: ${data.overall_meaning}` : ""}

Focus on empowering, growth-oriented aspects.`,
    },
    reversed_meaning: {
      label: "Write Reversed Meaning",
      prompt: (data) => `Write a reversed interpretation for this card (2-3 sentences).

Card: ${data?.name || "Unknown Card"}
${data?.overall_meaning ? `Overall Theme: ${data.overall_meaning}` : ""}
${data?.upright_meaning ? `Upright Meaning: ${data.upright_meaning}` : ""}

Focus on internalized, blocked, or shadow aspects. Avoid fear-based language.`,
    },
    deck_description: {
      label: "Write Deck Description",
      prompt: (data) => `Write a compelling 2-3 sentence description for this oracle deck.

Deck Name: ${data?.name || "Untitled Deck"}
Category: ${data?.category || "oracle"}
${data?.partial_description ? `Current draft: ${data.partial_description}` : ""}

Make it mystical, engaging, and clear about the deck's purpose.`,
    },
    improve_text: {
      label: "Improve This Text",
      prompt: (data) => `Improve this text to be more evocative, clear, and engaging while maintaining its core meaning.

Original text:
${data?.text || "(no text provided)"}

Provide an improved version.`,
    },
    custom: {
      label: "Custom AI Request",
      prompt: (data) => data?.custom_prompt || "Provide creative suggestions for this deck element.",
    },
  };

  const generateSuggestion = async () => {
    setIsGenerating(true);
    setError("");
    setSuggestion("");

    try {
      const tokenCost = 1;
      
      if (user && typeof user.token_balance === "number" && user.token_balance < tokenCost) {
        setError("Insufficient tokens. AI Helper costs 1 token per use.");
        setIsGenerating(false);
        return;
      }

      const contextConfig = contextPrompts[context] || contextPrompts.custom;
      const prompt = customPrompt 
        ? `${contextConfig.prompt(currentData)}\n\nUser request: ${customPrompt}`
        : contextConfig.prompt(currentData);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      if (!response || typeof response !== "string") {
        throw new Error("Invalid response from AI service");
      }

      setSuggestion(response.trim());

      // Deduct token
      if (user && typeof user.token_balance === "number") {
        const newBalance = Math.max(0, user.token_balance - tokenCost);
        await base44.entities.User.update(user.id, {
          token_balance: newBalance,
          lifetime_tokens_used: (user.lifetime_tokens_used || 0) + tokenCost
        });
        setUser(prev => ({ ...prev, token_balance: newBalance }));
      }

    } catch (err) {
      console.error("Error generating AI suggestion:", err);
      setError(err.message || "Failed to generate suggestion. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (onSuggestionApply && suggestion) {
      onSuggestionApply(suggestion);
      setIsOpen(false);
      setSuggestion("");
      setCustomPrompt("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasInsufficientTokens = user && typeof user.token_balance === "number" && user.token_balance < 1;
  const contextConfig = contextPrompts[context] || contextPrompts.custom;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="border-purple-500/40 text-purple-300 hover:bg-purple-900/20"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI Helper
      </Button>
    );
  }

  return (
    <div className="bg-purple-900/20 border border-purple-500/40 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-purple-200">{contextConfig.label}</h3>
        </div>
        <Button
          onClick={() => {
            setIsOpen(false);
            setSuggestion("");
            setError("");
            setCustomPrompt("");
          }}
          variant="ghost"
          size="sm"
          className="text-purple-300"
        >
          Close
        </Button>
      </div>

      {!suggestion && !isGenerating && (
        <div className="space-y-3">
          <p className="text-sm text-purple-200">
            Get AI-powered suggestions for your deck. Each use costs <strong>1 token</strong>.
          </p>

          {context === "custom" && (
            <div>
              <label className="text-sm text-purple-300 mb-2 block">What do you need help with?</label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., 'Suggest a better way to phrase this card meaning' or 'Generate 10 card names about nature'"
                className="bg-black/30 border-purple-500/30 text-white min-h-[100px]"
              />
            </div>
          )}

          {hasInsufficientTokens ? (
            <FreeLimitReached />
          ) : (
            <div className="flex items-center justify-between">
              <TokenCostPreview action="simple" quantity={1} />
              <Button
                onClick={generateSuggestion}
                disabled={isGenerating || hasInsufficientTokens}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Suggestion
              </Button>
            </div>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center gap-3 text-purple-300 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>AI is thinking...</span>
        </div>
      )}

      {error && (
        <Alert className="bg-red-900/20 border-red-500/40 text-red-200">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestion && (
        <div className="space-y-3">
          <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4">
            <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">
              {suggestion}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Suggestion
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setSuggestion("");
                setError("");
              }}
              variant="outline"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {user && typeof user.token_balance === "number" && (
        <div className="text-xs text-purple-300 text-center pt-2 border-t border-purple-500/20">
          Your balance: <strong>{user.token_balance} tokens</strong>
        </div>
      )}
    </div>
  );
}