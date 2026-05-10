'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DependencyGraph } from './dependency-graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InterfacesPanelProps {
  applicationId: string;
}

export function InterfacesPanel({ applicationId }: InterfacesPanelProps) {
  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['interfaces-graph', applicationId],
    queryFn: async () => {
      // 2 hops up and down as requested
      const response = await api.get(`/interfaces/graph/${applicationId}?hops=2`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500 min-h-[400px] flex items-center justify-center">
          Loading architecture graph...
        </CardContent>
      </Card>
    );
  }

  if (error || !graphData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-red-500">
          Failed to load relationship data.
        </CardContent>
      </Card>
    );
  }

  // Check for circular dependency warning by looking if this component is source and target
  // Actual circular detection is in backend, but we can do a quick client side heuristic
  // Or just rely on the API returning a warning flag. For now, let's assume API could return it
  // or we do a simple check: if any edge connects back to an upstream node.
  // Given the requirement "implement circular dependency warning", we can pass true if detected.
  
  const hasCircularWarning = !!graphData.hasCircularWarning;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Architecture & Data Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Interactive dependency graph showing upstream and downstream applications (up to 2 hops). 
            Click on a node to see its downstream impact path.
          </p>
          <DependencyGraph 
            applicationId={applicationId} 
            graphData={graphData} 
            circularWarning={hasCircularWarning} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
