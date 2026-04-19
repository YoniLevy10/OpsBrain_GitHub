import React, { useState, lazy, Suspense } from 'react';
import { opsbrain } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase } from 'lucide-react';
import ProjectBoard from '../components/crm/ProjectBoard';
import AddProjectDialog from '../components/crm/AddProjectDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '../components/LoadingSpinner';

const ProjectTimeline = lazy(() => import('../components/projects/ProjectTimeline'));
const ProjectBudgetTracker = lazy(() => import('../components/projects/ProjectBudgetTracker'));

export default function Projects() {
  const { t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('board');
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Project.filter({ workspace_id: activeWorkspace.id }, '-created_date');
    },
    enabled: !!activeWorkspace,
    staleTime: 3 * 60 * 1000
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Client.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Task.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace,
    staleTime: 2 * 60 * 1000
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!activeWorkspace) throw new Error('No workspace');
      return opsbrain.entities.Project.create({ ...data, workspace_id: activeWorkspace.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowAddDialog(false);
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('projects.title')}</h1>
          <p className="text-gray-500 mt-1">{t('projects.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 ml-2" />
          {t('projects.newProject')}
        </Button>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={activeTab === 'board' ? 'default' : 'outline'}
          onClick={() => setActiveTab('board')}
          className="rounded-xl"
        >
          {t('projects.board')}
        </Button>
        <Button
          variant={activeTab === 'details' ? 'default' : 'outline'}
          onClick={() => setActiveTab('details')}
          className="rounded-xl"
        >
          {t('projects.details')}
        </Button>
      </div>

      {activeTab === 'board' && (
        projectsLoading || clientsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <ProjectBoard 
            projects={projects} 
            clients={clients} 
            onProjectClick={(project) => {
              setSelectedProject(project);
              setActiveTab('details');
            }}
            onDelete={refetchProjects}
          />
        )
      )}

      {activeTab === 'details' && (
        <>
          {projectsLoading ? (
            <Skeleton className="h-96" />
          ) : projects.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('projects.selectProject')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                {projects.map(project => (
                  <Button
                    key={project.id}
                    variant={selectedProject?.id === project.id ? 'default' : 'outline'}
                    onClick={() => setSelectedProject(project)}
                    className="rounded-xl"
                  >
                    {project.name}
                  </Button>
                ))}
              </div>
              {selectedProject && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Suspense fallback={<Skeleton className="h-96" />}>
                    <ProjectTimeline project={selectedProject} tasks={tasks} />
                  </Suspense>
                  <Suspense fallback={<Skeleton className="h-96" />}>
                    <ProjectBudgetTracker project={selectedProject} />
                  </Suspense>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        clients={clients}
      />
    </div>
  );
}