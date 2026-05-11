'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'changes_requested':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Changes Requested</Badge>;
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
        <h1 className="text-3xl font-bold tracking-tight">SaaS Requests</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormData({ tool_name: '', vendor: '', use_case: '', estimated_cost: '', justification: '' }); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request New SaaS Application</DialogTitle>
              <DialogDescription>Submit a request for approval to add a new SaaS tool</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Tool Name *</Label>
                  <Input value={formData.tool_name} onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })} placeholder="e.g., Slack" required />
                </div>
                <div className="space-y-2">
                  <Label>Vendor *</Label>
                  <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="e.g., Salesforce" required />
                </div>
                <div className="space-y-2">
                  <Label>Use Case</Label>
                  <Select value={formData.use_case} onValueChange={(v) => setFormData({ ...formData, use_case: v })}>
                    <SelectTrigger><SelectValue placeholder="Select use case" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Productivity">Productivity</SelectItem>
                      <SelectItem value="CRM">CRM</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Annual Cost ($)</Label>
                  <Input type="number" value={formData.estimated_cost} onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })} placeholder="5000" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Justification *</Label>
                  <Textarea value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} placeholder="Explain why this tool is needed and how it will be used..." required rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>All SaaS Requests</CardTitle>
                <div className="relative ml-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search requests..."
                    className="pl-8 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : !requests?.data?.length ? (
                <div className="text-center py-8 text-slate-500">No requests found</div>
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
                          {req.estimated_cost && <span>${Number(req.estimated_cost).toLocaleString()}/yr</span>}
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
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Requests awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {!pendingApprovals?.data?.length ? (
                <div className="text-center py-8 text-slate-500">No pending approvals</div>
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
                          <p className="font-medium">${Number(req.estimated_cost || 0).toLocaleString()}/yr</p>
                          <p className="text-xs text-slate-500">Requested by {req.requester?.first_name} {req.requester?.last_name}</p>
                        </div>
                      </div>
                      {req.justification && (
                        <div className="p-3 bg-slate-50 rounded text-sm mb-3">
                          <p className="font-medium text-xs text-slate-500 mb-1">Justification:</p>
                          {req.justification}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setSelectedRequest({ ...req, action: 'approve' })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest({ ...req, action: 'changes' })}>
                          <AlertCircle className="w-4 h-4 mr-1" /> Request Changes
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setSelectedRequest({ ...req, action: 'reject' })}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
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
              <CardTitle>My Requests</CardTitle>
              <CardDescription>Requests you have submitted</CardDescription>
            </CardHeader>
            <CardContent>
              {!requests?.data?.length ? (
                <div className="text-center py-8 text-slate-500">No requests found</div>
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
                            {req.estimated_cost && <span>${Number(req.estimated_cost).toLocaleString()}/yr</span>}
                          </div>
                          {req.approver_comments && (
                            <p className="text-xs text-orange-600 mt-2">Note: {req.approver_comments}</p>
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
              {selectedRequest?.action === 'approve' && 'Approve Request'}
              {selectedRequest?.action === 'reject' && 'Reject Request'}
              {selectedRequest?.action === 'changes' && 'Request Changes'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{selectedRequest?.action === 'approve' ? 'Comment (optional)' : 'Comment (required)'}</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={selectedRequest?.action === 'approve' ? 'Add a comment...' : 'Provide a reason...'}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            {selectedRequest?.action === 'approve' && (
              <Button onClick={() => approveMutation.mutate({ id: selectedRequest.id, comment })}>Approve</Button>
            )}
            {selectedRequest?.action === 'reject' && (
              <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: selectedRequest.id, comment })} disabled={!comment}>Reject</Button>
            )}
            {selectedRequest?.action === 'changes' && (
              <Button variant="outline" onClick={() => requestChangesMutation.mutate({ id: selectedRequest.id, comment })} disabled={!comment}>Request Changes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}