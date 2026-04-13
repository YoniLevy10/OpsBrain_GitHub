import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', text = null }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-600`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}