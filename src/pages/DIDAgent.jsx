import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, RefreshCw, Video } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { didCreateAgent } from '@/functions/didCreateAgent';
import { didGetAgent } from '@/functions/didGetAgent';

export default function DIDAgent() {
  const [agentId, setAgentId] = React.useState(null);
  const [inputId, setInputId] = React.useState('');
  const [agent, setAgent] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const ensureAgent = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let id = null;
      try { id = localStorage.getItem('did_demo_agent_id') || null; } catch (_) {}

      if (!id) {
        const res = await didCreateAgent({ preview_name: 'Base44 Demo Agent' });
        const data = res?.data || res; // SDK returns axios-like response
        id = data?.id;
        if (!id) throw new Error('Agent creation did not return an id');
        try { localStorage.setItem('did_demo_agent_id', id); } catch (_) {}
      }

      setAgentId(id);
      setInputId(id);
      const res2 = await didGetAgent({ agentId: id });
      const agentData = res2?.data || res2;
      setAgent(agentData);
    } catch (e) {
      setError(e?.message || 'Failed to initialize agent');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { ensureAgent(); }, [ensureAgent]);

  const resetAgent = async () => {
    try { localStorage.removeItem('did_demo_agent_id'); } catch (_) {}
    setAgent(null); setAgentId(null); setInputId(''); setError('');
    await ensureAgent();
  };

  const handleLoadAgent = async () => {
    if (!inputId) return;
    setLoading(true);
    setError('');
    try {
      try { localStorage.setItem('did_demo_agent_id', inputId); } catch (_) {}
      setAgentId(inputId);
      const res = await didGetAgent({ agentId: inputId });
      const data = res?.data || res;
      setAgent(data);
    } catch (e) {
      setError(e?.message || 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-purple-300" />
            <h1 className="text-2xl font-bold">D-ID Agent Demo</h1>
          </div>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Back</Button>
          </Link>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="text-sm text-white/80">
              {agentId ? <>Agent ID: <span className="font-mono text-white/90">{agentId}</span></> : 'No agent yet'}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Paste agent_id (agnt_...)"
                className="h-8 w-56 bg-black/30 border-white/20 text-white placeholder:text-white/50"
              />
              <Button size="sm" variant="outline" onClick={handleLoadAgent} disabled={!inputId || loading} className="border-white/20 text-white hover:bg-white/10">
                Load
              </Button>
              <Button size="sm" variant="outline" onClick={ensureAgent} disabled={loading} className="border-white/20 text-white hover:bg-white/10">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                {loading ? 'Initializing…' : 'Initialize / Refresh'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetAgent} disabled={loading} className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-md p-3 text-sm text-red-200 mb-3">{error}</div>
          )}

          {!agent && (
            <div className="py-16 text-center text-white/80">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              Preparing your avatar…
            </div>
          )}

          {agent && (
            <div className="space-y-4">
              <div className="text-sm text-white/80">
                Status: <span className="font-semibold">{agent.status}</span>
              </div>
              {agent?.presenter?.idle_video ? (
                <video
                  key={agent.presenter.idle_video}
                  src={agent.presenter.idle_video}
                  className="w-full rounded-lg border border-white/10"
                  autoPlay
                  muted
                  playsInline
                  loop
                  controls
                />
              ) : (
                <div className="bg-black/30 border border-white/10 rounded-lg p-6 text-center">
                  <p className="text-white/70">Idle video not yet available. Try Refresh once the agent is ready.</p>
                </div>
              )}
              <div className="text-xs text-white/60">
                This demo uses D-ID default replies (no custom LLM). Next step: enable real-time chat using D-ID Client SDK.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}