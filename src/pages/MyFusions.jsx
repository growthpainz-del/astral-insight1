import React from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Combine, Pencil, BookOpen, Plus, Loader2, AlertCircle } from "lucide-react";

export default function MyFusions() {
  const [user, setUser] = React.useState(null);
  const [recipes, setRecipes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const u = await base44.auth.me();
        if (cancelled) return;
        setUser(u);

        const mine = await base44.entities.FusionRecipe.filter(
          u?.email ? { created_by: u.email } : {}
        );
        if (cancelled) return;
        setRecipes(mine || []);
      } catch (e) {
        if (cancelled) return;
        // If filtering by created_by is restricted, fall back to listing all
        if (e?.response?.status === 403 || e?.response?.status === 400) {
          try {
            const all = await base44.entities.FusionRecipe.list("-created_date");
            if (!cancelled) setRecipes(all || []);
          } catch (fallbackErr) {
            if (!cancelled) setError("Failed to load your fusions. Please try again.");
          }
        } else {
          setError("Failed to load your fusions. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Combine className="w-6 h-6" />
            My Fusions
          </h1>
          <Link to={createPageUrl("FusionManager")}>
            <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Plus className="w-4 h-4" />
              New Fusion
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/80">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your fusion recipes…
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        ) : recipes.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>No fusions yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 mb-4">
                Create your first fusion pairing and attach a custom spread.
              </p>
              <Link to={createPageUrl("FusionManager")}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Create a Fusion
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {recipes.map((r) => (
              <Card key={r.id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">{r.deck_pairing_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-white/70 line-clamp-3">
                    {r.recipe_content}
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl(`FusionRecipeEditor?id=${r.id}`)}>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={createPageUrl("FusionReading")}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <BookOpen className="w-4 h-4" />
                        Open Fusion Reading
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}