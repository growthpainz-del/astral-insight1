import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Deck, Card as CardEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InvokeLLM } from "@/integrations/Core";
import { Wand2, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function DeckCreationWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCards, setGeneratedCards] = useState([]); // ADDED: Initialize state
  
  const [deckInfo, setDeckInfo] = useState({
    name: "",
    description: "",
    category: "oracle",
    theme: "",
    numberOfCards: 50
  });

  const [progress, setProgress] = useState(0);

  const generateDeck = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(10);
      
      const prompt = `Create a ${deckInfo.numberOfCards}-card ${deckInfo.category} deck with the following theme: ${deckInfo.theme}.
      
Deck Name: ${deckInfo.name}
Description: ${deckInfo.description}

Generate exactly ${deckInfo.numberOfCards} unique cards. Each card should have:
- name: A unique, evocative name
- number: Sequential number (1 to ${deckInfo.numberOfCards})
- overall_meaning: Brief overview of the card's essence
- upright_meaning: Meaning when drawn upright
- upright_insight: Deeper insight for upright position
- upright_action: Recommended action when upright
- reversed_meaning: Meaning when drawn reversed
- reversed_insight: Deeper insight for reversed position
- reversed_action: Recommended action when reversed
- keywords: Array of 3-5 relevant keywords

Make the cards diverse, meaningful, and true to the theme.`;

      setProgress(30);

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  number: { type: "number" },
                  overall_meaning: { type: "string" },
                  upright_meaning: { type: "string" },
                  upright_insight: { type: "string" },
                  upright_action: { type: "string" },
                  reversed_meaning: { type: "string" },
                  reversed_insight: { type: "string" },
                  reversed_action: { type: "string" },
                  keywords: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["name", "number"]
              }
            }
          },
          required: ["cards"]
        }
      });

      setProgress(70);

      if (response && response.cards && response.cards.length > 0) {
        setGeneratedCards(response.cards); // FIXED: Use setGeneratedCards instead of generatedCards
        setProgress(100);
        setStep(2);
      } else {
        throw new Error("No cards were generated");
      }

    } catch (err) {
      setError(err.message || "Failed to generate deck");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDeck = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const newDeck = await Deck.create({
        name: deckInfo.name,
        description: deckInfo.description,
        category: deckInfo.category,
        author: "AI Generated"
      });

      const cardsWithDeckId = generatedCards.map(card => ({ // FIXED: Now generatedCards is defined
        ...card,
        deck_id: newDeck.id
      }));

      await CardEntity.bulkCreate(cardsWithDeckId);

      // THE HAND-OFF:
      // Instead of going to the dashboard, navigate to the manual manager
      // and trigger the AI assistant automatically.
      navigate(createPageUrl(`DeckManualManager?deckId=${newDeck.id}&startAi=true`));

    } catch (err) {
      setError(err.message || "Failed to save deck");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-indigo-950/20 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Wand2 className="w-10 h-10 text-purple-400" />
            AI Deck Creation Wizard
          </h1>
          <p className="text-purple-200">Let AI generate a complete custom deck for you</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-200">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    Step 1: Define Your Deck
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-purple-200 block mb-2">Deck Name</label>
                    <Input
                      value={deckInfo.name}
                      onChange={(e) => setDeckInfo({...deckInfo, name: e.target.value})}
                      placeholder="e.g., Cosmic Wisdom Oracle"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-purple-200 block mb-2">Description</label>
                    <Textarea
                      value={deckInfo.description}
                      onChange={(e) => setDeckInfo({...deckInfo, description: e.target.value})}
                      placeholder="Describe the purpose and essence of your deck..."
                      className="bg-white/10 border-white/20 text-white h-24"
                    />
                  </div>

                  <div>
                    <label className="text-purple-200 block mb-2">Theme / Focus</label>
                    <Textarea
                      value={deckInfo.theme}
                      onChange={(e) => setDeckInfo({...deckInfo, theme: e.target.value})}
                      placeholder="e.g., Ancient Egyptian wisdom, Modern witchcraft, Nature spirits..."
                      className="bg-white/10 border-white/20 text-white h-24"
                    />
                  </div>

                  <div>
                    <label className="text-purple-200 block mb-2">Number of Cards</label>
                    <Input
                      type="number"
                      value={deckInfo.numberOfCards}
                      onChange={(e) => setDeckInfo({...deckInfo, numberOfCards: parseInt(e.target.value) || 50})}
                      min="10"
                      max="78"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <Button
                    onClick={generateDeck}
                    disabled={isGenerating || !deckInfo.name || !deckInfo.theme}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate Deck with AI
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-center text-purple-300 text-sm">
                        {progress < 30 && "Preparing generation..."}
                        {progress >= 30 && progress < 70 && "Creating cards..."}
                        {progress >= 70 && "Finalizing deck..."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    Step 2: Review & Save
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-900/20 border border-green-500/40 rounded-xl p-4">
                    <p className="text-green-200">
                      ✨ Successfully generated {generatedCards.length} unique cards!
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {generatedCards.map((card, index) => (
                      <div
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-bold">{card.name}</h3>
                          <Badge className="bg-purple-600">{card.number}</Badge>
                        </div>
                        <p className="text-purple-200 text-sm">{card.overall_meaning}</p>
                        {card.keywords && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {card.keywords.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setStep(1);
                        setGeneratedCards([]);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Start Over
                    </Button>
                    <Button
                      onClick={saveDeck}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Save Deck
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}