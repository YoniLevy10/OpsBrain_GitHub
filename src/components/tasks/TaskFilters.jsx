import React from 'react';
import { Button } from '@/components/ui/button';

export default function TaskFilters({ statusFilter, onStatusChange, language }) {
  const isRTL = language === 'he';
  
  const filters = [
    { value: 'all', label: language === 'he' ? 'הכל' : 'All' },
    { value: 'open', label: language === 'he' ? 'פתוחות' : 'Open' },
    { value: 'in_progress', label: language === 'he' ? 'בעבודה' : 'In Progress' },
    { value: 'completed', label: language === 'he' ? 'הושלמו' : 'Completed' },
    { value: 'on_hold', label: language === 'he' ? 'עצורות' : 'On Hold' }
  ];

  return (
    <div 
      className="flex flex-wrap gap-2"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={statusFilter === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange(filter.value)}
          className="cursor-pointer"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
