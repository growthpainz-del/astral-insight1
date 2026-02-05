import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SpreadLayout from "@/components/reading/SpreadLayout";
import { Sparkles, Loader2 } from "lucide-react";

export default function AISpreadAssistant({ onApply }) {
  const [numCards, setNumCards] = React.useState(3);
  const [readingType, setReadingType] = React.useState("General");
  const [theme, setTheme] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [lastSuggestion, setLastSuggestion] = React.useState(null);

  const handleSuggest = async () => {
    setLoading(true);
    setError("");
    setLastSuggestion(null);
    try {
      const { data } = await base44.functions.invoke('aiSuggestSpread', {
        numCards: Number(numCards) || 3,
        readingType,
        theme,
        includeRotations: true,
      });
      if (data?.error) throw new Error(data.error);
      const suggestion = data?.suggestion || data;
      setLastSuggestion(suggestion);
      if (onApply && suggestion) {
        onApply(suggestion);
      }
    } catch (e) {
      setError(e.message || 'Failed to get suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-300" />
        <h3 className="text-lg font-bold text-purple-300">AI Spread Assistant</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/70">Number of Cards</label>
          <Input
            type="number"
            min={1}
            max={15}
            value={numCards}
            onChange={(e) => setNumCards(e.target.value)}
            className="bg-black/50 border-white/20 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-white/70">Reading Type</label>
          <Select value={readingType} onValueChange={setReadingType}>
            <SelectTrigger className="bg-black/50 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/20 text-white">
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Love">Love & Relationships</SelectItem>
              <SelectItem value="Career">Career & Finance</SelectItem>
              <SelectItem value="Spiritual">Spiritual Growth</SelectItem>
              <SelectItem value="Decision">Decision Making</SelectItem>
              <SelectItem value="Shadow">Shadow Work</SelectItem>
              <SelectItem value="Health">Health & Wellness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs text-white/70">Theme / Focus (optional)</label>
        <Textarea
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., new relationship clarity, career pivot, inner child healing"
          className="bg-black/50 border-white/20 text-white min-h-[70px]"
        />
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 rounded p-2">{error}</div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={handleSuggest} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Suggest with AI
        </Button>
        {lastSuggestion && (
          <span className="text-xs text-purple-300">Applied: {lastSuggestion.spread_name}</span>
        )}
      </div>

      {lastSuggestion && (
        <div className="mt-3 grid gap-3">
          <div className="bg-white/5 border border-white/10 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-600/80 text-white">Visual Suggestions</Badge>
              <span className="text-sm text-purple-200 font-semibold">{lastSuggestion.spread_name}</span>
            </div>
            <div className="text-xs text-purple-200/80 space-y-1">
              {lastSuggestion?.visual_guidance?.arrangement && <div>• Arrangement: {lastSuggestion.visual_guidance.arrangement}</div>}
              {lastSuggestion?.visual_guidance?.orientation_notes && <div>• Orientation: {lastSuggestion.visual_guidance.orientation_notes}</div>}
              {lastSuggestion?.visual_guidance?.spacing_notes && <div>• Spacing: {lastSuggestion.visual_guidance.spacing_notes}</div>}
              {lastSuggestion?.visual_guidance?.rotation_strategy && <div>• Rotations: {lastSuggestion.visual_guidance.rotation_strategy}</div>}
              {lastSuggestion?.visual_guidance?.suggested_shape && <div>• Shape: {lastSuggestion.visual_guidance.suggested_shape}</div>}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded p-3">
            <div className="text-xs text-white/70 mb-2">Quick Preview</div>
            <SpreadLayout
              spread={{ name: lastSuggestion.spread_name, positions: lastSuggestion.positions }}
              positions={lastSuggestion.positions}
              cards={[]}
              deck={null}
              animateSpread={false}
              defaultCardWidth={90}
              containerMinH="40vh"
              viewMode="compact"
            />
          </div>
        </div>
      )}

      <p className="text-[11px] text-white/50">AI suggests names, meanings, coordinates, and visual guidance. You can tweak them in the designer.</p>
    </div>
  );
}