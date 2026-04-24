import React from 'react';
import { cn } from '@/lib/utils';

export default function PageHeader({ title, subtitle, Icon, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 flex-wrap', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        ) : null}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

