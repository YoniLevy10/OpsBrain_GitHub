import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { opsbrain } from '@/api/client';
import { PageLoader } from '@/components/Spinner';
import { toast } from 'sonner';
import { Zap, Plus, Activity, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Automations() {
  const { workspaceId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'on_task_created',
    action_type: 'notify_team',
  });

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await opsbrain.entities.Automation.filter({ workspace_id: workspaceId }, '-created_at');
      setRows(data ?? []);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בטעינת אוטומציות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.is_active !== false).length;
    const runs = rows.reduce((s, r) => s + Number(r.run_count || 0), 0);
    const successAvg =
      rows.length === 0 ? 0 : rows.reduce((s, r) => s + Number(r.success_rate || 0), 0) / rows.length;
    return { active, runs, successAvg };
  }, [rows]);

  const create = async () => {
    if (!workspaceId) return;
    if (!form.name.trim()) {
      toast.error('שם אוטומציה חובה');
      return;
    }
    setSaving(true);
    try {
      await opsbrain.entities.Automation.create({
        workspace_id: workspaceId,
        name: form.name.trim(),
        trigger_type: form.trigger_type,
        action_type: form.action_type,
        is_active: true,
        run_count: 0,
        success_rate: 0,
        config: {},
      });
      toast.success('אוטומציה נוצרה');
      setOpen(false);
      setForm({ name: '', trigger_type: 'on_task_created', action_type: 'notify_team' });
      await load();
    } catch (e) {
      console.error(e);
      toast.error('שגיאה ביצירת אוטומציה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-3">
              <Zap className="w-4 h-4" />
              אוטומציות חכמות
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">אוטומציות</h1>
            <p className="text-slate-500 mt-1 text-sm">הפוך תהליכים חוזרים לזרימות עבודה אוטומטיות</p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 ml-2" />
            אוטומציה חדשה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'אוטומציות פעילות', value: kpis.active, Icon: CheckCircle2, iconBg: 'bg-emerald-50', iconText: 'text-emerald-700' },
          { label: 'הרצות סה״כ', value: kpis.runs, Icon: Activity, iconBg: 'bg-sky-50', iconText: 'text-sky-700' },
          { label: 'הצלחה ממוצעת', value: `${Math.round(kpis.successAvg)}%`, Icon: Zap, iconBg: 'bg-indigo-50', iconText: 'text-indigo-700' },
        ].map((k) => (
          <Card key={k.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{k.label}</div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">{k.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl ${k.iconBg} border border-slate-200/60 flex items-center justify-center`}>
                  <k.Icon className={`w-5 h-5 ${k.iconText}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 text-slate-900 font-semibold">האוטומציות שלך</div>
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-slate-500 mb-4">אין אוטומציות עדיין</div>
            <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 ml-2" />
              צור אוטומציה
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {rows.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-slate-900 font-medium truncate">{r.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    טריגר: <span className="text-slate-900/90">{r.trigger_type}</span> · פעולה:{' '}
                    <span className="text-slate-900/90">{r.action_type}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 shrink-0">
                  {r.is_active === false ? 'כבוי' : 'פעיל'} · ריצות: {r.run_count ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>אוטומציה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="למשל: תזכורת ללקוח חדש"
              />
            </div>
            <div className="space-y-2">
              <Label>טריגר</Label>
              <select
                value={form.trigger_type}
                onChange={(e) => setForm((p) => ({ ...p, trigger_type: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="on_new_client">on_new_client</option>
                <option value="on_task_created">on_task_created</option>
                <option value="on_invoice_paid">on_invoice_paid</option>
                <option value="scheduled">scheduled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>פעולה</Label>
              <select
                value={form.action_type}
                onChange={(e) => setForm((p) => ({ ...p, action_type: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="send_email">send_email</option>
                <option value="create_task">create_task</option>
                <option value="notify_team">notify_team</option>
                <option value="update_record">update_record</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button disabled={saving} onClick={create} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'שומר…' : 'שמור'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
