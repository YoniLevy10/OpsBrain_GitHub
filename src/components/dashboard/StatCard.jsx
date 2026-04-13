import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500',
    slate: 'bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-400',
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900',
    red: 'text-red-900',
    slate: 'text-slate-900',
  };

  return (
    <Card className={cn('border-0 shadow-md hover:shadow-lg transition-shadow', colorClasses[color])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn('text-3xl font-bold', textColorClasses[color])}>{value}</p>
              {trend && trend !== 0 && (
                <span className={cn('text-xs font-semibold', trend > 0 ? 'text-green-600' : 'text-red-600')}>
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', colorClasses[color].split('border')[0])}>
              <Icon className={cn('w-6 h-6', textColorClasses[color])} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
