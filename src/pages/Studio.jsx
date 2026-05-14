import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Plus, Palette, Layers, Globe, Lock, Search, 
  BarChart3, Loader2, Copy, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function Studio() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [deckStats, setDeckStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [duplicating, setDuplicating] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) return;
      
      const userDecks = await base44.entities.Deck.filter({});
      const myDecks = userDecks.filter(d => d.created_by === user.email);
      setDecks(myDecks);
      
      const stats = {};
      for (const deck of myDecks) {
        const cards = await base44.entities.Card.filter({ deck_id: deck.id });
        
        const categoryCount = {};
        cards.forEach(c => {
          const el = c.element || 'None';
          categoryCount[el] = (categoryCount[el] || 0) + 1;
        });
        
        const distribution = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
        
        stats[deck.id] = {
          totalCards: cards.length,
          distribution,
          rawCards: cards
        };
      }
      setDeckStats(stats);
    } catch (err) {
      toast.error('Failed to load studio data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (deck) => {
    setDuplicating(deck.id);
    try {
      const { id, created_date, updated_date, created_by, ...deckData } = deck;
      deckData.name = deckData.name + ' (Copy)';
      deckData.is_public = false;
      
      const newDeck = await base44.entities.Deck.create(deckData);
      
      const oldCards = deckStats[deck.id]?.rawCards || [];
      const newCards = oldCards.map(c => {
        const { id, created_date, updated_date, created_by, ...cardData } = c;
        cardData.deck_id = newDeck.id;
        return cardData;
      });
      
      const chunkSize = 50;
      for (let i = 0; i < newCards.length; i += chunkSize) {
        await base44.entities.Card.bulkCreate(newCards.slice(i, i + chunkSize));
      }
      
      toast.success(`Duplicated "${deck.name}" successfully!`);
      loadData();
    } catch (err) {
      toast.error('Failed to duplicate deck.');
    } finally {
      setDuplicating(null);
    }
  };

  const filteredDecks = decks.filter(d => 
    !search || d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(49,10,84,0.5) 0%, #07050f 60%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(49,10,84,0.5) 0%, #07050f 60%)' }}>
      
      <div className="max-w-6xl mx-auto px-4 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30">
                <Palette className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold font-['Cinzel'] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                Creator Studio
              </h1>
            </div>
            <p className="text-purple-200/70 text-lg font-['Crimson_Text']">Manage, analyze, and build your oracle decks.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text"
                placeholder="Search decks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-full focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <Link to={createPageUrl("CreateDeck")}>
              <Button className="bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg shadow-purple-900/50 px-6">
                <Plus className="w-4 h-4 mr-2" /> New Deck
              </Button>
            </Link>
          </div>
        </div>

        {filteredDecks.length === 0 ? (
          <div className="text-center py-24 bg-black/20 border border-white/5 rounded-3xl backdrop-blur-sm">
            <Layers className="w-16 h-16 text-purple-500/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2 font-['Cinzel']">No Decks Found</h3>
            <p className="text-white/50 mb-6 font-['Crimson_Text']">You haven't created any decks yet, or none match your search.</p>
            <Link to={createPageUrl("CreateDeck")}>
              <Button className="bg-purple-600 hover:bg-purple-700 rounded-full">
                <Plus className="w-4 h-4 mr-2" /> Create Your First Deck
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredDecks.map((deck, idx) => {
                const stats = deckStats[deck.id];
                const isDeduplicating = duplicating === deck.id;

                return (
                  <motion.div
                    key={deck.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-black/40 border border-white/10 hover:border-purple-500/30 rounded-3xl overflow-hidden backdrop-blur-md transition-all duration-300 flex flex-col"
                  >
                    <div className="flex h-32 md:h-40 border-b border-white/10 relative overflow-hidden bg-purple-900/20">
                      {deck.cover_image ? (
                        <img src={deck.cover_image} alt={deck.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Palette className="w-12 h-12 text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      
                      <div className="absolute top-4 left-4 flex gap-2">
                        {deck.is_public ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                        {deck.category && (
                          <span className="bg-white/10 text-white/70 border border-white/20 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                            {deck.category}
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold text-white font-['Cinzel'] tracking-wide truncate pr-4 drop-shadow-md">
                            {deck.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                        {/* Stat Block 1 */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center text-center">
                          <Layers className="w-6 h-6 text-purple-400 mb-2" />
                          <span className="text-3xl font-bold text-white">{stats ? stats.totalCards : '...'}</span>
                          <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mt-1">Total Cards</span>
                        </div>

                        {/* Stat Block 2 - Visual Distribution */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center">
                          <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> Elements
                          </span>
                          <div className="w-full h-16 flex items-center justify-center">
                            {stats && stats.distribution.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={stats.distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={15}
                                    outerRadius={30}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {stats.distribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <span className="text-xs text-white/30">No data</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        <Button 
                          onClick={() => handleDuplicate(deck)}
                          disabled={isDeduplicating}
                          variant="outline" 
                          className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                        >
                          {isDeduplicating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                          Duplicate
                        </Button>
                        <Link to={createPageUrl(`DeckView?id=${deck.id}`)} className="flex-1">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            Manage <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}