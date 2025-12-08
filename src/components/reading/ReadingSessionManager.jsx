import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Reading } from "@/entities/Reading";
import { Save, FileText, Share2, Download, Copy, Check, Calendar, Clock, Share } from "lucide-react";
import { format } from "date-fns";
import ReadingShareModal from "./ReadingShareModal";

export default function ReadingSessionManager({
  isOpen,
  onClose,
  deckId,
  deckName,
  spreadType,
  question,
  drawnCards,
  interpretation,
  onSaved
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState(interpretation || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedReading, setSavedReading] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title for this reading");
      return;
    }

    setSaving(true);
    try {
      // FIXED: Store only the essential data, using original card IDs
      const cardsData = (drawnCards || []).map((card, idx) => ({
        card_id: card.id || card.card_id, // Use original card ID, not modified one
        position: card.position || `Position ${idx + 1}`,
        is_reversed: card.is_reversed || card.isReversed || false
      }));

      const reading = await Reading.create({
        title: title.trim(),
        spread_type: spreadType || "single",
        deck_id: deckId,
        cards_drawn: cardsData,
        interpretation: notes || "",
        date: new Date().toISOString().split('T')[0]
      });

      setSavedReading(reading);
      setSaved(true);
      if (onSaved) onSaved(reading);
    } catch (error) {
      alert("Failed to save reading: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const generateTextExport = () => {
    const timestamp = format(new Date(), "PPpp");
    let text = `🔮 TAROT READING\n`;
    text += `${"=".repeat(50)}\n\n`;
    text += `📅 Date: ${timestamp}\n`;
    text += `🎴 Spread: ${spreadType || "Single Card"}\n`;
    if (question) text += `❓ Question: ${question}\n`;
    text += `\n${"=".repeat(50)}\n\n`;

    if (drawnCards && drawnCards.length > 0) {
      text += `🃏 CARDS DRAWN:\n\n`;
      drawnCards.forEach((dc, idx) => {
        text += `${idx + 1}. ${dc.position || "Card"}\n`;
        text += `   ${dc.card_name || "Unknown Card"}`;
        if (dc.is_reversed) text += ` (Reversed)`;
        text += `\n\n`;
      });
      text += `${"=".repeat(50)}\n\n`;
    }

    if (notes) {
      text += `📝 INTERPRETATION:\n\n${notes}\n\n`;
      text += `${"=".repeat(50)}\n`;
    }

    return text;
  };

  const generateMarkdownExport = () => {
    const timestamp = format(new Date(), "PPpp");
    let md = `# 🔮 Tarot Reading\n\n`;
    md += `**Date:** ${timestamp}\n\n`;
    md += `**Spread:** ${spreadType || "Single Card"}\n\n`;
    if (question) md += `**Question:** ${question}\n\n`;
    md += `---\n\n`;

    if (drawnCards && drawnCards.length > 0) {
      md += `## 🃏 Cards Drawn\n\n`;
      drawnCards.forEach((dc, idx) => {
        md += `### ${idx + 1}. ${dc.position || "Card"}\n\n`;
        md += `**${dc.card_name || "Unknown Card"}**`;
        if (dc.is_reversed) md += ` *(Reversed)*`;
        md += `\n\n`;
      });
      md += `---\n\n`;
    }

    if (notes) {
      md += `## 📝 Interpretation\n\n${notes}\n\n`;
    }

    return md;
  };

  const generateJSONExport = () => {
    return JSON.stringify({
      title: title || "Untitled Reading",
      date: new Date().toISOString(),
      spread: spreadType || "single",
      question: question || "",
      cards: drawnCards || [],
      interpretation: notes || "",
      metadata: {
        deck_id: deckId,
        exported_at: new Date().toISOString()
      }
    }, null, 2);
  };

  const copyToClipboard = async (text, format) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (error) {
      alert("Failed to copy to clipboard");
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format) => {
    const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
    const baseFilename = (title || "reading").toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    switch(format) {
      case 'text':
        downloadFile(generateTextExport(), `${baseFilename}_${timestamp}.txt`, 'text/plain');
        break;
      case 'markdown':
        downloadFile(generateMarkdownExport(), `${baseFilename}_${timestamp}.md`, 'text/markdown');
        break;
      case 'json':
        downloadFile(generateJSONExport(), `${baseFilename}_${timestamp}.json`, 'application/json');
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 text-white border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            {saved ? "Reading Saved!" : "Save Reading Session"}
          </DialogTitle>
        </DialogHeader>

        {!saved ? (
          <div className="space-y-4">
            <div>
              <Label className="text-white/90 mb-2 block">Reading Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Guidance, Career Decision, Love Reading..."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white/90 mb-2 block flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes & Interpretation
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your personal notes, interpretations, and insights from this reading..."
                className="min-h-[200px] bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-white/60 mt-2">
                💡 Add your thoughts, feelings, and any insights that came up during the reading
              </p>
            </div>

            {drawnCards && drawnCards.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reading Summary
                </h4>
                <div className="space-y-1 text-sm text-white/80">
                  <p><strong>Spread:</strong> {spreadType || "Single Card"}</p>
                  {question && <p><strong>Question:</strong> {question}</p>}
                  <p><strong>Cards:</strong> {drawnCards.length} card{drawnCards.length > 1 ? 's' : ''} drawn</p>
                  <p><strong>Date:</strong> {format(new Date(), "PPP")}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 text-center">
              <Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-emerald-300 mb-1">Reading Saved Successfully!</h3>
              <p className="text-white/70 text-sm">
                Your reading has been saved and can be accessed from your Reading History
              </p>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Export or Share
              </h4>
              
              <Button
                onClick={() => setShowShareModal(true)}
                className="w-full mb-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Share className="w-4 h-4 mr-2" />
                Share on Social Media
              </Button>
              
              <div className="space-y-3">
                {/* Copy to Clipboard Options */}
                <div>
                  <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Copy to Clipboard</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generateTextExport(), 'text')}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {copiedFormat === 'text' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Plain Text
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generateMarkdownExport(), 'markdown')}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {copiedFormat === 'markdown' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Markdown
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generateJSONExport(), 'json')}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {copiedFormat === 'json' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      JSON
                    </Button>
                  </div>
                </div>

                {/* Download Options */}
                <div>
                  <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Download File</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleExport('text')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      .TXT
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExport('markdown')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      .MD
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExport('json')}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      .JSON
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-white/60 bg-blue-900/20 border border-blue-500/30 rounded p-2">
                💡 <strong>Tip:</strong> Copy as Markdown to paste into notes apps like Notion, Obsidian, or Apple Notes
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!saved ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {saving ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Reading
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Share Modal */}
      {showShareModal && savedReading && (
        <ReadingShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          reading={savedReading}
          deckName={deckName}
          spreadName={spreadType}
          drawnCards={drawnCards}
          question={question}
        />
      )}
    </Dialog>
  );
}