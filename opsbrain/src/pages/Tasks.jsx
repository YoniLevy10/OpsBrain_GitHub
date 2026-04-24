import { useMemo, useState } from 'react';
import { PageLoader } from '../components/Spinner';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const COLUMNS = [
  { id: 'todo', label: 'לביצוע', accent: 'border-sky-200 bg-sky-50/80' },
  { id: 'in_progress', label: 'בתהליך', accent: 'border-amber-200 bg-amber-50/80' },
  { id: 'done', label: 'הושלם', accent: 'border-emerald-200 bg-emerald-50/80' },
  { id: 'blocked', label: 'חסום', accent: 'border-red-200 bg-red-50/80' },
];

const PRIORITY = {
  low: { label: 'נמוך', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'בינוני', color: 'bg-amber-100 text-amber-800' },
  high: { label: 'גבוה', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'דחוף', color: 'bg-red-100 text-red-800' },
};

const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'done', blocked: 'todo' };

function taskDragId(taskId) {
  return `task:${taskId}`;
}

function parseTaskDragId(id) {
  if (typeof id !== 'string') return null;
  if (!id.startsWith('task:')) return null;
  return id.slice('task:'.length);
}

function DroppableColumn({ id, label, count, accent, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-w-[260px] flex-1">
      <div
        className={`rounded-2xl border p-3 min-h-[520px] transition-colors ${
          isOver ? 'border-indigo-400 bg-indigo-50/90 shadow-sm' : 'border-slate-200 bg-white'
        } ${accent}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">{label}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{count}</span>
        </div>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}

function DraggableTask({ task, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: taskDragId(task.id) });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-40' : ''}`}>
      {children({ dragProps: { ...listeners, ...attributes } })}
    </div>
  );
}

export default function Tasks() {
  const { tasks, loading, addTask: addTaskRow, updateTask, deleteTask: deleteTaskRow } = useTasks();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [activeDragTaskId, setActiveDragTaskId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onAddTask = async () => {
    if (!form.title.trim()) {
      toast.error('כותרת חובה');
      return;
    }
    setSaving(true);
    try {
      await addTaskRow({
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
        status: 'todo',
      });
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בהוספת משימה');
      setSaving(false);
      return;
    }
    toast.success('משימה נוספה');
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setShowModal(false);
    setSaving(false);
  };

  const moveTask = async (id, currentStatus) => {
    const next = NEXT_STATUS[currentStatus] || 'todo';
    try {
      await updateTask(id, { status: next });
    } catch {
      // ignore toast spam
    }
  };

  const setTaskStatus = async (taskId, nextStatus) => {
    try {
      await updateTask(taskId, { status: nextStatus });
    } catch {
      toast.error('שגיאה בעדכון סטטוס');
      return;
    }
    toast.success('סטטוס עודכן');
  };

  const onDeleteTask = async (id) => {
    if (!confirm('למחוק משימה זו?')) return;
    try {
      await deleteTaskRow(id);
      toast.success('משימה נמחקה');
    } catch (e) {
      console.error(e);
      toast.error('שגיאה במחיקה');
    }
  };

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      return matchSearch && matchPriority;
    });
  }, [tasks, search, filterPriority]);

  const activeTask = activeDragTaskId ? tasks.find((t) => t.id === activeDragTaskId) : null;

  const onDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragTaskId(null);
    if (!over) return;
    const taskId = parseTaskDragId(active.id);
    const nextStatus = over.id;
    if (!taskId) return;
    if (!COLUMNS.some((c) => c.id === nextStatus)) return;
    await setTaskStatus(taskId, nextStatus);
  };

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="משימות"
        subtitle="גרור בין עמודות כדי לעדכן סטטוס"
        Icon={CheckSquare}
        actions={
          <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 ml-2" />
            משימה חדשה
          </Button>
        }
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש משימה..."
          className="flex-1 min-w-48 bg-white"
        />
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="כל העדיפויות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העדיפויות</SelectItem>
            <SelectItem value="urgent">דחוף</SelectItem>
            <SelectItem value="high">גבוה</SelectItem>
            <SelectItem value="medium">בינוני</SelectItem>
            <SelectItem value="low">נמוך</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const id = parseTaskDragId(e.active.id);
          setActiveDragTaskId(id);
        }}
        onDragCancel={() => setActiveDragTaskId(null)}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.id);
            return (
              <DroppableColumn key={col.id} id={col.id} label={col.label} count={colTasks.length} accent={col.accent}>
                {colTasks.length === 0 && <p className="text-slate-400 text-xs text-center py-10">גרור משימה לכאן</p>}
                {colTasks.map((task) => (
                  <DraggableTask key={task.id} task={task}>
                    {({ dragProps }) => (
                      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="text-right flex-1"
                            {...dragProps}
                            title="גרור בין עמודות"
                          >
                            <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          </button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {task.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[task.priority]?.color || ''}`}>
                              {PRIORITY[task.priority]?.label}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-slate-500">{new Date(task.due_date).toLocaleDateString('he-IL')}</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {col.id !== 'done' && (
                            <button
                              type="button"
                              onClick={() => moveTask(task.id, task.status)}
                              className="text-xs text-indigo-600 hover:underline font-medium"
                            >
                              העבר ▶
                            </button>
                          )}
                          <button type="button" onClick={() => onDeleteTask(task.id)} className="text-xs text-red-600 hover:underline mr-auto">
                            מחק
                          </button>
                        </div>
                      </div>
                    )}
                  </DraggableTask>
                ))}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-[280px] bg-white rounded-xl p-3 border-2 border-indigo-300 shadow-2xl">
              <p className="text-sm font-medium text-slate-900">{activeTask.title}</p>
              <div className="mt-2 text-xs text-slate-500">{PRIORITY[activeTask.priority]?.label}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>משימה חדשה</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>כותרת</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="כותרת המשימה"
              />
            </div>
            <div className="grid gap-2">
              <Label>תיאור</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="תיאור (אופציונלי)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>עדיפות</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוך</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="high">גבוה</SelectItem>
                    <SelectItem value="urgent">דחוף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>תאריך יעד</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                ביטול
              </Button>
              <Button onClick={onAddTask} disabled={saving || !form.title.trim()}>
                {saving ? 'שומר...' : 'הוסף משימה'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
