import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, DollarSign, User, CheckCircle2, Circle, Plus,
  Trash2, Edit3, Clock, AlertCircle, ChevronDown, X, Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  planning: { label: 'בתכנון', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-800' },
  on_hold: { label: 'בהמתנה', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'הושלם', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-800' }
};

const PRIORITY_CONFIG = {
  low: { label: 'נמוכה', color: 'text-gray-500' },
  medium: { label: 'בינונית', color: 'text-yellow-600' },
  high: { label: 'גבוהה', color: 'text-orange-600' },
  urgent: { label: 'דחוף', color: 'text-red-600' }
};

export default function ProjectDetailPanel({ project, clients, workspaceId, onDelete }) {
  const [newTask, setNewTask] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const queryClient = useQueryClient();

  const clientName = clients.find(c => c.id === project.client_id)?.name || '—';

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', project.id],
    queryFn: () => base44.entities.Task.filter({ workspace_id: workspaceId, related_professional: project.id }),
    enabled: !!project.id
  });

  const projectTasks = useQuery({
    queryKey: ['project-tasks', project.id],
    queryFn: () => base44.entities.Task.filter({ workspace_id: workspaceId }),
    enabled: !!workspaceId,
    select: (data) => data.filter(t => t.tags?.includes(`project:${project.id}`))
  });

  const allTasks = projectTasks.data || [];
  const completedCount = allTasks.filter(t => t.status === 'completed').length;
  const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : (project.progress || 0);

  const addTaskMutation = useMutation({
    mutationFn: (title) => base44.entities.Task.create({
      workspace_id: workspaceId,
      title,
      status: 'open',
      priority: 'medium',
      tags: [`project:${project.id}`]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] });
      setNewTask('');
      setAddingTask(false);
    }
  });

  const toggleTask = useMutation({
    mutationFn: (task) => base44.entities.Task.update(task.id, {
      status: task.status === 'completed' ? 'open' : 'completed'
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] })
  });

  const deleteTask = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-tasks', project.id] })
  });

  const updateProject = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingField(null);
      toast.success('עודכן בהצלחה');
    }
  });

  const deleteProject = async () => {
    if (!confirm(`למחוק את "${project.name}"?`)) return;
    await base44.entities.Project.delete(project.id);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    toast.success('פרויקט נמחק');
    onDelete?.();
  };

  const startEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const saveEdit = (field) => {
    const data = { [field]: editValue };
    if (field === 'budget') data.budget = parseFloat(editValue) || 0;
    updateProject.mutate(data);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {editingField === 'name' ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-xl font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={() => saveEdit('name')}><Save className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
                <button
                  onClick={() => startEdit('name', project.name)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
                >
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={project.status}
              onChange={(e) => updateProject.mutate({ status: e.target.value })}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer",
                STATUS_CONFIG[project.status]?.color
              )}
            >
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={deleteProject}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-gray-400" />
            <span>{clientName}</span>
          </div>
          {project.end_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{format(new Date(project.end_date), 'dd MMM yyyy', { locale: he })}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span>₪{project.budget.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <span className={PRIORITY_CONFIG[project.priority]?.color}>
              {PRIORITY_CONFIG[project.priority]?.label}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>התקדמות</span>
            <span>{completedCount}/{allTasks.length} משימות ({progress}%)</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Description */}
        {editingField === 'description' ? (
          <div className="mt-4 flex gap-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              className="text-sm"
              rows={3}
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={() => saveEdit('description')}><Save className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        ) : project.description ? (
          <p
            className="mt-3 text-sm text-gray-600 cursor-pointer hover:text-gray-900"
            onClick={() => startEdit('description', project.description)}
          >
            {project.description}
          </p>
        ) : (
          <button
            className="mt-3 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
            onClick={() => startEdit('description', '')}
          >
            <Plus className="w-3 h-3" /> הוסף תיאור
          </button>
        )}
      </div>

      {/* Tasks */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">משימות</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddingTask(true)}
            className="gap-1 text-xs"
          >
            <Plus className="w-3 h-3" /> הוסף משימה
          </Button>
        </div>

        {addingTask && (
          <div className="flex gap-2 mb-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="שם המשימה..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTask.trim()) addTaskMutation.mutate(newTask.trim());
                if (e.key === 'Escape') setAddingTask(false);
              }}
            />
            <Button
              size="sm"
              onClick={() => newTask.trim() && addTaskMutation.mutate(newTask.trim())}
              disabled={addTaskMutation.isPending}
            >
              {addTaskMutation.isPending ? '...' : 'הוסף'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingTask(false); setNewTask(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          {allTasks.length === 0 && !addingTask && (
            <p className="text-sm text-gray-400 text-center py-6">
              אין משימות עדיין. לחץ "הוסף משימה" להתחיל.
            </p>
          )}
          {allTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 group"
            >
              <button onClick={() => toggleTask.mutate(task)}>
                {task.status === 'completed'
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                }
              </button>
              <span className={cn(
                "flex-1 text-sm",
                task.status === 'completed' ? "line-through text-gray-400" : "text-gray-700"
              )}>
                {task.title}
              </span>
              {task.due_date && (
                <span className="text-xs text-gray-400">
                  {format(new Date(task.due_date), 'dd/MM')}
                </span>
              )}
              <button
                onClick={() => deleteTask.mutate(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}