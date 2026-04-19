import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartReminders({ tasks = [] }) {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    generateReminders();
  }, [tasks]);

  const generateReminders = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const newReminders = [];

    // Overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      new Date(t.due_date) < now
    );
    
    if (overdueTasks.length > 0) {
      newReminders.push({
        type: 'urgent',
        title: `${overdueTasks.length} משימות באיחור`,
        description: 'יש לטפל במשימות שעברו את מועד היעד',
        tasks: overdueTasks.slice(0, 3)
      });
    }

    // Due today
    const dueTodayTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date === today
    );

    if (dueTodayTasks.length > 0) {
      newReminders.push({
        type: 'warning',
        title: `${dueTodayTasks.length} משימות להיום`,
        description: 'משימות שצריך להשלים היום',
        tasks: dueTodayTasks.slice(0, 3)
      });
    }

    // High priority open tasks
    const highPriorityTasks = tasks.filter(t => 
      t.status === 'open' && 
      t.priority === 'high'
    );

    if (highPriorityTasks.length > 0) {
      newReminders.push({
        type: 'info',
        title: `${highPriorityTasks.length} משימות בעדיפות גבוהה`,
        description: 'משימות חשובות שממתינות לטיפול',
        tasks: highPriorityTasks.slice(0, 3)
      });
    }

    // Tasks stuck in progress
    const stuckTasks = tasks.filter(t => t.status === 'stuck');
    if (stuckTasks.length > 0) {
      newReminders.push({
        type: 'warning',
        title: `${stuckTasks.length} משימות תקועות`,
        description: 'משימות שצריכות תשומת לב',
        tasks: stuckTasks.slice(0, 3)
      });
    }

    setReminders(newReminders);
  };

  const getIcon = (type) => {
    if (type === 'urgent') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (type === 'warning') return <Clock className="w-5 h-5 text-yellow-500" />;
    return <Bell className="w-5 h-5 text-blue-500" />;
  };

  const getColor = (type) => {
    if (type === 'urgent') return 'bg-red-50 border-red-200';
    if (type === 'warning') return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  if (reminders.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5" />
          תזכורות חכמות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((reminder, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${getColor(reminder.type)}`}>
            <div className="flex items-start gap-3">
              {getIcon(reminder.type)}
              <div className="flex-1">
                <p className="font-semibold mb-1">{reminder.title}</p>
                <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                <div className="space-y-1">
                  {reminder.tasks.map((task, taskIdx) => (
                    <p key={taskIdx} className="text-xs text-gray-500">
                      • {task.title}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}