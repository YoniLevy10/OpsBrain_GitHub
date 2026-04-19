import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function ClientHealthScore({ client }) {
  const { language } = useLanguage();

  const { data: interactions = [] } = useQuery({
    queryKey: ['client-interactions', client?.id],
    queryFn: async () => {
      if (!client) return [];
      return await opsbrain.entities.Interaction.filter({ client_id: client.id }, '-date');
    },
    enabled: !!client
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['client-projects', client?.id],
    queryFn: async () => {
      if (!client) return [];
      return await opsbrain.entities.Project.filter({ client_id: client.id });
    },
    enabled: !!client
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices', client?.id],
    queryFn: async () => {
      if (!client) return [];
      return await opsbrain.entities.Invoice.filter({ client_id: client.id });
    },
    enabled: !!client
  });

  const calculateAdvancedHealth = () => {
    const metrics = {
      engagement: 0,
      payment: 0,
      satisfaction: 0,
      growth: 0
    };

    const issues = [];

    const daysSinceContact = client.last_contact 
      ? Math.floor((new Date() - new Date(client.last_contact)) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceContact <= 7) {
      metrics.engagement = 30;
    } else if (daysSinceContact <= 14) {
      metrics.engagement = 25;
    } else if (daysSinceContact <= 30) {
      metrics.engagement = 20;
      issues.push({ text: language === 'he' ? 'לא היה קשר בחודש האחרון' : 'No contact in the last month', severity: 'warning' });
    } else if (daysSinceContact <= 60) {
      metrics.engagement = 10;
      issues.push({ text: language === 'he' ? 'חוסר קשר ממושך' : 'Extended no contact', severity: 'danger' });
    } else {
      metrics.engagement = 0;
      issues.push({ text: language === 'he' ? 'אין קשר למעלה מ-60 יום' : 'No contact for over 60 days', severity: 'critical' });
    }

    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    
    if (overdueInvoices.length === 0 && invoices.length > 0) {
      metrics.payment = 25;
    } else if (overdueInvoices.length === 0) {
      metrics.payment = 20;
    } else if (overdueInvoices.length <= 1) {
      metrics.payment = 15;
      issues.push({ text: language === 'he' ? 'חשבונית באיחור' : 'Overdue invoice', severity: 'warning' });
    } else {
      metrics.payment = 5;
      issues.push({ text: language === 'he' ? `${overdueInvoices.length} חשבוניות באיחור` : `${overdueInvoices.length} overdue invoices`, severity: 'danger' });
    }

    const recentInteractions = interactions.slice(0, 5);
    const positiveInteractions = recentInteractions.filter(i => i.sentiment === 'positive').length;
    const negativeInteractions = recentInteractions.filter(i => i.sentiment === 'negative').length;
    
    if (negativeInteractions > 2) {
      metrics.satisfaction = 5;
      issues.push({ text: language === 'he' ? 'מספר אינטראקציות שליליות' : 'Multiple negative interactions', severity: 'danger' });
    } else if (negativeInteractions > 0) {
      metrics.satisfaction = 15;
      issues.push({ text: language === 'he' ? 'אינטראקציה שלילית לאחרונה' : 'Recent negative interaction', severity: 'warning' });
    } else if (positiveInteractions >= 3) {
      metrics.satisfaction = 25;
    } else {
      metrics.satisfaction = 20;
    }

    const activeProjects = projects.filter(p => p.status === 'active').length;
    if (activeProjects >= 3) {
      metrics.growth = 20;
    } else if (activeProjects >= 2) {
      metrics.growth = 15;
    } else if (activeProjects >= 1) {
      metrics.growth = 10;
    } else {
      metrics.growth = 5;
      if (client.status === 'active') {
        issues.push({ text: language === 'he' ? 'אין פרויקטים פעילים' : 'No active projects', severity: 'warning' });
      }
    }

    const totalHealth = metrics.engagement + metrics.payment + metrics.satisfaction + metrics.growth;

    return { totalHealth, metrics, issues };
  };

  const { totalHealth, metrics, issues } = calculateAdvancedHealth();

  const getHealthColor = () => {
    if (totalHealth >= 75) return 'text-green-600';
    if (totalHealth >= 50) return 'text-yellow-600';
    if (totalHealth >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = () => {
    if (totalHealth >= 75) return 'bg-green-100 text-green-700 border-green-200';
    if (totalHealth >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (totalHealth >= 25) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getHealthIcon = () => {
    if (totalHealth >= 75) return <TrendingUp className={`w-6 h-6 ${getHealthColor()}`} />;
    if (totalHealth >= 50) return <Activity className={`w-6 h-6 ${getHealthColor()}`} />;
    return <TrendingDown className={`w-6 h-6 ${getHealthColor()}`} />;
  };

  const getHealthLabel = () => {
    if (totalHealth >= 75) return language === 'he' ? '💚 מצוין' : '💚 Excellent';
    if (totalHealth >= 50) return language === 'he' ? '💛 טוב' : '💛 Good';
    if (totalHealth >= 25) return language === 'he' ? '🧡 דורש תשומת לב' : '🧡 Needs Attention';
    return language === 'he' ? '❤️ בסיכון גבוה' : '❤️ High Risk';
  };

  const getChurnRisk = () => {
    if (totalHealth >= 75) return 5;
    if (totalHealth >= 50) return 20;
    if (totalHealth >= 25) return 50;
    return 85;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          {language === 'he' ? 'בריאות לקוח מתקדמת' : 'Advanced Client Health'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {getHealthIcon()}
              <div>
                <div className="text-3xl font-bold text-gray-900">{totalHealth}</div>
                <div className="text-sm text-gray-500">{language === 'he' ? 'מתוך 100' : 'out of 100'}</div>
              </div>
            </div>
            <Badge className={`${getHealthBgColor()} text-base px-3 py-1`}>
              {getHealthLabel()}
            </Badge>
          </div>
          
          <Progress value={totalHealth} className="h-3 mb-3" />
          
          <div className="flex items-center justify-between text-sm bg-red-50 p-3 rounded-lg">
            <span className="text-gray-700 font-medium">
              {language === 'he' ? 'סיכון לנטישה (Churn Risk)' : 'Churn Risk'}
            </span>
            <span className="font-bold text-red-600">
              {getChurnRisk()}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700">
            {language === 'he' ? 'מטריקות בריאות' : 'Health Metrics'}
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{language === 'he' ? 'מעורבות' : 'Engagement'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.engagement / 30) * 100} className="flex-1 h-2" />
                <span className="text-xs font-bold text-gray-700">{metrics.engagement}/30</span>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{language === 'he' ? 'תשלומים' : 'Payments'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.payment / 25) * 100} className="flex-1 h-2" />
                <span className="text-xs font-bold text-gray-700">{metrics.payment}/25</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">{language === 'he' ? 'שביעות רצון' : 'Satisfaction'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.satisfaction / 25) * 100} className="flex-1 h-2" />
                <span className="text-xs font-bold text-gray-700">{metrics.satisfaction}/25</span>
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">{language === 'he' ? 'צמיחה' : 'Growth'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(metrics.growth / 20) * 100} className="flex-1 h-2" />
                <span className="text-xs font-bold text-gray-700">{metrics.growth}/20</span>
              </div>
            </div>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              {language === 'he' ? 'בעיות מזוהות' : 'Identified Issues'}
            </h4>
            {issues.map((issue, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  issue.severity === 'danger' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{issue.text}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}