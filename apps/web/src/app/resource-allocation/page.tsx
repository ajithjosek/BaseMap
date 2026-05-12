'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Users, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Allocation {
  id: string;
  user: { id: string; first_name: string; last_name: string; email: string; department: string };
  resource_type: string;
  allocation_pct: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function ResourceAllocationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    user_id: '',
    resource_type: 'engineering',
    allocation_pct: 50,
    start_date: '',
    end_date: '',
  });
  const queryClient = useQueryClient();

  const { data: allocations, isLoading } = useQuery({
    queryKey: ['resource-allocation'],
    queryFn: async () => {
      const response = await api.get('/resource-allocation');
      return response.data as Allocation[];
    },
  });

  const { data: capacity } = useQuery({
    queryKey: ['resource-capacity'],
    queryFn: async () => {
      const response = await api.get('/resource-allocation/capacity');
      return response.data;
    },
  });

  const { data: utilization } = useQuery({
    queryKey: ['resource-utilization'],
    queryFn: async () => {
      const response = await api.get('/resource-allocation/utilization');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newAllocation) => {
      const response = await api.post('/resource-allocation', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['resource-capacity'] });
      setIsDialogOpen(false);
      setNewAllocation({ user_id: '', resource_type: 'engineering', allocation_pct: 50, start_date: '', end_date: '' });
    },
  });

  const getUtilizationColor = (pct: number) => {
    if (pct > 100) return 'text-red-600';
    if (pct === 100) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-500" />
            Resource Allocation
          </h1>
          <p className="text-slate-500 mt-1">Track team capacity and resource utilization</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Allocation
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity?.total_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Over Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{capacity?.over_capacity || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              At Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{capacity?.at_capacity || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              Under Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{capacity?.under_capacity || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilization by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {utilization?.map((dept: any) => (
              <div key={dept.department} className="flex items-center gap-4">
                <div className="w-32 font-medium">{dept.department}</div>
                <div className="flex-1">
                  <Progress value={dept.average_utilization} className="h-2" />
                </div>
                <div className={`w-16 text-right font-medium ${getUtilizationColor(dept.average_utilization)}`}>
                  {dept.average_utilization}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !allocations?.length ? (
            <div className="text-center py-8 text-slate-500">No allocations yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Resource</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Allocation</th>
                    <th className="text-left py-2">Period</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc: Allocation) => (
                    <tr key={alloc.id} className="border-b hover:bg-slate-50">
                      <td className="py-3">
                        <div className="font-medium">{alloc.user?.first_name} {alloc.user?.last_name}</div>
                        <div className="text-sm text-slate-500">{alloc.user?.department}</div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{alloc.resource_type}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={alloc.allocation_pct} className="w-20 h-2" />
                          <span className="text-sm">{alloc.allocation_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(alloc.start_date).toLocaleDateString()} - {new Date(alloc.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge variant={alloc.is_active ? 'default' : 'secondary'}>
                          {alloc.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource Allocation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>User ID</Label>
              <Input
                value={newAllocation.user_id}
                onChange={(e) => setNewAllocation({ ...newAllocation, user_id: e.target.value })}
                placeholder="Enter user ID"
              />
            </div>
            <div className="grid gap-2">
              <Label>Resource Type</Label>
              <Select
                value={newAllocation.resource_type}
                onValueChange={(v) => setNewAllocation({ ...newAllocation, resource_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Allocation %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newAllocation.allocation_pct}
                onChange={(e) => setNewAllocation({ ...newAllocation, allocation_pct: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newAllocation.start_date}
                  onChange={(e) => setNewAllocation({ ...newAllocation, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newAllocation.end_date}
                  onChange={(e) => setNewAllocation({ ...newAllocation, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(newAllocation)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}