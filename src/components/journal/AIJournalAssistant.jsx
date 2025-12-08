import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Sparkles, 
  Loader2, 
  TrendingUp,
  Link as LinkIcon,
  Brain
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import TokenCostPreview from "@/components/pricing/TokenCostPreview";

export default function AIJournalAssistant({ entries, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [themes, setThemes] = useState(null);
  const [connections, setConnections] = useState(null);
  const [error, setError] = useState("");

  const generateOverview = async () => {
    if (!entries || entries.length === 0) {
      setError("No journal entries to analyze");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const recentEntries = entries.slice(0, 10);
      
      const entrySummaries = recentEntries.map(entry => {
        return `
Date: ${entry.date}
Title: ${entry.title}
Question: ${entry.question || 'N/A'}
Mood: ${entry.mood || 'N/A'}
Content: ${entry.entry_content?.substring(0, 300) || 'No content'}
Tags: ${entry.tags?.join(', ') || 'None'}
        `.trim();
      }).join('\n\n---\n\n');

      const prompt = `You are a spiritual guide analyzing a user's reading journal entries. Provide a thoughtful overview of their spiritual journey.

Here are their recent journal entries:

${entrySummaries}

Provide a comprehensive analysis including:
1. Overall Journey Arc - What patterns do you see in their spiritual growth?
2. Recurring Questions - What themes keep coming up?
3. Emotional Patterns - How have their moods evolved?
4. Progress Indicators - Signs of growth and development
5. Recommendations - Suggestions for their continued journey

Write in an encouraging, insightful tone. Be specific and reference their actual entries.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setOverview(response);

    } catch (err) {
      console.error("Failed to generate overview:", err);
      setError(err.message || "Failed to generate overview");
    } finally {
      setLoading(false);
    }
  };

  const extractThemes = async () => {
    if (!entries || entries.length === 0) {
      setError("No journal entries to analyze");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const allContent = entries.map(entry => {
        return `${entry.title} | ${entry.question || ''} | ${entry.entry_content || ''} | ${entry.tags?.join(' ') || ''}`;
      }).join('\n');

      const prompt = `Analyze these journal entries and extract the main themes:

${allContent}

Return a JSON object with:
{
  "major_themes": ["theme1", "theme2", ...],
  "recurring_questions": ["question1", "question2", ...],
  "growth_areas": ["area1", "area2", ...],
  "suggested_focus": "A paragraph suggesting what the user should focus on next"
}

Identify 5-8 major themes, 3-5 recurring question types, and 3-5 growth areas.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            major_themes: { type: "array", items: { type: "string" } },
            recurring_questions: { type: "array", items: { type: "string" } },
            growth_areas: { type: "array", items: { type: "string" } },
            suggested_focus: { type: "string" }
          }
        },
        add_context_from_internet: false
      });

      setThemes(response);

    } catch (err) {
      console.error("Failed to extract themes:", err);
      setError(err.message || "Failed to extract themes");
    } finally {
      setLoading(false);
    }
  };

  const findConnections = async () => {
    if (!entries || entries.length < 3) {
      setError("Need at least 3 entries to find meaningful connections");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const entrySummaries = entries.map((entry, i) => {
        return `
Entry ${i + 1} (${entry.date}):
Title: ${entry.title}
Question: ${entry.question || 'N/A'}
Cards: ${entry.cards_drawn?.map(c => c.card_name).join(', ') || 'N/A'}
Content Summary: ${entry.entry_content?.substring(0, 200) || 'No content'}
Tags: ${entry.tags?.join(', ') || 'None'}
Follow-up: ${entry.follow_up_notes?.substring(0, 100) || 'None'}
        `.trim();
      }).join('\n\n---\n\n');

      const prompt = `Analyze these journal entries and find meaningful connections between them:

${entrySummaries}

Return a JSON array of connections:
[
  {
    "entry_indices": [1, 3, 5],
    "connection_type": "recurring_theme | complementary | progression | contradiction",
    "description": "Detailed explanation of how these entries connect",
    "significance": "Why this connection matters for their journey"
  },
  ...
]

Find 3-5 most meaningful connections. Reference specific entry numbers.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              entry_indices: { type: "array", items: { type: "number" } },
              connection_type: { type: "string" },
              description: { type: "string" },
              significance: { type: "string" }
            }
          }
        },
        add_context_from_internet: false
      });

      setConnections(response);

    } catch (err) {
      console.error("Failed to find connections:", err);
      setError(err.message || "Failed to find connections");
    } finally {
      setLoading(false);
    }
  };

  const connectionTypeColors = {
    recurring_theme: "bg-purple-600/20 text-purple-300",
    complementary: "bg-blue-600/20 text-blue-300",
    progression: "bg-green-600/20 text-green-300",
    contradiction: "bg-amber-600/20 text-amber-300"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI Journal Insights
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Discover patterns and wisdom in your journal
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-200">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-white/10 mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
                <Brain className="w-4 h-4 mr-2" />
                Journey Overview
              </TabsTrigger>
              <TabsTrigger value="themes" className="data-[state=active]:bg-purple-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                Key Themes
              </TabsTrigger>
              <TabsTrigger value="connections" className="data-[state=active]:bg-purple-600">
                <LinkIcon className="w-4 h-4 mr-2" />
                Connections
              </TabsTrigger>
            </TabsList>

            {/* Journey Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {!overview ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">
                    Analyze Your Spiritual Journey
                  </h4>
                  <p className="text-white/70 mb-6 max-w-md mx-auto">
                    Get AI-powered insights on your overall progress, patterns, and growth areas based on your journal entries.
                  </p>
                  <TokenCostPreview action="reading_standard" />
                  <Button
                    onClick={generateOverview}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Overview
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="prose prose-invert prose-purple max-w-none">
                    <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
                      {overview}
                    </div>
                  </div>
                  <Button
                    onClick={() => setOverview(null)}
                    variant="outline"
                    className="mt-6 border-white/20 text-white"
                  >
                    Generate New Analysis
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Key Themes Tab */}
            <TabsContent value="themes" className="space-y-4">
              {!themes ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">
                    Extract Key Themes
                  </h4>
                  <p className="text-white/70 mb-6 max-w-md mx-auto">
                    Discover recurring themes, questions, and areas of growth across all your journal entries.
                  </p>
                  <TokenCostPreview action="reading_quick" />
                  <Button
                    onClick={extractThemes}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Extract Themes
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Major Themes */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Major Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {themes.major_themes?.map((theme, i) => (
                        <Badge key={i} className="bg-purple-600/20 text-purple-200">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recurring Questions */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Recurring Questions</h4>
                    <ul className="space-y-2">
                      {themes.recurring_questions?.map((question, i) => (
                        <li key={i} className="text-white/80 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Growth Areas */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Growth Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {themes.growth_areas?.map((area, i) => (
                        <Badge key={i} className="bg-green-600/20 text-green-200">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Focus */}
                  {themes.suggested_focus && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-cyan-300 mb-3">
                        Suggested Focus
                      </h4>
                      <p className="text-white/90 leading-relaxed">
                        {themes.suggested_focus}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => setThemes(null)}
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    Extract New Themes
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-4">
              {!connections ? (
                <div className="text-center py-12">
                  <LinkIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">
                    Find Entry Connections
                  </h4>
                  <p className="text-white/70 mb-6 max-w-md mx-auto">
                    Discover how your journal entries relate to each other and uncover hidden patterns in your journey.
                  </p>
                  <TokenCostPreview action="reading_standard" />
                  <Button
                    onClick={findConnections}
                    disabled={loading || entries.length < 3}
                    className="bg-purple-600 hover:bg-purple-700 mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-5 h-5 mr-2" />
                        Find Connections
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={connectionTypeColors[connection.connection_type] || "bg-white/20 text-white"}>
                          {connection.connection_type.replace(/_/g, ' ')}
                        </Badge>
                        <div className="flex gap-1">
                          {connection.entry_indices?.map((idx, j) => (
                            <Badge key={j} className="bg-purple-600/20 text-purple-200 text-xs">
                              Entry {idx}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <h5 className="text-white font-semibold mb-2">Connection</h5>
                      <p className="text-white/80 mb-3 leading-relaxed">
                        {connection.description}
                      </p>
                      
                      <h5 className="text-white font-semibold mb-2">Significance</h5>
                      <p className="text-cyan-200 leading-relaxed">
                        {connection.significance}
                      </p>
                    </div>
                  ))}

                  <Button
                    onClick={() => setConnections(null)}
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    Find New Connections
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
}