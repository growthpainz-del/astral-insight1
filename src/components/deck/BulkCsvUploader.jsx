import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkCsvUploader({ deckId, onDone }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setResults(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV must have a header row and at least one data row.");
      
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const cardsToCreate = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 1 && !row[0]) continue; // skip empty rows
        
        const cardData = { deck_id: deckId };
        headers.forEach((h, j) => {
          if (row[j]) {
            if (h === 'keywords') {
              cardData[h] = row[j].split(',').map(k => k.trim()).filter(Boolean);
            } else if (h === 'number') {
              cardData[h] = parseInt(row[j], 10) || 0;
            } else {
              cardData[h] = row[j];
            }
          }
        });
        
        if (cardData.name) {
          cardsToCreate.push(cardData);
        }
      }
      
      if (!cardsToCreate.length) throw new Error("No valid cards found in CSV. Make sure there is a 'name' column.");
      
      // Upload in chunks
      const chunkSize = 50;
      let successCount = 0;
      for (let i = 0; i < cardsToCreate.length; i += chunkSize) {
        const chunk = cardsToCreate.slice(i, i + chunkSize);
        await base44.entities.Card.bulkCreate(chunk);
        successCount += chunk.length;
        setProgress(Math.round((successCount / cardsToCreate.length) * 100));
      }
      
      setResults({ count: successCount });
      toast.success(`Successfully imported ${successCount} cards!`);
      if (onDone) onDone();
    } catch (err) {
      toast.error(err.message || "Failed to parse CSV");
    } finally {
      setIsUploading(false);
      setProgress(0);
      e.target.value = null;
    }
  };

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let inQuotes = false;
    let val = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const nc = text[i+1];
      if (c === '"' && inQuotes && nc === '"') {
        val += '"'; i++;
      } else if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(val); val = '';
      } else if (c === '\n' && !inQuotes) {
        row.push(val); rows.push(row); row = []; val = '';
      } else if (c === '\r' && !inQuotes) {
        // ignore
      } else {
        val += c;
      }
    }
    row.push(val);
    if (row.some(v => v)) rows.push(row);
    return rows;
  }

  return (
    <div className="space-y-4">
      <div className="p-6 border-2 border-dashed border-white/20 rounded-xl bg-white/5 text-center">
        <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Upload CSV</h3>
        <p className="text-white/60 text-sm mb-6 max-w-sm mx-auto">
          Your CSV must include a <code className="text-purple-300">name</code> column. Other supported columns: subtitle, keywords, element, upright_meaning, reversed_meaning, etc.
        </p>
        
        <div className="relative inline-block w-full max-w-xs">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <Button disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 w-full relative z-0">
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing {progress}%</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Select CSV File</>
            )}
          </Button>
        </div>
      </div>
      
      {results && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-emerald-100 font-bold">Import Complete</p>
            <p className="text-emerald-200/70 text-sm">Successfully added {results.count} cards to the deck.</p>
          </div>
        </div>
      )}
    </div>
  );
}