'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Zap, Target, Shield } from 'lucide-react';
import { useState } from 'react';

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
  impact_score: number;
  is_resolved: boolean;
  created_at: string;
}

export default function AIInsightsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['ai-recommendations-dashboard'],
    queryFn: async () => {
      const response = await api.get('/ai-recommendations/dashboard');
      return response.data;
    },
  });

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['ai-recommendations', categoryFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      const response = await api.get(`/ai-recommendations?${params}`);
      return response.data as Recommendation[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai-recommendations/generate-and-save');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations-dashboard'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/ai-recommendations/${id}/resolve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations-dashboard'] });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'eol_risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'underutilization': return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case 'renewal': return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default: return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'eol_risk': return 'bg-red-100 text-red-700';
      case 'underutilization': return 'bg-orange-100 text-orange-700';
      case 'renewal': return 'bg-blue-100 text-blue-700';
      default: return 'bg-purple-100 text-purple-700';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const resolvedPct = dashboard ? Math.round((dashboard.resolved / (dashboard.open + dashboard.resolved || 1)) * 100) : 0;

  if (dashLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Insights
          </h1>
          <p className="text-slate-500 mt-1">AI-powered recommendations based on your EAM data</p>
        </div>
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending}
        >
          <Zap className="mr-2 h-4 w-4" />
          {generateMutation.isPending ? 'Generating...' : 'Generate Insights'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{dashboard?.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboard?.resolved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(dashboard?.total_impact || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500">potential savings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resolution Progress</span>
            <span className="text-sm font-normal text-slate-500">{resolvedPct}% resolved</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={resolvedPct} className="h-3" />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="eol_risk">EOL Risk</SelectItem>
            <SelectItem value="underutilization">Underutilization</SelectItem>
            <SelectItem value="renewal">Renewals</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">Loading recommendations...</div>
        ) : !recommendations?.length ? (
          <Card className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium">No insights yet</h3>
            <p className="text-slate-500 mb-4">Click "Generate Insights" to analyze your data</p>
          </Card>
        ) : (
          recommendations.map((rec) => (
            <Card key={rec.id} className={rec.is_resolved ? 'opacity-60' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getCategoryColor(rec.category)}`}>
                      {getCategoryIcon(rec.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge variant={getPriorityVariant(rec.priority)}>{rec.priority}</Badge>
                        {rec.is_resolved && (
                          <Badge variant="outline" className="bg-green-50">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm">{rec.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Confidence: {(rec.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Impact: ${rec.impact_score.toLocaleString()}
                        </span>
                        <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {!rec.is_resolved && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => resolveMutation.mutate(rec.id)}
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}