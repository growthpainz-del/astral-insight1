import React from 'react';
import { Button } from '@/components/ui/button';

export default function AgentsList({ agents, loading, onRefresh, onSelect }) {
  const items = Array.isArray(agents)
    ? agents
    : (agents?.items || agents?.data || []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/80">Agents</div>
        <Button size="sm" variant="outline" onClick={onRefresh} className="border-white/20 text-white hover:bg-white/10">
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>
      <div className="max-h-56 overflow-auto divide-y divide-white/10 border border-white/10 rounded-md">
        {loading && items.length === 0 && (
          <div className="p-3 text-white/60 text-sm">Loading…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="p-3 text-white/60 text-sm">No agents found.</div>
        )}
        {items.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect?.(a.id)}
            className="w-full text-left p-3 hover:bg-white/5 transition-colors"
          >
            <div className="text-white text-sm font-medium">{a.preview_name || a.name || a.id}</div>
            <div className="text-white/50 text-xs font-mono">{a.id}</div>
          </button>
        ))}
      </div>
    </div>
  );
}