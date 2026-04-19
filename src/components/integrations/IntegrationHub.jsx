import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { 
  Zap, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Database,
  Cloud,
  ShoppingCart,
  FileSpreadsheet,
  Smartphone,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationHub() {
  const [connecting, setConnecting] = useState(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestedIntegration, setRequestedIntegration] = useState('');

  const integrations = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'קבלת תשלומים ומנויים',
      icon: ShoppingCart,
      status: 'available',
      category: 'payments',
      features: ['תשלומים', 'מנויים', 'חיובים חוזרים']
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'תקשורת אוטומטית עם לקוחות',
      icon: MessageSquare,
      status: 'connected',
      category: 'communication',
      features: ['הודעות', 'תזכורות', 'עדכונים']
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'ניהול מיילים ותקשורת',
      icon: Mail,
      status: 'available',
      category: 'communication',
      features: ['שליחת מיילים', 'תבניות', 'אוטומציה']
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'סנכרון פגישות ואירועים',
      icon: Calendar,
      status: 'coming_soon',
      category: 'productivity',
      features: ['פגישות', 'תזכורות', 'זמינות']
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      description: 'יבוא וייצוא נתונים',
      icon: FileSpreadsheet,
      status: 'coming_soon',
      category: 'data',
      features: ['יבוא', 'ייצוא', 'סנכרון']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'התראות לערוצי Slack',
      icon: MessageSquare,
      status: 'coming_soon',
      category: 'communication',
      features: ['התראות', 'דיווחים', 'שיתוף']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'התחבר לאלפי אפליקציות',
      icon: Zap,
      status: 'planned',
      category: 'automation',
      features: ['אוטומציה', 'workflows', 'חיבורים']
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'סנכרון חשבונאות',
      icon: Database,
      status: 'planned',
      category: 'accounting',
      features: ['חשבוניות', 'הוצאות', 'דוחות']
    }
  ];

  const handleConnect = async (integration) => {
    setConnecting(integration.id);
    
    if (integration.status === 'available') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${integration.name} מחובר בהצלחה!`);
    } else if (integration.status === 'coming_soon' || integration.status === 'planned') {
      // Sign up for updates
      try {
        const user = await base44.auth.me();
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `הרשמה לעדכונים - ${integration.name}`,
          body: `נרשמת לקבלת עדכון כש-${integration.name} יהיה זמין באפליקציה. נעדכן אותך ברגע שהאינטגרציה תהיה מוכנה!`
        });
        toast.success(`נרשמת לעדכונים על ${integration.name}`);
      } catch (error) {
        toast.error('שגיאה בהרשמה לעדכונים');
      }
    }
    
    setConnecting(null);
  };

  const handleRequestIntegration = async (e) => {
    e.preventDefault();
    try {
      const user = await base44.auth.me();
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'בקשה לאינטגרציה חדשה התקבלה',
        body: `תודה על הבקשה!\n\nאינטגרציה מבוקשת: ${requestedIntegration}\n\nנבדוק את האפשרות ונעדכן אותך בהקדם.`
      });
      toast.success('הבקשה נשלחה בהצלחה!');
      setRequestDialogOpen(false);
      setRequestedIntegration('');
    } catch (error) {
      toast.error('שגיאה בשליחת הבקשה');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      connected: { label: 'מחובר', className: 'bg-green-100 text-green-700' },
      available: { label: 'זמין', className: 'bg-blue-100 text-blue-700' },
      coming_soon: { label: 'בקרוב', className: 'bg-yellow-100 text-yellow-700' },
      planned: { label: 'מתוכנן', className: 'bg-gray-100 text-gray-700' }
    };
    const config = configs[status] || configs.planned;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6" />
          מרכז אינטגרציות
        </h2>
        <p className="text-gray-500 mt-1">התחבר לכלים שאתה כבר משתמש בהם</p>
      </div>

      {categories.map(category => {
        const categoryIntegrations = integrations.filter(i => i.category === category);
        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 capitalize">
              {category === 'payments' && '💳 תשלומים'}
              {category === 'communication' && '💬 תקשורת'}
              {category === 'productivity' && '📅 פרודוקטיביות'}
              {category === 'data' && '📊 נתונים'}
              {category === 'automation' && '⚡ אוטומציה'}
              {category === 'accounting' && '🧾 חשבונאות'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map(integration => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      <CardDescription className="mt-2">
                        {integration.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {integration.features.map(feature => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button
                          onClick={() => handleConnect(integration)}
                          disabled={connecting === integration.id || integration.status === 'connected'}
                          variant={integration.status === 'connected' ? 'outline' : 'default'}
                          className="w-full"
                        >
                          {connecting === integration.id ? (
                            'מתחבר...'
                          ) : integration.status === 'connected' ? (
                            <>
                              <CheckCircle className="w-4 h-4 ml-2" />
                              מחובר
                            </>
                          ) : integration.status === 'available' ? (
                            'התחבר עכשיו'
                          ) : (
                            'עדכן אותי'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Card className="border-dashed bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6 text-center">
          <Cloud className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">צריך אינטגרציה אחרת?</h3>
          <p className="text-sm text-gray-600 mb-4">
            ספר לנו ונוסיף אותה במהרה
          </p>
          <Button variant="outline" onClick={() => setRequestDialogOpen(true)}>
            <ExternalLink className="w-4 h-4 ml-2" />
            בקש אינטגרציה
          </Button>
        </CardContent>
      </Card>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>בקש אינטגרציה חדשה</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestIntegration} className="space-y-4">
            <div>
              <Label>איזו אינטגרציה חסרה לך?</Label>
              <Input
                value={requestedIntegration}
                onChange={(e) => setRequestedIntegration(e.target.value)}
                placeholder="למשל: Salesforce, Monday, Asana..."
                required
              />
            </div>
            <Button type="submit" className="w-full">
              שלח בקשה
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}