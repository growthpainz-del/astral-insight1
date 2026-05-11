import React, { useState, useEffect } from "react";
import { Deck, Card, User } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Combine, Sparkles, Wand2, Loader2, AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { isNetworkError } from "@/components/utils/isNetworkError";

const spreads = {
  "5_card_insight": { name: "5 Card Insight", cards: 5 },
  "7_card_diamond": { name: "7 Card Diamond", cards: 7 },
  "7_card_path": { name: "7 Card Path Forward", cards: 7 },
};

export default function FusionReading() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [selectedSpread, setSelectedSpread] = useState("5_card_insight");
  const [selectedDeck1, setSelectedDeck1] = useState("");
  const [selectedDeck2, setSelectedDeck2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reading, setReading] = useState(null);
  const [error, setError] = useState(null);
  const [allDecks, setAllDecks] = useState([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingDecks(true);
      setError(null);
      
      try {
        const [fetchedDecks, currentUser] = await Promise.all([
          queueApiCall(() => Deck.list("-created_date", 200)),
          queueApiCall(() => User.me()).catch(() => null)
        ]);

        setUser(currentUser);
        setAllDecks(fetchedDecks || []);

        // Auto-select first two decks if none selected
        if (!selectedDeck1 && fetchedDecks.length > 0) {
          setSelectedDeck1(fetchedDecks[0].id);
        }
        if (!selectedDeck2 && fetchedDecks.length > 1) {
          setSelectedDeck2(fetchedDecks[1].id);
        }

      } catch (err) {
        if (isNetworkError(err)) {
          setError("Network connection issue. Please check your internet and try again.");
        } else {
          setError("Failed to load decks. Please refresh the page.");
        }
      } finally {
        setIsLoadingDecks(false);
      }
    };

    loadData();
  }, []);

  const generateFusionReading = async () => {
    if (!question.trim()) {
      setError("Please enter a question for your fusion reading.");
      return;
    }

    if (!selectedDeck1 || !selectedDeck2) {
      setError("Please select both decks for the fusion.");
      return;
    }

    if (selectedDeck1 === selectedDeck2) {
      setError("Please select two different decks for a fusion reading.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setReading(null);

    try {
      const deck1 = allDecks.find(d => d.id === selectedDeck1);
      const deck2 = allDecks.find(d => d.id === selectedDeck2);

      if (!deck1 || !deck2) {
        throw new Error("Selected decks not found");
      }

      const [deck1Cards, deck2Cards] = await Promise.all([
        queueApiCall(() => Card.filter({ deck_id: deck1.id })),
        queueApiCall(() => Card.filter({ deck_id: deck2.id }))
      ]);

      if (deck1Cards.length === 0 || deck2Cards.length === 0) {
        throw new Error(`One or both decks have no cards available.`);
      }

      const spreadInfo = spreads[selectedSpread];
      const drawnCards = [];

      // Alternate between decks
      for (let i = 0; i < spreadInfo.cards; i++) {
        if (i % 2 === 0) {
          const randomCard = deck1Cards[Math.floor(Math.random() * deck1Cards.length)];
          drawnCards.push({
            ...randomCard,
            deck: deck1.name,
            position: i + 1,
            is_reversed: Math.random() < 0.3
          });
        } else {
          const randomCard = deck2Cards[Math.floor(Math.random() * deck2Cards.length)];
          drawnCards.push({
            ...randomCard,
            deck: deck2.name,
            position: i + 1,
            is_reversed: Math.random() < 0.3
          });
        }
      }

      const fusionPrompt = `You are performing a **Deck Fusion Reading** that blends the wisdom of two oracle decks.

**Question:** ${question}

**Spread:** ${spreadInfo.name}

**Deck 1:** ${deck1.name}
${deck1.description ? `Theme: ${deck1.description}` : ''}

**Deck 2:** ${deck2.name}
${deck2.description ? `Theme: ${deck2.description}` : ''}

**Cards Drawn (Alternating):**
${drawnCards.map((card, index) => `
Position ${index + 1}: **${card.name}** (${card.deck}) ${card.is_reversed ? '- REVERSED' : '- UPRIGHT'}
- Overall: ${card.overall_meaning || 'Not available'}
- ${card.is_reversed ? 'Reversed' : 'Upright'} Meaning: ${card.is_reversed ? (card.reversed_meaning || 'Not available') : (card.upright_meaning || 'Not available')}
${card.keywords && card.keywords.length > 0 ? '- Keywords: ' + card.keywords.join(', ') : ''}
`).join('\n')}

**Your Task:**
1. Analyze each card individually considering its deck context
2. Identify synergies and contrasts between the two deck energies
3. Create fusion interpretations that combine both perspectives
4. Address the question with integrated wisdom from both decks
5. Provide clear, actionable guidance

**Format your response as:**

# Fusion Reading: ${spreadInfo.name}

## Your Question
"${question}"

## The Blended Cards

[For each position, provide detailed fusion interpretation showing how both deck energies interact]

## Integrated Message

[Overall reading synthesis combining both deck energies]

## Action Steps

[Practical next steps that honor both deck perspectives]

Remember: Weave the wisdom of both decks together seamlessly for a unique, balanced perspective.`;

      const response = await queueApiCall(() => 
        base44.integrations.Core.InvokeLLM({
          prompt: fusionPrompt,
          add_context_from_internet: false
        })
      );

      // Update user reading count
      if (user) {
        try {
          const newCount = (user.total_ai_readings_count || 0) + 1;
          await queueApiCall(() => User.update(user.id, { total_ai_readings_count: newCount }));
        } catch (updateError) {
        }
      }

      setReading({
        question,
        spread: spreadInfo.name,
        deck1: deck1.name,
        deck2: deck2.name,
        cards: drawnCards,
        interpretation: response,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      if (isNetworkError(err)) {
        setError("Network connection issue. Failed to generate reading. Please try again.");
      } else {
        setError(err.message || "Failed to generate fusion reading. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoadingDecks(true);
    // Re-trigger the useEffect by resetting dependent state
    setAllDecks([]);
    setSelectedDeck1("");
    setSelectedDeck2("");
  };

  const availableDecks = allDecks.filter(d => 
    d.publish_status === "published" && !d.is_nsfw
  );

  if (isLoadingDecks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading decks...</p>
        </div>
      </div>
    );
  }

  if (availableDecks.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-indigo-950/20 p-4 md:p-8 overflow-y-auto pb-28" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-white/20 text-purple-200 hover:bg-white/10"
              size="icon"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-white">Deck Fusion Reading</h1>
          </div>
          
          <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Not Enough Decks</h2>
            <p className="text-amber-200 mb-4">
              You need at least 2 published decks to create a fusion reading.
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Browse Decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-indigo-950/20 p-4 md:p-8 overflow-y-auto pb-28" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="border-white/20 text-purple-200 hover:bg-white/10"
            size="icon"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-2">
              <Combine className="w-8 h-8 text-purple-400" />
              Deck Fusion Reading
            </h1>
            <p className="text-purple-200">Blend two decks for deeper insight</p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-900/20 border border-red-500/40 rounded-xl p-4 text-red-200 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
            </div>
            {error.includes("Network") && (
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="border-red-400/40 text-red-100 hover:bg-red-900/30"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Setup Form */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-400" />
              Setup Your Fusion
            </h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-purple-200 font-semibold mb-2 block">First Deck</label>
                  <Select value={selectedDeck1} onValueChange={setSelectedDeck1}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Choose first deck..." />
                    </SelectTrigger>
                    <SelectContent className="bg-indigo-900 border-indigo-700">
                      {availableDecks.map(deck => (
                        <SelectItem key={deck.id} value={deck.id} className="text-white hover:bg-indigo-800">
                          {deck.name} {deck.is_premium && "⭐"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-purple-200 font-semibold mb-2 block">Second Deck</label>
                  <Select value={selectedDeck2} onValueChange={setSelectedDeck2}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Choose second deck..." />
                    </SelectTrigger>
                    <SelectContent className="bg-indigo-900 border-indigo-700">
                      {availableDecks.map(deck => (
                        <SelectItem key={deck.id} value={deck.id} className="text-white hover:bg-indigo-800">
                          {deck.name} {deck.is_premium && "⭐"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-purple-200 font-semibold mb-2 block">Your Question</label>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What guidance do you seek from this fusion?"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-purple-200 font-semibold mb-2 block">Spread Type</label>
                <Select value={selectedSpread} onValueChange={setSelectedSpread}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-indigo-700">
                    {Object.entries(spreads).map(([key, spread]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-indigo-800">
                        {spread.name} ({spread.cards} cards)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateFusionReading}
                disabled={isLoading || !question.trim() || !selectedDeck1 || !selectedDeck2 || selectedDeck1 === selectedDeck2}
                className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white shadow-lg py-6 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Fusion Reading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Fusion Reading
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Reading Result */}
          <AnimatePresence>
            {reading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
              >
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{reading.interpretation}</ReactMarkdown>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4">Cards in This Fusion</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reading.cards.map((card, index) => (
                      <div key={index} className="bg-black/20 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-300">Position {card.position}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            card.deck === reading.deck1
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {card.deck}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mb-1">
                          {card.name} {card.is_reversed && "(Reversed)"}
                        </h4>
                        {card.image_url && (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-full h-32 object-cover rounded mt-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}