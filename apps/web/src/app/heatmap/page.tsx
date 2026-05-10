'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

interface Capability {
  id: string;
  name: string;
  level: number;
}

interface Application {
  id: string;
  name: string;
  lifecycle_state: string;
  risk_score: number;
}

interface MatrixData {
  applications: Application[];
  capabilities: Capability[];
  matrix: Record<string, Record<string, string>>;
}

interface GapStats {
  total: number;
  open: number;
  closed: number;
  bySeverity: Record<string, number>;
}

interface Coverage {
  [key: string]: { status: string; appCount: number };
}

const supportLevelColors: Record<string, string> = {
  'Primary': 'bg-blue-600',
  'Supporting': 'bg-green-500',
  'Enabling': 'bg-yellow-500',
  '': 'bg-slate-100',
};

export default function HeatmapPage() {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [coverage, setCoverage] = useState<Coverage>({});
  const [gapStats, setGapStats] = useState<GapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    businessUnitId: '',
    lifecycleState: '',
    riskScore: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.businessUnitId) params.append('businessUnitId', filters.businessUnitId);
      if (filters.lifecycleState) params.append('lifecycleState', filters.lifecycleState);
      if (filters.riskScore) params.append('riskScore', filters.riskScore);

      const [matrixRes, coverageRes, statsRes] = await Promise.all([
        api.get(`/capabilities/c2a-matrix?${params.toString()}`),
        api.get('/capabilities/coverage'),
        api.get('/capabilities/gaps/stats'),
      ]);

      setMatrixData(matrixRes.data);
      setCoverage(coverageRes.data);
      setGapStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const response = await api.get('/capabilities/c2a-matrix/export', {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'c2a-heatmap.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDetectGaps = async () => {
    try {
      await api.post('/capabilities/gaps/detect');
      fetchData();
    } catch (error) {
      console.error('Gap detection failed:', error);
    }
  };

  const getCellColor = (supportLevel: string) => {
    return supportLevelColors[supportLevel] || 'bg-slate-100';
  };

  const getCapabilityStatus = (capId: string) => {
    return coverage[capId]?.status || 'red';
  };

  if (loading && !matrixData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capability to Application Heatmap</h1>
          <p className="text-slate-500 mt-1">
            Map applications to capabilities and identify gaps in coverage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDetectGaps}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Detect Gaps
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gapStats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Open Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{gapStats?.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Closed Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{gapStats?.closed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{gapStats?.bySeverity?.Critical || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <div className="flex gap-2">
              <Select
                value={filters.lifecycleState}
                onValueChange={(value) => setFilters({ ...filters, lifecycleState: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lifecycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lifecycles</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.riskScore}
                onValueChange={(value) => setFilters({ ...filters, riskScore: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="0-30">Low (0-30)</SelectItem>
                  <SelectItem value="31-60">Medium (31-60)</SelectItem>
                  <SelectItem value="61-100">High (61-100)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Capability Coverage Matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {matrixData && matrixData.capabilities.length > 0 ? (
            <div className="min-w-full">
              <div className="flex mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-sm">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Supporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Enabling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-200 rounded"></div>
                  <span className="text-sm">No Mapping</span>
                </div>
              </div>

              <div className="grid gap-1" style={{ 
                gridTemplateColumns: `200px repeat(${Math.min(matrixData.applications.length, 10)}, 80px)`
              }}>
                <div className="font-medium p-2 bg-slate-50">Capability</div>
                {matrixData.applications.slice(0, 10).map((app) => (
                  <div key={app.id} className="font-medium p-2 bg-slate-50 text-xs truncate text-center">
                    {app.name.substring(0, 10)}
                  </div>
                ))}

                {matrixData.capabilities.map((cap) => (
                  <>
                    <div 
                      key={`cap-${cap.id}`} 
                      className="p-2 flex items-center gap-2"
                    >
                      <span className={`text-sm ${getCapabilityStatus(cap.id) === 'red' ? 'text-red-600 font-medium' : getCapabilityStatus(cap.id) === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {getCapabilityStatus(cap.id) === 'red' && '●'}
                        {getCapabilityStatus(cap.id) === 'yellow' && '●'}
                        {getCapabilityStatus(cap.id) === 'green' && '●'}
                      </span>
                      <span className="text-sm truncate">
                        {cap.name} (L{cap.level})
                      </span>
                    </div>
                    {matrixData.applications.slice(0, 10).map((app) => {
                      const supportLevel = matrixData.matrix[app.id]?.[cap.id] || '';
                      return (
                        <div
                          key={`${cap.id}-${app.id}`}
                          className={`h-8 w-full rounded ${getCellColor(supportLevel)}`}
                          title={supportLevel ? `${app.name} → ${cap.name}: ${supportLevel}` : `${app.name} → ${cap.name}: No mapping`}
                        />
                      );
                    })}
                  </>
                ))}
              </div>

              {matrixData.applications.length > 10 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Showing first 10 of {matrixData.applications.length} applications
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No capabilities found. Create capabilities first in the Capabilities page.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gap List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={async () => {
                try {
                  const res = await api.get('/capabilities/gaps');
                  const gaps = res.data;
                  if (gaps.length === 0) {
                    alert('No gaps found. Click "Detect Gaps" to scan for gaps.');
                  }
                } catch (error) {
                  console.error('Failed to fetch gaps:', error);
                }
              }}
            >
              View All Gaps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}