'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Server, AppWindow, RefreshCw, Activity } from 'lucide-react';

export default function EOLRiskDashboard() {
  const t = useTranslations('eolRisk');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['eol-risk'],
    queryFn: async () => {
      const response = await api.get('/eol-risk/dashboard');
      return response.data;
    },
  });

  const getCriticality = (count: number) => {
    if (count >= 5) return 'critical';
    if (count >= 2) return 'high';
    if (count >= 1) return 'medium';
    return 'low';
  };

  const getVariant = (category: string) => {
    switch (category) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) return <div className="p-8 text-center">{t('loading')}</div>;

  const appCounts = data?.applications?.counts || { critical: 0, high: 0, medium: 0, low: 0, expired: 0 };
  const compCounts = data?.components?.counts || { critical: 0, high: 0, medium: 0, low: 0, expired: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> {t('refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={appCounts.critical > 0 ? 'border-red-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_critical')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{appCounts.critical + compCounts.critical}</div>
            <p className="text-xs text-slate-500">{t('days_lt30')}</p>
          </CardContent>
        </Card>
        <Card className={appCounts.high > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_high')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{appCounts.high + compCounts.high}</div>
            <p className="text-xs text-slate-500">{t('days_30_90')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_medium')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{appCounts.medium + compCounts.medium}</div>
            <p className="text-xs text-slate-500">{t('days_90_180')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_low')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{appCounts.low + compCounts.low}</div>
            <p className="text-xs text-slate-500">{t('days_gt180')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppWindow className="h-5 w-5" /> {t('apps_at_risk')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.applications?.items?.length) ? (
              <p className="text-slate-500 text-center py-4">{t('no_apps_eol')}</p>
            ) : (
              <div className="space-y-3">
                {data.applications.items.slice(0, 10).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-slate-500">
                        {t('eol_days', { date: new Date(app.eol_date).toLocaleDateString(), days: app.daysRemaining })}
                      </p>
                    </div>
                    <Badge variant={getVariant(getCriticality(app.daysRemaining))}>
                      {app.daysRemaining < 0 ? t('badge_expired') : app.daysRemaining <= 30 ? t('badge_critical') : app.daysRemaining <= 90 ? t('badge_high') : app.daysRemaining <= 180 ? t('badge_medium') : t('badge_low')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" /> {t('components_at_risk')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.components?.items?.length) ? (
              <p className="text-slate-500 text-center py-4">{t('no_comps_eol')}</p>
            ) : (
              <div className="space-y-3">
                {data.components.items.slice(0, 10).map((comp: any) => (
                  <div key={comp.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-xs text-slate-500">
                        {t('eol_days', { date: new Date(comp.eol_date).toLocaleDateString(), days: comp.daysRemaining })}
                      </p>
                    </div>
                    <Badge variant={getVariant(getCriticality(comp.daysRemaining))}>
                      {comp.daysRemaining < 0 ? t('badge_expired') : comp.daysRemaining <= 30 ? t('badge_critical') : comp.daysRemaining <= 90 ? t('badge_high') : comp.daysRemaining <= 180 ? t('badge_medium') : t('badge_low')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}