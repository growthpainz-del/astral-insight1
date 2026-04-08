import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, X, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QUESTION_CATEGORIES } from "@/lib/cosmic-data";
import CosmicSymbolSprite from "./CosmicSymbolSprite";

export default function StructuredReading({ isOpen, drawnCards, deck, onClose }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [questionCategory, setQuestionCategory] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const activeQuestionCategories = deck?.engine_config?.question_categories || QUESTION_CATEGORIES;
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeQuestionCategories.length > 0 && !questionCategory) {
      setQuestionCategory(activeQuestionCategories[0].name);
    }
  }, [activeQuestionCategories, questionCategory]);

  useEffect(() => {
    if (isOpen && deck?.id) {
      loadCategories();
    }
  }, [isOpen, deck?.id]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await base44.entities.ReadingCategory.filter({ deck_id: deck.id, is_active: true });
      let activeCategories = res || [];
      
      if (activeCategories.length === 0) {
        activeCategories = [{
          id: "default",
          name: "General Reading",
          description: "Standard rules-based reading",
          branch_1_title: "The Core Energy",
          branch_2_title: "The Modifiers",
          branch_3_title: "The Action / Outcome",
          interpretation_instructions: "Synthesize these elements to answer your query.",
          booster_symbols: []
        }];
      }
      
      setCategories(activeCategories);
      if (activeCategories.length > 0) {
        setSelectedCategoryId(activeCategories[0].id);
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCategoryId) return;
    
    setIsGenerating(true);
    setError("");
    setResult(null);

    try {
      const selectedCategory = categories.find(c => c.id === selectedCategoryId);
      const response = await base44.functions.invoke("generateStructuredReading", {
        category_id: selectedCategoryId !== "default" ? selectedCategoryId : null,
        category: selectedCategory,
        deck_id: deck.id,
        drawnCards: drawnCards,
        includeMoonPhase: true,
        question_category: questionCategory
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setResult(response.data.reading);
    } catch (e) {
      console.error("Failed to generate reading:", e);
      setError("Failed to generate the structured reading. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Structured Reading</h2>
                <p className="text-sm text-cyan-200/70">Rules-based reading engine</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {!result && (
              <div className="space-y-4">
                <p className="text-white/80">
                  Select a reading category to generate a deterministic reading based on the rules defined in the Creator Studio. This does not use AI interpretation.
                </p>

                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl text-center">
                    <p className="text-amber-200">No active reading categories found for this deck.</p>
                    <p className="text-amber-200/70 text-sm mt-2">Add reading rules in the Deck Studio to use this feature.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Reading Engine (Deck Specific)</Label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="bg-black/30 border-white/20 text-white w-full">
                          <SelectValue placeholder="Select Engine" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20 text-white">
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Focus Area (Question Category)</Label>
                      <Select value={questionCategory} onValueChange={setQuestionCategory}>
                        <SelectTrigger className="bg-black/30 border-white/20 text-white w-full h-auto">
                          <SelectValue placeholder="Select Focus Area" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20 text-white">
                          {activeQuestionCategories.map(cat => (
                            <SelectItem key={cat.name} value={cat.name} className="py-2">
                              <div className="flex flex-col">
                                <span className="font-semibold">{cat.name}</span>
                                <span className="text-xs text-white/60">{cat.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5" />
                    {result.branch_1?.title}
                  </h3>
                  <p className="text-white/90 leading-relaxed pl-7">{result.branch_1?.content}</p>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5" />
                    {result.branch_2?.title}
                  </h3>
                  
                  {result.cosmic_symbol && (
                    <div className="mb-4 pl-7 flex items-center gap-4">
                      <div className="flex-shrink-0 p-2 bg-black/40 border border-cyan-500/30 rounded-xl">
                        <CosmicSymbolSprite name={result.cosmic_symbol.name} className="w-16 h-16" />
                      </div>
                      <div>
                        <div className="text-sm text-cyan-300 font-semibold mb-1">
                          Cosmic Symbol: {result.cosmic_symbol.name}
                        </div>
                        <p className="text-white/80 text-sm leading-snug">
                          {result.cosmic_symbol.meaning}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-white/90 leading-relaxed pl-7 whitespace-pre-wrap">{result.branch_2?.content}</p>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5" />
                    {result.branch_3?.title}
                  </h3>
                  <p className="text-white/90 leading-relaxed pl-7">{result.branch_3?.content}</p>
                </div>

                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Instructions</h3>
                  <p className="text-cyan-100/90 text-sm italic leading-relaxed">{result.instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-white/10 bg-slate-900/80 flex justify-end gap-3">
            {!result ? (
              <>
                <Button variant="outline" onClick={onClose} className="border-white/20 text-white">
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!selectedCategoryId || isGenerating || categories.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Reading
                </Button>
              </>
            ) : (
              <Button onClick={() => setResult(null)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Read Again
              </Button>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}