'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { CapabilityTree } from '@/components/capabilities/capability-tree';
import { CapabilityDetailPanel } from '@/components/capabilities/capability-detail-panel';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function CapabilitiesPage() {
  const t = useTranslations('capabilities');
  const [selectedCapability, setSelectedCapability] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: tree, isLoading } = useQuery({
    queryKey: ['capabilities-tree'],
    queryFn: async () => {
      const response = await api.get('/capabilities/tree');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return api.patch(`/capabilities/${id}`, data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['capabilities-tree'] });
      setSelectedCapability(res.data);
      toast.success(t('updated_success'));
    },
    onError: (error: any) => {
      toast.error(t('update_error'), { 
        description: error.response?.data?.message || t('unknown_error'),
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/capabilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities-tree'] });
      setSelectedCapability(null);
      setIsDeleting(false);
      toast.success(t('deleted_success'));
    },
    onError: (error: any) => {
      toast.error(t('delete_error'), { 
        description: error.response?.data?.message || t('unknown_error'),
      });
      setIsDeleting(false);
    }
  });

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      return api.post('/capabilities/import', { csv });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['capabilities-tree'] });
      setIsImportOpen(false);
      toast.success(t('import_success', { count: res.data.imported }));
    },
    onError: (error: any) => {
      toast.error(t('import_error'), { 
        description: error.response?.data?.message || t('unknown_error'),
      });
    }
  });

  const handleSave = async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleMoveNode = async (nodeId: string, newParentId: string | null) => {
    await updateMutation.mutateAsync({ id: nodeId, data: { parent_id: newParentId } });
  };

  const handleImport = async () => {
    if (!csvContent) return;
    await importMutation.mutateAsync(csvContent);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> {t('import_csv')}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> {t('export')}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t('add_capability')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="col-span-2 overflow-y-auto">
          <Card className="h-full border-0 shadow-sm">
            <CardHeader className="bg-slate-50 sticky top-0 z-10 border-b">
              <CardTitle>{t('map_title')}</CardTitle>
              <CardDescription>
                {t('map_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-8 text-center text-slate-500">{t('loading_map')}</div>
              ) : tree?.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="text-lg font-medium text-slate-900">{t('no_capabilities')}</h3>
                  <Button className="mt-4" onClick={() => setIsImportOpen(true)}>
                    {t('import_sample')}
                  </Button>
                </div>
              ) : (
                <div className="p-4">
                  <CapabilityTree 
                    data={tree || []} 
                    onSelect={setSelectedCapability} 
                    selectedId={selectedCapability?.id}
                    onMoveNode={handleMoveNode}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 h-full overflow-hidden">
          <CapabilityDetailPanel 
            capability={selectedCapability} 
            onSave={handleSave}
            onDelete={async (id) => setIsDeleting(true)}
          />
        </div>
      </div>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('import_dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('import_dialog_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              rows={8} 
              placeholder="Level 1,Level 2,Level 3,Level 4,Description&#10;Marketing,Digital Marketing,SEO,,Search Engine Optimization&#10;Marketing,Digital Marketing,SEM,,Search Engine Marketing" 
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleImport} disabled={importMutation.isPending || !csvContent}>
              {importMutation.isPending ? t('importing') : t('import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2" />
              {t('confirm_delete_title')}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t('confirm_delete_desc', { name: selectedCapability?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleting(false)}>{t('cancel')}</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate(selectedCapability?.id)} 
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting') : t('yes_delete_all')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
