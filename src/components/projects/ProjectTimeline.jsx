import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Circle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

export default function ProjectTimeline({ project, tasks = [] }) {
  const projectTasks = tasks.filter(t => t.related_project_id === project.id);
  
  const startDate = project.start_date ? new Date(project.start_date) : new Date();
  const endDate = project.end_date ? new Date(project.end_date) : new Date();
  const today = new Date();
  
  const totalDays = differenceInDays(endDate, startDate);
  const elapsedDays = differenceInDays(today, startDate);
  const timeProgress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  const milestones = [
    { date: startDate, label: 'התחלה', status: 'completed' },
    ...(project.milestones || []).map((m, i) => ({
      date: new Date(startDate.getTime() + ((i + 1) * totalDays / (project.milestones.length + 1)) * 24 * 60 * 60 * 1000),
      label: m,
      status: differenceInDays(today, new Date(startDate.getTime() + ((i + 1) * totalDays / (project.milestones.length + 1)) * 24 * 60 * 60 * 1000)) > 0 ? 'completed' : 'pending'
    })),
    { date: endDate, label: 'סיום', status: differenceInDays(today, endDate) > 0 ? 'completed' : 'pending' }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          ציר זמן
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* התקדמות זמן */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{format(startDate, 'dd MMM yyyy', { locale: he })}</span>
            <span>{Math.round(timeProgress)}% מהזמן חלף</span>
            <span>{format(endDate, 'dd MMM yyyy', { locale: he })}</span>
          </div>
          <Progress value={timeProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{elapsedDays} ימים</span>
            <span>{Math.max(0, totalDays - elapsedDays)} ימים נותרו</span>
          </div>
        </div>

        {/* אבני דרך */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">אבני דרך</h4>
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1">
                {milestone.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${milestone.status === 'completed' ? 'text-gray-900' : 'text-gray-500'}`}>
                  {milestone.label}
                </p>
                <p className="text-sm text-gray-500">
                  {format(milestone.date, 'dd MMM yyyy', { locale: he })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* משימות */}
        {projectTasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">משימות</h4>
            {projectTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {task.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-blue-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}