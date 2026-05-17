import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Deck as DeckEntity } from "@/entities/Deck";
import CardGallery from "@/components/deck/CardGallery";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function DeckGallery() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId") || searchParams.get("id");

  const [deck, setDeck] = React.useState(null);

  React.useEffect(() => {
    if (!deckId) return;
    DeckEntity.get(deckId).then(setDeck).catch(() => setDeck(null));
  }, [deckId]);

  return (
    <div className="min-h-screen px-4 md:px-8 lg:px-12 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl("DashboardHub")}>
          <Button
            variant="secondary"
            className="bg-white/10 border border-white/10 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {deck?.name || "Deck Gallery"}
        </h1>
      </div>

      {deckId ? (
        <CardGallery deckId={deckId} />
      ) : (
        <div className="text-white/80">No deck selected.</div>
      )}
    </div>
  );
}