
import React, { useState } from "react";
import { Info } from "lucide-react";

function Code({ children }) {
  return (
    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-200 border border-gray-700">
      <code>{children}</code>
    </pre>
  );
}

export default function ImportJsonGuide() {
  const [deckHint, setDeckHint] = useState("Open any deck > Controllers > Import JSON");

  return (
    <div className="text-gray-200 space-y-6">
      <div className="flex items-start gap-3 bg-gray-800/70 p-4 rounded-lg border border-gray-700">
        <Info className="w-5 h-5 text-blue-300 mt-0.5" />
        <div>
          <div className="font-semibold text-white">Where to import</div>
          <p className="text-sm">{deckHint}. The importer can create new cards and update existing ones.</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">1) Minimal create</h3>
        <p className="text-sm text-gray-400 mb-2">At minimum you need a name; number is recommended for ordering.</p>
        <Code>{`[
  { "name": "The Spark", "number": 1 },
  { "name": "The Flow",  "number": 2 }
]`}</Code>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">2) Full card example</h3>
        <Code>{`[
  {
    "name": "The Spark",
    "number": 1,
    "image_url": "https://example.com/spark.jpg",
    "keywords": ["inspiration", "beginnings", "action"],
    "overall_meaning": "The first ignition of a creative path.",
    "upright_meaning": "Start boldly; trust the first step.",
    "reversed_meaning": "Hesitation; fear of starting.",
    "upright_action": "Ship a tiny version today.",
    "reversed_action": "Lower the bar; begin imperfectly.",
    "custom_fields": {
      "role": { "label": "Primary Role", "value": "Catalyst for creation" }
    }
  }
]`}</Code>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">3) Update existing by number</h3>
        <Code>{`[
  { "number": 1, "upright_meaning": "Fresh momentum and courage." },
  { "number": 2, "image_url": "https://cdn.example.com/flow.jpg" }
]`}</Code>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">4) Update by id or name</h3>
        <p className="text-sm text-gray-400 mb-2">Importer matches in this order: id → number → name.</p>
        <Code>{`[
  { "id": "card_123", "keywords": ["renewal", "spark"] },
  { "name": "The Flow", "reversed_meaning": "Forcing it; step back." }
]`}</Code>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">5) If your "id" is actually the number</h3>
        <p className="text-sm text-gray-400 mb-2">Toggle “Treat numeric id as number” in the importer.</p>
        <Code>{`[
  { "id": "12", "upright_meaning": "Clarity returns." }
]`}</Code>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">6) Shorthand fields are OK</h3>
        <p className="text-sm text-gray-400 mb-2">If you have fields like role or hard_truth in the form "Label|Value", we’ll auto‑map them into custom_fields.</p>
        <Code>{`[
  {
    "number": 1,
    "name": "The Beach Bum",
    "role": "Primary Role|The tranquil seeker of coastal calm.",
    "hard_truth": "The Hard Truth|Too much rest weakens resolve."
  }
]`}</Code>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-2">7) Spreads belong in the Spread Importer</h3>
        <p className="text-sm text-gray-400 mb-2">Paste only cards here. If your JSON ends with {"{ \"spreads\": [...] }"}, remove it and import spreads via the Spread Designer or Bulk Spread Importer.</p>
      </div>

      <div className="text-sm text-gray-300">
        Tips:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>keywords can be an array or a comma-separated string.</li>
          <li>Only provided fields are changed; missing fields are left as-is.</li>
          <li>To create, "name" is required. For updates, provide id, number, or name.</li>
          <li>Official/public decks may be read-only; import into a personal deck you own.</li>
        </ul>
      </div>
    </div>
  );
}
