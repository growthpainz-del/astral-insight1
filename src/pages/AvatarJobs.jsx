import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Play, Plus, Link as LinkIcon, Key } from 'lucide-react';
import { format } from 'date-fns';
// Platform V2: import functions directly
import { createAvatarJob } from '@/functions/createAvatarJob';
import { refreshAvatarJob } from '@/functions/refreshAvatarJob';
import { getAvatarConfigStatus } from '@/functions/getAvatarConfigStatus';
import { createDidClientKey } from '@/functions/createDidClientKey';

export default function AvatarJobs() {
  const qc = useQueryClient();
  const [readingId, setReadingId] = React.useState('');
        const [clientKey, setClientKey] = React.useState(null);
        const [ckError, setCkError] = React.useState(null);
  const EXPECTED_AGENT_ID = '7B996DF1_7B27_4A8A_804F_C9221236E77D';
  const configQuery = useQuery({
    queryKey: ['avatar-config'],
    queryFn: async () => {
      const res = await getAvatarConfigStatus({ expectedAgentId: EXPECTED_AGENT_ID });
      return res.data;
    },
    staleTime: 30000,
  });

  const jobsQuery = useQuery({
    queryKey: ['avatar-jobs'],
    queryFn: async () => {
      const items = await base44.entities.AvatarJob.list('-created_date', 50);
      return items;
    },
    initialData: [],
  });

  const createMut = useMutation({
    mutationFn: async ({ readingId }) => {
      const res = await createAvatarJob({ readingId });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avatar-jobs'] })
  });

  const refreshMut = useMutation({
    mutationFn: async ({ jobId }) => {
      const res = await refreshAvatarJob({ jobId });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avatar-jobs'] })
  });

  const handleUseLatest = async () => {
    const readings = await base44.entities.Reading.list('-updated_date', 1);
    const latest = readings?.[0];
    if (!latest?.id) {
      alert('No readings found.');
      return;
    }
    createMut.mutate({ readingId: latest.id });
    };

    const handleCreateClientKey = async () => {
              try {
                setCkError(null);
                setClientKey(null);
                const res = await createDidClientKey({ allowedDomains: [window.location.origin] });
                const data = res.data;
                if (data?.client_key) {
                  setClientKey(data.client_key);
                } else {
                  setCkError({ message: data?.error || 'Failed to create client key', status: res.status, details: data });
                }
              } catch (e) {
                setCkError({
                  message: e?.response?.data?.error || e.message || 'Failed to create client key',
                  status: e?.response?.status,
                  details: e?.response?.data,
                });
              }
              };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl">Avatar Jobs (Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
            <div className="flex flex-wrap gap-4">
              <span>Agent ID set: <b>{configQuery.data?.didAgentIdExists ? 'Yes' : 'No'}</b></span>
              <span>Matches provided: <b>{configQuery.data?.didAgentIdMatches === true ? 'Yes' : configQuery.data?.didAgentIdMatches === false ? 'No' : '—'}</b></span>
              <span>D‑ID API: <b>{configQuery.data?.didApiReady ? 'OK' : 'Missing'}</b></span>
              <span>ElevenLabs API: <b>{configQuery.data?.elevenApiReady ? 'OK' : 'Missing'}</b></span>
              <span>Voice ID: <b>{configQuery.data?.elevenVoiceIdExists ? 'Yes' : 'No'}</b></span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-white/80 max-w-full">
                                {clientKey ? (
                                  <span>Client Key created: <span className="font-mono">{clientKey.slice(0,6)}…{clientKey.slice(-6)}</span></span>
                                ) : ckError ? (
                                  <div className="text-red-300">
                                    <div>
                                      Error: {typeof ckError === 'string' ? ckError : ckError.message}
                                      {typeof ckError !== 'string' && ckError.status ? ` (HTTP ${ckError.status})` : ''}
                                    </div>
                                    {typeof ckError !== 'string' && ckError.details ? (
                                      <pre className="mt-1 p-2 bg-white/5 rounded border border-white/10 overflow-x-auto text-[11px] text-red-200/90 max-h-40">
                                        {JSON.stringify(ckError.details, null, 2)}
                                      </pre>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-white/60">No client key yet</span>
                                )}
                              </div>
            <Button variant="outline" onClick={handleCreateClientKey} className="border-white/20 text-white hover:bg-white/10">
              <Key className="w-4 h-4 mr-2" /> Create Client Key
            </Button>
          </div>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-sm mb-1 text-white/80">Reading ID</label>
              <Input value={readingId} onChange={e => setReadingId(e.target.value)} placeholder="e.g. 3c1f..." className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => readingId && createMut.mutate({ readingId })} disabled={!readingId || createMut.isPending} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> {createMut.isPending ? 'Creating…' : 'Create Job'}
              </Button>
              <Button variant="outline" onClick={handleUseLatest} disabled={createMut.isPending} className="border-white/20 text-white hover:bg-white/10">
                <Play className="w-4 h-4 mr-2" /> Use most recent
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Reading</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsQuery.data.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>{j.created_date ? format(new Date(j.created_date), 'PP p') : '-'}</TableCell>
                    <TableCell className="max-w-[240px] truncate" title={j.reading_id}>{j.reading_id}</TableCell>
                    <TableCell>{j.status}</TableCell>
                    <TableCell>
                      {j.result_url ? (
                        <a href={j.result_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-300 hover:underline"><Play className="w-4 h-4" />Open</a>
                      ) : (
                        <span className="text-white/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => refreshMut.mutate({ jobId: j.id })} className="border-white/20 text-white hover:bg-white/10">
                          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                        </Button>
                        {j.result_url && (
                          <a href={j.result_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10"><LinkIcon className="w-4 h-4 mr-1" /> Link</Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}