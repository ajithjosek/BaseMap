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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, DollarSign, Users, Calendar, Shield, Globe, TrendingUp, AlertTriangle, BarChart3, Clock } from 'lucide-react';

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

  const { data: stats } = useQuery({
    queryKey: ['saas-stats'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/stats');
      return response.data;
    },
  });

  const { data: renewals } = useQuery({
    queryKey: ['saas-renewals'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/renewals');
      return response.data;
    },
  });

  const { data: utilization } = useQuery({
    queryKey: ['saas-utilization'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/utilization');
      return response.data;
    },
  });

  const { data: spendBreakdown } = useQuery({
    queryKey: ['saas-spend-breakdown'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/spend/breakdown');
      return response.data;
    },
  });

  const { data: spendTrend } = useQuery({
    queryKey: ['saas-spend-trend'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/spend/trend');
      return response.data;
    },
  });

  const { data: concentration } = useQuery({
    queryKey: ['saas-concentration'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/spend/concentration');
      return response.data;
    },
  });

  const { data: utilizationTrend } = useQuery({
    queryKey: ['saas-utilization-trend'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/utilization/trend');
      return response.data;
    },
  });

  const { data: inactiveUsers } = useQuery({
    queryKey: ['saas-inactive-users'],
    queryFn: async () => {
      const response = await api.get('/saas-applications/inactive-users');
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total SaaS Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.total_spend || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500">Annual contract value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Globe className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_apps || data?.data?.length || 0}</div>
            <p className="text-xs text-slate-500">SaaS subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Seat Utilization</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.utilization_rate || 0) < 70 ? 'text-yellow-600' : (stats?.utilization_rate || 0) > 90 ? 'text-red-600' : 'text-green-600'}`}>
              {stats?.utilization_rate || 0}%
            </div>
            <p className="text-xs text-slate-500">{stats?.active_users || 0} / {stats?.total_seats || 0} seats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.upcoming_renewals || 0) > 3 ? 'text-red-600' : 'text-orange-600'}`}>
              {stats?.upcoming_renewals || 0}
            </div>
            <p className="text-xs text-slate-500">Next 90 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shadow IT</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.shadow_it_count || 0}</div>
            <p className="text-xs text-slate-500">Unapproved applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {utilization?.filter((u: any) => u.status === 'yellow').length || 0}
            </div>
            <p className="text-xs text-slate-500">&lt;70% utilization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Over Capacity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {utilization?.filter((u: any) => u.status === 'red').length || 0}
            </div>
            <p className="text-xs text-slate-500">&gt;90% utilization</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="calendar">Renewal Calendar</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="spend">Spend</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
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
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Renewal Calendar</CardTitle>
              <CardDescription>Upcoming contract renewals for the next 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {!renewals || renewals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No upcoming renewals found</div>
              ) : (
                <div className="space-y-4">
                  {renewals.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${
                        item.days_until_renewal <= 30 ? 'bg-red-100 text-red-700' :
                        item.days_until_renewal <= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        <span className="text-lg font-bold">{item.days_until_renewal}</span>
                        <span className="text-xs">days</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.vendor}</h3>
                          {item.auto_renewal && <Badge variant="outline">Auto-renewal</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.renewal_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${Number(item.contract_value || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant={item.days_until_renewal <= 30 ? 'destructive' : 'secondary'}>
                        {item.days_until_renewal <= 30 ? 'Urgent' : item.days_until_renewal <= 60 ? 'Soon' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Seat Utilization</CardTitle>
              <CardDescription>Track usage across your SaaS applications</CardDescription>
            </CardHeader>
            <CardContent>
              {!utilization || utilization.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No utilization data available</div>
              ) : (
                <div className="space-y-4">
                  {utilization.map((app: any) => (
                    <div key={app.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{app.vendor}</h3>
                          <Badge variant={
                            app.status === 'red' ? 'destructive' :
                            app.status === 'yellow' ? 'warning' : 'default'
                          }>
                            {app.status === 'red' ? 'Over Capacity' :
                             app.status === 'yellow' ? 'Low Utilization' : 'Healthy'}
                          </Badge>
                        </div>
                        <span className="text-sm text-slate-500">
                          {app.active_users} / {app.total_seats} seats
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            app.status === 'red' ? 'bg-red-500' :
                            app.status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(app.utilization_rate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>{app.utilization_rate}% utilized</span>
                        <span>{app.total_seats - app.active_users} unused seats</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spend">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Spend by Vendor</CardTitle>
                <CardDescription>Total spend distribution across vendors</CardDescription>
              </CardHeader>
              <CardContent>
                {!spendBreakdown?.by_vendor?.length ? (
                  <div className="text-center py-8 text-slate-500">No spend data available</div>
                ) : (
                  <div className="space-y-3">
                    {spendBreakdown.by_vendor.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.vendor}</span>
                            <span className="text-sm">${item.spend.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 w-12">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spend by Category</CardTitle>
                <CardDescription>Spend breakdown by use case category</CardDescription>
              </CardHeader>
              <CardContent>
                {!spendBreakdown?.by_category?.length ? (
                  <div className="text-center py-8 text-slate-500">No category data</div>
                ) : (
                  <div className="space-y-3">
                    {spendBreakdown.by_category.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.category}</span>
                            <span className="text-sm">${item.spend.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 w-12">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Spend Trend</CardTitle>
                <CardDescription>Monthly spending over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {!spendTrend?.monthly?.length ? (
                  <div className="text-center py-8 text-slate-500">No trend data</div>
                ) : (
                  <div className="flex items-end gap-1 h-40">
                    {spendTrend.monthly.map((item: any, idx: number) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${Math.min((item.spend / Math.max(...spendTrend.monthly.map((m: any) => m.spend))) * 100, 100)}%` }}
                        />
                        <span className="text-xs text-slate-500 mt-1 transform -rotate-45 origin-left">{item.month.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Monthly Run Rate:</span>
                  <span className="font-medium">${(spendTrend?.current_monthly_run_rate || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Concentration Risk</CardTitle>
                <CardDescription>Risk assessment for vendor concentration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{concentration?.top_vendor?.name || 'N/A'}</p>
                      <p className="text-sm text-slate-500">Top Vendor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{concentration?.top_vendor?.percentage || 0}%</p>
                      <p className="text-xs text-slate-500">of total spend</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Top 3 Vendors</p>
                      <p className="text-sm text-slate-500">Combined concentration</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{concentration?.top_3_percentage || 0}%</p>
                      <p className="text-xs text-slate-500">of total spend</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${
                      concentration?.concentration_risk === 'high' ? 'text-red-500' :
                      concentration?.concentration_risk === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span className={`font-medium ${
                      concentration?.concentration_risk === 'high' ? 'text-red-600' :
                      concentration?.concentration_risk === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {concentration?.concentration_risk === 'high' ? 'High Concentration Risk' :
                       concentration?.concentration_risk === 'medium' ? 'Medium Concentration Risk' : 'Low Concentration Risk'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trends</CardTitle>
                <CardDescription>12-month utilization history per application</CardDescription>
              </CardHeader>
              <CardContent>
                {!utilizationTrend?.length ? (
                  <div className="text-center py-8 text-slate-500">No utilization trend data</div>
                ) : (
                  <div className="space-y-4">
                    {utilizationTrend.map((app: any) => (
                      <div key={app.app_id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{app.vendor}</span>
                          <span className="text-xs text-slate-500">
                            Current: {app.history[app.history.length - 1]?.utilization_rate || 0}%
                          </span>
                        </div>
                        <div className="flex items-end gap-0.5 h-12">
                          {app.history.map((h: any, idx: number) => (
                            <div
                              key={idx}
                              className={`flex-1 rounded-sm ${
                                h.utilization_rate > 90 ? 'bg-red-400' :
                                h.utilization_rate < 70 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ height: `${h.utilization_rate}%` }}
                              title={`${h.month}: ${h.utilization_rate}%`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inactive Users</CardTitle>
                <CardDescription>Users with no login in 90+ days</CardDescription>
              </CardHeader>
              <CardContent>
                {!inactiveUsers?.length ? (
                  <div className="text-center py-8 text-slate-500">No inactive users detected</div>
                ) : (
                  <div className="space-y-3">
                    {inactiveUsers.map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{app.vendor}</p>
                          <p className="text-xs text-slate-500">Last checked: {app.last_login_check_date ? new Date(app.last_login_check_date).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <Badge variant="warning">Inactive</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
