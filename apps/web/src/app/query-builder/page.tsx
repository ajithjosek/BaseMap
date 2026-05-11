'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart3, LineChart, PieChart, Table as TableIcon, Plus, Save, Share2, Download, History, Trash2, Search, ScatterChart, Grid2X2 } from 'lucide-react';

interface Filter {
  field: string;
  operator: string;
  value: string;
}

export default function QueryBuilderPage() {
  const [entity, setEntity] = useState('applications');
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [chartType, setChartType] = useState('table');
  const [sortBy, setSortBy] = useState('');
  const [limit, setLimit] = useState(50);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [insightName, setInsightName] = useState('');
  const [insightDescription, setInsightDescription] = useState('');

  const { data: entities } = useQuery({
    queryKey: ['query-entities'],
    queryFn: async () => {
      const response = await api.get('/query-builder/entities');
      return response.data;
    },
  });

  const { data: results, isLoading: isExecuting, refetch: runQuery } = useQuery({
    queryKey: ['query-results', entity, columns, filters, groupBy, sortBy, limit],
    queryFn: async () => {
      const response = await api.post('/query-builder/execute', {
        entity,
        columns,
        filters: filters.filter(f => f.field && f.value),
        groupBy: groupBy.length ? groupBy : undefined,
        sortBy,
        limit,
      });
      return response.data;
    },
    enabled: columns.length > 0,
  });

  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const response = await api.get('/query-builder/insights');
      return response.data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ['query-history'],
    queryFn: async () => {
      const response = await api.get('/query-builder/history');
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return api.post('/query-builder/insights', {
        name: insightName,
        description: insightDescription,
        entity_type: entity,
        query_config: { columns, filters, groupBy, sortBy, limit },
        chart_type: chartType,
        is_shared: false,
      });
    },
    onSuccess: () => {
      setIsSaveDialogOpen(false);
      setInsightName('');
      setInsightDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/query-builder/insights/${id}`);
    },
    onSuccess: () => window.location.reload(),
  });

  const selectedEntity = entities?.find((e: any) => e.value === entity);

  const addFilter = () => setFilters([...filters, { field: '', operator: 'contains', value: '' }]);
  
  const removeFilter = (idx: number) => setFilters(filters.filter((_, i) => i !== idx));

  const exportCSV = () => {
    if (!results?.data?.length) return;
    const headers = columns.join(',');
    const rows = results.data.map((row: any) => columns.map(c => row[c] ?? '').join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-${entity}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const loadFromHistory = (item: any) => {
    setEntity(item.entity_type);
    setColumns(item.query_config.columns);
    setFilters(item.query_config.filters || []);
    setGroupBy(item.query_config.groupBy || []);
    setSortBy(item.query_config.sortBy || '');
  };

  const renderChart = (data: any[], type: string) => {
    const labelCol = columns[0];
    const valueCol = columns[1];

    if (type === 'bar') {
      const maxVal = Math.max(...data.map((d: any) => Number(d[valueCol]) || 0));
      return (
        <div className="h-64 flex items-end gap-2 p-4 border rounded">
          {data.slice(0, 20).map((d: any, i: number) => {
            const val = Number(d[valueCol]) || 0;
            const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%`, minHeight: val > 0 ? '4px' : '0' }} />
                <span className="text-xs truncate w-full text-center mt-1">{String(d[labelCol] || '').slice(0, 8)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === 'line') {
      const maxVal = Math.max(...data.map((d: any) => Number(d[valueCol]) || 0));
      const points = data.slice(0, 30).map((d: any, i: number) => {
        const val = Number(d[valueCol]) || 0;
        const x = (i / 29) * 100;
        const y = 100 - (maxVal > 0 ? (val / maxVal) * 100 : 0);
        return `${x},${y}`;
      }).join(' ');
      return (
        <div className="h-64 p-4 border rounded">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
            {data.slice(0, 30).map((d: any, i: number) => {
              const val = Number(d[valueCol]) || 0;
              const x = (i / 29) * 100;
              const y = 100 - (maxVal > 0 ? (val / maxVal) * 100 : 0);
              return <circle key={i} cx={x} cy={y} r="1" fill="#3b82f6" />;
            })}
          </svg>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{data[0]?.[labelCol] || ''}</span>
            <span>{data[data.length - 1]?.[labelCol] || ''}</span>
          </div>
        </div>
      );
    }

    if (type === 'pie') {
      const total = data.reduce((sum: number, d: any) => sum + (Number(d[valueCol]) || 0), 0);
      let currentAngle = 0;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
      return (
        <div className="h-64 flex items-center justify-center gap-8 p-4 border rounded">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {data.slice(0, 8).map((d: any, i: number) => {
                const val = Number(d[valueCol]) || 0;
                const percent = total > 0 ? val / total : 0;
                const angle = percent * 360;
                const start = currentAngle;
                currentAngle += angle;
                const large = angle > 180 ? 1 : 0;
                const x1 = 50 + 40 * Math.cos((start * Math.PI) / 180);
                const y1 = 50 + 40 * Math.sin((start * Math.PI) / 180);
                const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                return <path key={i} d={`M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`} fill={colors[i]} />;
              })}
            </svg>
          </div>
          <div className="space-y-1">
            {data.slice(0, 8).map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[i] }} />
                <span>{String(d[labelCol] || '').slice(0, 15)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'scatter') {
      const xCol = columns[0];
      const yCol = columns[1] || columns[0];
      const xVals = data.map((d: any) => Number(d[xCol]) || 0);
      const yVals = data.map((d: any) => Number(d[yCol]) || 0);
      const xMax = Math.max(...xVals) || 1;
      const yMax = Math.max(...yVals) || 1;
      return (
        <div className="h-64 p-4 border rounded">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {data.slice(0, 100).map((d: any, i: number) => {
              const x = ((Number(d[xCol]) || 0) / xMax) * 100;
              const y = 100 - ((Number(d[yCol]) || 0) / yMax) * 100;
              return <circle key={i} cx={x} cy={y} r="1.5" fill="#3b82f6" opacity="0.7" />;
            })}
          </svg>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>X: {xCol}</span>
            <span>Y: {yCol}</span>
          </div>
        </div>
      );
    }

    if (type === 'heatmap') {
      const xCol = columns[0];
      const yCol = columns[1] || columns[0];
      const valCol = columns[2] || columns[1];
      const grouped: Record<string, Record<string, number>> = {};
      data.forEach((d: any) => {
        const x = String(d[xCol] || 'N/A').slice(0, 10);
        const y = String(d[yCol] || 'N/A').slice(0, 10);
        if (!grouped[x]) grouped[x] = {};
        grouped[x][y] = (grouped[x][y] || 0) + (Number(d[valCol]) || 1);
      });
      const allVals = Object.values(grouped).flatMap(x => Object.values(x));
      const maxVal = Math.max(...allVals) || 1;
      const xLabels = Object.keys(grouped).slice(0, 10);
      const yLabels = [...new Set(Object.values(grouped).flatMap(x => Object.keys(x)))].slice(0, 10);
      return (
        <div className="p-4 border rounded overflow-auto">
          <div className="flex gap-1">
            <div className="w-16" />
            {xLabels.map(x => <div key={x} className="w-16 text-xs text-center truncate">{x}</div>)}
          </div>
          {yLabels.map(y => (
            <div key={y} className="flex gap-1">
              <div className="w-16 text-xs truncate">{y}</div>
              {xLabels.map(x => {
                const val = grouped[x]?.[y] || 0;
                const intensity = val / maxVal;
                const r = Math.round(59 + (196 - 59) * (1 - intensity));
                const g = Math.round(130 + (126 - 130) * (1 - intensity));
                const b = Math.round(246 + (21 - 246) * (1 - intensity));
                return <div key={x} className="w-16 h-6" style={{ backgroundColor: `rgb(${r},${g},${b})` }} title={`${x} - ${y}: ${val}`} />;
              })}
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-center py-8 text-slate-500">Chart type not implemented</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Query Builder</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)} disabled={!columns.length}>
            <Save className="mr-2 h-4 w-4" /> Save Insight
          </Button>
          <Button onClick={() => runQuery()} disabled={!columns.length || isExecuting}>
            {isExecuting ? 'Running...' : 'Run Query'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="build" className="space-y-4">
        <TabsList>
          <TabsTrigger value="build">Build Query</TabsTrigger>
          <TabsTrigger value="insights">Saved Insights</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="build">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Entity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={entity} onValueChange={(v) => { setEntity(v); setColumns([]); setFilters([]); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {entities?.map((e: any) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Columns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedEntity?.columns?.map((col: string) => (
                    <div key={col} className="flex items-center gap-2">
                      <Checkbox
                        checked={columns.includes(col)}
                        onCheckedChange={(checked) => {
                          if (checked) setColumns([...columns, col]);
                          else setColumns(columns.filter(c => c !== col));
                        }}
                      />
                      <span className="text-sm">{col}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  <Button size="sm" variant="ghost" onClick={addFilter}><Plus className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filters.map((filter, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Select value={filter.field} onValueChange={(v) => {
                        const updated = [...filters];
                        updated[idx].field = v;
                        setFilters(updated);
                      }}>
                        <SelectTrigger className="w-28"><SelectValue placeholder="Field" /></SelectTrigger>
                        <SelectContent>
                          {selectedEntity?.columns?.map((c: string) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filter.operator} onValueChange={(v) => {
                        const updated = [...filters];
                        updated[idx].operator = v;
                        setFilters(updated);
                      }}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">contains</SelectItem>
                          <SelectItem value="eq">equals</SelectItem>
                          <SelectItem value="gt">greater</SelectItem>
                          <SelectItem value="lt">less</SelectItem>
                          <SelectItem value="isNull">is empty</SelectItem>
                          <SelectItem value="isNotNull">not empty</SelectItem>
                        </SelectContent>
                      </Select>
                      {filter.operator !== 'isNull' && filter.operator !== 'isNotNull' && (
                        <Input
                          className="flex-1"
                          value={filter.value}
                          onChange={(e) => {
                            const updated = [...filters];
                            updated[idx].value = e.target.value;
                            setFilters(updated);
                          }}
                          placeholder="Value"
                        />
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeFilter(idx)}>×</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Group By</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedEntity?.columns?.slice(0, 5).map((col: string) => (
                    <div key={col} className="flex items-center gap-2">
                      <Checkbox
                        checked={groupBy.includes(col)}
                        onCheckedChange={(checked) => {
                          if (checked) setGroupBy([...groupBy, col]);
                          else setGroupBy(groupBy.filter(c => c !== col));
                        }}
                      />
                      <span className="text-sm">{col}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Chart Type</CardTitle>
                  <div className="flex gap-2">
                    {['table', 'bar', 'line', 'pie', 'scatter', 'heatmap'].map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={chartType === type ? 'default' : 'outline'}
                        onClick={() => setChartType(type)}
                        title={type.charAt(0).toUpperCase() + type.slice(1)}
                      >
                        {type === 'table' && <TableIcon className="h-4 w-4" />}
                        {type === 'bar' && <BarChart3 className="h-4 w-4" />}
                        {type === 'line' && <LineChart className="h-4 w-4" />}
                        {type === 'pie' && <PieChart className="h-4 w-4" />}
                        {type === 'scatter' && <ScatterChart className="h-4 w-4" />}
                        {type === 'heatmap' && <Grid2X2 className="h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {results?.data?.length ? (
                    chartType === 'table' ? (
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {columns.map(col => (
                                <th key={col} className="p-2 text-left font-medium">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.data.slice(0, 100).map((row: any, idx: number) => (
                              <tr key={idx} className="border-b hover:bg-slate-50">
                                {columns.map(col => (
                                  <td key={col} className="p-2">{row[col] ?? '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-slate-500">
                            Showing {results.data.length} of {results.total} results
                          </p>
                          <Button size="sm" variant="outline" onClick={exportCSV} disabled={!results.data.length}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {renderChart(results.data, chartType)}
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-slate-500">
                            Showing {results.data.length} of {results.total} results
                          </p>
                          <Button size="sm" variant="outline" onClick={exportCSV} disabled={!results.data.length}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      {isExecuting ? 'Running query...' : 'Select columns and run query to see results'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Saved Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {!insights?.data?.length ? (
                <p className="text-center py-8 text-slate-500">No saved insights yet</p>
              ) : (
                <div className="space-y-3">
                  {insights.data.map((insight: any) => (
                    <div key={insight.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">{insight.name}</p>
                        <p className="text-sm text-slate-500">{insight.entity_type} • {insight.user?.first_name} {insight.user?.last_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {insight.is_shared && (
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/shared/insight/${insight.share_token}`)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(insight.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Query History</CardTitle>
            </CardHeader>
            <CardContent>
              {!history?.data?.length ? (
                <p className="text-center py-8 text-slate-500">No query history</p>
              ) : (
                <div className="space-y-3">
                  {history.data.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded cursor-pointer hover:bg-slate-50" onClick={() => loadFromHistory(item)}>
                      <div>
                        <p className="font-medium">{item.entity_type}</p>
                        <p className="text-sm text-slate-500">{new Date(item.executed_at).toLocaleString()} • {item.result_count} results</p>
                      </div>
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Insight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={insightName} onChange={(e) => setInsightName(e.target.value)} placeholder="My Insight" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={insightDescription} onChange={(e) => setInsightDescription(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!insightName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}