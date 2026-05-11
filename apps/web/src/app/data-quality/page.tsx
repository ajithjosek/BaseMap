'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Layout, Cloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataQualityDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['data-quality'],
    queryFn: async () => {
      const [apps, saas, components, interfaces] = await Promise.all([
        api.get('/applications'),
        api.get('/saas-applications'),
        api.get('/technology-components'),
        api.get('/interfaces'),
      ]);

      const calculateCompleteness = (items: any[], fields: string[]) => {
        if (!items?.length) return 0;
        let totalFields = 0;
        let filledFields = 0;
        items.forEach(item => {
          fields.forEach(f => {
            totalFields++;
            if (item[f] !== null && item[f] !== undefined && item[f] !== '') filledFields++;
          });
        });
        return Math.round((filledFields / totalFields) * 100);
      };

      const appFields = ['name', 'description', 'vendor', 'owner_id', 'business_unit_id', 'eol_date', 'deployment_model'];
      const saasFields = ['vendor', 'use_case', 'annual_contract_value', 'contract_end_date', 'total_seats'];
      const compFields = ['name', 'component_type', 'environment', 'host', 'cloud_region'];
      const interfaceFields = ['name', 'source', 'target', 'protocol'];

      return {
        applications: {
          count: apps.data?.data?.length || 0,
          completeness: calculateCompleteness(apps.data?.data, appFields),
        },
        saas: {
          count: saas.data?.data?.length || 0,
          completeness: calculateCompleteness(saas.data?.data, saasFields),
        },
        components: {
          count: components.data?.data?.length || 0,
          completeness: calculateCompleteness(components.data?.data, compFields),
        },
        interfaces: {
          count: interfaces.data?.data?.length || 0,
          completeness: calculateCompleteness(interfaces.data?.data, interfaceFields),
        },
      };
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'destructive';
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const entities = [
    { key: 'applications', label: 'Applications', icon: Layout, fields: ['Name', 'Description', 'Vendor', 'Owner', 'BU', 'EOL', 'Deployment'] },
    { key: 'saas', label: 'SaaS Applications', icon: Cloud, fields: ['Vendor', 'Use Case', 'Cost', 'Contract', 'Seats'] },
    { key: 'components', label: 'Technology Components', icon: Database, fields: ['Name', 'Type', 'Environment', 'Host', 'Region'] },
    { key: 'interfaces', label: 'API Interfaces', icon: AlertCircle, fields: ['Name', 'Source', 'Target', 'Protocol'] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Data Quality Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {entities.map(entity => {
          const entityData = data?.[entity.key as keyof typeof data];
          return (
            <Card key={entity.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <entity.icon className="h-4 w-4" /> {entity.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{entityData?.count || 0}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={entityData?.completeness || 0} className="flex-1" />
                  <span className={`text-sm font-medium ${getScoreColor(entityData?.completeness || 0)}`}>
                    {entityData?.completeness || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality by Entity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entities.map(entity => {
              const entityData = data?.[entity.key as keyof typeof data];
              return (
                <div key={entity.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entity.label}</span>
                    <Badge variant={getScoreVariant(entityData?.completeness || 0)}>
                      {entityData?.completeness || 0}% Complete
                    </Badge>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-xs text-slate-500">
                    {entity.fields.map(field => (
                      <div key={field} className="text-center">{field}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}