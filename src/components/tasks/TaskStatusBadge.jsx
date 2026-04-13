import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function TaskStatusBadge({ status, language }) {
  const statusConfig = {
    open: {
      label: language === 'he' ? 'פתוח' : 'Open',
      variant: 'outline',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    in_progress: {
      label: language === 'he' ? 'בעבודה' : 'In Progress',
      variant: 'outline',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    completed: {
      label: language === 'he' ? 'הושלם' : 'Completed',
      variant: 'outline',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    on_hold: {
      label: language === 'he' ? 'עצור' : 'On Hold',
      variant: 'outline',
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    }
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}
