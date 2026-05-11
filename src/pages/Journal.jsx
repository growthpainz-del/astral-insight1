import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Calendar,
  Tag,
  Star,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import JournalEntryCard from "@/components/journal/JournalEntryCard";
import JournalEntryEditor from "@/components/journal/JournalEntryEditor";
import AIJournalAssistant from "@/components/journal/AIJournalAssistant";
import { queueApiCall } from "@/components/utils/apiQueue";

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState("all");
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Load journal entries
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError("");
      
      const loadedEntries = await queueApiCall(
        () => base44.entities.JournalEntry.list("-date", 200),
        3,
        1000
      );
      
      setEntries(loadedEntries);
      
    } catch (err) {
      setError("Failed to load journal entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort entries
  useEffect(() => {
    let filtered = [...entries];

    // View mode filter
    if (viewMode === "favorites") {
      filtered = filtered.filter(e => e.is_favorite);
    } else if (viewMode === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(e => new Date(e.date) >= thirtyDaysAgo);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const searchableText = [
          entry.title,
          entry.question,
          entry.entry_content,
          entry.follow_up_notes,
          ...(entry.tags || []),
          ...(entry.ai_themes || []),
          ...(entry.cards_drawn || []).map(c => c.card_name)
        ].filter(Boolean).join(" ").toLowerCase();
        
        return searchableText.includes(query);
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry => 
        entry.tags && entry.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "date_asc") {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === "favorites") {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedTags, sortBy, viewMode]);

  // Get all unique tags
  const allTags = React.useMemo(() => {
    const tagSet = new Set();
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setShowEditor(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleSaveEntry = async (entryData) => {
    try {
      if (editingEntry) {
        await queueApiCall(
          () => base44.entities.JournalEntry.update(editingEntry.id, entryData),
          3,
          1000
        );
      } else {
        await queueApiCall(
          () => base44.entities.JournalEntry.create(entryData),
          3,
          1000
        );
      }
      
      await loadEntries();
      setShowEditor(false);
      setEditingEntry(null);
      
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteEntry = async (entryId) => {
    // Find entry for dialog display, then open dialog
    const entry = entries.find(e => e.id === entryId);
    setEntryToDelete(entry || { id: entryId });
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      await queueApiCall(
        () => base44.entities.JournalEntry.delete(entryToDelete.id),
        3,
        1000
      );
      setEntryToDelete(null);
      await loadEntries();
    } catch (err) {
      setError("Failed to delete entry. Please try again.");
    }
  };

  const handleToggleFavorite = async (entry) => {
    // Optimistic update — flip locally first, revert on failure
    setEntries(prev =>
      prev.map(e => e.id === entry.id ? { ...e, is_favorite: !e.is_favorite } : e)
    );
    try {
      await queueApiCall(
        () => base44.entities.JournalEntry.update(entry.id, {
          is_favorite: !entry.is_favorite,
        }),
        3,
        1000
      );
    } catch (err) {
      // Revert on failure
      setEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, is_favorite: entry.is_favorite } : e)
      );
      toast.error("Failed to update favourite. Please try again.");
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-400" />
              Reading Journal
            </h1>
            <p className="text-purple-200 mt-2">Document your spiritual journey and insights</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAIAssistant(true)}
              variant="outline"
              className="border-purple-400/40 text-purple-300 hover:bg-purple-900/30"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </Button>
            <Button
              onClick={handleCreateEntry}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Total Entries</div>
            <div className="text-2xl font-bold text-white">{entries.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Favorites</div>
            <div className="text-2xl font-bold text-white">
              {entries.filter(e => e.is_favorite).length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">This Month</div>
            <div className="text-2xl font-bold text-white">
              {entries.filter(e => {
                const entryDate = new Date(e.date);
                const now = new Date();
                return entryDate.getMonth() === now.getMonth() && 
                       entryDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Unique Tags</div>
            <div className="text-2xl font-bold text-white">{allTags.length}</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500/40 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-100">
              ✕
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries, questions, cards, tags..."
                className="pl-10 bg-black/30 border-white/20 text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/30 border border-white/20 rounded-lg px-4 text-white"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="favorites">Favorites First</option>
              </select>
            </div>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-white/60 text-sm flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Tags:
              </span>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`cursor-pointer transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-purple-600 text-white"
                      : "bg-purple-600/20 text-purple-200 hover:bg-purple-600/40"
                  }`}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  onClick={() => setSelectedTags([])}
                  variant="ghost"
                  size="sm"
                  className="text-purple-300 hover:text-white"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
          <TabsList className="bg-slate-900/50 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
              All Entries ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-purple-600">
              <Calendar className="w-4 h-4 mr-2" />
              Recent (30 days)
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
            <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {entries.length === 0 ? "Start Your Journal" : "No Entries Found"}
            </h3>
            <p className="text-purple-200 mb-6 max-w-md mx-auto">
              {entries.length === 0
                ? "Begin documenting your spiritual journey. Each reading is an opportunity for growth and reflection."
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
            {entries.length === 0 && (
              <Button
                onClick={handleCreateEntry}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Entry
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <JournalEntryCard
                    entry={entry}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Journal Entry Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <JournalEntryEditor
            entry={editingEntry}
            onSave={handleSaveEntry}
            onClose={() => {
              setShowEditor(false);
              setEditingEntry(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIAssistant && (
          <AIJournalAssistant
            entries={entries}
            onClose={() => setShowAIAssistant(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {entryToDelete?.title
                ? <>Are you sure you want to delete <span className="font-semibold text-white">"{entryToDelete.title}"</span>? This cannot be undone.</>
                : "Are you sure you want to delete this journal entry? This cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEntry}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}