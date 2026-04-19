import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Send, Bell, CheckCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceAutomation() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['invoice-automation', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      const automations = await base44.entities.Automation.filter({
        workspace_id: activeWorkspace.id,
        category: 'invoice_automation'
      }, '-created_date', 1);
      return automations[0] || null;
    },
    enabled: !!activeWorkspace
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.Automation.update(settings.id, data);
      } else {
        return await base44.entities.Automation.create({
          workspace_id: activeWorkspace.id,
          name: language === 'he' ? 'אוטומציה של חשבוניות' : 'Invoice Automation',
          category: 'invoice_automation',
          trigger_type: 'scheduled',
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice-automation']);
      toast.success(language === 'he' ? 'ההגדרות נשמרו' : 'Settings saved');
    }
  });

  const [config, setConfig] = useState({
    auto_create: settings?.trigger_config?.auto_create ?? true,
    auto_send: settings?.trigger_config?.auto_send ?? true,
    reminder_enabled: settings?.trigger_config?.reminder_enabled ?? true,
    reminder_days: settings?.trigger_config?.reminder_days ?? 7,
    second_reminder_days: settings?.trigger_config?.second_reminder_days ?? 14,
    payment_tracking: settings?.trigger_config?.payment_tracking ?? true
  });

  const handleSave = () => {
    saveMutation.mutate({
      is_active: true,
      trigger_config: config,
      actions: [
        { type: 'create_invoice', order: 1 },
        { type: 'send_invoice', order: 2 },
        { type: 'track_payment', order: 3 },
        { type: 'send_reminders', order: 4 }
      ]
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">{language === 'he' ? 'טוען...' : 'Loading...'}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>{language === 'he' ? 'אוטומציה מלאה של חשבוניות' : 'Complete Invoice Automation'}</CardTitle>
            <CardDescription>
              {language === 'he' ? 'חסוך שעות עבודה - מיצירה ועד קבלת תשלום' : 'Save hours - from creation to payment'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* יצירה אוטומטית */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <Label className="text-base font-semibold">
                {language === 'he' ? 'יצירה אוטומטית' : 'Auto-Create'}
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'he' 
                  ? 'יצירת חשבונית אוטומטית כשפרויקט מסומן כ"הושלם"' 
                  : 'Auto-create invoice when project marked as "completed"'}
              </p>
            </div>
          </div>
          <Switch
            checked={config.auto_create}
            onCheckedChange={(checked) => setConfig({ ...config, auto_create: checked })}
          />
        </div>

        {/* שליחה אוטומטית */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Send className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <Label className="text-base font-semibold">
                {language === 'he' ? 'שליחה אוטומטית' : 'Auto-Send'}
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'he' 
                  ? 'שליחת החשבונית ללקוח במייל אוטומטית' 
                  : 'Automatically email invoice to client'}
              </p>
            </div>
          </div>
          <Switch
            checked={config.auto_send}
            onCheckedChange={(checked) => setConfig({ ...config, auto_send: checked })}
          />
        </div>

        {/* תזכורות אוטומטיות */}
        <div className="space-y-3 p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <Label className="text-base font-semibold">
                  {language === 'he' ? 'תזכורות אוטומטיות' : 'Auto-Reminders'}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'he' 
                    ? 'שליחת תזכורות ללקוחות שלא שילמו' 
                    : 'Send reminders to clients who haven\'t paid'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.reminder_enabled}
              onCheckedChange={(checked) => setConfig({ ...config, reminder_enabled: checked })}
            />
          </div>
          
          {config.reminder_enabled && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-sm text-gray-600">
                  {language === 'he' ? 'תזכורת ראשונה (ימים)' : 'First reminder (days)'}
                </Label>
                <Input
                  type="number"
                  value={config.reminder_days}
                  onChange={(e) => setConfig({ ...config, reminder_days: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600">
                  {language === 'he' ? 'תזכורת שנייה (ימים)' : 'Second reminder (days)'}
                </Label>
                <Input
                  type="number"
                  value={config.second_reminder_days}
                  onChange={(e) => setConfig({ ...config, second_reminder_days: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* מעקב תשלומים */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <Label className="text-base font-semibold">
                {language === 'he' ? 'מעקב תשלומים' : 'Payment Tracking'}
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'he' 
                  ? 'עדכון אוטומטי של סטטוס החשבונית כשמתקבל תשלום' 
                  : 'Auto-update invoice status when payment received'}
              </p>
            </div>
          </div>
          <Switch
            checked={config.payment_tracking}
            onCheckedChange={(checked) => setConfig({ ...config, payment_tracking: checked })}
          />
        </div>

        {/* סטטיסטיקה */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">5.5</p>
            <p className="text-xs text-gray-600">
              {language === 'he' ? 'שעות חסכון בשבוע' : 'hours saved/week'}
            </p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">92%</p>
            <p className="text-xs text-gray-600">
              {language === 'he' ? 'שיעור תשלומים בזמן' : 'on-time payments'}
            </p>
          </div>
          <div className="text-center">
            <Send className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">100%</p>
            <p className="text-xs text-gray-600">
              {language === 'he' ? 'אוטומטי' : 'automated'}
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending 
            ? (language === 'he' ? 'שומר...' : 'Saving...') 
            : (language === 'he' ? 'שמור הגדרות' : 'Save Settings')}
        </Button>
      </CardContent>
    </Card>
  );
}