'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Tenant
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
          <TabsTrigger value="feature-flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" /> Features
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> SSO
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input placeholder="Enterprise Architect" />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input placeholder="IT" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                  </div>
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Notification Channels</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive notifications via email</p>
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
                      <p className="font-medium">In-App Notifications</p>
                      <p className="text-sm text-slate-500">Show notifications in the notification center</p>
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
                <h3 className="font-medium">Notification Types</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lifecycle Changes</p>
                    <p className="text-sm text-slate-500">Get notified when application lifecycle states change</p>
                  </div>
                  <Switch
                    checked={notifPreferences.lifecycle_changes}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, lifecycle_changes: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">EOL Alerts</p>
                    <p className="text-sm text-slate-500">Get alerts before applications reach end of life</p>
                  </div>
                  <Switch
                    checked={notifPreferences.eol_alerts}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, eol_alerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Import/Export Alerts</p>
                    <p className="text-sm text-slate-500">Get notified when import/export jobs complete</p>
                  </div>
                  <Switch
                    checked={notifPreferences.import_export_alerts}
                    onCheckedChange={(checked) => setNotifPreferences({ ...notifPreferences, import_export_alerts: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>EOL Alert Days Before</Label>
                <p className="text-sm text-slate-500 mb-2">Comma-separated list of days before EOL to send alerts</p>
                <Input
                  value={notifPreferences.eol_alert_days}
                  onChange={(e) => setNotifPreferences({ ...notifPreferences, eol_alert_days: e.target.value })}
                  placeholder="90,60,30"
                />
              </div>

              <Button onClick={handleSavePreferences} disabled={updatePrefsMutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
              <CardDescription>Manage your organization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select defaultValue="enterprise">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Default Data Classification</Label>
                <Select defaultValue="internal">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" /> Save Tenant Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>ServiceNow Integration</CardTitle>
              <CardDescription>Connect to ServiceNow to sync CMDB data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">ServiceNow CMDB Sync</p>
                  <p className="text-sm text-slate-500">Sync applications from ServiceNow</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/settings/integrations'}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan and Billing</CardTitle>
              <CardDescription>Manage your workspace plan and usage limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-slate-500">Manage how your team uses BaseMap</p>
                </div>
                <div className="text-right">
                  <p className="font-bold capitalize">{tenant?.plan || 'starter'}</p>
                  <p className="text-xs text-slate-500">Up to {tenant?.settings?.quotas?.requests_per_minute || 100} requests/min</p>
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
                      {plan === 'starter' && '100 requests/min'}
                      {plan === 'professional' && '500 requests/min'}
                      {plan === 'enterprise' && '2000 requests/min'}
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
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable features for your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureFlags &&
                Object.entries(featureFlags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-500">Enable the {key.replace(/_/g, ' ')} feature</p>
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
              <CardTitle>SSO Settings</CardTitle>
              <CardDescription>Configure single sign-on for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                SSO configuration is managed during onboarding. Re-configure IdP details here for your
                organization&apos;s identity provider (Okta, Azure AD, etc.).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input defaultValue="oidc" readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label>Issuer URL</Label>
                  <Input placeholder="https://your-tenant.okta.com/oauth2/default" />
                </div>
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" /> Save SSO Config
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or delete your organization data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Export Tenant Data</p>
                  <p className="text-sm text-slate-500">Download all your data in a GDPR-compliant format</p>
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
                  <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-red-200 p-4">
                <div>
                  <p className="font-medium text-red-600">Danger Zone</p>
                  <p className="text-sm text-slate-500">Schedule deletion of this workspace and all data (30-day grace)</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Are you sure you want to schedule deletion of this workspace? This cannot be undone.')) {
                      const tenantId = localStorage.getItem('tenant_id');
                      await api.delete(`/tenants/${tenantId}`);
                      localStorage.clear();
                      window.location.href = '/login';
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
