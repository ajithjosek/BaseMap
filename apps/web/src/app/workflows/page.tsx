'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Play, Save, UserCheck, Bell, GitFork, AlertTriangle, ClipboardList, CheckCircle2, Circle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const STEP_TYPES = ['start', 'approval', 'condition', 'parallel', 'notification', 'task', 'end'];

const PALETTE = [
  { type: 'start', icon: Circle },
  { type: 'approval', icon: UserCheck },
  { type: 'condition', icon: GitFork },
  { type: 'parallel', icon: AlertTriangle },
  { type: 'notification', icon: Bell },
  { type: 'task', icon: ClipboardList },
  { type: 'end', icon: CheckCircle2 },
];

interface Step { id: string; step_type: string; name?: string; config: any; position_x: number; position_y: number; sort_order: number; }
interface Workflow { id: string; name: string; entity_type: string; is_active: boolean; steps: Step[]; }

const toNodeType = (type: string) => (type === 'start' ? 'input' : type === 'end' ? 'output' : 'default');

const nodeClass: Record<string, string> = {
  start: 'border-emerald-400 bg-emerald-50',
  approval: 'border-blue-400 bg-blue-50',
  condition: 'border-amber-400 bg-amber-50',
  parallel: 'border-purple-400 bg-purple-50',
  notification: 'border-slate-400 bg-slate-50',
  task: 'border-cyan-400 bg-cyan-50',
  end: 'border-rose-400 bg-rose-50',
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('application');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}` });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/workflows`, { headers: authHeaders() });
      setWorkflows(data.workflows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openWorkflow = useCallback(async (id: string) => {
    setActiveId(id);
    try {
      const { data } = await axios.get(`${API_BASE}/workflows/${id}`, { headers: authHeaders() });
      const wf = data as Workflow;
      setSelected(wf);
      const sorted = (wf.steps || []).sort((a, b) => a.sort_order - b.sort_order);
      setNodes(sorted.map((s) => ({
        id: s.id,
        type: toNodeType(s.step_type),
        position: { x: s.position_x, y: s.position_y },
        data: { label: s.name || `${s.step_type} ${s.sort_order + 1}`, stepType: s.step_type },
        className: `${nodeClass[s.step_type] || nodeClass.task} rounded-lg border px-4 py-2 shadow-sm`,
      })));
      setEdges(sorted.slice(0, -1).map((s, i) => ({
        id: `e-${i}`,
        source: s.id,
        target: sorted[i + 1].id,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
      })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const createWorkflow = async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/workflows`,
        { name: name || 'Untitled Workflow', entity_type: entityType, is_active: true, steps: [] },
        { headers: authHeaders() },
      );
      setName('');
      await openWorkflow(data.workflow.id);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const saveWorkflow = async () => {
    if (!selected) return;
    const steps = nodes.map((n: any, i) => ({
      id: n.id,
      step_type: n?.data?.stepType || 'task',
      name: (n?.data?.label || '').replace(/ \d+$/, '').replace(/^\S+\s+/, '') || n?.data?.stepType,
      config: {},
      position_x: n?.position?.x || 0,
      position_y: n?.position?.y || 0,
      sort_order: i,
    })).filter((s: any) => STEP_TYPES.includes(s.step_type));
    try {
      if (activeId) {
        await axios.put(`${API_BASE}/workflows/${activeId}`, { ...selected, steps }, { headers: authHeaders() });
      }
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const runWorkflow = async () => {
    if (!activeId) return;
    try {
      const { data } = await axios.post(
        `${API_BASE}/workflows/${activeId}/run`,
        { context: { amount: 7500, department: 'IT', region: 'US' } },
        { headers: authHeaders() },
      );
      setRunResult(JSON.stringify({ status: data?.status, id: data?.id }, null, 2));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/workflows/${id}`, { headers: authHeaders() });
      if (activeId === id) { setActiveId(null); setSelected(null); setNodes([]); setEdges([]); }
      load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <div className="flex items-center gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New workflow name" className="w-56" />
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            {['application', 'user', 'service', 'contract', 'change'].map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
          <Button onClick={createWorkflow}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Definitions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-sm text-slate-500">Loading…</p>}
            {!loading && workflows.length === 0 && <p className="text-sm text-slate-500">No workflows yet.</p>}
            {workflows.map((wf) => (
              <div key={wf.id} onClick={() => openWorkflow(wf.id)}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 ${activeId === wf.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{wf.name}</p>
                  <p className="text-xs text-slate-500">{wf.entity_type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={wf.is_active ? 'default' : 'secondary'}>{wf.is_active ? 'active' : 'inactive'}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Designer{selected && <span className="ml-2 text-slate-500">— {selected.name}</span>}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!selected} onClick={runWorkflow}>
                  <Play className="mr-1 h-4 w-4" /> Run
                </Button>
                <Button size="sm" disabled={!selected} onClick={saveWorkflow}>
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap gap-2">
                {PALETTE.map((p) => (
                  <div key={p.type} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs">
                    <p.icon className="h-3.5 w-3.5" /> {p.type}
                  </div>
                ))}
              </div>
              <div className="h-[560px] rounded-lg border border-slate-200">
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView proOptions={{ hideAttribution: true }}>
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Drag nodes to arrange; steps execute in top-to-bottom order. Condition steps branch via the expression evaluator (e.g. <code>amount gt 500</code>); parallel steps fan out approvals (all|any).
              </p>
            </CardContent>
          </Card>

          {runResult && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-1 text-sm font-medium">Last run</p>
                <pre className="rounded bg-slate-900 p-3 text-xs text-green-300">{runResult}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}