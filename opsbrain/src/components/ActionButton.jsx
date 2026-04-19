import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ActionButton({ 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  disabled,
  className,
  ...props 
}) {
  return (
    <Button 
      disabled={isLoading || disabled}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}