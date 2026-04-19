import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'todo', label: 'לביצוע', color: 'border-gray-300', bg: 'bg-gray-50' },
  { id: 'in_progress', label: 'בתהליך', color: 'border-blue-400', bg: 'bg-blue-50' },
  { id: 'done', label: 'הושלם', color: 'border-green-400', bg: 'bg-green-50' },
  { id: 'blocked', label: 'חסום', color: 'border-red-400', bg: 'bg-red-50' },
];

const PRIORITY = {
  low: { label: 'נמוך', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'בינוני', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'גבוה', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'דחוף', color: 'bg-red-100 text-red-700' },
};

const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'done', blocked: 'todo' };

export default function Tasks() {
  const { workspaceId, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [saving, setSaving] = useState(false);

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

  const deleteTask = async (id) => {
    if (!confirm('למחוק משימה זו?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
    toast.success('משימה נמחקה');
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">משימות</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6C63FF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          + משימה חדשה
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש משימה..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">כל העדיפויות</option>
          <option value="urgent">דחוף</option>
          <option value="high">גבוה</option>
          <option value="medium">בינוני</option>
          <option value="low">נמוך</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={`${col.bg} border-t-4 ${col.color} rounded-xl p-3 min-h-64`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{col.label}</h3>
                <span className="bg-white text-gray-500 text-xs px-2 py-1 rounded-full font-medium">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.length === 0 && (
                  <p className="text-gray-300 text-xs text-center py-8">ריק</p>
                )}
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-800 mb-2">{task.title}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.priority && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[task.priority]?.color || ''}`}
                        >
                          {PRIORITY[task.priority]?.label}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-400">
                          {new Date(task.due_date).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {col.id !== 'done' && (
                        <button
                          onClick={() => moveTask(task.id, task.status)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          העבר ▶
                        </button>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-xs text-red-400 hover:underline mr-auto"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">משימה חדשה</h2>
            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="כותרת המשימה *"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="תיאור (אופציונלי)"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addTask}
                disabled={saving}
                className="flex-1 bg-[#6C63FF] text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'הוסף משימה'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-sm"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
