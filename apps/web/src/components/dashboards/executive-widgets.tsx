// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import { currencyFormatter } from '@basemap/utils';

interface ExecutiveMetrics {
  total_apps: number;
  total_apps_trend: number[];
  active_percentage: number;
  active_trend: number[];
  at_risk_count: number;
  at_risk_trend: number[];
  tco: number;
  tco_trend: number[];
  eol_count: number;
  eol_trend: number[];
}

interface KpiTileProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: number[];
  color: string;
}

function KpiTile({ title, value, icon, trend, color }: KpiTileProps) {
  const data = trend.map((val, i) => ({ name: i, value: val }));

  return (
    <Card className="h-40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex flex-col justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <div className="h-[40px] mt-2 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveWidgets({ data }: { data: ExecutiveMetrics }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiTile 
        title="Total Applications" 
        value={data.total_apps} 
        icon={<Layers className="h-4 w-4 text-slate-500" />} 
        trend={data.total_apps_trend} 
        color="#3b82f6" 
      />
      <KpiTile 
        title="Active Apps" 
        value={`${data.active_percentage}%`} 
        icon={<Activity className="h-4 w-4 text-green-500" />} 
        trend={data.active_trend} 
        color="#22c55e" 
      />
      <KpiTile 
        title="At Risk Apps" 
        value={data.at_risk_count} 
        icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} 
        trend={data.at_risk_trend} 
        color="#f59e0b" 
      />
      <KpiTile 
        title="Total TCO" 
        value={currencyFormatter.format(data.tco)} 
        icon={<DollarSign className="h-4 w-4 text-blue-500" />} 
        trend={data.tco_trend} 
        color="#3b82f6" 
      />
      <KpiTile 
        title="EOL Apps" 
        value={data.eol_count} 
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />} 
        trend={data.eol_trend} 
        color="#ef4444" 
      />
    </div>
  );
}
