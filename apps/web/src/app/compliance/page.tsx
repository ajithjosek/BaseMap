'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, FileCheck, Lock } from 'lucide-react';

export default function CompliancePage() {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['compliance-dashboard'],
    queryFn: async () => {
      const response = await api.get('/compliance/dashboard');
      return response.data;
    },
  });

  const { data: frameworks } = useQuery({
    queryKey: ['compliance-frameworks'],
    queryFn: async () => {
      const response = await api.get('/compliance/frameworks');
      return response.data;
    },
  });

  const { data: securityScore } = useQuery({
    queryKey: ['security-score'],
    queryFn: async () => {
      const response = await api.get('/compliance/security/score');
      return response.data;
    },
  });

  const { data: assessments } = useQuery({
    queryKey: ['security-assessments'],
    queryFn: async () => {
      const response = await api.get('/compliance/security');
      return response.data;
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'non_compliant': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-500" />
            Compliance & Security
          </h1>
          <p className="text-slate-500 mt-1">Track compliance frameworks and security posture</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(dashboard?.compliance_percentage || 0)}`}>
              {dashboard?.compliance_percentage || 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Frameworks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.total_frameworks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboard?.compliant || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Non-Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{dashboard?.non_compliant || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Lock className="h-4 w-4 text-purple-500" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(securityScore?.average_score || 0)}`}>
              {securityScore?.average_score || 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assessed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{securityScore?.assessed_entities || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.high_risk || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.medium_risk || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="frameworks">
        <TabsList>
          <TabsTrigger value="frameworks">Compliance Frameworks</TabsTrigger>
          <TabsTrigger value="security">Security Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks">
          <Card>
            <CardHeader>
              <CardTitle>Frameworks</CardTitle>
            </CardHeader>
            <CardContent>
              {!frameworks?.length ? (
                <div className="text-center py-8 text-slate-500">No frameworks configured</div>
              ) : (
                <div className="space-y-4">
                  {frameworks.map((fw: any) => (
                    <div key={fw.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{fw.name}</h3>
                          <Badge variant="outline">{fw.framework_type}</Badge>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(fw.compliance_pct)}`}>
                            {fw.compliance_pct}%
                          </div>
                        </div>
                      </div>
                      <Progress value={fw.compliance_pct} className="h-2" />
                      <div className="mt-3 flex gap-2">
                        <Badge variant="outline">{fw.controls?.length || 0} controls</Badge>
                        {fw.last_audit && (
                          <span className="text-xs text-slate-500">
                            Last audit: {new Date(fw.last_audit).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {!assessments?.length ? (
                <div className="text-center py-8 text-slate-500">No security assessments</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Entity</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Score</th>
                        <th className="text-left py-2">Findings</th>
                        <th className="text-left py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((a: any) => (
                        <tr key={a.id} className="border-b hover:bg-slate-50">
                          <td className="py-3">{a.entity_type}</td>
                          <td className="py-3">
                            <Badge variant="outline">{a.assessment_type}</Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Progress value={(a.score / a.max_score) * 100} className="w-16 h-2" />
                              <span className={`font-medium ${getScoreColor((a.score / a.max_score) * 100)}`}>
                                {a.score}/{a.max_score}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge variant={a.vulnerabilities?.length > 0 ? 'destructive' : 'secondary'}>
                              {a.vulnerabilities?.length || 0} issues
                            </Badge>
                          </td>
                          <td className="py-3 text-sm text-slate-500">
                            {new Date(a.assessed_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}