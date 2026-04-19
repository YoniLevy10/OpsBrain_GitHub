import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Plug, CheckCircle, XCircle, RefreshCw, 
  TrendingUp, Zap, Activity
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import IntegrationSetup from '@/components/integrations/IntegrationSetup';
import SyncMonitor from '@/components/integrations/SyncMonitor';

export default function Integrations() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Integration.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date');
    },
    enabled: !!activeWorkspace
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data) => opsbrain.entities.Integration.create({
      workspace_id: activeWorkspace.id,
      status: 'pending',
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      setShowSetup(false);
      setEditingIntegration(null);
      toast.success(language === 'he' ? 'אינטגרציה נשמרה' : 'Integration saved');
    }
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, data }) => opsbrain.entities.Integration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      setShowSetup(false);
      setEditingIntegration(null);
      toast.success(language === 'he' ? 'אינטגרציה עודכנה' : 'Integration updated');
    }
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: (integration) => opsbrain.entities.Integration.update(integration.id, {
      status: integration.status === 'active' ? 'inactive' : 'active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
    }
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: async (integration) => {
      // סימולציה של סנכרון
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // יצירת לוג סנכרון
      await opsbrain.entities.SyncLog.create({
        workspace_id: activeWorkspace.id,
        integration_id: integration.id,
        integration_name: integration.name,
        status: 'success',
        records_synced: Math.floor(Math.random() * 100) + 10,
        records_failed: 0,
        duration_ms: 1500
      });

      // עדכון זמן סנכרון אחרון
      return opsbrain.entities.Integration.update(integration.id, {
        last_sync: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      queryClient.invalidateQueries(['sync-logs']);
      toast.success(language === 'he' ? 'סנכרון הושלם' : 'Sync completed');
    }
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id) => opsbrain.entities.Integration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      toast.success(language === 'he' ? 'אינטגרציה נמחקה' : 'Integration deleted');
    }
  });

  const handleSaveIntegration = (data) => {
    if (editingIntegration) {
      updateIntegrationMutation.mutate({ id: editingIntegration.id, data });
    } else {
      createIntegrationMutation.mutate(data);
    }
  };

  const activeIntegrations = integrations.filter(i => i.status === 'active');
  const errorIntegrations = integrations.filter(i => i.status === 'error');
  const totalSyncs = integrations.reduce((sum, i) => sum + (i.error_count || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Plug className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'he' ? 'אינטגרציות' : 'Integrations'}
            </h1>
            <p className="text-gray-500">
              {language === 'he' ? 'חבר את המערכות שלך' : 'Connect your systems'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'אינטגרציות פעילות' : 'Active'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{activeIntegrations.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'סה"כ אינטגרציות' : 'Total'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plug className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'שגיאות' : 'Errors'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{errorIntegrations.length}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'סנכרונים היום' : 'Today Syncs'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{totalSyncs}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="active">
              {language === 'he' ? 'פעילים' : 'Active'} ({activeIntegrations.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              {language === 'he' ? 'הכל' : 'All'} ({integrations.length})
            </TabsTrigger>
            <TabsTrigger value="monitor">
              {language === 'he' ? 'ניטור' : 'Monitor'}
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              setEditingIntegration(null);
              setShowSetup(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            {language === 'he' ? 'אינטגרציה חדשה' : 'New Integration'}
          </Button>
        </div>

        <TabsContent value="active">
          {activeIntegrations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Plug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'he' ? 'אין אינטגרציות פעילות' : 'No active integrations'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {language === 'he' ? 'התחל בחיבור הראשון' : 'Start your first connection'}
                </p>
                <Button onClick={() => setShowSetup(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 ml-2" />
                  {language === 'he' ? 'הוסף אינטגרציה' : 'Add Integration'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onToggle={() => toggleIntegrationMutation.mutate(integration)}
                  onConfigure={() => {
                    setEditingIntegration(integration);
                    setShowSetup(true);
                  }}
                  onSync={() => syncIntegrationMutation.mutate(integration)}
                  onDelete={() => {
                    if (confirm(language === 'he' ? 'למחוק אינטגרציה?' : 'Delete integration?')) {
                      deleteIntegrationMutation.mutate(integration.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onToggle={() => toggleIntegrationMutation.mutate(integration)}
                onConfigure={() => {
                  setEditingIntegration(integration);
                  setShowSetup(true);
                }}
                onSync={() => syncIntegrationMutation.mutate(integration)}
                onDelete={() => {
                  if (confirm(language === 'he' ? 'למחוק אינטגרציה?' : 'Delete integration?')) {
                    deleteIntegrationMutation.mutate(integration.id);
                  }
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <SyncMonitor />
        </TabsContent>
      </Tabs>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration 
                ? (language === 'he' ? 'ערוך אינטגרציה' : 'Edit Integration')
                : (language === 'he' ? 'אינטגרציה חדשה' : 'New Integration')}
            </DialogTitle>
          </DialogHeader>
          <IntegrationSetup
            integration={editingIntegration}
            onSave={handleSaveIntegration}
            onCancel={() => {
              setShowSetup(false);
              setEditingIntegration(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}