import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, Clock, X } from 'lucide-react';

export default function InsightCard({ insight, onAction, onDismiss }) {
  const typeIcons = {
    suggestion: Lightbulb,
    warning: AlertTriangle,
    opportunity: TrendingUp,
    trend: Sparkles,
    reminder: Clock
  };

  const typeColors = {
    suggestion: 'bg-blue-100 text-blue-600',
    warning: 'bg-red-100 text-red-600',
    opportunity: 'bg-green-100 text-green-600',
    trend: 'bg-purple-100 text-purple-600',
    reminder: 'bg-yellow-100 text-yellow-600'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const Icon = typeIcons[insight.type] || Sparkles;

  return (
    <Card className="relative">
      <CardContent className="p-6">
        <button
          onClick={onDismiss}
          className="absolute top-4 left-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[insight.type]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{insight.title}</h3>
              <Badge className={priorityColors[insight.priority]}>
                {insight.priority === 'urgent' ? 'דחוף' : insight.priority === 'high' ? 'גבוה' : insight.priority === 'medium' ? 'בינוני' : 'נמוך'}
              </Badge>
            </div>
            <p className="text-gray-600 mb-4">{insight.description}</p>
            
            {insight.action_required && insight.action_text && (
              <Button onClick={onAction} className="bg-black hover:bg-gray-800">
                {insight.action_text}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}