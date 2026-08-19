import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageSquareText, Check, X as XIcon, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ChatRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.ChatAccessRequest.list("-created_date", 100);
      setRequests(all || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const respond = async (requestId, action) => {
    setActingOn(requestId);
    try {
      const res = await base44.functions.invoke("respondToChatRequest", { requestId, action });
      if (res?.data?.success) {
        toast.success(action === "accept" ? "Request accepted" : "Request declined");
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: action === "accept" ? "accepted" : "declined" } : r))
        );
      } else {
        toast.error(res?.data?.error || "Couldn't update that request.");
      }
    } catch (e) {
      toast.error("Error: " + e.message);
    } finally {
      setActingOn(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareText className="w-5 h-5 text-purple-300" />
        <h2 className="text-lg font-bold text-white">Chat Access Requests</h2>
        {pending.length > 0 && (
          <span className="ml-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full px-2 py-0.5">
            {pending.length} pending
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-purple-300/60">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-purple-300/60">No chat requests yet.</p>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{r.requester_name || "Unknown"}</span>
                  <span className="text-xs text-purple-300/50">{r.requester_email}</span>
                </div>
                {r.intro_message && (
                  <p className="text-sm text-purple-200/80 mt-1 break-words">{r.intro_message}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  disabled={actingOn === r.id}
                  onClick={() => respond(r.id, "accept")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingOn === r.id}
                  onClick={() => respond(r.id, "decline")}
                  className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {resolved.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-purple-300/50 cursor-pointer">
                {resolved.length} resolved request{resolved.length !== 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-1">
                {resolved.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs text-purple-300/50 px-1 py-1">
                    <span>{r.requester_name || r.requester_email}</span>
                    <span className={r.status === "accepted" ? "text-green-400" : "text-red-400"}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
