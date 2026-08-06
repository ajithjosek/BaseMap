'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Clock, CheckCircle, XCircle, AlertCircle, User, Building2 } from 'lucide-react';

export default function SaaSRequestsPage() {
  const t = useTranslations('saasRequests');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    tool_name: '',
    vendor: '',
    use_case: '',
    estimated_cost: '',
    justification: '',
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['saas-requests', search],
    queryFn: async () => {
      const response = await api.get('/saas-requests', { params: { search } });
      return response.data;
    },
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['saas-pending-approvals'],
    queryFn: async () => {
      const response = await api.get('/saas-requests/pending-approvals');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/saas-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-requests'] });
      setIsDialogOpen(false);
      setFormData({ tool_name: '', vendor: '', use_case: '', estimated_cost: '', justification: '' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      return api.put(`/saas-requests/${id}/approve`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-requests'] });
      queryClient.invalidateQueries({ queryKey: ['saas-pending-approvals'] });
      setSelectedRequest(null);
      setComment('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      return api.put(`/saas-requests/${id}/reject`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-requests'] });
      queryClient.invalidateQueries({ queryKey: ['saas-pending-approvals'] });
      setSelectedRequest(null);
      setComment('');
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      return api.put(`/saas-requests/${id}/request-changes`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-requests'] });
      queryClient.invalidateQueries({ queryKey: ['saas-pending-approvals'] });
      setSelectedRequest(null);
      setComment('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> {t('status_pending')}</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> {t('status_approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {t('status_rejected')}</Badge>;
      case 'changes_requested':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> {t('status_changes_requested')}</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const getStepStatus = (step: any) => {
    switch (step.status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-slate-300" />;
      case 'changes_requested':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormData({ tool_name: '', vendor: '', use_case: '', estimated_cost: '', justification: '' }); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t('new_request')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('request_title')}</DialogTitle>
              <DialogDescription>{t('request_desc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t('tool_name_required')}</Label>
                  <Input value={formData.tool_name} onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })} placeholder={t('tool_name_ph')} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('vendor_required')}</Label>
                  <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder={t('vendor_ph')} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('use_case')}</Label>
                  <Select value={formData.use_case} onValueChange={(v) => setFormData({ ...formData, use_case: v })}>
                    <SelectTrigger><SelectValue placeholder={t('use_case_placeholder')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Communication">{t('use_case_communication')}</SelectItem>
                      <SelectItem value="Productivity">{t('use_case_productivity')}</SelectItem>
                      <SelectItem value="CRM">{t('use_case_crm')}</SelectItem>
                      <SelectItem value="HR">{t('use_case_hr')}</SelectItem>
                      <SelectItem value="Finance">{t('use_case_finance')}</SelectItem>
                      <SelectItem value="Development">{t('use_case_development')}</SelectItem>
                      <SelectItem value="Security">{t('use_case_security')}</SelectItem>
                      <SelectItem value="Analytics">{t('use_case_analytics')}</SelectItem>
                      <SelectItem value="Other">{t('use_case_other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('estimated_annual_cost')}</Label>
                  <Input type="number" value={formData.estimated_cost} onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })} placeholder={t('estimated_cost_ph')} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>{t('justification_required')}</Label>
                  <Textarea value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} placeholder={t('justification_ph')} required rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{tc('cancel')}</Button>
                <Button type="submit">{t('submit_request')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('tab_all')}</TabsTrigger>
          <TabsTrigger value="pending">{t('tab_pending')}</TabsTrigger>
          <TabsTrigger value="my-requests">{t('tab_my_requests')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>{t('all_requests_title')}</CardTitle>
                <div className="relative ml-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder={t('search_placeholder')}
                    className="pl-8 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">{tc('loading')}</div>
              ) : !requests?.data?.length ? (
                <div className="text-center py-8 text-slate-500">{t('no_requests')}</div>
              ) : (
                <div className="space-y-4">
                  {requests.data.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{req.tool_name}</h3>
                          {getStatusBadge(req.current_state)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{req.vendor}</span>
                          {req.use_case && <span>{req.use_case}</span>}
                          {req.estimated_cost && <span>${Number(req.estimated_cost).toLocaleString()}{t('per_year')}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {req.steps?.map((step: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1">
                              {getStepStatus(step)}
                              <span className="text-xs text-slate-500">{step.step_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {req.requester?.first_name} {req.requester?.last_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>{t('pending_approvals_title')}</CardTitle>
              <CardDescription>{t('pending_approvals_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!pendingApprovals?.data?.length ? (
                <div className="text-center py-8 text-slate-500">{t('no_pending_approvals')}</div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.data.map((req: any) => (
                    <div key={req.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{req.tool_name}</h3>
                          <p className="text-sm text-slate-500">{req.vendor} • {req.use_case}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${Number(req.estimated_cost || 0).toLocaleString()}{t('per_year')}</p>
                          <p className="text-xs text-slate-500">{t('requested_by', { name: `${req.requester?.first_name} ${req.requester?.last_name}` })}</p>
                        </div>
                      </div>
                      {req.justification && (
                        <div className="p-3 bg-slate-50 rounded text-sm mb-3">
                          <p className="font-medium text-xs text-slate-500 mb-1">{t('justification_label')}</p>
                          {req.justification}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setSelectedRequest({ ...req, action: 'approve' })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> {t('approve')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest({ ...req, action: 'changes' })}>
                          <AlertCircle className="w-4 h-4 mr-1" /> {t('request_changes')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setSelectedRequest({ ...req, action: 'reject' })}>
                          <XCircle className="w-4 h-4 mr-1" /> {t('reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <Card>
            <CardHeader>
              <CardTitle>{t('my_requests_title')}</CardTitle>
              <CardDescription>{t('my_requests_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!requests?.data?.length ? (
                <div className="text-center py-8 text-slate-500">{t('no_requests')}</div>
              ) : (
                <div className="space-y-4">
                  {requests.data
                    .filter((req: any) => req.requester_id === req.requester?.id)
                    .map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{req.tool_name}</h3>
                            {getStatusBadge(req.current_state)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>{req.vendor}</span>
                            {req.estimated_cost && <span>${Number(req.estimated_cost).toLocaleString()}{t('per_year')}</span>}
                          </div>
                          {req.approver_comments && (
                            <p className="text-xs text-orange-600 mt-2">{t('note_label', { comment: req.approver_comments })}</p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); setComment(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.action === 'approve' && t('approve_request')}
              {selectedRequest?.action === 'reject' && t('reject_request')}
              {selectedRequest?.action === 'changes' && t('request_changes_title')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{selectedRequest?.action === 'approve' ? t('comment_optional') : t('comment_required')}</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={selectedRequest?.action === 'approve' ? t('comment_add_ph') : t('comment_reason_ph')}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>{tc('cancel')}</Button>
            {selectedRequest?.action === 'approve' && (
              <Button onClick={() => approveMutation.mutate({ id: selectedRequest.id, comment })}>{t('approve')}</Button>
            )}
            {selectedRequest?.action === 'reject' && (
              <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: selectedRequest.id, comment })} disabled={!comment}>{t('reject')}</Button>
            )}
            {selectedRequest?.action === 'changes' && (
              <Button variant="outline" onClick={() => requestChangesMutation.mutate({ id: selectedRequest.id, comment })} disabled={!comment}>{t('request_changes')}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}