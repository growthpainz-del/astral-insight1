import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

export default function PersonaFromInsights({ deckId, deck, onSaved }) {
  const insights = deck?.ai_deck_insights;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [tone, setTone] = useState("warm");
  const [rulesText, setRulesText] = useState(""); // multiline, one per line
  const [examplesText, setExamplesText] = useState(""); // multiline, one per line
  const [savedMsg, setSavedMsg] = useState("");

  const rules = useMemo(() => rulesText.split(/\n+/).map(s => s.trim()).filter(Boolean), [rulesText]);
  const examples = useMemo(() => examplesText.split(/\n+/).map(s => s.trim()).filter(Boolean), [examplesText]);

  const compiledPrompt = useMemo(() => {
    const lines = [];
    const toneMap = {
      warm: "Warm, compassionate, supportive tone",
      direct: "Direct, grounded, practical tone",
      poetic: "Poetic, metaphor-rich tone",
      mystical: "Mystical, esoteric tone with gentle reverence",
      humorous: "Light, encouraging tone with gentle humor",
      compassionate: "Compassionate, validating, trauma-informed tone",
    };

    if (name) lines.push(`Persona: ${name}`);
    lines.push(`Tone: ${toneMap[tone] || tone}`);

    const mood = insights?.visual_style?.mood ? `Mood: ${insights.visual_style.mood}` : null;
    if (mood) lines.push(mood);

    if (rules.length) {
      lines.push("\nGuidelines:");
      rules.forEach((r, i) => lines.push(`- ${r}`));
    }

    if (examples.length) {
      lines.push("\nStyle Examples:");
      examples.forEach((ex, i) => lines.push(`- ${ex}`));
    }

    lines.push("\nAlways tailor insights to the drawn cards and question. Be actionable, empowering, and trauma-informed.");

    return lines.join("\n");
  }, [name, tone, rules, examples, insights]);

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    setSavedMsg("");
    try {
      let contextBlock = "";
      if (insights) {
        contextBlock = `DECK INSIGHTS (JSON):\n${JSON.stringify(insights, null, 2)}`;
      } else {
        const deckMeta = {
          name: deck?.name,
          description: deck?.description,
          category: deck?.category,
          visual_style: deck?.ai_deck_insights?.visual_style || null,
          semantic_style: deck?.ai_deck_insights?.semantic_style || null,
          deck_personality: deck?.ai_deck_insights?.deck_personality || null,
        };
        let cardsSample = [];
        if (deckId) {
          try {
            const list = await base44.entities.Card.filter({ deck_id: deckId }, undefined, 25);
            cardsSample = (list || []).map(c => ({
              name: c.name,
              element: c.element || null,
              keywords: c.keywords || [],
              overall_meaning: c.overall_meaning || c.upright_meaning || null,
            }));
          } catch (_) {}
        }
        contextBlock = `DECK METADATA:\n${JSON.stringify(deckMeta, null, 2)}\n\nSAMPLE CARDS (JSON):\n${JSON.stringify(cardsSample.slice(0, 25), null, 2)}`;
      }

      const prompt = `Create a tarot/oracle reading persona based on the provided context. Output JSON ONLY matching the provided schema.\n\n${contextBlock}\n\nInstructions:\n- Propose a memorable persona name\n- Choose a tone from: warm, direct, poetic, mystical, humorous, compassionate\n- Create 6-10 crisp rules that steer interpretation style (voice, values, dos/don'ts)\n- Provide 2-4 short example phrasings that show the style\n- Keep content concise, specific to this deck's themes and mood\n`;

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          tone: { type: "string", enum: ["warm","direct","poetic","mystical","humorous","compassionate"] },
          rules: { type: "array", items: { type: "string" } },
          examples: { type: "array", items: { type: "string" } },
        },
        required: ["name","tone","rules","examples"],
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: schema,
      });

      const p = typeof res === 'string' ? null : res;
      if (!p) throw new Error('Unexpected response from AI');

      setName(p.name || "");
      setTone(p.tone || "warm");
      setRulesText((p.rules || []).join("\n"));
      setExamplesText((p.examples || []).join("\n"));
    } catch (e) {
      setError(e?.message || 'Failed to generate persona');
    } finally {
      setLoading(false);
    }
  };

  const saveToDeck = async () => {
    if (!deckId) return;
    setLoading(true);
    setError("");
    setSavedMsg("");
    try {
      await base44.entities.Deck.update(deckId, { ai_reading_coach: compiledPrompt });
      setSavedMsg('Saved to deck.');
      onSaved && onSaved();
    } catch (e) {
      setError(e?.message || 'Failed to save to deck');
    } finally {
      setLoading(false);
    }
  };

  const copyToProfile = async () => {
    setLoading(true);
    setError("");
    setSavedMsg("");
    try {
      await base44.auth.updateMe({ reading_persona_name: name || 'Reading Coach', reading_persona_preamble: compiledPrompt });
      setSavedMsg('Copied to your profile.');
    } catch (e) {
      setError(e?.message || 'Failed to copy to profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate from AI Insights
        </Button>
        {!insights && (
          <div className="text-amber-300 text-sm">No AI Insights found — we'll use deck details and cards metadata instead.</div>
        )}
      </div>

      {error && (
        <div className="text-red-300 text-sm">{error}</div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-white/70 mb-1">Persona Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Mystic Sage" className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <div className="text-xs text-white/70 mb-1">Tone</div>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="warm">Warm & Compassionate</SelectItem>
                <SelectItem value="direct">Direct & Practical</SelectItem>
                <SelectItem value="poetic">Poetic & Metaphoric</SelectItem>
                <SelectItem value="mystical">Mystical & Esoteric</SelectItem>
                <SelectItem value="humorous">Light & Encouraging</SelectItem>
                <SelectItem value="compassionate">Trauma-Informed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-white/70 mb-1">Rules (one per line)</div>
            <Textarea value={rulesText} onChange={(e) => setRulesText(e.target.value)} placeholder="Avoid fatalism; empower the seeker\nReference deck symbolism over generic meanings\nOffer 1–3 practical actions per insight" className="bg-slate-800 border-slate-700 text-white h-36" />
          </div>
          <div>
            <div className="text-xs text-white/70 mb-1">Examples (one per line)</div>
            <Textarea value={examplesText} onChange={(e) => setExamplesText(e.target.value)} placeholder="Notice how this card invites you to soften into trust...\nYour next best step: choose one small promise to yourself today." className="bg-slate-800 border-slate-700 text-white h-28" />
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <div className="text-xs text-purple-300 uppercase tracking-wider">Auto-Compiled Prompt Preview</div>
          <div className="bg-black/30 border border-purple-500/30 rounded-lg p-4 h-full min-h-[260px] overflow-auto whitespace-pre-wrap text-sm text-purple-100">
            {compiledPrompt || 'Start by generating from insights, then edit fields to see the live prompt.'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={saveToDeck} disabled={loading || !compiledPrompt} className="bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          Save to Deck (ai_reading_coach)
        </Button>
        <Button onClick={copyToProfile} disabled={loading || !compiledPrompt} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Copy to My Profile
        </Button>
        {savedMsg && <div className="text-emerald-300 text-sm self-center">{savedMsg}</div>}
      </div>
    </div>
  );
}