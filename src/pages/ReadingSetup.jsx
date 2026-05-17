import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Deck as DeckEntity, Spread as SpreadEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Loader2, Sparkles, Hand, LayoutTemplate, Wand2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { queueApiCall } from "@/components/utils/apiQueue";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { SpreadSelector, SYSTEM_SPREADS } from "@/components/reading/CompactSpread";

export default function ReadingSetup() {
  const [searchParams] = useSearchParams();
  const deckIdFromUrl = searchParams.get("deckId");
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [spreads, setSpreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [readingMode, setReadingMode] = useState("spread");
  const [selectedSpreadId, setSelectedSpreadId] = useState("");
  const [isGeneratingSpread, setIsGeneratingSpread] = useState(false);

  const handleGenerateAISpread = async () => {
    setIsGeneratingSpread(true);
    try {
      const res = await base44.functions.invoke('aiSuggestSpread', {
        numCards: Math.floor(Math.random() * 3) + 3, // 3 to 5 cards
        theme: question || "General guidance",
        readingType: "Custom AI Spread"
      });
      
      const suggestion = res.data?.suggestion;
      if (suggestion) {
        const newSpread = await base44.entities.Spread.create({
          name: suggestion.spread_name,
          description: suggestion.description,
          category: suggestion.category,
          positions: suggestion.positions,
          deck_id: deck.id
        });
        
        setSpreads(prev => [newSpread, ...prev]);
        setSelectedSpreadId(newSpread.id);
      }
    } catch (err) {
      console.error("Failed to generate AI spread:", err);
    } finally {
      setIsGeneratingSpread(false);
    }
  };

  useEffect(() => {
    if (!deckIdFromUrl) {
      setError("No deck selected");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [loadedDeck, loadedSpreads] = await Promise.all([
          queueApiCall(() => DeckEntity.get(deckIdFromUrl), 3, 1500),
          queueApiCall(() => SpreadEntity.list(), 3, 1500)
        ]);

        setDeck(loadedDeck);
        setSpreads(loadedSpreads || []);
        setSelectedSpreadId(SYSTEM_SPREADS[0].id);
        setError("");
      } catch (err) {
        setError("Failed to load deck.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [deckIdFromUrl]);

  const handleStart = () => {
    const spreadParam = readingMode === "freeform" ? "freeform" : selectedSpreadId;
    navigate(createPageUrl(`Reading?deckId=${deck.id}&spread=${encodeURIComponent(spreadParam)}&question=${encodeURIComponent(question)}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07050f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-[#07050f] flex items-center justify-center p-6 text-white text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col p-4 md:p-8 text-white pb-32">
      <div className="max-w-2xl w-full mx-auto bg-[#0f0b1e]/90 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 md:p-8 mt-4 md:mt-12">
        <Link to={createPageUrl("ReadingRoom")}>
          <Button variant="ghost" className="text-purple-200 hover:text-white hover:bg-purple-500/20 mb-6 -ml-4">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Room
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-2 font-['Cinzel'] text-center">
          Prepare Your Reading
        </h1>
        <p className="text-purple-300/70 text-center mb-8 text-sm">Using the <span className="font-semibold text-purple-200">{deck.name}</span> deck</p>

        <div className="space-y-8">
          <div>
            <label className="font-['Cinzel'] text-[11px] tracking-[0.2em] uppercase text-[#b4a0dc]/60 mb-2 block">Your Question or Context</label>
            <Textarea 
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="What guidance do you seek from the cards?"
              className="w-full bg-[#160f2a] border-[#a078ff]/20 rounded-xl p-4 font-['Crimson_Text'] text-lg text-white resize-none outline-none min-h-[100px] transition-colors focus-visible:ring-1 focus-visible:ring-purple-500/50 placeholder:text-[#b4a0dc]/40"
            />
          </div>

          <div>
            <label className="font-['Cinzel'] text-[11px] tracking-[0.2em] uppercase text-[#b4a0dc]/60 mb-2 block">Reading Style</label>
            <Tabs value={readingMode} onValueChange={setReadingMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#160f2a] border border-[#a078ff]/20 h-14 rounded-xl p-1">
                <TabsTrigger value="spread" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300/70 rounded-lg text-sm transition-all">
                  <LayoutTemplate className="w-4 h-4 mr-2" /> Spread Layout
                </TabsTrigger>
                <TabsTrigger value="freeform" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300/70 rounded-lg text-sm transition-all">
                  <Hand className="w-4 h-4 mr-2" /> Free Draw
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {readingMode === "spread" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="font-['Cinzel'] text-[11px] tracking-[0.2em] uppercase text-[#b4a0dc]/60 block">Select Spread</label>
                <Button 
                  size="sm"
                  onClick={handleGenerateAISpread} 
                  disabled={isGeneratingSpread}
                  variant="outline" 
                  className="h-8 bg-[#160f2a] border-[#a078ff]/20 hover:bg-purple-600/20 text-purple-300 text-xs"
                >
                  {isGeneratingSpread ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />} AI Spread
                </Button>
              </div>
              <SpreadSelector 
                selectedId={selectedSpreadId}
                onSelect={(spread) => setSelectedSpreadId(spread.id)}
                customSpreads={spreads}
              />
            </motion.div>
          )}

          <Button 
            onClick={handleStart}
            disabled={readingMode === "spread" && !selectedSpreadId}
            className="w-full mt-4 p-[16px] h-14 rounded-full border-none cursor-pointer font-['Cinzel'] text-[14px] tracking-[0.15em] uppercase text-white bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-[0_4px_20px_rgba(124,58,237,0.45)] flex items-center justify-center gap-[9px] transition-all hover:-translate-y-[2px] hover:shadow-[0_6px_28px_rgba(124,58,237,0.6)] active:scale-[0.97] disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 mr-1" /> Start Reading
          </Button>
        </div>
      </div>
    </div>
  );
}