import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadFile } from "@/api/integrations";
import { UserCircle2, X, Plus, Loader2, ImagePlus } from "lucide-react";

/**
 * ReaderProfileEditor
 * Lets the currently logged-in reader (host) create/edit the Reader profile
 * that clients see when they join a live session with them.
 */
export default function ReaderProfileEditor({ open, onOpenChange, currentUser, onSaved }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    display_name: "",
    tagline: "",
    bio: "",
    photo_url: "",
    specialties: [],
    years_experience: "",
    reading_style: ""
  });

  useEffect(() => {
    if (!open || !currentUser) return;
    setLoading(true);
    base44.entities.Reader.filter({ user_id: currentUser.id })
      .then((res) => {
        const existing = res?.[0] || null;
        setProfile(existing);
        if (existing) {
          setForm({
            display_name: existing.display_name || currentUser.full_name || "",
            tagline: existing.tagline || "",
            bio: existing.bio || "",
            photo_url: existing.photo_url || "",
            specialties: existing.specialties || [],
            years_experience: existing.years_experience ?? "",
            reading_style: existing.reading_style || ""
          });
        } else {
          setForm((f) => ({ ...f, display_name: currentUser.full_name || "" }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, currentUser?.id]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await UploadFile({ file });
      setForm((f) => ({ ...f, photo_url: file_url }));
    } catch (err) {
      alert("Couldn't upload photo: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addSpecialty = () => {
    const val = specialtyInput.trim();
    if (!val) return;
    if (!form.specialties.includes(val)) {
      setForm((f) => ({ ...f, specialties: [...f.specialties, val] }));
    }
    setSpecialtyInput("");
  };

  const removeSpecialty = (val) => {
    setForm((f) => ({ ...f, specialties: f.specialties.filter((s) => s !== val) }));
  };

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const payload = {
        user_id: currentUser.id,
        display_name: form.display_name.trim() || currentUser.full_name || "Reader",
        tagline: form.tagline.trim(),
        bio: form.bio.trim(),
        photo_url: form.photo_url,
        specialties: form.specialties,
        years_experience: form.years_experience === "" ? undefined : Number(form.years_experience),
        reading_style: form.reading_style.trim()
      };

      let saved;
      if (profile?.id) {
        saved = await base44.entities.Reader.update(profile.id, payload);
      } else {
        saved = await base44.entities.Reader.create(payload);
      }
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      alert("Couldn't save your reader profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c081c] border-purple-500/40 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-200 font-['Cinzel']">
            <UserCircle2 className="w-5 h-5" />
            Your Reader Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-purple-300/60">
              This is what clients see when they join a live session with you.
            </p>

            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-900/40 border border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-8 h-8 text-purple-400/60" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  {uploadingPhoto ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><ImagePlus className="w-4 h-4 mr-2" /> Upload Photo</>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-purple-300/70 uppercase tracking-wide mb-1 block">Display Name</label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                placeholder="How clients will see your name"
                className="bg-black/40 border-purple-500/30"
              />
            </div>

            <div>
              <label className="text-xs text-purple-300/70 uppercase tracking-wide mb-1 block">Tagline</label>
              <Input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="e.g. Intuitive tarot & shadow work"
                maxLength={140}
                className="bg-black/40 border-purple-500/30"
              />
            </div>

            <div>
              <label className="text-xs text-purple-300/70 uppercase tracking-wide mb-1 block">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="A bit about your background and reading approach..."
                className="bg-black/40 border-purple-500/30"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-purple-300/70 uppercase tracking-wide mb-1 block">Years Reading</label>
                <Input
                  type="number"
                  min="0"
                  value={form.years_experience}
                  onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
                  className="bg-black/40 border-purple-500/30"
                />
              </div>
              <div>
                <label className="text-xs text-purple-300/70 uppercase tracking-wide mb-1 block">Reading Style</label>
                <Input
                  value={form.reading_style}
                  onChange={(e) => setForm((f) => ({ ...f, reading_style: e.target.value }))}
                  placeholder="e.g. Direct & grounded"
                  className="bg-black/40 border-purple-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-purple-300/70 uppercase tracking-wide mb-1 block">Specialties</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                  placeholder="e.g. Relationship readings"
                  className="bg-black/40 border-purple-500/30"
                />
                <Button type="button" size="icon" variant="outline" onClick={addSpecialty} className="border-purple-500/50 text-purple-300 shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.specialties.map((s) => (
                  <span key={s} className="text-xs bg-purple-500/20 border border-purple-500/40 text-purple-200 rounded-full px-3 py-1 flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSpecialty(s)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Button
              onClick={save}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold"
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
