import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, RefreshCw, Filter, ListTree } from "lucide-react";
import { retryAsync } from "@/components/utils/retry";
import { isNetworkError } from "@/components/utils/isNetworkError";

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\s\-_]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

function normalizePositions(positions) {
  if (!Array.isArray(positions)) return "[]";
  // Keep order (most users care about layout order)
  const norm = positions.map((p) => ({
    name: normalizeText(p.name),
    meaning: normalizeText(p.meaning),
    // bucket coords to reduce minor diffs (group into 5% buckets)
    x: Math.round((Number(p.x ?? 0) / 5)) * 5,
    y: Math.round((Number(p.y ?? 0) / 5)) * 5,
  }));
  return JSON.stringify(norm);
}

function signatureForSpread(spread) {
  const nameKey = normalizeText(spread.name);
  const posKey = normalizePositions(spread.positions);
  const deckKey = String(spread.deck_id || "common");
  const catKey = normalizeText(spread.category || "");
  return `${nameKey}::${posKey}::${deckKey}::${catKey}`;
}

export default function SpreadDeduper({ onDone }) {
  const [spreads, setSpreads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());
  const [deleting, setDeleting] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0, msg: "" });
  const [reloadKey, setReloadKey] = React.useState(0);

  const loadSpreads = React.useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const list = await retryAsync(() => base44.entities.Spread.list("-created_date"), 3, 600);
      setSpreads(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = isNetworkError(e)
        ? "Network error while loading spreads. Please try again."
        : (e?.message || "Failed to load spreads.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSpreads();
  }, [loadSpreads, reloadKey]);

  // Group by strong signature
  const groups = React.useMemo(() => {
    const map = new Map();
    for (const s of spreads) {
      const sig = signatureForSpread(s);
      if (!map.has(sig)) map.set(sig, []);
      map.get(sig).push(s);
    }
    // Only duplicates (size > 1)
    const dups = Array.from(map.values()).filter((arr) => arr.length > 1);
    // Sort each group by created_date (keep oldest by default)
    dups.forEach((g) => g.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    // Optional filter by name
    if (!filter.trim()) return dups;
    const q = normalizeText(filter);
    return dups.filter((g) => normalizeText(g[0]?.name).includes(q));
  }, [spreads, filter]);

  const toggleSelect = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllDuplicates = () => {
    // For each group, select all but the first (keep first)
    const next = new Set(selected);
    groups.forEach((g) => {
      g.slice(1).forEach((s) => next.add(s.id));
    });
    setSelected(next);
  };

  const clearSelection = () => setSelected(new Set());

  const totalSelected = selected.size;

  const deleteSelected = async () => {
    if (!totalSelected) return;
    if (!window.confirm(`Delete ${totalSelected} duplicate spread(s)? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setProgress({ current: 0, total: totalSelected, msg: "Starting..." });
    try {
      let i = 0;
      for (const id of selected) {
        setProgress({ current: i, total: totalSelected, msg: `Deleting ${i + 1}/${totalSelected}…` });
        // Use retry to avoid transient failures
         
        await retryAsync(() => base44.entities.Spread.delete(id), 3, 700);
        i += 1;
        setProgress({ current: i, total: totalSelected, msg: `Deleted ${i}/${totalSelected}` });
         
        await new Promise((r) => setTimeout(r, 120));
      }
      setSelected(new Set());
      setReloadKey((k) => k + 1);
      onDone && onDone();
      alert("Selected duplicates deleted.");
    } catch (e) {
      const msg = isNetworkError(e)
        ? "Network error while deleting some spreads. Please wait and retry."
        : (e?.message || "Failed to delete some spreads.");
      alert(msg);
    } finally {
      setDeleting(false);
      setProgress({ current: 0, total: 0, msg: "" });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="w-5 h-5 text-purple-300" />
            Duplicate Spread Cleaner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:w-80">
              <Filter className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Filter by spread name…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 bg-black/40 border-white/20 text-white"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setReloadKey((k) => k + 1)}
                className="border-white/20 text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={selectAllDuplicates}
                className="border-white/20 text-white hover:bg-white/10"
                disabled={loading || !groups.length}
              >
                Select all duplicates
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                className="border-white/20 text-white hover:bg-white/10"
                disabled={!totalSelected}
              >
                Clear
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading spreads…
            </div>
          ) : error ? (
            <div className="text-red-200 bg-red-900/20 border border-red-500/40 rounded-md p-3">{error}</div>
          ) : !groups.length ? (
            <div className="text-white/70">No duplicate groups found with the current filter.</div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, idx) => {
                const primary = group[0];
                const dups = group.slice(1);
                return (
                  <Card key={`${primary.id}-${idx}`} className="bg-black/40 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-base">
                        {primary.name}
                        <span className="ml-2 text-xs text-white/60">({group.length} similar)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs text-white/70">
                        Keep: <Badge className="bg-emerald-700/40">Oldest</Badge>{" "}
                        <span className="ml-2">Created: {new Date(primary.created_date).toLocaleString()}</span>
                        {primary.deck_id ? <span className="ml-2">Deck: {primary.deck_id}</span> : <span className="ml-2">Common spread</span>}
                      </div>

                      {dups.length ? (
                        <div className="mt-2 border-t border-white/10 pt-2">
                          <div className="text-sm text-white/80 mb-1">Duplicates:</div>
                          <div className="grid md:grid-cols-2 gap-2">
                            {dups.map((s) => {
                              const checked = selected.has(s.id);
                              return (
                                <label
                                  key={s.id}
                                  className="flex items-start gap-2 p-2 rounded-md bg-white/5 border border-white/10"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => toggleSelect(s.id, Boolean(v))}
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{s.name}</div>
                                    <div className="text-xs text-white/60">
                                      Created: {new Date(s.created_date).toLocaleString()}
                                      {s.category ? <span className="ml-2">Category: {s.category}</span> : null}
                                      {s.deck_id ? <span className="ml-2">Deck: {s.deck_id}</span> : null}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-white/70">
              Selected: <span className="font-semibold text-white">{totalSelected}</span>
            </div>
            <Button
              onClick={deleteSelected}
              disabled={!totalSelected || deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete selected
                </>
              )}
            </Button>
          </div>

          {deleting && progress.total > 0 ? (
            <div className="text-xs text-white/70">{progress.msg}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}