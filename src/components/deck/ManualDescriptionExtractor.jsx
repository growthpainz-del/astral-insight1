
import React, { useState, useCallback } from 'react';
import { Card as CardEntity, Deck } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card'; // UI Card component, aliased above as CardEntity
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Although not explicitly used in the final render, it's a UI component related to forms
import {
  Loader2,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Wand2,
  Edit3
} from "lucide-react";
import { InvokeLLM } from '@/integrations/Core';

export default function ManualDescriptionExtractor({ deck, onComplete }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [detectedFields, setDetectedFields] = useState(null);
  const [customFieldsEditing, setCustomFieldsEditing] = useState(false);
  const [results, setResults] = useState([]);

  // Fallback: Standard extraction without custom fields, if no custom fields are detected or approved.
  const extractStandardData = useCallback(async () => {
    setIsExtracting(true);
    setStatus("Extracting standard card data...");
    setProgress(0);
    const extractionResults = [];

    try {
      const existingCards = await CardEntity.filter({ deck_id: deck.id });
      const manualContent = deck.manual_content || "";

      if (!manualContent || manualContent.trim() === "") {
        throw new Error("No manual content found in the deck for extraction.");
      }

      // Prompt the LLM to extract all standard meanings for all cards at once
      const extractionPrompt = `
          From the provided deck manual, extract the following fields for ALL cards:
          - card name (must be exact)
          - overall_meaning
          - upright_meaning
          - reversed_meaning

          If a field is not present for a card, return an empty string for it.
          Do not invent or create content. Only extract it from the text.
          If the text contains custom fields like 'hard_truth::The Hard Truth|...', IGNORE THEM.
          Only extract the standard fields.

          Return a JSON array of card objects with these fields.

          Manual content:
          ---
          ${manualContent}
          ---
      `;

      const extractedData = await InvokeLLM({
        prompt: extractionPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  overall_meaning: { type: "string" },
                  upright_meaning: { type: "string" },
                  reversed_meaning: { type: "string" },
                },
                required: ["name"]
              }
            }
          }
        }
      });

      const cardsFromLLM = extractedData?.cards || [];
      let successCount = 0;

      for (let i = 0; i < cardsFromLLM.length; i++) {
        const cardData = cardsFromLLM[i];

        try {
          const matchingCard = existingCards.find(
            c => c.name.toLowerCase() === cardData.name.toLowerCase()
          );

          if (matchingCard) {
            await CardEntity.update(matchingCard.id, {
              overall_meaning: cardData.overall_meaning || matchingCard.overall_meaning,
              upright_meaning: cardData.upright_meaning || matchingCard.upright_meaning,
              reversed_meaning: cardData.reversed_meaning || matchingCard.reversed_meaning,
              // Ensure custom_fields are not overwritten if they exist from a previous run
              // For standard extraction, we explicitly do not touch custom_fields.
            });

            extractionResults.push({
              name: cardData.name,
              status: "success",
              message: "Updated standard meanings"
            });
            successCount++;
          } else {
            extractionResults.push({
              name: cardData.name,
              status: "warning",
              message: "Card not found in deck for update"
            });
          }
        } catch (error) {
          extractionResults.push({
            name: cardData.name,
            status: "error",
            message: `Error updating card: ${error.message}`
          });
        }
        setProgress(((i + 1) / cardsFromLLM.length) * 100);
      }
      setResults(extractionResults);
      setStatus(`Extraction complete! Updated ${successCount} cards with standard meanings.`);

      if (successCount > 0) {
        setTimeout(() => {
          onComplete();
        }, 3000);
      }

    } catch (error) {
      console.error("Standard extraction failed:", error);
      setStatus("Standard extraction failed: " + error.message);
      setResults(prev => [...prev, { name: "Overall", status: "error", message: error.message }]);
    } finally {
      setIsExtracting(false);
    }
  }, [deck, onComplete]);


  // Step 1: Analyze manual to detect custom fields
  const analyzeManualStructure = async () => {
    setIsAnalyzing(true);
    setStatus("Analyzing manual structure...");

    try {
      const manualContent = deck.manual_content || "";

      if (!manualContent || manualContent.trim() === "") {
        alert("No manual content found in the deck. Please upload a manual first.");
        setIsAnalyzing(false);
        return;
      }

      const analysisPrompt = `Analyze this oracle/tarot deck manual and identify what types of information are provided for EACH card.

Manual excerpt:
${manualContent.substring(0, 15000)}

TASK: Identify recurring fields/sections that appear for each card beyond the basics (name, meaning, description).

Examples of custom fields you might find:
- Scripture/Biblical reference
- Prayer or invocation
- Affirmation or mantra
- Ritual or practice
- Historical context
- Mythology reference
- Planetary association
- Color correspondence
- Crystal/stone pairing
- Meditation guidance

Return ONLY a JSON object with this structure:
{
  "detected_fields": [
    {
      "field_name": "prayer",
      "label": "Prayer",
      "category": "scripture",
      "example": "An example from the manual"
    }
  ],
  "confidence": "high/medium/low"
}`;

      const detectionResult = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            detected_fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field_name: { type: "string" },
                  label: { type: "string" },
                  category: { type: "string" },
                  example: { type: "string" }
                }
              }
            },
            confidence: { type: "string" }
          }
        }
      });

      setDetectedFields(detectionResult);
      setStatus("Custom fields detected!");

    } catch (error) {
      console.error("Failed to analyze manual:", error);
      setStatus("Analysis failed: " + error.message);
    }

    setIsAnalyzing(false);
  };

  // Step 2: Extract card data with approved custom fields
  const extractWithCustomFields = async () => {
    if (!detectedFields || !detectedFields.detected_fields || detectedFields.detected_fields.length === 0) {
      // No custom fields detected or approved, fall back to standard extraction
      alert("No custom fields detected or approved. Proceeding with standard meaning extraction only.");
      await extractStandardData();
      return;
    }

    setIsExtracting(true);
    setStatus("Extracting cards with custom fields...");
    setProgress(0);
    const extractionResults = [];

    try {
      // First, update the deck with the custom field definitions
      const customFieldsConfig = {};
      detectedFields.detected_fields.forEach(field => {
        customFieldsConfig[field.field_name] = {
          label: field.label,
          category: field.category || "other"
        };
      });

      await Deck.update(deck.id, {
        custom_fields: customFieldsConfig
      });

      // Get existing cards
      const existingCards = await CardEntity.filter({ deck_id: deck.id });
      const manualContent = deck.manual_content || "";

      if (!manualContent || manualContent.trim() === "") {
        throw new Error("No manual content found in the deck for extraction.");
      }

      // Build extraction prompt with custom fields
      const customFieldsList = detectedFields.detected_fields
        .map(f => `- ${f.label} (${f.field_name})`)
        .join('\n');

      const extractionPrompt = `Extract card information from this deck manual, including ALL custom fields.

Manual content:
${manualContent}

Extract data for ALL cards. For EACH card, include:
- Card name (required)
- Standard meanings: overall_meaning, upright_meaning, reversed_meaning
- Custom fields:
${customFieldsList}

Return a JSON array of card objects with all fields populated.`;

      const extractedData = await InvokeLLM({
        prompt: extractionPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  overall_meaning: { type: "string" }, // Added overall_meaning to schema
                  upright_meaning: { type: "string" },
                  reversed_meaning: { type: "string" },
                  custom_fields: {
                    type: "object",
                    additionalProperties: { type: "string" }
                  }
                },
                required: ["name"]
              }
            }
          }
        }
      });

      const extractedCards = extractedData?.cards || [];
      let successCount = 0;
      let cardNumber = 1; // Sequential numbering based on extraction order

      for (let i = 0; i < extractedCards.length; i++) {
        const cardData = extractedCards[i];

        try {
          const matchingCard = existingCards.find(
            c => c.name.toLowerCase() === cardData.name.toLowerCase()
          );

          if (matchingCard) {
            const formattedCustomFields = {};
            if (cardData.custom_fields) {
              Object.entries(cardData.custom_fields).forEach(([key, value]) => {
                const fieldConfig = customFieldsConfig[key];
                if (fieldConfig && value && value.trim() !== "") {
                  formattedCustomFields[key] = {
                    label: fieldConfig.label,
                    value: value,
                    category: fieldConfig.category
                  };
                }
              });
            }

            await CardEntity.update(matchingCard.id, {
              number: cardNumber, // Assign sequential number based on order in manual
              overall_meaning: cardData.overall_meaning || matchingCard.overall_meaning,
              upright_meaning: cardData.upright_meaning || matchingCard.upright_meaning,
              reversed_meaning: cardData.reversed_meaning || matchingCard.reversed_meaning,
              custom_fields: formattedCustomFields // Overwrite/set custom fields
            });

            extractionResults.push({
              name: cardData.name,
              status: "success",
              message: `Updated as card #${cardNumber} with ${Object.keys(formattedCustomFields).length} custom fields`
            });
            successCount++;
            cardNumber++; // Increment for next card
          } else {
            extractionResults.push({
              name: cardData.name,
              status: "warning",
              message: "Card not found in deck"
            });
          }
        } catch (error) {
          extractionResults.push({
            name: cardData.name,
            status: "error",
            message: error.message
          });
        }

        setProgress(((i + 1) / extractedCards.length) * 100);
      }

      setResults(extractionResults);
      setStatus(`Extraction complete! Updated ${successCount} cards with custom fields.`);

      if (successCount > 0) {
        setTimeout(() => {
          onComplete();
        }, 3000);
      }

    } catch (error) {
      console.error("Extraction failed:", error);
      setStatus("Extraction failed: " + error.message);
      setResults(prev => [...prev, { name: "Overall", status: "error", message: error.message }]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEditField = (index, key, value) => {
    const updated = { ...detectedFields };
    if (updated.detected_fields && updated.detected_fields[index]) {
      updated.detected_fields[index][key] = value;
      setDetectedFields(updated);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-purple-900/20 border-purple-700/50 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-400" />
          Smart Manual Extraction
        </h3>
        <p className="text-purple-200 mb-4">
          AI will analyze your manual to detect custom fields (prayers, affirmations, scriptures, etc.) and extract them automatically.
        </p>

        {!detectedFields && ( // Only show "Detect Custom Fields" button if analysis hasn't run yet
          <Button
            onClick={analyzeManualStructure}
            disabled={isAnalyzing}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Manual Structure...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Step 1: Detect Custom Fields
              </>
            )}
          </Button>
        )}

        {detectedFields && !isExtracting && ( // Show detected fields and extraction button if fields are detected and not currently extracting
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Detected Custom Fields ({detectedFields.detected_fields.length}):</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomFieldsEditing(!customFieldsEditing)}
                className="text-purple-300 hover:text-purple-100 hover:bg-purple-800/30"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {customFieldsEditing ? "Done Editing" : "Edit"}
              </Button>
            </div>

            {detectedFields.detected_fields.length === 0 ? (
              <p className="text-purple-300 italic">No specific custom fields were detected. Only standard meanings will be extracted.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {detectedFields.detected_fields.map((field, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4">
                    {customFieldsEditing ? (
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`field-label-${index}`} className="text-purple-200">Label</Label>
                          <Input
                            id={`field-label-${index}`}
                            value={field.label}
                            onChange={(e) => handleEditField(index, 'label', e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`field-category-${index}`} className="text-purple-200">Category</Label>
                          <Input
                            id={`field-category-${index}`}
                            value={field.category}
                            onChange={(e) => handleEditField(index, 'category', e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white">{field.label}</span>
                          <Badge variant="outline" className="border-purple-500 text-purple-300 bg-purple-950/50">
                            {field.category || 'other'}
                          </Badge>
                        </div>
                        {field.example && (
                            <p className="text-sm text-purple-300 italic line-clamp-2">
                            Example: "{field.example}"
                            </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}


            <Button
              onClick={extractWithCustomFields}
              disabled={isExtracting}
              className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Step 2: Extract All Cards {detectedFields.detected_fields.length > 0 ? "with Custom Fields" : "Standard Meanings"}
                </>
              )}
            </Button>
          </div>
        )}

        {isExtracting && ( // Show progress during extraction
          <div className="mt-4">
            <Progress value={progress} className="mb-2 bg-purple-900/50" indicatorColor="bg-blue-500" />
            <p className="text-sm text-purple-300 text-center">{status}</p>
          </div>
        )}

        {results.length > 0 && ( // Show extraction results
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            <h4 className="font-bold text-white mb-2">Extraction Results:</h4>
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 text-sm p-2 rounded ${
                  result.status === "success"
                    ? "bg-green-900/20 text-green-300"
                    : result.status === "warning"
                    ? "bg-yellow-900/20 text-yellow-300"
                    : "bg-red-900/20 text-red-300"
                }`}
              >
                {result.status === "success" ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <span className="font-bold">{result.name}</span>: {result.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
