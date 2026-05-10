'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('overview');
  const queryClient = useQueryClient();

  const { data: executive, isLoading: isLoadingExec } = useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async () => {
      const response = await api.get('/dashboards/executive');
      return response.data;
    },
  });

  const { data: financial, isLoading: isLoadingFin } = useQuery({
    queryKey: ['dashboard-financial'],
    queryFn: async () => {
      const response = await api.get('/dashboards/financial');
      return response.data;
    },
  });

  const { data: risk, isLoading: isLoadingRisk } = useQuery({
    queryKey: ['dashboard-risk'],
    queryFn: async () => {
      const response = await api.get('/dashboards/risk');
      return response.data;
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (exportType: string) => {
      const response = await api.post('/import-export/export', {
        exportType,
        format: 'csv',
      });
      const job = response.data;
      await api.post(`/import-export/export/${job.id}/process`);
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const handleExport = (type: string) => {
    exportMutation.mutate(type);
  };

  const lifecycleData = risk?.lifecycle_distribution || [];
  const riskData = risk?.risk_distribution || [];
  const costByBu = financial?.cost_by_bu || [];
  const costByType = financial?.cost_by_type || [];
  const topApps = financial?.top_expensive_apps || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="risk">Risk</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('applications')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Apps
          </Button>
          <Button variant="outline" onClick={() => handleExport('costs')}>
            <FileText className="mr-2 h-4 w-4" /> Export Costs
          </Button>
        </div>
      </div>

      {reportType === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{executive?.total_apps || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{executive?.active_percentage || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{executive?.at_risk_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cost of Ownership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(executive?.tco || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Distribution</CardTitle>
                <CardDescription>Applications by lifecycle state</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRisk ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={lifecycleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {lifecycleData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Applications by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRisk ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: any) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {reportType === 'financial' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Expensive Applications</CardTitle>
              <CardDescription>By total cost of ownership</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFin ? (
                <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topApps} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()}`} />
                    <Bar dataKey="total_cost" fill="#3b82f6" name="Total Cost" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Business Unit</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFin ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costByBu}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#8b5cf6" name="Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFin ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {costByType.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {reportType === 'risk' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Risk Overview</CardTitle>
              <CardDescription>Application risk assessment summary</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRisk ? (
                <div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Applications">
                      {riskData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {riskData.find((d: any) => d.name === 'Low Risk')?.value || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {riskData.find((d: any) => d.name === 'Medium Risk')?.value || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {riskData.find((d: any) => d.name === 'High Risk')?.value || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
