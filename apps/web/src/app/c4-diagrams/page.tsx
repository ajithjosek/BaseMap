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
import { Plus, Trash2, Save, History, RotateCcw, User, Box, Layers, Cable } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ELEMENTS = [
  { kind: 'Person', icon: User, cls: 'border-amber-400 bg-amber-50' },
  { kind: 'System', icon: Box, cls: 'border-blue-400 bg-blue-50' },
  { kind: 'Container', icon: Layers, cls: 'border-emerald-400 bg-emerald-50' },
  { kind: 'Component', icon: Cable, cls: 'border-purple-400 bg-purple-50' },
];

interface Diagram { id: string; name: string; level: string; canvas_data: any; }
interface Version { id: string; comment?: string; created_at: string; }

export default function C4DiagramsPage() {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selected, setSelected] = useState<Diagram | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('level2');
  const [comment, setComment] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}` });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/c4-diagrams`, { headers: authHeaders() });
      setDiagrams(data.diagrams || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hydrate = (d: Diagram) => {
    const cd = d.canvas_data || {};
    const ns = Array.isArray(cd.nodes) ? cd.nodes : [];
    const es = Array.isArray(cd.edges) ? cd.edges : [];
    setNodes(ns.map((n: any) => ({
      id: n.id,
      position: n.position,
      data: { label: n.label, kind: n.kind },
      className: `${n.className || ELEMENTS.find((e) => e.kind === n.kind)?.cls} rounded-lg border px-4 py-2 shadow-sm`,
    })));
    setEdges(es);
  };

  const openDiagram = async (id: string) => {
    setActiveId(id);
    try {
      const { data } = await axios.get(`${API_BASE}/c4-diagrams/${id}`, { headers: authHeaders() });
      const d = data.diagram as Diagram;
      setSelected(d);
      hydrate(d);
      loadVersions(id);
    } catch (e) {
      console.error(e);
    }
  };

  const loadVersions = async (id: string) => {
    try {
      const { data } = await axios.get(`${API_BASE}/c4-diagrams/${id}/versions`, { headers: authHeaders() });
      setVersions(data.versions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createDiagram = async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/c4-diagrams`,
        { name: name || 'Untitled Diagram', level, canvas_data: { nodes: [], edges: [] } },
        { headers: authHeaders() },
      );
      setName('');
      await openDiagram(data.diagram.id);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const addElement = (kind: string) => {
    setNodes((nds) => [
      ...nds,
      {
        id: `${kind.toLowerCase()}-${Date.now()}`,
        type: 'default',
        position: { x: 80 + (nds.length % 5) * 160, y: 80 + Math.floor(nds.length / 5) * 120 },
        data: { label: `New ${kind}`, kind },
        className: `${ELEMENTS.find((e) => e.kind === kind)?.cls} rounded-lg border px-4 py-2 shadow-sm`,
      },
    ]);
  };

  const saveDiagram = async () => {
    if (!activeId) return;
    const canvas = {
      nodes: nodes.map((n: any) => ({
        id: n.id,
        position: n.position,
        label: n.data?.label,
        kind: n.data?.kind,
      })),
      edges,
    };
    try {
      await axios.put(
        `${API_BASE}/c4-diagrams/${activeId}`,
        { canvas_data: canvas, comment },
        { headers: authHeaders() },
      );
      setComment('');
      loadVersions(activeId);
    } catch (e) {
      console.error(e);
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!activeId) return;
    try {
      await axios.put(`${API_BASE}/c4-diagrams/${activeId}/versions/${versionId}/restore`, {}, { headers: authHeaders() });
      await openDiagram(activeId);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteDiagram = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/c4-diagrams/${id}`, { headers: authHeaders() });
      if (activeId === id) { setActiveId(null); setSelected(null); setNodes([]); setEdges([]); setVersions([]); }
      load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">C4 Diagram Editor</h1>
        <div className="flex items-center gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Diagram name" className="w-56" />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            {['level1', 'level2', 'level3', 'level4'].map((lv) => (
              <option key={lv} value={lv}>{lv.toUpperCase()}</option>
            ))}
          </select>
          <Button onClick={createDiagram}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Diagrams</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-sm text-slate-500">Loading…</p>}
            {!loading && diagrams.length === 0 && <p className="text-sm text-slate-500">No diagrams yet.</p>}
            {diagrams.map((d) => (
              <div key={d.id} onClick={() => openDiagram(d.id)}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 ${activeId === d.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.level}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); deleteDiagram(d.id); }} className="text-slate-400 hover:text-red-600">
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
              <CardTitle className="text-sm font-medium">Canvas{selected && <span className="ml-2 text-slate-500">— {selected.name}</span>}</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={!selected} onClick={saveDiagram}>
                  <Save className="mr-1 h-4 w-4" /> Save snapshot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {ELEMENTS.map((el) => (
                  <Button key={el.kind} variant="outline" size="sm" disabled={!selected} onClick={() => addElement(el.kind)}>
                    <el.icon className="mr-1 h-3.5 w-3.5" /> {el.kind}
                  </Button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary">{level}</Badge>
                </div>
              </div>
              <div className="h-[520px] rounded-lg border border-slate-200">
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView proOptions={{ hideAttribution: true }}>
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium"><History className="mr-1 inline h-4 w-4" /> Version history</CardTitle>
              <div className="flex items-center gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Snapshot comment" className="w-56 h-8 text-sm" disabled={!selected} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {versions.length === 0 && <p className="text-sm text-slate-500">Saving a snapshot creates a version here.</p>}
                {versions.map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                    <div>
                      <p className="text-sm font-medium">v{versions.length - i}{v.comment ? ` — ${v.comment}` : ''}</p>
                      <p className="text-xs text-slate-500">{new Date(v.created_at).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => restoreVersion(v.id)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}