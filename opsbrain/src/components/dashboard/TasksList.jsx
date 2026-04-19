import React from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, MoreHorizontal, Trash2 } from 'lucide-react';
import { opsbrain } from '@/api/client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function TasksList({ tasks, workspaceId }) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  
  const statusIcons = {
    open: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    stuck: AlertTriangle
  };

  const statusColors = {
    open: 'text-gray-400',
    in_progress: 'text-blue-500',
    completed: 'text-green-500',
    stuck: 'text-red-500'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600'
  };

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => opsbrain.entities.Task.update(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', workspaceId] });
      const previousTasks = queryClient.getQueryData(['tasks', workspaceId]);
      
      queryClient.setQueryData(['tasks', workspaceId], (old) => 
        old?.map(t => t.id === taskId ? { ...t, ...data } : t) || []
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', workspaceId], context.previousTasks);
      toast.error(language === 'he' ? 'שגיאה בעדכון משימה' : 'Error updating task');
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.data.status === 'completed'
          ? (language === 'he' ? 'משימה הושלמה' : 'Task completed')
          : (language === 'he' ? 'סטטוס עודכן' : 'Status updated')
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => opsbrain.entities.Task.delete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', workspaceId] });
      const previousTasks = queryClient.getQueryData(['tasks', workspaceId]);
      
      queryClient.setQueryData(['tasks', workspaceId], (old) =>
        old?.filter(t => t.id !== taskId) || []
      );
      
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks', workspaceId], context.previousTasks);
      toast.error(language === 'he' ? 'שגיאה במחיקת משימה' : 'Error deleting task');
    },
    onSuccess: () => {
      toast.success(language === 'he' ? 'משימה נמחקה' : 'Task deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    }
  });

  const handleStatusChange = (task, newStatus) => {
    updateTaskMutation.mutate({ taskId: task.id, data: { status: newStatus } });
  };

  const handleDelete = (taskId) => {
    if (!confirm(language === 'he' ? 'למחוק משימה?' : 'Delete task?')) return;
    deleteTaskMutation.mutate(taskId);
  };

  const openTasks = tasks.filter(t => t.status !== 'completed').slice(0, 5);

  if (openTasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">{t('tasks.noOpenTasks')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{t('tasks.openTasks')}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {openTasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          return (
            <div 
              key={task.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleStatusChange(task, task.status === 'completed' ? 'open' : 'completed')}
                  className={cn('mt-0.5', statusColors[task.status])}
                >
                  <StatusIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-gray-900",
                    task.status === 'completed' && "line-through text-gray-400"
                  )}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {task.priority && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        priorityColors[task.priority]
                      )}>
                        {task.priority === 'high' 
                          ? (language === 'he' ? 'גבוהה' : 'High')
                          : task.priority === 'medium' 
                          ? (language === 'he' ? 'בינונית' : 'Medium')
                          : (language === 'he' ? 'נמוכה' : 'Low')
                        }
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-gray-400">
                        {new Date(task.due_date).toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'open')}>
                      <Circle className="w-4 h-4 ml-2" />
                      {t('tasks.open')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'in_progress')}>
                      <Clock className="w-4 h-4 ml-2" />
                      {t('tasks.inProgress')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'completed')}>
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      {t('tasks.completed')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'stuck')}>
                      <AlertTriangle className="w-4 h-4 ml-2" />
                      {t('tasks.stuck')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(task.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      {language === 'he' ? 'מחק' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}