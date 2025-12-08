import React from "react";
import { Deck } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Save, FileText, Sparkles } from "lucide-react";

export default function AICoachEditor({ deckId, deck, onDone }) {
  const [coachingText, setCoachingText] = React.useState(deck?.ai_reading_coach || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    setCoachingText(deck?.ai_reading_coach || "");
  }, [deck?.ai_reading_coach]);

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
      setError("Please upload a .txt file");
      return;
    }

    setError("");
    try {
      const text = await file.text();
      setCoachingText(text);
      setSuccess(false);
    } catch (e) {
      setError("Failed to read file: " + (e.message || "Unknown error"));
    }
    e.target.value = ""; // Reset input
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await Deck.update(deckId, { ai_reading_coach: coachingText });
      setSuccess(true);
      if (onDone) onDone();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message || "Failed to save coaching instructions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-purple-200 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          What is AI Reading Coach?
        </h3>
        <p className="text-sm text-purple-300">
          Provide specific instructions to guide the AI when reading this deck. 
          Include philosophy, tone, interpretation approach, mythic connections, and special considerations.
          This ensures every reading stays true to your deck's unique voice.
        </p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <Label className="text-white/80">Coaching Instructions</Label>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-purple-500/30 cursor-pointer hover:bg-purple-500/10 transition-colors text-sm">
          <Upload className="w-4 h-4" />
          Upload .txt
          <input
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleUploadFile}
          />
        </label>
      </div>

      <Textarea
        value={coachingText}
        onChange={(e) => {
          setCoachingText(e.target.value);
          setSuccess(false);
        }}
        className="bg-slate-800 border-slate-700 text-white min-h-[300px] font-mono text-sm"
        placeholder="Example:

DECK PHILOSOPHY: This deck focuses on feminine divine energy and lunar cycles...

TONE & APPROACH:
• Use poetic, evocative language
• Balance grounding and transformation
• Emphasize intuition and emotional wisdom

SPECIAL CONSIDERATIONS:
• Connect cards to mythic archetypes
• Reference elemental symbolism
• Encourage rituals to integrate insights"
      />

      {coachingText && (
        <div className="text-xs text-white/60 flex items-center gap-2">
          <FileText className="w-3 h-3" />
          {coachingText.length} characters
        </div>
      )}

      {error && <div className="text-red-300 text-sm">{error}</div>}
      {success && <div className="text-emerald-300 text-sm">✓ Coaching instructions saved successfully!</div>}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {saving ? "Saving..." : "Save Coaching Instructions"}
      </Button>
    </div>
  );
}