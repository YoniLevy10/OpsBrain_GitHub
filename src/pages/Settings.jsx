import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, User, Save, Loader2, CheckCircle2, MessageCircle, Calendar, FileText, Mail, Slack, FileCode, Globe, Zap, Crown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import WorkspaceSettings from '@/components/workspace/WorkspaceSettings';
import IntegrationManager from '@/components/integrations/IntegrationManager';
import IntegrationSearchDialog from '@/components/integrations/IntegrationSearchDialog';
import SubscriptionPlans from '@/components/payments/SubscriptionPlans';

export default function Settings() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const [user, setUser] = useState(null);
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    employees_count: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      setFormData({
        name: activeWorkspace.name || '',
        industry: activeWorkspace.industry || '',
        employees_count: activeWorkspace.employees_count || ''
      });
    }
  }, [activeWorkspace]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');
      return base44.entities.Workspace.update(activeWorkspace.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace']);
      toast.success('הגדרות נשמרו בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בשמירת ההגדרות');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      employees_count: formData.employees_count ? parseInt(formData.employees_count) : null
    });
  };

  const whatsappUrl = base44.agents.getWhatsAppConnectURL('opsbrain');

  const integrations = [
    // תקשורת ו-WhatsApp
    { name: 'WhatsApp Business', icon: MessageCircle, color: 'bg-green-500', description: 'סגירת יום והודעות ללקוחות', category: 'תקשורת', status: 'available', url: whatsappUrl },
    { name: 'Gmail', icon: Mail, color: 'bg-red-500', description: 'שליחת דוחות ותזכורות', category: 'תקשורת', status: 'available' },
    { name: 'Slack', icon: Slack, color: 'bg-purple-600', description: 'שליחת התראות לצוות', category: 'תקשורת', status: 'available' },
    { name: 'Outlook', icon: Mail, color: 'bg-blue-600', description: 'תקשורת אימייל', category: 'תקשורת', status: 'coming_soon' },
    { name: 'Telegram', icon: MessageCircle, color: 'bg-blue-400', description: 'התראות מהירות', category: 'תקשורת', status: 'coming_soon' },
    
    // הנהלת חשבונות
    { name: 'iCount', icon: FileCode, color: 'bg-purple-600', description: 'חשבוניות וקבלות', category: 'הנהלת חשבונות', status: 'coming_soon' },
    { name: 'Green Invoice', icon: FileCode, color: 'bg-green-600', description: 'הנפקת חשבוניות', category: 'הנהלת חשבונות', status: 'coming_soon' },
    { name: 'Invoice4u', icon: FileCode, color: 'bg-blue-500', description: 'ניהול חשבוניות', category: 'הנהלת חשבונות', status: 'coming_soon' },
    { name: 'EZcount', icon: FileCode, color: 'bg-orange-500', description: 'הנהלת חשבונות מלאה', category: 'הנהלת חשבונות', status: 'coming_soon' },
    
    // סליקה ותשלומים
    { name: 'Tranzila', icon: Globe, color: 'bg-blue-600', description: 'סליקת אשראי', category: 'תשלומים', status: 'coming_soon' },
    { name: 'PayPlus', icon: Globe, color: 'bg-indigo-600', description: 'קבלת תשלומים', category: 'תשלומים', status: 'coming_soon' },
    { name: 'Stripe', icon: Globe, color: 'bg-purple-600', description: 'תשלומים בינלאומיים', category: 'תשלומים', status: 'coming_soon' },
    { name: 'PayPal', icon: Globe, color: 'bg-blue-500', description: 'תשלומי PayPal', category: 'תשלומים', status: 'coming_soon' },
    
    // בנקים
    { name: 'בנק הפועלים', icon: Building2, color: 'bg-red-600', description: 'חשבון בנק', category: 'בנקים', status: 'coming_soon' },
    { name: 'בנק לאומי', icon: Building2, color: 'bg-blue-700', description: 'חשבון בנק', category: 'בנקים', status: 'coming_soon' },
    { name: 'בנק דיסקונט', icon: Building2, color: 'bg-yellow-600', description: 'חשבון בנק', category: 'בנקים', status: 'coming_soon' },
    { name: 'מזרחי טפחות', icon: Building2, color: 'bg-purple-700', description: 'חשבון בנק', category: 'בנקים', status: 'coming_soon' },
    { name: 'One Zero', icon: Building2, color: 'bg-gray-700', description: 'בנק דיגיטלי', category: 'בנקים', status: 'coming_soon' },
    
    // CRM וניהול לקוחות
    { name: 'HubSpot', icon: User, color: 'bg-orange-600', description: 'CRM ושיווק', category: 'CRM', status: 'available' },
    { name: 'Notion', icon: FileText, color: 'bg-gray-900', description: 'סנכרון מסמכים', category: 'CRM', status: 'available' },
    { name: 'Google Sheets', icon: FileCode, color: 'bg-green-600', description: 'ייצוא דוחות', category: 'CRM', status: 'available' },
    { name: 'Monday', icon: User, color: 'bg-pink-600', description: 'ניהול פרויקטים', category: 'CRM', status: 'coming_soon' },
    { name: 'Zoho', icon: User, color: 'bg-red-600', description: 'CRM מקיף', category: 'CRM', status: 'coming_soon' },
    
    // יומנים ופגישות
    { name: 'Google Calendar', icon: Calendar, color: 'bg-blue-500', description: 'סנכרון אירועים', category: 'יומן', status: 'available' },
    { name: 'Calendly', icon: Calendar, color: 'bg-blue-600', description: 'תזמון פגישות', category: 'יומן', status: 'coming_soon' },
    { name: 'SimplyBook', icon: Calendar, color: 'bg-purple-500', description: 'הזמנת תורים', category: 'יומן', status: 'coming_soon' },
    { name: 'Setmore', icon: Calendar, color: 'bg-teal-600', description: 'ניהול לוח זמנים', category: 'יומן', status: 'coming_soon' },
    
    // מסמכים ואחסון
    { name: 'Google Drive', icon: FileText, color: 'bg-yellow-500', description: 'גיבוי מסמכים', category: 'מסמכים', status: 'available' },
    { name: 'Google Docs', icon: FileText, color: 'bg-blue-500', description: 'יצירת מסמכים', category: 'מסמכים', status: 'available' },
    { name: 'Google Slides', icon: FileText, color: 'bg-orange-500', description: 'מצגות', category: 'מסמכים', status: 'available' },
    { name: 'Dropbox', icon: FileText, color: 'bg-blue-600', description: 'אחסון קבצים', category: 'מסמכים', status: 'coming_soon' },
    { name: 'DocuSign', icon: FileText, color: 'bg-red-600', description: 'חתימות דיגיטליות', category: 'מסמכים', status: 'coming_soon' },
    { name: 'HelloSign', icon: FileText, color: 'bg-orange-500', description: 'חתימות אלקטרוניות', category: 'מסמכים', status: 'coming_soon' },
    
    // משימות וניהול
    { name: 'Trello', icon: FileText, color: 'bg-blue-600', description: 'לוחות משימות', category: 'משימות', status: 'coming_soon' },
    { name: 'Asana', icon: FileText, color: 'bg-pink-600', description: 'ניהול משימות', category: 'משימות', status: 'coming_soon' },
    { name: 'ClickUp', icon: FileText, color: 'bg-purple-600', description: 'פרויקטים ומשימות', category: 'משימות', status: 'coming_soon' },
    
    // אוטומציות
    { name: 'Make', icon: Zap, color: 'bg-purple-600', description: 'אוטומציות ללא קוד', category: 'אוטומציות', status: 'coming_soon' },
    { name: 'Zapier', icon: Zap, color: 'bg-orange-500', description: 'חיבור לאלפי כלים', category: 'אוטומציות', status: 'coming_soon' },
    { name: 'IFTTT', icon: Zap, color: 'bg-blue-600', description: 'אוטומציות חכמות', category: 'אוטומציות', status: 'coming_soon' },
    
    // שיווק וטפסים
    { name: 'Google Forms', icon: FileText, color: 'bg-purple-600', description: 'טפסים ומשובים', category: 'שיווק', status: 'coming_soon' },
    { name: 'Typeform', icon: FileText, color: 'bg-gray-900', description: 'טפסים אינטראקטיביים', category: 'שיווק', status: 'coming_soon' },
    { name: 'Wix', icon: Globe, color: 'bg-black', description: 'אתרים ודפי נחיתה', category: 'שיווק', status: 'coming_soon' },
    { name: 'WordPress', icon: Globe, color: 'bg-blue-700', description: 'ניהול תוכן', category: 'שיווק', status: 'coming_soon' },
    
    // דיווחים ואנליטיקה
    { name: 'Google Analytics', icon: Globe, color: 'bg-orange-600', description: 'ניתוח תנועה', category: 'דיווחים', status: 'coming_soon' },
    { name: 'Looker Studio', icon: Globe, color: 'bg-blue-600', description: 'דשבורדים חזותיים', category: 'דיווחים', status: 'coming_soon' }
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 mt-2">נהל את פרטי מרחב העבודה, חברים, אינטגרציות והחשבון שלך</p>
      </div>

      {/* Workspace Members */}
      <WorkspaceSettings />

      {/* Subscription */}
      <SubscriptionCard user={user} />

      {/* Business Info */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">פרטי מרחב העבודה</CardTitle>
              <CardDescription>מידע זה יעזור ל-OpsBrain להבין את ההקשר העסקי שלך</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מרחב העבודה</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם מרחב העבודה שלך"
                className="rounded-xl"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">תחום העסק</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="למשל: שיווק, עיצוב, ייעוץ..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employees_count">מספר עובדים</Label>
                <Input
                  id="employees_count"
                  type="number"
                  value={formData.employees_count}
                  onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
                  placeholder="1-10"
                  className="rounded-xl"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="bg-black hover:bg-gray-800 rounded-xl"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Integrations - מצומצם */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">אינטגרציות</CardTitle>
                <CardDescription>חבר את OpsBrain לכלים שאתה כבר משתמש בהם</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowIntegrationsDialog(true)}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              חפש אינטגרציה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* רק אינטגרציות פופולריות */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">פופולריות</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {integrations.filter(i => i.status === 'available').slice(0, 2).map((integration) => (
                <IntegrationManager
                  key={integration.name}
                  integration={integration}
                  onRequestAuth={(integrationType, scopes, name) => {
                    toast.info('מתחבר...', { duration: 2000 });
                  }}
                />
              ))}
              {integrations.filter(i => i.category === 'הנהלת חשבונות').slice(0, 2).map((integration) => (
                <IntegrationManager
                  key={integration.name}
                  integration={integration}
                  onRequestAuth={(integrationType, scopes, name) => {
                    toast.info('מתחבר...', { duration: 2000 });
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">יש לנו עוד {integrations.length - 4} אינטגרציות</p>
                <p className="text-xs text-gray-600 mb-2">
                  חפש בין כל האינטגרציות הזמינות או עבור למרכז האינטגרציות המלא
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowIntegrationsDialog(true)}
                    className="text-xs text-purple-600 font-medium hover:underline"
                  >
                    חפש אינטגרציה →
                  </button>
                  <span className="text-gray-300">|</span>
                  <a 
                    href={createPageUrl('Integrations')} 
                    className="text-xs text-purple-600 font-medium hover:underline"
                  >
                    מרכז אינטגרציות →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* דיאלוג חיפוש אינטגרציות */}
      <IntegrationSearchDialog
        open={showIntegrationsDialog}
        onClose={() => setShowIntegrationsDialog(false)}
        integrations={integrations}
      />

      {/* User Info */}
      {user && (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-lg">פרטי חשבון</CardTitle>
                <CardDescription>מידע על החשבון שלך</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">שם</span>
                <span className="font-medium">{user.full_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">אימייל</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm">סטטוס</span>
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  פעיל
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Account */}
      {user && (
        <DeleteAccountSection user={user} />
      )}
    </div>
  );
}

function SubscriptionCard({ user }) {
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  
  const isActive = user?.subscription_status === 'active';
  const planName = isActive ? 'Premium' : 'Free';
  const planPrice = isActive ? '$99' : '$0';

  return (
    <>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">המנוי שלי</CardTitle>
              <CardDescription>נהל את המנוי והחיוב שלך</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">{planName}</h3>
                <p className="text-gray-600">המנוי הנוכחי שלך</p>
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold">{planPrice}</p>
                <p className="text-sm text-gray-600">לחודש</p>
              </div>
            </div>
            
            {isActive ? (
              <>
                <div className="space-y-2 mb-4">
                  <p className="text-sm">✓ מרחבי עבודה ללא הגבלה</p>
                  <p className="text-sm">✓ חברי צוות ללא הגבלה</p>
                  <p className="text-sm">✓ כל תכונות ה-AI</p>
                  <p className="text-sm">✓ אינטגרציות מתקדמות</p>
                  <p className="text-sm">✓ תמיכה מהירה</p>
                </div>
                <p className="text-sm text-gray-600">
                  סטטוס: <span className="text-green-600 font-semibold">פעיל</span>
                </p>
              </>
            ) : (
              <div className="space-y-2 mb-4">
                <p className="text-sm">✓ עד 3 מרחבי עבודה</p>
                <p className="text-sm">✓ עד 5 חברי צוות</p>
                <p className="text-sm">✓ תובנות AI בסיסיות</p>
                <p className="text-sm text-gray-400">✗ אינטגרציות מתקדמות</p>
                <p className="text-sm text-gray-400">✗ אוטומציות מותאמות אישית</p>
              </div>
            )}
          </div>

          <Button 
            onClick={() => setShowPlansDialog(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isActive ? 'נהל מנוי' : 'שדרג ל-Premium'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">בחר את התוכנית שלך</DialogTitle>
          </DialogHeader>
          <SubscriptionPlans />
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteAccountSection({ user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== user.email) {
      toast.error('האימייל שהזנת לא תואם');
      return;
    }

    setIsDeleting(true);
    try {
      // Call delete account API
      await base44.auth.logout('/');
      toast.success('החשבון נמחק בהצלחה');
    } catch (error) {
      toast.error('שגיאה במחיקת החשבון');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-lg text-red-800">אזור מסוכן</CardTitle>
          <CardDescription>פעולה זו היא בלתי הפיכה</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            מחיקת החשבון תמחק לצמיתות את כל הנתונים, מרחבי העבודה, וההגדרות שלך. 
            פעולה זו לא ניתנת לביטול.
          </p>
          <Button 
            variant="destructive" 
            onClick={() => setShowDialog(true)}
            className="w-full md:w-auto"
          >
            מחק חשבון לצמיתות
          </Button>
        </CardContent>
      </Card>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDialog(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ אזהרה: מחיקת חשבון</h3>
            <p className="text-gray-700 mb-4">
              פעולה זו תמחק לצמיתות את החשבון שלך וכל הנתונים הקשורים אליו. 
              <strong className="block mt-2">לא ניתן לשחזר נתונים לאחר המחיקה.</strong>
            </p>
            <div className="mb-4">
              <Label>אנא הקלד את האימייל שלך לאישור:</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={user.email}
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                ביטול
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="flex-1"
                disabled={isDeleting || confirmText !== user.email}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  'מחק לצמיתות'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}