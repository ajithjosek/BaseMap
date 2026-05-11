'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BarChart3, PieChart, TrendingUp, Layout, DollarSign, AppWindow, Server } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  widget_type: string;
  config: any;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface BudgetForecast {
  id: string;
  fiscal_year: number;
  fiscal_month: number;
  category: string;
  predicted: number;
  actual?: number;
}

export default function AdvancedAnalyticsPage() {
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [newWidget, setNewWidget] = useState({ name: '', widget_type: 'stat', width: 4, height: 3 });
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await api.get('/advanced-analytics/summary');
      return response.data;
    },
  });

  const { data: costTrend } = useQuery({
    queryKey: ['cost-trend'],
    queryFn: async () => {
      const response = await api.get('/advanced-analytics/cost-trend?months=12');
      return response.data;
    },
  });

  const { data: budget } = useQuery({
    queryKey: ['budget-forecast'],
    queryFn: async () => {
      const response = await api.get('/advanced-analytics/budget');
      return response.data as BudgetForecast[];
    },
  });

  const createWidgetMutation = useMutation({
    mutationFn: async (data: typeof newWidget) => {
      const response = await api.post('/advanced-analytics/widgets', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-widgets'] });
      setIsWidgetDialogOpen(false);
      setNewWidget({ name: '', widget_type: 'stat', width: 4, height: 3 });
    },
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxCost = Math.max(...(costTrend?.map((c: any) => c.amount) || [1]));

  const widgetTypes = [
    { value: 'stat', label: 'Stat Card', icon: BarChart3 },
    { value: 'chart_line', label: 'Line Chart', icon: TrendingUp },
    { value: 'chart_bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'chart_pie', label: 'Pie Chart', icon: PieChart },
    { value: 'table', label: 'Data Table', icon: Layout },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Advanced Analytics
          </h1>
          <p className="text-slate-500 mt-1">Custom dashboards, cost trends, and budget forecasting</p>
        </div>
        <Button onClick={() => setIsWidgetDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total SaaS Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((summary?.saas_spend?.total) || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AppWindow className="h-4 w-4 text-blue-500" />
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.applications?.total || 0}</div>
            <p className="text-xs text-slate-500">
              {summary?.applications?.by_state?.Active || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-500" />
              Technology Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.technology?.total || 0}</div>
            <p className="text-xs text-slate-500">
              {summary?.technology?.by_status?.Active || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((costTrend?.[costTrend?.length - 1]?.amount) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">current month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Trend (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-1">
              {costTrend?.map((item: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${(item.amount / maxCost) * 200}px` }}
                    title={`$${item.amount.toLocaleString()}`}
                  />
                  <span className="text-xs text-slate-400">{item.month?.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary?.saas_spend?.by_category || {}).map(([cat, amount]: any) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(amount / summary?.saas_spend?.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 w-24 text-right">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Forecast FY {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  {months.map(m => <th key={m} className="text-center py-2 text-xs">{m}</th>)}
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {['Infrastructure', 'Software', 'Security', 'Support'].map(cat => {
                  const catData = budget?.filter((b: BudgetForecast) => b.category === cat) || [];
                  const total = catData.reduce((sum: number, b: BudgetForecast) => sum + Number(b.predicted || 0), 0);
                  return (
                    <tr key={cat} className="border-b hover:bg-slate-50">
                      <td className="py-2 font-medium">{cat}</td>
                      {months.map((_, idx) => {
                        const monthData = catData.find((b: BudgetForecast) => b.fiscal_month === idx + 1);
                        return (
                          <td key={idx} className="text-center py-2 text-sm">
                            {monthData ? `$${(monthData.predicted / 1000).toFixed(0)}K` : '-'}
                          </td>
                        );
                      })}
                      <td className="text-right py-2 font-medium">${total.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technology Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary?.technology?.by_type || {}).map(([type, count]: any) => (
              <div key={type} className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-slate-500">{type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dashboard Widget</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Widget Name</Label>
              <Input
                value={newWidget.name}
                onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })}
                placeholder="My Widget"
              />
            </div>
            <div className="grid gap-2">
              <Label>Widget Type</Label>
              <Select
                value={newWidget.widget_type}
                onValueChange={(v) => setNewWidget({ ...newWidget, widget_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {widgetTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Width (1-6)</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={newWidget.width}
                  onChange={(e) => setNewWidget({ ...newWidget, width: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Height (1-6)</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={newWidget.height}
                  onChange={(e) => setNewWidget({ ...newWidget, height: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWidgetDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createWidgetMutation.mutate(newWidget)} disabled={createWidgetMutation.isPending}>
              {createWidgetMutation.isPending ? 'Creating...' : 'Create Widget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}