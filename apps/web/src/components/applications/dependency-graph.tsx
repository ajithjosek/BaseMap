'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


// Custom Node Component
const AppNode = (props: any) => {
  const data = props.data;
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${data.isHighlight ? 'border-blue-500' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Top} className="w-16 !bg-slate-400" />
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm">{data.label}</div>
          {data.isWarning && <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />}
        </div>
        <div className="text-xs text-slate-500">{data.techType || 'Application'}</div>
        <div className="mt-2 flex gap-1">
          <Badge variant={data.status === 'Active' ? 'success' : 'secondary'} className="text-[10px] px-1 py-0 h-4">
            {data.status}
          </Badge>
          {data.riskScore > 50 && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">High Risk</Badge>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-slate-400" />
    </div>
  );
};

const nodeTypes = {
  appNode: AppNode,
};

interface DependencyGraphProps {
  applicationId: string;
  graphData: {
    nodes: any[];
    edges: any[];
  };
  circularWarning?: boolean;
}

export function DependencyGraph({ applicationId, graphData, circularWarning }: DependencyGraphProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Convert API data to React Flow format
  const initialNodes = graphData.nodes.map((node, index) => {
    // Basic auto-layout based on index for simplicity. In production, use dagre.js or similar.
    // For now we'll do a simple radial or grid layout.
    const isCenter = node.id === applicationId;
    const x = isCenter ? 250 : 250 + Math.cos(index * 2) * 200;
    const y = isCenter ? 250 : 250 + Math.sin(index * 2) * 200;

    return {
      id: node.id,
      type: 'appNode',
      position: { x, y },
      data: {
        label: node.name,
        techType: node.technology_type,
        status: node.lifecycle_state,
        riskScore: node.risk_score,
        isHighlight: isCenter,
        isWarning: circularWarning && isCenter, // simplistic warning indicator
      },
    };
  });

  const initialEdges = graphData.edges.map(edge => ({
    id: edge.id,
    source: edge.source_application_id,
    target: edge.target_application_id,
    label: edge.interface_type,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#64748b', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#64748b',
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Impact Analysis logic
  const onNodeClick = useCallback((event: React.MouseEvent, clickedNode: any) => {
    const downstreamNodeIds = new Set<string>();
    
    // Find all downstream paths from clicked node
    const traverse = (nodeId: string) => {
      downstreamNodeIds.add(nodeId);
      edges.forEach(edge => {
        if (edge.source === nodeId && !downstreamNodeIds.has(edge.target)) {
          traverse(edge.target);
        }
      });
    };
    
    traverse(clickedNode.id);

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlight: downstreamNodeIds.has(node.id),
        },
      }))
    );
    
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: downstreamNodeIds.has(edge.target) ? '#3b82f6' : '#64748b',
          strokeWidth: downstreamNodeIds.has(edge.target) ? 3 : 2,
        },
        animated: downstreamNodeIds.has(edge.target),
      }))
    );
  }, [edges, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const exportAsPng = () => {
    if (reactFlowWrapper.current === null) return;
    toPng(reactFlowWrapper.current, {
      filter: (node) => {
        // Exclude UI controls from export
        if (node?.classList?.contains('react-flow__minimap') || 
            node?.classList?.contains('react-flow__controls')) {
          return false;
        }
        return true;
      },
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'dependency-graph.png';
      link.href = dataUrl;
      link.click();
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-full border rounded-lg overflow-hidden bg-slate-50 relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="secondary" size="sm" onClick={exportAsPng} className="shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Export PNG
        </Button>
      </div>

      {circularWarning && (
        <div className="absolute top-4 left-4 z-10 max-w-sm">
          <div className="bg-red-50/90 backdrop-blur-sm shadow-md border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
              <AlertTriangle className="h-4 w-4" />
              Warning
            </div>
            <div className="text-sm text-red-700">
              A circular dependency has been detected in this architecture.
            </div>
          </div>
        </div>
      )}

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
          <MiniMap zoomable pannable nodeClassName="bg-blue-500" />
        </ReactFlow>
      </div>
    </div>
  );
}
