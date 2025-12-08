
import React from "react";
import { base44 } from "@/api/base44Client";
import { Card as UICard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CardDetailsPanel from "@/components/cards/CardDetailsPanel";
import { Loader2, RefreshCw } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function CardInfo() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  const deckIdParam = params.get("deckId");
  const numberParam = params.get("number");
  const nameParam = params.get("name");
  const reversedParam = params.get("reversed") === "true";

  const [card, setCard] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Detect admin to decide if AI notes should be visible
  React.useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setIsAdmin(me?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  const fetchCard = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let c = null;

      // 1) Try by id
      if (idParam) {
        try {
          c = await base44.entities.Card.get(idParam);
        } catch {
          const arr = await base44.entities.Card.filter({ id: idParam });
          c = arr?.[0] || null;
        }
      }

      // 2) Try by deck + number
      if (!c && deckIdParam && numberParam) {
        const byNum = await base44.entities.Card.filter(
          { deck_id: deckIdParam, number: Number(numberParam) },
          "-updated_date",
          1
        );
        c = byNum?.[0] || null;
      }

      // 3) Try by deck + name
      if (!c && deckIdParam && nameParam) {
        const byName = await base44.entities.Card.filter(
          { deck_id: deckIdParam, name: nameParam },
          "-updated_date",
          1
        );
        c = byName?.[0] || null;
      }

      // 4) last resort: by number alone (dangerous but helpful for quick check)
      if (!c && numberParam) {
        const byNumOnly = await base44.entities.Card.filter({ number: Number(numberParam) }, "-updated_date", 1);
        c = byNumOnly?.[0] || null;
      }

      if (!c) {
        setError("Card not found. Provide ?id=, or ?deckId= with &number= or &name=.");
      } else {
        setCard(c);
      }
    } catch (e) {
      setError(e?.message || "Failed to load card.");
    } finally {
      setLoading(false);
    }
  }, [idParam, deckIdParam, numberParam, nameParam]);

  React.useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black p-6 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <UICard className="bg-white/5 border-white/10">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Card Info</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={fetchCard}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {card?.deck_id ? (
                <a href={createPageUrl(`DeckView?id=${card.deck_id}`)}>
                  <Button className="bg-purple-600 hover:bg-purple-700">Open Deck</Button>
                </a>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {error ? <div className="text-red-300">{error}</div> : null}
            <CardDetailsPanel card={card} isReversed={reversedParam} showAiNotes={isAdmin} />
          </CardContent>
        </UICard>
      </div>
    </div>
  );
}
