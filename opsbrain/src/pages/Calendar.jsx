// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const PRIORITY_COLORS = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-200 text-blue-800',
  high: 'bg-orange-200 text-orange-800',
  urgent: 'bg-red-200 text-red-800',
};

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function Calendar() {
  const { user, workspaceId: authWs } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => { if (user) initWorkspace(); }, [user, authWs]);

  const initWorkspace = async () => {
    if (authWs) {
      setWorkspaceId(authWs);
      fetchTasks(authWs);
      return;
    }
    const { data } = await supabase
      .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle();
    const wsId = data?.workspace_id;
    setWorkspaceId(wsId);
    if (wsId) fetchTasks(wsId);
    else setLoading(false);
  };

  const fetchTasks = async (wsId) => {
    setLoading(true);
    const { data } = await supabase
      .from('tasks').select('*').eq('workspace_id', wsId).not('due_date', 'is', null);
    setTasks(data || []);
    setLoading(false);
  };

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => { setCurrent(new Date()); setSelectedDay(null); };

  const tasksByDay = {};
  (tasks || []).forEach(t => {
    if (!t.due_date) return;
    const d = new Date(t.due_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(t);
    }
  });

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] || []) : [];

  const monthName = current.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto" dir="rtl">
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">יומן</h1>
        <button onClick={goToday} className="text-sm bg-[#6C63FF] text-white px-3 py-1.5 rounded-lg hover:bg-[#5a52e0] transition-colors">
          היום
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">{monthName}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center py-2.5 text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-16 border-b border-gray-50 bg-gray-50/50" />;
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0, 0, 0, 0);
            const isToday = dayDate.getTime() === today.getTime();
            const isSelected = selectedDay === day;
            const dayTasks = tasksByDay[day] || [];
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-16 border-b border-gray-50 p-1.5 flex flex-col items-start transition-colors ${
                  isSelected ? 'bg-[#6C63FF]/10' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${
                  isToday ? 'bg-[#6C63FF] text-white' : isSelected ? 'text-[#6C63FF]' : 'text-gray-700'
                }`}>
                  {day}
                </span>
                <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} className={`text-xs px-1 py-0.5 rounded truncate ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium}`}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-xs text-gray-400">+{dayTasks.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            משימות ל-{selectedDay}/{month + 1}/{year}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-gray-400 text-sm">אין משימות ליום זה</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${t.priority === 'urgent' ? 'bg-red-500' : t.priority === 'high' ? 'bg-orange-500' : t.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  <span className="text-sm text-gray-800 flex-1">{t.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
