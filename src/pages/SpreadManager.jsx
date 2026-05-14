import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Layers, Star, Loader2, ChevronLeft, Search, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isPaid } from '@/lib/subscriptionUtils';
import { toast } from 'sonner';
import UpgradePrompt from '../components/pricing/UpgradePrompt';

// ─── Mini spread dot visualizer ───────────────────────────────────────────────
function SpreadDots({ positions = [] }) {
  if (!positions.length) return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-white/20 text-xs">No positions</span>
    </div>
  );
  return (
    <div className="relative w-full h-full">
      {positions.map((pos, i) => {
        const x = typeof pos.x === 'number' ? pos.x : 50;
        const y = typeof pos.y === 'number' ? pos.y : 50;
        return (
          <div key={i}
            className="absolute rounded-sm"
            style={{
              left: `${x}%`, top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)`,
              width: 10, height: 15,
              background: 'rgba(167,139,250,0.6)',
              border: '1px solid rgba(167,139,250,0.9)',
              boxShadow: '0 0 6px rgba(124,58,237,0.4)',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Spread card ──────────────────────────────────────────────────────────────
function SpreadCard({ spread, deckName, onEdit, onDelete, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl overflow-hidden border border-white/8 hover:border-purple-400/30 transition-all"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Spread dot preview */}
      <div
        className="relative w-full"
        style={{ height: 100, background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.15) 0%, rgba(7,5,15,0.8) 100%)' }}
      >
        <SpreadDots positions={spread.positions || []} />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(124,58,237,0.35)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)' }}>
            {spread.positions?.length || 0} cards
          </span>
          {spread.category && spread.category !== 'General' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {spread.category}
            </span>
          )}
        </div>
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button onClick={() => onEdit(spread)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(124,58,237,0.35)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <Edit className="w-3.5 h-3.5 text-purple-300" />
          </button>
          <button onClick={() => onDelete(spread)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Info row */}
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{spread.name}</p>
            {spread.description && (
              <p className="text-white/40 text-xs mt-0.5 line-clamp-2 leading-tight">{spread.description}</p>
            )}
          </div>
          {spread.is_public && <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />}
        </div>
        {deckName && (
          <p className="text-white/30 text-[10px] mt-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3" /> {deckName}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SpreadManager() {
  const navigate = useNavigate();
  const [spreads, setSpreads]         = useState([]);
  const [deckMap, setDeckMap]         = useState({});
  const [isLoading, setIsLoading]     = useState(true);
  const [spreadToDelete, setSpreadToDelete] = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [user, setUser]               = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all'); // all | public | private

  const canUseFeature = isPaid(user);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userSpreads, userDecks, currentUser] = await Promise.all([
        base44.entities.Spread.list(),
        base44.entities.Deck.list(),
        base44.auth.me().catch(() => null),
      ]);
      setUser(currentUser);
      setSpreads(userSpreads || []);
      setDeckMap((userDecks || []).reduce((acc, d) => { acc[d.id] = d.name; return acc; }, {}));
    } catch {
      toast.error('Failed to load spreads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEdit = (spread) => {
    navigate(createPageUrl(`SpreadDesigner?id=${spread.id}`));
  };

  const handleDeleteConfirm = async () => {
    if (!spreadToDelete) return;
    setIsDeleting(true);
    try {
      await base44.entities.Spread.delete(spreadToDelete.id);
      toast.success(`"${spreadToDelete.name}" deleted.`);
      setSpreadToDelete(null);
      loadData();
    } catch {
      toast.error('Failed to delete spread.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = spreads.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'public' && s.is_public) || (filter === 'private' && !s.is_public);
    return matchSearch && matchFilter;
  });

  const publicCount  = spreads.filter(s => s.is_public).length;
  const privateCount = spreads.filter(s => !s.is_public).length;

  return (
    <div className="min-h-screen text-white pb-24"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(49,10,84,0.5) 0%, #07050f 60%)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(7,5,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('Studio'))}
          className="text-white/60 hover:text-white rounded-full">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">Spread Manager</p>
          <p className="text-xs text-purple-400">{spreads.length} spread{spreads.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to={createPageUrl('SpreadDesigner')}>
          <Button size="sm" className="rounded-full bg-purple-600 hover:bg-purple-700 text-xs px-3">
            <Plus className="w-3.5 h-3.5 mr-1" /> New
          </Button>
        </Link>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {!canUseFeature ? (
          <UpgradePrompt featureName="Custom Spread Creation"
            featureDescription="Design, save, and use your own card spread layouts for a truly personalised reading experience." />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
              <p className="text-white/50 text-sm">Loading spreads…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {[
                { label: 'Total',   value: spreads.length,  color: '#a78bfa', id: 'all'     },
                { label: 'Public',  value: publicCount,     color: '#34d399', id: 'public'  },
                { label: 'Private', value: privateCount,    color: '#f97316', id: 'private' },
              ].map(stat => (
                <button key={stat.id} onClick={() => setFilter(stat.id)}
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-5 py-3 border transition-all"
                  style={{
                    background: filter === stat.id ? `${stat.color}18` : 'rgba(255,255,255,0.04)',
                    borderColor: filter === stat.id ? `${stat.color}44` : 'rgba(255,255,255,0.08)',
                    minWidth: 80,
                  }}>
                  <span className="text-2xl font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="text-[10px] text-white/50 mt-1">{stat.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search spreads…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
              />
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Layers className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">
                  {spreads.length === 0 ? 'No spreads yet' : 'No matches'}
                </h3>
                <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
                  {spreads.length === 0
                    ? 'Create your first custom spread layout for readings.'
                    : 'Try adjusting your search.'}
                </p>
                {spreads.length === 0 && (
                  <Link to={createPageUrl('SpreadDesigner')}>
                    <Button className="rounded-full bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" /> Create First Spread
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filtered.map((spread, i) => (
                    <SpreadCard
                      key={spread.id}
                      spread={spread}
                      deckName={deckMap[spread.deck_id]}
                      onEdit={handleEdit}
                      onDelete={setSpreadToDelete}
                      index={i}
                    />
                  ))}
                </AnimatePresence>

                {/* New spread tile */}
                <Link to={createPageUrl('SpreadDesigner')}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: filtered.length * 0.04 }}
                    className="rounded-2xl border-2 border-dashed border-purple-500/20 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/40 transition-all"
                    style={{ minHeight: 160, background: 'rgba(124,58,237,0.04)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-8 h-8 text-purple-400/50 mb-2" />
                    <span className="text-xs text-purple-400/60 font-semibold">New Spread</span>
                  </motion.div>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!spreadToDelete} onOpenChange={open => !open && setSpreadToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Spread</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Delete <span className="font-semibold text-white">"{spreadToDelete?.name}"</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}