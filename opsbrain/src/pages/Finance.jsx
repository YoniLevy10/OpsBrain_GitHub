// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { PageLoader } from '@/components/Spinner';

const emptyForm = { type: 'income', amount: '', currency: 'ILS', description: '', date: new Date().toISOString().split('T')[0] };

export default function Finance() {
  const { user, workspaceId: authWs } = useAuth();
  const [records, setRecords] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('income');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) initWorkspace(); }, [user, authWs]);

  const initWorkspace = async () => {
    if (authWs) {
      setWorkspaceId(authWs);
      fetchRecords(authWs);
      return;
    }
    const { data } = await supabase
      .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
    const wsId = data?.workspace_id;
    setWorkspaceId(wsId);
    if (wsId) fetchRecords(wsId);
    else setLoading(false);
  };

  const fetchRecords = async (wsId) => {
    setLoading(true);
    const { data } = await supabase
      .from('finance_records').select('*').eq('workspace_id', wsId).order('date', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  const saveRecord = async () => {
    if (!form.amount || !workspaceId) return;
    setSaving(true);
    const { data, error } = await supabase.from('finance_records').insert({
      workspace_id: workspaceId,
      type: form.type,
      amount: parseFloat(form.amount),
      currency: form.currency,
      description: form.description,
      date: form.date,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setRecords(prev => [data, ...prev]);
      setForm(emptyForm);
      setModalOpen(false);
    }
  };

  const list = records ?? [];
  const filtered = list.filter(r => r.type === tab);
  const total = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // Simple bar chart data — last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('he-IL', { month: 'short' }) };
  });

  const monthlyData = months.map(m => {
    const inc = list.filter(r => r.type === 'income' && new Date(r.date).getMonth() === m.month && new Date(r.date).getFullYear() === m.year).reduce((s, r) => s + Number(r.amount), 0);
    const exp = list.filter(r => r.type === 'expense' && new Date(r.date).getMonth() === m.month && new Date(r.date).getFullYear() === m.year).reduce((s, r) => s + Number(r.amount), 0);
    return { ...m, income: inc, expense: exp };
  });

  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">פיננסים</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          הוסף רשומה
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('income')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'income' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          הכנסות
        </button>
        <button onClick={() => setTab('expense')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'expense' ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          הוצאות
        </button>
      </div>

      {/* Total */}
      <div className={`rounded-2xl p-5 mb-5 ${tab === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-2">
          {tab === 'income' ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
          <span className="text-sm text-gray-500">{tab === 'income' ? 'סך הכנסות' : 'סך הוצאות'}</span>
        </div>
        <p className={`text-3xl font-bold mt-1 ${tab === 'income' ? 'text-green-700' : 'text-red-600'}`}>
          ₪{total.toLocaleString()}
        </p>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <p className="text-sm font-semibold text-gray-500 mb-4">6 חודשים אחרונים</p>
        <div className="flex items-end gap-2 h-32">
          {monthlyData.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-24">
                <div
                  className="flex-1 bg-green-400 rounded-t-sm transition-all"
                  style={{ height: `${(m.income / maxVal) * 100}%` }}
                  title={`הכנסות: ₪${m.income.toLocaleString()}`}
                />
                <div
                  className="flex-1 bg-red-400 rounded-t-sm transition-all"
                  style={{ height: `${(m.expense / maxVal) * 100}%` }}
                  title={`הוצאות: ₪${m.expense.toLocaleString()}`}
                />
              </div>
              <span className="text-xs text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 bg-green-400 rounded-sm inline-block" />הכנסות</span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" />הוצאות</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['תאריך', 'תיאור', 'סכום', 'מטבע'].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">אין רשומות עדיין</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{new Date(r.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3 text-gray-800">{r.description || '—'}</td>
                  <td className={`px-4 py-3 font-semibold ${tab === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tab === 'income' ? '+' : '-'}₪{Number(r.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.currency}</td>
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
              <h2 className="text-lg font-bold text-gray-900">רשומה חדשה</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500">
                    <option value="income">הכנסה</option>
                    <option value="expense">הוצאה</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מטבע</label>
                  <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500">
                    <option value="ILS">₪ ILS</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סכום *</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="תיאור הרשומה" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveRecord} disabled={saving || !form.amount} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
                {saving ? 'שומר...' : 'שמור'}
              </button>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
