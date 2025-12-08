
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import "@/components/deck/_cardUpdatePatch";

const ELEMENTS = ["air", "fire", "water", "earth", "spirit", "none"];
const CUSTOM_CATEGORIES = ["scripture", "meaning", "action", "wisdom", "other"];

function arrayToCommaString(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}
function commaStringToArray(s) {
  return (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function CustomFieldsEditor({ rows, onChange }) {
  const addRow = () =>
    onChange([...(rows || []), { key: "", label: "", value: "", category: "other" }]);
  const updateRow = (idx, patch) =>
    onChange((rows || []).map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx) => onChange((rows || []).filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {(rows || []).length === 0 && (
        <div className="text-sm text-white/60">No custom fields yet.</div>
      )}
      {(rows || []).map((r, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-10 gap-2">
          <Input
            value={r.key}
            onChange={(e) => updateRow(idx, { key: e.target.value })}
            placeholder="key (e.g., hard_truth)"
            className="md:col-span-2 bg-slate-800 border-slate-700 text-white"
          />
          <Input
            value={r.label}
            onChange={(e) => updateRow(idx, { label: e.target.value })}
            placeholder="label (optional)"
            className="md:col-span-2 bg-slate-800 border-slate-700 text-white"
          />
          <Select
            value={r.category || "other"}
            onValueChange={(val) => updateRow(idx, { category: val })}
          >
            <SelectTrigger className="md:col-span-2 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              {CUSTOM_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={r.value}
            onChange={(e) => updateRow(idx, { value: e.target.value })}
            placeholder="value"
            className="md:col-span-3 bg-slate-800 border-slate-700 text-white min-h-[56px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => removeRow(idx)}
            className="md:col-span-1 border-red-500/40 text-red-300 hover:bg-red-900/20"
            title="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addRow} className="bg-purple-600 hover:bg-purple-700">
        <Plus className="w-4 h-4 mr-2" />
        Add custom field
      </Button>
    </div>
  );
}

export default function DeckJsonEditorCardRow({ value, onChange, index }) {
  const [open, setOpen] = React.useState(index < 3); // open first few by default

  const v = value || {};
  const patch = (p) => onChange({ ...v, ...p });

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-fuchsia-700/40 border-0">#{v.number ?? "—"}</Badge>
          <div className="font-semibold">{v.name || "Untitled card"}</div>
          {v.element && (
            <Badge variant="outline" className="border-white/20 capitalize">{v.element}</Badge>
          )}
          {Array.isArray(v.keywords) && v.keywords.length > 0 && (
            <div className="text-xs text-white/60">• {v.keywords.slice(0, 5).join(", ")}{v.keywords.length > 5 ? "…" : ""}</div>
          )}
        </div>
        <Button variant="outline" className="border-white/20" size="sm">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Core */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="md:col-span-2">
              <label className="text-xs text-white/60">Card Name</label>
              <Input
                value={v.name || ""}
                onChange={(e) => patch({ name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Number</label>
              <Input
                type="number"
                value={v.number ?? ""}
                onChange={(e) => patch({ number: e.target.value === "" ? undefined : Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Element</label>
              <Select
                value={v.element || "none"}
                onValueChange={(val) => patch({ element: val })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="element" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {ELEMENTS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="text-xs text-white/60">Keywords (comma separated)</label>
            <Input
              value={arrayToCommaString(v.keywords || [])}
              onChange={(e) => patch({ keywords: commaStringToArray(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="joy, fertility, radiance"
            />
          </div>

          {/* Meanings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-white/60">Overall Meaning</label>
              <Textarea
                value={v.overall_meaning || ""}
                onChange={(e) => patch({ overall_meaning: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Upright Meaning</label>
              <Textarea
                value={v.upright_meaning || ""}
                onChange={(e) => patch({ upright_meaning: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Reversed Meaning</label>
              <Textarea
                value={v.reversed_meaning || ""}
                onChange={(e) => patch({ reversed_meaning: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-white/60">Upright Insight</label>
              <Textarea
                value={v.upright_insight || ""}
                onChange={(e) => patch({ upright_insight: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Upright Action</label>
              <Textarea
                value={v.upright_action || ""}
                onChange={(e) => patch({ upright_action: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Reversed Insight</label>
              <Textarea
                value={v.reversed_insight || ""}
                onChange={(e) => patch({ reversed_insight: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-white/60">Reversed Action</label>
              <Textarea
                value={v.reversed_action || ""}
                onChange={(e) => patch({ reversed_action: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Interaction</label>
              <Textarea
                value={v.interaction || ""}
                onChange={(e) => patch({ interaction: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Musician Quote</label>
              <Textarea
                value={v.musician_quote || ""}
                onChange={(e) => patch({ musician_quote: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-white/60">Face-down Meaning</label>
              <Textarea
                value={v.facedown_meaning || ""}
                onChange={(e) => patch({ facedown_meaning: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Image URL</label>
              <Input
                value={v.image_url || ""}
                onChange={(e) => patch({ image_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Video URL</label>
              <Input
                value={v.video_url || ""}
                onChange={(e) => patch({ video_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-white/60">Frame Style</label>
              <Input
                value={v.frame_style || ""}
                onChange={(e) => patch({ frame_style: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="none, black_border, vignette_burn..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/60">AI Notes (custom)</label>
              <Textarea
                value={v.custom || ""}
                onChange={(e) => patch({ custom: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
              />
            </div>
          </div>

          {/* Custom fields */}
          <div>
            <label className="text-xs text-white/60">Custom Fields</label>
            <CustomFieldsEditor rows={v.custom_fields || []} onChange={(rows) => patch({ custom_fields: rows })} />
          </div>
        </div>
      )}
    </div>
  );
}
