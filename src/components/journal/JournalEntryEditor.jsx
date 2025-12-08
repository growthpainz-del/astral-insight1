import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Save, 
  Loader2, 
  Calendar,
  Tag,
  Plus,
  Star,
  Link as LinkIcon
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { queueApiCall } from "@/components/utils/apiQueue";

export default function JournalEntryEditor({ entry, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    question: "",
    entry_content: "",
    tags: [],
    mood: "",
    follow_up_notes: "",
    manifestation_rating: null,
    is_favorite: false,
    reading_id: null,
    deck_id: null,
    spread_type: null,
    cards_drawn: []
  });

  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // For linking to readings
  const [recentReadings, setRecentReadings] = useState([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData(entry);
    }
  }, [entry]);

  // Load recent readings for linking
  useEffect(() => {
    const loadReadings = async () => {
      try {
        setLoadingReadings(true);
        const readings = await queueApiCall(
          () => base44.entities.Reading.list("-created_date", 20),
          2,
          800
        );
        setRecentReadings(readings);
      } catch (err) {
        console.error("Failed to load readings:", err);
      } finally {
        setLoadingReadings(false);
      }
    };

    loadReadings();
  }, []);

  const handleLinkReading = async (readingId) => {
    if (!readingId) {
      setFormData(prev => ({
        ...prev,
        reading_id: null,
        deck_id: null,
        spread_type: null,
        cards_drawn: []
      }));
      return;
    }

    try {
      const reading = await queueApiCall(
        () => base44.entities.Reading.get(readingId),
        2,
        800
      );

      // Get card details
      const cardIds = reading.cards_drawn?.map(c => c.card_id) || [];
      const cards = await Promise.all(
        cardIds.map(id => 
          queueApiCall(() => base44.entities.Card.get(id), 2, 800)
            .catch(() => null)
        )
      );

      const cardsData = reading.cards_drawn?.map((drawn, i) => ({
        card_id: drawn.card_id,
        card_name: cards[i]?.name || "Unknown",
        position: drawn.position,
        is_reversed: drawn.is_reversed || false
      })) || [];

      setFormData(prev => ({
        ...prev,
        reading_id: readingId,
        deck_id: reading.deck_id,
        spread_type: reading.spread_type,
        cards_drawn: cardsData,
        question: prev.question || reading.title || ""
      }));

    } catch (err) {
      console.error("Failed to load reading details:", err);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(formData);
    } catch (err) {
      console.error("Failed to save entry:", err);
      setError(err.message || "Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
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
        className="bg-slate-900 rounded-xl border border-purple-500/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h3 className="text-2xl font-bold text-white">
            {entry ? "Edit Journal Entry" : "New Journal Entry"}
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 text-red-200">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <Label className="text-white mb-2 block">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give your entry a meaningful title..."
              className="bg-black/30 border-white/20 text-white"
              required
            />
          </div>

          {/* Date and Mood */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-black/30 border-white/20 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Mood</Label>
              <Select
                value={formData.mood}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
              >
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue placeholder="How did you feel?" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 text-white">
                  <SelectItem value="hopeful">Hopeful</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                  <SelectItem value="peaceful">Peaceful</SelectItem>
                  <SelectItem value="confused">Confused</SelectItem>
                  <SelectItem value="empowered">Empowered</SelectItem>
                  <SelectItem value="grateful">Grateful</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                  <SelectItem value="inspired">Inspired</SelectItem>
                  <SelectItem value="reflective">Reflective</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link to Reading */}
          <div>
            <Label className="text-white mb-2 block flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link to Reading (Optional)
            </Label>
            <Select
              value={formData.reading_id || ""}
              onValueChange={handleLinkReading}
            >
              <SelectTrigger className="bg-black/30 border-white/20 text-white">
                <SelectValue placeholder="Select a recent reading..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white max-h-[200px]">
                <SelectItem value={null}>No reading linked</SelectItem>
                {recentReadings.map(reading => (
                  <SelectItem key={reading.id} value={reading.id}>
                    {reading.title} - {new Date(reading.date || reading.created_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question */}
          <div>
            <Label className="text-white mb-2 block">Question Asked</Label>
            <Input
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="What question did you ask the cards?"
              className="bg-black/30 border-white/20 text-white"
            />
          </div>

          {/* Entry Content */}
          <div>
            <Label className="text-white mb-2 block">Your Reflections</Label>
            <Textarea
              value={formData.entry_content}
              onChange={(e) => setFormData(prev => ({ ...prev, entry_content: e.target.value }))}
              placeholder="Write your thoughts, insights, and reflections..."
              className="bg-black/30 border-white/20 text-white min-h-[200px]"
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="text-white mb-2 block flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="bg-black/30 border-white/20 text-white flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="border-white/20 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, i) => (
                  <Badge
                    key={i}
                    className="bg-purple-600/20 text-purple-200 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Notes */}
          <div>
            <Label className="text-white mb-2 block">Follow-up Notes</Label>
            <Textarea
              value={formData.follow_up_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, follow_up_notes: e.target.value }))}
              placeholder="How did the reading manifest? Add notes as events unfold..."
              className="bg-black/30 border-white/20 text-white min-h-[100px]"
            />
          </div>

          {/* Manifestation Rating */}
          <div>
            <Label className="text-white mb-2 block flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reading Accuracy (1-5 stars)
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, manifestation_rating: rating }))}
                  className="text-white/40 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      formData.manifestation_rating >= rating
                        ? "text-amber-400 fill-current"
                        : ""
                    }`}
                  />
                </button>
              ))}
              {formData.manifestation_rating && (
                <Button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, manifestation_rating: null }))}
                  variant="ghost"
                  size="sm"
                  className="text-white/60"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={formData.is_favorite}
              onChange={(e) => setFormData(prev => ({ ...prev, is_favorite: e.target.checked }))}
              className="w-4 h-4"
            />
            <Label htmlFor="favorite" className="text-white cursor-pointer flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Mark as Favorite
            </Label>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-6 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/20 text-white"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}