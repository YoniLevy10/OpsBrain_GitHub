import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }) {
  // OpsBrain theme colors - Purple #6C63FF, Teal #00D4AA
  const colorClasses = {
    blue: 'bg-card border border-border hover:border-primary/30',
    green: 'bg-card border border-border hover:border-secondary/30',
    purple: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20',
    orange: 'bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20',
    red: 'bg-card border border-destructive/20',
    slate: 'bg-card border border-border',
  };

  const iconBgClasses = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-secondary/10 text-secondary',
    purple: 'bg-primary/10 text-primary',
    orange: 'bg-secondary/10 text-secondary',
    red: 'bg-destructive/10 text-destructive',
    slate: 'bg-muted text-muted-foreground',
  };

  const textColorClasses = {
    blue: 'text-foreground',
    green: 'text-foreground',
    purple: 'text-foreground',
    orange: 'text-foreground',
    red: 'text-foreground',
    slate: 'text-foreground',
  };

  return (
    <Card className={cn('rounded-xl shadow-sm hover:shadow-md transition-all duration-200', colorClasses[color])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={cn('text-2xl font-bold', textColorClasses[color])}>{value}</p>
              {trend && trend !== 0 && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                  trend > 0 ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'
                )}>
                  {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div className={cn('p-2.5 rounded-lg', iconBgClasses[color])}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
