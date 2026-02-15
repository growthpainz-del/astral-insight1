import React from "react";
import DidAgentEmbed from "@/components/integrations/DidAgentEmbed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Video, Plug, Power, ExternalLink } from "lucide-react";

export default function LiveAgent() {
  const [micStatus, setMicStatus] = React.useState("idle"); // idle | granted | denied
  const [error, setError] = React.useState("");
  const [connected, setConnected] = React.useState(false);

  const inPreview = React.useMemo(() => {
    try { return window.top !== window.self; } catch (_) { return true; }
  }, []);

  const requestMic = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop to release the mic; the D-ID widget will request it again on connect
      stream.getTracks().forEach(t => t.stop());
      setMicStatus("granted");
    } catch (e) {
      console.error("Microphone permission denied:", e);
      setMicStatus("denied");
      setError("Microphone access is required for voice chat.");
    }
  };

  const handleConnect = () => {
    setConnected(true);
  };

  const handleDisconnect = () => {
    setConnected(false);
    // Clean up injected script if present (ensures a fresh session next time)
    try {
      const s = document.getElementById("did-agent-loader");
      if (s) s.remove();
    } catch (_) {}
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Live Agent</h1>
          {connected ? (
            <Button variant="destructive" onClick={handleDisconnect} className="gap-2">
              <Power className="w-4 h-4" /> Disconnect
            </Button>
          ) : null}
        </div>

        {inPreview && (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4 text-sm text-white/80 flex items-center justify-between gap-4">
              <div>
                Real-time agent may be blocked in the builder preview. Open the app in a new tab for the full experience.
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  try { window.open(window.location.href, "_blank"); } catch (_) {}
                }}
              >
                <ExternalLink className="w-4 h-4" /> Open
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" /> Step 1: Allow Microphone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-white/80 text-sm">
                We’ll ask for mic permission first. The session will use your mic for voice chat with the agent.
              </p>
              {micStatus === "idle" && (
                <Button onClick={requestMic} className="gap-2">
                  <Mic className="w-4 h-4" /> Grant Microphone Access
                </Button>
              )}
              {micStatus === "granted" && (
                <div className="text-emerald-300 text-sm">Microphone permission granted.</div>
              )}
              {micStatus === "denied" && (
                <div className="text-amber-300 text-sm">{error || "Microphone permission denied."}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" /> Step 2: Connect Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-white/80 text-sm">
                After permission, start a live WebRTC session. You’ll see the agent’s video and can speak to it.
              </p>
              {!connected ? (
                <Button
                  onClick={handleConnect}
                  disabled={micStatus !== "granted"}
                  className="gap-2"
                >
                  <Plug className="w-4 h-4" /> Start Live Session
                </Button>
              ) : (
                <div className="text-emerald-300 text-sm">Connected. The agent should appear below momentarily.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-2">
          <div className="text-white/70 text-sm mb-2">Live Agent Window</div>
          <div id="live-agent-mount" className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/20 bg-black/40" />
          {connected && (
            <DidAgentEmbed
              mode="full"
              targetId="live-agent-mount"
              position="right"
              orientation="horizontal"
              name="live-agent"
            />
          )}
        </div>
      </div>
    </div>
  );
}