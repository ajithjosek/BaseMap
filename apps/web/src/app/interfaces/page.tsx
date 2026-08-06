'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Plus, Activity, Link2, Server, ArrowRight, 
  CheckCircle, AlertTriangle, XCircle, Clock
} from 'lucide-react';

interface Interface {
  id: string;
  name: string;
  description?: string;
  interface_type: string;
  status: string;
  source_application?: { id: string; name: string };
  target_application?: { id: string; name: string };
  protocol?: string;
  data_format?: string;
  direction?: string;
  frequency?: string;
  _count?: { incidents: number };
}

const statusColors: Record<string, string> = {
  'Operational': 'bg-green-500',
  'Degraded': 'bg-yellow-500',
  'Down': 'bg-red-500',
  'Active': 'bg-green-500',
  'Deprecated': 'bg-slate-500',
};

const typeOptions = ['REST', 'SOAP', 'GraphQL', 'gRPC', 'Database', 'File Transfer', 'Message Queue', 'Other'];

export default function ApiCatalogPage() {
  const t = useTranslations('interfaces');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<Interface | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    interface_type: 'REST',
    source_application_id: '',
    target_application_id: '',
    direction: 'One-way',
    frequency: 'Real-time',
    protocol: '',
    data_format: '',
    status: 'Operational',
  });

  const queryClient = useQueryClient();

  const { data: interfaces, isLoading } = useQuery({
    queryKey: ['interfaces', searchQuery, typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/interfaces?${params.toString()}`);
      return response.data as Interface[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['interfaces-stats'],
    queryFn: async () => {
      const response = await api.get('/interfaces/stats');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        source_application_id: data.source_application_id || null,
        target_application_id: data.target_application_id || null,
      };
      const response = await api.post('/interfaces', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] });
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        interface_type: 'REST',
        source_application_id: '',
        target_application_id: '',
        direction: 'One-way',
        frequency: 'Real-time',
        protocol: '',
        data_format: '',
        status: 'Operational',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/interfaces/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('add_interface')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t('stat_total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t('stat_operational')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.operational || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t('stat_degraded')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.degraded || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{t('stat_down')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.down || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder={t('search_placeholder')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_types')}</SelectItem>
            {typeOptions.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_status')}</SelectItem>
            <SelectItem value="Operational">{t('operational')}</SelectItem>
            <SelectItem value="Degraded">{t('degraded')}</SelectItem>
            <SelectItem value="Down">{t('down')}</SelectItem>
            <SelectItem value="Deprecated">{t('deprecated')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {interfaces?.map(iface => (
          <Card 
            key={iface.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedInterface(iface)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${statusColors[iface.status] || 'bg-slate-400'}`} />
                  <div>
                    <div className="font-medium">{iface.name}</div>
                    <div className="text-sm text-slate-500">
                      {iface.interface_type} • {iface.protocol || t('no_protocol')} • {iface.data_format || t('no_format')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {iface.source_application && (
                    <div className="text-sm">
                      <span className="text-slate-500">{t('from')}</span> {iface.source_application.name}
                    </div>
                  )}
                  {iface.source_application && iface.target_application && (
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  )}
                  {iface.target_application && (
                    <div className="text-sm">
                      <span className="text-slate-500">{t('to')}</span> {iface.target_application.name}
                    </div>
                  )}
                  {iface._count?.incidents ? (
                    <Badge variant="destructive">{t('incidents', { count: iface._count.incidents })}</Badge>
                  ) : (
                    <Badge variant="outline">{t('no_incidents')}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {interfaces?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Link2 className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('no_interfaces')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('add_interface')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('interface_name')}</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('name_ph')}
                />
              </div>
              <div>
                <Label>{t('type')}</Label>
                <Select 
                  value={formData.interface_type}
                  onValueChange={(v) => setFormData({ ...formData, interface_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t('description')}</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('description_ph')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('source_application')}</Label>
                <Input 
                  value={formData.source_application_id}
                  onChange={(e) => setFormData({ ...formData, source_application_id: e.target.value })}
                  placeholder={t('app_id_optional')}
                />
              </div>
              <div>
                <Label>{t('target_application')}</Label>
                <Input 
                  value={formData.target_application_id}
                  onChange={(e) => setFormData({ ...formData, target_application_id: e.target.value })}
                  placeholder={t('app_id_optional')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('direction')}</Label>
                <Select 
                  value={formData.direction}
                  onValueChange={(v) => setFormData({ ...formData, direction: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-way">{t('direction_one_way')}</SelectItem>
                    <SelectItem value="Bidirectional">{t('direction_bidirectional')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('frequency')}</Label>
                <Select 
                  value={formData.frequency}
                  onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real-time">{t('freq_real_time')}</SelectItem>
                    <SelectItem value="Batch">{t('freq_batch')}</SelectItem>
                    <SelectItem value="Scheduled">{t('freq_scheduled')}</SelectItem>
                    <SelectItem value="On-demand">{t('freq_on_demand')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('protocol')}</Label>
                <Input 
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  placeholder={t('protocol_ph')}
                />
              </div>
              <div>
                <Label>{t('data_format')}</Label>
                <Input 
                  value={formData.data_format}
                  onChange={(e) => setFormData({ ...formData, data_format: e.target.value })}
                  placeholder={t('data_format_ph')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!formData.name}>{t('add_interface')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}