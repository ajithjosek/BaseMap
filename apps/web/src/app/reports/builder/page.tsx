'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Play, Download, Share2, Save, Filter, Table, BarChart3, ArrowDownUp } from 'lucide-react';

interface CustomReport {
  id: string;
  name: string;
  description?: string;
  entity_type: string;
  columns: string[];
  filters: any[];
  group_by: string[];
  aggregations: any[];
  is_shared: boolean;
  is_public: boolean;
  last_run_at?: string;
  created_at: string;
  user: { first_name: string; last_name: string; email: string };
}

const entityFields: Record<string, string[]> = {
  application: ['name', 'vendor', 'version', 'lifecycle_state', 'risk_score', 'eol_date', 'business_unit', 'owner', 'total_cost'],
  capability: ['name', 'level', 'strategic_importance', 'application_count', 'parent_id'],
  cost: ['cost_type', 'amount', 'billing_cycle', 'effective_date', 'application_name'],
};

const aggregationTypes = [
  { value: 'count', label: 'Count', requiresField: false },
  { value: 'sum', label: 'Sum', requiresField: true },
  { value: 'avg', label: 'Average', requiresField: true },
  { value: 'min', label: 'Min', requiresField: true },
  { value: 'max', label: 'Max', requiresField: true },
];

export default function ReportBuilderPage() {
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type: 'application',
    columns: [] as string[],
    filters: [] as any[],
    group_by: [] as string[],
    aggregations: [] as any[],
  });

  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: async () => {
      const response = await api.get('/reports/custom');
      return response.data as CustomReport[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/reports/custom', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/reports/custom/${id}/execute`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reports/custom/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      setSelectedReport(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      entity_type: 'application',
      columns: [],
      filters: [],
      group_by: [],
      aggregations: [],
    });
  };

  const handleCreateReport = () => {
    createMutation.mutate(formData);
  };

  const handleAddFilter = () => {
    setFormData({
      ...formData,
      filters: [...formData.filters, { field: '', operator: 'eq', value: '' }],
    });
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...formData.filters];
    newFilters.splice(index, 1);
    setFormData({ ...formData, filters: newFilters });
  };

  const handleAddAggregation = () => {
    setFormData({
      ...formData,
      aggregations: [...formData.aggregations, { type: 'count', field: '', alias: '' }],
    });
  };

  const handleRemoveAggregation = (index: number) => {
    const newAggs = [...formData.aggregations];
    newAggs.splice(index, 1);
    setFormData({ ...formData, aggregations: newAggs });
  };

  const toggleColumn = (col: string) => {
    const cols = formData.columns.includes(col)
      ? formData.columns.filter(c => c !== col)
      : [...formData.columns, col];
    setFormData({ ...formData, columns: cols });
  };

  const toggleGroupBy = (col: string) => {
    const groups = formData.group_by.includes(col)
      ? formData.group_by.filter(c => c !== col)
      : [...formData.group_by, col];
    setFormData({ ...formData, group_by: groups });
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-slate-500 mt-1">Create and manage custom reports with filters, grouping, and aggregations</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports?.length === 0 ? (
                <p className="text-slate-500 text-sm">No custom reports yet. Create one to get started.</p>
              ) : (
                reports?.map(report => (
                  <div
                    key={report.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedReport?.id === report.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => { setSelectedReport(report); setIsEditMode(false); }}
                  >
                    <div className="font-medium">{report.name}</div>
                    <div className="text-xs text-slate-500">
                      {report.entity_type} • {report.user?.first_name} {report.user?.last_name}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {report.is_shared && <Badge variant="outline" className="text-xs">Shared</Badge>}
                      {report.last_run_at && <Badge variant="secondary" className="text-xs">Run</Badge>}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedReport.name}</CardTitle>
                    <CardDescription>{selectedReport.description || 'No description'}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => executeMutation.mutate(selectedReport.id)}
                      disabled={executeMutation.isPending}
                    >
                      <Play className="mr-1 h-4 w-4" /> 
                      {executeMutation.isPending ? 'Running...' : 'Run'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-4 w-4" /> Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(selectedReport.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Entity:</span> <span className="font-medium">{selectedReport.entity_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Columns:</span> <span className="font-medium">{(selectedReport.columns as any[])?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Filters:</span> <span className="font-medium">{(selectedReport.filters as any[])?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Group By:</span> <span className="font-medium">{(selectedReport.group_by as any[])?.length || 0}</span>
                    </div>
                  </div>

                  {(selectedReport.filters as any[])?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Applied Filters</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedReport.filters as any[]).map((f, i) => (
                          <Badge key={i} variant="secondary">
                            {f.field} {f.operator} {f.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedReport.aggregations as any[])?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Aggregations</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedReport.aggregations as any[]).map((a, i) => (
                          <Badge key={i} variant="outline">
                            {a.type}({a.field || '*'}){a.alias ? ` as ${a.alias}` : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Table className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a report from the list or create a new one</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Report Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Custom Report"
                />
              </div>
              <div>
                <Label>Entity Type</Label>
                <Select 
                  value={formData.entity_type}
                  onValueChange={(v) => setFormData({ ...formData, entity_type: v, columns: [], group_by: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="capability">Capability</SelectItem>
                    <SelectItem value="cost">Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this report show?"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Table className="h-4 w-4" /> Columns
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {entityFields[formData.entity_type]?.map(field => (
                  <Badge 
                    key={field}
                    variant={formData.columns.includes(field) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleColumn(field)}
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </Label>
                <Button variant="outline" size="sm" onClick={handleAddFilter}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.filters.map((filter, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select 
                      value={filter.field}
                      onValueChange={(v) => {
                        const newFilters = [...formData.filters];
                        newFilters[i].field = v;
                        setFormData({ ...formData, filters: newFilters });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {entityFields[formData.entity_type]?.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={filter.operator}
                      onValueChange={(v) => {
                        const newFilters = [...formData.filters];
                        newFilters[i].operator = v;
                        setFormData({ ...formData, filters: newFilters });
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Op" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eq">=</SelectItem>
                        <SelectItem value="ne">!=</SelectItem>
                        <SelectItem value="gt">&gt;</SelectItem>
                        <SelectItem value="lt">&lt;</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      className="flex-1"
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...formData.filters];
                        newFilters[i].value = e.target.value;
                        setFormData({ ...formData, filters: newFilters });
                      }}
                      placeholder="Value"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFilter(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <ArrowDownUp className="h-4 w-4" /> Group By
                </Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {entityFields[formData.entity_type]?.map(field => (
                  <Badge 
                    key={field}
                    variant={formData.group_by.includes(field) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleGroupBy(field)}
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Aggregations
                </Label>
                <Button variant="outline" size="sm" onClick={handleAddAggregation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.aggregations.map((agg, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select 
                      value={agg.type}
                      onValueChange={(v) => {
                        const newAggs = [...formData.aggregations];
                        newAggs[i].type = v;
                        setFormData({ ...formData, aggregations: newAggs });
                      }}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {aggregationTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {aggregationTypes.find(t => t.value === agg.type)?.requiresField && (
                      <Select 
                        value={agg.field}
                        onValueChange={(v) => {
                          const newAggs = [...formData.aggregations];
                          newAggs[i].field = v;
                          setFormData({ ...formData, aggregations: newAggs });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {entityFields[formData.entity_type]?.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input 
                      className="w-24"
                      value={agg.alias || ''}
                      onChange={(e) => {
                        const newAggs = [...formData.aggregations];
                        newAggs[i].alias = e.target.value;
                        setFormData({ ...formData, aggregations: newAggs });
                      }}
                      placeholder="Alias"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAggregation(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReport} disabled={!formData.name}>
              <Save className="mr-2 h-4 w-4" /> Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}