// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskMetrics {
  lifecycle_distribution: any[];
  risk_distribution: any[];
}

const RISK_COLORS: Record<string, string> = {
  'Low Risk': '#22c55e', // green
  'Medium Risk': '#eab308', // yellow
  'High Risk': '#ef4444', // red
};

const LIFECYCLE_COLORS: Record<string, string> = {
  'Planning': '#3b82f6',
  'Active': '#22c55e',
  'Maintenance': '#eab308',
  'Retirement': '#f97316',
  'Retired': '#ef4444',
};

export function RiskWidgets({ data }: { data: RiskMetrics }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="col-span-1 h-72">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Lifecycle Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.lifecycle_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.lifecycle_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={LIFECYCLE_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1 h-72">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Risk Score Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.risk_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.risk_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
