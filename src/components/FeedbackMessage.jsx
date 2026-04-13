import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FeedbackMessage({ type = 'info', message, className }) {
  const variants = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    loading: {
      icon: Loader2,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-600'
    }
  };

  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border',
        variant.bgColor,
        variant.borderColor,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon 
        className={cn(
          'w-5 h-5 flex-shrink-0',
          variant.iconColor,
          type === 'loading' && 'animate-spin'
        )} 
      />
      <p className={cn('text-sm font-medium', variant.textColor)}>
        {message}
      </p>
    </div>
  );
}