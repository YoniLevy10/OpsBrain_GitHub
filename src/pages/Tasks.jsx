import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import TaskListTable from '@/components/tasks/TaskListTable';
import TaskCreateModal from '@/components/tasks/TaskCreateModal';
import TaskFilters from '@/components/tasks/TaskFilters';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Tasks() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const isRTL = language === 'he';

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Task.filter(
        { workspace_id: activeWorkspace.id },
        '-created_date'
      );
    },
    enabled: !!activeWorkspace,
    staleTime: 0
  });

  // Fetch projects for optional linkage
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Project.filter(
        { workspace_id: activeWorkspace.id }
      );
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000
  });

  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.WorkspaceMember.filter(
        { workspace_id: activeWorkspace.id }
      );
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => {
      if (!activeWorkspace) throw new Error('No workspace');
      return base44.entities.Task.create({
        ...taskData,
        workspace_id: activeWorkspace.id,
        status: 'open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreateModal(false);
      setEditingTask(null);
      toast.success(language === 'he' ? 'משימה נוצרה בהצלחה' : 'Task created');
    },
    onError: (error) => {
      toast.error(language === 'he' ? 'שגיאה ביצירת משימה' : 'Failed to create task');
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }) => {
      return base44.entities.Task.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      setShowCreateModal(false);
      toast.success(language === 'he' ? 'משימה עודכנה' : 'Task updated');
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה בעדכון משימה' : 'Failed to update task');
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(language === 'he' ? 'משימה נמחקה' : 'Task deleted');
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה במחיקת משימה' : 'Failed to delete task');
    }
  });

  // Toggle task completion
  const toggleTaskCompletion = (task) => {
    const newStatus = task.status === 'completed' ? 'open' : 'completed';
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    if (confirm(language === 'he' ? 'האם אתה בטוח?' : 'Are you sure?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };

  // Handle form submission
  const handleSubmit = (formData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, ...formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchQuery]);

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || null;
  };

  // Get member name by ID
  const getMemberName = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member?.user?.full_name || 'Unassigned';
  };

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const openTasks = tasks.filter(t => t.status === 'open').length;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {language === 'he' ? 'משימות' : 'Tasks'}
          </h1>
          <p className="text-gray-500">
            {language === 'he' 
              ? `${totalTasks} משימות בסך הכל • ${openTasks} פתוחות • ${completedTasks} הושלמו`
              : `${totalTasks} total • ${openTasks} open • ${completedTasks} completed`
            }
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingTask(null);
            setShowCreateModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {language === 'he' ? 'משימה חדשה' : 'New Task'}
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder={language === 'he' ? 'חפש משימות...' : 'Search tasks...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <TaskFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            language={language}
          />
        </div>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400">
            <p className="text-lg mb-2">
              {searchQuery || statusFilter !== 'all'
                ? (language === 'he' ? 'לא נמצאו משימות' : 'No tasks found')
                : (language === 'he' ? 'אין משימות עדיין' : 'No tasks yet')
              }
            </p>
            <p className="text-sm">
              {searchQuery || statusFilter !== 'all'
                ? (language === 'he' ? 'נסה לשנות את הסינון או החיפוש' : 'Try adjusting filters or search')
                : (language === 'he' ? 'הצלח על "משימה חדשה" כדי להתחיל' : 'Click "New Task" to get started')
              }
            </p>
          </div>
        </Card>
      ) : (
        <TaskListTable
          tasks={filteredTasks}
          onToggleComplete={toggleTaskCompletion}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          getProjectName={getProjectName}
          getMemberName={getMemberName}
          language={language}
        />
      )}

      {/* Create/Edit Modal */}
      <TaskCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleSubmit}
        editingTask={editingTask}
        projects={projects}
        teamMembers={teamMembers}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
        language={language}
      />
    </div>
  );
}
