'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Database, Search } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CapabilityMapping({ application }: { application: any }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCapId, setSelectedCapId] = useState<string>('');
  const [supportLevel, setSupportLevel] = useState<string>('Supporting');

  const { data: allCapabilities } = useQuery({
    queryKey: ['capabilities-flat'],
    queryFn: async () => {
      const response = await api.get('/capabilities');
      return response.data;
    },
  });

  const mapMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/capabilities/${selectedCapId}/map`, {
        application_id: application.id,
        support_level: supportLevel,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', application.id] });
      setIsAdding(false);
      setSelectedCapId('');
    },
  });

  const unmapMutation = useMutation({
    mutationFn: async (capId: string) => {
      await api.delete(`/capabilities/${capId}/map/${application.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', application.id] });
    },
  });

  const filteredCapabilities = allCapabilities?.filter((cap: any) => 
    cap.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !application.capabilities?.some((mapping: any) => mapping.capability_id === cap.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mapped Capabilities</h3>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Map Capability
        </Button>
      </div>

      <div className="grid gap-3">
        {application.capabilities?.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg text-slate-500">
            No capabilities mapped to this application yet.
          </div>
        ) : (
          application.capabilities?.map((mapping: any) => (
            <Card key={mapping.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <Database size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{mapping.capability?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        Level {mapping.capability?.level}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {mapping.support_level}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => unmapMutation.mutate(mapping.capability_id)}
                >
                  <Trash2 size={16} className="text-slate-400 hover:text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Map Capability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Capability</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Type to search..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-48 overflow-auto border rounded-md p-1 space-y-1">
              {filteredCapabilities?.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No results found</div>
              ) : (
                filteredCapabilities?.map((cap: any) => (
                  <button
                    key={cap.id}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-sm text-sm transition-colors hover:bg-slate-100",
                      selectedCapId === cap.id && "bg-blue-50 text-blue-700 font-medium"
                    )}
                    onClick={() => setSelectedCapId(cap.id)}
                  >
                    {cap.name} <span className="text-slate-400 text-xs ml-2">Level {cap.level}</span>
                  </button>
                ))
              )}
            </div>

            <div className="space-y-2">
              <Label>Support Level</Label>
              <Select value={supportLevel} onValueChange={setSupportLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Supporting">Supporting</SelectItem>
                  <SelectItem value="Enabling">Enabling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={() => mapMutation.mutate()} disabled={!selectedCapId || mapMutation.isPending}>
              {mapMutation.isPending ? 'Mapping...' : 'Add Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
