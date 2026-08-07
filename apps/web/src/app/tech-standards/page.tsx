'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Plus, AlertTriangle, CheckCircle2, Boxes } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  proposed: '#64748b',
  in_review: '#3b82f6',
  active: '#22c55e',
  rejected: '#ef4444',
  deprecated: '#f59e0b',
  retired: '#6b7280',
};
const CATEGORIES = ['language', 'database', 'os', 'cloud_provider', 'framework', 'tool'];

const statusBadgeVariant = (s: string) =>
  s === 'active' || s === 'compliant' ? 'default' : s === 'deprecated' || s === 'rejected' || s === 'retired' || s === 'nonstandard' ? 'destructive' : 'secondary';

export default function TechStandardsPage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('database');
  const [versionRange, setVersionRange] = useState('');
  const [sunset, setSunset] = useState('');

  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ['tech-standards-overview'],
    queryFn: async () => (await api.get('/tech-standards/compliance/overview')).data,
  });

  const { data: standardsData, refetch: refetchStandards } = useQuery({
    queryKey: ['tech-standards'],
    queryFn: async () => (await api.get('/tech-standards')).data,
  });

  const { data: flagsData } = useQuery({
    queryKey: ['tech-standards-flags'],
    queryFn: async () => (await api.get('/tech-standards/compliance/components')).data,
  });

  const statusPie = (Object.entries(overview?.standards_by_status || {}).map(([name, value]) => ({ name, value })));

  const createStandard = async () => {
    if (!name) return;
    try {
      await api.post('/tech-standards', {
        name,
        category,
        version_range: versionRange || null,
        sunset_date: sunset || null,
        status: 'proposed',
      });
      setName('');
      setVersionRange('');
      setSunset('');
      refetchStandards();
      refetchOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const transition = async (id: string, to: string) => {
    try {
      await api.post(`/tech-standards/${id}/transition`, { to });
      refetchStandards();
      refetchOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const standards = standardsData?.standards || [];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Technology Standards</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Boxes className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-500">Standards</p>
                <p className="text-3xl font-bold">{overview?.standards_count ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-500">Overall compliance</p>
                <p className="text-3xl font-bold">{overview?.overall_score ?? 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-slate-500">Affected apps</p>
                <p className="text-3xl font-bold">{overview?.affected_applications?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Standards by status</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {statusPie.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[String(entry.name)] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium">Add standard</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PostgreSQL" className="w-48" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Version range</label>
                <Input value={versionRange} onChange={(e) => setVersionRange(e.target.value)} placeholder=">=17" className="w-24" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Sunset date</label>
                <Input type="date" value={sunset} onChange={(e) => setSunset(e.target.value)} className="w-40" />
              </div>
              <Button onClick={createStandard}>
                <Plus className="mr-1 h-4 w-4" /> Add (propose)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Standards &amp; lifecycle</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {standards.length === 0 && <p className="text-sm text-slate-500">No standards yet.</p>}
            {standards.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {s.category} {s.version_range ? `• range ${s.version_range}` : ''}
                    {s.sunset_date ? ` • sunset ${s.sunset_date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {s.status === 'proposed' && (
                    <Button size="sm" variant="outline" onClick={() => transition(s.id, 'in_review')}>Review</Button>
                  )}
                  {s.status === 'in_review' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => transition(s.id, 'active')}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => transition(s.id, 'rejected')}>Reject</Button>
                    </>
                  )}
                  {s.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => transition(s.id, 'deprecated')}>Deprecate</Button>
                  )}
                  {s.status === 'deprecated' && (
                    <Button size="sm" variant="outline" onClick={() => transition(s.id, 'retired')}>Retire</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Affected applications (flags)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(overview?.affected_applications || []).map((a: any) => ({ name: a.name, score: a.score }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#f59e0b" name="compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Component compliance flags</CardTitle></CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Component</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(flagsData?.components || []).map((c: any) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.component_type}</td>
                  <td className="py-2 pr-4">{c.version || '—'}</td>
                  <td className="py-2">
                    <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}