'use client';

import React, { useState } from 'react';
import DependencyGraph from '@/components/graph/DependencyGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function GraphPage() {
  const [viewType, setViewType] = useState<'export' | 'circular'>('export');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/graph/sync`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      toast.success('Graph synchronized successfully');
      // Force a reload of the graph by toggling state
      const current = viewType;
      setViewType('circular');
      setTimeout(() => setViewType(current), 10);
    } catch (error) {
      console.error(error);
      toast.error('Failed to sync graph');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJson = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/graph/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "graph-export.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error(error);
      toast.error('Failed to export graph data');
    }
  };

  return (
    <div className="flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Graph Visualization</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setViewType('export')} variant={viewType === 'export' ? 'default' : 'outline'}>
              Full Graph
            </Button>
            <Button onClick={() => setViewType('circular')} variant={viewType === 'circular' ? 'default' : 'outline'}>
              Circular Dependencies
            </Button>
            <Button onClick={handleSync} disabled={isSyncing} variant="secondary">
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Neo4j
            </Button>
            <Button onClick={handleExportJson} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        <Card className="col-span-4 h-[700px]">
          <CardHeader>
            <CardTitle>{viewType === 'export' ? 'Enterprise Architecture Graph' : 'Circular Dependencies'}</CardTitle>
          </CardHeader>
          <CardContent className="h-[600px] w-full">
            <DependencyGraph graphType={viewType} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
