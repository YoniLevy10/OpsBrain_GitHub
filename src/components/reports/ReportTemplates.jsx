import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function ReportTemplates({ onSelectTemplate }) {
  const { language } = useLanguage();

  const templates = [
    {
      id: 'monthly-financial',
      name: language === 'he' ? 'דוח פיננסי חודשי' : 'Monthly Financial Report',
      description: language === 'he' ? 'סקירה מלאה של הכנסות, הוצאות ורווחיות' : 'Complete overview of revenue, expenses, and profitability',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      type: 'financial',
      period: 'monthly'
    },
    {
      id: 'client-analysis',
      name: language === 'he' ? 'ניתוח לקוחות' : 'Client Analysis',
      description: language === 'he' ? 'תובנות על התנהגות לקוחות ומעורבות' : 'Insights into client behavior and engagement',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      type: 'client',
      period: 'monthly'
    },
    {
      id: 'project-performance',
      name: language === 'he' ? 'ביצועי פרויקטים' : 'Project Performance',
      description: language === 'he' ? 'מעקב אחר התקדמות ומשאבי פרויקטים' : 'Track project progress and resource utilization',
      icon: BarChart3,
      color: 'text-purple-600 bg-purple-50',
      type: 'project',
      period: 'monthly'
    },
    {
      id: 'quarterly-review',
      name: language === 'he' ? 'סקירה רבעונית' : 'Quarterly Review',
      description: language === 'he' ? 'ניתוח עסקי מקיף לרבעון' : 'Comprehensive business analysis for the quarter',
      icon: Calendar,
      color: 'text-orange-600 bg-orange-50',
      type: 'performance',
      period: 'quarterly'
    },
    {
      id: 'growth-metrics',
      name: language === 'he' ? 'מדדי צמיחה' : 'Growth Metrics',
      description: language === 'he' ? 'עקוב אחר KPI ויעדי צמיחה' : 'Track KPIs and growth targets',
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50',
      type: 'performance',
      period: 'monthly'
    },
    {
      id: 'annual-summary',
      name: language === 'he' ? 'סיכום שנתי' : 'Annual Summary',
      description: language === 'he' ? 'סקירה מקיפה של כל השנה' : 'Comprehensive year-end review',
      icon: FileText,
      color: 'text-gray-600 bg-gray-50',
      type: 'custom',
      period: 'yearly'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const Icon = template.icon;
        return (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${template.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <Badge variant="outline">{template.period}</Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectTemplate(template)}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <FileText className="w-4 h-4 ml-2" />
                {language === 'he' ? 'השתמש בתבנית' : 'Use Template'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}