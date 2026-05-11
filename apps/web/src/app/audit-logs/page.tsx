'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Eye, Pencil, Trash2, LogIn, LogOut, Clock, User } from 'lucide-react';

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  action: string;
  changes: any;
  user_email?: string;
  ip_address?: string;
  action_timestamp: string;
  user?: { first_name?: string; last_name?: string; email?: string };
}

export default function AuditLogsPage() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', entityFilter, actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '25');
      if (entityFilter !== 'all') params.append('entity_type', entityFilter);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      const response = await api.get(`/audit-logs?${params}`);
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: async () => {
      const response = await api.get('/audit-logs/stats?days=30');
      return response.data;
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <LogIn className="h-4 w-4 text-green-500" />;
      case 'update': return <Pencil className="h-4 w-4 text-blue-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'view': return <Eye className="h-4 w-4 text-slate-500" />;
      case 'login': return <User className="h-4 w-4 text-purple-500" />;
      case 'logout': return <LogOut className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login': return 'outline';
      case 'logout': return 'outline';
      default: return 'outline';
    }
  };

  const entityTypes = ['application', 'saas_application', 'technology_component', 'interface', 'user', 'transformation_project', 'ai_recommendation'];
  const actions = ['create', 'update', 'delete', 'view', 'login', 'logout'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-8 w-8 text-slate-600" />
            Audit Logs
          </h1>
          <p className="text-slate-500 mt-1">Track all system activities and changes</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <Filter className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Creates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.by_action?.create || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.by_action?.update || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deletes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.by_action?.delete || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Entity</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">IP Address</th>
                  <th className="text-left py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                ) : !data?.logs?.length ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">No audit logs found</td></tr>
                ) : (
                  data.logs.map((log: AuditLog) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{log.entity_type?.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-sm font-medium">{log.entity_name || log.entity_id?.slice(0, 8) || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        {log.user ? `${log.user.first_name || ''} ${log.user.last_name || ''}`.trim() || log.user.email : log.user_email || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{log.ip_address || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(log.action_timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data?.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm">Page {page} of {data.total_pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page >= data.total_pages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}