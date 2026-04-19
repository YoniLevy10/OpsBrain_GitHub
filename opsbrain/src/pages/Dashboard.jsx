import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';
import { detectPatterns } from '../lib/aiPatterns';

export default function Dashboard() {
  const { user, workspaceId, workspaceName } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, contacts: 0, docs: 0, income: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    detectPatterns(workspaceId, supabase);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    fetchAll();
  }, [workspaceId]);

  const fetchAll = async () => {
    setLoading(true);
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

    const [{ data: latestTasks }, { data: latestContacts }] = await Promise.all([
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
    ]);

    setStats({
      tasks: (tasks ?? []).filter((t) => t.status !== 'done' && t.status !== 'completed').length,
      contacts: (contacts ?? []).length,
      docs: (docs ?? []).length,
      income: (income ?? []).reduce((s, r) => s + Number(r.amount || 0), 0),
    });
    setRecentTasks(latestTasks ?? []);
    setRecentContacts(latestContacts ?? []);
    setLoading(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'שם';

  const statusColor = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  };
  const priorityColor = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-6 space-y-6">
      <div className="bg-[#1A1A2E] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#00D4AA] text-sm font-medium mb-1">OpsBrain AI</p>
            <h1 className="text-3xl font-bold">
              {greeting}, {userName}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {workspaceName} ·{' '}
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-5xl opacity-20">🧠</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'משימות פתוחות', value: stats.tasks, icon: '✅', color: 'border-purple-500', bg: 'bg-purple-50' },
          { label: 'לקוחות', value: stats.contacts, icon: '👥', color: 'border-teal-500', bg: 'bg-teal-50' },
          { label: 'מסמכים', value: stats.docs, icon: '📄', color: 'border-blue-500', bg: 'bg-blue-50' },
          {
            label: 'הכנסות החודש',
            value: `₪${stats.income.toLocaleString()}`,
            icon: '💰',
            color: 'border-green-500',
            bg: 'bg-green-50',
          },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} border-r-4 ${kpi.color} rounded-xl p-4`}>
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{kpi.value}</div>
            <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">משימות אחרונות</h2>
          {recentTasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">אין משימות עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[task.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {task.status === 'todo'
                      ? 'לביצוע'
                      : task.status === 'in_progress'
                        ? 'בתהליך'
                        : task.status === 'done'
                          ? 'הושלם'
                          : 'חסום'}
                  </span>
                  <span className="text-sm text-gray-700 flex-1">{task.title}</span>
                  {task.priority && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${priorityColor[task.priority] || ''}`}
                    >
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

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">אנשי קשר אחרונים</h2>
          {recentContacts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">אין אנשי קשר עדיין</p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                    {c.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{c.name}</div>
                    {c.company && <div className="text-xs text-gray-400">{c.company}</div>}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.type === 'client'
                        ? 'bg-teal-100 text-teal-700'
                        : c.type === 'supplier'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {c.type === 'client' ? 'לקוח' : c.type === 'supplier' ? 'ספק' : 'שותף'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '+ משימה חדשה', href: '/Tasks', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { label: '+ איש קשר', href: '/Contacts', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
            { label: '+ מסמך', href: '/Documents', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: '+ עסקה', href: '/Finance', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
          ].map((a, i) => (
            <a
              key={i}
              href={a.href}
              className={`${a.color} rounded-lg p-3 text-sm font-medium text-center transition-colors`}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
