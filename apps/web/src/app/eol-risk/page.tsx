'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Server, AppWindow, RefreshCw, Activity } from 'lucide-react';

export default function EOLRiskDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['eol-risk'],
    queryFn: async () => {
      const response = await api.get('/eol-risk/dashboard');
      return response.data;
    },
  });

  const getCriticality = (count: number) => {
    if (count >= 5) return 'critical';
    if (count >= 2) return 'high';
    if (count >= 1) return 'medium';
    return 'low';
  };

  const getVariant = (category: string) => {
    switch (category) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const appCounts = data?.applications?.counts || { critical: 0, high: 0, medium: 0, low: 0, expired: 0 };
  const compCounts = data?.components?.counts || { critical: 0, high: 0, medium: 0, low: 0, expired: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">EOL Risk Dashboard</h1>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={appCounts.critical > 0 ? 'border-red-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{appCounts.critical + compCounts.critical}</div>
            <p className="text-xs text-slate-500">&lt;30 days</p>
          </CardContent>
        </Card>
        <Card className={appCounts.high > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{appCounts.high + compCounts.high}</div>
            <p className="text-xs text-slate-500">30-90 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{appCounts.medium + compCounts.medium}</div>
            <p className="text-xs text-slate-500">90-180 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{appCounts.low + compCounts.low}</div>
            <p className="text-xs text-slate-500">&gt;180 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppWindow className="h-5 w-5" /> Applications at Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.applications?.items?.length) ? (
              <p className="text-slate-500 text-center py-4">No applications with EOL dates</p>
            ) : (
              <div className="space-y-3">
                {data.applications.items.slice(0, 10).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-slate-500">
                        EOL: {new Date(app.eol_date).toLocaleDateString()} ({app.daysRemaining} days)
                      </p>
                    </div>
                    <Badge variant={getVariant(getCriticality(app.daysRemaining))}>
                      {app.daysRemaining < 0 ? 'Expired' : app.daysRemaining <= 30 ? 'Critical' : app.daysRemaining <= 90 ? 'High' : app.daysRemaining <= 180 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" /> Components at Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.components?.items?.length) ? (
              <p className="text-slate-500 text-center py-4">No components with EOL dates</p>
            ) : (
              <div className="space-y-3">
                {data.components.items.slice(0, 10).map((comp: any) => (
                  <div key={comp.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-xs text-slate-500">
                        EOL: {new Date(comp.eol_date).toLocaleDateString()} ({comp.daysRemaining} days)
                      </p>
                    </div>
                    <Badge variant={getVariant(getCriticality(comp.daysRemaining))}>
                      {comp.daysRemaining < 0 ? 'Expired' : comp.daysRemaining <= 30 ? 'Critical' : comp.daysRemaining <= 90 ? 'High' : comp.daysRemaining <= 180 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}