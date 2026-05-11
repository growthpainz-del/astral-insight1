import React, { useState, useEffect } from "react";
import { Deck } from "@/entities/Deck";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BookOpen, Link, RefreshCw, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ManualsLibrary() {
  const [allDecks, setAllDecks] = useState([]);
  const [allManuals, setAllManuals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingState, setProcessingState] = useState({}); // { [manualUrl]: { deckId, isAssigning, isSyncing } }
  const navigate = useNavigate();

  const loadLibrary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const decks = await Deck.list();
      setAllDecks(decks);

      const manualsMap = new Map();
      decks.forEach(deck => {
        if (deck.manual_files && deck.manual_files.length > 0) {
          deck.manual_files.forEach(manual => {
            if (!manualsMap.has(manual.url)) {
              manualsMap.set(manual.url, { ...manual, source_deck_name: deck.name });
            }
          });
        }
      });
      setAllManuals(Array.from(manualsMap.values()));
    } catch (e) {
      setError("Failed to load manuals library. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleProcessingStateChange = (manualUrl, deckId) => {
    setProcessingState(prev => ({
      ...prev,
      [manualUrl]: { ...prev[manualUrl], deckId },
    }));
  };

  const handleAssign = async (manual) => {
    const { deckId } = processingState[manual.url] || {};
    if (!deckId) {
      toast.error("Please select a deck to assign the manual to.");
      return;
    }
    
    setProcessingState(prev => ({ ...prev, [manual.url]: { ...prev[manual.url], isAssigning: true } }));
    
    try {
        const targetDeck = await Deck.get(deckId);
        const existingManuals = targetDeck.manual_files || [];

        if (existingManuals.some(m => m.url === manual.url)) {
            toast.info("This manual is already assigned to the selected deck.");
            return;
        }

        const newManuals = [...existingManuals, { name: manual.name, url: manual.url, content: manual.content, uploaded_date: manual.uploaded_date }];
        await Deck.update(deckId, { manual_files: newManuals });
        toast.success(`Successfully assigned "${manual.name}" to "${targetDeck.name}".`);

    } catch (e) {
        toast.error("Failed to assign manual. Please try again.");
    } finally {
        setProcessingState(prev => ({ ...prev, [manual.url]: { ...prev[manual.url], isAssigning: false } }));
    }
  };

  const handleSync = (manual) => {
    const { deckId } = processingState[manual.url] || {};
    if (!deckId) {
      toast.error("Please select a deck to sync with.");
      return;
    }
    const targetUrl = createPageUrl(`DeckView?id=${deckId}&openBuilderForManual=${encodeURIComponent(manual.url)}`);
    navigate(targetUrl);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Manuals Library
            </h1>
            <Button onClick={loadLibrary} variant="outline" className="border-purple-500/50 text-purple-300">
                <RefreshCw className="w-4 h-4 mr-2"/> Refresh
            </Button>
        </div>

        {error && <p className="text-red-400 my-4"><AlertTriangle className="inline w-4 h-4 mr-2"/>{error}</p>}
        
        <div className="space-y-4">
            {allManuals.length > 0 ? allManuals.map(manual => {
                const state = processingState[manual.url] || {};
                return (
                    <div key={manual.url} className="p-4 bg-white/5 rounded-2xl border border-purple-800/40 space-y-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-cyan-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-white">{manual.name}</h3>
                                <p className="text-xs text-gray-400">Originally from: {manual.source_deck_name}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-purple-800/20">
                           <div className="w-full md:w-1/2">
                             <Select onValueChange={(deckId) => handleProcessingStateChange(manual.url, deckId)}>
                                <SelectTrigger className="bg-gray-800 border-gray-600">
                                    <SelectValue placeholder="Select a deck..." />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                    {allDecks.map(deck => (
                                        <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                           </div>
                           <div className="flex gap-2 w-full md:w-auto">
                                <Button onClick={() => handleAssign(manual)} disabled={state.isAssigning || !state.deckId} className="flex-1 md:flex-none">
                                    {state.isAssigning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Link className="w-4 h-4 mr-2"/>} Assign
                                </Button>
                                <Button onClick={() => handleSync(manual)} disabled={!state.deckId} variant="outline" className="flex-1 md:flex-none">
                                    <RefreshCw className="w-4 h-4 mr-2"/> Sync
                                </Button>
                           </div>
                        </div>
                    </div>
                )
            }) : (
                <p className="text-gray-400 text-center py-8">No manuals found in any of your decks.</p>
            )}
        </div>
      </div>
    </div>
  );
}