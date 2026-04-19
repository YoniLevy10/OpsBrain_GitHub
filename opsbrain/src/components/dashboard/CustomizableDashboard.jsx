import React, { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Plus, Settings, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import CalendarWidget from './widgets/CalendarWidget';
import GmailWidget from './widgets/GmailWidget';
import TasksWidget from './widgets/TasksWidget';
import RevenueWidget from './widgets/RevenueWidget';
import WidgetSelector from './WidgetSelector';
import { toast } from 'sonner';

const widgetComponents = {
  calendar: CalendarWidget,
  gmail: GmailWidget,
  tasks: TasksWidget,
  revenue: RevenueWidget,
  clients: TasksWidget, // placeholder
  projects: TasksWidget, // placeholder
  notifications: GmailWidget, // placeholder
  insights: RevenueWidget, // placeholder
  cash_flow: RevenueWidget, // placeholder
  quick_actions: TasksWidget // placeholder
};

export default function CustomizableDashboard() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [editMode, setEditMode] = useState(false);

  React.useEffect(() => {
    opsbrain.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['dashboard-widgets', activeWorkspace?.id, user?.email],
    queryFn: async () => {
      if (!activeWorkspace || !user) return [];
      return await opsbrain.entities.DashboardWidget.filter({
        workspace_id: activeWorkspace.id,
        user_email: user.email,
        is_visible: true
      }, 'position');
    },
    enabled: !!activeWorkspace && !!user
  });

  const removeWidgetMutation = useMutation({
    mutationFn: async (widgetId) => {
      return await opsbrain.entities.DashboardWidget.delete(widgetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-widgets']);
      toast.success(language === 'he' ? 'הווידג\'ט הוסר' : 'Widget removed');
    }
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{language === 'he' ? 'טוען...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* כפתורי ניהול */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {language === 'he' ? 'הווידג\'טים שלי' : 'My Widgets'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="w-4 h-4 ml-2" />
            {editMode ? (language === 'he' ? 'סיים עריכה' : 'Done') : (language === 'he' ? 'ערוך' : 'Edit')}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowSelector(true)}
            className="bg-black hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 ml-2" />
            {language === 'he' ? 'הוסף ווידג\'ט' : 'Add Widget'}
          </Button>
        </div>
      </div>

      {/* רשת ווידג'טים */}
      {widgets.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Plus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'he' ? 'אין ווידג\'טים עדיין' : 'No widgets yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'he' ? 'התאם אישית את הדשבורד שלך עם ווידג\'טים' : 'Customize your dashboard with widgets'}
          </p>
          <Button onClick={() => setShowSelector(true)}>
            {language === 'he' ? 'הוסף ווידג\'ט ראשון' : 'Add First Widget'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => {
            const WidgetComponent = widgetComponents[widget.widget_type] || TasksWidget;
            
            return (
              <div key={widget.id} className="relative group">
                {editMode && (
                  <button
                    onClick={() => removeWidgetMutation.mutate(widget.id)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
                  <WidgetComponent size={widget.size} settings={widget.settings} />
                </Suspense>
              </div>
            );
          })}
        </div>
      )}

      {/* דיאלוג בחירת ווידג'טים */}
      <WidgetSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        existingWidgets={widgets}
      />
    </div>
  );
}