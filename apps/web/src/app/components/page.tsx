'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'Decommissioned': return <Badge variant="destructive">Decommissioned</Badge>;
      case 'Maintenance': return <Badge variant="warning">Maintenance</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Technology Components</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingComponent(null); setFormData({ name: '', component_type: 'Server', environment: 'Production', status: 'Active', host: '', ip_address: '', cloud_region: '', data_classification: 'Internal' }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Component</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingComponent ? 'Edit Component' : 'Add Technology Component'}</DialogTitle>
              <DialogDescription>Track servers, databases, cloud services, and other infrastructure</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Production DB Server" required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.component_type} onValueChange={(v) => setFormData({ ...formData, component_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Server">Server</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                      <SelectItem value="Cloud Service">Cloud Service</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Storage">Storage</SelectItem>
                      <SelectItem value="Container">Container</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select value={formData.environment} onValueChange={(v) => setFormData({ ...formData, environment: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Staging">Staging</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                      <SelectItem value="Planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input value={formData.host} onChange={(e) => setFormData({ ...formData, host: e.target.value })} placeholder="e.g., server-01.example.com" />
                </div>
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} placeholder="e.g., 192.168.1.100" />
                </div>
                <div className="space-y-2">
                  <Label>Cloud Region</Label>
                  <Input value={formData.cloud_region} onChange={(e) => setFormData({ ...formData, cloud_region: e.target.value })} placeholder="e.g., us-east-1, eu-west-1" />
                </div>
                <div className="space-y-2">
                  <Label>Data Classification</Label>
                  <Select value={formData.data_classification} onValueChange={(v) => setFormData({ ...formData, data_classification: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="Confidential">Confidential</SelectItem>
                      <SelectItem value="Restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingComponent(null); }}>Cancel</Button>
                <Button type="submit">{editingComponent ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Server">Server</SelectItem>
            <SelectItem value="Database">Database</SelectItem>
            <SelectItem value="Cloud Service">Cloud Service</SelectItem>
            <SelectItem value="Network">Network</SelectItem>
            <SelectItem value="Storage">Storage</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEnv || 'all'} onValueChange={(v) => setFilterEnv(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Environments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="Staging">Staging</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
            <SelectItem value="Test">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : !data?.data?.length ? (
        <div className="text-center py-8 text-slate-500">No technology components found. Add one to get started.</div>
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
                    <span className="text-slate-500">Type:</span>
                    <span>{component.component_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Environment:</span>
                    <span>{component.environment}</span>
                  </div>
                  {component.host && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Host:</span>
                      <span className="truncate">{component.host}</span>
                    </div>
                  )}
                  {component.cloud_region && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Region:</span>
                      <span>{component.cloud_region}</span>
                    </div>
                  )}
                  {component.applications?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Linked Apps:</span>
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