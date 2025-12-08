import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen,
  FileText,
  Users,
  GitFork,
  Upload,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ManualGuide from "../components/help/ManualGuide";
import ImportJsonGuide from "../components/help/ImportJsonGuide";
import DeckBuildingGuide from "@/components/help/DeckBuildingGuide";

export default function Help() {
  const tabParam = new URLSearchParams(window.location.search).get("tab") || "deck-building";

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-200">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Help & Guides
        </h1>

        <Tabs defaultValue={tabParam} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white/5 mb-6">
            <TabsTrigger value="deck-building" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <Sparkles className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Deck Building</span>
              <span className="sm:hidden">Build</span>
            </TabsTrigger>
            <TabsTrigger value="getting-started" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <BookOpen className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Getting Started</span>
              <span className="sm:hidden">Start</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <FileText className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Deck Manuals</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="app-flow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <GitFork className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Application Flow</span>
              <span className="sm:hidden">Flow</span>
            </TabsTrigger>
            <TabsTrigger value="readings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <BookOpen className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Readings</span>
              <span className="sm:hidden">Read</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <Users className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Community</span>
              <span className="sm:hidden">Comm.</span>
            </TabsTrigger>
            <TabsTrigger value="import-json" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm">
              <Upload className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Import & JSON</span>
              <span className="sm:hidden">Import</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deck-building" className="mt-8">
            <DeckBuildingGuide />
          </TabsContent>

          <TabsContent value="manual" className="mt-8">
            <ManualGuide />
          </TabsContent>

          <TabsContent value="app-flow" className="mt-8">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-amber-300 mb-4">
                Application Flowchart & Decision Tree
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                This section provides a detailed visual and text-based flowchart of the app's core processes, user journeys, and decision points. It's a great resource for understanding how everything connects.
              </p>
              <Link to={createPageUrl("AppFlow")}>
                <Button className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700">
                  <GitFork className="w-4 h-4 mr-2" />
                  View Flowchart
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="getting-started" className="mt-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-amber-300 mb-4">
                Welcome to Astral Insight!
              </h2>
              <p className="text-gray-300">Your journey begins here. Start by exploring the official decks on the dashboard or create your own. This platform is designed to be your personal space for divination and self-discovery.</p>
            </div>
          </TabsContent>

          <TabsContent value="readings" className="mt-8">
             <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-amber-300 mb-4">
                Performing a Reading
              </h2>
              <p className="text-gray-300">Select a deck, choose a spread, and draw your cards. Use the AI interpretation for guidance, but always trust your own intuition first. Your readings are automatically saved to your History page.</p>
            </div>
          </TabsContent>

          <TabsContent value="community" className="mt-8">
             <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-amber-300 mb-4">
                Join the Community
              </h2>
              <p className="text-gray-300">Sharing and learning with others is a powerful way to grow. Currently, community features are under development. Stay tuned for updates!</p>
            </div>
          </TabsContent>

          <TabsContent value="import-json" className="mt-8">
            <ImportJsonGuide />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}