import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Bot, RefreshCw, Video } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { didCreateAgent } from '@/functions/didCreateAgent';
import { didGetAgent } from '@/functions/didGetAgent';
import { didUpdateAgent } from '@/functions/didUpdateAgent';
import { deepThink } from '@/functions/deepThink';
import { didListAgents } from '@/functions/didListAgents';
import AgentsList from '@/components/did/AgentsList';
import { Textarea } from '@/components/ui/textarea';

export default function DIDAgent() {
  const [agentId, setAgentId] = React.useState(null);
  const [inputId, setInputId] = React.useState('');
  const [agent, setAgent] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [deepPrompt, setDeepPrompt] = React.useState('');
  const [deepResult, setDeepResult] = React.useState('');
  const [deepLoading, setDeepLoading] = React.useState(false);
  const [instructionsValue, setInstructionsValue] = React.useState('');
  const [savingInstructions, setSavingInstructions] = React.useState(false);
  const [agents, setAgents] = React.useState([]);
  const [agentsLoading, setAgentsLoading] = React.useState(false);

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

      // Ensure LLM is set to GPT-4.1 Nano
      try {
        await didUpdateAgent({ agentId: id, llm_provider: 'openai', llm_model: 'gpt-4.1-nano' });
      } catch (_) {}

      // Fetch updated agent
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

  React.useEffect(() => {
    setInstructionsValue(agent?.user_data || agent?.llm?.instructions || '');
  }, [agent]);

  React.useEffect(() => {
    loadAgents();
  }, []);

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

      // Ensure LLM is set to GPT-4.1 Nano
      try {
        await didUpdateAgent({ agentId: inputId, llm_provider: 'openai', llm_model: 'gpt-4.1-nano' });
      } catch (_) {}

      const res = await didGetAgent({ agentId: inputId });
      const data = res?.data || res;
      setAgent(data);
    } catch (e) {
      setError(e?.message || 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSaved = async () => {
    let saved = '';
    try { saved = localStorage.getItem('did_demo_agent_id') || ''; } catch (_) {}
    if (!saved) { setError('No saved agent_id found'); return; }
    setInputId(saved);
    await handleLoadAgent();
  };

  const loadAgents = async () => {
    setAgentsLoading(true);
    try {
      const res = await didListAgents({});
      const data = res?.data || res;
      const items = Array.isArray(data) ? data : (data?.items || data?.data || []);
      setAgents(items);
    } catch (e) {
      // silent
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleSelectAgent = async (id) => {
    setInputId(id);
    await handleLoadAgent();
  };

  const handleSaveInstructions = async () => {
    if (!agentId) return;
    setSavingInstructions(true);
    try {
      await didUpdateAgent({ agentId, user_data: instructionsValue });
      const res = await didGetAgent({ agentId });
      const data = res?.data || res;
      setAgent(data);
    } catch (e) {
      setError(e?.message || 'Failed to save instructions');
    } finally {
      setSavingInstructions(false);
    }
  };

  const handleDeepThink = async () => {
    if (!deepPrompt.trim()) return;
    setDeepLoading(true);
    setDeepResult('');
    try {
      const res = await deepThink({ prompt: deepPrompt.trim() });
      const data = res?.data || res;
      const out = typeof data?.result === 'string' ? data.result : JSON.stringify(data?.result, null, 2);
      setDeepResult(out);
    } catch (e) {
      setDeepResult(e?.message || 'Failed to run deep-think');
    } finally {
      setDeepLoading(false);
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
              <Button size="sm" variant="outline" onClick={handleUseSaved} disabled={loading} className="border-white/20 text-white hover:bg-white/10">
                Use Saved
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

          <div className="mb-4 bg-black/20 border border-white/10 rounded-lg p-3">
            <AgentsList
              agents={agents}
              loading={agentsLoading}
              onRefresh={loadAgents}
              onSelect={handleSelectAgent}
            />
          </div>

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
                LLM is set to GPT-4.1 Nano for low-latency replies. Real-time chat via D-ID SDK coming next.
              </div>
              <div className="mt-3 bg-black/30 border border-white/10 rounded-lg p-3">
                <div className="text-sm font-medium text-white/80 mb-2">Deep‑think test</div>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    value={deepPrompt}
                    onChange={(e) => setDeepPrompt(e.target.value)}
                    placeholder="Ask a complex question..."
                    className="h-9 bg-black/30 border-white/20 text-white placeholder:text-white/50 flex-1 min-w-[220px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeepThink}
                    disabled={!deepPrompt.trim() || deepLoading}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {deepLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Ask
                  </Button>
                </div>
                {deepResult && (
                  <div className="mt-2 text-white/80 text-sm whitespace-pre-wrap">{deepResult}</div>
                )}
              </div>
            </div>
          )}

          {agent && (
            <div className="mt-4 bg-black/30 border border-white/10 rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium text-white/80">Instructions / Notes</div>
              <Textarea
                value={instructionsValue}
                onChange={(e) => setInstructionsValue(e.target.value)}
                placeholder="Write agent instructions or notes (stored in user_data)…"
                className="bg-black/30 border-white/20 text-white min-h-24"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveInstructions}
                  disabled={savingInstructions}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {savingInstructions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Instructions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}