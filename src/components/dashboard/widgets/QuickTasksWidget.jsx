import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function QuickTasksWidget() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [newTask, setNewTask] = useState('');
  const [newSubtasks, setNewSubtasks] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['quick-tasks', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const allTasks = await base44.entities.Task.filter({
        workspace_id: activeWorkspace.id,
        status: { $ne: 'completed' }
      });
      return allTasks.slice(0, 5);
    },
    enabled: !!activeWorkspace
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await base44.entities.Task.create(taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quick-tasks']);
      toast.success(language === 'he' ? 'משימה נוספה' : 'Task added');
      setNewTask('');
      setNewSubtasks('');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }) => {
      return await base44.entities.Task.update(taskId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quick-tasks']);
      toast.success(language === 'he' ? 'המשימה עודכנה' : 'Task updated');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      return await base44.entities.Task.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quick-tasks']);
      toast.success(language === 'he' ? 'המשימה נמחקה' : 'Task deleted');
    }
  });

  const handleAddTask = () => {
    if (!newTask.trim() || !activeWorkspace) return;

    const subtasksList = newSubtasks
      .split('\n')
      .filter(s => s.trim())
      .map(s => ({ text: s.trim(), completed: false }));

    createTaskMutation.mutate({
      workspace_id: activeWorkspace.id,
      title: newTask,
      status: 'open',
      priority: 'medium',
      subtasks: subtasksList
    });
  };

  const toggleSubtask = (task, subtaskIndex) => {
    const updatedSubtasks = [...(task.subtasks || [])];
    updatedSubtasks[subtaskIndex].completed = !updatedSubtasks[subtaskIndex].completed;

    const allCompleted = updatedSubtasks.every(st => st.completed);
    
    updateTaskMutation.mutate({
      taskId: task.id,
      data: {
        subtasks: updatedSubtasks,
        status: allCompleted ? 'completed' : task.status
      }
    });
  };

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'completed' ? 'open' : 'completed';
    updateTaskMutation.mutate({
      taskId: task.id,
      data: { status: newStatus }
    });
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white h-[320px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          {language === 'he' ? 'משימות מהירות' : 'Quick Tasks'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* Add Task Form */}
        <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
          <Input
            placeholder={language === 'he' ? 'שם המשימה...' : 'Task name...'}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <textarea
            className="w-full px-3 py-2 text-sm border rounded-md resize-none"
            rows="3"
            placeholder={language === 'he' 
              ? 'נקודות משנה (כל שורה = נקודה):\n- משהו ראשון\n- משהו שני\n- משהו שלישי'
              : 'Subtasks (one per line):\n- First item\n- Second item\n- Third item'
            }
            value={newSubtasks}
            onChange={(e) => setNewSubtasks(e.target.value)}
          />
          <Button 
            onClick={handleAddTask}
            size="sm"
            className="w-full"
            disabled={!newTask.trim() || createTaskMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'he' ? 'הוסף משימה' : 'Add Task'}
          </Button>
        </div>

        {/* Tasks List */}
        <div className="space-y-3 overflow-y-auto flex-1">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {language === 'he' ? 'אין משימות פעילות' : 'No active tasks'}
            </p>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id}
                className="p-3 bg-white rounded-lg border border-gray-200 space-y-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => toggleTaskStatus(task)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        task.status === 'completed' 
                          ? 'line-through text-gray-400' 
                          : 'text-gray-900'
                      }`}>
                        {task.title}
                      </p>
                      
                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1 mr-4">
                          {task.subtasks.map((subtask, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={() => toggleSubtask(task, idx)}
                                className="h-3 w-3"
                              />
                              <span className={`text-xs ${
                                subtask.completed 
                                  ? 'line-through text-gray-400' 
                                  : 'text-gray-600'
                              }`}>
                                {subtask.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {tasks.length > 0 && (
          <p className="text-xs text-gray-500 text-center">
            {language === 'he' 
              ? `מציג ${tasks.length} משימות אחרונות`
              : `Showing ${tasks.length} recent tasks`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}