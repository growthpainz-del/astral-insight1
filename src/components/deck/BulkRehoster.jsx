import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
import { rehostDeckImages } from "@/functions/rehostDeckImages";

export default function BulkRehoster({ deckId, isOpen, onClose, onDone }) {
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setRunning(false);
      setResult(null);
      setError("");
    }
  }, [isOpen]);

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const { data } = await rehostDeckImages({ deckId });
      setResult(data);
      if (onDone) onDone();
    } catch (e) {
      setError(e?.message || "Failed to rehost images");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 text-white border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-300" />
            Rehost Deck Images
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-white/80">
            Lost access to external image URLs? This will copy the deck’s cover, back image, and all card images
            into your app’s storage and update references automatically.
          </p>

          {error && (
            <div className="text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded p-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-700/50">Cards updated</Badge>
                <span>{result.updated_cards}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-700/50">Cards skipped</Badge>
                <span>{result.skipped_cards}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-700/50">Failures</Badge>
                <span>{result.failed_cards}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={result.updated_cover ? "bg-emerald-700/50" : "bg-slate-700/50"}>
                  Cover rehosted
                </Badge>
                <span>{result.updated_cover ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={result.updated_back ? "bg-emerald-700/50" : "bg-slate-700/50"}>
                  Back rehosted
                </Badge>
                <span>{result.updated_back ? "Yes" : "No"}</span>
              </div>
              {Array.isArray(result.failures) && result.failures.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-white/80">Show error details</summary>
                  <ul className="list-disc ml-6 text-white/70">
                    {result.failures.slice(0, 50).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </details>
              )}
              <div className="text-xs text-white/60 mt-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Images are now served from your app’s storage.
              </div>
            </div>
          ) : (
            <div className="rounded border border-white/10 p-3 text-sm text-white/80">
              • We’ll only rehost images that point to external sites.<br/>
              • Existing Base44-hosted images are left as-is.<br/>
              • This may take a minute for large decks.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
          <Button onClick={handleRun} disabled={running} className="bg-amber-600 hover:bg-amber-700">
            {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rehosting…</> : "Rehost now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}