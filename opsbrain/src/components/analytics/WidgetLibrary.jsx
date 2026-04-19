import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Users, FileText, CheckSquare, 
  DollarSign, Activity, BarChart3, Sparkles, Plus
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function WidgetLibrary({ onAddWidget }) {
  const { language } = useLanguage();

  const widgets = [
    {
      type: 'revenue_chart',
      title: language === 'he' ? 'תרשים הכנסות' : 'Revenue Chart',
      description: language === 'he' ? 'מעקב אחר הכנסות לאורך זמן' : 'Track revenue over time',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      defaultSize: { w: 6, h: 3 }
    },
    {
      type: 'client_stats',
      title: language === 'he' ? 'סטטיסטיקות לקוחות' : 'Client Stats',
      description: language === 'he' ? 'סקירת לקוחות והתנהגות' : 'Client overview and behavior',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      defaultSize: { w: 4, h: 2 }
    },
    {
      type: 'task_list',
      title: language === 'he' ? 'משימות פעילות' : 'Active Tasks',
      description: language === 'he' ? 'משימות שדורשות תשומת לב' : 'Tasks requiring attention',
      icon: CheckSquare,
      color: 'text-purple-600 bg-purple-50',
      defaultSize: { w: 4, h: 3 }
    },
    {
      type: 'recent_activity',
      title: language === 'he' ? 'פעילות אחרונה' : 'Recent Activity',
      description: language === 'he' ? 'פעולות אחרונות במערכת' : 'Latest system actions',
      icon: Activity,
      color: 'text-indigo-600 bg-indigo-50',
      defaultSize: { w: 4, h: 3 }
    },
    {
      type: 'cash_flow',
      title: language === 'he' ? 'תזרים מזומנים' : 'Cash Flow',
      description: language === 'he' ? 'הכנסות והוצאות' : 'Income vs expenses',
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50',
      defaultSize: { w: 6, h: 2 }
    },
    {
      type: 'top_clients',
      title: language === 'he' ? 'לקוחות מובילים' : 'Top Clients',
      description: language === 'he' ? 'לקוחות בעלי ההכנסה הגבוהה' : 'Highest revenue clients',
      icon: Users,
      color: 'text-teal-600 bg-teal-50',
      defaultSize: { w: 4, h: 2 }
    },
    {
      type: 'project_status',
      title: language === 'he' ? 'סטטוס פרויקטים' : 'Project Status',
      description: language === 'he' ? 'מצב פרויקטים נוכחיים' : 'Current project status',
      icon: FileText,
      color: 'text-cyan-600 bg-cyan-50',
      defaultSize: { w: 4, h: 2 }
    },
    {
      type: 'ai_insights',
      title: language === 'he' ? 'תובנות AI' : 'AI Insights',
      description: language === 'he' ? 'המלצות והתראות חכמות' : 'Smart recommendations',
      icon: Sparkles,
      color: 'text-pink-600 bg-pink-50',
      defaultSize: { w: 6, h: 3 }
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {widgets.map((widget) => {
        const Icon = widget.icon;
        return (
          <Card key={widget.type} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${widget.color} mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <p className="text-xs text-gray-500">{widget.description}</p>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onAddWidget(widget)}
              >
                <Plus className="w-4 h-4 ml-2" />
                {language === 'he' ? 'הוסף' : 'Add'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}