import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, CheckCircle2, Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';

export default function EmailReportSetup() {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [reportType, setReportType] = useState('daily');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [timeOfDay, setTimeOfDay] = useState('08:00');

  // שליפת אוטומציות קיימות
  const { data: automations = [] } = useQuery({
    queryKey: ['email-automations', activeWorkspace?.id],
    queryFn: async () => {
      const allAutomations = await base44.asServiceRole.listAutomations();
      return allAutomations.automations.filter(
        a => a.function_name === 'sendEmailReport' && 
        a.metadata?.workspace_id === activeWorkspace?.id
      );
    },
    enabled: !!activeWorkspace
  });

  // יצירת אוטומציה חדשה
  const createAutomationMutation = useMutation({
    mutationFn: async (config) => {
      // בדיקה אם Gmail מחובר
      let gmailConnected = false;
      try {
        await base44.asServiceRole.connectors.getAccessToken('gmail');
        gmailConnected = true;
      } catch {
        gmailConnected = false;
      }

      if (!gmailConnected) {
        throw new Error('Gmail לא מחובר. נא לחבר את Gmail דרך העוזר האישי בצ\'אט');
      }

      const scheduleConfig = {
        automation_type: 'scheduled',
        name: `דוח ${config.report_type} ל-${config.recipient_email}`,
        description: `שליחת דוח ${config.report_type} אוטומטי במייל`,
        function_name: 'sendEmailReport',
        function_args: {
          report_type: config.report_type,
          recipient_email: config.recipient_email,
          workspace_id: activeWorkspace.id
        },
        is_active: true,
        metadata: {
          workspace_id: activeWorkspace.id,
          type: 'email_report'
        }
      };

      // תזמון לפי תדירות
      if (config.frequency === 'daily') {
        scheduleConfig.schedule_type = 'simple';
        scheduleConfig.schedule_mode = 'recurring';
        scheduleConfig.repeat_interval = 1;
        scheduleConfig.repeat_unit = 'days';
        scheduleConfig.start_time = config.time_of_day;
      } else if (config.frequency === 'weekly') {
        scheduleConfig.schedule_type = 'simple';
        scheduleConfig.schedule_mode = 'recurring';
        scheduleConfig.repeat_interval = 1;
        scheduleConfig.repeat_unit = 'weeks';
        scheduleConfig.repeat_on_days = [1]; // יום שני
        scheduleConfig.start_time = config.time_of_day;
      } else if (config.frequency === 'monthly') {
        scheduleConfig.schedule_type = 'simple';
        scheduleConfig.schedule_mode = 'recurring';
        scheduleConfig.repeat_interval = 1;
        scheduleConfig.repeat_unit = 'months';
        scheduleConfig.repeat_on_day_of_month = 1; // ראשון בחודש
        scheduleConfig.start_time = config.time_of_day;
      }

      return await base44.asServiceRole.createAutomation(scheduleConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['email-automations']);
      toast.success('אוטומציה נוצרה בהצלחה! 🎉');
      setRecipientEmail('');
    },
    onError: (error) => {
      toast.error(error.message || 'שגיאה ביצירת אוטומציה');
    }
  });

  // מחיקת אוטומציה
  const deleteAutomationMutation = useMutation({
    mutationFn: async (automationId) => {
      return await base44.asServiceRole.manageAutomation({
        automation_id: automationId,
        action: 'delete'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['email-automations']);
      toast.success('אוטומציה נמחקה');
    }
  });

  // שליחת דוח מיידי
  const sendNowMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('sendEmailReport', {
        report_type: reportType,
        recipient_email: recipientEmail,
        workspace_id: activeWorkspace.id
      });
    },
    onSuccess: () => {
      toast.success('הדוח נשלח בהצלחה! 📧');
    },
    onError: (error) => {
      if (error.message?.includes('לא מחובר')) {
        toast.error('Gmail לא מחובר. פנה לעוזר האישי בצ\'אט כדי לחבר');
      } else {
        toast.error('שגיאה בשליחת הדוח');
      }
    }
  });

  const handleCreateAutomation = () => {
    if (!recipientEmail) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }

    createAutomationMutation.mutate({
      report_type: reportType,
      recipient_email: recipientEmail,
      frequency,
      time_of_day: timeOfDay
    });
  };

  return (
    <div className="space-y-6">
      {/* הגדרת דוח חדש */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>דוחות אוטומטיים במייל</CardTitle>
              <CardDescription>שלח דוחות עסקיים באופן אוטומטי ל-Gmail</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג דוח</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">📊 דוח יומי</SelectItem>
                  <SelectItem value="weekly">📈 דוח שבועי</SelectItem>
                  <SelectItem value="monthly">📅 דוח חודשי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>כתובת אימייל</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>תדירות שליחה</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">כל יום</SelectItem>
                  <SelectItem value="weekly">פעם בשבוע</SelectItem>
                  <SelectItem value="monthly">פעם בחודש</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>שעת שליחה</Label>
              <Input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateAutomation}
              disabled={createAutomationMutation.isPending || !recipientEmail}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {createAutomationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  יוצר אוטומציה...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 ml-2" />
                  צור אוטומציה
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => sendNowMutation.mutate()}
              disabled={sendNowMutation.isPending || !recipientEmail}
            >
              {sendNowMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 ml-2" />
                  שלח עכשיו
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 <strong>טיפ:</strong> אם Gmail לא מחובר, פנה לעוזר האישי בצ'אט והקלד "חבר Gmail"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* רשימת אוטומציות קיימות */}
      {automations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              דוחות מתוזמנים ({automations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{automation.name}</h4>
                      {automation.is_active ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          פעיל
                        </Badge>
                      ) : (
                        <Badge variant="outline">מושבת</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{automation.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('למחוק אוטומציה זו?')) {
                        deleteAutomationMutation.mutate(automation.id);
                      }
                    }}
                    disabled={deleteAutomationMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}