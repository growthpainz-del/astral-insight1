import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

const AREA_LABELS = {
  reading_flow: "Reading Flow",
  spirit_wheel: "Spirit Wheel",
  decks: "Decks & Cards",
  journal: "Journal",
  fusions: "Fusions",
  navigation: "Navigation",
  account_billing: "Account & Billing",
  admin: "Admin",
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const PRIORITY_STYLES = {
  high: "bg-red-500/20 text-red-300 border-red-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

export default function BetaTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [responses, setResponses] = useState({}); // task_id -> result
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // Active-time-in-app tracker (pauses when tab is hidden)
  const activeSecondsRef = useRef(0);
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        activeSecondsRef.current += (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
      } else {
        lastTickRef.current = Date.now();
      }
    }, 1000);
    const onVisibility = () => {
      lastTickRef.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskList, me] = await Promise.all([
        base44.entities.BetaTask.filter({ is_active: true }),
        base44.auth.me().catch(() => null),
      ]);
      setUser(me);

      const sorted = [...taskList].sort((a, b) => {
        const pDiff = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
        if (pDiff !== 0) return pDiff;
        return (a.order ?? 0) - (b.order ?? 0);
      });
      setTasks(sorted);

      if (me?.email) {
        const mine = await base44.entities.BetaTaskResponse.filter({ tester_email: me.email });
        const map = {};
        mine.forEach((r) => {
          map[r.task_id] = r.result;
        });
        setResponses(map);
      }
    } catch (err) {
      toast.error("Couldn't load the beta task list. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  const openTask = (task) => {
    setActiveTask(task);
    setNote("");
  };

  const goTest = (task) => {
    if (task.deep_link_page) {
      navigate(createPageUrl(task.deep_link_page));
    }
  };

  const submitResult = async (result) => {
    if (!activeTask) return;
    setSubmitting(true);
    try {
      await base44.entities.BetaTaskResponse.create({
        task_id: activeTask.id,
        result,
        note: note.trim(),
        tester_email: user?.email || "",
        active_session_seconds: Math.round(activeSecondsRef.current),
      });
      setResponses((prev) => ({ ...prev, [activeTask.id]: result }));
      toast.success("Logged — thank you!");
      setActiveTask(null);
    } catch (err) {
      toast.error("Couldn't submit that. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = tasks.reduce((acc, t) => {
    acc[t.area] = acc[t.area] || [];
    acc[t.area].push(t);
    return acc;
  }, {});

  const doneCount = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="w-7 h-7 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Beta Testing Binder</h1>
        </div>
        <p className="text-gray-400 mb-6">
          Pick a task, try it out, tap how it went. {tasks.length > 0 && (
            <span className="text-gray-300">{doneCount}/{tasks.length} done.</span>
          )}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No tasks yet.</div>
        ) : (
          Object.entries(grouped).map(([area, areaTasks]) => (
            <div key={area} className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-purple-300 mb-3">
                {AREA_LABELS[area] || area}
              </h2>
              <div className="space-y-2">
                {areaTasks.map((task) => {
                  const done = responses[task.id];
                  return (
                    <button
                      key={task.id}
                      onClick={() => openTask(task)}
                      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-white">{task.title}</span>
                          <Badge className={`border text-xs ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>
                            {task.priority}
                          </Badge>
                          {done && (
                            <Badge className="bg-green-500/20 text-green-300 border border-green-500/40 text-xs">
                              {done === "worked" ? "✓ worked" : done === "broken" ? "✗ broken" : "? confusing"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1">{task.instructions}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!activeTask} onOpenChange={(open) => !open && setActiveTask(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-gray-200 max-w-md">
          {activeTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  {activeTask.title}
                </DialogTitle>
                <DialogDescription className="text-gray-400 pt-2 whitespace-pre-line">
                  {activeTask.instructions}
                </DialogDescription>
              </DialogHeader>

              {activeTask.deep_link_page && (
                <Button
                  variant="outline"
                  className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 w-full"
                  onClick={() => goTest(activeTask)}
                >
                  Take me there <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <Textarea
                placeholder="Anything worth noting? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-white/5 border-white/10 text-gray-200 mt-2"
                rows={2}
              />

              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  disabled={submitting}
                  onClick={() => submitResult("worked")}
                  className="bg-green-600 hover:bg-green-700 flex flex-col h-auto py-3 gap-1"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs">Worked</span>
                </Button>
                <Button
                  disabled={submitting}
                  onClick={() => submitResult("confusing")}
                  className="bg-amber-600 hover:bg-amber-700 flex flex-col h-auto py-3 gap-1"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-xs">Confusing</span>
                </Button>
                <Button
                  disabled={submitting}
                  onClick={() => submitResult("broken")}
                  className="bg-red-600 hover:bg-red-700 flex flex-col h-auto py-3 gap-1"
                >
                  <XCircle className="w-5 h-5" />
                  <span className="text-xs">Broken</span>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
