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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Server, Database, Cloud, Network, ServerIcon, Activity, Trash2, Edit, Link2 } from 'lucide-react';

export default function TechnologyComponentsPage() {
  const t = useTranslations('components');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterEnv, setFilterEnv] = useState<string>('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    component_type: 'Server',
    environment: 'Production',
    status: 'Active',
    host: '',
    ip_address: '',
    cloud_region: '',
    data_classification: 'Internal',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['technology-components', filterType, filterEnv],
    queryFn: async () => {
      const response = await api.get('/technology-components', { 
        params: { type: filterType, environment: filterEnv } 
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/technology-components', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technology-components'] });
      setIsDialogOpen(false);
      setFormData({ name: '', component_type: 'Server', environment: 'Production', status: 'Active', host: '', ip_address: '', cloud_region: '', data_classification: 'Internal' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/technology-components/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technology-components'] });
    },
  });

  const handleEdit = (component: any) => {
    setEditingComponent(component);
    setFormData({
      name: component.name || '',
      component_type: component.component_type || 'Server',
      environment: component.environment || 'Production',
      status: component.status || 'Active',
      host: component.host || '',
      ip_address: component.ip_address || '',
      cloud_region: component.cloud_region || '',
      data_classification: component.data_classification || 'Internal',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingComponent) {
      api.put(`/technology-components/${editingComponent.id}`, formData).then(() => {
        queryClient.invalidateQueries({ queryKey: ['technology-components'] });
        setIsDialogOpen(false);
        setEditingComponent(null);
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Server': return <Server className="h-4 w-4" />;
      case 'Database': return <Database className="h-4 w-4" />;
      case 'Cloud Service': return <Cloud className="h-4 w-4" />;
      case 'Network': return <Network className="h-4 w-4" />;
      default: return <ServerIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <Badge variant="success">{t('status_active')}</Badge>;
      case 'Decommissioned': return <Badge variant="destructive">{t('status_decommissioned')}</Badge>;
      case 'Maintenance': return <Badge variant="warning">{t('status_maintenance')}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingComponent(null); setFormData({ name: '', component_type: 'Server', environment: 'Production', status: 'Active', host: '', ip_address: '', cloud_region: '', data_classification: 'Internal' }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> {t('add_component')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingComponent ? t('edit_component') : t('add_component_title')}</DialogTitle>
              <DialogDescription>{t('dialog_desc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t('name_required')}</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('name_ph')} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('type')}</Label>
                  <Select value={formData.component_type} onValueChange={(v) => setFormData({ ...formData, component_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Server">{t('type_server')}</SelectItem>
                      <SelectItem value="Database">{t('type_database')}</SelectItem>
                      <SelectItem value="Cloud Service">{t('type_cloud_service')}</SelectItem>
                      <SelectItem value="Network">{t('type_network')}</SelectItem>
                      <SelectItem value="Storage">{t('type_storage')}</SelectItem>
                      <SelectItem value="Container">{t('type_container')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('environment')}</Label>
                  <Select value={formData.environment} onValueChange={(v) => setFormData({ ...formData, environment: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">{t('env_production')}</SelectItem>
                      <SelectItem value="Staging">{t('env_staging')}</SelectItem>
                      <SelectItem value="Development">{t('env_development')}</SelectItem>
                      <SelectItem value="Test">{t('env_test')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">{t('status_active')}</SelectItem>
                      <SelectItem value="Maintenance">{t('status_maintenance')}</SelectItem>
                      <SelectItem value="Decommissioned">{t('status_decommissioned')}</SelectItem>
                      <SelectItem value="Planned">{t('status_planned')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('host')}</Label>
                  <Input value={formData.host} onChange={(e) => setFormData({ ...formData, host: e.target.value })} placeholder={t('host_ph')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('ip_address')}</Label>
                  <Input value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} placeholder={t('ip_address_ph')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('cloud_region')}</Label>
                  <Input value={formData.cloud_region} onChange={(e) => setFormData({ ...formData, cloud_region: e.target.value })} placeholder={t('cloud_region_ph')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('data_classification')}</Label>
                  <Select value={formData.data_classification} onValueChange={(v) => setFormData({ ...formData, data_classification: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">{t('classification_public')}</SelectItem>
                      <SelectItem value="Internal">{t('classification_internal')}</SelectItem>
                      <SelectItem value="Confidential">{t('classification_confidential')}</SelectItem>
                      <SelectItem value="Restricted">{t('classification_restricted')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingComponent(null); }}>{tc('cancel')}</Button>
                <Button type="submit">{editingComponent ? tc('update') : tc('create')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t('all_types')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_types')}</SelectItem>
            <SelectItem value="Server">{t('type_server')}</SelectItem>
            <SelectItem value="Database">{t('type_database')}</SelectItem>
            <SelectItem value="Cloud Service">{t('type_cloud_service')}</SelectItem>
            <SelectItem value="Network">{t('type_network')}</SelectItem>
            <SelectItem value="Storage">{t('type_storage')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEnv || 'all'} onValueChange={(v) => setFilterEnv(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t('all_environments')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_environments')}</SelectItem>
            <SelectItem value="Production">{t('env_production')}</SelectItem>
            <SelectItem value="Staging">{t('env_staging')}</SelectItem>
            <SelectItem value="Development">{t('env_development')}</SelectItem>
            <SelectItem value="Test">{t('env_test')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">{tc('loading')}</div>
      ) : !data?.data?.length ? (
        <div className="text-center py-8 text-slate-500">{t('no_components')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((component: any) => (
            <Card key={component.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(component.component_type)}
                    <CardTitle className="text-base">{component.name}</CardTitle>
                  </div>
                  {getStatusBadge(component.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('type_label')}</span>
                    <span>{component.component_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('environment_label')}</span>
                    <span>{component.environment}</span>
                  </div>
                  {component.host && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('host_label')}</span>
                      <span className="truncate">{component.host}</span>
                    </div>
                  )}
                  {component.cloud_region && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('region_label')}</span>
                      <span>{component.cloud_region}</span>
                    </div>
                  )}
                  {component.applications?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('linked_apps_label')}</span>
                      <span>{component.applications.length}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(component)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(component.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}