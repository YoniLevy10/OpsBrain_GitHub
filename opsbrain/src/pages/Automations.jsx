import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { opsbrain } from '@/api/client';
import { PageLoader } from '@/components/Spinner';
import { toast } from 'sonner';
import { Zap, Plus } from 'lucide-react';

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
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-[#2A2A45] text-[#A0A0C0] text-xs mb-3">
            <Zap className="w-4 h-4 text-[#8B5CF6]" />
            חסוך שעות עבודה בשבוע
          </div>
          <h1 className="text-3xl font-bold text-white">אוטומציות</h1>
          <p className="text-[#A0A0C0] mt-1">הפרד משימות חוזרות לאוטומציות חכמות</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B46C1] px-4 py-2 text-white font-semibold hover:bg-[#5b3aa8]"
        >
          <Plus className="w-4 h-4" />
          אוטומציה חדשה
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'אוטומציות פעילות', value: kpis.active },
          { label: 'ביצועים סה״כ', value: kpis.runs },
          { label: 'אחוז הצלחה ממוצע', value: `${Math.round(kpis.successAvg)}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#2A2A45] bg-[#1E1E35] p-4">
            <div className="text-sm text-[#A0A0C0]">{k.label}</div>
            <div className="text-3xl font-bold text-white mt-2">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#2A2A45] bg-[#1E1E35] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A2A45] text-white font-semibold">האוטומציות שלך</div>
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[#A0A0C0] mb-4">אין אוטומציות עדיין</div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl bg-[#6B46C1] px-4 py-2 text-white font-semibold"
            >
              צור אוטומציה
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A45]">
            {rows.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{r.name}</div>
                  <div className="text-xs text-[#A0A0C0] mt-1">
                    טריגר: <span className="text-white/90">{r.trigger_type}</span> · פעולה:{' '}
                    <span className="text-white/90">{r.action_type}</span>
                  </div>
                </div>
                <div className="text-xs text-[#A0A0C0] shrink-0">
                  {r.is_active === false ? 'כבוי' : 'פעיל'} · ריצות: {r.run_count ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#2A2A45] bg-[#1E1E35] p-6">
            <div className="text-white font-bold text-lg mb-4">אוטומציה חדשה</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#A0A0C0]">שם</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl bg-[#0F0F1A] border border-[#2A2A45] px-3 py-2 text-sm text-white"
                  placeholder="למשל: תזכורת ללקוח חדש"
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0C0]">טריגר</label>
                <select
                  value={form.trigger_type}
                  onChange={(e) => setForm((p) => ({ ...p, trigger_type: e.target.value }))}
                  className="mt-1 w-full rounded-xl bg-[#0F0F1A] border border-[#2A2A45] px-3 py-2 text-sm text-white"
                >
                  <option value="on_new_client">on_new_client</option>
                  <option value="on_task_created">on_task_created</option>
                  <option value="on_invoice_paid">on_invoice_paid</option>
                  <option value="scheduled">scheduled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A0A0C0]">פעולה</label>
                <select
                  value={form.action_type}
                  onChange={(e) => setForm((p) => ({ ...p, action_type: e.target.value }))}
                  className="mt-1 w-full rounded-xl bg-[#0F0F1A] border border-[#2A2A45] px-3 py-2 text-sm text-white"
                >
                  <option value="send_email">send_email</option>
                  <option value="create_task">create_task</option>
                  <option value="notify_team">notify_team</option>
                  <option value="update_record">update_record</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-[#A0A0C0] hover:text-white"
              >
                ביטול
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={create}
                className="rounded-xl bg-[#6B46C1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'שומר…' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
