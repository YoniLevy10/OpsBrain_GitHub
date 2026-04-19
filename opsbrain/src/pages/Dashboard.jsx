// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  CheckSquare, Users, FileText, TrendingUp,
  Plus, AlertCircle, Clock, CheckCircle2, Brain
} from 'lucide-react';

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusIcons = {
  todo: <Clock className="w-3.5 h-3.5 text-gray-400" />,
  in_progress: <AlertCircle className="w-3.5 h-3.5 text-blue-500" />,
  done: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  blocked: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ tasks: 0, contacts: 0, documents: 0, income: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'משתמש';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get workspace
      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const wsId = member?.workspace_id;
      setWorkspaceId(wsId);
      if (!wsId) return;

      const [tasksRes, contactsRes, docsRes, financeRes, recentRes] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact' }).eq('workspace_id', wsId).neq('status', 'done'),
        supabase.from('contacts').select('id', { count: 'exact' }).eq('workspace_id', wsId),
        supabase.from('documents').select('id', { count: 'exact' }).eq('workspace_id', wsId),
        supabase.from('finance_records').select('amount').eq('workspace_id', wsId).eq('type', 'income'),
        supabase.from('tasks').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(5),
      ]);

      const income = (financeRes.data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

      setStats({
        tasks: tasksRes.count || 0,
        contacts: contactsRes.count || 0,
        documents: docsRes.count || 0,
        income,
      });
      setRecentTasks(recentRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { label: 'משימות פתוחות', value: stats.tasks, icon: CheckSquare, color: 'bg-[#6C63FF]', text: 'text-[#6C63FF]', bg: 'bg-purple-50' },
    { label: 'לקוחות', value: stats.contacts, icon: Users, color: 'bg-[#00D4AA]', text: 'text-[#00D4AA]', bg: 'bg-teal-50' },
    { label: 'מסמכים', value: stats.documents, icon: FileText, color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'הכנסות החודש', value: `₪${stats.income.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-50' },
  ];

  const quickActions = [
    { label: '+ משימה', href: '/Tasks', color: 'bg-[#6C63FF] text-white hover:bg-[#5a52e0]' },
    { label: '+ לקוח', href: '/Contacts', color: 'bg-[#00D4AA] text-white hover:bg-[#00b893]' },
    { label: '+ מסמך', href: '/Documents', color: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '+ הוצאה', href: '/Finance', color: 'bg-green-500 text-white hover:bg-green-600' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Welcome */}
      <div className="bg-[#1A1A2E] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#6C63FF] rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{greeting}, {fullName} 👋</h1>
            <p className="text-gray-400 text-sm">ברוך הבא ל-OpsBrain</p>
          </div>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#00D4AA] rounded-full animate-pulse" />
          <p className="text-sm text-gray-300">המערכת פעילה ומוכנה לשימוש</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, text, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-white`}>
            <Icon className={`w-5 h-5 ${text} mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">פעולות מהירות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, href, color }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              className={`${color} rounded-xl py-3 px-4 text-sm font-semibold transition-colors text-center`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">משימות אחרונות</h2>
          <button onClick={() => navigate('/Tasks')} className="text-[#6C63FF] text-sm font-medium hover:underline">
            כל המשימות →
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">טוען...</div>
          ) : recentTasks.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">אין משימות עדיין</div>
          ) : recentTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3">
              {statusIcons[task.status] || statusIcons.todo}
              <span className="flex-1 text-sm text-gray-800 truncate">{task.title}</span>
              {task.priority && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.medium}`}>
                  {task.priority}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
