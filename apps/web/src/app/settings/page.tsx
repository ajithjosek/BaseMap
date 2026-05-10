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
import { Bell, User, Building2, Mail, Shield, Save } from 'lucide-react';

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

  const { data: preferences, isLoading } = useQuery({
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
      </Tabs>
    </div>
  );
}
