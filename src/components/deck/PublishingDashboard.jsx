import React, { useState, useEffect } from "react";
import { Card } from "@/entities/Card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertCircle, Send, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PublishingDashboard({ deck, onUpdate }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadCards = async () => {
      if (!deck?.id) return;
      try {
        const deckCards = await Card.filter({ deck_id: deck.id });
        setCards(deckCards || []);
      } catch (e) {
        console.error("Failed to load cards:", e);
      } finally {
        setLoading(false);
      }
    };
    loadCards();
  }, [deck?.id]);

  const requirements = [
    {
      id: "name",
      label: "Deck has a name",
      required: true,
      check: () => !!deck?.name?.trim(),
    },
    {
      id: "description",
      label: "Deck has a description",
      required: true,
      check: () => !!deck?.description?.trim(),
    },
    {
      id: "category",
      label: "Category selected",
      required: true,
      check: () => !!deck?.category,
    },
    {
      id: "cover",
      label: "Cover image uploaded",
      required: true,
      check: () => !!deck?.cover_image?.trim(),
    },
    {
      id: "card_count",
      label: "At least 20 cards created",
      required: true,
      check: () => cards.length >= 20,
    },
    {
      id: "card_images",
      label: "All cards have images",
      required: true,
      check: () => {
        if (cards.length === 0) return false;
        return cards.every(c => c.image_url?.trim());
      },
    },
    {
      id: "card_meanings",
      label: "At least 80% of cards have meanings",
      required: false,
      check: () => {
        if (cards.length === 0) return false;
        const withMeanings = cards.filter(c =>
          c.overall_meaning?.trim() ||
          c.upright_meaning?.trim() ||
          c.reversed_meaning?.trim()
        );
        return (withMeanings.length / cards.length) >= 0.8;
      },
    },
    {
      id: "manual",
      label: "Reading manual generated",
      required: false,
      check: () => {
        const hasManualFiles = Array.isArray(deck?.manual_files) && deck.manual_files.length > 0;
        const hasLegacyManual = !!deck?.manual_content?.trim();
        return hasManualFiles || hasLegacyManual;
      },
    },
  ];

  const results = requirements.map(r => ({
    ...r,
    passed: r.check(),
  }));

  const requiredResults = results.filter(r => r.required);
  const allRequiredPassed = requiredResults.every(r => r.passed);
  const completedCount = results.filter(r => r.passed).length;

  const canSubmit =
    allRequiredPassed &&
    deck?.publish_status !== "pending_review" &&
    deck?.publish_status !== "published";

  const handleSubmitForReview = async () => {
    if (!canSubmit) return;

    if (!confirm(`Submit "${deck.name}" for review?\n\nYou'll receive an email when it's approved or if changes are needed.`)) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // FIXED: Call backend function instead of using asServiceRole in frontend
      const { data } = await base44.functions.invoke("submitDeckForReview", { 
        deckId: deck.id 
      });

      if (data?.status === 'error') {
        throw new Error(data.error || 'Failed to submit deck');
      }

      console.log('✅ Deck submitted successfully');
      
      if (onUpdate) await onUpdate();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (err) {
      console.error("Failed to submit for review:", err);
      setError(err.message || "Failed to submit deck for review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm(`Unpublish "${deck.name}"?\n\nThis will remove it from the public gallery.`)) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // FIXED: Call backend function
      const { data } = await base44.functions.invoke("unpublishDeck", { 
        deckId: deck.id 
      });

      if (data?.status === 'error') {
        throw new Error(data.error || 'Failed to unpublish deck');
      }

      console.log('✅ Deck unpublished successfully');
      
      if (onUpdate) await onUpdate();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      
    } catch (err) {
      console.error("Failed to unpublish:", err);
      setError(err.message || "Failed to unpublish deck. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
        <p className="text-white/70">Loading publishing requirements...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Publishing Requirements</h3>
          <p className="text-sm text-white/70">
            {completedCount} of {requirements.length} items completed
          </p>
        </div>
        {deck?.publish_status === "pending_review" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40">
            <Circle className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-sm font-semibold text-yellow-200">Pending Review</span>
          </div>
        )}
        {deck?.publish_status === "published" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-200">Published</span>
          </div>
        )}
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {results.map((req) => (
          <div
            key={req.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              req.passed
                ? "bg-green-500/10 border border-green-500/30"
                : req.required
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-white/5 border border-white/10"
            }`}
          >
            {req.passed ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : req.required ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-white/40 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium block ${
                req.passed ? "text-green-200" : req.required ? "text-red-200" : "text-white/70"
              }`}>
                {req.label}
              </span>
            </div>
            {req.required && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold flex-shrink-0">
                Required
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-200 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span>Operation successful!</span>
        </div>
      )}

      {/* Submit Section */}
      <div className="pt-4 border-t border-white/10 space-y-3 pb-6 md:pb-0">
        {!allRequiredPassed && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-amber-200 text-sm">
              ⚠️ Complete all required items above to submit your deck for review.
            </p>
          </div>
        )}

        {deck?.publish_status === "rejected" && deck?.review_notes && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-200 text-sm font-semibold mb-1">❌ Deck Rejected</p>
            <p className="text-red-200 text-sm">{deck.review_notes}</p>
            <p className="text-red-300 text-xs mt-2">Fix the issues above and resubmit.</p>
          </div>
        )}

        {deck?.publish_status === "published" ? (
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUnpublish}
              disabled={submitting}
              className="w-full text-base font-bold py-3 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5 mr-2" />
                  Unpublish Deck
                </>
              )}
            </Button>
            <p className="text-center text-sm text-white/60">
              Your deck is currently live and visible to the public. You can unpublish it at any time.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleSubmitForReview}
            disabled={!canSubmit || submitting}
            className={`w-full text-base font-bold py-6 ${
              canSubmit
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25"
                : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting for Review...
              </>
            ) : deck?.publish_status === "pending_review" ? (
              <>
                <Circle className="w-5 h-5 mr-2 animate-pulse" />
                Awaiting Admin Review
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        )}

        {deck?.publish_status === "pending_review" && (
          <p className="text-center text-sm text-white/60">
            Your deck is in the review queue. You'll be notified via email once it's approved.
          </p>
        )}
      </div>
    </div>
  );
}