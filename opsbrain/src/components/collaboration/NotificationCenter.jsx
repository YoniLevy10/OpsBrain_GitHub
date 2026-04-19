import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, Check, CheckCheck, Trash2, Settings, 
  MessageSquare, FileText, Users, DollarSign, AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function NotificationCenter() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  React.useEffect(() => {
    opsbrain.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', activeWorkspace?.id, user?.email],
    queryFn: async () => {
      if (!activeWorkspace || !user) return [];
      return await opsbrain.entities.Notification.filter({
        workspace_id: activeWorkspace.id,
        user_email: user.email
      }, '-created_date', 50);
    },
    enabled: !!activeWorkspace && !!user,
    refetchInterval: 30000 // רענון כל 30 שניות
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => opsbrain.entities.Notification.update(id, {
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => 
        opsbrain.entities.Notification.update(id, {
          is_read: true,
          read_at: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success(language === 'he' ? 'כל ההתראות סומנו כנקרא' : 'All notifications marked as read');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => opsbrain.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const getIcon = (type) => {
    const icons = {
      mention: MessageSquare,
      comment: MessageSquare,
      task_assigned: AlertCircle,
      task_completed: Check,
      project_update: FileText,
      document_shared: FileText,
      payment_received: DollarSign,
      client_update: Users,
      system: Settings,
      reminder: Bell
    };
    return icons[type] || Bell;
  };

  const getColor = (type, priority) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-50';
    if (priority === 'high') return 'text-orange-600 bg-orange-50';
    
    const colors = {
      mention: 'text-purple-600 bg-purple-50',
      comment: 'text-blue-600 bg-blue-50',
      task_assigned: 'text-indigo-600 bg-indigo-50',
      task_completed: 'text-green-600 bg-green-50',
      project_update: 'text-cyan-600 bg-cyan-50',
      document_shared: 'text-gray-600 bg-gray-50',
      payment_received: 'text-green-600 bg-green-50',
      client_update: 'text-blue-600 bg-blue-50',
      system: 'text-gray-600 bg-gray-50',
      reminder: 'text-yellow-600 bg-yellow-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">
            {language === 'he' ? 'התראות' : 'Notifications'}
          </h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
              >
                <CheckCheck className="w-4 h-4 ml-2" />
                {language === 'he' ? 'סמן הכל' : 'Mark all'}
              </Button>
            )}
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="all">
              {language === 'he' ? 'הכל' : 'All'} ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              {language === 'he' ? 'לא נקרא' : 'Unread'} ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              {language === 'he' ? 'נקרא' : 'Read'} ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {language === 'he' ? 'אין התראות' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  const colorClass = getColor(notification.type, notification.priority);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(notification.created_date), 'PPp', { locale: language === 'he' ? he : undefined })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {notification.action_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => window.location.href = notification.action_url}
                            >
                              {notification.action_label || (language === 'he' ? 'צפה' : 'View')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}