import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, X, Zap, Clock, FileText, Mail, Bell, Webhook, ArrowRight, Play
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { toast } from 'sonner';

export default function AutomationBuilder({ automation, onSave, onCancel }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState(automation || {
    name: '',
    description: '',
    trigger_type: 'entity_created',
    trigger_config: {},
    actions: [],
    conditions: [],
    category: 'workflow',
    is_active: true
  });

  const triggerTypes = [
    { value: 'entity_created', label: language === 'he' ? 'יצירת רשומה' : 'Entity Created', icon: Plus },
    { value: 'entity_updated', label: language === 'he' ? 'עדכון רשומה' : 'Entity Updated', icon: FileText },
    { value: 'entity_deleted', label: language === 'he' ? 'מחיקת רשומה' : 'Entity Deleted', icon: X },
    { value: 'scheduled', label: language === 'he' ? 'מתוזמן' : 'Scheduled', icon: Clock },
    { value: 'manual', label: language === 'he' ? 'ידני' : 'Manual', icon: Play },
    { value: 'webhook', label: language === 'he' ? 'Webhook' : 'Webhook', icon: Webhook },
    { value: 'condition_met', label: language === 'he' ? 'תנאי התקיים' : 'Condition Met', icon: Zap }
  ];

  const actionTypes = [
    { value: 'send_email', label: language === 'he' ? 'שלח אימייל' : 'Send Email', icon: Mail },
    { value: 'send_notification', label: language === 'he' ? 'שלח התראה' : 'Send Notification', icon: Bell },
    { value: 'create_entity', label: language === 'he' ? 'צור רשומה' : 'Create Entity', icon: Plus },
    { value: 'update_entity', label: language === 'he' ? 'עדכן רשומה' : 'Update Entity', icon: FileText },
    { value: 'call_webhook', label: language === 'he' ? 'קרא ל-Webhook' : 'Call Webhook', icon: Webhook },
    { value: 'wait', label: language === 'he' ? 'המתן' : 'Wait', icon: Clock }
  ];

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'send_notification', config: {}, order: formData.actions.length }]
    });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.trigger_type || formData.actions.length === 0) {
      toast.error(language === 'he' ? 'אנא מלא את כל השדות הנדרשים' : 'Please fill all required fields');
      return;
    }
    onSave(formData);
  };

  const selectedTrigger = triggerTypes.find(t => t.value === formData.trigger_type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            {language === 'he' ? 'פרטי אוטומציה' : 'Automation Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === 'he' ? 'שם האוטומציה' : 'Automation Name'}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'he' ? 'לדוגמה: שלח אימייל ללקוח חדש' : 'e.g., Send email to new client'}
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'תיאור' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'he' ? 'מה האוטומציה עושה?' : 'What does this automation do?'}
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'קטגוריה' : 'Category'}</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notification">{language === 'he' ? 'התראות' : 'Notifications'}</SelectItem>
                <SelectItem value="data_sync">{language === 'he' ? 'סנכרון נתונים' : 'Data Sync'}</SelectItem>
                <SelectItem value="reporting">{language === 'he' ? 'דיווחים' : 'Reporting'}</SelectItem>
                <SelectItem value="workflow">{language === 'he' ? 'זרימת עבודה' : 'Workflow'}</SelectItem>
                <SelectItem value="integration">{language === 'he' ? 'אינטגרציה' : 'Integration'}</SelectItem>
                <SelectItem value="other">{language === 'he' ? 'אחר' : 'Other'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* טריגר */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedTrigger && <selectedTrigger.icon className="w-5 h-5 text-purple-600" />}
            {language === 'he' ? 'מתי להפעיל?' : 'When to Trigger?'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === 'he' ? 'סוג טריגר' : 'Trigger Type'}</Label>
            <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map(trigger => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    <div className="flex items-center gap-2">
                      <trigger.icon className="w-4 h-4" />
                      {trigger.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.trigger_type.startsWith('entity_') && (
            <div>
              <Label>{language === 'he' ? 'סוג ישות' : 'Entity Type'}</Label>
              <Select 
                value={formData.trigger_config?.entity_type || ''} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  trigger_config: { ...formData.trigger_config, entity_type: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'he' ? 'בחר ישות' : 'Select entity'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client">{language === 'he' ? 'לקוח' : 'Client'}</SelectItem>
                  <SelectItem value="Project">{language === 'he' ? 'פרויקט' : 'Project'}</SelectItem>
                  <SelectItem value="Task">{language === 'he' ? 'משימה' : 'Task'}</SelectItem>
                  <SelectItem value="Invoice">{language === 'he' ? 'חשבונית' : 'Invoice'}</SelectItem>
                  <SelectItem value="Payment">{language === 'he' ? 'תשלום' : 'Payment'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.trigger_type === 'scheduled' && (
            <div>
              <Label>{language === 'he' ? 'תזמון' : 'Schedule'}</Label>
              <Input
                value={formData.trigger_config?.schedule || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  trigger_config: { ...formData.trigger_config, schedule: e.target.value } 
                })}
                placeholder="0 9 * * *"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'he' ? 'פורמט Cron' : 'Cron format'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* פעולות */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-green-600" />
              {language === 'he' ? 'מה לעשות?' : 'What to Do?'}
            </CardTitle>
            <Button onClick={addAction} size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 ml-2" />
              {language === 'he' ? 'הוסף פעולה' : 'Add Action'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.actions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <ArrowRight className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                {language === 'he' ? 'הוסף פעולה ראשונה' : 'Add your first action'}
              </p>
            </div>
          ) : (
            formData.actions.map((action, index) => {
              const actionType = actionTypes.find(a => a.value === action.type);
              return (
                <Card key={index} className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50">
                          {language === 'he' ? 'פעולה' : 'Action'} {index + 1}
                        </Badge>
                        {actionType && <actionType.icon className="w-4 h-4 text-green-600" />}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Select value={action.type} onValueChange={(value) => updateAction(index, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {action.type === 'send_email' && (
                      <div className="space-y-2">
                        <Input
                          placeholder={language === 'he' ? 'נושא האימייל' : 'Email subject'}
                          value={action.config?.subject || ''}
                          onChange={(e) => updateAction(index, 'config', { ...action.config, subject: e.target.value })}
                        />
                        <Textarea
                          placeholder={language === 'he' ? 'תוכן האימייל' : 'Email content'}
                          value={action.config?.body || ''}
                          onChange={(e) => updateAction(index, 'config', { ...action.config, body: e.target.value })}
                        />
                      </div>
                    )}

                    {action.type === 'send_notification' && (
                      <div className="space-y-2">
                        <Input
                          placeholder={language === 'he' ? 'כותרת ההתראה' : 'Notification title'}
                          value={action.config?.title || ''}
                          onChange={(e) => updateAction(index, 'config', { ...action.config, title: e.target.value })}
                        />
                        <Input
                          placeholder={language === 'he' ? 'תוכן ההתראה' : 'Notification message'}
                          value={action.config?.message || ''}
                          onChange={(e) => updateAction(index, 'config', { ...action.config, message: e.target.value })}
                        />
                      </div>
                    )}

                    {action.type === 'wait' && (
                      <Input
                        type="number"
                        placeholder={language === 'he' ? 'דקות להמתנה' : 'Minutes to wait'}
                        value={action.config?.minutes || ''}
                        onChange={(e) => updateAction(index, 'config', { ...action.config, minutes: e.target.value })}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          {language === 'he' ? 'ביטול' : 'Cancel'}
        </Button>
        <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
          <Zap className="w-4 h-4 ml-2" />
          {language === 'he' ? 'שמור אוטומציה' : 'Save Automation'}
        </Button>
      </div>
    </div>
  );
}