import React, { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Plus, Settings, TrendingUp, Layout } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';

const WidgetLibrary = lazy(() => import('@/components/analytics/WidgetLibrary'));
const CustomDashboard = lazy(() => import('@/components/analytics/CustomDashboard'));
const PerformanceMetrics = lazy(() => import('@/components/analytics/PerformanceMetrics'));

export default function Analytics() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  React.useEffect(() => {
    opsbrain.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: widgets = [], isLoading: widgetsLoading } = useQuery({
    queryKey: ['dashboard-widgets', activeWorkspace?.id, user?.email],
    queryFn: async () => {
      if (!activeWorkspace || !user) return [];
      return await opsbrain.entities.DashboardWidget.filter({
        workspace_id: activeWorkspace.id,
        user_email: user.email
      }, 'position');
    },
    enabled: !!activeWorkspace && !!user,
    staleTime: 5 * 60 * 1000
  });

  const addWidgetMutation = useMutation({
    mutationFn: async (widgetData) => {
      if (!activeWorkspace || !user) {
        throw new Error('Missing workspace or user');
      }
      
      return await opsbrain.entities.DashboardWidget.create({
        workspace_id: activeWorkspace.id,
        user_email: user.email,
        widget_type: widgetData.type,
        position: widgets.length,
        size: 'medium',
        is_visible: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-widgets']);
      toast.success(language === 'he' ? 'ווידג\'ט נוסף בהצלחה' : 'Widget added successfully');
      setShowWidgetLibrary(false);
    },
    onError: (error) => {
      console.error('Error adding widget:', error);
      toast.error(language === 'he' ? 'שגיאה בהוספת ווידג\'ט' : 'Error adding widget');
    }
  });

  const removeWidgetMutation = useMutation({
    mutationFn: (widgetId) => opsbrain.entities.DashboardWidget.delete(widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-widgets']);
      toast.success(language === 'he' ? 'ווידג\'ט הוסר' : 'Widget removed');
    }
  });

  const toggleWidgetMutation = useMutation({
    mutationFn: (widget) => opsbrain.entities.DashboardWidget.update(widget.id, {
      is_visible: !widget.is_visible
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-widgets']);
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'he' ? 'ניתוח עסקי' : 'Business Analytics'}
            </h1>
            <p className="text-gray-500">
              {language === 'he' ? 'תובנות ומדדים בזמן אמת' : 'Real-time insights and metrics'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'ווידג\'טים פעילים' : 'Active Widgets'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {widgets.filter(w => w.is_visible).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Layout className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'מדדי ביצוע' : 'Metrics'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'מדדים בעלייה' : 'Trending Up'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">8</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'יעדים הושגו' : 'Goals Met'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">75%</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="dashboard">
              {language === 'he' ? 'דשבורד' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="metrics">
              {language === 'he' ? 'מדדים' : 'Metrics'}
            </TabsTrigger>
          </TabsList>
          {activeTab === 'dashboard' && (
            <Button
              onClick={() => setShowWidgetLibrary(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              {language === 'he' ? 'הוסף ווידג\'ט' : 'Add Widget'}
            </Button>
          )}
        </div>

        <TabsContent value="dashboard">
          {widgetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : widgets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'he' ? 'דשבורד ריק' : 'Empty Dashboard'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {language === 'he' ? 'התחל בהוספת ווידג\'טים' : 'Start by adding widgets'}
                </p>
                <Button onClick={() => setShowWidgetLibrary(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 ml-2" />
                  {language === 'he' ? 'הוסף ווידג\'ט ראשון' : 'Add First Widget'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <CustomDashboard
                widgets={widgets}
                onAddWidget={() => setShowWidgetLibrary(true)}
                onRemoveWidget={(widget) => removeWidgetMutation.mutate(widget.id)}
                onToggleVisibility={(widget) => toggleWidgetMutation.mutate(widget)}
              />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="metrics">
          <Suspense fallback={<LoadingSpinner />}>
            <PerformanceMetrics />
          </Suspense>
        </TabsContent>
      </Tabs>

      <Dialog open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'he' ? 'ספריית ווידג\'טים' : 'Widget Library'}
            </DialogTitle>
          </DialogHeader>
          <Suspense fallback={<LoadingSpinner />}>
            <WidgetLibrary onAddWidget={(widget) => addWidgetMutation.mutate(widget)} />
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  );
}