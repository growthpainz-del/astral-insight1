import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, X, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StructuredReading({ isOpen, drawnCards, deck, onClose }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && deck?.id) {
      loadCategories();
    }
  }, [isOpen, deck?.id]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await base44.entities.ReadingCategory.filter({ deck_id: deck.id, is_active: true });
      const activeCategories = res || [];
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
      const response = await base44.functions.invoke("generateStructuredReading", {
        category_id: selectedCategoryId,
        drawnCards: drawnCards,
        includeMoonPhase: true
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
                  <div className="space-y-3">
                    <Label className="text-white">Reading Category</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger className="bg-black/30 border-white/20 text-white w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20 text-white">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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