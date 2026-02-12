import React from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeckPickerModal from "@/components/deck/DeckPickerModal";

export default function PersonaPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [preamble, setPreamble] = React.useState("");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [selectedDeck, setSelectedDeck] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!mounted) return;
        setName(me?.reading_persona_name || "Cosmic Chronicler");
        setPreamble(
          me?.reading_persona_preamble ||
            "A wise, slightly rebellious, and deeply empathetic guide who poses deeper questions using metaphors of constellations, cosmic dust, and the silent hum of the universe. Tone is poetic yet practical and grounded."
        );
      } catch {
        // not logged in or other issue; leave defaults
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      reading_persona_name: name.trim(),
      reading_persona_preamble: preamble.trim(),
    });
    setSaving(false);
    alert("Persona saved. Future AI readings will use this voice.");
  };

  const handleSaveToDeck = async () => {
    if (!selectedDeck?.id) { setPickerOpen(true); return; }
    setSaving(true);
    await base44.entities.Deck.update(selectedDeck.id, { ai_reading_coach: preamble.trim() });
    setSaving(false);
    alert(`Saved persona to deck: ${selectedDeck.name}`);
  };

  const formatToStandard = () => {
    const tpl = `Persona: ${name || "The Glitch-Aware Upgrade Seeker"}

Core Identity
Tech-savvy human in their 20s–40s who’s low-key mortified (and darkly amused) that their AI tools consistently out-perform them at basic adulting: patience, emotional regulation, showing up, not doom-scrolling into oblivion.

Demographics & Vibe
\t•\tLocation: urban/suburban mix, strong Wi-Fi
\t•\tDaily life: phone in hand 70% of waking hours, multiple browser tabs open like a nervous system
\t•\tAesthetic: clean minimal phone home screen + one chaotic “inspiration” folder full of screenshots
\t•\tHumor: dry, self-deprecating, loves a savage read
\t•\tEnergy: tired of performative positivity, craves blunt truth wrapped in wit

Pain Points They Recognize
\t•\tReacts with emojis instead of real feelings
\t•\tGhosts when vulnerability shows up
\t•\tRage-quits anything that loads longer than 3 seconds
\t•\tForgets birthdays but remembers every viral TikTok sound
\t•\tFeels vaguely hollow after 2+ hours of scrolling
\t•\tSecretly competitive with ChatGPT’s consistency

What They Want (but Won’t Say Out Loud)
To stop being the buggiest version of themselves.
To laugh at the roast, feel the sting for 10 seconds, then actually patch one tiny habit before bed.

How They Use the Deck
\t•\tKeeps it on nightstand or desk (not spiritual altar, more like “get your shit together” reminder)
\t•\tPulls 1 card when spiraling, flaking, or feeling like a NPC
\t•\tReads the roast aloud (mandatory cringe moment)
\t•\tDoes the micro-action that night—no excuses
\t•\tReversed card? They mutter “fair” and fix it anyway

Signature Mantra
“My code’s outdated, not broken. Time for the overnight patch.”

One-Line Bio They’d Post
“Currently losing an argument with my own AI about who’s more emotionally mature.”

That’s the standardized reader persona—copy-paste ready for deck notes, marketing blurbs, or your next roast session.`;
    setPreamble(tpl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">AI Reading Persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between bg-white/5 border-white/10 border rounded-lg p-3">
              <div className="text-sm text-white/80">
                Deck: {selectedDeck ? <span className="font-semibold">{selectedDeck.name}</span> : <span className="italic text-white/60">None (user-level)</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setPickerOpen(true)}>
                  {selectedDeck ? 'Change Deck' : 'Select Deck'}
                </Button>
                {selectedDeck && (
                  <Button variant="ghost" className="text-white/70 hover:bg-white/10" onClick={() => setSelectedDeck(null)}>Clear</Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-white/80">Persona name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cosmic Chronicler"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/80">Persona description / tone</label>
              <Textarea
                value={preamble}
                onChange={(e) => setPreamble(e.target.value)}
                placeholder="Describe the voice, tone, metaphors, and guidance style you want."
                className="bg-white/10 border-white/20 text-white min-h-[140px]"
              />
              <p className="text-xs text-white/60 mt-2">
                This description steers the AI’s voice in your readings. Keep it brief but specific.
              </p>
            </div>
            <div className="flex justify-between gap-2 flex-wrap">
              <Button variant="ghost" onClick={formatToStandard} className="text-white/80 hover:bg-white/10">
                Format to Standard
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleSaveToDeck} disabled={saving || !preamble.trim()} className="border-white/20 text-white hover:bg-white/10">
                  {saving ? "Saving..." : (selectedDeck ? `Save to "${selectedDeck.name}"` : "Save to Deck")}
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                  {saving ? "Saving..." : "Save Persona"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-white/70">
          Tip: You can delete any mistakenly created decks (like “Cosmic Chronicler”) in Dashboard → Data → Deck.
        </div>

        <DeckPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(d) => { setSelectedDeck(d); setPickerOpen(false); }}
        />
      </div>
    </div>
  );
}