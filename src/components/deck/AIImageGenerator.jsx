import React, { useState, useEffect } from "react";
import { GenerateImage } from "@/integrations/Core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, Check, RotateCcw, Image as ImageIcon, AlertTriangle, Flag } from "lucide-react";
import { motion } from "framer-motion";
import ReportContentDialog from "@/components/common/ReportContentDialog";

export default function AIImageGenerator({ isOpen, onClose, onImageGenerated, card }) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [error, setError] = useState(null);
    const [showReportDialog, setShowReportDialog] = useState(false);

    // Helper function to generate a prompt from card details
    const generatePromptFromCard = () => {
        if (!card) return "";

        const meaningText = 
            card.overall_meaning || 
            card.upright_meaning || 
            card.subtitle || 
            card.description || 
            "";

        const parts = [];
        
        if (card.name) {
            parts.push(`A mystical oracle card titled "${card.name}"`);
        }
        
        if (meaningText) {
            const truncated = meaningText.length > 200 
                ? meaningText.substring(0, 200) + "..." 
                : meaningText;
            parts.push(`depicting: ${truncated}`);
        }
        
        if (card.keywords?.length) {
            parts.push(`Keywords: ${card.keywords.slice(0, 5).join(", ")}`);
        }
        
        if (card.element && card.element !== "none") {
            parts.push(`${card.element} element`);
        }
        
        parts.push("Mystical tarot card art style, professional illustration, rich colors, symbolic imagery");
        
        return parts.filter(Boolean).join(". ");
    };

    // Effect to set or reset the prompt based on card details and dialog state
    useEffect(() => {
        if (isOpen && card) {
            // Prioritize card.ai_image_prompt if it exists, otherwise generate from card details.
            const newPromptValue = card.ai_image_prompt || generatePromptFromCard();
            
            // Only update the state if the prompt content has actually changed.
            // This prevents unnecessary re-renders and potential infinite loops if the prompt calculation yields the same string.
            // This behavior means if `card` changes while the dialog is open, the prompt will update
            // to reflect the new auto-generated value, potentially overwriting user's manual edits.
            if (prompt !== newPromptValue) {
                setPrompt(newPromptValue);
            }
        } else if (!isOpen) {
            // Reset all states when the dialog is closed, preparing for a fresh open.
            setPrompt("");
            setIsGenerating(false);
            setGeneratedImageUrl(null);
            setError(null);
        }
    }, [isOpen, card]); // Dependencies: isOpen and card. `generatePromptFromCard` implicitly depends on `card`.

    const handleGenerate = async () => {
        setGeneratedImageUrl(null); // Clear any previously generated image
        setError(null); // Clear any previous errors

        // Use the current prompt from state, or fall back to generating from card details if the prompt is empty.
        const finalPrompt = prompt.trim() || generatePromptFromCard();
        
        if (!finalPrompt) {
            setError("No prompt available. Please add card details or enter a custom prompt.");
            return;
        }

        setIsGenerating(true);

        try {
            console.log("Starting AI image generation with prompt:", finalPrompt);
            // Assuming GenerateImage returns an object with a 'url' property
            const result = await GenerateImage({ prompt: finalPrompt }); 
            console.log("AI image generation result:", result);
            
            if (result && result.url) {
                setGeneratedImageUrl(result.url);
            } else {
                setError("Failed to generate image. The AI service may be temporarily unavailable or returned an invalid response.");
                console.error("Invalid response from GenerateImage:", result);
            }
        } catch (e) {
            console.error("Error generating image:", e);
            // Provide a more user-friendly error message
            setError(e.message || "Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAccept = () => {
        if (generatedImageUrl) {
            onImageGenerated(generatedImageUrl); // Callback to parent with the accepted image URL
            onClose(); // Close the dialog upon acceptance
        }
    };

    if (!isOpen) return null; // Don't render anything if the dialog is not open

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-purple-800 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-300" />
                        Generate Card Image with AI
                    </DialogTitle>
                     <DialogDescription className="text-purple-300">
                        We've created a prompt based on your card's details. Edit it to refine your vision.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="prompt" className="text-sm font-medium text-purple-200 mb-2 block">
                            Image Prompt
                        </Label>
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A celestial wolf howling at a cosmic moon, digital painting..."
                            rows={5}
                            className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400"
                        />
                    </div>
                    
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 shadow-lg shadow-blue-500/25"
                    >
                        <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? "Generating Your Vision..." : "Generate Image"}
                    </Button>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="min-h-[256px] bg-black/20 rounded-lg flex items-center justify-center p-4 border border-white/10">
                        {isGenerating ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-12 h-12"
                            >
                                <Sparkles className="w-full h-full text-amber-400" />
                            </motion.div>
                        ) : generatedImageUrl ? (
                            <div className="relative group w-full flex justify-center">
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={generatedImageUrl}
                                    alt="Generated card art"
                                    className="max-h-64 rounded-md shadow-lg"
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="destructive" className="bg-red-500/80 hover:bg-red-600 text-white border-0" onClick={(e) => { e.preventDefault(); setShowReportDialog(true); }}>
                                        <Flag className="w-4 h-4 mr-2" /> Report Image
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-purple-300">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    {generatedImageUrl && !isGenerating && (
                        <div className="flex w-full gap-3">
                            <Button
                                onClick={handleGenerate}
                                variant="outline"
                                className="flex-1 border-white/20 text-purple-200 hover:bg-white/10"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={handleAccept} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                <Check className="w-4 h-4 mr-2" />
                                Use This Image
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>

            <ReportContentDialog
                isOpen={showReportDialog}
                onClose={() => setShowReportDialog(false)}
                contentType="generated_image"
                contentContext={generatedImageUrl || "Generated image"}
            />
        </Dialog>
    );
}