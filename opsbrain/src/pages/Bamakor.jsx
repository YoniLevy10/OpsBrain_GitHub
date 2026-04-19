import { useEffect, useState } from 'react';
import { bamakorSupabase } from '../lib/bamakorSupabase';
import { PageLoader } from '../components/Spinner';

const hasCredentials = !!(import.meta.env.VITE_BAMAKOR_URL && import.meta.env.VITE_BAMAKOR_KEY);

const STATUS_STYLE = {
  open: { label: 'פתוח', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'בטיפול', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700' },
};

export default function Bamakor() {
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ project_id: '', description: '', assigned_worker_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hasCredentials) fetchAll();
    else setLoading(false);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: t }, { data: p }, { data: w }] = await Promise.all([
      bamakorSupabase
        .from('tickets')
        .select('*, projects(name), workers(full_name)')
        .order('created_at', { ascending: false })
        .limit(100),
      bamakorSupabase.from('projects').select('id, name').order('name'),
      bamakorSupabase.from('workers').select('id, full_name').eq('is_active', true),
    ]);
    setTickets(t ?? []);
    setProjects(p ?? []);
    setWorkers(w ?? []);
    setLoading(false);
  };

  const addTicket = async () => {
    if (!form.project_id || !form.description) {
      alert('פרויקט ותיאור חובה');
      return;
    }
    setSaving(true);
    await bamakorSupabase.from('tickets').insert({ ...form, status: 'open' });
    setSaving(false);
    setShowModal(false);
    setForm({ project_id: '', description: '', assigned_worker_id: '' });
    fetchAll();
  };

  if (!hasCredentials)
    return (
      <div dir="rtl" className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">במקור — ניהול נכסים</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="font-semibold text-yellow-800 mb-3">⚙️ נדרשת הגדרה</h2>
          <p className="text-sm text-yellow-700 mb-4">
            כדי לחבר את מודול במקור, הוסף את הפרטים הבאים לקובץ .env.local:
          </p>
          <div className="bg-white rounded-lg p-3 font-mono text-xs border border-yellow-200 space-y-1">
            <div>VITE_BAMAKOR_URL=https://your-bamakor-project.supabase.co</div>
            <div>VITE_BAMAKOR_KEY=your-bamakor-anon-key</div>
          </div>
          <p className="text-xs text-yellow-600 mt-3">אחרי ההוספה — הפעל מחדש את שרת הפיתוח (npm run dev)</p>
        </div>
      </div>
    );

  if (loading) return <PageLoader />;

  const filtered = tickets.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchProject = filterProject === 'all' || t.project_id === filterProject;
    const matchSearch =
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number?.toString().includes(search);
    return matchStatus && matchProject && matchSearch;
  });

  return (
    <div dir="rtl" className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">במקור</h1>
          <p className="text-sm text-gray-400">{tickets.length} תקלות סה״כ</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6C63FF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          + תקלה חדשה
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'פתוחות',
            count: tickets.filter((t) => t.status === 'open').length,
            color: 'border-red-400 bg-red-50 text-red-700',
          },
          {
            label: 'בטיפול',
            count: tickets.filter((t) => t.status === 'in_progress').length,
            color: 'border-yellow-400 bg-yellow-50 text-yellow-700',
          },
          {
            label: 'הושלמו',
            count: tickets.filter((t) => t.status === 'completed').length,
            color: 'border-green-400 bg-green-50 text-green-700',
          },
        ].map((s, i) => (
          <div key={i} className={`border-r-4 ${s.color} rounded-xl p-4`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש תקלה..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="open">פתוח</option>
          <option value="in_progress">בטיפול</option>
          <option value="completed">הושלם</option>
        </select>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">כל הפרויקטים</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['#', 'פרויקט', 'תיאור', 'סטטוס', 'עובד', 'תאריך'].map((h) => (
                <th key={h} className="text-right px-4 py-3 font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-300">
                  אין תקלות להצגה
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-400">{t.ticket_number || t.id?.substring(0, 6)}</td>
                  <td className="px-4 py-3 font-medium">{t.projects?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[t.status]?.color || 'bg-gray-100 text-gray-500'}`}
                    >
                      {STATUS_STYLE[t.status]?.label || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.workers?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('he-IL') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">תקלה חדשה</h2>
            <div className="space-y-3">
              <select
                value={form.project_id}
                onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">בחר פרויקט *</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="תיאור התקלה *"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <select
                value={form.assigned_worker_id}
                onChange={(e) => setForm((p) => ({ ...p, assigned_worker_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">שייך עובד (אופציונלי)</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addTicket}
                disabled={saving}
                className="flex-1 bg-[#6C63FF] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'פתח תקלה'}
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
