import React from "react";
import { Card as UICard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CardDetailsPanel({ card, isReversed = false, title = "Card Details", showAiNotes = false }) {
  if (!card) {
    return (
      <UICard className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-white/70">No card selected.</CardContent>
      </UICard>
    );
  }

  const name = card.name || card.card_name || card?.card?.name || card?.title || card?.card?.title || "Untitled";
  const number = card.number != null ? `#${card.number}` : null;
  const element = card.element && card.element !== "none" ? card.element : null;

  const overall = card.overall_meaning || "";
  const uprightMeaning = card.upright_meaning || "";
  const reversedMeaning = card.reversed_meaning || "";
  const meaning = isReversed ? reversedMeaning : uprightMeaning;

  const uprightAction = card.upright_action || "";
  const reversedAction = card.reversed_action || "";
  const action = isReversed ? (reversedAction || "") : (uprightAction || "");

  const uprightInsight = card.upright_insight || "";
  const reversedInsight = card.reversed_insight || "";
  const insight = isReversed ? (reversedInsight || "") : (uprightInsight || "");

  const customNotes =
    card?.custom_ai_notes ||
    card?.custom_ai_helper ||
    card?.custom_notes ||
    card?.custom ||
    "";

  const ancient = card.ancient_wisdom || "";
  const quote = card.musician_quote || "";
  const interaction = card.interaction || "";
  const facedown = card.facedown_meaning || "";
  const keywords = Array.isArray(card.keywords) ? card.keywords : [];

  return (
    <UICard className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{name}</span>
              {number ? <Badge variant="secondary" className="bg-white/10 text-white">{number}</Badge> : null}
              {element ? <Badge className="bg-purple-600/30 text-purple-200 capitalize">{element}</Badge> : null}
            </CardTitle>
            {card.subtitle ? (
              <div className="text-white/70 mt-1">{card.subtitle}</div>
            ) : null}
          </div>
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={name}
              className="w-24 h-32 object-cover rounded-md border border-white/10"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {keywords.length ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, i) => (
              <Badge key={i} className="bg-white/10 text-white">{k}</Badge>
            ))}
          </div>
        ) : null}

        {overall ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">Overall Meaning</h4>
            <p className="text-white/80 whitespace-pre-wrap">{overall}</p>
          </section>
        ) : null}

        {meaning ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">{isReversed ? "Reversed Meaning" : "Upright Meaning"}</h4>
            <p className="text-white/80 whitespace-pre-wrap">{meaning}</p>
          </section>
        ) : null}

        {insight ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">{isReversed ? "Reversed Insight" : "Upright Insight"}</h4>
            <p className="text-white/80 whitespace-pre-wrap">{insight}</p>
          </section>
        ) : null}

        {action ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">Recommended Action</h4>
            <p className="text-white/80 whitespace-pre-wrap">{action}</p>
          </section>
        ) : null}

        {showAiNotes && customNotes ? (
          <>
            <Separator className="bg-white/10" />
            <section>
              <h4 className="font-semibold text-white/90 mb-1">Custom AI Notes</h4>
              <p className="text-white/80 whitespace-pre-wrap">{customNotes}</p>
            </section>
          </>
        ) : null}

        {ancient ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">Ancient Wisdom</h4>
            <p className="text-white/80 whitespace-pre-wrap">{ancient}</p>
          </section>
        ) : null}

        {interaction ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">Interactions</h4>
            <p className="text-white/80 whitespace-pre-wrap">{interaction}</p>
          </section>
        ) : null}

        {facedown ? (
          <section>
            <h4 className="font-semibold text-white/90 mb-1">Facedown Meaning</h4>
            <p className="text-white/80 whitespace-pre-wrap">{facedown}</p>
          </section>
        ) : null}

        {quote ? (
          <section className="border-l-2 border-white/20 pl-3 italic text-white/80">
            {quote}
          </section>
        ) : null}
      </CardContent>
    </UICard>
  );
}