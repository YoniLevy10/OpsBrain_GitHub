import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}) {
  return (
    <Card className={className}>
      <CardContent className="p-12 text-center">
        {Icon && <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="bg-black hover:bg-gray-800">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}