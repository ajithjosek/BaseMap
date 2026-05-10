'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Edit, Trash2, Calendar, Building, User, Globe, Shield, History, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { LifecycleTransitionDialog } from '@/components/applications/lifecycle-transition-dialog';
import { CostManagement } from '@/components/applications/cost-management';
import { CapabilityMapping } from '@/components/applications/capability-mapping';
import { InterfacesPanel } from '@/components/applications/interfaces-panel';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const response = await api.get(`/applications/${id}`);
      return response.data;
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
                <p className="font-medium">{app.cloud_readiness_score || '-'}/5</p>
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
    </div>
  );
}
