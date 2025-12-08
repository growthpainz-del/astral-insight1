
import React from "react";
import { Deck } from "@/entities/Deck";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Although not used in the new design, keeping for completeness if parts were intended to stay.
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Trash2, Link as LinkIcon, BookOpen } from "lucide-react";

export default function ManualManager({ deckId }) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false); // For overall save action
  const [uploading, setUploading] = React.useState(false); // For specific file upload action
  const [deckName, setDeckName] = React.useState("");
  const [manualFiles, setManualFiles] = React.useState([]);
  const [error, setError] = React.useState("");

  // New state for the dedicated upload section
  const [uploadFile, setUploadFile] = React.useState(null);
  const [uploadName, setUploadName] = React.useState("");

  React.useEffect(() => {
    if (!deckId) return;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const d = await Deck.get(deckId);
        setDeckName(d?.name || "");
        setManualFiles(Array.isArray(d?.manual_files) ? d.manual_files : []);
      } catch (e) {
        setError(e.message || "Failed to load deck data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId]);

  const handleUpload = async () => {
    if (!uploadFile) {
      setError("Please select a file to upload.");
      return;
    }
    if (!uploadName.trim()) {
      setError("Please provide a name for the manual.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const { file_url } = await UploadFile({ file: uploadFile });
      const next = [
        ...manualFiles,
        {
          name: uploadName.trim(),
          url: file_url,
          content: "", // content is typically extracted during processing, not on upload
          uploaded_date: new Date().toISOString(),
        },
      ];
      setManualFiles(next);
      setUploadFile(null); // Clear selected file
      setUploadName(""); // Clear name input
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeIndex = (idx) => {
    setManualFiles((arr) => arr.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        manual_files: manualFiles.map((m) => ({
          name: m.name || "Manual",
          url: m.url,
          content: m.content || "",
          uploaded_date: m.uploaded_date || new Date().toISOString(),
        })),
        // manual_url is removed from the payload as per the new design
      };
      await Deck.update(deckId, payload);
      // No onSaved() or onClose() as the component is now embedded
      alert("Manuals saved successfully!"); // Simple feedback for embedded component
    } catch (e) {
      setError(e.message || "Failed to save manuals");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          What are Manuals?
        </h4>
        <p className="text-blue-200/80 text-sm">
          Manuals are guides that teach users how to read this deck <strong>without AI assistance</strong>. 
          They should include card meanings, interpretation techniques, and guidance for doing readings manually.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
        </div>
      ) : (
        <>
          {/* Upload new manual */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <Label className="text-white mb-3 block">Upload Reading Guide (PDF)</Label>
            <p className="text-white/60 text-sm mb-3">
              Upload a PDF that explains how to interpret cards and perform readings with this deck manually.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="bg-black/30 border-white/20 text-white flex-grow"
              />
              <Input
                placeholder="Manual name (e.g., 'Beginner's Guide')"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="bg-black/30 border-white/20 text-white flex-grow"
              />
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadName || uploading}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Uploaded Reading Guides</Label>
            <ScrollArea className="max-h-48 rounded border border-white/10">
              <div className="p-3 space-y-3">
                {manualFiles.length === 0 ? (
                  <div className="text-sm text-white/60">No uploaded manuals yet.</div>
                ) : (
                  manualFiles.map((m, idx) => (
                    <div key={idx} className="rounded border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-700/40">PDF</Badge>
                            <Input
                              value={m.name}
                              onChange={(e) =>
                                setManualFiles((arr) =>
                                  arr.map((it, i) => (i === idx ? { ...it, name: e.target.value } : it))
                                )
                              }
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="text-xs text-white/60 truncate mt-1">{m.url}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => window.open(m.url, "_blank")}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-900/20" onClick={() => removeIndex(idx)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-white/60">You can upload multiple parts (e.g., "Beginner's Guide", "Advanced Techniques").</p>
          </div>

          {error && <div className="text-red-300 text-sm">{error}</div>}

          {/* Save button for the overall manual files changes */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving || uploading} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save All Manual Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
