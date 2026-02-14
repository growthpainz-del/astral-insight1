import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function SampleJsonDownload() {
  const handleDownload = () => {
    const sample = {
      deck: {
        name: "Sample Oracle of Light",
        description: "A small example deck used to demonstrate JSON structure for imports.",
        category: "oracle",
        author: "Your Name",
        cover_image: "https://images.unsplash.com/photo-1520975922324-5cbf3f5463ad?q=80&w=1600&auto=format&fit=crop",
        back_image_url: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1600&auto=format&fit=crop",
        is_public: false
      },
      cards: [
        {
          name: "1 · Dawn",
          subtitle: "New Beginnings",
          number: 1,
          image_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
          ai_image_prompt: "Golden sunrise over a mountain ridge, warm light, hopeful energy, cinematic, crisp detail",
          element: "fire",
          keywords: ["start", "energy", "opportunity"],
          overall_meaning: "Fresh energy arrives with clarity and momentum.",
          upright_meaning: "Say yes to beginnings; take the first step with courage.",
          upright_action: "Write one concrete action and do it within 24 hours.",
          reversed_meaning: "Hesitation or fear of the unknown delays progress.",
          reversed_action: "Break the goal into a smaller, safer first move."
        },
        {
          name: "2 · Tide",
          subtitle: "Emotional Flow",
          number: 2,
          image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
          ai_image_prompt: "Moonlit ocean waves, soft blue palette, calm and intuitive mood, ethereal glow",
          element: "water",
          keywords: ["feelings", "intuition", "ebb & flow"],
          overall_meaning: "Emotions guide choices—listen for the subtle pull.",
          upright_meaning: "Align with your intuition and stay flexible.",
          upright_action: "Journal for ten minutes without editing.",
          reversed_meaning: "Emotional overwhelm or avoidance clouds judgment.",
          reversed_action: "Pause; name the feeling and breathe before acting."
        },
        {
          name: "3 · Root",
          subtitle: "Ground & Build",
          number: 3,
          image_url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop",
          ai_image_prompt: "Ancient tree roots in rich soil, earthy tones, grounded stability, natural light",
          element: "earth",
          keywords: ["stability", "plan", "support"],
          overall_meaning: "Lay foundations and invest in what endures.",
          upright_meaning: "Structure brings freedom; commit to the routine.",
          upright_action: "Schedule recurring time for this priority.",
          reversed_meaning: "Scattered focus or weak footing stalls growth.",
          reversed_action: "Remove one distraction and simplify the plan."
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-white font-semibold">Download Sample JSON (Deck + Cards)</h3>
        <p className="text-white/70 text-sm">Use this as a starting point for creating your own deck imports.</p>
      </div>
      <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
        <Download className="w-4 h-4 mr-2" /> sample.json
      </Button>
    </div>
  );
}