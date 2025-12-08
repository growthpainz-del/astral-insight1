import React from "react";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FusionResult({ result }) {
  if (!result) return null;

  const Section = ({ title, items }) => {
    if (!items || !items.length) return null;
    return (
      <div>
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <Badge key={i} variant="outline" className="text-white border-white/20 bg-white/5">{t}</Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {result.summary && (
        <UICard className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <p className="text-white/80">{result.summary}</p>
          </CardContent>
        </UICard>
      )}

      <Section title="Themes" items={result.themes} />
      <Section title="Similarities" items={result.similarities} />
      <Section title="Contrasts" items={result.contrasts} />
      <Section title="Opposing Forces" items={result.opposing_forces} />

      {Array.isArray(result.reading_tips) && result.reading_tips.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-2">Reading Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-white/80">
            {result.reading_tips.map((tip, i) => (<li key={i}>{tip}</li>))}
          </ul>
        </div>
      )}

      {Array.isArray(result.spread_suggestions) && result.spread_suggestions.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-2">Spread Suggestions</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {result.spread_suggestions.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="font-semibold text-white mb-1">{s.name}</div>
                <ol className="list-decimal list-inside text-white/80 text-sm space-y-1">
                  {(s.positions || []).map((p, idx) => <li key={idx}>{p}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}