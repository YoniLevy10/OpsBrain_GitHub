import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, DollarSign, Users, Zap, Calendar
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function AutomationTemplates({ onSelectTemplate }) {
  const { language } = useLanguage();

  const templates = [
    {
      id: 'welcome-client',
      name: language === 'he' ? 'ברכת לקוח חדש' : 'Welcome New Client',
      description: language === 'he' ? 'שלח אימייל ברכה ללקוח חדש' : 'Send welcome email to new client',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      category: 'notification',
      trigger_type: 'entity_created',
      trigger_config: { entity_type: 'Client' },
      actions: [
        {
          type: 'send_email',
          config: {
            subject: language === 'he' ? 'ברוך הבא!' : 'Welcome!',
            body: language === 'he' ? 'שמחים לקבל אותך כלקוח שלנו' : 'Happy to have you as our client'
          }
        },
        {
          type: 'send_notification',
          config: {
            title: language === 'he' ? 'לקוח חדש' : 'New Client',
            message: language === 'he' ? 'לקוח חדש התווסף למערכת' : 'New client added to system'
          }
        }
      ]
    },
    {
      id: 'invoice-reminder',
      name: language === 'he' ? 'תזכורת חשבונית' : 'Invoice Reminder',
      description: language === 'he' ? 'שלח תזכורת לתשלום חשבונית' : 'Send payment reminder for invoice',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      category: 'workflow',
      trigger_type: 'scheduled',
      trigger_config: { schedule: '0 9 * * *' },
      actions: [
        {
          type: 'send_email',
          config: {
            subject: language === 'he' ? 'תזכורת תשלום' : 'Payment Reminder',
            body: language === 'he' ? 'אנא שלם את החשבונית' : 'Please pay your invoice'
          }
        }
      ]
    },
    {
      id: 'task-assignment',
      name: language === 'he' ? 'הקצאת משימה' : 'Task Assignment',
      description: language === 'he' ? 'שלח התראה על משימה חדשה' : 'Notify about new task assignment',
      icon: Bell,
      color: 'text-purple-600 bg-purple-50',
      category: 'notification',
      trigger_type: 'entity_created',
      trigger_config: { entity_type: 'Task' },
      actions: [
        {
          type: 'send_notification',
          config: {
            title: language === 'he' ? 'משימה חדשה' : 'New Task',
            message: language === 'he' ? 'הוקצתה לך משימה חדשה' : 'You have a new task assigned'
          }
        }
      ]
    },
    {
      id: 'project-complete',
      name: language === 'he' ? 'השלמת פרויקט' : 'Project Completion',
      description: language === 'he' ? 'התראה על השלמת פרויקט' : 'Notify about project completion',
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50',
      category: 'workflow',
      trigger_type: 'entity_updated',
      trigger_config: { entity_type: 'Project' },
      actions: [
        {
          type: 'send_email',
          config: {
            subject: language === 'he' ? 'פרויקט הושלם' : 'Project Completed',
            body: language === 'he' ? 'הפרויקט הושלם בהצלחה' : 'Project completed successfully'
          }
        },
        {
          type: 'send_notification',
          config: {
            title: language === 'he' ? 'פרויקט הושלם' : 'Project Done',
            message: language === 'he' ? 'פרויקט הושלם' : 'Project has been completed'
          }
        }
      ]
    },
    {
      id: 'daily-summary',
      name: language === 'he' ? 'סיכום יומי' : 'Daily Summary',
      description: language === 'he' ? 'שלח סיכום יומי של פעילות' : 'Send daily activity summary',
      icon: Calendar,
      color: 'text-orange-600 bg-orange-50',
      category: 'reporting',
      trigger_type: 'scheduled',
      trigger_config: { schedule: '0 18 * * *' },
      actions: [
        {
          type: 'send_email',
          config: {
            subject: language === 'he' ? 'סיכום יומי' : 'Daily Summary',
            body: language === 'he' ? 'סיכום הפעילות של היום' : "Today's activity summary"
          }
        }
      ]
    },
    {
      id: 'payment-received',
      name: language === 'he' ? 'תשלום התקבל' : 'Payment Received',
      description: language === 'he' ? 'התראה על קבלת תשלום' : 'Notify about received payment',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      category: 'notification',
      trigger_type: 'entity_created',
      trigger_config: { entity_type: 'Payment' },
      actions: [
        {
          type: 'send_notification',
          config: {
            title: language === 'he' ? 'תשלום התקבל' : 'Payment Received',
            message: language === 'he' ? 'תשלום חדש התקבל' : 'New payment received'
          }
        }
      ]
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
                <Badge variant="outline">{template.actions.length} {language === 'he' ? 'פעולות' : 'actions'}</Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => onSelectTemplate(template)}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <Zap className="w-4 h-4 ml-2" />
                {language === 'he' ? 'השתמש בתבנית' : 'Use Template'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}