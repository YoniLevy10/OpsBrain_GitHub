import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, MessageSquare, Upload, 
  Check, UserPlus, Share2, Plus, Edit, Trash2
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ActivityFeed({ limit = 20 }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();

  const { data: activities = [] } = useQuery({
    queryKey: ['activity-feed', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.ActivityFeed.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date', limit);
    },
    enabled: !!activeWorkspace,
    refetchInterval: 10000 // רענון כל 10 שניות
  });

  const getIcon = (actionType) => {
    const icons = {
      created: Plus,
      updated: Edit,
      deleted: Trash2,
      commented: MessageSquare,
      uploaded: Upload,
      completed: Check,
      assigned: UserPlus,
      mentioned: MessageSquare,
      shared: Share2
    };
    return icons[actionType] || Activity;
  };

  const getActionLabel = (actionType) => {
    if (language === 'he') {
      const labels = {
        created: 'יצר',
        updated: 'עדכן',
        deleted: 'מחק',
        commented: 'הגיב על',
        uploaded: 'העלה',
        completed: 'השלים',
        assigned: 'הקצה',
        mentioned: 'תייג ב',
        shared: 'שיתף'
      };
      return labels[actionType] || actionType;
    } else {
      const labels = {
        created: 'created',
        updated: 'updated',
        deleted: 'deleted',
        commented: 'commented on',
        uploaded: 'uploaded',
        completed: 'completed',
        assigned: 'assigned',
        mentioned: 'mentioned in',
        shared: 'shared'
      };
      return labels[actionType] || actionType;
    }
  };

  const getEntityLabel = (entityType) => {
    if (language === 'he') {
      const labels = {
        Client: 'לקוח',
        Project: 'פרויקט',
        Task: 'משימה',
        Document: 'מסמך',
        Invoice: 'חשבונית',
        Payment: 'תשלום'
      };
      return labels[entityType] || entityType;
    }
    return entityType;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          {language === 'he' ? 'פעילות אחרונה' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {language === 'he' ? 'אין פעילות עדיין' : 'No activity yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {activities.map((activity) => {
              const Icon = getIcon(activity.action_type);
              const colorClass = activity.color || 'text-blue-600 bg-blue-50';
              
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-gray-900">
                              {activity.user_name || activity.user_email}
                            </span>
                            {' '}
                            <span className="text-gray-600">
                              {getActionLabel(activity.action_type)}
                            </span>
                            {' '}
                            {activity.entity_type && (
                              <Badge variant="outline" className="mx-1">
                                {getEntityLabel(activity.entity_type)}
                              </Badge>
                            )}
                            {activity.entity_name && (
                              <span className="font-medium text-gray-900">
                                {activity.entity_name}
                              </span>
                            )}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(activity.created_date), 'PPp', { 
                              locale: language === 'he' ? he : undefined 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}