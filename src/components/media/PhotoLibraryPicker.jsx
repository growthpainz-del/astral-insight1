import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UploadAsset } from "@/entities/UploadAsset";
import { User } from "@/entities/User";
import { Card as CardEntity } from "@/entities/Card";
import { Deck } from "@/entities/Deck";
import { UploadFile } from "@/integrations/Core";
import { Image as ImageIcon, Search, Check, Copy, Loader2, ExternalLink, Upload as UploadIcon, Maximize2, Move, Edit2 } from "lucide-react";
import { getThumbnailUrl } from "@/lib/utils";

export default function PhotoLibraryPicker({ isOpen, onClose, onSelect, deckId }) {
  const [items, setItems] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copiedIdx, setCopiedIdx] = React.useState(null);
  const [decks, setDecks] = React.useState([]);

  const [visibleCount, setVisibleCount] = React.useState(24);
  const [preview, setPreview] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [compress, setCompress] = React.useState(true);
  const [alsoUploadOriginal, setAlsoUploadOriginal] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");

  // NEW: Drag state
  const [draggedImageUrl, setDraggedImageUrl] = React.useState(null);
  
  // NEW: Rename state
  const [editingId, setEditingId] = React.useState(null);
  const [editName, setEditName] = React.useState("");

  React.useEffect(() => {
    Deck.list("name", 200).then(setDecks).catch(() => setDecks([]));
  }, []);

  const isValidFile = (f) => {
    if (!f || typeof f !== "object") return false;
    const looksLikeBlob = typeof f.arrayBuffer === "function" || typeof f.stream === "function" || typeof f.slice === "function";
    return (typeof File !== "undefined" && f instanceof File) || looksLikeBlob;
  };

  const compressImage = async (file, maxSide = 1024, quality = 0.82) => {
    return await new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Failed to compress image"));
            const isPng = file.type === "image/png" || (file.name && file.name.toLowerCase().endsWith(".png"));
            const mimeType = isPng ? "image/png" : "image/jpeg";
            const ext = isPng ? ".png" : ".jpg";
            const name = (file.name || "image").replace(/\.(png|jpg|jpeg|webp|gif)$/i, ext);
            const outFile = new File([blob], name, { type: mimeType });
            resolve({ file: outFile, width: w, height: h });
          }, mimeType, isPng ? undefined : quality);
        };
        img.onerror = () => reject(new Error("Invalid image"));
        img.src = URL.createObjectURL(file);
      } catch (e) {
        reject(e);
      }
    });
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      let userEmail = null;
      try {
        const me = await User.me();
        userEmail = me?.email || null;
      } catch {
        userEmail = null;
      }

      let mine = [];
      if (userEmail) {
        try {
          mine = await UploadAsset.filter({ created_by: userEmail }, "-created_date", 400);
        } catch {
          mine = [];
        }
      }
      let allAssets = [];
      try {
        allAssets = await UploadAsset.filter(deckId ? { linked_deck_id: deckId } : {}, "-created_date", 200);
      } catch {
        allAssets = [];
      }
      const assets = [...(mine || []), ...(allAssets || [])];

      let cards = [];
      if (deckId) {
        try {
          const criteria = { deck_id: deckId };
          cards = await CardEntity.filter(criteria, "-updated_date", 300);
        } catch {
          cards = [];
        }
      }
      
      const cardImageItems = (cards || [])
        .filter((c) => c.image_url)
        .map((c) => ({
          id: `card-${c.id}`,
          file_url: c.image_url,
          thumbnail_url: c.image_url,
          file_name: c.name ? `${c.name}.jpg` : "Card image",
          mime_type: "image/jpeg",
          size: null,
          _source: "card"
        }));

      const cardIconItems = (cards || [])
        .filter((c) => c.spirit_wheel_icon_url)
        .map((c) => ({
          id: `card-icon-${c.id}`,
          file_url: c.spirit_wheel_icon_url,
          thumbnail_url: c.spirit_wheel_icon_url,
          file_name: c.name ? `${c.name} Icon.png` : "Card Icon",
          mime_type: "image/png",
          size: null,
          _source: "card"
        }));

      const byUrl = new Map();
      [...assets, ...cardImageItems, ...cardIconItems].forEach((it) => {
        const key = (it.file_url || "").trim();
        if (!key) return;
        if (!byUrl.has(key)) byUrl.set(key, it);
      });

      setItems(Array.from(byUrl.values()));
      setVisibleCount(24);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setPreview(null);
      setUploadError("");
      load();
    }
  }, [isOpen, load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const n = (it.file_name || "").toLowerCase();
      const u = (it.file_url || "").toLowerCase();
      return n.includes(q) || u.includes(q);
    });
  }, [items, query]);

  const visibleItems = React.useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const copyUrl = async (url, idx) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    } catch {
    }
  };

  const handleQuickUpload = async (fileList) => {
    const selected = Array.from(fileList || []).filter(isValidFile);
    if (!selected.length) return;
    setAdding(true);
    setUploadError("");
    try {
      for (let i = 0; i < selected.length; i++) {
        const f = selected[i];

        let thumbFile = f;
        let thumbMeta = { width: undefined, height: undefined };
        if (compress) {
          const res = await compressImage(f, 1024, 0.82);
          thumbFile = res.file;
          thumbMeta = { width: res.width, height: res.height };
        }

        const { file_url: thumb_url } = await UploadFile({ file: thumbFile });

        let full_url = thumb_url;
        if (alsoUploadOriginal && (!compress || f.size > thumbFile.size)) {
          const { file_url } = await UploadFile({ file: f });
          full_url = file_url;
        }

        await UploadAsset.create({
          file_url: full_url,
          thumbnail_url: thumb_url,
          file_name: f.name || "image",
          mime_type: f.type || "application/octet-stream",
          size: f.size || 0,
          width: thumbMeta.width,
          height: thumbMeta.height,
          linked_deck_id: deckId || undefined,
          tags: deckId ? ["deck:" + deckId] : []
        });
      }
      await load();
    } catch (e) {
      console.error("Upload failed:", e);
      setUploadError(e?.message || "Upload failed");
    } finally {
      setAdding(false);
      const input = document.getElementById("quick-upload-input");
      if (input) input.value = '';
    }
  };

  // NEW: Drag handlers for making images draggable
  const handleDragStart = (e, imageUrl) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", imageUrl);
    e.dataTransfer.setData("application/x-image-url", imageUrl);
    setDraggedImageUrl(imageUrl);
  };

  const handleDragEnd = () => {
    setDraggedImageUrl(null);
  };

  const handleRename = async (it, newName) => {
    if (!newName.trim() || newName === it.file_name) {
      setEditingId(null);
      return;
    }
    try {
      if (it._source === "card") {
        const id = it.id.replace("card-", "");
        await CardEntity.update(id, { name: newName });
      } else {
        await UploadAsset.update(it.id, { file_name: newName });
      }
      setItems(items.map(i => i.id === it.id ? { ...i, file_name: newName } : i));
    } catch (e) {
      console.error(e);
      alert("Failed to rename");
    } finally {
      setEditingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 text-white border border-purple-500/30 max-h-[90dvh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="relative pr-8">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-300" />
              Photo Library
            </DialogTitle>
          </div>
          <p className="text-sm text-purple-300 mt-2 flex items-center gap-2">
            <Move className="w-4 h-4" />
            💡 Drag images directly onto card placeholders to assign them!
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose} 
            className="absolute top-0 right-0 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or URL…"
                className="pl-9 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <label className={`inline-flex items-center gap-2 px-3 py-2 rounded border border-white/20 cursor-pointer ${adding ? "opacity-60" : ""}`}>
              <UploadIcon className="w-4 h-4" />
              {adding ? "Uploading…" : "Add images"}
              <input type="file" id="quick-upload-input" accept="image/*" multiple className="hidden" disabled={adding} onChange={(e) => handleQuickUpload(e.target.files)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/80">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="accent-purple-500" checked={compress} onChange={(e) => setCompress(e.target.checked)} />
                Smaller thumbnails
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="accent-purple-500" checked={alsoUploadOriginal} onChange={(e) => setAlsoUploadOriginal(e.target.checked)} />
                Also original
              </label>
              {uploadError && <span className="text-red-300">{uploadError}</span>}
            </div>
            
            {/* Moved Load More button to the free space on the right of the checkboxes */}
            {!loading && filtered.length > 0 && visibleCount < filtered.length && (
               <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setVisibleCount((c) => c + 24)}>
                 Load More (Next Page)
               </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading images…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-white/60 text-sm">No images found. Try uploading some first.</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-white/60">
                  Showing {visibleItems.length} of {filtered.length} images
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto rounded border border-white/10">
                <div className="grid gap-3 p-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {visibleItems.map((it, idx) => {
                    const thumb = it.thumbnail_url || it.file_url;
                    const title = it.file_name || "Image";
                    const isDragging = draggedImageUrl === it.file_url;
                    
                    return (
                      <div 
                        key={it.id || it.file_url} 
                        className={`bg-white/5 border border-white/10 rounded overflow-hidden flex flex-col group ${isDragging ? 'opacity-50' : ''}`}
                      >
                        {/* NEW: Make image draggable */}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, it.file_url)}
                          onDragEnd={handleDragEnd}
                          className="cursor-move relative"
                          title="Drag to assign to a card"
                        >
                          <img
                            src={getThumbnailUrl(thumb, 300)}
                            alt={title}
                            loading="lazy"
                            className="w-full h-28 object-cover"
                          />
                          {/* Drag indicator overlay */}
                          <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Move className="w-6 h-6 text-purple-300" />
                          </div>
                        </div>
                        <div className="p-2 flex items-center justify-between gap-2">
                          {editingId === (it.id || it.file_url) ? (
                            <Input 
                              autoFocus 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)} 
                              onBlur={() => handleRename(it, editName)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleRename(it, editName); if (e.key === "Escape") setEditingId(null); }}
                              className="h-6 text-xs px-1 bg-black/40 border-white/20 flex-1" 
                            />
                          ) : (
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <div className="truncate text-xs text-white/80 flex-1" title={title}>{title}</div>
                              <Button size="icon" variant="ghost" className="h-4 w-4 shrink-0 text-white/40 hover:text-white" onClick={() => { setEditingId(it.id || it.file_url); setEditName(title); }} title="Rename">
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/80 hover:text-white" onClick={() => copyUrl(it.file_url, idx)} title="Copy URL">
                              {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/80 hover:text-white" onClick={() => setPreview({ url: it.file_url, name: title })} title="Preview">
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="h-7"
                              onClick={() => onSelect && onSelect(it.file_url)}
                              title="Use this image"
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {visibleCount < filtered.length && (
                <div className="flex justify-center mt-3">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setVisibleCount((c) => c + 24)}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Close
          </Button>
        </DialogFooter>

        {preview && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
            <div className="bg-slate-900 border border-white/10 rounded p-2 max-w-5xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-white/80 text-sm truncate mr-4">{preview.name}</div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                    <a href={preview.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Open</a>
                  </Button>
                  <Button size="sm" onClick={() => { onSelect && onSelect(preview.url); setPreview(null); }}><Maximize2 className="w-4 h-4 mr-2" />Use</Button>
                </div>
              </div>
              <img src={preview.url} alt={preview.name} className="max-h-[75vh] max-w-full object-contain rounded self-center" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}