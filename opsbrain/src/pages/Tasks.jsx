import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import { toast } from 'sonner';
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
  { id: 'todo', label: 'לביצוע', accent: 'border-blue-500/40 bg-blue-500/5' },
  { id: 'in_progress', label: 'בתהליך', accent: 'border-amber-500/40 bg-amber-500/5' },
  { id: 'done', label: 'הושלם', accent: 'border-emerald-500/40 bg-emerald-500/5' },
  { id: 'blocked', label: 'חסום', accent: 'border-red-500/40 bg-red-500/5' },
];

const PRIORITY = {
  low: { label: 'נמוך', color: 'bg-white/10 text-[#C4C4E0]' },
  medium: { label: 'בינוני', color: 'bg-yellow-500/15 text-yellow-200' },
  high: { label: 'גבוה', color: 'bg-orange-500/15 text-orange-200' },
  urgent: { label: 'דחוף', color: 'bg-red-500/15 text-red-200' },
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
          isOver ? 'border-[#8B5CF6] bg-[#6B46C1]/10' : 'border-[#2A2A45] bg-[#0F0F1A]/35'
        } ${accent}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">{label}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-[#C4C4E0] font-medium">{count}</span>
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
  const { workspaceId, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [activeDragTaskId, setActiveDragTaskId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (workspaceId) fetchTasks();
  }, [workspaceId]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  };

  const addTask = async () => {
    if (!form.title.trim()) {
      toast.error('כותרת חובה');
      return;
    }
    if (!user?.id) {
      toast.error('יש להתחבר מחדש');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      created_by: user.id,
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      due_date: form.due_date || null,
      status: 'todo',
    });
    if (error) {
      toast.error('שגיאה בהוספת משימה');
      setSaving(false);
      return;
    }
    toast.success('משימה נוספה');
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setShowModal(false);
    setSaving(false);
    fetchTasks();
  };

  const moveTask = async (id, currentStatus) => {
    const next = NEXT_STATUS[currentStatus] || 'todo';
    const { error } = await supabase
      .from('tasks')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchTasks();
  };

  const setTaskStatus = async (taskId, nextStatus) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) {
      setTasks(prev);
      toast.error('שגיאה בעדכון סטטוס');
      return;
    }
    toast.success('סטטוס עודכן');
  };

  const deleteTask = async (id) => {
    if (!confirm('למחוק משימה זו?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
    toast.success('משימה נמחקה');
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
    <div dir="rtl" className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-white">משימות</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6B46C1] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a3aad]"
        >
          + משימה חדשה
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש משימה..."
          className="border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-3 py-2 text-sm flex-1 min-w-48 text-white placeholder:text-[#6B6B8A]"
        />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-3 py-2 text-sm text-white"
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
                {colTasks.length === 0 && <p className="text-[#6B6B8A] text-xs text-center py-10">גרור משימה לכאן</p>}
                {colTasks.map((task) => (
                  <DraggableTask key={task.id} task={task}>
                    {({ dragProps }) => (
                      <div className="bg-[#1E1E35] rounded-xl p-3 border border-[#2A2A45] shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="text-right flex-1"
                            {...dragProps}
                            title="גרור בין עמודות"
                          >
                            <p className="text-sm font-medium text-white">{task.title}</p>
                          </button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {task.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[task.priority]?.color || ''}`}>
                              {PRIORITY[task.priority]?.label}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-[#A0A0C0]">{new Date(task.due_date).toLocaleDateString('he-IL')}</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {col.id !== 'done' && (
                            <button
                              type="button"
                              onClick={() => moveTask(task.id, task.status)}
                              className="text-xs text-[#A78BFA] hover:underline"
                            >
                              העבר ▶
                            </button>
                          )}
                          <button type="button" onClick={() => deleteTask(task.id)} className="text-xs text-red-300 hover:underline mr-auto">
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
            <div className="w-[280px] bg-[#1E1E35] rounded-xl p-3 border border-[#6B46C1]/40 shadow-2xl">
              <p className="text-sm font-medium text-white">{activeTask.title}</p>
              <div className="mt-2 text-xs text-[#A0A0C0]">{PRIORITY[activeTask.priority]?.label}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-[#1E1E35] border border-[#2A2A45] rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-white">משימה חדשה</h2>
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="כותרת המשימה *"
                className="w-full border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-3 py-2 text-sm text-white"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="תיאור (אופציונלי)"
                rows={3}
                className="w-full border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-3 py-2 text-sm resize-none text-white"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-3 py-2 text-sm text-white"
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
                className="w-full border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addTask}
                disabled={saving}
                className="flex-1 bg-[#6B46C1] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#5a3aad] disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'הוסף משימה'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-[#2A2A45] py-2 rounded-xl text-sm text-[#C4C4E0]">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
