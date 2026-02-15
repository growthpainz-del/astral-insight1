import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch (_) {}

    const apiKey = Deno.env.get('API_USERNAME') || Deno.env.get('DID_API_KEY');
    const apiSecret = Deno.env.get('API_PASSWORD') || Deno.env.get('DID_API_SECRET');
    const envAgentId = Deno.env.get('DID_AGENT_ID') || null;
    const agentId = body.agentId || envAgentId;

    if (!apiKey || !apiSecret) {
      return Response.json({
        auth_ok: false,
        message: 'Missing API_USERNAME/API_PASSWORD (or DID_API_KEY/DID_API_SECRET)',
      }, { status: 500 });
    }

    const basicAuth = `Basic ${btoa(`${apiKey}:${apiSecret}`)}`;

    // 1) List agents
    const agentsRes = await fetch('https://api.d-id.com/agents', {
      headers: { 'Authorization': basicAuth, 'accept': 'application/json' }
    });

    let agentsJson = null;
    try { agentsJson = await agentsRes.json(); } catch (_) {}

    const agentsOk = agentsRes.ok;

    // Derive a readable list of agents
    const agentItems = Array.isArray(agentsJson?.items) ? agentsJson.items : Array.isArray(agentsJson) ? agentsJson : [];
    const sampleAgents = agentItems.slice(0, 10).map(a => ({ id: a?.id || a?._id || a?.agent_id || null, name: a?.name || a?.title || null }));

    let agentGetStatus = null;
    let agentGetOk = null;
    let agentGetJson = null;

    if (agentId) {
      const agentRes = await fetch(`https://api.d-id.com/agents/${encodeURIComponent(agentId)}`, {
        headers: { 'Authorization': basicAuth, 'accept': 'application/json' }
      });
      agentGetStatus = agentRes.status;
      agentGetOk = agentRes.ok;
      try { agentGetJson = await agentRes.json(); } catch (_) {}
    }

    const foundInList = agentId ? agentItems.some(a => (a?.id || a?._id || a?.agent_id) === agentId) : null;

    return Response.json({
      auth_ok: agentsOk,
      agents_status: agentsRes.status,
      agents_count: agentItems.length,
      agent_id_env_suffix: envAgentId ? envAgentId.slice(-6) : null,
      agent_id_used_suffix: agentId ? agentId.slice(-6) : null,
      agent_found_in_list: foundInList,
      agent_get_status: agentGetStatus,
      agent_get_ok: agentGetOk,
      sample_agents: sampleAgents,
      notes: [
        'auth_ok indicates if your API key/secret were accepted for listing agents.',
        'agent_found_in_list should be true when the Agent ID belongs to this account.',
        'agent_get_ok should be true to confirm access to that Agent.',
      ],
      raw: {
        agents_error: agentsOk ? null : (agentsJson?.message || agentsJson?.error || agentsJson || null),
        agent_get_error: agentGetOk ? null : (agentGetJson?.message || agentGetJson?.error || agentGetJson || null)
      }
    });
  } catch (error) {
    console.error('[didDiagnostics] Fatal', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});