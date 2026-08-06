'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, FileText, Filter, FileBarChart, PieChart as PieChartIcon, AlertTriangle, DollarSign, FileSignature } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const t = useTranslations('reports');
  const tc = useTranslations('common');
  const [reportType, setReportType] = useState('overview');
  const [selectedTemplate, setSelectedTemplate] = useState('landscape');
  const queryClient = useQueryClient();

  const { data: landscapeReport } = useQuery({
    queryKey: ['report-landscape'],
    queryFn: async () => {
      const response = await api.get('/reports/landscape');
      return response.data;
    },
    enabled: selectedTemplate === 'landscape'
  });

  const { data: coverageReport } = useQuery({
    queryKey: ['report-coverage'],
    queryFn: async () => {
      const response = await api.get('/reports/capability-coverage');
      return response.data;
    },
    enabled: selectedTemplate === 'coverage'
  });

  const { data: costReport } = useQuery({
    queryKey: ['report-cost'],
    queryFn: async () => {
      const response = await api.get('/reports/it-cost');
      return response.data;
    },
    enabled: selectedTemplate === 'cost'
  });

  const { data: eolReport } = useQuery({
    queryKey: ['report-eol'],
    queryFn: async () => {
      const response = await api.get('/reports/eol-risk');
      return response.data;
    },
    enabled: selectedTemplate === 'eol'
  });

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

  const handlePdfExport = async (reportType: string) => {
    try {
      const response = await api.get(`/reports/${reportType}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  const lifecycleData = risk?.lifecycle_distribution || [];
  const riskData = risk?.risk_distribution || [];
  const costByBu = financial?.cost_by_bu || [];
  const costByType = financial?.cost_by_type || [];
  const topApps = financial?.top_expensive_apps || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('report_type_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">{t('overview')}</SelectItem>
              <SelectItem value="financial">{t('financial')}</SelectItem>
              <SelectItem value="risk">{t('risk')}</SelectItem>
              <SelectItem value="templates">{t('standard_reports')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('applications')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('export_apps')}
          </Button>
          <Button variant="outline" onClick={() => handleExport('costs')}>
            <FileText className="mr-2 h-4 w-4" /> {t('export_costs')}
          </Button>
        </div>
      </div>

      {reportType === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('total_applications')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{executive?.total_apps || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('active')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{executive?.active_percentage || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('at_risk')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{executive?.at_risk_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('total_cost_ownership')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${(executive?.tco || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('lifecycle_distribution')}</CardTitle>
                <CardDescription>{t('lifecycle_distribution_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRisk ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">{tc('loading')}</div>
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
                <CardTitle>{t('risk_distribution')}</CardTitle>
                <CardDescription>{t('risk_distribution_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRisk ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">{tc('loading')}</div>
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
              <CardTitle>{t('top_10_expensive')}</CardTitle>
              <CardDescription>{t('top_10_expensive_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFin ? (
                <div className="h-64 flex items-center justify-center text-slate-500">{tc('loading')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topApps} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()}`} />
                    <Bar dataKey="total_cost" fill="#3b82f6" name={t('total_cost')} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('cost_by_business_unit')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFin ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">{tc('loading')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costByBu}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#8b5cf6" name={t('cost')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('cost_by_type')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFin ? (
                  <div className="h-64 flex items-center justify-center text-slate-500">{tc('loading')}</div>
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
              <CardTitle>{t('risk_overview')}</CardTitle>
              <CardDescription>{t('risk_overview_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRisk ? (
                <div className="h-64 flex items-center justify-center text-slate-500">{tc('loading')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name={t('applications')}>
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
                <CardTitle className="text-sm font-medium">{t('low_risk')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {riskData.find((d: any) => d.name === 'Low Risk')?.value || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('medium_risk')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {riskData.find((d: any) => d.name === 'Medium Risk')?.value || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('high_risk')}</CardTitle>
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

      {reportType === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${selectedTemplate === 'landscape' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedTemplate('landscape')}
            >
              <CardHeader className="pb-2">
                <FileBarChart className="h-8 w-8 mb-2" />
                <CardTitle className="text-sm">{t('template_application_landscape')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{t('template_application_landscape_desc')}</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${selectedTemplate === 'coverage' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedTemplate('coverage')}
            >
              <CardHeader className="pb-2">
                <PieChartIcon className="h-8 w-8 mb-2" />
                <CardTitle className="text-sm">{t('template_capability_coverage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{t('template_capability_coverage_desc')}</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${selectedTemplate === 'cost' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedTemplate('cost')}
            >
              <CardHeader className="pb-2">
                <DollarSign className="h-8 w-8 mb-2" />
                <CardTitle className="text-sm">{t('template_it_cost')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{t('template_it_cost_desc')}</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${selectedTemplate === 'eol' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedTemplate('eol')}
            >
              <CardHeader className="pb-2">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <CardTitle className="text-sm">{t('template_eol')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{t('template_eol_desc')}</p>
              </CardContent>
            </Card>
          </div>

          {selectedTemplate === 'landscape' && landscapeReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('landscape_report_title')}</CardTitle>
                    <CardDescription>{t('generated', { date: new Date(landscapeReport.generated_at).toLocaleString() })}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePdfExport('landscape')}>
                    <FileSignature className="mr-2 h-4 w-4" /> {t('export_pdf')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{landscapeReport.summary?.total || 0}</div>
                    <div className="text-sm text-slate-500">{t('total_apps')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {landscapeReport.summary?.byLifecycle?.Active || 0}
                    </div>
                    <div className="text-sm text-slate-500">{t('active')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{landscapeReport.summary?.byRiskLevel?.critical || 0}</div>
                    <div className="text-sm text-slate-500">{t('critical_risk')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      ${((landscapeReport.summary as any)?.total_cost || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">{t('total_cost')}</div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(landscapeReport.summary?.byLifecycle || {}).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTemplate === 'coverage' && coverageReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('coverage_report_title')}</CardTitle>
                    <CardDescription>{t('generated', { date: new Date(coverageReport.generated_at).toLocaleString() })}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePdfExport('capability-coverage')}>
                    <FileSignature className="mr-2 h-4 w-4" /> {t('export_pdf')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{coverageReport.summary?.total_capabilities || 0}</div>
                    <div className="text-sm text-slate-500">{t('total_capabilities')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{coverageReport.summary?.covered || 0}</div>
                    <div className="text-sm text-slate-500">{t('covered')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{coverageReport.summary?.partial || 0}</div>
                    <div className="text-sm text-slate-500">{t('partial')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{coverageReport.summary?.gaps || 0}</div>
                    <div className="text-sm text-slate-500">{t('gaps')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTemplate === 'cost' && costReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('it_cost_report_title')}</CardTitle>
                    <CardDescription>{t('generated', { date: new Date(costReport.generated_at).toLocaleString() })}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePdfExport('it-cost')}>
                    <FileSignature className="mr-2 h-4 w-4" /> {t('export_pdf')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">${(costReport.summary?.total_cost || 0).toLocaleString()}</div>
                    <div className="text-sm text-slate-500">{t('total_cost')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{costReport.summary?.application_count || 0}</div>
                    <div className="text-sm text-slate-500">{t('applications_plural')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">${Math.round(costReport.summary?.average_cost_per_app || 0).toLocaleString()}</div>
                    <div className="text-sm text-slate-500">{t('avg_cost_per_app')}</div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(costReport.cost_by_type || {}).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTemplate === 'eol' && eolReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('eol_report_title')}</CardTitle>
                    <CardDescription>{t('generated', { date: new Date(eolReport.generated_at).toLocaleString() })}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePdfExport('eol-risk')}>
                    <FileSignature className="mr-2 h-4 w-4" /> {t('export_pdf')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{eolReport.summary?.critical || 0}</div>
                    <div className="text-sm text-slate-500">{t('critical_30d')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{eolReport.summary?.high || 0}</div>
                    <div className="text-sm text-slate-500">{t('high_90d')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{eolReport.summary?.medium || 0}</div>
                    <div className="text-sm text-slate-500">{t('medium_180d')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{eolReport.summary?.low || 0}</div>
                    <div className="text-sm text-slate-500">{t('low_180d')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">{eolReport.summary?.past_eol || 0}</div>
                    <div className="text-sm text-slate-500">{t('past_eol')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
