import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';

export default function ProjectBoard({ projects, clients, onProjectClick, onDelete }) {
  const statusGroups = {
    planning: projects.filter(p => p.status === 'planning'),
    active: projects.filter(p => p.status === 'active'),
    on_hold: projects.filter(p => p.status === 'on_hold'),
    completed: projects.filter(p => p.status === 'completed')
  };

  const statusLabels = {
    planning: 'בתכנון',
    active: 'פעיל',
    on_hold: 'בהמתנה',
    completed: 'הושלם'
  };

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'לא ידוע';
  };

  const handleDelete = async (e, project) => {
    e.stopPropagation();
    if (!confirm(`למחוק את ${project.name}?`)) return;
    
    try {
      await opsbrain.entities.Project.delete(project.id);
      toast.success('פרויקט נמחק');
      onDelete?.();
    } catch (error) {
      toast.error('שגיאה במחיקת פרויקט');
    }
  };

  const ProjectCard = ({ project, onClick }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-all group relative" onClick={() => onClick(project)}>
      <CardContent className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleDelete(e, project)}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
        
        <h4 className="font-semibold text-gray-900 mb-2">{project.name}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>{getClientName(project.client_id)}</span>
          </div>
          {project.end_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(project.end_date), 'dd MMM yyyy', { locale: he })}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>₪{project.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        {project.progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>התקדמות</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(statusGroups).map(([status, projectsList]) => (
        <div key={status}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{statusLabels[status]}</h3>
            <Badge className={statusColors[status]}>{projectsList.length}</Badge>
          </div>
          <div className="space-y-3">
            {projectsList.map(project => (
              <ProjectCard key={project.id} project={project} onClick={onProjectClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}