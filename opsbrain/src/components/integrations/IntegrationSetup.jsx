import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Copy } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { toast } from 'sonner';

export default function IntegrationSetup({ integration, onSave, onCancel }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState(integration || {
    name: '',
    provider: '',
    type: 'custom',
    sync_frequency: 'daily',
    config: {},
    credentials: {}
  });
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    // סימולציה של בדיקת חיבור
    setTimeout(() => {
      setIsTesting(false);
      toast.success(language === 'he' ? 'החיבור תקין' : 'Connection successful');
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const webhookBase =
    import.meta.env.VITE_WEBHOOK_BASE_URL ||
    import.meta.env.VITE_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const webhookUrl = `${webhookBase.replace(/\/$/, '')}/api/webhooks/${formData.workspace_id || 'YOUR_WORKSPACE'}/${formData.provider || 'provider'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            {language === 'he' ? 'בסיסי' : 'Basic'}
          </TabsTrigger>
          <TabsTrigger value="auth">
            {language === 'he' ? 'אימות' : 'Authentication'}
          </TabsTrigger>
          <TabsTrigger value="webhook">
            Webhook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label>{language === 'he' ? 'שם האינטגרציה' : 'Integration Name'}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'he' ? 'לדוגמה: Stripe Payments' : 'e.g., Stripe Payments'}
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'ספק' : 'Provider'}</Label>
            <Input
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder={language === 'he' ? 'לדוגמה: stripe' : 'e.g., stripe'}
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'סוג' : 'Type'}</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">{language === 'he' ? 'תשלומים' : 'Payment'}</SelectItem>
                <SelectItem value="email">{language === 'he' ? 'אימייל' : 'Email'}</SelectItem>
                <SelectItem value="storage">{language === 'he' ? 'אחסון' : 'Storage'}</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="accounting">{language === 'he' ? 'הנהלת חשבונות' : 'Accounting'}</SelectItem>
                <SelectItem value="custom">{language === 'he' ? 'מותאם אישית' : 'Custom'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === 'he' ? 'תדירות סנכרון' : 'Sync Frequency'}</Label>
            <Select value={formData.sync_frequency} onValueChange={(value) => setFormData({ ...formData, sync_frequency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">{language === 'he' ? 'בזמן אמת' : 'Real-time'}</SelectItem>
                <SelectItem value="hourly">{language === 'he' ? 'כל שעה' : 'Hourly'}</SelectItem>
                <SelectItem value="daily">{language === 'he' ? 'יומי' : 'Daily'}</SelectItem>
                <SelectItem value="manual">{language === 'he' ? 'ידני' : 'Manual'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={formData.credentials?.api_key || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                credentials: { ...formData.credentials, api_key: e.target.value }
              })}
              placeholder="sk_live_..."
            />
          </div>

          <div>
            <Label>API Secret</Label>
            <Input
              type="password"
              value={formData.credentials?.api_secret || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                credentials: { ...formData.credentials, api_secret: e.target.value }
              })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'הערות נוספות' : 'Additional Notes'}</Label>
            <Textarea
              value={formData.config?.notes || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                config: { ...formData.config, notes: e.target.value }
              })}
              placeholder={language === 'he' ? 'הערות על האינטגרציה' : 'Notes about this integration'}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {language === 'he' ? 'בודק חיבור...' : 'Testing...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 ml-2" />
                {language === 'he' ? 'בדוק חיבור' : 'Test Connection'}
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              {language === 'he' ? 'השתמש ב-URL הזה לקבלת webhook events:' : 'Use this URL to receive webhook events:'}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border text-xs">
                {webhookUrl}
              </code>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success(language === 'he' ? 'הועתק' : 'Copied');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Webhook Secret</Label>
            <Input
              value={formData.webhook_secret || ''}
              onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
              placeholder="whsec_..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'he' ? 'משמש לאימות webhook events' : 'Used to verify webhook events'}
            </p>
          </div>

          <div>
            <Label>{language === 'he' ? 'Events לקבלה' : 'Events to Receive'}</Label>
            <Textarea
              value={formData.config?.webhook_events?.join('\n') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                config: { 
                  ...formData.config, 
                  webhook_events: e.target.value.split('\n').filter(e => e.trim())
                }
              })}
              placeholder="payment.succeeded&#10;customer.created&#10;invoice.paid"
              rows={5}
            />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'he' ? 'event אחד בכל שורה' : 'One event per line'}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {language === 'he' ? 'ביטול' : 'Cancel'}
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
          {language === 'he' ? 'שמור אינטגרציה' : 'Save Integration'}
        </Button>
      </div>
    </form>
  );
}