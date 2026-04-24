import { useMemo, useState } from 'react';
import { PageLoader } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';
import { useContacts } from '@/hooks/useContacts';
import { Users, Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPE_LABELS = { client: 'לקוח', supplier: 'ספק', partner: 'שותף' };
const TYPE_COLORS = {
  client: 'bg-teal-100 text-teal-700',
  supplier: 'bg-purple-100 text-purple-700',
  partner: 'bg-blue-100 text-blue-700',
};

const EMPTY_FORM = { name: '', company: '', email: '', phone: '', type: 'client', notes: '' };

export default function Contacts() {
  const { contacts, loading, upsertContact, deleteContact: removeContact, refresh } = useContacts();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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
    try {
      await upsertContact(editItem ? { id: editItem, ...form } : { ...form });
      toast.success(editItem ? 'איש קשר עודכן' : 'איש קשר נוסף');
    } catch (e) {
      console.error(e);
      toast.error(editItem ? 'שגיאה בעדכון' : 'שגיאה בהוספה');
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowModal(false);
    await refresh();
  };

  const deleteContact = async (id) => {
    if (!confirm('למחוק איש קשר זה?')) return;
    try {
      await removeContact(id);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה במחיקה');
      return;
    }
    toast.success('נמחק');
  };

  const filtered = useMemo(() => {
    return (contacts ?? []).filter((c) => {
      const matchSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || c.type === filterType;
      return matchSearch && matchType;
    });
  }, [contacts, filterType, search]);

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="לקוחות וספקים"
        subtitle="ניהול אנשי קשר לפי סוג"
        Icon={Users}
        actions={
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 ml-2" />
            איש קשר
          </Button>
        }
      />
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש..."
          className="flex-1 min-w-48 bg-white"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כולם</SelectItem>
            <SelectItem value="client">לקוחות</SelectItem>
            <SelectItem value="supplier">ספקים</SelectItem>
            <SelectItem value="partner">שותפים</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          Icon={Users}
          title="אין אנשי קשר עדיין"
          subtitle="הוסף לקוחות וספקים לניהול קשרי עסקים"
          action="הוסף ראשון"
          onAction={openAdd}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['שם', 'חברה', 'טלפון', 'אימייל', 'סוג', 'פעולות'].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-medium text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[c.type] || 'bg-gray-100'}`}
                    >
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-indigo-700 text-xs hover:underline">
                        ערוך
                      </button>
                      <button onClick={() => deleteContact(c.id)} className="text-red-600 text-xs hover:underline">
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'עריכת איש קשר' : 'איש קשר חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>שם</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>חברה</Label>
              <Input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>אימייל</Label>
                <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>טלפון</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>סוג</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">לקוח</SelectItem>
                  <SelectItem value="supplier">ספק</SelectItem>
                  <SelectItem value="partner">שותף</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                ביטול
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'שומר...' : 'שמור'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
