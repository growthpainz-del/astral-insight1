import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

// Simplified list of answers for quick inspiration
const rebelAnswers = {
    affirmative: ["The stars align for this.", "Hell yes.", "It's a bold move. Make it.", "The path is clear.", "Vibes are immaculate.", "Do it. No regrets."],
    negative: ["That's a hard pass.", "The ether says 'nope'.", "This ain't it, chief.", "Re-roll your reality.", "The idea is half-baked.", "Not today, satan."],
    neutral: ["The outcome is hazy.", "Ask again with more spice.", "The threads of fate are tangled.", "Your question lacks fire.", "Meditate on it, then try again.", "The answer is not in the cards... yet."]
};

export default function Rebel8BallInspiration() {
    const [question, setQuestion] = useState("");
    const [isShaking, setIsShaking] = useState(false);
    const [answer, setAnswer] = useState({ text: null, type: 'initial' });

    const getAnswerColor = (type) => {
        switch (type) {
            case 'affirmative': return 'text-green-400';
            case 'negative': return 'text-red-400';
            default: return 'text-purple-300';
        }
    };

    const handleAsk = async () => {
        if (!question.trim() || isShaking) return;
        setIsShaking(true);
        setAnswer({ text: '...', type: 'shaking' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const answerType = Object.keys(rebelAnswers)[Math.floor(Math.random() * Object.keys(rebelAnswers).length)];
        const answerText = rebelAnswers[answerType][Math.floor(Math.random() * rebelAnswers[answerType].length)];
        const selectedAnswer = { text: answerText, type: answerType };

        setAnswer(selectedAnswer);
        setIsShaking(false);
    };

    return (
        <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-6 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-white mb-2">Rebel 8-Ball Inspiration</h3>
            <p className="text-purple-200 mb-4 max-w-md">Ask a yes/no question to get a rebellious spark of inspiration for your deck theme, name, or style.</p>

            <div className="w-full max-w-sm flex items-center gap-2 mb-4">
                <Input
                    type="text"
                    placeholder="e.g., Should my deck be cyberpunk?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400"
                />
                <Button onClick={handleAsk} disabled={isShaking} className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4" />
                </Button>
            </div>

            {/* 8-Ball Display */}
            <div className="relative w-64 h-64">
                <motion.div
                    className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 border-4 border-gray-600 shadow-2xl flex items-center justify-center relative overflow-hidden"
                    animate={isShaking ? {
                        rotateZ: [0, 5, -5, 3, -3, 0],
                        scale: [1, 1.05, 0.95, 1.02, 1]
                    } : { rotateZ: 0, scale: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                >
                    <div className="absolute w-40 h-40 rounded-full bg-blue-900/50 flex items-center justify-center">
                        <div className="relative w-32 h-28">
                            <svg className="absolute inset-0 w-full h-full text-blue-400/30" viewBox="0 0 100 87" fill="currentColor">
                                <path d="M50 0L0 86.6h100L50 0z" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <AnimatePresence>
                                    {answer.text && answer.text !== '...' && (
                                        <motion.div
                                            key={answer.text}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="p-2"
                                        >
                                            <span className={`font-bold text-center leading-tight ${getAnswerColor(answer.type)} text-lg`}>
                                                {answer.text}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}