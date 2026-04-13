import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, LayoutGrid } from 'lucide-react';
import FolderSidebar from '@/components/projects/FolderSidebar';
import AddFolderDialog from '@/components/projects/AddFolderDialog';
import AddProjectDialog from '@/components/crm/AddProjectDialog';
import ProjectDetailPanel from '@/components/projects/ProjectDetailPanel';
import ProjectBoard from '@/components/crm/ProjectBoard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Projects() {
  const { language, t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectFolderId, setNewProjectFolderId] = useState(null);
  const [addFolderParentId, setAddFolderParentId] = useState(null);

  const isRTL = language === 'he';

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', activeWorkspace?.id],
    queryFn: () => base44.entities.Folder.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: () => base44.entities.Project.filter({ workspace_id: activeWorkspace.id }, '-created_date'),
    enabled: !!activeWorkspace,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Real-time subscription - refresh when agent creates a project
  React.useEffect(() => {
    const unsubscribe = base44.entities.Project.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: () => base44.entities.Client.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000
  });

  const createFolder = useMutation({
    mutationFn: (data) => base44.entities.Folder.create({ ...data, workspace_id: activeWorkspace.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setShowAddFolder(false);
    }
  });

  const createProject = useMutation({
    mutationFn: (data) => base44.entities.Project.create({
      ...data,
      workspace_id: activeWorkspace.id,
      ...(newProjectFolderId && { folder_id: newProjectFolderId })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowAddProject(false);
      setNewProjectFolderId(null);
    }
  });

  const handleAddProject = (folderId) => {
    setNewProjectFolderId(folderId);
    setShowAddProject(true);
  };

  const handleAddFolder = (parentId) => {
    setAddFolderParentId(parentId);
    setShowAddFolder(true);
  };

  // Filtered projects based on selected folder
  const displayedProjects = selectedFolderId
    ? projects.filter(p => p.folder_id === selectedFolderId)
    : projects;

  const isLoading = foldersLoading || projectsLoading;

  return (
    <div className="flex h-screen overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <FolderSidebar
        folders={folders}
        projects={projects}
        selectedFolderId={selectedFolderId}
        selectedProjectId={selectedProject?.id}
        onSelectFolder={(id) => { setSelectedFolderId(id); setSelectedProject(null); }}
        onSelectProject={(p) => { setSelectedProject(p); setSelectedFolderId(null); }}
        onAddFolder={handleAddFolder}
        onAddProject={handleAddProject}
        workspaceId={activeWorkspace?.id}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedFolderId ? (
              <>
                <FolderOpen className="w-5 h-5 text-gray-500" />
                <h1 className="text-lg font-semibold text-gray-900">
                  {folders.find(f => f.id === selectedFolderId)?.name || 'תיקייה'}
                </h1>
                <span className="text-sm text-gray-400">({displayedProjects.length})</span>
              </>
            ) : selectedProject ? (
              <h1 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h1>
            ) : (
              <>
                <LayoutGrid className="w-5 h-5 text-gray-500" />
                <h1 className="text-lg font-semibold text-gray-900">
                  {t('projectsExtra.allProjects')}
                </h1>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddFolder(selectedFolderId)}
              className="gap-1.5 text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('projectsExtra.folder')}
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddProject(selectedFolderId)}
              className="gap-1.5 text-sm bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('projects.newProject')}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {selectedProject ? (
            <ProjectDetailPanel
              project={selectedProject}
              clients={clients}
              workspaceId={activeWorkspace?.id}
              onDelete={() => setSelectedProject(null)}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
                </div>
              ) : displayedProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {t('projectsExtra.noProjects')}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-xs">
                    {t('projectsExtra.noProjectsDesc')}
                  </p>
                  <Button onClick={() => handleAddProject(selectedFolderId)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('projectsExtra.firstProject')}
                  </Button>
                </div>
              ) : (
                <ProjectBoard
                  projects={displayedProjects}
                  clients={clients}
                  onProjectClick={setSelectedProject}
                  onDelete={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddFolderDialog
        open={showAddFolder}
        onClose={() => setShowAddFolder(false)}
        onSubmit={(data) => createFolder.mutate({ ...data, parent_folder_id: addFolderParentId || undefined })}
        isLoading={createFolder.isPending}
        parentFolderId={addFolderParentId}
      />

      <AddProjectDialog
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={(data) => createProject.mutate(data)}
        isLoading={createProject.isPending}
        clients={clients}
      />
    </div>
  );
}