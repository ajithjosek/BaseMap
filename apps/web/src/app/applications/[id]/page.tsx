'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!app) return <div className="p-8 text-center">Application not found.</div>;

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
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                {app.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
               <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Building className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Business Unit</p>
                          <p className="font-medium text-slate-900">{app.business_unit?.name || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <User className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Owner</p>
                          <p className="font-medium text-slate-900">{app.owner?.first_name} {app.owner?.last_name || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Globe className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Deployment Model</p>
                          <p className="font-medium text-slate-900">{app.deployment_model || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Shield className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Risk Score</p>
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
              <CardTitle>Technical Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Vendor</p>
                <p className="font-medium">{app.vendor || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Version</p>
                <p className="font-medium">{app.version || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Technology Type</p>
                <p className="font-medium">{app.technology_type || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Cloud Readiness</p>
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
                          {app.migration_complexity} Complexity
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400">Not assessed</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Deployment Model</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{app.deployment_model || 'Not set'}</p>
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
                  Assess Cloud Readiness
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Lifecycle
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsTransitionDialogOpen(true)}>
                   Transition State
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Created At</p>
                <p className="font-medium">{new Date(app.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Last Updated</p>
                <p className="font-medium">{new Date(app.updated_at).toLocaleDateString()}</p>
              </div>
              {app.lifecycle_reason && (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Last Reason</p>
                  <p className="text-sm italic text-slate-600">"{app.lifecycle_reason}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="text-sm text-slate-500 py-4 italic">
                  Timeline visualization coming soon.
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
            <DialogTitle>Update Deployment Model</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Deployment Model</Label>
            <Select value={deployModel} onValueChange={setDeployModel}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select deployment model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On-Premise">On-Premise</SelectItem>
                <SelectItem value="IaaS">IaaS (Infrastructure as a Service)</SelectItem>
                <SelectItem value="PaaS">PaaS (Platform as a Service)</SelectItem>
                <SelectItem value="SaaS">SaaS (Software as a Service)</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Multi-Cloud">Multi-Cloud</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ deployment_model: deployModel })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
