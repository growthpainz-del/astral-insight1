import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spread, Deck } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Save, Plus, Loader2, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import SpreadDesignCanvas from '../components/spread/SpreadDesignCanvas';
import { toast } from 'sonner';

export default function SpreadDesigner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');
  const initialDeckId = searchParams.get('deckId');

  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    deck_id: initialDeckId || 'none',
    is_public: false,
    is_system_spread: false,
    requires_positions: true,
  });

  const [positions, setPositions] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        const [loadedDecks, user] = await Promise.all([
          Deck.list(),
          base44.auth.me().catch(() => null),
        ]);
        setDecks(loadedDecks || []);
        setIsAdmin(user?.role === 'admin');

        if (editId) {
          const spread = await Spread.get(editId);
          if (spread) {
            setFormData({
              name: spread.name || '',
              description: spread.description || '',
              category: spread.category || 'General',
              deck_id: spread.deck_id || 'none',
              is_public: spread.is_public || false,
              is_system_spread: spread.is_system_spread || false,
              requires_positions: spread.requires_positions ?? true,
            });
            setPositions(spread.positions || []);
          }
        } else {
          // Pre-populate with one default card
          setPositions([
            { id: Date.now().toString(), name: 'Card 1', meaning: '', x: 50, y: 50, rotation: 0 }
          ]);
        }
      } catch (err) {
        toast.error('Failed to initialize designer.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [editId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPosition = () => {
    setPositions(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Card ${prev.length + 1}`,
        meaning: '',
        x: 50 + (prev.length * 2), // Slight offset
        y: 50 + (prev.length * 2),
        rotation: 0
      }
    ]);
  };

  const handleUpdatePosition = (index, data) => {
    setPositions(prev => {
      const p = [...prev];
      p[index] = { ...p[index], ...data };
      return p;
    });
  };

  const handleDeletePosition = (index) => {
    setPositions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error('Spread name is required.');
    if (positions.length === 0) return toast.error('Add at least one card position.');
    if (positions.some(p => !p.name.trim() || !p.meaning.trim())) {
      return toast.error('All positions need a name and meaning.');
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        deck_id: formData.deck_id === 'none' ? null : formData.deck_id,
        positions: positions.map(({ id, ...rest }) => rest), // Strip temporary IDs
      };

      if (editId) {
        await Spread.update(editId, payload);
        toast.success('Spread updated!');
      } else {
        await Spread.create(payload);
        toast.success('Spread created!');
      }
      navigate(createPageUrl('SpreadManager'));
    } catch {
      toast.error('Failed to save spread.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07050f]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }

  const CanvasSection = (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-[#07050f]' : 'h-[600px] rounded-2xl overflow-hidden border border-white/10'}`}>
      <SpreadDesignCanvas positions={positions} onPositionsChange={setPositions} />
      
      {/* Canvas tools */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-black/60 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md"
          onClick={() => setIsFullscreen(!isFullscreen)}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10">
          {positions.length} position{positions.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={handleAddPosition} className="rounded-full shadow-lg bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-1" /> Add Card
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(49,10,84,0.5) 0%, #07050f 60%)' }}>
      
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#07050f]/90 backdrop-blur-xl border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white/60 hover:text-white rounded-full">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h1 className="text-sm font-bold">{editId ? 'Edit Spread' : 'New Spread'}</h1>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-4">
          {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Form & List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* Metadata Form */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h2 className="font-bold text-lg text-purple-200">Spread Details</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Name</label>
              <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} 
                className="bg-black/40 border-white/10" placeholder="e.g. Past, Present, Future" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Description</label>
              <Textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} 
                className="bg-black/40 border-white/10 resize-none h-20" placeholder="What is this spread used for?" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Category</label>
                <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {['General', 'Relationship', 'Career', 'Spiritual', 'Runes', 'Custom'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Deck Link</label>
                <Select value={formData.deck_id} onValueChange={v => handleChange('deck_id', v)}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="none">Any Deck</SelectItem>
                    {decks.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-white/10 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="is_public" checked={formData.is_public} onCheckedChange={c => handleChange('is_public', c)} />
                <label htmlFor="is_public" className="text-sm cursor-pointer">Make public (community can use)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="req_pos" checked={formData.requires_positions} onCheckedChange={c => handleChange('requires_positions', c)} />
                <label htmlFor="req_pos" className="text-sm cursor-pointer">Show position meanings in reading</label>
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="is_sys" checked={formData.is_system_spread} onCheckedChange={c => handleChange('is_system_spread', c)} />
                  <label htmlFor="is_sys" className="text-sm cursor-pointer text-amber-400">System Spread (Admin only)</label>
                </div>
              )}
            </div>
          </div>

          {/* Position List */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-purple-200">Positions</h2>
              <Button size="icon" variant="ghost" onClick={handleAddPosition} className="h-8 w-8 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-300">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
              {positions.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No positions added yet.</p>
              ) : (
                positions.map((pos, i) => (
                  <div key={pos.id || i} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 relative group">
                    <button onClick={() => handleDeletePosition(i)} className="absolute top-2 right-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2 pr-6">
                      <span className="w-5 h-5 rounded-full bg-purple-900/50 border border-purple-500/50 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <Input value={pos.name} onChange={e => handleUpdatePosition(i, { name: e.target.value })} 
                        className="h-7 text-sm bg-transparent border-none px-1 py-0 focus-visible:ring-0 font-semibold" placeholder="Position Name" />
                    </div>
                    
                    <Textarea value={pos.meaning} onChange={e => handleUpdatePosition(i, { meaning: e.target.value })} 
                      className="text-xs min-h-[60px] bg-black/50 border-white/10 resize-none p-2" placeholder="Meaning or question..." />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Canvas */}
        <div className="w-full lg:w-2/3 h-[600px] lg:h-[calc(100vh-140px)] sticky top-[80px]">
          {CanvasSection}
        </div>

      </div>
    </div>
  );
}