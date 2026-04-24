import { useMemo, useState } from 'react';
import { PageLoader } from '../components/Spinner';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
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
    <div dir="rtl" className="max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">משימות</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm"
        >
          + משימה חדשה
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש משימה..."
          className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm flex-1 min-w-48 text-slate-900 placeholder:text-slate-400 shadow-sm"
        />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 shadow-sm"
        >
          <option value="all">כל העדיפויות</option>
          <option value="urgent">דחוף</option>
          <option value="high">גבוה</option>
          <option value="medium">בינוני</option>
          <option value="low">נמוך</option>
        </select>
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-slate-900">משימה חדשה</h2>
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="כותרת המשימה *"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm text-slate-900"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="תיאור (אופציונלי)"
                rows={3}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm resize-none text-slate-900"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm text-slate-900"
              >
                <option value="low">עדיפות נמוכה</option>
                <option value="medium">עדיפות בינונית</option>
                <option value="high">עדיפות גבוהה</option>
                <option value="urgent">דחוף!</option>
              </select>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={onAddTask}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'הוסף משימה'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
