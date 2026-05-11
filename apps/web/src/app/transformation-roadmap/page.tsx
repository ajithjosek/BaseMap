'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transformation Roadmap</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">{stats?.by_status?.planning || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.by_status?.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.by_status?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
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
            Project Timeline (Gantt View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!projects?.length ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transformation projects yet. Click "Add Project" to get started.</p>
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
                        {project.owner && `Owner: ${project.owner}`}
                      </span>
                      <span className="font-medium">{project.progress}% complete</span>
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
            <DialogTitle>New Transformation Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project Name</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Cloud Migration Phase 1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={newProject.status}
                  onValueChange={(v) => setNewProject({ ...newProject, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={newProject.priority}
                  onValueChange={(v) => setNewProject({ ...newProject, priority: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newProject.end_date}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Owner</Label>
              <Input
                value={newProject.owner}
                onChange={(e) => setNewProject({ ...newProject, owner: e.target.value })}
                placeholder="Project lead name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(newProject)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}