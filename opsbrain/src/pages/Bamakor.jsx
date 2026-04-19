// @ts-nocheck
import { useState, useEffect } from 'react';
import { bamakorSupabase, isBamakorConfigured } from '@/lib/bamakorSupabase';
import { Plus, X, Building2, AlertCircle, Settings } from 'lucide-react';

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-orange-100 text-orange-700',
  closed: 'bg-green-100 text-green-700',
};
const STATUS_LABELS = { open: 'פתוח', in_progress: 'בטיפול', closed: 'הושלם' };

const emptyForm = { project: '', description: '', assigned_to: '', status: 'open' };

export default function Bamakor() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isBamakorConfigured) fetchTickets();
    else setLoading(false);
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await bamakorSupabase.from('tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const saveTicket = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    const { data, error } = await bamakorSupabase.from('tickets').insert({
      project: form.project,
      description: form.description,
      assigned_to: form.assigned_to,
      status: form.status,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setTickets(prev => [data, ...prev]);
      setForm(emptyForm);
      setModalOpen(false);
    }
  };

  const projects = [...new Set(tickets.map(t => t.project).filter(Boolean))];

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (projectFilter !== 'all' && t.project !== projectFilter) return false;
    return true;
  });

  if (!isBamakorConfigured) {
    return (
      <div className="p-8 max-w-lg mx-auto" dir="rtl">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <Building2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">מודול במקור</h1>
          <p className="text-gray-500 mb-6">כדי להתחבר למערכת במקור, יש להגדיר את פרטי ה-Supabase של במקור.</p>
          <div className="bg-gray-50 rounded-xl p-4 text-right space-y-2 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              <Settings className="w-4 h-4" /> הגדרת חיבור:
            </p>
            <p>פתח את קובץ <code className="bg-gray-200 px-1 rounded">.env.local</code> והוסף:</p>
            <pre className="bg-gray-800 text-green-400 text-xs p-3 rounded-lg text-left ltr" dir="ltr">
{`VITE_BAMAKOR_URL=https://your-project.supabase.co
VITE_BAMAKOR_KEY=your-anon-key`}
            </pre>
            <p>לאחר מכן הפעל מחדש את השרת.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700">יש להשיג את פרטי ה-Supabase מצוות במקור</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">במקור — ניהול תקלות</h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          תקלה חדשה
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">כל הסטטוסים</option>
          <option value="open">פתוח</option>
          <option value="in_progress">בטיפול</option>
          <option value="closed">הושלם</option>
        </select>
        {projects.length > 0 && (
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="all">כל הפרויקטים</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'פרויקט', 'תיאור', 'סטטוס', 'עובד משויך', 'תאריך'].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">אין תקלות</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-600">{t.project || '—'}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || STATUS_COLORS.open}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.assigned_to || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString('he-IL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">תקלה חדשה</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">פרויקט</label>
                <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} placeholder="שם הפרויקט" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="תיאור התקלה..." rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עובד משויך</label>
                  <input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} placeholder="שם העובד" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="open">פתוח</option>
                    <option value="in_progress">בטיפול</option>
                    <option value="closed">הושלם</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveTicket} disabled={saving || !form.description.trim()} className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors">
                {saving ? 'שומר...' : 'צור תקלה'}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
