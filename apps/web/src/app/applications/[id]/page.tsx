'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Edit, Trash2, Calendar, Building, User, Globe, Shield, History, DollarSign, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { LifecycleTransitionDialog } from '@/components/applications/lifecycle-transition-dialog';
import { CostManagement } from '@/components/applications/cost-management';
import { CapabilityMapping } from '@/components/applications/capability-mapping';
import { InterfacesPanel } from '@/components/applications/interfaces-panel';

export default function ApplicationDetailPage() {
  const t = useTranslations('applicationDetail');
  const { id } = useParams();
  const router = useRouter();
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [deployModel, setDeployModel] = useState('');

  const queryClient = useQueryClient();

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put(`/applications/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      setIsDeployDialogOpen(false);
    },
  });

  const cloudReadinessMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/technology-components/${id}/cloud-readiness`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
  });

  if (isLoading) return <div className="p-8 text-center">{t('loading')}</div>;
  if (!app) return <div className="p-8 text-center">{t('not_found')}</div>;

  const getLifecycleVariant = (state: string) => {
    switch (state) {
      case 'Active': return 'success';
      case 'Planning': return 'info';
      case 'Maintenance': return 'warning';
      case 'Retirement':
      case 'Retired': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
          <Badge variant={getLifecycleVariant(app.lifecycle_state)}>
            {app.lifecycle_state}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/applications/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> {t('edit')}
            </Link>
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                {app.description || t('no_description')}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t('tab_overview')}</TabsTrigger>
              <TabsTrigger value="capabilities">{t('tab_capabilities')}</TabsTrigger>
              <TabsTrigger value="interfaces">{t('tab_interfaces')}</TabsTrigger>
              <TabsTrigger value="costs">{t('tab_costs')}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
               <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Building className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">{t('business_unit')}</p>
                          <p className="font-medium text-slate-900">{app.business_unit?.name || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <User className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">{t('owner')}</p>
                          <p className="font-medium text-slate-900">{app.owner?.first_name} {app.owner?.last_name || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Globe className="h-5 w-5" />
                        <div>
<p className="text-xs font-semibold uppercase text-slate-400">{t('deployment_model')}</p>
                          <p className="font-medium text-slate-900">{app.deployment_model || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Shield className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">{t('risk_score')}</p>
                          <p className="font-medium text-slate-900">{app.risk_score} / 100</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="capabilities">
              <CapabilityMapping application={app} />
            </TabsContent>
            <TabsContent value="interfaces">
              <InterfacesPanel applicationId={id as string} />
            </TabsContent>
            <TabsContent value="costs">
              <CostManagement applicationId={id as string} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('technical_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('vendor')}</p>
                <p className="font-medium">{app.vendor || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('version')}</p>
                <p className="font-medium">{app.version || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('technology_type')}</p>
                <p className="font-medium">{app.technology_type || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('cloud_readiness')}</p>
                <div className="flex items-center gap-2">
                  {app.cloud_readiness_score ? (
                    <>
                      <div className={`text-lg font-bold ${
                        app.cloud_readiness_score >= 70 ? 'text-green-600' :
                        app.cloud_readiness_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {app.cloud_readiness_score}/100
                      </div>
                      {app.migration_complexity && (
                        <Badge variant={
                          app.migration_complexity === 'Low' ? 'success' :
                          app.migration_complexity === 'Medium' ? 'warning' : 'destructive'
                        }>
                          {t('complexity', { level: app.migration_complexity })}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400">{t('not_assessed')}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('deployment_model')}</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{app.deployment_model || t('not_set')}</p>
                  <Button size="sm" variant="ghost" onClick={() => { setDeployModel(app.deployment_model || ''); setIsDeployDialogOpen(true); }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => cloudReadinessMutation.mutate()}
                  disabled={cloudReadinessMutation.isPending}
                >
                  {cloudReadinessMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {t('assess_cloud_readiness')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> {t('lifecycle')}
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsTransitionDialogOpen(true)}>
                   {t('transition_state')}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('created_at')}</p>
                <p className="font-medium">{new Date(app.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{t('last_updated')}</p>
                <p className="font-medium">{new Date(app.updated_at).toLocaleDateString()}</p>
              </div>
              {app.lifecycle_reason && (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">{t('last_reason')}</p>
                  <p className="text-sm italic text-slate-600">{app.lifecycle_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> {t('history')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="text-sm text-slate-500 py-4 italic">
                  {t('timeline_soon')}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LifecycleTransitionDialog
        application={app}
        open={isTransitionDialogOpen}
        onOpenChange={setIsTransitionDialogOpen}
      />

      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('update_deployment_model')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('deployment_model')}</Label>
            <Select value={deployModel} onValueChange={setDeployModel}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('select_deployment_model')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On-Premise">{t('deploy_on_premise')}</SelectItem>
                <SelectItem value="IaaS">{t('deploy_iaas')}</SelectItem>
                <SelectItem value="PaaS">{t('deploy_paas')}</SelectItem>
                <SelectItem value="SaaS">{t('deploy_saas')}</SelectItem>
                <SelectItem value="Hybrid">{t('deploy_hybrid')}</SelectItem>
                <SelectItem value="Multi-Cloud">{t('deploy_multi_cloud')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={() => updateMutation.mutate({ deployment_model: deployModel })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
