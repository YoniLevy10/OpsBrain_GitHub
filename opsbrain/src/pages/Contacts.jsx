// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Plus, X, Search } from 'lucide-react';
import { PageLoader } from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';

const TYPE_LABELS = { client: 'לקוח', supplier: 'ספק', partner: 'שותף' };
const TYPE_COLORS = {
  client: 'bg-teal-100 text-teal-700',
  supplier: 'bg-purple-100 text-purple-700',
  partner: 'bg-blue-100 text-blue-700',
};

const emptyForm = { name: '', email: '', phone: '', company: '', type: 'client' };

export default function Contacts() {
  const { user, workspaceId: authWs } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    initWorkspace();
  }, [user, authWs]);

  const initWorkspace = async () => {
    if (authWs) {
      setWorkspaceId(authWs);
      fetchContacts(authWs);
      return;
    }
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (data?.workspace_id) {
      setWorkspaceId(data.workspace_id);
      fetchContacts(data.workspace_id);
    } else {
      setLoading(false);
    }
  };

  const fetchContacts = async (wsId) => {
    setLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', wsId)
      .order('name');
    setContacts(data || []);
    setLoading(false);
  };

  const saveContact = async () => {
    if (!form.name.trim() || !workspaceId) return;
    setSaving(true);
    const { data, error } = await supabase.from('contacts').insert({
      workspace_id: workspaceId,
      name: form.name.trim(),
      email: form.email,
      phone: form.phone,
      company: form.company,
      type: form.type,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm);
      setModalOpen(false);
    }
  };

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">אנשי קשר</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#00D4AA] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#00b893] transition-colors"
        >
          <Plus className="w-4 h-4" />
          איש קשר חדש
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או חברה..."
          className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:border-[#00D4AA]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon="👥"
            title="אין אנשי קשר עדיין"
            subtitle="הוסף לקוח או ספק ראשון — הנתונים נשמרים בטבלת contacts."
            action="איש קשר חדש"
            onAction={() => setModalOpen(true)}
          />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">אין תוצאות לחיפוש</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['שם', 'חברה', 'טלפון', 'אימייל', 'סוג'].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || TYPE_COLORS.client}`}>
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                  </td>
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
              <h2 className="text-lg font-bold text-gray-900">איש קשר חדש</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'שם *', field: 'name', type: 'text', placeholder: 'שם מלא' },
                { label: 'אימייל', field: 'email', type: 'email', placeholder: 'email@example.com' },
                { label: 'טלפון', field: 'phone', type: 'tel', placeholder: '050-0000000' },
                { label: 'חברה', field: 'company', type: 'text', placeholder: 'שם החברה' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00D4AA]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00D4AA]"
                >
                  <option value="client">לקוח</option>
                  <option value="supplier">ספק</option>
                  <option value="partner">שותף</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveContact}
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-[#00D4AA] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#00b893] disabled:opacity-50 transition-colors"
              >
                {saving ? 'שומר...' : 'שמור'}
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
