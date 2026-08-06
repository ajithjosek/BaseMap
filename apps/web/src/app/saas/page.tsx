'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('saas');
  const tc = useTranslations('common');
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
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t('add_application')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingApp ? t('edit_application') : t('add_application')}</DialogTitle>
              <DialogDescription>{t('dialog_description')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t('vendor')}</Label>
                  <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder={t('vendor_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('product_url')}</Label>
                  <Input value={formData.product_url} onChange={(e) => setFormData({ ...formData, product_url: e.target.value })} placeholder={t('product_url_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('use_case')}</Label>
                  <Input value={formData.use_case} onChange={(e) => setFormData({ ...formData, use_case: e.target.value })} placeholder={t('use_case_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('pricing_model')}</Label>
                  <Select value={formData.pricing_model} onValueChange={(v) => setFormData({ ...formData, pricing_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Per-User">{t('pricing_model_per_user')}</SelectItem>
                      <SelectItem value="Flat-Rate">{t('pricing_model_flat_rate')}</SelectItem>
                      <SelectItem value="Usage-Based">{t('pricing_model_usage_based')}</SelectItem>
                      <SelectItem value="Tiered">{t('pricing_model_tiered')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('annual_contract_value')}</Label>
                  <Input type="number" value={formData.annual_contract_value} onChange={(e) => setFormData({ ...formData, annual_contract_value: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('total_seats')}</Label>
                  <Input type="number" value={formData.total_seats} onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('contract_start_date')}</Label>
                  <Input type="date" value={formData.contract_start_date} onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('contract_end_date')}</Label>
                  <Input type="date" value={formData.contract_end_date} onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('data_residency')}</Label>
                  <Input value={formData.data_residency} onChange={(e) => setFormData({ ...formData, data_residency: e.target.value })} placeholder={t('data_residency_placeholder')} />
                </div>
              </div>
              <div className="flex gap-4 py-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.auto_renewal} onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })} />
                  <span className="text-sm">{t('auto_renewal')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_shadow_it} onChange={(e) => setFormData({ ...formData, is_shadow_it: e.target.checked })} />
                  <span className="text-sm">{t('shadow_it')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.has_dpa} onChange={(e) => setFormData({ ...formData, has_dpa: e.target.checked })} />
                  <span className="text-sm">{t('has_dpa')}</span>
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>{tc('cancel')}</Button>
                <Button type="submit">{editingApp ? tc('update') : tc('create')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('total_spend')}</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.total_spend || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500">{t('annual_contract_value_sub')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('total_applications')}</CardTitle>
            <Globe className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_apps || data?.data?.length || 0}</div>
            <p className="text-xs text-slate-500">{t('saas_subscriptions')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('seat_utilization')}</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.utilization_rate || 0) < 70 ? 'text-yellow-600' : (stats?.utilization_rate || 0) > 90 ? 'text-red-600' : 'text-green-600'}`}>
              {stats?.utilization_rate || 0}%
            </div>
            <p className="text-xs text-slate-500">{t('seats_label', { active: stats?.active_users || 0, total: stats?.total_seats || 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('upcoming_renewals')}</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.upcoming_renewals || 0) > 3 ? 'text-red-600' : 'text-orange-600'}`}>
              {stats?.upcoming_renewals || 0}
            </div>
            <p className="text-xs text-slate-500">{t('next_90_days')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('shadow_it_card')}</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.shadow_it_count || 0}</div>
            <p className="text-xs text-slate-500">{t('unapproved_applications')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('low_utilization')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {utilization?.filter((u: any) => u.status === 'yellow').length || 0}
            </div>
            <p className="text-xs text-slate-500">{t('under_70_utilization')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('over_capacity')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {utilization?.filter((u: any) => u.status === 'red').length || 0}
            </div>
            <p className="text-xs text-slate-500">{t('over_90_utilization')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">{t('tabs_applications')}</TabsTrigger>
          <TabsTrigger value="calendar">{t('tabs_renewal_calendar')}</TabsTrigger>
          <TabsTrigger value="utilization">{t('tabs_utilization')}</TabsTrigger>
          <TabsTrigger value="spend">{t('tabs_spend')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('tabs_analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>{t('saas_applications')}</CardTitle>
                <div className="relative ml-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder={t('search_placeholder')}
                    className="pl-8 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">{tc('loading')}</div>
              ) : data?.data?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t('no_applications_found')}</div>
              ) : (
                <div className="space-y-3">
                  {data?.data?.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{app.vendor || tc('unknown')}</h3>
                          {app.is_shadow_it && <Badge variant="destructive">{t('shadow_it')}</Badge>}
                          {app.auto_renewal && <Badge variant="outline">{t('auto_renewal')}</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          {app.use_case && <span>{app.use_case}</span>}
                          {app.pricing_model && <span>{app.pricing_model}</span>}
                          {app.total_seats && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t('seats_count', { count: app.total_seats })}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${Number(app.annual_contract_value || 0).toLocaleString()}{t('per_year')}</p>
                        {app.contract_end_date && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" />
                            {t('ends_on', { date: new Date(app.contract_end_date).toLocaleDateString() })}
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
              <CardTitle>{t('renewal_calendar')}</CardTitle>
              <CardDescription>{t('renewal_calendar_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!renewals || renewals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t('no_upcoming_renewals')}</div>
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
                        <span className="text-xs">{t('days')}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.vendor}</h3>
                          {item.auto_renewal && <Badge variant="outline">{t('auto_renewal')}</Badge>}
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
                        {item.days_until_renewal <= 30 ? t('urgent') : item.days_until_renewal <= 60 ? t('soon') : t('upcoming')}
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
              <CardTitle>{t('seat_utilization_title')}</CardTitle>
              <CardDescription>{t('utilization_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!utilization || utilization.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t('no_utilization_data')}</div>
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
                            {app.status === 'red' ? t('over_capacity') :
                             app.status === 'yellow' ? t('low_utilization') : t('healthy')}
                          </Badge>
                        </div>
                        <span className="text-sm text-slate-500">
                          {t('seats_label', { active: app.active_users, total: app.total_seats })}
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
                        <span>{t('utilized', { rate: app.utilization_rate })}</span>
                        <span>{t('unused_seats', { count: app.total_seats - app.active_users })}</span>
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
                <CardTitle>{t('spend_by_vendor')}</CardTitle>
                <CardDescription>{t('spend_by_vendor_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!spendBreakdown?.by_vendor?.length ? (
                  <div className="text-center py-8 text-slate-500">{t('no_spend_data')}</div>
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
                <CardTitle>{t('spend_by_category')}</CardTitle>
                <CardDescription>{t('spend_by_category_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!spendBreakdown?.by_category?.length ? (
                  <div className="text-center py-8 text-slate-500">{t('no_category_data')}</div>
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
                <CardTitle>{t('monthly_spend_trend')}</CardTitle>
                <CardDescription>{t('monthly_spend_trend_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!spendTrend?.monthly?.length ? (
                  <div className="text-center py-8 text-slate-500">{t('no_trend_data')}</div>
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
                  <span className="text-slate-500">{t('monthly_run_rate')}</span>
                  <span className="font-medium">${(spendTrend?.current_monthly_run_rate || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('vendor_concentration_risk')}</CardTitle>
                <CardDescription>{t('vendor_concentration_risk_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{concentration?.top_vendor?.name || tc('n_a')}</p>
                      <p className="text-sm text-slate-500">{t('top_vendor')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{concentration?.top_vendor?.percentage || 0}%</p>
                      <p className="text-xs text-slate-500">{t('of_total_spend')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('top_3_vendors')}</p>
                      <p className="text-sm text-slate-500">{t('combined_concentration')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{concentration?.top_3_percentage || 0}%</p>
                      <p className="text-xs text-slate-500">{t('of_total_spend')}</p>
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
                      {concentration?.concentration_risk === 'high' ? t('high_concentration') :
                       concentration?.concentration_risk === 'medium' ? t('medium_concentration') : t('low_concentration')}
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
                <CardTitle>{t('utilization_trends')}</CardTitle>
                <CardDescription>{t('utilization_trends_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!utilizationTrend?.length ? (
                  <div className="text-center py-8 text-slate-500">{t('no_utilization_trend')}</div>
                ) : (
                  <div className="space-y-4">
                    {utilizationTrend.map((app: any) => (
                      <div key={app.app_id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{app.vendor}</span>
                          <span className="text-xs text-slate-500">
                            {t('current_rate', { rate: app.history[app.history.length - 1]?.utilization_rate || 0 })}
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
                <CardTitle>{t('inactive_users')}</CardTitle>
                <CardDescription>{t('inactive_users_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!inactiveUsers?.length ? (
                  <div className="text-center py-8 text-slate-500">{t('no_inactive_users')}</div>
                ) : (
                  <div className="space-y-3">
                    {inactiveUsers.map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{app.vendor}</p>
                          <p className="text-xs text-slate-500">{t('last_checked', { date: app.last_login_check_date ? new Date(app.last_login_check_date).toLocaleDateString() : tc('never') })}</p>
                        </div>
                        <Badge variant="warning">{t('inactive')}</Badge>
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
