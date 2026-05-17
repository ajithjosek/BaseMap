'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { useTheme } from 'next-themes';

interface GraphData {
  nodes: { id: string; data: any }[];
  edges: { id: string; source: string; target: string; type: string; [key: string]: any }[];
}

export default function DependencyGraph({ graphType, appId }: { graphType: 'export' | 'lineage' | 'impact' | 'circular', appId?: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/graph/${graphType}`;
        if (appId) {
          url += `/${appId}`;
        }
        
        const response = await axios.get<GraphData>(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // simple auth token retrieval
          }
        });

        // Layout the nodes simply (in a real app, use dagre or elkjs for auto-layout)
        const newNodes = response.data.nodes.map((node, i) => ({
          id: node.id,
          position: { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 },
          data: { label: node.data.name || node.id },
          style: {
            background: node.data.lifecycle === 'Planning' ? '#dbeafe' : 
                        node.data.lifecycle === 'Retired' ? '#f3f4f6' : 
                        node.data.risk > 50 ? '#fee2e2' : '#fff',
            border: '1px solid #777',
            borderRadius: '8px',
            padding: '10px',
          }
        }));

        const newEdges = response.data.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.type,
          markerEnd: { type: MarkerType.ArrowClosed },
        }));

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error('Error fetching graph data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [graphType, appId, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading Graph...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode={theme === 'dark' ? 'dark' : 'light'}
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
