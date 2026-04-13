import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, Mail, CheckSquare, Users, TrendingUp, FolderKanban, Bell, Lightbulb, DollarSign, Zap, MessageCircle, ListChecks } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';

const widgetTypes = [
  { type: 'calendar', name_he: 'יומן', name_en: 'Calendar', icon: Calendar, color: 'bg-blue-500' },
  { type: 'gmail', name_he: 'מיילים', name_en: 'Gmail', icon: Mail, color: 'bg-red-500' },
  { type: 'whatsapp', name_he: 'WhatsApp עוזר', name_en: 'WhatsApp Assistant', icon: MessageCircle, color: 'bg-green-500' },
  { type: 'quick_tasks', name_he: 'משימות מהירות', name_en: 'Quick Tasks', icon: ListChecks, color: 'bg-blue-500' },
  { type: 'tasks', name_he: 'משימות', name_en: 'Tasks', icon: CheckSquare, color: 'bg-green-500' },
  { type: 'clients', name_he: 'לקוחות', name_en: 'Clients', icon: Users, color: 'bg-purple-500' },
  { type: 'revenue', name_he: 'הכנסות', name_en: 'Revenue', icon: TrendingUp, color: 'bg-emerald-500' },
  { type: 'projects', name_he: 'פרויקטים', name_en: 'Projects', icon: FolderKanban, color: 'bg-orange-500' },
  { type: 'notifications', name_he: 'התראות', name_en: 'Notifications', icon: Bell, color: 'bg-yellow-500' },
  { type: 'insights', name_he: 'תובנות AI', name_en: 'AI Insights', icon: Lightbulb, color: 'bg-indigo-500' },
  { type: 'cash_flow', name_he: 'תזרים מזומנים', name_en: 'Cash Flow', icon: DollarSign, color: 'bg-teal-500' },
  { type: 'quick_actions', name_he: 'פעולות מהירות', name_en: 'Quick Actions', icon: Zap, color: 'bg-pink-500' }
];

export default function WidgetSelector({ open, onClose, existingWidgets }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const addWidgetMutation = useMutation({
    mutationFn: async (widgetType) => {
      if (!activeWorkspace || !user) {
        throw new Error('Missing workspace or user');
      }
      
      return await base44.entities.DashboardWidget.create({
        workspace_id: activeWorkspace.id,
        user_email: user.email,
        widget_type: widgetType,
        position: existingWidgets.length,
        is_visible: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-widgets']);
      toast.success(language === 'he' ? 'הווידג\'ט נוסף בהצלחה' : 'Widget added successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Error adding widget:', error);
      toast.error(language === 'he' ? 'שגיאה בהוספת ווידג\'ט' : 'Error adding widget');
    }
  });

  const handleAddWidget = async (widgetType) => {
    if (existingWidgets.some(w => w.widget_type === widgetType)) {
      toast.error(language === 'he' ? 'הווידג\'ט כבר קיים' : 'Widget already exists');
      return;
    }
    
    if (!user || !activeWorkspace) {
      toast.error(language === 'he' ? 'נא להמתין...' : 'Please wait...');
      return;
    }
    
    addWidgetMutation.mutate(widgetType);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {language === 'he' ? 'הוסף ווידג\'ט' : 'Add Widget'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {widgetTypes.map((widget) => {
            const Icon = widget.icon;
            const isAdded = existingWidgets.some(w => w.widget_type === widget.type);
            
            return (
              <Card
                key={widget.type}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isAdded ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isAdded && handleAddWidget(widget.type)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${widget.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {language === 'he' ? widget.name_he : widget.name_en}
                  </h3>
                  {isAdded && (
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'he' ? 'כבר נוסף' : 'Already added'}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}