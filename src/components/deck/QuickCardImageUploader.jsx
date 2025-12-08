
import React from "react";
import { Card as CardEntity } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { safeUploadFile } from "@/components/utils/safeUpload";
import { retryAsync } from "@/components/utils/retry";
import { isNetworkError } from "@/components/utils/isNetworkError";
import { Image as ImageIcon, Upload, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import CardOptionLabel from "@/components/deck/CardOptionLabel";

export default function QuickCardImageUploader({ deckId, defaultCardId = "", onSaved }) {
  const [cards, setCards] = React.useState([]);
  const [loadingCards, setLoadingCards] = React.useState(true);
  const [cardId, setCardId] = React.useState(defaultCardId);
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCards(true);
        const list = await retryAsync(() => CardEntity.filter({ deck_id: deckId }), 3, 600);
        if (!mounted) return;
        const sorted = Array.isArray(list)
          ? [...list].sort((a, b) => {
              const an = a.number ?? 0;
              const bn = b.number ?? 0;
              if (an !== bn) return an - bn;
              return String(a.name || "").localeCompare(String(b.name || ""));
            })
          : [];
        setCards(sorted);
        if (!defaultCardId && sorted.length) {
          setCardId(sorted[0].id);
        } else if (defaultCardId) {
          setCardId(defaultCardId);
        }
      } catch (e) {
        setErrorMsg(isNetworkError(e)
          ? "Network error while loading cards. Please Retry."
          : (e?.message || "Failed to load cards."));
      } finally {
        if (mounted) setLoadingCards(false);
      }
    })();
    return () => { mounted = false; };
  }, [deckId, defaultCardId, reloadKey]);

  const filteredCards = React.useMemo(() => {
    if (!filter.trim()) return cards;
    const q = filter.toLowerCase();
    return cards.filter(c => {
      const name = String(c.name || "").toLowerCase();
      const num = (c.number != null ? String(c.number) : "");
      return name.includes(q) || num.includes(q);
    });
  }, [cards, filter]);

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setSuccessMsg("");
    setErrorMsg("");
    if (f) {
      if (typeof f.size === "number" && f.size > 15 * 1024 * 1024) {
        setErrorMsg("This image is too large (over ~15MB). Please resize/compress it or paste a direct image URL instead.");
        setPreviewUrl("");
        return;
      }
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleUpload = async () => {
    setSuccessMsg("");
    setErrorMsg("");

    if (!deckId) {
      setErrorMsg("Missing deck.");
      return;
    }
    if (!cardId) {
      setErrorMsg("Please select a card.");
      return;
    }
    if (!file && !imageUrl.trim()) {
      setErrorMsg("Choose a file or paste an image URL.");
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = imageUrl.trim();
      if (!finalUrl && file) {
        finalUrl = await safeUploadFile(file);
      }
      if (!finalUrl) {
        throw new Error("Upload failed – no URL returned.");
      }

      await retryAsync(() => CardEntity.update(cardId, { image_url: finalUrl }), 3, 600);
      setSuccessMsg("Card image updated!");
      setFile(null);
      setPreviewUrl("");
      onSaved && onSaved();
    } catch (e) {
      setErrorMsg(e?.message || "Failed to upload/update image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-5 h-5 text-purple-300" />
        <h3 className="text-lg font-bold text-white">Quick Upload: Set a Card Image</h3>
      </div>

      {loadingCards ? (
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading cards...
        </div>
      ) : (
        <>
          {(errorMsg && !successMsg) && (
            <div className="mb-3 bg-red-900/20 border border-red-500/40 text-red-100 p-2 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errorMsg}</span>
              </div>
              <Button
                variant="outline"
                className="border-red-400/40 text-red-100 hover:bg-red-800/30"
                onClick={() => setReloadKey(k => k + 1)}
              >
                Retry
              </Button>
            </div>
          )}
          {successMsg ? (
            <div className="mb-3 bg-emerald-900/20 border border-emerald-500/40 text-emerald-100 p-2 rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">{successMsg}</span>
            </div>
          ) : null}

          {/* Card dropdown & Search filter section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-sm text-white/80">Card</label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue placeholder="Select a card..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-72">
                  {filteredCards.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-white hover:bg-gray-800">
                      <CardOptionLabel card={c} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-1 space-y-2">
              <label className="text-sm text-white/80">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by name or number..."
                  className="pl-8 bg-black/40 border-white/20 text-white"
                />
              </div>
            </div>
          </div>

          {/* Image upload and preview section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Paste Image URL</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-black/40 border-white/20 text-white"
              />
              <div>
                <label className="text-sm text-white/80 block mb-1">Or Choose File</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="bg-black/40 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="aspect-video rounded-md border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-white/50 text-sm p-3 text-center">
                    Image preview will appear here after choosing a file
                  </div>
                )}
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading || (!file && !imageUrl.trim()) || !cardId}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Set Card Image
                  </>
                )}
              </Button>
              <p className="text-xs text-white/60">
                Tip: For reliable uploads, use images under 3000px and ~15MB. You can also paste a direct image URL.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
