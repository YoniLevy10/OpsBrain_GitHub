import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, 
  MoreHorizontal, Pencil, Trash2, Briefcase, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const FOLDER_COLORS = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  red: 'text-red-500',
  orange: 'text-orange-500',
  gray: 'text-gray-500',
  pink: 'text-pink-500',
  yellow: 'text-yellow-500'
};

export default function FolderSidebar({ 
  folders, projects, selectedFolderId, selectedProjectId,
  onSelectFolder, onSelectProject, onAddFolder, onAddProject,
  workspaceId 
}) {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const toggleFolder = (id) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const getSubFolders = (parentId) => folders.filter(f => f.parent_folder_id === parentId);
  const getFolderProjects = (folderId) => projects.filter(p => p.folder_id === folderId);
  const unfolderedProjects = projects.filter(p => !p.folder_id);

  const deleteFolder = async (folder) => {
    if (!confirm(`למחוק את "${folder.name}"?`)) return;
    await base44.entities.Folder.delete(folder.id);
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    toast.success('תיקייה נמחקה');
    if (selectedFolderId === folder.id) onSelectFolder(null);
  };

  const renameFolder = async (folder) => {
    if (!editName.trim()) return;
    await base44.entities.Folder.update(folder.id, { name: editName });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    setEditingId(null);
  };

  const startEdit = (folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const FolderItem = ({ folder, depth = 0 }) => {
    const isExpanded = expandedFolders[folder.id];
    const isSelected = selectedFolderId === folder.id;
    const subFolders = getSubFolders(folder.id);
    const folderProjects = getFolderProjects(folder.id);
    const hasChildren = subFolders.length > 0 || folderProjects.length > 0;
    const colorClass = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;

    return (
      <div>
        <div
          className={cn(
            "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-sm",
            isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-700"
          )}
          style={{ paddingRight: `${8 + depth * 16}px` }}
        >
          {/* Expand toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
            ) : <span className="w-3" />}
          </button>

          {/* Folder icon + name */}
          <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => { onSelectFolder(folder.id); toggleFolder(folder.id); }}
          >
            {isExpanded
              ? <FolderOpen className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-white" : colorClass)} />
              : <Folder className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-white" : colorClass)} />
            }
            {editingId === folder.id ? (
              <Input
                value={editName}
                autoFocus
                className="h-6 text-xs px-1 py-0"
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameFolder(folder);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate font-medium">{folder.name}</span>
            )}
            {folderProjects.length > 0 && (
              <span className={cn("text-xs flex-shrink-0", isSelected ? "text-white/60" : "text-gray-400")}>
                {folderProjects.length}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onAddProject(folder.id); }}
              className={cn("p-0.5 rounded hover:bg-black/10", isSelected ? "text-white" : "text-gray-400")}
              title="פרויקט חדש"
            >
              <Plus className="w-3 h-3" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className={cn("p-0.5 rounded hover:bg-black/10", isSelected ? "text-white" : "text-gray-400")}>
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => startEdit(folder)}>
                  <Pencil className="w-3 h-3 ml-2" /> שנה שם
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddFolder(folder.id)}>
                  <Folder className="w-3 h-3 ml-2" /> תיקיית משנה
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => deleteFolder(folder)}>
                  <Trash2 className="w-3 h-3 ml-2" /> מחק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub-content */}
        {isExpanded && (
          <div>
            {subFolders.map(sub => (
              <FolderItem key={sub.id} folder={sub} depth={depth + 1} />
            ))}
            {folderProjects.map(project => (
              <ProjectItem key={project.id} project={project} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProjectItem = ({ project, depth = 0 }) => {
    const isSelected = selectedProjectId === project.id;
    const statusDot = {
      planning: 'bg-blue-400',
      active: 'bg-green-400',
      on_hold: 'bg-yellow-400',
      completed: 'bg-gray-400',
      cancelled: 'bg-red-400'
    }[project.status] || 'bg-gray-400';

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-sm",
          isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-600"
        )}
        style={{ paddingRight: `${8 + depth * 16}px` }}
        onClick={() => onSelectProject(project)}
      >
        <span className="w-4" />
        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{project.name}</span>
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0 mr-auto", statusDot)} />
      </div>
    );
  };

  return (
    <div className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">פרויקטים</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddFolder(null)} title="תיקייה חדשה">
            <Folder className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddProject(null)} title="פרויקט חדש">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* All Projects */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* All view */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm font-medium",
            !selectedFolderId && !selectedProjectId ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-700"
          )}
          onClick={() => { onSelectFolder(null); onSelectProject(null); }}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>כל הפרויקטים</span>
          <span className={cn("text-xs mr-auto", !selectedFolderId && !selectedProjectId ? "text-white/60" : "text-gray-400")}>
            {projects.length}
          </span>
        </div>

        {/* Folders */}
        {rootFolders.map(folder => (
          <FolderItem key={folder.id} folder={folder} />
        ))}

        {/* Unfoldered projects */}
        {unfolderedProjects.length > 0 && (
          <div className="mt-2">
            {rootFolders.length > 0 && (
              <p className="text-xs text-gray-400 px-2 mb-1">ללא תיקייה</p>
            )}
            {unfolderedProjects.map(project => (
              <ProjectItem key={project.id} project={project} depth={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}