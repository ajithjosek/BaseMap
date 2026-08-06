'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('integrations');
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
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="servicenow">{t('tab_servicenow')}</TabsTrigger>
          <TabsTrigger value="webhooks">{t('tab_webhooks')}</TabsTrigger>
        </TabsList>

        <TabsContent value="servicenow">
          <Card>
            <CardHeader>
              <CardTitle>{t('sn_title')}</CardTitle>
              <CardDescription>{t('sn_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t('instance_url')}</Label>
                    <Input 
                      placeholder={t('instance_url_ph')}
                      value={snForm.instance_url}
                      onChange={(e) => setSnForm({ ...snForm, instance_url: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('username')}</Label>
                    <Input 
                      value={snForm.username}
                      onChange={(e) => setSnForm({ ...snForm, username: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t('client_id')}</Label>
                    <Input 
                      value={snForm.client_id}
                      onChange={(e) => setSnForm({ ...snForm, client_id: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('client_secret')}</Label>
                    <Input 
                      type="password"
                      value={snForm.client_secret}
                      onChange={(e) => setSnForm({ ...snForm, client_secret: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">{t('test_connection')}</Button>
                  <Button>{t('save_configuration')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">{t('webhook_title')}</h2>
              <p className="text-sm text-slate-500">{t('webhook_desc')}</p>
            </div>
            <Button onClick={() => setIsWebhookDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('add_webhook')}
            </Button>
          </div>

          {webhooks?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">{t('no_webhooks')}</p>
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
                          {wh.is_active ? t('active') : t('inactive')}
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
            <DialogTitle>{t('add_webhook')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('webhook_name')}</Label>
              <Input
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                placeholder={t('webhook_name_ph')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('provider')}</Label>
              <Select
                value={webhookForm.provider}
                onValueChange={(v) => setWebhookForm({ ...webhookForm, provider: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">{t('provider_slack')}</SelectItem>
                  <SelectItem value="teams">{t('provider_teams')}</SelectItem>
                  <SelectItem value="discord">{t('provider_discord')}</SelectItem>
                  <SelectItem value="webhook">{t('provider_generic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('webhook_url')}</Label>
              <Input
                value={webhookForm.webhook_url}
                onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                placeholder={t('webhook_url_ph')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('events_to_trigger')}</Label>
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
                    {t(`event_${event}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWebhookDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={() => createWebhookMutation.mutate(webhookForm)} disabled={createWebhookMutation.isPending}>
              {createWebhookMutation.isPending ? t('creating') : t('create_webhook')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}