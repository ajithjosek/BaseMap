'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const transitionSchema = z.object({
  target_state: z.string(),
  reason: z.string().min(5, 'Please provide a reason (min 5 characters)'),
});

type TransitionFormValues = z.infer<typeof transitionSchema>;

interface LifecycleTransitionDialogProps {
  application: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LifecycleTransitionDialog({
  application,
  open,
  onOpenChange,
}: LifecycleTransitionDialogProps) {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: TransitionFormValues) => {
      const response = await api.post(`/applications/${application.id}/transition`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', application.id] });
      onOpenChange(false);
      reset();
    },
  });

  const onSubmit = (values: TransitionFormValues) => {
    mutation.mutate(values);
  };

  const getAvailableTransitions = (currentState: string) => {
    const transitions: Record<string, string[]> = {
      'Planning': ['Active', 'Retirement'],
      'Active': ['Maintenance', 'Retirement'],
      'Maintenance': ['Active', 'Retirement'],
      'Retirement': ['Retired', 'Active'],
      'Retired': [],
    };
    return transitions[currentState] || [];
  };

  const availableStates = getAvailableTransitions(application.lifecycle_state);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transition Lifecycle State</DialogTitle>
          <DialogDescription>
            Change the lifecycle state of <strong>{application.name}</strong> from {application.lifecycle_state}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target_state">New State</Label>
            <Select onValueChange={(v) => setValue('target_state', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target state" />
              </SelectTrigger>
              <SelectContent>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.target_state && (
              <p className="text-sm text-red-500">{errors.target_state.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="Explain why this transition is occurring..."
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || availableStates.length === 0}>
              {mutation.isPending ? 'Transitioning...' : 'Confirm Transition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
