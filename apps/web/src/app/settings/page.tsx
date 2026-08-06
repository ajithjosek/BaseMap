'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, User, Building2, Mail, Shield, Save, Plug, CreditCard, Flag, Trash2, Download } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const [notifPreferences, setNotifPreferences] = useState({
    email_notifications: true,
    in_app_notifications: true,
    lifecycle_changes: true,
    eol_alerts: true,
    import_export_alerts: true,
    eol_alert_days: '90,60,30',
  });

  const { data: tenant, refetch: refetchTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const tenantId = localStorage.getItem('tenant_id');
      const response = await api.get(`/tenants/${tenantId}`);
      return response.data;
    },
  });

  const { data: featureFlags, refetch: refetchFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const response = await api.get('/feature-flags');
      return response.data;
    },
  });

  const updateFlagsMutation = useMutation({
    mutationFn: async (flags: any) => api.put('/feature-flags', { flags }),
    onSuccess: () => refetchFlags(),
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const tenantId = localStorage.getItem('tenant_id');
      return api.patch(`/tenants/${tenantId}`, data);
    },
    onSuccess: () => refetchTenant(),
  });

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const response = await api.get('/users/me/preferences');
      return response.data;
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (prefs: any) => {
      return api.patch('/users/me/preferences', prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  const handleSavePreferences = () => {
    updatePrefsMutation.mutate({
      ...preferences,
      notifications: notifPreferences,
    });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t('tab_profile')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> {t('tab_notifications')}
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> {t('tab_tenant')}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" /> {t('tab_integrations')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> {t('tab_billing')}
          </TabsTrigger>
          <TabsTrigger value="feature-flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" /> {t('tab_features')}
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> {t('tab_sso')}
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> {t('tab_data')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_title')}</CardTitle>
              <CardDescription>{t('profile_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('first_name')}</Label>
                    <Input placeholder={t('first_name_ph')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('last_name')}</Label>
                    <Input placeholder={t('last_name_ph')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input type="email" placeholder={t('email_ph')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('job_title')}</Label>
                    <Input placeholder={t('job_title_ph')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('department')}</Label>
                    <Input placeholder={t('department_ph')} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('change_password')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="password" placeholder={t('current_password')} />
                    <Input type="password" placeholder={t('new_password')} />
                  </div>
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> {t('save_changes')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('notif_title')}</CardTitle>
              <CardDescription>{t('notif_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">{t('notif_channels')}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">{t('email_notifications')}</p>
                      <p className="text-sm text-slate-500">{t('email_notifications_desc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPreferences.email_notifications}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, email_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">{t('in_app_notifications')}</p>
                      <p className="text-sm text-slate-500">{t('in_app_notifications_desc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPreferences.in_app_notifications}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, in_app_notifications: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">{t('notif_types')}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('lifecycle_changes')}</p>
                    <p className="text-sm text-slate-500">{t('lifecycle_changes_desc')}</p>
                  </div>
                  <Switch
                    checked={notifPreferences.lifecycle_changes}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, lifecycle_changes: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('eol_alerts')}</p>
                    <p className="text-sm text-slate-500">{t('eol_alerts_desc')}</p>
                  </div>
                  <Switch
                    checked={notifPreferences.eol_alerts}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, eol_alerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('import_export_alerts')}</p>
                    <p className="text-sm text-slate-500">{t('import_export_alerts_desc')}</p>
                  </div>
                  <Switch
                    checked={notifPreferences.import_export_alerts}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, import_export_alerts: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t('eol_alert_days')}</Label>
                <p className="text-sm text-slate-500 mb-2">{t('eol_alert_days_desc')}</p>
                <Input
                  value={notifPreferences.eol_alert_days}
                  onChange={(e) => setNotifPreferences({ ...notifPreferences, eol_alert_days: e.target.value })}
                  placeholder={t('eol_alert_days_ph')}
                />
              </div>

              <Button onClick={handleSavePreferences} disabled={updatePrefsMutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> {t('save_preferences')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('tenant_title')}</CardTitle>
              <CardDescription>{t('tenant_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('organization_name')}</Label>
                  <Input placeholder={t('organization_name_ph')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('plan')}</Label>
                  <Select defaultValue="enterprise">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">{t('plan_starter')}</SelectItem>
                      <SelectItem value="professional">{t('plan_professional')}</SelectItem>
                      <SelectItem value="enterprise">{t('plan_enterprise')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t('default_data_classification')}</Label>
                <Select defaultValue="internal">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t('classification_public')}</SelectItem>
                    <SelectItem value="internal">{t('classification_internal')}</SelectItem>
                    <SelectItem value="confidential">{t('classification_confidential')}</SelectItem>
                    <SelectItem value="restricted">{t('classification_restricted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" /> {t('save_tenant_settings')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('servicenow_title')}</CardTitle>
              <CardDescription>{t('servicenow_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{t('servicenow_cmdb_sync')}</p>
                  <p className="text-sm text-slate-500">{t('servicenow_cmdb_sync_desc')}</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/settings/integrations'}>
                  {t('configure')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('plan_billing_title')}</CardTitle>
              <CardDescription>{t('plan_billing_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{t('current_plan')}</p>
                  <p className="text-sm text-slate-500">{t('current_plan_desc')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold capitalize">{tenant?.plan || 'starter'}</p>
                  <p className="text-xs text-slate-500">{t('requests_per_min', { count: tenant?.settings?.quotas?.requests_per_minute || 100 })}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(['starter', 'professional', 'enterprise'] as const).map((plan) => (
                  <button
                    key={plan}
                    disabled={!tenant || tenant?.plan === plan || updateTenantMutation.isPending}
                    onClick={() => updateTenantMutation.mutate({ plan })}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      tenant?.plan === plan
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-slate-300 disabled:opacity-50'
                    }`}
                  >
                    <p className="font-medium capitalize">{plan}</p>
                    <p className="text-xs text-slate-500">
                      {plan === 'starter' && t('requests_per_min', { count: 100 })}
                      {plan === 'professional' && t('requests_per_min', { count: 500 })}
                      {plan === 'enterprise' && t('requests_per_min', { count: 2000 })}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('feature_flags_title')}</CardTitle>
              <CardDescription>{t('feature_flags_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureFlags &&
                Object.entries(featureFlags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-500">{t('enable_feature', { name: key.replace(/_/g, ' ') })}</p>
                    </div>
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => updateFlagsMutation.mutate({ [key]: checked })}
                      aria-label={`Toggle ${key}`}
                    />
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sso" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('sso_title')}</CardTitle>
              <CardDescription>{t('sso_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                {t('sso_help')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('provider')}</Label>
                  <Input defaultValue="oidc" readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('issuer_url')}</Label>
                  <Input placeholder={t('issuer_url_ph')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('client_id')}</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>{t('client_secret')}</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" /> {t('save_sso_config')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('data_title')}</CardTitle>
              <CardDescription>{t('data_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{t('export_tenant_data')}</p>
                  <p className="text-sm text-slate-500">{t('export_tenant_data_desc')}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const tenantId = localStorage.getItem('tenant_id');
                    const res = await api.get(`/tenants/${tenantId}/export`);
                    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tenant-export-${tenantId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> {t('export_data')}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-red-200 p-4">
                <div>
                  <p className="font-medium text-red-600">{t('danger_zone')}</p>
                  <p className="text-sm text-slate-500">{t('danger_zone_desc')}</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm(t('delete_confirm'))) {
                      const tenantId = localStorage.getItem('tenant_id');
                      await api.delete(`/tenants/${tenantId}`);
                      localStorage.clear();
                      window.location.href = '/login';
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t('delete_workspace')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
