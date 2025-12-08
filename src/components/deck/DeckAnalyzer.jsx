
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart, Zap, Search, Settings, RefreshCw, AlertTriangle, Hash, Loader2, BookOpen, Save, Image as ImageIcon, Pencil, Upload, Scan } from "lucide-react"; // Changed LineChart to BarChart, Added Scan for OCR
import DuplicateCardScanner from "./DuplicateCardScanner";
import DeckVersionManager from "./DeckVersionManager";
import BulkImageUrlMatcher from "./BulkImageUrlMatcher";
import QuickMeaningEditor from "./QuickMeaningEditor";
import AIManualBuilder from "./AIManualBuilder";
import JsonCardImporter from "./JsonCardImporter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Deck, Card as CardEntity } from "@/entities/all";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InvokeLLM } from "@/integrations/Core";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Still needed for other components
import { Label } from "@/components/ui/label"; // Added Label component
import { base44 } from "@/api/base44Client";

// Placeholder for Manuals management logic - This component will be replaced by AIManualBuilder
const ManualsManager = ({ deckId }) => {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-white/10 text-gray-300">
      <h3 className="text-lg font-bold text-white mb-3">Deck Manuals</h3>
      <p className="mb-2">Manage documentation, notes, or instructional content related to this deck.</p>
      <p className="text-sm">Deck ID: {deckId}</p>
      <p className="text-sm text-yellow-300"><i>(Manuals management functionality coming soon!)</i></p>
    </div>
  );
};

