import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Spread } from '@/entities/Spread';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Move, Trash2, Eye, RotateCcw, Save } from 'lucide-react';

const SPREAD_CATEGORIES = [
  "General", "Love & Relationships", "Career & Finance", "Spiritual Growth", 
  "Decision Making", "Past/Present/Future", "Chakras & Energy", "Celtic", "Custom"
];

export default function SpreadEditor({ spread, decks, user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: spread?.name || '',
    description: spread?.description || '',
    category: spread?.category || 'General',
    positions: spread?.positions || [],
    is_public: spread?.is_public || false,
    deck_id: spread?.deck_id || null
  });
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Drag-to-move setup
  const containerRef = useRef(null);
  const draggingIndexRef = useRef(-1);

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const updatePositionByClient = (index, clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;
    const step = 1;
    const xSnap = clamp(Math.round(clamp(xPct, 5, 95) / step) * step, 5, 95);
    const ySnap = clamp(Math.round(clamp(yPct, 5, 95) / step) * step, 5, 95);
    updatePosition(index, 'x', xSnap);
    updatePosition(index, 'y', ySnap);
  };

  const onDragMove = (e) => {
    const idx = draggingIndexRef.current;
    if (idx < 0) return;
    const point = e.touches ? e.touches[0] : e;
    updatePositionByClient(idx, point.clientX, point.clientY);
    if (e.preventDefault) e.preventDefault();
  };

  const endDrag = () => {
    draggingIndexRef.current = -1;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', endDrag);
  };

  const startDrag = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    draggingIndexRef.current = index;
    setDraggedPosition(index);
    const point = e.touches ? e.touches[0] : e;
    updatePositionByClient(index, point.clientX, point.clientY);
    document.addEventListener('mousemove', onDragMove, { passive: false });
    document.addEventListener('mouseup', endDrag, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', endDrag, { passive: false });
  };

  const addPosition = () => {
    const newPosition = {
      name: `Position ${formData.positions.length + 1}`,
      meaning: '',
      x: 50,
      y: 50,
      rotation: 0
    };
    setFormData(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition]
    }));
  };

  const removePosition = (index) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
  };

  const updatePosition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((pos, i) => 
        i === index ? { ...pos, [field]: value } : pos
      )
    }));
  };

  const handleLayoutClick = (event) => {
    if (draggedPosition === null) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    updatePosition(draggedPosition, 'x', Math.max(5, Math.min(95, x)));
    updatePosition(draggedPosition, 'y', Math.max(5, Math.min(95, y)));
    setDraggedPosition(null);
  };

  const handleSave = async () => {
    // More specific validation messages
    if (!formData.name.trim()) {
      alert('Please provide a name for your spread.');
      return;
    }
    
    if (formData.positions.length === 0) {
      alert('Please add at least one card position. Click "Add Position" and then click on the layout to place it.');
      return;
    }

    // Validate that all positions have meanings
    const emptyMeanings = formData.positions.some(pos => !pos.meaning.trim());
    if (emptyMeanings) {
      alert('Please provide a meaning for all card positions.');
      return;
    }

    setIsSaving(true);
    try {
      if (spread) {
        await Spread.update(spread.id, formData);
      } else {
        await Spread.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving spread:', error);
      alert('Failed to save spread. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl border border-white/20 w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            {spread ? 'Edit Spread' : 'Create New Spread'}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="border-white/20 text-purple-200 hover:bg-white/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-1/3 p-6 overflow-y-auto min-h-0 border-r border-white/10" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Spread Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Celtic Cross, Love Triangle..."
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and use of this spread..."
                  className="bg-white/10 border-white/20 text-white h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPREAD_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {user?.role === 'admin' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_public" className="text-sm text-purple-200">
                    Make this spread publicly available
                  </label>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Card Positions</h3>
                  <Button onClick={addPosition} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Position
                  </Button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {formData.positions.map((position, index) => (
                    <Card key={index} className="bg-white/5 border-white/10">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${draggedPosition === index ? 'bg-purple-500 text-white' : 'border-purple-400/30 text-purple-300'}`}
                          >
                            Position {index + 1}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDraggedPosition(draggedPosition === index ? null : index)}
                              className={`h-6 w-6 p-0 ${draggedPosition === index ? 'bg-purple-500 text-white' : 'text-purple-300 hover:text-white'}`}
                            >
                              <Move className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePosition(index)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <Input
                          value={position.name}
                          onChange={(e) => updatePosition(index, 'name', e.target.value)}
                          placeholder="Position name..."
                          className="mb-2 text-xs h-8 bg-white/10 border-white/20 text-white"
                        />
                        <Textarea
                          value={position.meaning}
                          onChange={(e) => updatePosition(index, 'meaning', e.target.value)}
                          placeholder="What does this position represent?"
                          className="text-xs h-16 bg-white/10 border-white/20 text-white"
                        />
                        <div className="mt-3">
                          <label className="block text-[11px] text-purple-200 mb-1">Rotation: <span className="font-semibold">{(position.rotation ?? 0)}°</span></label>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={position.rotation ?? 0}
                            onChange={(e) => updatePosition(index, 'rotation', parseInt(e.target.value, 10))}
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Visual Layout Designer */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Visual Layout</h3>
                {draggedPosition !== null && (
                  <Badge className="bg-purple-600 text-white animate-pulse">
                    Drag to move Position {draggedPosition + 1}
                  </Badge>
                )}
              </div>
              
              <div 
                ref={containerRef}
                className="flex-1 relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-2 border-dashed border-white/20 rounded-2xl overflow-hidden cursor-default"
                style={{ touchAction: 'pan-y', userSelect: 'none' }}
                onMouseMove={(e) => draggingIndexRef.current >= 0 && onDragMove(e)}
                onTouchMove={(e) => draggingIndexRef.current >= 0 && onDragMove(e)}
                onMouseUp={endDrag}
                onTouchEnd={endDrag}
              >
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full grid grid-cols-10 grid-rows-10">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div key={i} className="border border-white/20"></div>
                    ))}
                  </div>
                </div>

                {/* Position cards */}
                {formData.positions.map((position, index) => (
                  <motion.div
                    key={index}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                      draggedPosition === index ? 'z-20' : 'z-10'
                    }`}
                    style={{ 
                      left: `${position.x}%`, 
                      top: `${position.y}%` 
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className={`w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center text-center cursor-move transition-all ${
                      draggedPosition === index
                        ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50'
                        : 'bg-white/10 border-white/30 hover:border-white/50 hover:bg-white/20'
                    }`}
                    onMouseDown={(e) => startDrag(e, index)}
                    onTouchStart={(e) => startDrag(e, index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraggedPosition(index);
                    }}
                    style={{ touchAction: 'none', userSelect: 'none', transform: `rotate(${position.rotation ?? 0}deg)` }}
                    >
                      <div className="text-xs font-bold text-white mb-1">
                        {index + 1}
                      </div>
                      <div className="text-[10px] text-purple-200 px-1 leading-tight">
                        {position.name.substring(0, 12)}
                        {position.name.length > 12 && '...'}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Instructions */}
                {formData.positions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-purple-300 bg-black/40 p-6 rounded-lg">
                      <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold mb-2">Create Your First Card Position</p>
                      <p className="text-sm">1. Click "Add Position" on the left</p>
                      <p className="text-sm">2. Then click here on the layout to place it</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            {isSaving ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {spread ? 'Update Spread' : 'Create Spread'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}