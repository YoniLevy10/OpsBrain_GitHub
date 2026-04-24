import { useMemo, useState } from 'react';
import { PageLoader } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';
import { useFinance } from '@/hooks/useFinance';
import { DollarSign, Plus, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EMPTY_FORM = {
  type: 'income',
  amount: '',
  currency: 'ILS',
  description: '',
  date: new Date().toISOString().split('T')[0],
};

export default function Finance() {
  const { records, loading, addRecord, deleteRecord: removeRecord, totals } = useFinance();
  const [tab, setTab] = useState('income');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.amount || isNaN(Number(form.amount))) {
      toast.error('סכום חובה');
      return;
    }
    setSaving(true);
    try {
      await addRecord({
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description,
        date: form.date,
      });
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בשמירה');
      setSaving(false);
      return;
    }
    toast.success('רשומה נוספה');
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const deleteRecord = async (id) => {
    if (!confirm('למחוק רשומה זו?')) return;
    try {
      await removeRecord(id);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה במחיקה');
    }
  };

  const filtered = useMemo(() => (records ?? []).filter((r) => r.type === tab), [records, tab]);
  const total = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount || 0), 0), [filtered]);
  const totalIncome = totals.totalIncome;
  const totalExpense = totals.totalExpense;

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('he-IL', { month: 'short' }),
    };
  });
  const chartData = months.map((m) => ({
    label: m.label,
    income: records
      .filter((r) => r.type === 'income' && r.date?.startsWith(m.key))
      .reduce((s, r) => s + Number(r.amount || 0), 0),
    expense: records
      .filter((r) => r.type === 'expense' && r.date?.startsWith(m.key))
      .reduce((s, r) => s + Number(r.amount || 0), 0),
  }));
  const maxVal = Math.max(1, ...chartData.map((d) => Math.max(d.income, d.expense)));
  const chartH = 120;
  const chartW = 480;
  const barW = 30;
  const gap = 20;

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-700" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">פיננסים</h1>
              <p className="text-sm text-slate-500 mt-1">תמונה פיננסית מרוכזת לפי מרחב עבודה</p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 ml-2" />
            הוסף רשומה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'סה״כ הכנסות',
            value: `₪${totalIncome.toLocaleString()}`,
            Icon: TrendingUp,
            iconBg: 'bg-emerald-50',
            iconText: 'text-emerald-700',
          },
          {
            label: 'סה״כ הוצאות',
            value: `₪${totalExpense.toLocaleString()}`,
            Icon: TrendingDown,
            iconBg: 'bg-red-50',
            iconText: 'text-red-700',
          },
          {
            label: 'רווח נקי',
            value: `₪${(totalIncome - totalExpense).toLocaleString()}`,
            Icon: Calculator,
            iconBg: totalIncome - totalExpense >= 0 ? 'bg-sky-50' : 'bg-amber-50',
            iconText: totalIncome - totalExpense >= 0 ? 'text-sky-700' : 'text-amber-700',
          },
        ].map((k) => (
          <Card key={k.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{k.label}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">{k.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${k.iconBg} border border-slate-200/60 flex items-center justify-center`}
                >
                  <k.Icon className={`w-5 h-5 ${k.iconText}`} aria-hidden />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 overflow-x-auto shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">6 חודשים אחרונים</h2>
        <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full min-w-[320px]">
          {chartData.map((d, i) => {
            const x = i * (barW * 2 + gap) + 10;
            const ih = (d.income / maxVal) * chartH;
            const eh = (d.expense / maxVal) * chartH;
            return (
              <g key={i}>
                <rect x={x} y={chartH - ih} width={barW} height={ih} fill="#10B981" fillOpacity="0.8" rx="3" />
                <rect x={x + barW + 2} y={chartH - eh} width={barW} height={eh} fill="#EF4444" fillOpacity="0.8" rx="3" />
                <text x={x + barW} y={chartH + 18} textAnchor="middle" fontSize="10" fill="#9CA3AF">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex gap-4 text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500 inline-block" />
            הכנסות
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" />
            הוצאות
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[
            ['income', 'הכנסות'],
            ['expense', 'הוצאות'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${tab === val ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500'}`}
            >
              {label} ({records.filter((r) => r.type === val).length})
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            Icon={DollarSign}
            title={`אין ${tab === 'income' ? 'הכנסות' : 'הוצאות'} עדיין`}
            action="הוסף ראשון"
            onAction={() => {
              setForm((p) => ({ ...p, type: tab }));
              setShowModal(true);
            }}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['תאריך', 'תיאור', 'סכום', 'מטבע', 'פעולות'].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {r.date ? new Date(r.date).toLocaleDateString('he-IL') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{r.description || '—'}</td>
                  <td
                    className={`px-4 py-3 font-semibold ${r.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {r.type === 'income' ? '+' : '-'}₪{Number(r.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.currency}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRecord(r.id)} className="text-red-400 text-xs hover:underline">
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                <td colSpan={2} className="px-4 py-3 text-gray-700">
                  סה״כ
                </td>
                <td className={`px-4 py-3 ${tab === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tab === 'income' ? '+' : '-'}₪{total.toLocaleString()}
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>רשומה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>סוג</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="income">הכנסה</option>
                <option value="expense">הוצאה</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>סכום</Label>
              <Input
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="סכום *"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>מטבע</Label>
              <select
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="ILS">₪ שקל</option>
                <option value="USD">$ דולר</option>
                <option value="EUR">€ אירו</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="תיאור"
              />
            </div>
            <div className="space-y-2">
              <Label>תאריך</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              ביטול
            </Button>
            <Button disabled={saving} onClick={save} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'שומר…' : 'שמור'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
