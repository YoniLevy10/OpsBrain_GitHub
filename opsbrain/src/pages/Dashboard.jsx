import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import { detectPatterns } from '../lib/aiPatterns';
import { startOfDay } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, workspaceId, workspaceName } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, contacts: 0, docs: 0, income: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [completedRecently, setCompletedRecently] = useState([]);
  const [createdToday, setCreatedToday] = useState([]);
  const [gmailMock, setGmailMock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    detectPatterns(workspaceId, supabase);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    fetchAll();
  }, [workspaceId]);

  useEffect(() => {
    setGmailMock(Math.floor(3 + Math.random() * 9));
  }, [workspaceId]);

  const fetchAll = async () => {
    setLoading(true);
    const start = startOfDay(new Date()).toISOString();
    const [{ data: tasks }, { data: contacts }, { data: docs }, { data: income }] = await Promise.all([
      supabase.from('tasks').select('id,status').eq('workspace_id', workspaceId),
      supabase.from('contacts').select('id').eq('workspace_id', workspaceId),
      supabase.from('documents').select('id').eq('workspace_id', workspaceId),
      supabase
        .from('finance_records')
        .select('amount')
        .eq('workspace_id', workspaceId)
        .eq('type', 'income'),
    ]);

    const [{ data: latestTasks }, { data: latestContacts }, { data: doneRecent }, { data: todayNew }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('id,title,status,priority,due_date')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('contacts')
          .select('id,name,type,company')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('tasks')
          .select('id,title,status,updated_at')
          .eq('workspace_id', workspaceId)
          .in('status', ['done', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('tasks')
          .select('id,title,status,created_at')
          .eq('workspace_id', workspaceId)
          .gte('created_at', start)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    setStats({
      tasks: (tasks ?? []).filter((t) => t.status !== 'done' && t.status !== 'completed').length,
      contacts: (contacts ?? []).length,
      docs: (docs ?? []).length,
      income: (income ?? []).reduce((s, r) => s + Number(r.amount || 0), 0),
    });
    setRecentTasks(latestTasks ?? []);
    setRecentContacts(latestContacts ?? []);
    setCompletedRecently(doneRecent ?? []);
    setCreatedToday(todayNew ?? []);
    setLoading(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'שם';

  const statusColor = {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-sky-100 text-sky-800',
    done: 'bg-emerald-100 text-emerald-800',
    blocked: 'bg-red-100 text-red-800',
  };
  const priorityColor = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  if (loading) return <PageLoader />;

  const ask = (q) => navigate(`/app/FinancialAssistant?q=${encodeURIComponent(q)}`);

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-600 text-sm font-semibold mb-1">OPSBRAIN AI</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {greeting}, {userName}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {workspaceName || 'מרחב עבודה'} ·{' '}
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-4xl sm:text-5xl opacity-80 select-none" aria-hidden>
            🧠
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            'מה מצב הכסף שלי?',
            'אילו לקוחות לא שילמו?',
            'מה המשימות הדחופות?',
            'צור חשבונית חדשה',
            'סכם את השבוע שלי',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="text-xs px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-indigo-300 hover:bg-indigo-50/60 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'משימות פתוחות', value: stats.tasks, icon: '✅', ring: 'ring-indigo-100' },
          { label: 'לקוחות', value: stats.contacts, icon: '👥', ring: 'ring-emerald-100' },
          { label: 'מסמכים', value: stats.docs, icon: '📄', ring: 'ring-sky-100' },
          { label: 'הכנסות (מצטבר)', value: `₪${stats.income.toLocaleString()}`, icon: '💰', ring: 'ring-amber-100' },
        ].map((kpi, i) => (
          <div
            key={i}
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-2 ${kpi.ring} ring-inset`}
          >
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Gmail</h2>
            <span className="text-xs text-slate-400">אינטגרציה (בקרוב)</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-900">{gmailMock}</div>
          <div className="text-sm text-slate-500 mt-1">הודעות חדשות (דמו)</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-3">השלמות אחרונות</h2>
          {completedRecently.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">אין השלמות להצגה</p>
          ) : (
            <div className="space-y-2">
              {completedRecently.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <span className="text-slate-800 truncate">{t.title}</span>
                  <span className="text-slate-400 text-xs shrink-0">
                    {t.updated_at ? new Date(t.updated_at).toLocaleString('he-IL') : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">חדש היום</h2>
            <button
              type="button"
              onClick={() => navigate('/app/Tasks')}
              className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              +
            </button>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-slate-900">{createdToday.length}</div>
          <div className="text-sm text-slate-500 mt-1">משימות שנוצרו היום</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">משימות אחרונות</h2>
          {recentTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">אין משימות עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      statusColor[task.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.status === 'todo'
                      ? 'לביצוע'
                      : task.status === 'in_progress'
                        ? 'בתהליך'
                        : task.status === 'done' || task.status === 'completed'
                          ? 'הושלם'
                          : 'חסום'}
                  </span>
                  <span className="text-sm text-slate-800 flex-1">{task.title}</span>
                  {task.priority && (
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityColor[task.priority] || ''}`}>
                      {task.priority === 'urgent'
                        ? 'דחוף'
                        : task.priority === 'high'
                          ? 'גבוה'
                          : task.priority === 'medium'
                            ? 'בינוני'
                            : 'נמוך'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">אנשי קשר אחרונים</h2>
          {recentContacts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">אין אנשי קשר עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {c.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.name}</div>
                    {c.company && <div className="text-xs text-slate-500 truncate">{c.company}</div>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {c.type === 'client' ? 'לקוח' : c.type === 'supplier' ? 'ספק' : 'שותף'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '+ משימה חדשה', to: '/app/Tasks' },
            { label: '+ לקוח', to: '/app/Clients' },
            { label: '+ מסמך', to: '/app/Documents' },
            { label: '+ רשומה פיננסית', to: '/app/Finance' },
          ].map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(a.to)}
              className="rounded-lg p-3 text-sm font-medium text-center transition-colors bg-slate-50 border border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
