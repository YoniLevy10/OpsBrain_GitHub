import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles, Play, Pause, Trash2, Plus, Clock, CheckCircle, AlertCircle, Calendar, Mail, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AutomationsPage() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger_type: 'scheduled',
    repeat_interval: 1,
    repeat_unit: 'days',
    start_time: '09:00',
    actions: []
  });

  // שליפת אוטומציות
  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Automation.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date');
    },
    enabled: !!activeWorkspace
  });

  // יצירת אוטומציה
  const createMutation = useMutation({
    mutationFn: async (automation) => {
      return await base44.entities.Automation.create({
        ...automation,
        workspace_id: activeWorkspace.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      toast.success('אוטומציה נוצרה בהצלחה!');
      setShowCreateDialog(false);
      setNewAutomation({
        name: '',
        trigger_type: 'scheduled',
        repeat_interval: 1,
        repeat_unit: 'days',
        start_time: '09:00',
        actions: []
      });
    },
    onError: () => toast.error('שגיאה ביצירת אוטומציה')
  });

  // הפעלה/השבתה
  const toggleMutation = useMutation({
    mutationFn: async (automation) => {
      return await base44.entities.Automation.update(automation.id, {
        is_active: !automation.is_active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      toast.success('סטטוס עודכן');
    }
  });

  // מחיקה
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automations']);
      toast.success('אוטומציה נמחקה');
    }
  });

  // סטטיסטיקות
  const activeCount = automations.filter(a => a.is_active).length;
  const totalExecutions = automations.reduce((sum, a) => sum + (a.execution_count || 0), 0);
  const successRate = automations.length > 0
    ? Math.round((automations.reduce((sum, a) => sum + (a.success_count || 0), 0) / Math.max(totalExecutions, 1)) * 100)
    : 0;

  const getTriggerIcon = (type) => {
    switch(type) {
      case 'scheduled': return Clock;
      case 'entity_created': 
      case 'entity_updated': 
      case 'entity_deleted': return FileText;
      case 'webhook': return Mail;
      default: return Zap;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* כותרת */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">
              {language === 'he' ? 'חסוך שעות עבודה בשבוע' : 'Save hours every week'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {language === 'he' ? 'אוטומציות' : 'Automations'}
              </h1>
              <p className="text-gray-600 mt-1">
                {language === 'he' 
                  ? 'הפוך משימות חוזרות לאוטומציות חכמות' 
                  : 'Turn repetitive tasks into smart automations'}
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-4 h-4 ml-2" />
              {language === 'he' ? 'אוטומציה חדשה' : 'New Automation'}
            </Button>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{language === 'he' ? 'אוטומציות פעילות' : 'Active'}</p>
                  <p className="text-3xl font-bold text-purple-600">{activeCount}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{language === 'he' ? 'ביצועים סה"כ' : 'Total Runs'}</p>
                  <p className="text-3xl font-bold text-blue-600">{totalExecutions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{language === 'he' ? 'אחוז הצלחה' : 'Success Rate'}</p>
                  <p className="text-3xl font-bold text-green-600">{successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* רשימת אוטומציות */}
        <div className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></CardContent></Card>
          ) : automations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{language === 'he' ? 'אין אוטומציות עדיין' : 'No automations yet'}</h3>
                <p className="text-gray-500 mb-6">{language === 'he' ? 'צור אוטומציה ראשונה כדי להתחיל לחסוך זמן' : 'Create your first automation'}</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Plus className="w-4 h-4 ml-2" />
                  {language === 'he' ? 'צור אוטומציה' : 'Create Automation'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            automations.map((automation) => {
              const Icon = getTriggerIcon(automation.trigger_type);
              return (
                <Card key={automation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${automation.is_active ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${automation.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{automation.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {automation.trigger_type === 'scheduled' ? (language === 'he' ? 'מתוזמן' : 'Scheduled') : 
                               automation.trigger_type.includes('entity') ? (language === 'he' ? 'אירוע' : 'Event') : 
                               automation.trigger_type}
                            </Badge>
                            {automation.execution_count > 0 && (
                              <span className="text-xs text-gray-500">
                                {automation.execution_count} {language === 'he' ? 'ביצועים' : 'runs'}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMutation.mutate(automation)}
                          disabled={toggleMutation.isPending}
                        >
                          {automation.is_active ? (
                            <Pause className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Play className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(automation.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {automation.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600">{automation.description}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* תועלת מצטברת */}
        <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">{activeCount * 2}+ {language === 'he' ? 'שעות' : 'hours'}</h2>
            <p className="text-purple-100">
              {language === 'he' 
                ? 'חיסכון משוער בזמן בחודש' 
                : 'Estimated time saved per month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* דיאלוג יצירת אוטומציה */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'he' ? 'אוטומציה חדשה' : 'New Automation'}</DialogTitle>
            <DialogDescription>
              {language === 'he' ? 'הגדר אוטומציה חדשה לחיסכון בזמן' : 'Set up a new automation to save time'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'he' ? 'שם האוטומציה' : 'Name'}</Label>
              <Input
                value={newAutomation.name}
                onChange={(e) => setNewAutomation({...newAutomation, name: e.target.value})}
                placeholder={language === 'he' ? 'למשל: דיווח שבועי' : 'e.g: Weekly Report'}
              />
            </div>
            <div>
              <Label>{language === 'he' ? 'סוג טריגר' : 'Trigger Type'}</Label>
              <Select
                value={newAutomation.trigger_type}
                onValueChange={(value) => setNewAutomation({...newAutomation, trigger_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{language === 'he' ? 'מתוזמן' : 'Scheduled'}</SelectItem>
                  <SelectItem value="entity_created">{language === 'he' ? 'יצירת רשומה' : 'Entity Created'}</SelectItem>
                  <SelectItem value="entity_updated">{language === 'he' ? 'עדכון רשומה' : 'Entity Updated'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </Button>
              <Button
                onClick={() => createMutation.mutate(newAutomation)}
                disabled={!newAutomation.name || createMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>{language === 'he' ? 'צור' : 'Create'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}