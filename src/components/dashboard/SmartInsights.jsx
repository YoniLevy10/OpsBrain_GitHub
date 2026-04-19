import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SmartInsights({ insights = [] }) {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  if (!insights || insights.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">
                {isRTL ? '✓ כל המערכות פועלות בצורה חלקה' : '✓ All systems running smoothly'}
              </p>
              <p className="text-sm text-green-700 mt-1">
                {isRTL
                  ? 'אין בעיות לתיקון. המשך בעבודה הטובה!'
                  : 'No issues to address. Keep up the great work!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'attention':
        return <Clock className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-red-50 border-l-4 border-red-500',
          text: 'text-red-900',
          subtext: 'text-red-700',
          icon: 'text-red-600',
        };
      case 'attention':
        return {
          container: 'bg-orange-50 border-l-4 border-orange-500',
          text: 'text-orange-900',
          subtext: 'text-orange-700',
          icon: 'text-orange-600',
        };
      case 'success':
        return {
          container: 'bg-green-50 border-l-4 border-green-500',
          text: 'text-green-900',
          subtext: 'text-green-700',
          icon: 'text-green-600',
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-l-4 border-blue-500',
          text: 'text-blue-900',
          subtext: 'text-blue-700',
          icon: 'text-blue-600',
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Zap className="w-5 h-5 text-amber-600" />
        <h2 className="font-semibold text-gray-900">
          {isRTL ? '🧠 תובנות חכמות' : '🧠 Smart Insights'}
        </h2>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
          {insights.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight) => {
          const styles = getTypeStyles(insight.type);
          return (
            <Card key={insight.id} className={cn('border-0 shadow-md', styles.container)}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className={cn('flex-shrink-0 mt-1', styles.icon)}>
                    {getTypeIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn('font-semibold', styles.text)}>{insight.title}</h3>
                    <p className={cn('text-sm mt-1', styles.subtext)}>
                      {insight.description}
                    </p>
                    {insight.actionUrl && (
                      <a
                        href={insight.actionUrl}
                        className={cn(
                          'text-sm font-medium mt-2 inline-block hover:underline',
                          styles.text
                        )}
                      >
                        {insight.actionText || (isRTL ? 'צפה' : 'View')} →
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
