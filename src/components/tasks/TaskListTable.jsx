import React from 'react';
import { CheckCircle2, Trash2, Edit2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TaskStatusBadge from './TaskStatusBadge';

// Simple date formatting helper
const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function TaskListTable({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  getProjectName,
  getMemberName,
  language
}) {
  const isRTL = language === 'he';

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const projectName = getProjectName(task.project_id);
        const assigneeName = getMemberName(task.assigned_to);
        const isCompleted = task.status === 'completed';
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const isOverdue = dueDate && dueDate < new Date() && !isCompleted;

        return (
          <Card
            key={task.id}
            className="p-4 hover:shadow-md transition-shadow"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start gap-4">
              {/* Completion Checkbox */}
              <button
                onClick={() => onToggleComplete(task)}
                className="mt-1 flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                title={language === 'he' ? 'סמן כהושלם' : 'Toggle completion'}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-sm text-gray-500 mt-1 ${isCompleted ? 'line-through' : ''}`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <TaskStatusBadge status={task.status} language={language} />
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  {projectName && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                      {projectName}
                    </span>
                  )}
                  {task.assigned_to && (
                    <span className="flex items-center gap-1">
                      {language === 'he' ? 'הוקצה ל: ' : 'Assigned: '}
                      {assigneeName}
                    </span>
                  )}
                  {dueDate && (
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                      {language === 'he' ? 'תאריך יעד: ' : 'Due: '}
                      {dueDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                      {isOverdue && ` ⚠️`}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(task.created_date)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(task)}
                  title={language === 'he' ? 'ערוך' : 'Edit'}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title={language === 'he' ? 'מחק' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
