// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Plus, X } from 'lucide-react';

const COLUMNS = [
  { key: 'todo', label: 'לביצוע', color: 'bg-gray-100 text-gray-700' },
  { key: 'in_progress', label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
  { key: 'done', label: 'הושלם', color: 'bg-green-100 text-green-700' },
  { key: 'blocked', label: 'חסום', color: 'bg-red-100 text-red-700' },
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const emptyForm = { title: '', description: '', priority: 'medium', due_date: '' };

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    initWorkspace();
  }, [user]);

  const initWorkspace = async () => {
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    if (data?.workspace_id) {
      setWorkspaceId(data.workspace_id);
      fetchTasks(data.workspace_id);
    } else {
      setLoading(false);
    }
  };

  const fetchTasks = async (wsId) => {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  const saveTask = async () => {
    if (!form.title.trim() || !workspaceId) return;
    setSaving(true);
    const { data, error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      due_date: form.due_date || null,
      status: 'todo',
      created_by: user.id,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setTasks(prev => [data, ...prev]);
      setForm(emptyForm);
      setModalOpen(false);
    }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">משימות</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#6C63FF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5a52e0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          משימה חדשה
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className={`px-4 py-3 ${col.color} font-semibold text-sm flex items-center justify-between`}>
                <span>{col.label}</span>
                <span className="bg-white/60 rounded-full px-2 py-0.5 text-xs">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              <div className="p-2 space-y-2 min-h-32">
                {tasksByStatus(col.key).map(task => (
                  <div key={task.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-sm font-medium text-gray-800 mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      {task.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                          {task.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-400">
                          {new Date(task.due_date).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">משימה חדשה</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="כותרת המשימה"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="תיאור המשימה..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]"
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                    <option value="urgent">דחופה</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveTask}
                disabled={saving || !form.title.trim()}
                className="flex-1 bg-[#6C63FF] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a52e0] disabled:opacity-50 transition-colors"
              >
                {saving ? 'שומר...' : 'שמור משימה'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
