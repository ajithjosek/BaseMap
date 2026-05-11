'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Plus, Trash2, TestTube, MessageSquare, Globe } from 'lucide-react';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('servicenow');

  const [snForm, setSnForm] = useState({
    instance_url: '',
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    sync_direction: 'inbound',
    conflict_resolution: 'source_wins',
    schedule: '',
  });
  const [snTestResult, setSnTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    provider: 'slack',
    webhook_url: '',
    events: [] as string[],
  });
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);

  const { data: snConfig } = useQuery({
    queryKey: ['service-now-config'],
    queryFn: async () => {
      const response = await api.get('/service-now/config');
      return response.data;
    },
  });

  const { data: webhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await api.get('/webhooks');
      return response.data;
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (data: typeof webhookForm) => {
      const response = await api.post('/webhooks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setIsWebhookDialogOpen(false);
      setWebhookForm({ name: '', provider: 'slack', webhook_url: '', events: [] });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/webhooks/${id}/test`);
      return response.data;
    },
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'slack': return <MessageSquare className="h-5 w-5" />;
      case 'teams': return <Globe className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-slate-500 mt-1">Connect BaseMap with external systems</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="servicenow">ServiceNow</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="servicenow">
          <Card>
            <CardHeader>
              <CardTitle>ServiceNow Configuration</CardTitle>
              <CardDescription>Connect to your ServiceNow instance to sync applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Instance URL</Label>
                    <Input 
                      placeholder="https://instance.service-now.com"
                      value={snForm.instance_url}
                      onChange={(e) => setSnForm({ ...snForm, instance_url: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Username</Label>
                    <Input 
                      value={snForm.username}
                      onChange={(e) => setSnForm({ ...snForm, username: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Client ID</Label>
                    <Input 
                      value={snForm.client_id}
                      onChange={(e) => setSnForm({ ...snForm, client_id: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Client Secret</Label>
                    <Input 
                      type="password"
                      value={snForm.client_secret}
                      onChange={(e) => setSnForm({ ...snForm, client_secret: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Test Connection</Button>
                  <Button>Save Configuration</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Webhook Notifications</h2>
              <p className="text-sm text-slate-500">Configure webhooks to send alerts to Slack, Teams, or other platforms</p>
            </div>
            <Button onClick={() => setIsWebhookDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Webhook
            </Button>
          </div>

          {webhooks?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No webhooks configured yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {webhooks?.map((wh: any) => (
                <Card key={wh.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getProviderIcon(wh.provider)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{wh.name}</h3>
                          <p className="text-sm text-slate-500">{wh.provider} • {wh.webhook_url}</p>
                          <div className="flex gap-1 mt-1">
                            {(wh.events as string[] || []).slice(0, 3).map((e: string) => (
                              <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={wh.is_active ? 'default' : 'secondary'}>
                          {wh.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => testWebhookMutation.mutate(wh.id)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteWebhookMutation.mutate(wh.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Webhook Name</Label>
              <Input
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                placeholder="Production Alerts"
              />
            </div>
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Select
                value={webhookForm.provider}
                onValueChange={(v) => setWebhookForm({ ...webhookForm, provider: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="webhook">Generic Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Webhook URL</Label>
              <Input
                value={webhookForm.webhook_url}
                onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Events to Trigger</Label>
              <div className="flex flex-wrap gap-2">
                {['saas_renewal', 'eol_warning', 'security_alert', 'budget_threshold', 'request_approved'].map(event => (
                  <Button
                    key={event}
                    variant={webhookForm.events.includes(event) ? 'default' : 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => {
                      const events = webhookForm.events.includes(event)
                        ? webhookForm.events.filter(e => e !== event)
                        : [...webhookForm.events, event];
                      setWebhookForm({ ...webhookForm, events });
                    }}
                  >
                    {event.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWebhookDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createWebhookMutation.mutate(webhookForm)} disabled={createWebhookMutation.isPending}>
              {createWebhookMutation.isPending ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}