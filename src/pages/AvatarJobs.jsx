import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Play, Plus, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
// Platform V2: import functions directly
import { createAvatarJob } from '@/functions/createAvatarJob';
import { refreshAvatarJob } from '@/functions/refreshAvatarJob';

export default function AvatarJobs() {
  const qc = useQueryClient();
  const [readingId, setReadingId] = React.useState('');

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

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl">Avatar Jobs (Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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