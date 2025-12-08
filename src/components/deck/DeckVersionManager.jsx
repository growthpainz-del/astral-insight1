
import React, { useState, useEffect, useCallback } from "react";
import { DeckVersion, Deck, Card } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  History, 
  AlertTriangle, 
  Clock, 
  FileText, 
  RotateCcw,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeckVersionManager({ 
  isOpen, 
  onClose, 
  deckId, 
  currentDeck, 
  currentCards = [], // Add default empty array
  onRestoreComplete 
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("save");
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!deckId) return;
    
    setLoading(true);
    try {
      const deckVersions = await DeckVersion.filter({ deck_id: deckId }, "-created_date");
      setVersions(deckVersions);
    } catch (error) {
      console.error("Error loading deck versions:", error);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    if (isOpen && deckId) {
      loadVersions();
      // Auto-fill version name with timestamp
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setNewVersionName(`Backup ${timestamp}`);
    }
  }, [isOpen, deckId, loadVersions]);

  const saveVersion = async () => {
    if (!newVersionName.trim()) {
      alert("Please enter a version name.");
      return;
    }

    setSaving(true);
    try {
      const nextVersionNumber = Math.max(0, ...versions.map(v => v.version_number || 0)) + 1;
      
      await DeckVersion.create({
        deck_id: deckId,
        version_name: newVersionName.trim(),
        version_number: nextVersionNumber,
        description: newVersionDescription.trim() || "",
        deck_snapshot: currentDeck,
        cards_snapshot: currentCards || [], // Ensure it's always an array
        auto_saved: false
      });

      alert(`Version "${newVersionName}" saved successfully!`);
      setNewVersionName("");
      setNewVersionDescription("");
      await loadVersions();
      setActiveTab("versions");
    } catch (error) {
      console.error("Error saving version:", error);
      alert("Failed to save version. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (version) => {
    try {
      setLoading(true);
      
      // First, delete all current cards
      const currentDeckCards = await Card.filter({ deck_id: deckId });
      for (const card of currentDeckCards) {
        try {
          await Card.delete(card.id);
        } catch (err) {
          console.warn(`Failed to delete card ${card.id}:`, err);
        }
      }

      // Update deck with snapshot data
      const { deck_snapshot } = version;
      await Deck.update(deckId, {
        name: deck_snapshot.name,
        description: deck_snapshot.description,
        category: deck_snapshot.category,
        author: deck_snapshot.author,
        cover_image: deck_snapshot.cover_image,
        back_image_url: deck_snapshot.back_image_url,
        is_public: deck_snapshot.is_public,
        manual_url: deck_snapshot.manual_url,
        manual_content: deck_snapshot.manual_content
      });

      // Recreate all cards from snapshot
      const cardsToCreate = version.cards_snapshot.map(card => ({
        deck_id: deckId,
        name: card.name,
        image_url: card.image_url,
        video_url: card.video_url,
        number: card.number,
        element: card.element,
        keywords: card.keywords,
        ancient_wisdom: card.ancient_wisdom,
        overall_meaning: card.overall_meaning,
        upright_meaning: card.upright_meaning,
        upright_insight: card.upright_insight,
        upright_action: card.upright_action,
        reversed_meaning: card.reversed_meaning,
        reversed_insight: card.reversed_insight,
        reversed_action: card.reversed_action,
        interaction: card.interaction
      }));

      if (cardsToCreate.length > 0) {
        await Card.bulkCreate(cardsToCreate);
      }

      alert(`Successfully restored to version "${version.version_name}"!`);
      onRestoreComplete?.();
      onClose();
      
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version. Please try again.");
    } finally {
      setLoading(false);
      setShowRestoreConfirm(false);
      setSelectedVersion(null);
    }
  };

  const deleteVersion = async (versionId) => {
    if (!confirm("Are you sure you want to delete this version? This cannot be undone.")) {
      return;
    }

    try {
      await DeckVersion.delete(versionId);
      await loadVersions();
    } catch (error) {
      console.error("Error deleting version:", error);
      alert("Failed to delete version.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md border border-white/20 text-white max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            Deck Version Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="save" className="data-[state=active]:bg-blue-600">
              <Save className="w-4 h-4 mr-2" />
              Save Version
            </TabsTrigger>
            <TabsTrigger value="versions" className="data-[state=active]:bg-purple-600">
              <History className="w-4 h-4 mr-2" />
              Saved Versions ({versions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="save" className="space-y-4 flex-1">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-200 mb-2">Create New Version</h3>
              <p className="text-sm text-blue-300 mb-4">
                Save a snapshot of your current deck ({(currentCards || []).length} cards) that you can restore later.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-white mb-1 block">Version Name</label>
                  <Input
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="e.g., Before Manual Sync, Complete Deck v1"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-white mb-1 block">Description (optional)</label>
                  <Textarea
                    value={newVersionDescription}
                    onChange={(e) => setNewVersionDescription(e.target.value)}
                    placeholder="Notes about this version..."
                    rows={3}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={saveVersion}
              disabled={saving || !newVersionName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving Version..." : "Save Current Version"}
            </Button>
          </TabsContent>

          <TabsContent value="versions" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-blue-400 mx-auto animate-spin" />
                  <p className="mt-2 text-blue-200">Loading versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-semibold">No Versions Saved Yet</p>
                  <p className="text-purple-200">Create your first version backup using the Save tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {versions.map((version) => (
                      <motion.div
                        key={version.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">{version.version_name}</h3>
                              {version.auto_saved && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                                  Auto-saved
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                v{version.version_number}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-purple-200 mb-2">
                              <div>📅 {new Date(version.created_date).toLocaleString()}</div>
                              <div>🃏 {version.cards_snapshot?.length || 0} cards</div>
                            </div>
                            
                            {version.description && (
                              <p className="text-sm text-purple-300 mb-3">{version.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t border-white/10">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowRestoreConfirm(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteVersion(version.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/20 text-purple-200 hover:bg-white/10">
            Close
          </Button>
        </DialogFooter>

        {/* Restore Confirmation Dialog */}
        <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
          <DialogContent className="bg-gradient-to-br from-red-900/95 to-orange-900/95 backdrop-blur-md border border-red-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-200">
                <AlertTriangle className="w-5 h-5" />
                Confirm Restore
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-red-100">
                Are you sure you want to restore to "<strong>{selectedVersion?.version_name}</strong>"?
              </p>
              <div className="bg-red-500/20 border border-red-500/40 rounded p-3">
                <h4 className="font-semibold text-red-200 mb-2">⚠️ This will:</h4>
                <ul className="text-sm text-red-300 space-y-1">
                  <li>• Delete all current cards ({(currentCards || []).length} cards)</li>
                  <li>• Replace deck information with version snapshot</li>
                  <li>• Restore {selectedVersion?.cards_snapshot?.length || 0} cards from the backup</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowRestoreConfirm(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => restoreVersion(selectedVersion)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {loading ? "Restoring..." : "Yes, Restore"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
