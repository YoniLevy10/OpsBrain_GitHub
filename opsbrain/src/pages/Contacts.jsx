import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';

const TYPE_LABELS = { client: 'לקוח', supplier: 'ספק', partner: 'שותף' };
const TYPE_COLORS = {
  client: 'bg-teal-100 text-teal-700',
  supplier: 'bg-purple-100 text-purple-700',
  partner: 'bg-blue-100 text-blue-700',
};

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', type: 'client', notes: '' };

export default function Contacts() {
  const { workspaceId } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspaceId) fetchContacts();
  }, [workspaceId]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setShowModal(true);
  };
  const openEdit = (c) => {
    setForm({
      name: c.name,
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      type: c.type,
      notes: c.notes || '',
    });
    setEditItem(c.id);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('שם חובה');
      return;
    }
    setSaving(true);
    if (editItem) {
      const { error } = await supabase
        .from('contacts')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editItem);
      if (error) {
        toast.error('שגיאה בעדכון');
        setSaving(false);
        return;
      }
      toast.success('איש קשר עודכן');
    } else {
      const { error } = await supabase.from('contacts').insert({ ...form, workspace_id: workspaceId });
      if (error) {
        toast.error('שגיאה בהוספה');
        setSaving(false);
        return;
      }
      toast.success('איש קשר נוסף');
    }
    setSaving(false);
    setShowModal(false);
    fetchContacts();
  };

  const deleteContact = async (id) => {
    if (!confirm('למחוק איש קשר זה?')) return;
    await supabase.from('contacts').delete().eq('id', id);
    fetchContacts();
    toast.success('נמחק');
  };

  const filtered = contacts.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">לקוחות וספקים</h1>
        <button
          onClick={openAdd}
          className="bg-[#6C63FF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          + איש קשר
        </button>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">כולם</option>
          <option value="client">לקוחות</option>
          <option value="supplier">ספקים</option>
          <option value="partner">שותפים</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="אין אנשי קשר עדיין"
          subtitle="הוסף לקוחות וספקים לניהול קשרי עסקים"
          action="+ הוסף ראשון"
          onAction={openAdd}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['שם', 'חברה', 'טלפון', 'אימייל', 'סוג', 'פעולות'].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[c.type] || 'bg-gray-100'}`}
                    >
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-500 text-xs hover:underline">
                        ערוך
                      </button>
                      <button onClick={() => deleteContact(c.id)} className="text-red-400 text-xs hover:underline">
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editItem ? 'עריכת איש קשר' : 'איש קשר חדש'}</h2>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="שם מלא *"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                placeholder="חברה"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="אימייל"
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="טלפון"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="client">לקוח</option>
                <option value="supplier">ספק</option>
                <option value="partner">שותף</option>
              </select>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="הערות"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-[#6C63FF] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'שמור'}
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
