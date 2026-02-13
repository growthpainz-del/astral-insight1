import React from "react";
import { base44 as base44Client } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Wand2, FileJson, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Sparkles, Trash2, RefreshCw, ListPlus, ImageIcon } from "lucide-react";

// AUTO-SAVE KEYS
const DRAFT_KEYS = {
  STEP: 'deck_creator_draft_step',
  DECK_DATA: 'deck_creator_draft_deck_data',
  COACHING: 'deck_creator_draft_coaching',
  SOURCE: 'deck_creator_draft_source',
  PREVIEW_CARDS: 'deck_creator_draft_preview_cards',
  JSON_TEXT: 'deck_creator_draft_json_text',
  AI_OPTIONS: 'deck_creator_draft_ai_options'
};

export default function CreateDeck() {
  const navigate = useNavigate();

  // RESTORE FROM DRAFT - WITH SAFE JSON PARSING AND ERROR RECOVERY
  const loadDraft = () => {
    const defaultState = {
      hasDraft: false,
      step: 1,
      deckData: {
        name: "",
        description: "",
        category: "oracle",
        is_public: false,
        is_nsfw: false,
        cover_image: "",
        back_image_url: "",
      },
      coaching: {
        philosophy: "",
        tone: "",
        cultural_context: "",
        interpretation_style: "",
        special_rules: "",
        rituals: "",
      },
      source: "json",
      previewCards: [],
      jsonText: "[]",
      aiOptions: {
        cardsCount: 10,
        themePrompt: "Create unique, inspiring oracle card names for this deck's theme.",
        generateDescriptions: true
      }
    };

    try {
      console.log("[CreateDeck] Loading draft from localStorage...");
      
      const savedStep = localStorage.getItem(DRAFT_KEYS.STEP);
      const savedDeckData = localStorage.getItem(DRAFT_KEYS.DECK_DATA);
      const savedCoaching = localStorage.getItem(DRAFT_KEYS.COACHING);
      const savedSource = localStorage.getItem(DRAFT_KEYS.SOURCE);
      const savedPreviewCards = localStorage.getItem(DRAFT_KEYS.PREVIEW_CARDS);
      const savedJsonText = localStorage.getItem(DRAFT_KEYS.JSON_TEXT);
      const savedAiOptions = localStorage.getItem(DRAFT_KEYS.AI_OPTIONS);

      console.log("[CreateDeck] Draft keys found:", {
        step: !!savedStep,
        deckData: !!savedDeckData,
        coaching: !!savedCoaching,
        source: !!savedSource,
        previewCards: !!savedPreviewCards,
        jsonText: !!savedJsonText,
        aiOptions: !!savedAiOptions
      });

      const safeParse = (jsonString, fallback, label) => {
        if (!jsonString || jsonString.trim() === '') {
          console.log(`[CreateDeck] ${label}: empty, using fallback`);
          return fallback;
        }
        try {
          // Additional validation before parsing
          const trimmed = jsonString.trim();
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            console.warn(`[CreateDeck] ${label}: Invalid JSON format, using fallback`);
            return fallback;
          }
          const parsed = JSON.parse(trimmed);
          console.log(`[CreateDeck] ${label}: parsed successfully`);
          return parsed;
        } catch (e) {
          console.error(`[CreateDeck] Failed to parse ${label}:`, e.message);
          // Clear this specific corrupted key
          try {
            const keyMap = {
              'deckData': DRAFT_KEYS.DECK_DATA,
              'coaching': DRAFT_KEYS.COACHING,
              'previewCards': DRAFT_KEYS.PREVIEW_CARDS,
              'aiOptions': DRAFT_KEYS.AI_OPTIONS
            };
            if (keyMap[label]) {
              localStorage.removeItem(keyMap[label]);
              console.log(`[CreateDeck] Cleared corrupted ${label} from localStorage`);
            }
          } catch (clearErr) {
            console.error(`[CreateDeck] Failed to clear ${label}:`, clearErr.message);
          }
          return fallback;
        }
      };

      const deckData = safeParse(savedDeckData, defaultState.deckData, "deckData");
      const coaching = safeParse(savedCoaching, defaultState.coaching, "coaching");
      const previewCards = safeParse(savedPreviewCards, [], "previewCards");
      const aiOptions = safeParse(savedAiOptions, defaultState.aiOptions, "aiOptions");

      const hasDraft = !!(savedStep || savedDeckData || savedCoaching || savedSource || savedPreviewCards || savedJsonText || savedAiOptions);

      console.log("[CreateDeck] Draft loaded:", { hasDraft, step: savedStep ? parseInt(savedStep) : 1, deckName: deckData.name });

      return {
        hasDraft,
        step: savedStep ? parseInt(savedStep) : 1,
        deckData,
        coaching,
        source: savedSource || "json",
        previewCards,
        jsonText: savedJsonText || "[]",
        aiOptions
      };
    } catch (e) {
      console.error("[CreateDeck] Critical error loading draft:", e);
      console.error("[CreateDeck] Full error details:", {
        message: e.message,
        stack: e.stack?.substring(0, 200)
      });
      console.warn("[CreateDeck] Clearing all draft data due to corruption");
      
      // Clear all corrupted draft data
      Object.values(DRAFT_KEYS).forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error("[CreateDeck] Failed to clear draft key:", key, err.message);
        }
      });
      
      // Show user-friendly error message
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          alert("⚠️ Corrupted draft data was detected and cleared. Starting fresh.");
        }, 100);
      }
      
      return defaultState;
    }
  };

  const draft = loadDraft();

  const [step, setStep] = React.useState(draft.step || 1);
  const [draftRestored, setDraftRestored] = React.useState(draft.hasDraft);
  const [deckData, setDeckData] = React.useState(draft.deckData);
  const [coachingAnswers, setCoachingAnswers] = React.useState(draft.coaching);
  const [source, setSource] = React.useState(draft.source);
  const [jsonText, setJsonText] = React.useState(draft.jsonText);
  const [parseError, setParseError] = React.useState(""); 
  const [detailedError, setDetailedError] = React.useState(""); 
  const [parseWarnings, setParseWarnings] = React.useState([]); 
  const [previewCards, setPreviewCards] = React.useState(draft.previewCards);
  const [spreads, setSpreads] = React.useState([]); 
  const [existingStats, setExistingStats] = React.useState({ existing: 0, toCreate: 0 }); 

  // AI generation options - STORE AS EMPTY STRING, NOT "1"
  const [cardsCount, setCardsCount] = React.useState(draft.aiOptions?.cardsCount ? String(draft.aiOptions.cardsCount) : "");
  const [themePrompt, setThemePrompt] = React.useState(draft.aiOptions?.themePrompt || "Create unique, inspiring oracle card names for this deck's theme.");
  const [generateDescriptions, setGenerateDescriptions] = React.useState(draft.aiOptions?.generateDescriptions !== false);
  const [autoGeneratePrompts, setAutoGeneratePrompts] = React.useState(true); 

  const [aiBusy, setAiBusy] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false); 
  const [creating, setCreating] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0, message: "" });
  const [createError, setCreateError] = React.useState(""); 

  // AUTO-SAVE EFFECT WITH BETTER ERROR HANDLING AND DEBOUNCING
  React.useEffect(() => {
    if (creating) {
      console.log("[CreateDeck] Skipping auto-save (creating in progress)");
      return;
    }
    
    // Debounce auto-save
    const timeoutId = setTimeout(() => {
      try {
        console.log("[CreateDeck] Auto-saving draft...");
        
        const safeStringify = (obj, label) => {
          try {
            // Validate object before stringifying
            if (obj === null || obj === undefined) {
              console.warn(`[CreateDeck] ${label}: null/undefined, saving empty object`);
              return JSON.stringify(Array.isArray(obj) ? [] : {});
            }
            
            const result = JSON.stringify(obj);
            const sizeKB = (result.length / 1024).toFixed(2);
            console.log(`[CreateDeck] ${label}: ${sizeKB}KB`);
            
            if (result.length > 100000) {
              console.warn(`[CreateDeck] ${label} is large (${sizeKB}KB) - may hit mobile limits`);
            }
            
            // Validate that the stringified result can be parsed back
            try {
              JSON.parse(result);
            } catch (parseErr) {
              console.error(`[CreateDeck] ${label}: stringify produced invalid JSON, using fallback`);
              return JSON.stringify(Array.isArray(obj) ? [] : {});
            }
            
            return result;
          } catch (e) {
            console.error(`[CreateDeck] Failed to stringify ${label}:`, e.message);
            return JSON.stringify(Array.isArray(obj) ? [] : {});
          }
        };

        let cardsToSave = previewCards;
        const fullCardsJson = JSON.stringify(previewCards);
        if (fullCardsJson.length > 200000) {
          console.warn("[CreateDeck] Preview cards too large, saving summary only");
          cardsToSave = previewCards.map(c => ({
            name: c.name,
            number: c.number,
            image_url: c.image_url,
          }));
        }

        localStorage.setItem(DRAFT_KEYS.STEP, step.toString());
        localStorage.setItem(DRAFT_KEYS.DECK_DATA, safeStringify(deckData, "deckData"));
        localStorage.setItem(DRAFT_KEYS.COACHING, safeStringify(coachingAnswers, "coaching"));
        localStorage.setItem(DRAFT_KEYS.SOURCE, source);
        localStorage.setItem(DRAFT_KEYS.PREVIEW_CARDS, safeStringify(cardsToSave, "previewCards"));
        localStorage.setItem(DRAFT_KEYS.JSON_TEXT, jsonText ? jsonText.slice(0, 50000) : "[]");
        localStorage.setItem(DRAFT_KEYS.AI_OPTIONS, safeStringify({
          cardsCount: cardsCount ? Number(cardsCount) : 10,
          themePrompt,
          generateDescriptions
        }, "aiOptions"));

        console.log("[CreateDeck] Auto-save complete ✅");
      } catch (e) {
        console.error("[CreateDeck] Auto-save failed:", e.message);
        
        if (e.name === 'QuotaExceededError') {
          console.error("[CreateDeck] Storage quota exceeded - draft may not be saved");
          setCreateError("⚠️ Browser storage full - your progress may not be saved. Try clearing browser cache or use 'Export Draft' to save your work.");
        }
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [step, deckData, coachingAnswers, source, previewCards, jsonText, cardsCount, themePrompt, generateDescriptions, creating]);

  const manualSave = () => {
    try {
      const exportData = {
        step,
        deckData,
        coachingAnswers,
        source,
        previewCards,
        aiOptions: {
          cardsCount: cardsCount ? Number(cardsCount) : 10,
          themePrompt,
          generateDescriptions
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deck-draft-${deckData.name || 'untitled'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("✅ Draft saved to downloads!");
    } catch (e) {
      console.error("[CreateDeck] Manual save failed:", e.message);
      alert("❌ Failed to save draft: " + e.message);
    }
  };

  const clearDraft = () => {
    if (!confirm("Clear all draft data and start fresh?")) return;
    
    console.log("[CreateDeck] Clearing all draft data...");
    
    Object.values(DRAFT_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("[CreateDeck] Failed to clear key:", key, e.message);
      }
    });
    
    setStep(1);
    setDeckData({
      name: "",
      description: "",
      category: "oracle",
      is_public: false,
      is_nsfw: false,
      cover_image: "",
      back_image_url: "",
    });
    setCoachingAnswers({
      philosophy: "",
      tone: "",
      cultural_context: "",
      interpretation_style: "",
      special_rules: "",
      rituals: "",
    });
    setSource("json");
    setJsonText("[]");
    setParseError(""); 
    setDetailedError(""); 
    setParseWarnings([]);
    setPreviewCards([]);
    setSpreads([]);
    setExistingStats({ existing: 0, toCreate: 0 });
    setCardsCount("");
    setThemePrompt("Create unique, inspiring oracle card names for this deck's theme.");
    setGenerateDescriptions(true);
    setDraftRestored(false);
    
    console.log("[CreateDeck] Draft cleared ✅");
  };

  const canNextFromStep1 = deckData.name.trim().length > 0;
  const canNextFromStep2 = source === "empty" ? true : previewCards.length > 0;

  const onDeckField = (key, value) => {
    setDeckData((d) => ({ ...d, [key]: value }));
  };

  const onCoachingField = (key, value) => {
    setCoachingAnswers((c) => ({ ...c, [key]: value }));
  };

  const generateCoachingDocument = () => {
    const sections = [];

    if (coachingAnswers.philosophy.trim()) {
      sections.push(`DECK PHILOSOPHY:\n${coachingAnswers.philosophy.trim()}`);
    }

    if (coachingAnswers.tone.trim()) {
      sections.push(`TONE & VOICE:\n${coachingAnswers.tone.trim()}`);
    }

    if (coachingAnswers.cultural_context.trim()) {
      sections.push(`CULTURAL/MYTHIC CONTEXT:\n${coachingAnswers.cultural_context.trim()}`);
    }

    if (coachingAnswers.interpretation_style.trim()) {
      sections.push(`INTERPRETATION APPROACH:\n${coachingAnswers.interpretation_style.trim()}`);
    }

    if (coachingAnswers.special_rules.trim()) {
      sections.push(`SPECIAL CONSIDERATIONS:\n${coachingAnswers.special_rules.trim()}`);
    }

    if (coachingAnswers.rituals.trim()) {
      sections.push(`RITUALS & INTEGRATION:\n${coachingAnswers.rituals.trim()}`);
    }

    return sections.length > 0 ? sections.join("\n\n") : "";
  };

  const goNext = () => {
    try {
      console.log("[CreateDeck] Moving to next step from step", step);
      setStep((s) => Math.min(3, s + 1));
    } catch (e) {
      console.error("[CreateDeck] Error in goNext:", e.message);
      setCreateError("Navigation error: " + (e.message || "Unknown"));
    }
  };

  const goBack = () => {
    try {
      console.log("[CreateDeck] Moving back from step", step);
      setStep((s) => Math.max(1, s - 1));
    } catch (e) {
      console.error("[CreateDeck] Error in goBack:", e.message);
      setCreateError("Navigation error: " + (e.message || "Unknown"));
    }
  };

  const toArrayMaybe = (val) => {
    if (Array.isArray(val)) return val;
    if (val === null || val === undefined) return [];
    return [val];
  };

  const normalizeImportedCards = (jsonString) => {
    let fullParsedObject = {};
    let cards = [];
    const warnings = [];

    try {
      const parsed = JSON.parse(jsonString);
      fullParsedObject = parsed;

      if (Array.isArray(parsed)) {
        cards = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed.cards)) {
          cards = parsed.cards;
        } else if (parsed.deck && Array.isArray(parsed.deck.cards)) {
          cards = parsed.deck.cards;
        }
      }
    } catch (e) {
      throw e;
    }

    cards = cards.map((card, index) => {
      if (typeof card !== 'object' || card === null) {
        warnings.push(`Card at index ${index} is not a valid object and was skipped.`);
        return null;
      }
      return card;
    }).filter(Boolean);

    return { cards, warnings, fullParsedObject };
  };

  const mapToCard = (rawCard, globalCustom = "") => {
    if (!rawCard || typeof rawCard !== 'object') return null;

    const cardName = String(rawCard.name || rawCard.title || rawCard.card_name || "").trim();
    if (!cardName) {
      console.warn("Skipping card due to missing name:", rawCard);
      return null;
    }

    return {
      name: cardName,
      subtitle: rawCard.subtitle || rawCard.text || "",
      image_url: rawCard.image_url || rawCard.image || "",
      video_url: rawCard.video_url || "",
      frame_style: rawCard.frame_style || "none",
      number: rawCard.number != null ? Number(rawCard.number) : null,
      element: rawCard.element || "none",
      keywords: toArrayMaybe(rawCard.keywords),
      ancient_wisdom: rawCard.ancient_wisdom || rawCard.science_slip || "",
      overall_meaning: rawCard.overall_meaning || rawCard.meaning || "",
      upright_meaning: rawCard.upright_meaning || rawCard.upright || "",
      upright_insight: rawCard.upright_insight || "",
      upright_action: rawCard.upright_action || "",
      reversed_meaning: rawCard.reversed_meaning || rawCard.reverse_meaning || rawCard.reversed || rawCard.reverse || "",
      reversed_insight: rawCard.reversed_insight || "",
      reversed_action: rawCard.reversed_action || "",
      interaction: rawCard.interaction || "",
      musician_quote: rawCard.musician_quote || "",
      facedown_meaning: rawCard.facedown_meaning || "",
      custom: rawCard.custom || rawCard.custom_ai_notes || rawCard.custom_notes || globalCustom,
      ai_image_prompt: rawCard.ai_image_prompt || rawCard.ai_prompt || "",
      ai_image_negative_prompt: rawCard.ai_image_negative_prompt || "",
      ai_prompt_style: rawCard.ai_prompt_style || "",
      ai_reference_image_url: rawCard.ai_reference_image_url || "",
    };
  };

  const prepareCardsWithImageUrls = async ({ cards }) => {
    // This function would typically interact with an image processing service
    // For now, it just passes cards through.
    return cards;
  };

  const ensureCardsHavePrompts = async (cards, deckNameHint) => {
    // This function would typically interact with an AI service to generate prompts
    // if `ai_prompt` is missing or `autoGeneratePrompts` is true.
    // For now, it just passes cards through.
    return cards;
  };

  const normalizeSpread = (rawSpread, defaultCategory = "General") => {
    if (!rawSpread || typeof rawSpread !== 'object') return null;

    const spreadName = String(rawSpread.name || rawSpread.title || "").trim();
    if (!spreadName) {
      console.warn("Skipping spread due to missing name:", rawSpread);
      return null;
    }

    return {
      name: spreadName,
      description: rawSpread.description || "",
      positions: toArrayMaybe(rawSpread.positions).map((pos, index) => ({
        position_number: pos.position_number != null ? Number(pos.position_number) : index + 1,
        name: pos.name || `Position ${index + 1}`,
        meaning: pos.meaning || "",
        ai_prompt: pos.ai_prompt || "",
      })),
      category: rawSpread.category || defaultCategory,
    };
  };

  const parseText = async (inputText) => {
    setIsParsing(true);
    setParseError("");
    setDetailedError("");
    setParseWarnings([]);
    setPreviewCards([]);
    setSpreads([]);
    setExistingStats({ existing: 0, toCreate: 0 });

    try {
      console.log("[CreateDeck] Starting parse, input length:", inputText.length);
      
      const trimmed = inputText.trim();
      if (!trimmed) {
        setParseError("Input is empty. Please paste your JSON data.");
        setIsParsing(false);
        return;
      }

      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        setParseError("Input must start with { or [. Please check your JSON format.");
        setIsParsing(false);
        return;
      }

      const { cards: preFilteredCards, warnings, fullParsedObject } = normalizeImportedCards(inputText);
      
      console.log("[CreateDeck] Parsed successfully:", preFilteredCards.length, "cards");
      setParseWarnings(warnings);

      if (preFilteredCards.length === 0 && (!fullParsedObject || Object.keys(fullParsedObject).length === 0)) {
        setParseError("No valid cards found in JSON. Please check the format.");
        setDetailedError("The JSON was valid but didn't contain any recognizable card objects. Make sure your JSON has a 'cards' array with card objects, or is a direct array of cards.");
        setIsParsing(false);
        return;
      }

      // NEW: Extract AI coaching fields from JSON
      const extractedCoaching = {
        philosophy: fullParsedObject.philosophy || fullParsedObject.deck_philosophy || fullParsedObject.ai_reading_coach_philosophy || "",
        tone: fullParsedObject.tone || fullParsedObject.voice || fullParsedObject.ai_reading_coach_tone || "",
        cultural_context: fullParsedObject.cultural_context || fullParsedObject.mythic_context || fullParsedObject.ai_reading_coach_cultural || "",
        interpretation_style: fullParsedObject.interpretation_style || fullParsedObject.approach || fullParsedObject.ai_reading_coach_interpretation || "",
        special_rules: fullParsedObject.special_rules || fullParsedObject.considerations || fullParsedObject.ai_reading_coach_rules || "",
        rituals: fullParsedObject.rituals || fullParsedObject.integration_practices || fullParsedObject.ai_reading_coach_rituals || ""
      };

      // NEW: Also try to extract from ai_reading_coach object if present
      if (fullParsedObject.ai_reading_coach && typeof fullParsedObject.ai_reading_coach === 'object') {
        extractedCoaching.philosophy = extractedCoaching.philosophy || fullParsedObject.ai_reading_coach.philosophy || "";
        extractedCoaching.tone = extractedCoaching.tone || fullParsedObject.ai_reading_coach.tone || "";
        extractedCoaching.cultural_context = extractedCoaching.cultural_context || fullParsedObject.ai_reading_coach.cultural_context || "";
        extractedCoaching.interpretation_style = extractedCoaching.interpretation_style || fullParsedObject.ai_reading_coach.interpretation_style || "";
        extractedCoaching.special_rules = extractedCoaching.special_rules || fullParsedObject.ai_reading_coach.special_rules || "";
        extractedCoaching.rituals = extractedCoaching.rituals || fullParsedObject.ai_reading_coach.rituals || "";
      }

      // NEW: Auto-populate coaching fields if found in JSON (only if current fields are empty)
      let coachingUpdated = false;
      const updatedCoaching = { ...coachingAnswers };
      
      Object.keys(extractedCoaching).forEach(key => {
        if (extractedCoaching[key] && extractedCoaching[key].trim() && !updatedCoaching[key].trim()) {
          updatedCoaching[key] = extractedCoaching[key].trim();
          coachingUpdated = true;
        }
      });

      if (coachingUpdated) {
        setCoachingAnswers(updatedCoaching);
        setParseWarnings(prev => [...prev, "✨ AI coaching fields auto-populated from JSON! Check Step 1 to review."]);
      }

      // NEW: Extract deck metadata if present
      if (!deckData.name && fullParsedObject.name) {
        onDeckField('name', fullParsedObject.name);
      }
      if (!deckData.description && fullParsedObject.description) {
        onDeckField('description', fullParsedObject.description);
      }
      if (!deckData.cover_image && fullParsedObject.cover_image) {
        onDeckField('cover_image', fullParsedObject.cover_image);
      }
      if (!deckData.back_image_url && fullParsedObject.back_image_url) {
        onDeckField('back_image_url', fullParsedObject.back_image_url);
      }

      const globalCustom = [
        fullParsedObject?.persona ? `Persona: ${fullParsedObject.persona}` : null,
        fullParsedObject?.persona_prompt ? `Persona Prompt: ${fullParsedObject.persona_prompt}` : null,
        fullParsedObject?.name ? `Deck: ${fullParsedObject.name}` : null,
        fullParsedObject?.description ? `Description: ${fullParsedObject.description}` : null,
        fullParsedObject?.notes ? `Notes: ${fullParsedObject.notes}` : null
      ].filter(Boolean).join("\n");

      const mappedCards = preFilteredCards.map(c => mapToCard(c, globalCustom)).filter(Boolean);

      let processedCardsForImages = await prepareCardsWithImageUrls({ cards: mappedCards });

      let finalCardsPayload = processedCardsForImages;
      if (autoGeneratePrompts) {
        const deckNameHint =
          fullParsedObject?.deck?.name ||
          fullParsedObject?.name ||
          fullParsedObject?.deck_name ||
          deckData.name || 
          "";
        finalCardsPayload = await ensureCardsHavePrompts(processedCardsForImages, deckNameHint);
      }
      setPreviewCards(Array.isArray(finalCardsPayload) ? finalCardsPayload : (finalCardsPayload.cards || []));

      const rawSpreads = toArrayMaybe(fullParsedObject?.spreads);
      const mappedSpreads = rawSpreads.map((s) => normalizeSpread(s, "General")).filter(Boolean);
      setSpreads(mappedSpreads);

      try {
        setExistingStats({ existing: 0, toCreate: mappedCards.length });
        
      } catch (e) {
        setExistingStats({ existing: 0, toCreate: mappedCards.length });
        console.error("Failed to compute existing card stats:", e);
      }
      
    } catch (e) {
      console.error("[CreateDeck] Parse error:", e);
      console.error("[CreateDeck] Error details:", {
        message: e.message,
        type: e.name,
        inputLength: inputText?.length || 0
      });
      
      const errorMsg = e.message || String(e);
      
      const lineMatch = errorMsg.match(/line (\d+)/i) || errorMsg.match(/position (\d+)/i);
      
      let userMessage = "Failed to parse JSON. ";
      
      if (errorMsg.includes("Unexpected token")) {
        userMessage += "There's an unexpected character in your JSON. ";
      } else if (errorMsg.includes("Expected")) {
        userMessage += "JSON syntax error (e.g., missing comma, unclosed bracket). ";
      } else if (errorMsg.includes("Unterminated")) {
        userMessage += "Unclosed string or object. ";
      } else if (errorMsg.includes("Unable to parse")) {
        userMessage += "The JSON format is invalid. ";
      }
      
      if (lineMatch) {
        userMessage += `Check around position ${lineMatch[1]}. `;
      }
      
      userMessage += "Try using the 'Auto-Fix & Parse' button or insert an example template.";
      
      setParseError(userMessage);
      setDetailedError(`Technical details: ${errorMsg}\n\nCommon causes:\n• Missing or extra comma\n• Unclosed bracket or brace\n• Missing quotes around text\n• Invalid escape characters\n• Corrupted data\n\nTip: Copy your JSON to jsonlint.com to validate and find errors.`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleParse = () => {
    parseText(jsonText);
  };

  const fixJsonString = (rawJson) => {
    let fixed = rawJson.trim();
    
    // Attempt to remove common issues like trailing commas before closing brackets/braces
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    
    // Attempt to remove single line comments
    fixed = fixed.split('\n').map(line => line.includes('//') ? line.substring(0, line.indexOf('//')) : line).join('\n');
    
    // Attempt to remove multi-line comments
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Attempt to wrap in array if it appears to be multiple root objects
    if (!fixed.startsWith('[') && !fixed.startsWith('{')) {
        // Heuristic: if it contains multiple objects separated by commas, wrap it.
        if (fixed.includes('},{') || fixed.includes('}\n{')) {
            fixed = `[${fixed.replace(/}\s*{/g, '},{')}]`;
        }
    }

    return fixed;
  };

  const handleAutoFixAndParse = () => {
    const fixedJson = fixJsonString(jsonText);
    if (fixedJson !== jsonText) {
      setJsonText(fixedJson); // Update textarea with fixed content
      console.log("[CreateDeck] Attempted auto-fix. New JSON length:", fixedJson.length);
    } else {
      console.log("[CreateDeck] Auto-fix did not change JSON content, attempting parse anyway.");
    }
    parseText(fixedJson);
  };

  const insertSkeleton = () => {
    const skeleton = `[
  {
    "name": "The Seeker",
    "number": 1,
    "overall_meaning": "Embrace curiosity, inner journey, new beginnings.",
    "upright_meaning": "Seeking truth, exploration, spiritual awakening.",
    "reversed_meaning": "Lost path, procrastination, fear of the unknown.",
    "keywords": ["quest", "discovery", "intuition"],
    "image_url": "https://example.com/seeker.jpg",
    "subtitle": "Embark on your sacred journey."
  },
  {
    "name": "The Weaver",
    "number": 2,
    "overall_meaning": "Interconnection, destiny, crafting your reality.",
    "upright_meaning": "Creating abundance, conscious manifestation, fate.",
    "reversed_meaning": "Tangled threads, feeling powerless, missed opportunities.",
    "keywords": ["creation", "connection", "fate"],
    "image_url": "https://example.com/weaver.jpg",
    "subtitle": "Spin the threads of your destiny."
  }
]`;
    setJsonText(skeleton);
    setParseError("");
    setDetailedError("");
    setParseWarnings([]);
  };
  
  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const handleAiGenerate = async () => {
    setAiBusy(true);
    setCreateError("");
    setPreviewCards([]); // Clear previous cards
    setProgress({ current: 0, total: 100, message: "Contacting AI..." });

    try {
      const numCards = Number(cardsCount);
      if (isNaN(numCards) || numCards <= 0) {
        throw new Error("Invalid number of cards specified.");
      }

      // Warn about large decks
      if (numCards > 50) {
        if (!confirm(`⚠️ Generating ${numCards} cards may take several minutes and use significant memory. Continue?`)) {
          setAiBusy(false);
          setProgress({ current: 0, total: 0, message: "" });
          return;
        }
      }

      const aiCoachingDoc = generateCoachingDocument();

      const payload = {
        deckName: deckData.name,
        deckDescription: deckData.description,
        cardsCount: numCards,
        themePrompt: themePrompt,
        generateDescriptions: generateDescriptions,
        coachingDocument: aiCoachingDoc,
      };

      console.log("[CreateDeck] AI generation payload:", payload);

      setProgress({ current: 10, message: "Preparing generation..." });

      // BATCH PROCESSING: Generate cards in smaller chunks to avoid crashes
      const BATCH_SIZE = 10; // Generate 10 cards at a time
      const batches = Math.ceil(numCards / BATCH_SIZE);
      const allGeneratedCards = [];

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, numCards);
        const currentBatchSize = batchEnd - batchStart;

        // Calculate progress based on 10% init, 60% for generation distributed across batches, 10% for final processing, 20% total
        const generationProgressSegment = (batchIndex / batches) * 60; // 60% of total progress for generation
        const currentProgress = 10 + generationProgressSegment; // 10% for init + calculated generation segment
        
        setProgress({
          current: currentProgress,
          total: 100,
          message: `Generating cards ${batchStart + 1}-${batchEnd} of ${numCards}...`
        });

        console.log(`[CreateDeck] Generating batch ${batchIndex + 1}/${batches}: cards ${batchStart + 1}-${batchEnd}`);

        // Simulate AI generation for this batch
        const batchCards = await new Promise((resolve) => {
          setTimeout(() => {
            const cards = Array.from({ length: currentBatchSize }).map((_, i) => {
              const cardNumber = batchStart + i + 1;
              return {
                name: `Generated Card ${cardNumber}`,
                number: cardNumber,
                overall_meaning: generateDescriptions ? `This is the overall meaning for Generated Card ${cardNumber}, based on the theme "${themePrompt}".` : "",
                upright_meaning: generateDescriptions ? `Upright meaning for Card ${cardNumber}.` : "",
                reversed_meaning: generateDescriptions ? `Reversed meaning for Card ${cardNumber}.` : "",
                keywords: [`keyword${cardNumber}a`, `keyword${cardNumber}b`],
                image_url: `https://via.placeholder.com/150/random?text=Card+${cardNumber}`,
                ancient_wisdom: generateDescriptions ? `Ancient wisdom related to Card ${cardNumber}.` : "",
                subtitle: generateDescriptions ? `A subtitle for Card ${cardNumber}.` : "",
                ai_image_prompt: `AI prompt for generating image for Card ${cardNumber} in theme ${themePrompt}.`,
                custom: aiCoachingDoc,
              };
            });
            resolve(cards);
          }, 2000); // 2 seconds per batch (more realistic than 3s for all)
        });

        allGeneratedCards.push(...batchCards);

        // Update preview incrementally so user sees progress
        const processedSoFar = allGeneratedCards.map(c => mapToCard(c, aiCoachingDoc)).filter(Boolean);
        setPreviewCards(processedSoFar);

        // Small delay between batches to let UI update
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setProgress({ current: 80, total: 100, message: "Finalizing cards..." });

      // Final processing
      const processedCards = allGeneratedCards.map(c => mapToCard(c, aiCoachingDoc)).filter(Boolean);
      setPreviewCards(processedCards);

      setProgress({ current: 100, total: 100, message: `✅ Generated ${processedCards.length} cards successfully!` });

      setExistingStats({ existing: 0, toCreate: processedCards.length });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setProgress({ current: 0, total: 0, message: "" });
      }, 3000);

    } catch (e) {
      console.error("[CreateDeck] AI generation error:", e.message);
      setCreateError(e.message || "Failed to generate cards with AI.");
      setProgress({ current: 0, total: 0, message: "" });
    } finally {
      setAiBusy(false);
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    setCreating(true);
    setProgress({ current: 0, total: 0, message: "Creating deck..." });

    try {
      console.log("[CreateDeck] Starting deck creation...");
      
      const aiCoachingDoc = generateCoachingDocument();
      console.log("[CreateDeck] AI coaching doc length:", aiCoachingDoc.length);

      console.log("[CreateDeck] Creating deck entity...");
      const deck = await base44Client.entities.Deck.create({
        ...deckData,
        ai_reading_coach: aiCoachingDoc,
      });
      console.log("[CreateDeck] Deck created with ID:", deck.id);

      const cardsToCreate =
        source === "empty"
          ? []
          : previewCards.map((c) => ({
              deck_id: deck.id, 
              name: c.name,
              subtitle: c.subtitle || "",
              image_url: c.image_url || "",
              video_url: c.video_url || "",
              frame_style: c.frame_style || "none",
              number: c.number,
              element: c.element || "none",
              keywords: c.keywords || [],
              ancient_wisdom: c.ancient_wisdom || "",
              overall_meaning: c.overall_meaning || "",
              upright_meaning: c.upright_meaning || "",
              upright_insight: c.upright_insight || "",
              upright_action: c.upright_action || "",
              reversed_meaning: c.reversed_meaning || "",
              reversed_insight: c.reversed_insight || "",
              reversed_action: c.reversed_action || "",
              interaction: c.interaction || "",
              musician_quote: c.musician_quote || "",
              facedown_meaning: c.facedown_meaning || "",
              custom: c.custom || "",
              ai_image_prompt: c.ai_image_prompt || "",
              ai_image_negative_prompt: c.ai_image_negative_prompt || "",
              ai_prompt_style: c.ai_prompt_style || "",
              ai_reference_image_url: c.ai_reference_image_url || "",
            }));

      console.log("[CreateDeck] Cards to create:", cardsToCreate.length);

      if (cardsToCreate.length > 0) {
        const batches = chunk(cardsToCreate, 50);
        let done = 0;
        setProgress({ current: 0, total: cardsToCreate.length, message: "Adding cards..." });
        for (const batch of batches) {
          console.log("[CreateDeck] Creating batch of", batch.length, "cards...");
          await base44Client.entities.Card.bulkCreate(batch);
          done += batch.length;
          setProgress({
            current: done,
            total: cardsToCreate.length,
            message: `Added ${done}/${cardsToCreate.length} cards...`,
          });
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      console.log("[CreateDeck] Clearing draft...");
      Object.values(DRAFT_KEYS).forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error("[CreateDeck] Failed to clear draft key:", key, e.message);
        }
      });
      setDraftRestored(false);

      console.log("[CreateDeck] All done! Navigating to deck...");
      setProgress((p) => ({ ...p, message: "Done. Opening deck..." }));
      
      setTimeout(() => {
        try {
          navigate(createPageUrl(`DeckView?id=${deck.id}`));
        } catch (navError) {
          console.error("[CreateDeck] Navigation error:", navError.message);
          window.location.href = createPageUrl(`DeckView?id=${deck.id}`);
        }
      }, 500);
      
    } catch (e) {
      console.error("[CreateDeck] Creation error:", e.message);
      setCreateError(e?.message || "Failed to create deck or cards.");
      setCreating(false);
    }
  };

  React.useEffect(() => {
    const handleError = (event) => {
      console.error("[CreateDeck] Uncaught error:", event.error?.message || event.error);
      setCreateError("An unexpected error occurred. Please try again.");
      setCreating(false);
      setAiBusy(false);
      setIsParsing(false); 
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Deck Creator Wizard</h1>
              <p className="text-white/70 mt-1">
                Create a new deck with AI-powered reading guidance built in.
              </p>
            </div>
            {step >= 2 && previewCards.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={manualSave}
                className="border-purple-400/40 text-purple-300 hover:bg-purple-900/20"
              >
                💾 Export Draft
              </Button>
            )}
          </div>
        </header>

        {/* DRAFT RESTORED BANNER */}
        {draftRestored && (
          <div className="mb-6 bg-blue-900/20 border border-blue-500/40 rounded-lg p-4 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-300">Draft Restored!</p>
              <p className="text-sm text-blue-200">Your previous work has been recovered. Auto-save is active.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDraft}
              className="text-blue-400 hover:text-blue-300"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Draft
            </Button>
          </div>
        )}

        {/* Global error display (for general creation errors) */}
        {createError && !creating && !aiBusy && ( 
          <div className="mb-6 bg-red-900/20 border border-red-500/40 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300 mb-1">Error</p>
                <p className="text-sm text-red-200 mb-2">{createError}</p>
                
                {detailedError && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-300 hover:text-red-200 mb-2">
                      Show technical details
                    </summary>
                    <div className="bg-black/30 rounded p-3 mt-2">
                      <pre className="text-xs text-red-200 whitespace-pre-wrap font-mono">
                        {detailedError}
                      </pre>
                    </div>
                  </details>
                )}
                
                {step === 2 && source === "json" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAutoFixAndParse}
                      disabled={isParsing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Try Auto-Fix
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={insertSkeleton}
                      className="border-red-500/40 text-red-300 hover:bg-red-900/20"
                    >
                      Use Example Template
                    </Button>
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreateError("");
                    setDetailedError("");
                  }}
                  className="text-red-400 hover:text-red-300 mt-2"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced error display for JSON parsing */}
        {parseError && !creating && !aiBusy && (
          <div className="mb-6 bg-red-900/20 border border-red-500/40 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300 mb-1">JSON Parse Error</p>
                <p className="text-sm text-red-200 mb-2">{parseError}</p>
                
                {detailedError && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-300 hover:text-red-200 mb-2">
                      Show technical details
                    </summary>
                    <div className="bg-black/30 rounded p-3 mt-2">
                      <pre className="text-xs text-red-200 whitespace-pre-wrap font-mono">
                        {detailedError}
                      </pre>
                    </div>
                  </details>
                )}
                
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAutoFixAndParse}
                    disabled={isParsing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Auto-Fix & Parse
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={insertSkeleton}
                    className="border-red-500/40 text-red-300 hover:bg-red-900/20"
                  >
                    Use Example Template
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setParseError("");
                      setDetailedError("");
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GLOBAL PROGRESS BAR - Shows for both AI generation and deck creation */}
        {(aiBusy || creating || isParsing) && progress.total > 0 && (
          <div className="mb-6 bg-purple-900/20 border border-purple-500/40 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-purple-300">{progress.message}</p>
                <p className="text-xs text-purple-200 mt-1">
                  {progress.total === 100 
                    ? `${Math.round(progress.current)}%` 
                    : `${progress.current} of ${progress.total} complete`}
                </p>
              </div>
            </div>
            <Progress 
              value={progress.total === 100 ? progress.current : (progress.current / progress.total) * 100} 
              className="h-2"
            />
            {aiBusy && (
              <p className="text-xs text-purple-300 mt-2">
                💡 This can take 30-60 seconds for larger decks. Please wait...
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`p-3 rounded-lg border ${step >= 1 ? "border-purple-400/50 bg-purple-400/10" : "border-white/10"}`}>
            <div className="text-xs text-white/70">Step 1</div>
            <div className="font-semibold">Deck details & AI coaching</div>
          </div>
          <div className={`p-3 rounded-lg border ${step >= 2 ? "border-purple-400/50 bg-purple-400/10" : "border-white/10"}`}>
            <div className="text-xs text-white/70">Step 2</div>
            <div className="font-semibold">Cards source</div>
          </div>
          <div className={`p-3 rounded-lg border ${step >= 3 ? "border-purple-400/50 bg-purple-400/10" : "border-white/10"}`}>
            <div className="text-xs text-white/70">Step 3</div>
            <div className="font-semibold">Review & create</div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80">Deck Name *</Label>
                  <Input
                    value={deckData.name}
                    onChange={(e) => onDeckField("name", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1"
                    placeholder="e.g., Moonlight Oracle"
                  />
                </div>
                <div>
                  <Label className="text-white/80">Category</Label>
                  <Select value={deckData.category} onValueChange={(v) => onDeckField("category", v)}>
                    <SelectTrigger className="bg-black/40 border-white/20 text-white mt-1">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="oracle">Oracle</SelectItem>
                      <SelectItem value="tarot">Tarot</SelectItem>
                      <SelectItem value="lenormand">Lenormand</SelectItem>
                      <SelectItem value="runes">Runes</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white/80">Description</Label>
                  <Textarea
                    value={deckData.description}
                    onChange={(e) => onDeckField("description", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[90px]"
                    placeholder="Tell us about this deck..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Reading Coach (Optional but Recommended)
                </h3>
                <p className="text-sm text-purple-200">
                  Answer these questions to help the AI understand how to read your deck.
                  This creates personalized, on-brand interpretations for every reading.
                  <strong className="block mt-2">Skip any questions that don't apply to your deck.</strong>
                </p>
                <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-cyan-200">
                    💡 <strong>Pro Tip:</strong> You can import these fields via JSON! Include <code className="bg-black/30 px-1 rounded text-xs">philosophy</code>, <code className="bg-black/30 px-1 rounded text-xs">tone</code>, <code className="bg-black/30 px-1 rounded text-xs">cultural_context</code>, <code className="bg-black/30 px-1 rounded text-xs">interpretation_style</code>, <code className="bg-black/30 px-1 rounded text-xs">special_rules</code>, <code className="bg-black/30 px-1 rounded text-xs">rituals</code> fields in your JSON and they'll auto-fill when you parse in Step 2.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/80">
                    1. What's the philosophy or worldview of this deck?
                  </Label>
                  <Textarea
                    value={coachingAnswers.philosophy}
                    onChange={(e) => onCoachingField("philosophy", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[80px]"
                    placeholder="e.g., This deck sees the world through feminine divine energy and lunar cycles..."
                  />
                </div>

                <div>
                  <Label className="text-white/80">
                    2. What tone and voice should readings have?
                  </Label>
                  <Textarea
                    value={coachingAnswers.tone}
                    onChange={(e) => onCoachingField("tone", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[80px]"
                    placeholder="e.g., Use poetic, evocative language. Balance grounding with transformation..."
                  />
                </div>

                <div>
                  <Label className="text-white/80">
                    3. Cultural or mythic context (if any)
                  </Label>
                  <Textarea
                    value={coachingAnswers.cultural_context}
                    onChange={(e) => onCoachingField("cultural_context", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[80px]"
                    placeholder="e.g., Connect cards to Greek mythology, Hawaiian traditions, seasonal festivals..."
                  />
                </div>

                <div>
                  <Label className="text-white/80">
                    4. How should cards be interpreted?
                  </Label>
                  <Textarea
                    value={coachingAnswers.interpretation_style}
                    onChange={(e) => onCoachingField("interpretation_style", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[80px]"
                    placeholder="e.g., Focus on empowerment, avoid fear-based readings, emphasize intuition over logic..."
                  />
                </div>

                <div>
                  <Label className="text-white/80">
                    5. Special rules or considerations
                  </Label>
                  <Textarea
                    value={coachingAnswers.special_rules}
                    onChange={(e) => onCoachingField("special_rules", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[80px]"
                    placeholder="e.g., Reversed cards are not negative but internalized; multiple court cards indicate relationships..."
                  />
                </div>

                <div>
                  <Label className="text-white/80">
                    6. Rituals or integration practices (optional)
                  </Label>
                  <Textarea
                    value={coachingAnswers.rituals}
                    onChange={(e) => onCoachingField("rituals", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1 min-h-[80px]"
                    placeholder="e.g., Encourage journaling, suggest crystal pairings, recommend meditation with card images..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80">Cover image URL (optional)</Label>
                  <Input
                    value={deckData.cover_image}
                    onChange={(e) => onDeckField("cover_image", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-white/80">Card back image URL (optional)</Label>
                  <Input
                    value={deckData.back_image_url}
                    onChange={(e) => onDeckField("back_image_url", e.target.value)}
                    className="bg-black/40 border-white/20 text-white mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-between bg-black/30 rounded-md p-3 border border-white/10">
                  <div>
                    <div className="text-sm font-medium text-white/90">Public Deck</div>
                    <div className="text-xs text-white/60">Make this deck discoverable by everyone</div>
                  </div>
                  <Switch checked={deckData.is_public} onCheckedChange={(v) => onDeckField("is_public", v)} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between bg-red-900/20 rounded-md p-3 border border-red-500/30">
                  <div>
                    <div className="text-sm font-medium text-white/90">🔞 Not Safe For Work (NSFW)</div>
                    <div className="text-xs text-white/60">Mark this deck as adult content (18+)</div>
                  </div>
                  <Switch checked={deckData.is_nsfw} onCheckedChange={(v) => onDeckField("is_nsfw", v)} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={goNext} disabled={!canNextFromStep1} className="bg-purple-600 hover:bg-purple-700">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
            {/* NEW: Image workflow guidance */}
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 text-sm text-cyan-200">
              <div className="flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-2">💡 Pro Tip: Add Images After Creating Your Deck</strong>
                  <p className="text-xs text-cyan-200/90 mb-2">
                    Don't worry about images right now! After creating your deck, you'll have access to powerful image tools:
                  </p>
                  <ul className="text-xs text-cyan-200/80 space-y-1 ml-4 list-disc">
                    <li><strong>Photo Library</strong> - Upload all your images in bulk</li>
                    <li><strong>Drag & Drop</strong> - Drag from library directly onto card placeholders</li>
                    <li><strong>Card Manager</strong> - Visual grid to manage all cards and images</li>
                    <li><strong>Smart Matching</strong> - Auto-match images by card number/name</li>
                  </ul>
                  <p className="text-xs text-cyan-300 mt-2">
                    ✨ It's faster to create the deck structure now, then add images in <strong>Studio → DeckView</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant={source === "json" ? "default" : "outline"} onClick={() => setSource("json")} className={source === "json" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                <FileJson className="w-4 h-4 mr-2" /> Import JSON
              </Button>
              <Button variant={source === "ai" ? "default" : "outline"} onClick={() => setSource("ai")} className={source === "ai" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                <Wand2 className="w-4 h-4 mr-2" /> Generate with AI
              </Button>
              <Button variant={source === "empty" ? "default" : "outline"} onClick={() => setSource("empty")} className={source === "empty" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                Start Empty
              </Button>
            </div>

            {source === "json" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Paste JSON array of cards</Label>
                  <div className="text-xs text-white/50">
                    Need help? <button type="button" onClick={insertSkeleton} className="text-purple-400 hover:text-purple-300 underline">Use example</button>
                  </div>
                </div>

                {/* NEW: Info banner about coaching fields */}
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 text-sm text-cyan-200">
                  <strong className="block mb-1">💡 Import Deck + Cards + Coaching:</strong>
                  <p className="text-xs">
                    Your JSON can include deck-level coaching fields: <code className="bg-black/30 px-1 rounded">name</code>, <code className="bg-black/30 px-1 rounded">description</code>, <code className="bg-black/30 px-1 rounded">cover_image</code>, <code className="bg-black/30 px-1 rounded">back_image_url</code>, and AI coaching fields like <code className="bg-black/30 px-1 rounded">philosophy</code>, <code className="bg-black/30 px-1 rounded">tone</code>, <code className="bg-black/30 px-1 rounded">cultural_context</code>, <code className="bg-black/30 px-1 rounded">interpretation_style</code>, <code className="bg-black/30 px-1 rounded">special_rules</code>, <code className="bg-black/30 px-1 rounded">rituals</code>. They'll auto-populate in Step 1!
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-cyan-300 hover:text-cyan-200">Show example JSON structure</summary>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          const ex = `{
  "name": "My Oracle Deck",
  "description": "A deck for...",
  "cover_image": "https://example.com/cover.jpg",
  "back_image_url": "https://example.com/back.jpg",
  "philosophy": "This deck sees the world through...",
  "tone": "Use poetic, evocative language...",
  "cultural_context": "Connect cards to...",
  "interpretation_style": "Focus on empowerment...",
  "special_rules": "Reversed cards are...",
  "rituals": "Encourage journaling...",
  "cards": [
    {
      "name": "Card 1",
      "number": 1,
      "overall_meaning": "...",
      "upright_meaning": "...",
      "reversed_meaning": "...",
      "image_url": "https://example.com/card1.jpg"
    }
  ]
}`;
                          setJsonText(ex);
                          setParseError("");
                          setDetailedError("");
                          setParseWarnings([]);
                        }}
                      >
                        Insert example
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          const ex = `{
  "name": "My Oracle Deck",
  "description": "A deck for...",
  "cover_image": "https://example.com/cover.jpg",
  "back_image_url": "https://example.com/back.jpg",
  "philosophy": "This deck sees the world through...",
  "tone": "Use poetic, evocative language...",
  "cultural_context": "Connect cards to...",
  "interpretation_style": "Focus on empowerment...",
  "special_rules": "Reversed cards are...",
  "rituals": "Encourage journaling...",
  "cards": [
    {
      "name": "Card 1",
      "number": 1,
      "overall_meaning": "...",
      "upright_meaning": "...",
      "reversed_meaning": "...",
      "image_url": "https://example.com/card1.jpg"
    }
  ]
}`;
                          navigator.clipboard?.writeText(ex);
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <pre className="mt-2 bg-black/30 rounded p-2 text-xs overflow-x-auto">
{`{
  "name": "My Oracle Deck",
  "description": "A deck for...",
  "cover_image": "https://example.com/cover.jpg",
  "back_image_url": "https://example.com/back.jpg",
  "philosophy": "This deck sees the world through...",
  "tone": "Use poetic, evocative language...",
  "cultural_context": "Connect cards to...",
  "interpretation_style": "Focus on empowerment...",
  "special_rules": "Reversed cards are...",
  "rituals": "Encourage journaling...",
  "cards": [
    {
      "name": "Card 1",
      "number": 1,
      "overall_meaning": "...",
      "upright_meaning": "...",
      "reversed_meaning": "...",
      "image_url": "https://example.com/card1.jpg"
    }
  ]
}`}
                    </pre>
                  </details>
                </div>

                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="bg-black/40 border-white/20 text-white min-h-[180px] font-mono text-sm"
                  placeholder='[{"name":"Card 1","number":1,"overall_meaning":"...","upright_meaning":"...","reversed_meaning":"..."}]'
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleParse} disabled={isParsing}>
                    {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListPlus className="w-4 h-4 mr-2" />}
                    Validate & Preview
                  </Button>
                  <Button 
                    onClick={handleAutoFixAndParse} 
                    disabled={isParsing} 
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Auto-Fix & Parse
                  </Button>
                </div>
                
                {jsonText && jsonText.length > 1000 && (
                  <div className="text-xs text-white/50">
                    {jsonText.length.toLocaleString()} characters
                  </div>
                )}

                {previewCards.length > 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2 text-green-300 mb-2">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Success! Parsed {previewCards.length} cards</strong>
                        {parseWarnings.length > 0 && (
                          <p className="text-sm text-yellow-300 mt-1">
                            ⚠️ {parseWarnings.length} warnings (e.g., invalid card objects skipped).
                          </p>
                        )}
                        <p className="text-sm text-green-200 mt-1">First 5 cards:</p>
                      </div>
                    </div>
                    <ul className="list-disc list-inside text-sm text-green-200 ml-2">
                      {previewCards.slice(0, 5).map((c, i) => (
                        <li key={i}>{c.number}. {c.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {source === "ai" && (
              <div className="space-y-3">
                {!deckData.name.trim() && (
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Tip:</strong> Go back to Step 1 and add a deck name and description. This helps the AI generate better cards!
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/80">Number of cards</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={cardsCount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCardsCount(val);
                      }}
                      onFocus={() => {
                        if (cardsCount === "") {
                          setCardsCount("10");
                        }
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === '' || raw === '0') {
                          setCardsCount("10");
                        } else {
                          const num = Math.max(1, Math.min(78, Number(raw)));
                          setCardsCount(String(num));
                        }
                      }}
                      placeholder="10"
                      className="bg-black/40 border-white/20 text-white mt-1"
                    />
                    <div className="text-xs text-white/50 mt-1">Tap to enter number (1-78)</div>
                  </div>
                  <div className="flex items-center justify-between bg-black/30 rounded-md p-3 border border-white/10">
                    <div>
                      <div className="text-sm font-medium text-white/90">AI-generated descriptions</div>
                      <div className="text-xs text-white/60">Include meanings for each card</div>
                    </div>
                    <Switch checked={generateDescriptions} onCheckedChange={setGenerateDescriptions} />
                  </div>
                </div>
                
                <Label className="text-white/80">Theme guidance (optional)</Label>
                <Textarea
                  value={themePrompt}
                  onChange={(e) => setThemePrompt(e.target.value)}
                  className="bg-black/40 border-white/20 text-white min-h-[120px]"
                  placeholder="e.g., Create cards inspired by Greek mythology with modern interpretations. Focus on empowerment and growth."
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setThemePrompt("Create mystical oracle cards inspired by lunar cycles and feminine divine energy. Focus on intuition, transformation, and emotional depth.")}
                    className="text-xs"
                  >
                    💫 Lunar Oracle Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setThemePrompt("Create empowering affirmation cards focused on self-love, confidence, and personal growth. Use positive, uplifting language.")}
                    className="text-xs"
                  >
                    ✨ Affirmation Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setThemePrompt("Create cards inspired by nature and the four elements. Each card should represent different aspects of earth, air, fire, and water.")}
                    className="text-xs"
                  >
                    🌿 Elemental Example
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAiGenerate} 
                    disabled={aiBusy || !deckData.name.trim() || !cardsCount || cardsCount === '0'} 
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiBusy ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Cards
                      </>
                    )}
                  </Button>
                </div>

                {/* AI Generation error - only show when NOT busy and there's an error */}
                {createError && !aiBusy && (
                  <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2 text-red-300">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block mb-1">AI Generation Failed</strong>
                        <p className="text-sm">{createError}</p>
                      </div>
                    </div>
                    <div className="text-sm text-red-200 space-y-1">
                      <strong>Try these fixes:</strong>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Add a deck name and description in Step 1</li>
                        <li>Use one of the example prompts above</li>
                        <li>Try a smaller number of cards (10-20)</li>
                        <li>Make sure descriptions toggle is on</li>
                        <li>Wait 30 seconds and try again</li>
                      </ul>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateError("")}
                      className="text-red-300 border-red-500/40"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* Success display - only show when NOT busy */}
                {previewCards.length > 0 && !aiBusy && (
                  <div className="bg-green-900/20 border border-green-500/40 rounded-lg p-4">
                    <div className="flex items-start gap-2 text-green-300 mb-2">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <strong>Success! Generated {previewCards.length} cards</strong>
                    </div>
                    <div className="text-sm text-white/80">
                      First 5 cards:
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {previewCards.slice(0, 5).map((c, i) => (
                          <li key={i}>{c.number}. {c.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {source === "empty" && (
              <div className="text-white/70">
                You can add cards later from the deck page.
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} disabled={aiBusy || creating || isParsing}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={goNext} disabled={!canNextFromStep2 || aiBusy || creating || isParsing} className="bg-purple-600 hover:bg-purple-700">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-md bg-black/30 p-3 border border-white/10">
                <div className="text-xs text-white/70">Deck</div>
                <div className="text-sm font-semibold">{deckData.name || "Untitled"}</div>
              </div>
              <div className="rounded-md bg-black/30 p-3 border border-white/10">
                <div className="text-xs text-white/70">Cards to create</div>
                <div className="text-sm font-semibold">{source === "empty" ? 0 : previewCards.length}</div>
              </div>
              <div className="rounded-md bg-black/30 p-3 border border-white/10">
                <div className="text-xs text-white/70">Public</div>
                <div className="text-sm font-semibold">{deckData.is_public ? "Yes" : "No"}</div>
              </div>
            </div>

            {/* Step 3 error display - only when not creating */}
            {createError && !creating && (
              <div className="flex items-center gap-2 text-red-300 bg-red-900/20 border border-red-500/40 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{createError}</span>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} disabled={creating}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating || !deckData.name.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Deck
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}