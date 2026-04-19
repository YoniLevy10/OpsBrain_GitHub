import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  variant = 'default',
  isRTL = false 
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  const variants = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
    secondary: 'bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20',
  };
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-md",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          
          {typeof change === 'number' && (
            <div className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              isPositive && "bg-secondary/10 text-secondary",
              isNegative && "bg-destructive/10 text-destructive",
              !isPositive && !isNegative && "bg-muted text-muted-foreground"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              <span>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            variant === 'primary' && "bg-primary/10 text-primary",
            variant === 'secondary' && "bg-secondary/10 text-secondary",
            variant === 'default' && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
