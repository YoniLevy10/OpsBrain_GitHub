import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import { toast } from 'sonner';
import { format, startOfMonth, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function monthKey(d) {
  return format(d, 'yyyy-MM');
}

export default function Analytics() {
  const { workspaceId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientsCount, setClientsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [monthIncome, setMonthIncome] = useState(0);
  const [financeRows, setFinanceRows] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      setLoading(true);
      try {
        const since = startOfMonth(subMonths(new Date(), 5));

        const [
          { count: clientsCnt, error: e1 },
          { count: projectsCnt, error: e2 },
          { data: taskRows, error: e3 },
          { data: finRows, error: e4 },
        ] = await Promise.all([
          supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
          supabase.from('projects').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
          supabase.from('tasks').select('id,status').eq('workspace_id', workspaceId),
          supabase
            .from('finance_records')
            .select('type,amount,created_at')
            .eq('workspace_id', workspaceId)
            .eq('type', 'income')
            .gte('created_at', since.toISOString()),
        ]);

        if (e1 || e2 || e3 || e4) throw e1 || e2 || e3 || e4;

        setClientsCount(clientsCnt ?? 0);
        setProjectsCount(projectsCnt ?? 0);
        const trows = taskRows ?? [];
        setTasks(trows);
        setOpenTasks(trows.filter((t) => t.status !== 'done' && t.status !== 'completed').length);

        const fins = finRows ?? [];
        setFinanceRows(fins);
        const curKey = monthKey(new Date());
        setMonthIncome(
          fins.filter((r) => monthKey(new Date(r.created_at)) === curKey).reduce((s, r) => s + Number(r.amount || 0), 0)
        );
      } catch (e) {
        console.error(e);
        toast.error('שגיאה בטעינת אנליטיקה');
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId]);

  const incomeByMonth = useMemo(() => {
    const map = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const d = subMonths(new Date(), i);
      map.set(monthKey(d), { key: monthKey(d), label: format(d, 'MMM', { locale: he }), income: 0 });
    }
    for (const r of financeRows) {
      const k = monthKey(new Date(r.created_at));
      if (!map.has(k)) continue;
      const row = map.get(k);
      row.income += Number(r.amount || 0);
      map.set(k, row);
    }
    return Array.from(map.values());
  }, [financeRows]);

  const taskStatusPie = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0, other: 0 };
    for (const t of tasks) {
      if (t.status === 'todo') counts.todo += 1;
      else if (t.status === 'in_progress') counts.in_progress += 1;
      else if (t.status === 'done' || t.status === 'completed') counts.done += 1;
      else counts.other += 1;
    }
    return [
      { name: 'לביצוע', value: counts.todo, color: '#6B46C1' },
      { name: 'בתהליך', value: counts.in_progress, color: '#8B5CF6' },
      { name: 'הושלם', value: counts.done, color: '#10B981' },
      { name: 'אחר', value: counts.other, color: '#A0A0C0' },
    ].filter((x) => x.value > 0);
  }, [tasks]);

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">ניתוח עסקי</h1>
        <p className="text-[#A0A0C0] mt-1">תובנות ומדדים בזמן אמת מהנתונים שלך ב-Supabase</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ לקוחות', value: clientsCount },
          { label: 'סה״כ פרויקטים', value: projectsCount },
          { label: 'הכנסות החודש', value: `₪${monthIncome.toLocaleString()}` },
          { label: 'משימות פתוחות', value: openTasks },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#2A2A45] bg-[#1E1E35] p-4">
            <div className="text-sm text-[#A0A0C0]">{k.label}</div>
            <div className="text-3xl font-bold text-white mt-2">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#2A2A45] bg-[#1E1E35] p-4">
          <div className="text-white font-semibold mb-3">הכנסות לפי חודש</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeByMonth}>
                <CartesianGrid stroke="#2A2A45" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#A0A0C0" />
                <YAxis stroke="#A0A0C0" />
                <Tooltip
                  contentStyle={{ background: '#0F0F1A', border: '1px solid #2A2A45', borderRadius: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="income" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2A2A45] bg-[#1E1E35] p-4">
          <div className="text-white font-semibold mb-3">משימות לפי סטטוס</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {taskStatusPie.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0F0F1A', border: '1px solid #2A2A45', borderRadius: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
