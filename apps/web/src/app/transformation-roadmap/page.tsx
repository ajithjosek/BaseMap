'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, ArrowRight, AlertCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  start_date: string;
  end_date: string;
  progress: number;
  budget?: number;
  owner?: string;
}

export default function TransformationRoadmap() {
  const t = useTranslations('transformation');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    category: '',
    start_date: '',
    end_date: '',
    owner: '',
  });
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['transformation-projects'],
    queryFn: async () => {
      const response = await api.get('/transformation-projects');
      return response.data as Project[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['transformation-projects-stats'],
    queryFn: async () => {
      const response = await api.get('/transformation-projects/stats');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newProject) => {
      const response = await api.post('/transformation-projects', {
        ...data,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transformation-projects'] });
      queryClient.invalidateQueries({ queryKey: ['transformation-projects-stats'] });
      setIsDialogOpen(false);
      setNewProject({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        category: '',
        start_date: '',
        end_date: '',
        owner: '',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const calculateTimeline = (start: string, end: string) => {
    const now = new Date().getTime();
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const total = endTime - startTime;
    const elapsed = now - startTime;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  if (isLoading) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('add_project')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_planning')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">{stats?.by_status?.planning || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_in_progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.by_status?.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.by_status?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('stat_avg_progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.avg_progress || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('timeline_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!projects?.length ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('no_projects')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const timelinePercent = calculateTimeline(project.start_date, project.end_date);
                return (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge variant={getPriorityColor(project.priority)}>{project.priority}</Badge>
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full ${getStatusColor(project.status)}`}
                        style={{ width: `${timelinePercent}%` }}
                      />
                      <div
                        className="absolute h-full bg-blue-400 opacity-70"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-slate-500">
                        {project.owner && t('owner', { name: project.owner })}
                      </span>
                      <span className="font-medium">{t('complete_pct', { pct: project.progress })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialog_title')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('project_name')}</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder={t('project_name_ph')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('description')}</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder={t('description_ph')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('status')}</Label>
                <Select
                  value={newProject.status}
                  onValueChange={(v) => setNewProject({ ...newProject, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">{t('status_planning')}</SelectItem>
                    <SelectItem value="in_progress">{t('status_in_progress')}</SelectItem>
                    <SelectItem value="on_hold">{t('status_on_hold')}</SelectItem>
                    <SelectItem value="completed">{t('status_completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('priority')}</Label>
                <Select
                  value={newProject.priority}
                  onValueChange={(v) => setNewProject({ ...newProject, priority: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('prio_low')}</SelectItem>
                    <SelectItem value="medium">{t('prio_medium')}</SelectItem>
                    <SelectItem value="high">{t('prio_high')}</SelectItem>
                    <SelectItem value="critical">{t('prio_critical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('start_date')}</Label>
                <Input
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('end_date')}</Label>
                <Input
                  type="date"
                  value={newProject.end_date}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('owner_label')}</Label>
              <Input
                value={newProject.owner}
                onChange={(e) => setNewProject({ ...newProject, owner: e.target.value })}
                placeholder={t('owner_ph')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={() => createMutation.mutate(newProject)} disabled={createMutation.isPending}>
              {createMutation.isPending ? t('creating') : t('create_project')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}