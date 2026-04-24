import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';

const PRIORITY_COLORS = {
  urgent: 'bg-rose-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-blue-600 text-white',
  low: 'bg-slate-200 text-slate-900',
};

export default function Calendar() {
  const { workspaceId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (workspaceId) fetchTasks();
  }, [workspaceId]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority, status')
      .eq('workspace_id', workspaceId)
      .not('due_date', 'is', null);
    setTasks(data ?? []);
    setLoading(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => {
      const d = t.due_date;
      if (!d) return false;
      const s = typeof d === 'string' ? d.slice(0, 10) : '';
      return s === dateStr;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const goToday = () => setCurrentDate(new Date());

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-900">
          {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={goToday}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            היום
          </button>
          <button
            onClick={prevMonth}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ◀
          </button>
          <button
            onClick={nextMonth}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
            <div key={d} className="text-center py-2 sm:py-3 text-xs font-medium text-slate-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="h-16 sm:h-24 border-b border-l border-slate-100" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayTasks = getTasksForDay(day);
            const isToday =
              today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = selectedDay === day;
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-16 sm:h-24 border-b border-l border-slate-100 p-1 cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-indigo-50' : ''}`}
              >
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full mb-1 ${isToday ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700'}`}
                >
                  {day}
                </span>
                <div className="space-y-0.5 hidden sm:block">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={`${PRIORITY_COLORS[t.priority] || 'bg-slate-200 text-slate-900'} text-xs px-1 py-0.5 rounded truncate`}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-500">+{dayTasks.length - 3} נוספות</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3">
            משימות ל-{selectedDay}/{month + 1}/{year} ({selectedTasks.length})
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-slate-500 text-sm">אין משימות ביום זה</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div
                    className={`w-2 h-2 rounded-full ${(PRIORITY_COLORS[t.priority] || 'bg-slate-300').split(' ')[0]} flex-shrink-0`}
                  />
                  <span className="text-sm text-slate-900">{t.title}</span>
                  <span
                    className={`mr-auto text-xs px-2 py-0.5 rounded-full ${t.status === 'done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
                  >
                    {t.status === 'done' ? 'הושלם' : 'פתוח'}
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
