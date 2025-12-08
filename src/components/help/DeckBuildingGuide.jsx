
import React from "react";
import { Wand2, Upload, Zap, Sparkles, Image, FileText, CheckCircle2, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DeckBuildingGuide() {
  return (
    <div className="text-gray-300 p-4 md:p-6 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30">
      <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4 flex items-center gap-2 md:gap-3">
        <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
        Building Your Own Oracle Decks
      </h2>

      <p className="text-base md:text-lg mb-6 text-white/90">
        Creating your own custom oracle or tarot deck has never been easier. Whether you're a complete beginner or an experienced deck creator, 
        this app provides powerful tools to bring your vision to life in minutes, not months.
      </p>

      {/* Why Create Your Own Deck */}
      <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Why Create Your Own Deck?
        </h3>
        <ul className="space-y-2 text-white/80">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong>Personal Connection:</strong> Cards that speak directly to your intuition, experiences, and spiritual path.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong>Unique Themes:</strong> Create decks around any topic - cats, goddesses, nature, emotions, career guidance, or anything you dream up.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong>Share Your Wisdom:</strong> Make your deck public so others can benefit from your unique perspective.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong>Professional Tool:</strong> Practitioners can create specialized decks for specific client needs or therapeutic approaches.</span>
          </li>
        </ul>
      </div>

      {/* How Easy It Is */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-blue-300 mb-4">Three Ways to Create (Choose Your Path)</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Method 1: AI Generation */}
          <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-6 h-6 text-purple-400" />
              <h4 className="text-lg font-bold text-white">1. AI Magic</h4>
            </div>
            <p className="text-sm text-white/80 mb-3">
              Let AI generate everything for you in minutes. Perfect for beginners or rapid prototyping.
            </p>
            <ul className="text-xs space-y-1 text-white/70">
              <li>• Describe your deck theme</li>
              <li>• AI creates card names & meanings</li>
              <li>• Optionally generate card images</li>
              <li>• Review and refine as needed</li>
            </ul>
            <div className="mt-3 text-xs text-purple-300 font-semibold">⏱️ 5-10 minutes</div>
          </div>

          {/* Method 2: Import Existing */}
          <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-6 h-6 text-blue-400" />
              <h4 className="text-lg font-bold text-white">2. Import Existing</h4>
            </div>
            <p className="text-sm text-white/80 mb-3">
              Already have card data? Import it instantly from JSON, spreadsheets, or manual text.
            </p>
            <ul className="text-xs space-y-1 text-white/70">
              <li>• Upload JSON with card data</li>
              <li>• Paste from spreadsheet/document</li>
              <li>• Bulk upload images (match by name)</li>
              <li>• Import card meanings from PDF manuals</li>
            </ul>
            <div className="mt-3 text-xs text-blue-300 font-semibold">⏱️ 10-20 minutes</div>
          </div>

          {/* Method 3: Manual Creation */}
          <div className="p-4 bg-gradient-to-br from-teal-900/30 to-teal-800/20 rounded-lg border border-teal-500/30">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-6 h-6 text-teal-400" />
              <h4 className="text-lg font-bold text-white">3. Hand-Crafted</h4>
            </div>
            <p className="text-sm text-white/80 mb-3">
              Build your deck card-by-card with complete control over every detail.
            </p>
            <ul className="text-xs space-y-1 text-white/70">
              <li>• Create each card individually</li>
              <li>• Write custom meanings & insights</li>
              <li>• Upload artwork piece by piece</li>
              <li>• Perfect for artisan decks</li>
            </ul>
            <div className="mt-3 text-xs text-teal-300 font-semibold">⏱️ 1-3 hours (for 40 cards)</div>
          </div>
        </div>
      </div>

      {/* Powerful Features */}
      <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-xl font-bold text-cyan-300 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Powerful Tools at Your Fingertips
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Image className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <strong className="text-white">AI Image Generation:</strong>
              <span className="text-white/70"> Generate beautiful card artwork with text prompts (or upload your own).</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <strong className="text-white">Smart Manual Parser:</strong>
              <span className="text-white/70"> Upload PDFs and auto-extract card meanings using AI OCR.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Upload className="w-4 h-4 text-teal-400 flex-shrink-0 mt-1" />
            <div>
              <strong className="text-white">Bulk Upload Images:</strong>
              <span className="text-white/70"> Select 78 files and they auto-match to cards by name/number.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Wand2 className="w-4 h-4 text-pink-400 flex-shrink-0 mt-1" />
            <div>
              <strong className="text-white">AI Manual Builder:</strong>
              <span className="text-white/70"> Generate upright/reversed meanings, keywords, and wisdom for all cards at once.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <strong className="text-white">Version Control:</strong>
              <span className="text-white/70"> Save snapshots of your deck so you can always roll back changes.</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <strong className="text-white">Custom Spreads:</strong>
              <span className="text-white/70"> Design reading layouts specific to your deck's purpose.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Example */}
      <div className="mb-8 p-5 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-lg border border-indigo-500/30">
        <h3 className="text-xl font-bold text-indigo-300 mb-4">Quick Start: Create Your First Deck in 5 Steps</h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">1</div>
            <div>
              <strong className="text-white">Go to Dashboard → Create New Deck</strong>
              <p className="text-sm text-white/70">Give it a name and choose a category (Oracle, Tarot, Lenormand, etc.)</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">2</div>
            <div>
              <strong className="text-white">Choose Your Path</strong>
              <p className="text-sm text-white/70">Generate with AI, Import JSON, or Start Empty (add cards manually)</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">3</div>
            <div>
              <strong className="text-white">Add Cards</strong>
              <p className="text-sm text-white/70">Use AI Manual Builder to generate meanings, or import from your existing files</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">4</div>
            <div>
              <strong className="text-white">Add Images</strong>
              <p className="text-sm text-white/70">Bulk upload photos (they auto-match), generate with AI, or add one by one</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">5</div>
            <div>
              <strong className="text-white">Start Reading!</strong>
              <p className="text-sm text-white/70">Your deck is ready to use. Keep it Personal or make it Public to share with the world.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Tips for Success */}
      <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30 mb-6">
        <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Pro Tips for Deck Creators
        </h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li>• <strong>Start small:</strong> Create a 20-30 card deck before attempting a full 78-card tarot</li>
          <li>• <strong>Use AI to brainstorm:</strong> Even if you edit everything later, AI can spark ideas you hadn't considered</li>
          <li>• <strong>Name your images wisely:</strong> "07 - The Chariot.jpg" will auto-match to card #7 during bulk upload</li>
          <li>• <strong>Save versions frequently:</strong> Use the Backup feature before making big changes</li>
          <li>• <strong>Test early, test often:</strong> Do a reading with incomplete cards to see what needs work</li>
          <li>• <strong>Keep it Personal first:</strong> Polish your deck before making it Public</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link to={createPageUrl("CreateDeck")}>
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-full text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto">
            <Sparkles className="w-6 h-6" />
            Start Creating Your Deck Now
            <Sparkles className="w-6 h-6" />
          </button>
        </Link>
        <p className="text-sm text-white/60 mt-3">No coding required. No design skills needed. Just your vision.</p>
      </div>
    </div>
  );
}
