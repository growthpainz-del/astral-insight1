import React, { useState, useEffect, useCallback } from 'react';
import { Spread, Deck, User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, BookOpen, Layers, Info, ArrowLeft, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isPaid } from '@/lib/subscriptionUtils';
import { toast } from 'sonner';
import SpreadEditor from '../components/spread/SpreadEditor';
import UpgradePrompt from '../components/pricing/UpgradePrompt';

export default function SpreadManager() {
  const navigate = useNavigate();
  const [spreads, setSpreads] = useState([]);
  const [decks, setDecks] = useState([]);
  const [deckMap, setDeckMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingSpread, setEditingSpread] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [spreadToDelete, setSpreadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState(null);

  // Use proper tier check — no hardcoded emails
  const canUseFeature = isPaid(user);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userSpreads, userDecks, currentUser] = await Promise.all([
        Spread.list(),
        Deck.list(),
        User.me().catch(() => null),
      ]);

      setUser(currentUser);
      setSpreads(userSpreads);
      setDecks(userDecks);
      setDeckMap(
        userDecks.reduce((acc, deck) => {
          acc[deck.id] = deck.name;
          return acc;
        }, {})
      );
    } catch (error) {
      toast.error('Failed to load spreads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (spread) => {
    if (!canUseFeature) return;
    setEditingSpread(spread);
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    if (!canUseFeature) return;
    setEditingSpread(null);
    setIsEditorOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!spreadToDelete) return;
    setIsDeleting(true);
    try {
      await Spread.delete(spreadToDelete.id);
      toast.success(`"${spreadToDelete.name}" deleted.`);
      setSpreadToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Failed to delete spread. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = () => {
    setIsEditorOpen(false);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950/20 via-purple-950/20 to-slate-950/20 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
          <p className="text-white/70">Loading your spreads…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950/20 via-purple-950/20 to-slate-950/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="border-white/20 text-purple-200 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-wide">
                Spread Manager
              </h1>
              <p className="text-purple-200">
                Design spreads for your readings. A paid feature.
              </p>
            </div>
          </div>
          {canUseFeature && (
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 shadow-lg shadow-purple-500/25 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Spread
            </Button>
          )}
        </motion.div>

        {!canUseFeature ? (
          <UpgradePrompt
            featureName="Custom Spread Creation"
            featureDescription="Unlock the ability to design, save, and use your own unique card spreads for a truly personalized reading experience."
          />
        ) : spreads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl"
          >
            <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Your Canvas is Blank
            </h3>
            <p className="text-purple-200 mb-6 max-w-md mx-auto">
              You haven't created any custom spreads yet. Create your first one
              to personalize your readings.
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Spread
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {spreads.map((spread, index) => (
                <motion.div
                  key={spread.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-purple-400/50 transition-all duration-300 h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold text-white">
                            {spread.name}
                          </CardTitle>
                          <CardDescription className="text-purple-300 mt-1 line-clamp-2">
                            {spread.description}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-purple-300 hover:text-white hover:bg-white/10"
                            onClick={() => handleEdit(spread)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setSpreadToDelete(spread)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                      <div className="space-y-2 text-sm mt-4">
                        <div className="flex items-center gap-2 text-white">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <span>{spread.positions.length} Cards</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Info className="w-4 h-4 text-purple-400" />
                          <span>
                            {deckMap[spread.deck_id] || 'Common Spread'}
                          </span>
                        </div>
                        {spread.is_public && (
                          <div className="flex items-center gap-2 text-amber-300">
                            <Star className="w-4 h-4" />
                            <span>Public Spread</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!spreadToDelete}
        onOpenChange={(open) => !open && setSpreadToDelete(null)}
      >
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Spread</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                "{spreadToDelete?.name}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {isEditorOpen && (
          <SpreadEditor
            spread={editingSpread}
            decks={decks}
            user={user}
            onSave={handleSave}
            onCancel={() => setIsEditorOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}