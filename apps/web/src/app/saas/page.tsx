'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, DollarSign, Users, Calendar, Shield, Globe } from 'lucide-react';

export default function SaaSPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vendor: '',
    product_url: '',
    use_case: '',
    pricing_model: 'Per-User',
    annual_contract_value: '',
    contract_start_date: '',
    contract_end_date: '',
    auto_renewal: false,
    total_seats: '',
    data_residency: '',
    is_shadow_it: false,
    has_dpa: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['saas-applications', search],
    queryFn: async () => {
      const response = await api.get('/saas-applications', { params: { search } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/saas-applications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-applications'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/saas-applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-applications'] });
    },
  });

  const resetForm = () => {
    setFormData({
      vendor: '',
      product_url: '',
      use_case: '',
      pricing_model: 'Per-User',
      annual_contract_value: '',
      contract_start_date: '',
      contract_end_date: '',
      auto_renewal: false,
      total_seats: '',
      data_residency: '',
      is_shadow_it: false,
      has_dpa: false,
    });
    setEditingApp(null);
  };

  const handleEdit = (app: any) => {
    setEditingApp(app);
    setFormData({
      vendor: app.vendor || '',
      product_url: app.product_url || '',
      use_case: app.use_case || '',
      pricing_model: app.pricing_model || 'Per-User',
      annual_contract_value: app.annual_contract_value || '',
      contract_start_date: app.contract_start_date ? new Date(app.contract_start_date).toISOString().split('T')[0] : '',
      contract_end_date: app.contract_end_date ? new Date(app.contract_end_date).toISOString().split('T')[0] : '',
      auto_renewal: app.auto_renewal || false,
      total_seats: app.total_seats || '',
      data_residency: app.data_residency || '',
      is_shadow_it: app.is_shadow_it || false,
      has_dpa: app.has_dpa || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      annual_contract_value: formData.annual_contract_value ? parseFloat(formData.annual_contract_value) : null,
      total_seats: formData.total_seats ? parseInt(formData.total_seats) : null,
    };

    if (editingApp) {
      api.put(`/saas-applications/${editingApp.id}`, payload).then(() => {
        queryClient.invalidateQueries({ queryKey: ['saas-applications'] });
        setIsDialogOpen(false);
        resetForm();
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalCost = data?.data?.reduce((sum: number, app: any) => sum + Number(app.annual_contract_value || 0), 0) || 0;
  const shadowITCount = data?.data?.filter((app: any) => app.is_shadow_it).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">SaaS & Cloud</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add SaaS Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingApp ? 'Edit SaaS Application' : 'Add SaaS Application'}</DialogTitle>
              <DialogDescription>Track your SaaS subscriptions and contracts</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="e.g., Salesforce" />
                </div>
                <div className="space-y-2">
                  <Label>Product URL</Label>
                  <Input value={formData.product_url} onChange={(e) => setFormData({ ...formData, product_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Use Case</Label>
                  <Input value={formData.use_case} onChange={(e) => setFormData({ ...formData, use_case: e.target.value })} placeholder="CRM, HR, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select value={formData.pricing_model} onValueChange={(v) => setFormData({ ...formData, pricing_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Per-User">Per-User</SelectItem>
                      <SelectItem value="Flat-Rate">Flat Rate</SelectItem>
                      <SelectItem value="Usage-Based">Usage-Based</SelectItem>
                      <SelectItem value="Tiered">Tiered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Annual Contract Value ($)</Label>
                  <Input type="number" value={formData.annual_contract_value} onChange={(e) => setFormData({ ...formData, annual_contract_value: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Total Seats</Label>
                  <Input type="number" value={formData.total_seats} onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contract Start Date</Label>
                  <Input type="date" value={formData.contract_start_date} onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contract End Date</Label>
                  <Input type="date" value={formData.contract_end_date} onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data Residency</Label>
                  <Input value={formData.data_residency} onChange={(e) => setFormData({ ...formData, data_residency: e.target.value })} placeholder="e.g., US, EU" />
                </div>
              </div>
              <div className="flex gap-4 py-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.auto_renewal} onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })} />
                  <span className="text-sm">Auto-renewal</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_shadow_it} onChange={(e) => setFormData({ ...formData, is_shadow_it: e.target.checked })} />
                  <span className="text-sm">Shadow IT</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.has_dpa} onChange={(e) => setFormData({ ...formData, has_dpa: e.target.checked })} />
                  <span className="text-sm">Has DPA</span>
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit">{editingApp ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total SaaS Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            <p className="text-xs text-slate-500">Annual contract value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Globe className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.data?.length || 0}</div>
            <p className="text-xs text-slate-500">SaaS subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shadow IT</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shadowITCount}</div>
            <p className="text-xs text-slate-500">Unapproved applications</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>SaaS Applications</CardTitle>
            <div className="relative ml-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search SaaS apps..."
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No SaaS applications found. Add one to get started.</div>
          ) : (
            <div className="space-y-3">
              {data?.data?.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{app.vendor || 'Unknown Vendor'}</h3>
                      {app.is_shadow_it && <Badge variant="destructive">Shadow IT</Badge>}
                      {app.auto_renewal && <Badge variant="outline">Auto-renewal</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      {app.use_case && <span>{app.use_case}</span>}
                      {app.pricing_model && <span>{app.pricing_model}</span>}
                      {app.total_seats && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{app.total_seats} seats</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(app.annual_contract_value || 0).toLocaleString()}/yr</p>
                    {app.contract_end_date && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        Ends {new Date(app.contract_end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(app)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(app.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
