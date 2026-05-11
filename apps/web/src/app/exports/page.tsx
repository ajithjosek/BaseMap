'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Plus, Calendar, Clock, Play, Trash2, FileText, Download, Share } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  is_default: boolean;
  is_shared: boolean;
  usage_count: number;
}

interface ScheduledExport {
  id: string;
  name: string;
  format: string;
  frequency: string;
  is_active: boolean;
  next_run_at: string;
  template?: { name: string };
}

export default function ExportsPage() {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isScheduledDialogOpen, setIsScheduledDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', template_type: 'saas', is_shared: false });
  const [newScheduled, setNewScheduled] = useState({ name: '', format: 'csv', frequency: 'weekly', template_id: '' });
  const queryClient = useQueryClient();

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['export-templates'],
    queryFn: async () => {
      const response = await api.get('/exports/templates');
      return response.data as Template[];
    },
  });

  const { data: scheduled } = useQuery({
    queryKey: ['scheduled-exports'],
    queryFn: async () => {
      const response = await api.get('/exports/scheduled');
      return response.data as ScheduledExport[];
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      const response = await api.post('/exports/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-templates'] });
      setIsTemplateDialogOpen(false);
      setNewTemplate({ name: '', description: '', template_type: 'saas', is_shared: false });
    },
  });

  const createScheduledMutation = useMutation({
    mutationFn: async (data: typeof newScheduled) => {
      const response = await api.post('/exports/scheduled', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
      setIsScheduledDialogOpen(false);
      setNewScheduled({ name: '', format: 'csv', frequency: 'weekly', template_id: '' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/exports/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-templates'] });
    },
  });

  const toggleScheduledMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/exports/scheduled/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
    },
  });

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly' };
    return labels[freq] || freq;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileDown className="h-8 w-8 text-green-500" />
            Exports & Reports
          </h1>
          <p className="text-slate-500 mt-1">Create export templates and schedule automated reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScheduledDialogOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" /> Schedule Export
          </Button>
          <Button onClick={() => setIsTemplateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduled?.filter((s: ScheduledExport) => s.is_active).length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates?.reduce((sum: number, t: Template) => sum + t.usage_count, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !templates?.length ? (
            <div className="text-center py-8 text-slate-500">
              <FileDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-slate-500">{template.template_type}</p>
                    </div>
                    <div className="flex gap-1">
                      {template.is_default && <Badge variant="outline">Default</Badge>}
                      {template.is_shared && <Badge variant="outline"><Share className="h-3 w-3" /></Badge>}
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Used {template.usage_count} times</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTemplateMutation.mutate(template.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!scheduled?.length ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled exports yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Name</th>
                    <th className="text-left py-3">Template</th>
                    <th className="text-left py-3">Format</th>
                    <th className="text-left py-3">Frequency</th>
                    <th className="text-left py-3">Next Run</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-right py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduled.map((exp: ScheduledExport) => (
                    <tr key={exp.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 font-medium">{exp.name}</td>
                      <td className="py-3">{exp.template?.name || '-'}</td>
                      <td className="py-3">
                        <Badge variant="outline">{exp.format.toUpperCase()}</Badge>
                      </td>
                      <td className="py-3">{getFrequencyLabel(exp.frequency)}</td>
                      <td className="py-3 text-sm">
                        {exp.next_run_at ? new Date(exp.next_run_at).toLocaleString() : '-'}
                      </td>
                      <td className="py-3">
                        <Badge variant={exp.is_active ? 'default' : 'secondary'}>
                          {exp.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleScheduledMutation.mutate(exp.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Export Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Monthly SaaS Report"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Data Type</Label>
              <Select
                value={newTemplate.template_type}
                onValueChange={(v) => setNewTemplate({ ...newTemplate, template_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS Applications</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="technology">Technology Components</SelectItem>
                  <SelectItem value="interfaces">API Interfaces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shared"
                checked={newTemplate.is_shared}
                onChange={(e) => setNewTemplate({ ...newTemplate, is_shared: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="shared">Share with team</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createTemplateMutation.mutate(newTemplate)} disabled={createTemplateMutation.isPending}>
              {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduledDialogOpen} onOpenChange={setIsScheduledDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Export</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Schedule Name</Label>
              <Input
                value={newScheduled.name}
                onChange={(e) => setNewScheduled({ ...newScheduled, name: e.target.value })}
                placeholder="Weekly SaaS Report"
              />
            </div>
            <div className="grid gap-2">
              <Label>Template</Label>
              <Select
                value={newScheduled.template_id}
                onValueChange={(v) => setNewScheduled({ ...newScheduled, template_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates?.map((t: Template) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Format</Label>
                <Select
                  value={newScheduled.format}
                  onValueChange={(v) => setNewScheduled({ ...newScheduled, format: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <Select
                  value={newScheduled.frequency}
                  onValueChange={(v) => setNewScheduled({ ...newScheduled, frequency: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduledDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createScheduledMutation.mutate(newScheduled)} disabled={createScheduledMutation.isPending}>
              {createScheduledMutation.isPending ? 'Creating...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}