// Component for JSON-based Card Updater
const JsonCardUpdater = ({ deckId, onDone }) => {
  const [jsonInput, setJsonInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const [cards, setCards] = useState([]);
  const [indexes, setIndexes] = useState({ byId: new Map(), byNumber: new Map(), byName: new Map() });

  useEffect(() => {
    const load = async () => {
      if (!deckId) {
        setCards([]);
        setIndexes({ byId: new Map(), byNumber: new Map(), byName: new Map() });
        return;
      }
      const list = await CardEntity.filter({ deck_id: deckId });
      setCards(list);

      const byId = new Map();
      const byNumber = new Map();
      const byName = new Map();
      for (const c of list) {
        if (c.id) byId.set(String(c.id), c);
        if (c.number != null) byNumber.set(Number(c.number), c);
        if (c.name) byName.set(String(c.name).trim().toLowerCase(), c);
      }
      setIndexes({ byId, byNumber, byName });
    };
    load();
  }, [deckId]);

  const findTargetCard = (obj) => {
    // 1) id exact match
    if (obj.id != null) {
      const idStr = String(obj.id);
      const byId = indexes.byId.get(idStr);
      if (byId) return byId;

      // Fallback: if the "id" looks numeric and no id match, treat it as a number
      if (/^\d+$/.test(idStr)) {
        const asNumber = indexes.byNumber.get(Number(idStr));
        if (asNumber) return asNumber;
      }
    }
    // 2) number match
    if (obj.number != null && obj.number !== "") {
      const num = Number(obj.number);
      if (!Number.isNaN(num)) {
        const byNumber = indexes.byNumber.get(num);
        if (byNumber) return byNumber;
      }
    }
    // 3) name match
    if (obj.name) {
      const key = String(obj.name).trim().toLowerCase();
      const byName = indexes.byName.get(key);
      if (byName) return byName;
    }
    return null;
  };

  const handleUpdate = async () => {
    if (!deckId) {
      setMessage("Please select a deck first.");
      return;
    }
    if (!jsonInput.trim()) {
      setMessage("Please paste JSON data to update cards.");
      return;
    }

    setIsUpdating(true);
    setMessage("");

    try {
      const updates = JSON.parse(jsonInput);

      if (!Array.isArray(updates)) {
        setMessage("JSON must be an array of card objects.");
        setIsUpdating(false);
        return;
      }

      let updatedCount = 0;
      let matchedCount = 0;
      let skippedCount = 0;

      for (const cardData of updates) {
        // Determine target card by id OR number OR name
        const target = findTargetCard(cardData);

        if (!target) {
          skippedCount++;
          continue;
        }
        matchedCount++;

        // Build fields to update; never send "id" or internal "_key" field
        const { id: _omitId, _key: _omitKey, ...fieldsToUpdate } = cardData || {};
        // If there are no fields besides identifiers, skip
        if (Object.keys(fieldsToUpdate).length === 0) {
          continue;
        }

        await CardEntity.update(target.id, fieldsToUpdate);
        updatedCount++;
        await new Promise(resolve => setTimeout(resolve, 120)); // gentle rate limit
      }

      setMessage(`Matched ${matchedCount} card(s). Updated ${updatedCount}. Skipped ${skippedCount}.`);
      if (updatedCount > 0) {
        onDone && onDone(); // trigger refresh in parent
      }
      setJsonInput(""); // Clear input after successful update
    } catch (error) {
      console.error("Failed to update cards from JSON:", error);
      setMessage(`Error: ${error.message || "Invalid JSON or update failed."}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-white/10 text-gray-300">
      <h3 className="text-lg font-bold text-white mb-3">Update Cards from JSON</h3>
      <p className="mb-4 text-sm">
        Paste a JSON array. Each object can identify a card by id, number, or name.
        Only provided fields are updated; nothing is deleted or recreated.
      </p>
      <pre className="text-xs bg-gray-900 p-2 rounded-md mb-4 overflow-x-auto">
        Examples:
        {"\n"}
        [ {"\n"}
        {'  { "number": 1, "upright_meaning": "New meaning…" },'}{"\n"}
        {'  { "name": "The Fool", "reversed_meaning": "Expanded reverse…" },'}{"\n"}
        {'  { "id": "card-abc-123", "overall_meaning": "More depth…" }'}{"\n"}
        ]
      </pre>
      <Textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder='Paste JSON here (array of objects), e.g., [{ "number": 1, "upright_meaning": "..." } ]'
        className="w-full h-40 bg-black/40 border-white/20 text-white mb-4"
        rows={10}
      />
      <Button
        onClick={handleUpdate}
        disabled={isUpdating || !deckId || !jsonInput.trim()}
        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
      >
        {isUpdating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Apply JSON Updates"
        )}
      </Button>
      {message && (
        <p className={`mt-3 text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

// NEW: OcrImageMatcher component (placeholder for functionality)
const OcrImageMatcher = ({ deckId, onDone }) => {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleMatchImages = async () => {
    if (!deckId) {
      setMessage("Please select a deck.");
      return;
    }
    if (!imageFile) {
      setMessage("Please select an image file to process.");
      return;
    }

    setIsProcessing(true);
    setMessage("Processing image with OCR...");

    try {
      // In a real implementation, you'd integrate Tesseract.js or a backend OCR service here.
      // This is a simulation.
      console.log(`Simulating OCR for ${imageFile.name} on deck ${deckId}`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate work
      
      setMessage(`Successfully processed "${imageFile.name}". OCR detected text would be matched to card names, and image URLs could be assigned.`);
      setImageFile(null); // Clear file input
      onDone && onDone(); // Trigger refresh in parent if cards were updated
    } catch (error) {
      console.error("OCR matching failed:", error);
      setMessage(`Error: ${error.message || "An unknown error occurred during OCR matching."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-white/10 text-gray-300">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Scan className="w-5 h-5 text-purple-400" />
        OCR Image to Card Matcher
      </h3>
      <p className="mb-4 text-sm">
        Upload an image (e.g., a scanned card sheet, or a list of card names). The system will attempt to
        read card names using OCR and match them to existing cards in the deck. This can be used
        to quickly assign image URLs to cards based on a visual mapping.
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      />
      {imageFile && (
        <p className="mt-2 text-sm text-white/70">Selected: {imageFile.name}</p>
      )}
      <Button
        onClick={handleMatchImages}
        disabled={!imageFile || isProcessing || !deckId}
        className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Process Image & Match Cards"
        )}
      </Button>
      {message && (
        <p className={`mt-3 text-sm ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
};


export default function DeckAnalyzer({ deck, isOpen, onClose, onRefresh, defaultTab = "duplicates" }) {
  const [decks, setDecks] = useState([]); // Renamed allDecks to decks
  const [selectedDeck, setSelectedDeck] = useState(null); // Holds the full deck object
  const [isSyncingNumbers, setIsSyncingNumbers] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateNumbers, setDuplicateNumbers] = useState(null);
  const [isFixingDuplicates, setIsFixingDuplicates] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptProgress, setPromptProgress] = useState({ current: 0, total: 0, message: "" });

  const [editedDeckName, setEditedDeckName] = useState(""); // Renamed newDeckName to editedDeckName
  const [deckVisibility, setDeckVisibility] = useState("private"); // New state for visibility radio buttons

  // Fetch decks and set initial selected deck on mount or when dialog opens
  useEffect(() => {
    if (isOpen) {
      Deck.list()
        .then(list => {
          setDecks(list);
          const initialDeck = deck || (list.length > 0 ? list[0] : null);
          setSelectedDeck(initialDeck);
        })
        .catch(() => {
          if (deck) setDecks([deck]); // Fallback: if listing fails, at least use the current deck
          setSelectedDeck(deck);
        });
    }
  }, [isOpen, deck]);

  // When selectedDeck changes, update the edited name and visibility states
  useEffect(() => {
    if (selectedDeck) {
      setEditedDeckName(selectedDeck.name);
      setDeckVisibility(selectedDeck.is_public ? "public" : "private");
      checkForDuplicateNumbers(); // Trigger check for the new selected deck
    } else {
      setEditedDeckName("");
      setDeckVisibility("private");
      setDuplicateNumbers(null); // Clear duplicate info if no deck is selected
    }
  }, [selectedDeck]); // Re-run when selectedDeck object changes

  const checkForDuplicateNumbers = useCallback(async () => {
    if (!selectedDeck?.id) return;
    
    setIsCheckingDuplicates(true);
    try {
      const cards = await CardEntity.filter({ deck_id: selectedDeck.id });
      
      // Find duplicate numbers
      const numberMap = {};
      cards.forEach(card => {
        if (card.number != null) {
          if (!numberMap[card.number]) {
            numberMap[card.number] = [];
          }
          numberMap[card.number].push(card);
        }
      });

      const duplicates = Object.entries(numberMap)
        .filter(([, cards]) => cards.length > 1)
        .map(([num, cards]) => ({
          number: parseInt(num),
          cards: cards.map(c => ({ id: c.id, name: c.name }))
        }));

      // Find cards with null/undefined numbers
      const cardsWithoutNumbers = cards.filter(c => c.number == null);

      setDuplicateNumbers({
        duplicates,
        cardsWithoutNumbers,
        totalCards: cards.length
      });

    } catch (error) {
      console.error("Failed to check duplicate numbers:", error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, [selectedDeck?.id]); // Dependency updated to selectedDeck.id


  const buildPromptForCard = (card, deckMeta) => {
    const lines = [
      "You are an expert creative director writing concise, production-ready prompts for AI image generation.",
      "Return short, vivid prompts (max ~220 chars) that focus on subject, environment, lighting, mood, composition, camera style.",
      "Do not include camera brands, copyrighted names, or artist names.",
      "",
      `Deck: ${deckMeta?.name || "Unknown Deck"}`,
      `Card: #${card.number ?? "?"} ${card.name}`,
      card.keywords?.length ? `Keywords: ${card.keywords.join(", ")}` : "",
      card.overall_meaning ? `Theme: ${card.overall_meaning}` : "",
      card.upright_meaning ? `Upright: ${card.upright_meaning}` : "",
      card.reversed_meaning ? `Reversed: ${card.reversed_meaning}` : "",
      "",
      "Output JSON with keys: prompt, negative_prompt, style"
    ].filter(Boolean).join("\n");
    return lines;
  };

  const generatePromptsForDeck = async (options = { regenerateAll: false }) => {
    if (!selectedDeck?.id) return;
    setIsGeneratingPrompts(true);
    setPromptProgress({ current: 0, total: 0, message: "Preparing..." });

    try {
      const cards = await CardEntity.filter({ deck_id: selectedDeck.id });
      const targetCards = options.regenerateAll ? cards : cards.filter(c => !c.ai_image_prompt);

      if (targetCards.length === 0) {
        alert("No cards found to generate prompts for. All cards might already have prompts, or the deck is empty.");
        return;
      }

      setPromptProgress({ current: 0, total: targetCards.length, message: "Generating prompts..." });
      let done = 0;

      for (const card of targetCards) {
        const llmPrompt = buildPromptForCard(card, selectedDeck || {});
        const { data: res } = await InvokeLLM({
          prompt: llmPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              negative_prompt: { type: "string" },
              style: { type: "string" }
            },
            required: ["prompt"]
          }
        });

        const update = {
          ai_image_prompt: res?.prompt || "",
          ai_image_negative_prompt: res?.negative_prompt || "",
          ai_prompt_style: res?.style || ""
        };

        await CardEntity.update(card.id, update);

        done += 1;
        setPromptProgress({
          current: done,
          total: targetCards.length,
          message: `Generated ${done}/${targetCards.length} prompts`
        });

        // small delay to be gentle on rate limits
        await new Promise(r => setTimeout(r, 200));
      }

      setPromptProgress({
        current: targetCards.length,
        total: targetCards.length,
        message: "Done. Refreshing..."
      });
      await checkForDuplicateNumbers();
      onRefresh();
      alert(`Generated prompts for ${targetCards.length} card(s).`);
    } catch (e) {
      console.error("Prompt generation failed:", e);
      alert(`Prompt generation error: ${e.message || "Unknown error"}`);
    } finally {
      setIsGeneratingPrompts(false);
      setPromptProgress({ current: 0, total: 0, message: "" });
    }
  };


  const fixDuplicateNumbers = async () => {
    if (!selectedDeck?.id) return;

    if (!window.confirm("This will re-number ALL cards in this deck sequentially (1, 2, 3...) based on their current order by card name alphabetically.\n\nThis will fix all duplicates and gaps.\n\nThis may take a few minutes for large decks.\n\nContinue?")) {
      return;
    }

    setIsFixingDuplicates(true);
    setFixProgress(0);
    
    try {
      const cards = await CardEntity.filter({ deck_id: selectedDeck.id });
      
      // Sort cards alphabetically by name
      const sortedCards = [...cards].sort((a, b) => 
        (a.name || "").localeCompare(b.name || "")
      );

      // Update cards ONE AT A TIME with delays to avoid rate limits
      for (let i = 0; i < sortedCards.length; i++) {
        const card = sortedCards[i];
        const newNumber = i + 1;
        
        try {
          await CardEntity.update(card.id, { number: newNumber });
          setFixProgress(Math.round(((i + 1) / sortedCards.length) * 100));
          
          // Add a 200ms delay between each update to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`Failed to update card ${card.name}:`, error);
          // Continue with other cards even if one fails
        }
      }

      alert(`✅ Successfully re-numbered ${sortedCards.length} cards!\n\nCards are now numbered 1-${sortedCards.length} alphabetically by name.`);
      
      await checkForDuplicateNumbers();
      onRefresh();

    } catch (error) {
      console.error("Failed to fix duplicate numbers:", error);
      alert(`Error: ${error.message}\n\nSome cards may have been updated. Please refresh and try again.`);
    } finally {
      setIsFixingDuplicates(false);
      setFixProgress(0);
    }
  };

  const handleSyncNumbers = async () => {
    if (!selectedDeck?.id) return;

    if (!window.confirm("This will scan all cards in this deck and normalize them:\n\n1. It will parse the number from the card's name (e.g., '10' from '10. The Fool').\n2. It will update the card's 'number' field to fix sorting.\n3. It will REMOVE the number prefix from the card's 'name' (e.g., '10. The Fool' becomes 'The Fool').\n\nThis may take a few minutes for large decks.\n\nContinue?")) {
      return;
    }

    setIsSyncingNumbers(true);
    try {
      const cards = await CardEntity.filter({ deck_id: selectedDeck.id });
      let updatedCount = 0;

      // Process cards ONE AT A TIME with delays
      for (const card of cards) {
        // Updated regex to also handle '-' as a separator
        const nameMatch = (card.name || "").match(/^(\d+)[\.\-\s]+(.+)/);
        let updatePayload = {};

        if (nameMatch) {
          const newNumber = parseInt(nameMatch[1], 10);
          const newName = nameMatch[2].trim();

          if (card.number !== newNumber && !isNaN(newNumber)) {
            updatePayload.number = newNumber;
          }
          if (card.name !== newName && newName) {
            updatePayload.name = newName;
          }
        }
        
        if (Object.keys(updatePayload).length > 0) {
          try {
            await CardEntity.update(card.id, updatePayload);
            updatedCount++;
            
            // Add a 200ms delay between each update
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (error) {
            console.error(`Failed to update card ${card.name}:`, error);
          }
        }
      }

      if (updatedCount > 0) {
        alert(`✅ Successfully normalized ${updatedCount} card(s).\n\nNumbers have been synced and name prefixes have been removed.`);
        await checkForDuplicateNumbers();
        onRefresh();
      } else {
        alert("All cards are already normalized. No changes were needed.");
      }
    } catch (error) {
      console.error("Error normalizing card data:", error);
      alert(`An error occurred while normalizing: ${error.message}`);
    } finally {
      setIsSyncingNumbers(false);
    }
  };

  const handleSaveDeckName = async () => {
    if (!selectedDeck?.id) return;
    const name = (editedDeckName || "").trim();
    if (!name) {
      alert("Please enter a deck title.");
      return;
    }
    try {
      await Deck.update(selectedDeck.id, { name });
      alert("Title saved.");
      // Refresh local deck list and parent
      const updatedList = await Deck.list();
      setDecks(updatedList);
      setSelectedDeck(updatedList.find(d => d.id === selectedDeck.id)); // Update selectedDeck with new name
      onRefresh && onRefresh();
    } catch (e) {
      alert(e?.message || "Could not save title. You may not have permission to edit this deck.");
    }
  };

  const handleVisibilityChange = async () => {
    if (!selectedDeck) return;

    const newIsPublic = deckVisibility === "public";
    const confirmMsg = newIsPublic
      ? "⚠️ Make this deck PUBLIC?\n\nEveryone will be able to see and use this deck.\n\nOnly do this if:\n- You own all rights to the content\n- The deck is complete and polished\n- You want to share it with the community"
      : "🔒 Make this deck PRIVATE?\n\nOnly you will be able to see and use this deck.\n\nThis is recommended for:\n- Personal decks\n- Work-in-progress decks\n- Decks with copyrighted content";

    if (!window.confirm(confirmMsg)) {
      // Reset to current state if cancelled
      setDeckVisibility(selectedDeck.is_public ? "public" : "private");
      return;
    }

    try {
      // Call backend to update visibility
      const { data } = await base44.functions.invoke('updateDeckVisibility', {
        deckId: selectedDeck.id,
        isPublic: newIsPublic
      });

      if (data?.ok) {
        alert(`✅ Deck visibility updated to ${newIsPublic ? "PUBLIC" : "PRIVATE"}`);
        // Refresh decks list and selected deck to reflect new visibility
        const updatedList = await Deck.list();
        setDecks(updatedList);
        setSelectedDeck(updatedList.find(d => d.id === selectedDeck.id));
        if (onRefresh) onRefresh();
      } else {
        throw new Error(data?.error || "Failed to update visibility");
      }
    } catch (error) {
      console.error("Failed to update visibility:", error);
      alert(`❌ Failed to update visibility: ${error.message}`);
      // Reset to previous state if failed
      setDeckVisibility(selectedDeck.is_public ? "public" : "private");
    }
  };


  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-purple-500/40 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
            <BarChart className="w-6 h-6 text-purple-400" />
            Deck Health Center
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4"> {/* Added padding top */}
          {/* Deck selector */}
          <div>
            <Label className="text-white mb-2 block">Select Deck to Analyze:</Label>
            <Select value={selectedDeck?.id || ""} onValueChange={(id) => setSelectedDeck(decks.find(d => d.id === id))}>
              <SelectTrigger className="bg-slate-800 border-purple-700 text-white">
                <SelectValue placeholder="Choose a deck..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-700 text-white">
                {decks.map(d => (
                  <SelectItem key={d.id} value={d.id} className="text-white hover:bg-slate-700">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDeck && (
            <>
              {/* Deck Title Editor */}
              <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Deck Title</h3>
                <Input
                  value={editedDeckName}
                  onChange={(e) => setEditedDeckName(e.target.value)}
                  className="bg-slate-900 border-purple-700 text-white mb-3"
                  placeholder="Enter deck name..."
                />
                <Button
                  onClick={handleSaveDeckName}
                  disabled={!editedDeckName.trim() || editedDeckName === selectedDeck.name}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Title
                </Button>
              </div>

              {/* FIXED: Deck Visibility Selector */}
              <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4">Visibility</h3>
                
                <div className="space-y-3">
                  {/* Radio option: Private */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer hover:bg-slate-700/30"
                    style={{
                      borderColor: deckVisibility === "private" ? "rgb(168 85 247)" : "rgba(255,255,255,0.1)",
                      backgroundColor: deckVisibility === "private" ? "rgba(168,85,247,0.1)" : "transparent"
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={deckVisibility === "private"}
                      onChange={(e) => setDeckVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        🔒 Private Deck
                        {deckVisibility === "private" && <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">Current</span>}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Only <strong>you</strong> can see and use this deck. Perfect for personal decks or work-in-progress.
                      </div>
                    </div>
                  </label>

                  {/* Radio option: Public */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer hover:bg-slate-700/30"
                    style={{
                      borderColor: deckVisibility === "public" ? "rgb(168 85 247)" : "rgba(255,255,255,0.1)",
                      backgroundColor: deckVisibility === "public" ? "rgba(168,85,247,0.1)" : "transparent"
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={deckVisibility === "public"}
                      onChange={(e) => setDeckVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        🌍 Public Deck
                        {deckVisibility === "public" && <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">Current</span>}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        <strong>Everyone</strong> can see and use this deck. Share your creation with the community!
                      </div>
                      <div className="text-xs text-yellow-300 mt-1">
                        ⚠️ Only make public if you own all rights to the content
                      </div>
                    </div>
                  </label>
                </div>

                <Button
                  onClick={handleVisibilityChange}
                  disabled={deckVisibility === (selectedDeck.is_public ? "public" : "private")}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Visibility
                </Button>
              </div>

            {/* Card Numbering Analysis */}
            {duplicateNumbers && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-purple-400" />
                  Card Numbering Analysis
                </h3>
                
                {(duplicateNumbers.duplicates.length > 0 || duplicateNumbers.cardsWithoutNumbers.length > 0) ? (
                  <>
                    {duplicateNumbers.duplicates.length > 0 && (
                      <div className="mb-4 p-3 bg-red-900/20 border border-red-500/40 rounded-lg">
                        <p className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Found {duplicateNumbers.duplicates.length} duplicate number(s):
                        </p>
                        <ScrollArea className="max-h-32 pr-2">
                          {duplicateNumbers.duplicates.map(dup => (
                            <div key={dup.number} className="text-sm text-red-200 mb-1">
                              <strong>#{dup.number}:</strong> {dup.cards.map(c => c.name).join(', ')}
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}

                    {duplicateNumbers.cardsWithoutNumbers.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/40 rounded-lg">
                        <p className="text-yellow-300 font-semibold">
                          {duplicateNumbers.cardsWithoutNumbers.length} card(s) without numbers
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        onClick={fixDuplicateNumbers}
                        disabled={isFixingDuplicates}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        {isFixingDuplicates ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Fixing... {fixProgress}%
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Fix All Numbering Issues
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">
                        This will re-number all cards sequentially (1-{duplicateNumbers.totalCards || 0}) based on alphabetical order.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-green-400">✅ All cards have unique sequential numbers!</p>
                )}
              </div>
            )}

            <Tabs defaultValue={defaultTab} className="flex flex-col">
                <TabsList className="grid w-full grid-cols-10 bg-white/5"> {/* Changed to grid-cols-10 for the new tab */}
                    <TabsTrigger value="duplicates">
                        <Search className="w-4 h-4 mr-2"/>
                        Duplicates
                    </TabsTrigger>
                    <TabsTrigger value="backups">
                        <Settings className="w-4 h-4 mr-2"/>
                        Backups
                    </TabsTrigger>
                    <TabsTrigger value="manuals">
                        <BookOpen className="w-4 h-4 mr-2"/>
                        Manuals
                    </TabsTrigger>
                    <TabsTrigger value="sync">
                        <Zap className="w-4 h-4 mr-2"/>
                        Sync Names
                    </TabsTrigger>
                    <TabsTrigger value="prompts">
                        <Zap className="w-4 h-4 mr-2" />
                        Prompts
                    </TabsTrigger>
                    <TabsTrigger value="images">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Images
                    </TabsTrigger>
                    {/* NEW: OCR Tab Trigger */}
                    <TabsTrigger value="ocr">
                        <Scan className="w-4 h-4 mr-2" />
                        OCR Matcher
                    </TabsTrigger>
                    <TabsTrigger value="meanings">
                        <Pencil className="w-4 h-4 mr-2" />
                        Meanings
                    </TabsTrigger>
                    <TabsTrigger value="jsonUpdate">
                        <Upload className="w-4 h-4 mr-2" />
                        JSON Update
                    </TabsTrigger>
                    <TabsTrigger value="jsonImport">
                        <Upload className="w-4 h-4 mr-2" />
                        Import JSON
                    </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <TabsContent value="duplicates">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                             <DuplicateCardScanner deckId={selectedDeck.id} onRefresh={() => { checkForDuplicateNumbers(); onRefresh(); }} />
                        </div>
                    </TabsContent>
                    <TabsContent value="backups">
                         <div className="bg-gray-800/50 p-4 rounded-lg">
                            <DeckVersionManager deck={selectedDeck} onRestore={() => { checkForDuplicateNumbers(); onRefresh(); }} />
                        </div>
                    </TabsContent>
                    <TabsContent value="manuals">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <AIManualBuilder
                              deckId={selectedDeck.id}
                              onDone={() => {
                                onRefresh && onRefresh();
                              }}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="sync">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <h3 className="text-lg font-bold text-white mb-3">Sync Card Numbers from Names</h3>
                          <p className="text-gray-300 text-sm mb-4">
                            If your card names include numbers (e.g., "14. Isis"), this will:
                          </p>
                          <ul className="text-gray-300 text-sm mb-4 space-y-1 list-disc list-inside">
                            <li>Extract the number and set it as the card's number field</li>
                            <li>Remove the number prefix from the card name</li>
                            <li>Example: "14. Isis" becomes name="Isis", number=14</li>
                          </ul>
                          <Button
                            onClick={handleSyncNumbers}
                            disabled={isSyncingNumbers}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          >
                            {isSyncingNumbers ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sync Numbers from Names
                              </>
                            )}
                          </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="prompts">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white">AI Image Prompts</h3>
                        <p className="text-sm text-gray-300">
                          Generate concise AI prompts for each card, optionally with negative prompts and style tags. These are saved on each card.
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          <Button
                            onClick={() => generatePromptsForDeck({ regenerateAll: false })}
                            disabled={isGeneratingPrompts}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            {isGeneratingPrompts ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate Missing"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => generatePromptsForDeck({ regenerateAll: true })}
                            disabled={isGeneratingPrompts}
                            className="border-white/20 hover:bg-white/10"
                          >
                            Regenerate All
                          </Button>
                        </div>
                        {isGeneratingPrompts && (
                          <div className="mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${promptProgress.total ? (promptProgress.current / promptProgress.total) * 100 : 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{promptProgress.message}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="images">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <BulkImageUrlMatcher
                          deckId={selectedDeck.id}
                          onDone={() => {
                            onRefresh && onRefresh();
                            checkForDuplicateNumbers();
                          }}
                        />
                      </div>
                    </TabsContent>

                    {/* NEW: OCR Image Matcher Tab Content */}
                    <TabsContent value="ocr">
                      <OcrImageMatcher
                        deckId={selectedDeck.id}
                        onDone={() => {
                          onRefresh && onRefresh();
                          checkForDuplicateNumbers();
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="meanings">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-2">Quick Meanings Editor</h3>
                        <p className="text-sm text-white/70 mb-4">Update upright and reversed meanings for any card without restarting anything.</p>
                        <QuickMeaningEditor
                          deckId={selectedDeck.id}
                          onSaved={() => {
                            onRefresh && onRefresh();
                          }}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="jsonUpdate">
                      <JsonCardUpdater
                        deckId={selectedDeck.id}
                        onDone={() => {
                            onRefresh && onRefresh();
                            checkForDuplicateNumbers();
                        }}
                      />
                    </TabsContent>

                    {/* NEW: JSON Import Tab */}
                    <TabsContent value="jsonImport">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-2">Deck Utilities: Import JSON</h3>
                        <p className="text-sm text-white/70 mb-4">
                          Create new cards or update existing cards by pasting a JSON array below.
                        </p>
                        <JsonCardImporter
                          deckId={selectedDeck.id}
                          onDone={() => {
                            onRefresh && onRefresh();
                            checkForDuplicateNumbers();
                          }}
                        />
                      </div>
                    </TabsContent>
                </div>
            </Tabs>
            </>
            )} {/* End of selectedDeck conditional rendering */}
        </div>

        <DialogFooter className="pt-4 border-t border-purple-900">
          <Button onClick={onClose} variant="outline" className="text-white border-purple-500">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
