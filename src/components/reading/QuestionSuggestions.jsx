
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ClipboardCopy, Play, Sparkles } from "lucide-react";

const GENERAL_SUGGESTIONS = [
  "What energy surrounds me today?",
  "What should I focus on this week?",
  "What lesson am I being asked to learn right now?",
  "What is blocking my progress and how can I clear it?",
  "How can I best support my growth at this time?",
  "What needs healing, and what first step should I take?",
  "What do I need to release to move forward?",
  "What opportunity am I not seeing yet?",
];

function categorySuggestions(category) {
  switch (category) {
    case "tarot":
      return [
        "What archetype wants my attention now?",
        "How can I integrate shadow and light more harmoniously?",
        "What cycle am I completing and what begins next?",
      ];
    case "lenormand":
      return [
        "What is the most likely near-term outcome for my plan?",
        "Which hidden influence should I watch for right now?",
        "What practical action aligns me with success this week?",
      ];
    case "runes":
      return [
        "What foundational truth do I need to honor now?",
        "Where should I direct courage and discipline?",
        "What must be endured or transformed for growth?",
      ];
    default:
      return [
        "Which path aligns best with my intention?",
        "Where is the greatest momentum in my life?",
        "What pattern should I understand or end?",
      ];
  }
}

// Works on DeckView or Reading pages. Accepts optional props, falls back to URL deckId.
export default function QuestionSuggestions({ deck, deckId: deckIdProp, suggested }) {
  const urlParams = new URLSearchParams(window.location.search);
  const deckId = deckIdProp || deck?.id || urlParams.get("deckId") || "";

  const deckTheme = Array.isArray(suggested) && suggested.length > 0
    ? suggested
    : (Array.isArray(deck?.suggested_questions) && deck.suggested_questions.length > 0
        ? deck.suggested_questions
        : categorySuggestions(deck?.category));

  const [source, setSource] = React.useState("general"); // "general" | "deck"
  // Removed 'selected' state to avoid potential 'duplicate input' confusion.
  // The 'question' state will now directly manage both the Select and Input values.
  const [question, setQuestion] = React.useState("");

  const currentList = source === "general" ? GENERAL_SUGGESTIONS : (deckTheme || []);

  const handlePick = (val) => {
    // When a suggestion is picked, update the main question state.
    setQuestion(val);
  };

  const copyToClipboard = async () => {
    const q = (question || "").trim();
    if (!q) return;
    await navigator.clipboard.writeText(q);
  };

  const readingUrl = React.useMemo(() => {
    const q = encodeURIComponent(question || "");
    return createPageUrl(`Reading?deckId=${encodeURIComponent(deckId)}&question=${q}`);
  }, [deckId, question]);

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <h3 className="text-white font-semibold">Suggested Questions</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-white/70">Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-36 bg-black/30 border-white/10 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="deck" disabled={!deckTheme?.length}>Deck Theme</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          <Label className="text-xs text-white/70">Pick a suggestion</Label>
          {/* Select component's value now directly uses the 'question' state. */}
          <Select value={question} onValueChange={handlePick}>
            <SelectTrigger className="bg-black/30 border-white/10 text-white">
              <SelectValue placeholder={currentList?.length ? "Choose a question…" : "No suggestions available"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white max-h-72">
              {currentList?.length ? currentList.map((q, idx) => (
                <SelectItem key={idx} value={q}>{q}</SelectItem>
              )) : (
                <div className="px-3 py-2 text-xs text-white/60">No suggestions for this deck.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-white/70">Or write your own</Label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question…"
            className="bg-black/30 border-white/10 text-white"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={copyToClipboard}
              disabled={!question?.trim()}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ClipboardCopy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Link to={readingUrl} className="ml-auto">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Start Reading
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
