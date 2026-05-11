'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, RefreshCw, Database, Clock, Settings, Zap } from 'lucide-react';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    instance_url: '',
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    sync_direction: 'inbound',
    conflict_resolution: 'source_wins',
    schedule: '',
  });
  const [fieldMappings, setFieldMappings] = useState<{ sourceField: string; targetField: string; transform: string; defaultValue: string }[]>([
    { sourceField: 'name', targetField: 'name', transform: 'none', defaultValue: '' },
    { sourceField: 'short_description', targetField: 'description', transform: 'none', defaultValue: '' },
    { sourceField: 'category', targetField: 'category', transform: 'none', defaultValue: '' },
    { sourceField: 'u_vendor', targetField: 'vendor', transform: 'none', defaultValue: '' },
  ]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['service-now-config'],
    queryFn: async () => {
      const response = await api.get('/service-now/config');
      return response.data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['service-now-logs'],
    queryFn: async () => {
      const response = await api.get('/service-now/logs');
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put('/service-now/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-now-config'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/service-now/test');
      return response.data;
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/service-now/sync');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-now-logs'] });
      queryClient.invalidateQueries({ queryKey: ['service-now-config'] });
    },
  });

  const handleSave = () => {
    const mappingObject: Record<string, any> = {};
    fieldMappings.forEach(m => {
      if (m.sourceField && m.targetField) {
        mappingObject[m.targetField] = {
          sourceField: m.sourceField,
          transform: m.transform,
          defaultValue: m.defaultValue,
        };
      }
    });
    saveMutation.mutate({ ...formData, field_mapping: mappingObject });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'running':
        return <Badge variant="warning"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
      </div>

      <Tabs defaultValue="service-now" className="space-y-4">
        <TabsList>
          <TabsTrigger value="service-now">ServiceNow</TabsTrigger>
        </TabsList>

        <TabsContent value="service-now">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  ServiceNow Configuration
                </CardTitle>
                <CardDescription>Connect to your ServiceNow instance to sync CMDB data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Instance URL</Label>
                  <Input
                    placeholder="https://yourinstance.service-now.com"
                    value={formData.instance_url}
                    onChange={(e) => setFormData({ ...formData, instance_url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client ID (OAuth)</Label>
                    <Input
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      value={formData.client_secret}
                      onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sync Direction</Label>
                    <Select
                      value={formData.sync_direction}
                      onValueChange={(v) => setFormData({ ...formData, sync_direction: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound Only</SelectItem>
                        <SelectItem value="bidirectional">Bidirectional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Conflict Resolution</Label>
                    <Select
                      value={formData.conflict_resolution}
                      onValueChange={(v) => setFormData({ ...formData, conflict_resolution: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="source_wins">ServiceNow Wins</SelectItem>
                        <SelectItem value="target_wins">APM Wins</SelectItem>
                        <SelectItem value="newest_wins">Newest Wins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Select
                    value={formData.schedule}
                    onValueChange={(v) => setFormData({ ...formData, schedule: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Manual only" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
                    {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
                {testResult && (
                  <div className={`p-3 rounded ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {testResult.message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Field Mapping
                </CardTitle>
                <CardDescription>Map ServiceNow fields to BaseMap application fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-sm font-medium text-slate-500">
                  <div>Source Field</div>
                  <div>Target Field</div>
                  <div>Transform</div>
                  <div>Default Value</div>
                </div>
                {fieldMappings.map((mapping, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="e.g., name"
                      value={mapping.sourceField}
                      onChange={(e) => {
                        const updated = [...fieldMappings];
                        updated[idx].sourceField = e.target.value;
                        setFieldMappings(updated);
                      }}
                    />
                    <Input
                      placeholder="e.g., name"
                      value={mapping.targetField}
                      onChange={(e) => {
                        const updated = [...fieldMappings];
                        updated[idx].targetField = e.target.value;
                        setFieldMappings(updated);
                      }}
                    />
                    <Select
                      value={mapping.transform}
                      onValueChange={(v) => {
                        const updated = [...fieldMappings];
                        updated[idx].transform = v;
                        setFieldMappings(updated);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="uppercase">Uppercase</SelectItem>
                        <SelectItem value="lowercase">Lowercase</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Default value"
                      value={mapping.defaultValue}
                      onChange={(e) => {
                        const updated = [...fieldMappings];
                        updated[idx].defaultValue = e.target.value;
                        setFieldMappings(updated);
                      }}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFieldMappings([...fieldMappings, { sourceField: '', targetField: '', transform: 'none', defaultValue: '' }])}
                >
                  + Add Mapping
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Sync Actions
                  </CardTitle>
                  <CardDescription>Trigger synchronization with ServiceNow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Last Sync</p>
                      <p className="text-sm text-slate-500">
                        {config?.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    {config?.last_sync_status && getStatusBadge(config.last_sync_status)}
                  </div>
                  <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="w-full">
                    {syncMutation.isPending ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" /> Sync Now</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Sync History
                  </CardTitle>
                  <CardDescription>Recent sync operations</CardDescription>
                </CardHeader>
                <CardContent>
                  {!logs?.data?.length ? (
                    <div className="text-center py-8 text-slate-500">No sync history</div>
                  ) : (
                    <div className="space-y-3">
                      {logs.data.slice(0, 10).map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{log.sync_type}</span>
                              {getStatusBadge(log.status)}
                            </div>
                            <p className="text-xs text-slate-500">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>+{log.records_created} created</p>
                            <p>~{log.records_updated} updated</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}