import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Circle, Home, Plus } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';

export default function TasksWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTask, setNewTask] = useState('');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-widget', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const allTasks = await opsbrain.entities.Task.filter({ workspace_id: activeWorkspace.id }, '-created_date', 5);
      return allTasks.filter(t => t.status !== 'completed');
    },
    enabled: !!activeWorkspace
  });

  const createTaskMutation = useMutation({
    mutationFn: async (title) => {
      return await opsbrain.entities.Task.create({
        workspace_id: activeWorkspace.id,
        title,
        status: 'pending',
        priority: 'medium'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-widget']);
      toast.success(language === 'he' ? 'משימה נוצרה!' : 'Task created!');
      setShowAddDialog(false);
      setNewTask('');
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      return await opsbrain.entities.Task.update(taskId, {
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks-widget']);
      toast.success(language === 'he' ? 'משימה הושלמה!' : 'Task completed!');
    }
  });

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="truncate">{activeWorkspace?.name || 'Tasks'}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{tasks.length}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-white/20"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-start gap-3 text-sm group hover:bg-white/5 p-2 rounded-lg transition-all">
              <button
                onClick={() => completeTaskMutation.mutate(task.id)}
                className="mt-0.5 hover:text-green-400 transition-colors"
              >
                <Circle className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
              </button>
              <p className="flex-1 truncate">{task.title}</p>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {language === 'he' ? 'אין משימות פתוחות' : 'No open tasks'}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{language === 'he' ? 'משימה חדשה' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={language === 'he' ? 'מה צריך לעשות?' : 'What needs to be done?'}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTask.trim()) {
                  createTaskMutation.mutate(newTask);
                }
              }}
              className="bg-gray-800 border-gray-700"
            />
            <Button
              onClick={() => createTaskMutation.mutate(newTask)}
              disabled={!newTask.trim() || createTaskMutation.isPending}
              className="w-full"
            >
              {createTaskMutation.isPending 
                ? (language === 'he' ? 'יוצר...' : 'Creating...') 
                : (language === 'he' ? 'צור משימה' : 'Create Task')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}