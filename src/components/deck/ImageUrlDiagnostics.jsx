import React, { useState } from "react";
import { Card as CardEntity } from "@/entities/Card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Loader2, Link as LinkIcon, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ImageUrlDiagnostics({ deckId }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const checkImageUrls = async () => {
    setLoading(true);
    try {
      const cards = await CardEntity.filter({ deck_id: deckId });
      
      const analysis = {
        total: cards.length,
        withImages: 0,
        missingImages: 0,
        externalUrls: 0,
        base44Urls: 0,
        brokenUrls: [],
        missingCards: [],
        externalCards: [],
      };

      for (const card of cards) {
        if (!card.image_url || card.image_url.trim() === "") {
          analysis.missingImages++;
          analysis.missingCards.push({
            name: card.name,
            number: card.number,
            id: card.id
          });
        } else {
          analysis.withImages++;
          
          // Check if external URL
          if (!/supabase\.co\/storage\/v1\/object\/public\/base44-prod/i.test(card.image_url)) {
            analysis.externalUrls++;
            analysis.externalCards.push({
              name: card.name,
              number: card.number,
              url: card.image_url,
              id: card.id
            });
          } else {
            analysis.base44Urls++;
          }
        }
      }

      setResults(analysis);
    } catch (error) {
      console.error("Error checking image URLs:", error);
      alert("Failed to check image URLs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Image URL Diagnostics</h3>
        <Button
          onClick={checkImageUrls}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Image URLs
            </>
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-white/60 mb-1">Total Cards</div>
              <div className="text-2xl font-bold text-white">{results.total}</div>
            </div>
            
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <div className="text-xs text-green-300 mb-1">With Images</div>
              <div className="text-2xl font-bold text-green-300">{results.withImages}</div>
            </div>
            
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <div className="text-xs text-red-300 mb-1">Missing Images</div>
              <div className="text-2xl font-bold text-red-300">{results.missingImages}</div>
            </div>
            
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
              <div className="text-xs text-amber-300 mb-1">External URLs</div>
              <div className="text-2xl font-bold text-amber-300">{results.externalUrls}</div>
            </div>
          </div>

          {/* Warning about external URLs */}
          {results.externalUrls > 0 && (
            <div className="bg-amber-900/20 border border-amber-500/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-300 mb-2">External URLs Detected</h4>
                  <p className="text-sm text-amber-200 mb-3">
                    {results.externalUrls} card{results.externalUrls > 1 ? 's have' : ' has'} external image URLs.
                    External URLs can break if the source website goes down or changes.
                  </p>
                  <p className="text-sm text-white/80 font-medium">
                    💡 <strong>Solution:</strong> Use the "Rehost Images" tool in DeckView to copy all images to Base44's permanent storage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Missing Images List */}
          {results.missingCards.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg">
              <div className="px-4 py-3 border-b border-white/10">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Cards Missing Images ({results.missingCards.length})
                </h4>
              </div>
              <ScrollArea className="max-h-60">
                <div className="p-4 space-y-2">
                  {results.missingCards.map((card, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-900/10 border border-red-500/20 rounded p-2">
                      <div className="flex items-center gap-2">
                        {card.number && <Badge variant="outline" className="text-xs">{card.number}</Badge>}
                        <span className="text-sm text-white">{card.name || "Unnamed Card"}</span>
                      </div>
                      <span className="text-xs text-red-300">No image URL</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* External URLs List */}
          {results.externalCards.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg">
              <div className="px-4 py-3 border-b border-white/10">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-400" />
                  Cards with External URLs ({results.externalCards.length})
                </h4>
              </div>
              <ScrollArea className="max-h-60">
                <div className="p-4 space-y-2">
                  {results.externalCards.map((card, i) => (
                    <div key={i} className="bg-amber-900/10 border border-amber-500/20 rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {card.number && <Badge variant="outline" className="text-xs">{card.number}</Badge>}
                        <span className="text-sm font-medium text-white">{card.name || "Unnamed Card"}</span>
                      </div>
                      <div className="text-xs text-white/60 break-all">{card.url}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Success State */}
          {results.missingImages === 0 && results.externalUrls === 0 && (
            <div className="bg-green-900/20 border border-green-500/40 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div>
                  <h4 className="font-semibold text-green-300 mb-1">All Good! ✨</h4>
                  <p className="text-sm text-green-200">
                    All {results.total} cards have images, and they're all hosted on Base44's secure storage.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}