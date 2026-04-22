import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, User, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';

const STATUSES = ['planning', 'active', 'on_hold', 'completed'];

function DroppableColumn({ id, title, count, accent, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-[420px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">{title}</h3>
        <Badge className={accent}>{count}</Badge>
      </div>
      <div
        className={`rounded-2xl border p-2 space-y-3 min-h-[360px] transition-colors ${
          isOver ? 'border-[#8B5CF6] bg-[#6B46C1]/10' : 'border-[#2A2A45] bg-[#0F0F1A]/40'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function DraggableProjectShell({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'opacity-40' : ''}`}>
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        {children}
      </div>
    </div>
  );
}

export default function ProjectBoard({ projects, clients, onProjectClick, onDelete, onProjectStatusChange }) {
  const [draggingId, setDraggingId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const statusGroups = useMemo(() => {
    return {
      planning: projects.filter((p) => p.status === 'planning'),
      active: projects.filter((p) => p.status === 'active'),
      on_hold: projects.filter((p) => p.status === 'on_hold'),
      completed: projects.filter((p) => p.status === 'completed'),
    };
  }, [projects]);

  const statusLabels = {
    planning: 'בתכנון',
    active: 'פעיל',
    on_hold: 'בהמתנה',
    completed: 'הושלם',
  };

  const statusColors = {
    planning: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    active: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    on_hold: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
    completed: 'bg-white/10 text-[#E6E6F0] border border-[#2A2A45]',
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || 'לא ידוע';
  };

  const handleDelete = async (e, project) => {
    e.stopPropagation();
    if (!confirm(`למחוק את ${project.name}?`)) return;

    try {
      await opsbrain.entities.Project.delete(project.id);
      toast.success('פרויקט נמחק');
      onDelete?.();
    } catch {
      toast.error('שגיאה במחיקת פרויקט');
    }
  };

  const draggingProject = draggingId ? projects.find((p) => p.id === draggingId) : null;

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over) return;
    const projectId = active.id;
    const nextStatus = over.id;
    if (!STATUSES.includes(nextStatus)) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.status === nextStatus) return;
    try {
      await opsbrain.entities.Project.update(projectId, { status: nextStatus });
      onProjectStatusChange?.();
      toast.success('סטטוס עודכן');
    } catch {
      toast.error('שגיאה בעדכון סטטוס');
    }
  };

  const renderCard = (project, { inOverlay } = {}) => (
    <Card
      className={`mb-0 transition-all group relative border-[#2A2A45] bg-[#1E1E35] ${
        inOverlay ? 'shadow-2xl ring-1 ring-[#6B46C1]/40' : 'hover:border-[#6B46C1]/50'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-white leading-snug">{project.name}</h4>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#C4C4E0] hover:text-white hover:bg-white/5"
              onClick={(e) => {
                e.stopPropagation();
                onProjectClick(project);
              }}
              aria-label="פתח פרטים"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleDelete(e, project)}
              className="h-8 w-8 text-red-300 hover:bg-red-500/10"
              aria-label="מחק פרויקט"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-[#A0A0C0]">
            <User className="w-4 h-4" />
            <span>{getClientName(project.client_id)}</span>
          </div>
          {project.end_date && (
            <div className="flex items-center gap-2 text-[#A0A0C0]">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(project.end_date), 'dd MMM yyyy', { locale: he })}</span>
            </div>
          )}
          {project.budget != null && (
            <div className="flex items-center gap-2 text-[#A0A0C0]">
              <DollarSign className="w-4 h-4" />
              <span>₪{Number(project.budget).toLocaleString()}</span>
            </div>
          )}
        </div>
        {project.progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#A0A0C0] mb-1">
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
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDraggingId(String(e.active.id))}
      onDragCancel={() => setDraggingId(null)}
      onDragEnd={handleDragEnd}
    >
      <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            id={status}
            title={statusLabels[status]}
            count={statusGroups[status].length}
            accent={statusColors[status]}
          >
            {statusGroups[status].map((project) => (
              <DraggableProjectShell key={project.id} id={project.id}>
                {renderCard(project)}
              </DraggableProjectShell>
            ))}
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingProject ? <div className="w-[300px]">{renderCard(draggingProject, { inOverlay: true })}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
