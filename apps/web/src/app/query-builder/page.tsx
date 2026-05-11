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
import { BarChart3, LineChart, PieChart, Table as TableIcon, Plus, Save, Share2, Download, History, Trash2, Search } from 'lucide-react';

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
                    {['table', 'bar', 'line', 'pie'].map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={chartType === type ? 'default' : 'outline'}
                        onClick={() => setChartType(type)}
                      >
                        {type === 'table' && <TableIcon className="h-4 w-4" />}
                        {type === 'bar' && <BarChart3 className="h-4 w-4" />}
                        {type === 'line' && <LineChart className="h-4 w-4" />}
                        {type === 'pie' && <PieChart className="h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {results?.data?.length ? (
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