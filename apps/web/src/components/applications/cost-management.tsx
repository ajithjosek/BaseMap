'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { currencyFormatter, formatDate } from '@basemap/utils';

const costSchema = z.object({
  cost_type: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
  currency: z.string().default('USD'),
  billing_cycle: z.string().default('Annual'),
  effective_date: z.string().min(1, 'Required'),
});

type CostFormValues = z.infer<typeof costSchema>;

export function CostManagement({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data: costs, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['costs', applicationId],
    queryFn: async () => {
      const response = await api.get(`/costs/application/${applicationId}`);
      return response.data;
    },
  });

  const { data: tco, isLoading: isLoadingTCO } = useQuery({
    queryKey: ['tco', applicationId],
    queryFn: async () => {
      const response = await api.get(`/costs/application/${applicationId}/tco`);
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CostFormValues>({
    resolver: zodResolver(costSchema) as any,
    defaultValues: {
      currency: 'USD',
      billing_cycle: 'Annual',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CostFormValues) => {
      const response = await api.post('/costs', {
        ...values,
        application_id: applicationId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['tco', applicationId] });
      setIsAdding(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/costs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['tco', applicationId] });
    },
  });

  const onSubmit = (values: CostFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 uppercase">Total Annual Cost (TCO)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {isLoadingTCO ? '...' : currencyFormatter.format(tco?.total_annual_cost || 0)}
            </div>
            <p className="text-xs text-blue-500 mt-1">Aggregated from {tco?.cost_count || 0} cost items</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cost Items</h3>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'outline' : 'default'}>
          {isAdding ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Add Cost Item</>}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Cost Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_type">Cost Type</Label>
                <Select onValueChange={(v) => setValue('cost_type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Subscription">Subscription</SelectItem>
                    <SelectItem value="License">License</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input id="amount" {...register('amount')} className="pl-9" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select onValueChange={(v) => setValue('billing_cycle', v)} defaultValue="Annual">
                  <SelectTrigger>
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="One-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input id="effective_date" type="date" {...register('effective_date')} />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Cost Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingCosts ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : costs?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No cost items found.</TableCell></TableRow>
            ) : (
              costs?.map((cost: any) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">{cost.cost_type}</TableCell>
                  <TableCell>{currencyFormatter.format(Number(cost.amount))}</TableCell>
                  <TableCell>{cost.billing_cycle}</TableCell>
                  <TableCell>{formatDate(cost.effective_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (confirm('Delete this cost item?')) deleteMutation.mutate(cost.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
