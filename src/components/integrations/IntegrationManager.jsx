import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

// מיפוי אינטגרציות ל-OAuth types
const oauthMappings = {
  'Google Calendar': { type: 'googlecalendar', scopes: ['https://www.googleapis.com/auth/calendar'] },
  'Google Drive': { type: 'googledrive', scopes: ['https://www.googleapis.com/auth/drive.file'] },
  'Gmail': { type: 'gmail', scopes: ['https://www.googleapis.com/auth/gmail.modify'] },
  'Google Sheets': { type: 'googlesheets', scopes: ['https://www.googleapis.com/auth/spreadsheets'] },
  'Google Docs': { type: 'googledocs', scopes: ['https://www.googleapis.com/auth/documents'] },
  'Google Slides': { type: 'googleslides', scopes: ['https://www.googleapis.com/auth/presentations'] },
  'Slack': { type: 'slack', scopes: ['chat:write', 'channels:read', 'users:read'] },
  'Notion': { type: 'notion', scopes: [] },
  'HubSpot': { type: 'hubspot', scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'] }
};

export default function IntegrationManager({ integration }) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  // בדוק אם האינטגרציה כבר מחוברת
  const { data: connectedIntegrations } = useQuery({
    queryKey: ['workspace-integrations', activeWorkspace?.id],
    queryFn: async () => {
      const result = await base44.functions.invoke('getWorkspaceIntegrations');
      return result.data.integrations || [];
    },
    enabled: !!activeWorkspace?.id
  });

  const isConnected = connectedIntegrations?.some(
    i => i.integration_name === integration.name.toLowerCase().replace(/\s+/g, '_')
  );

  const connectMutation = useMutation({
    mutationFn: async (credentials) => {
      return base44.functions.invoke('connectIntegration', {
        integration_name: integration.name.toLowerCase().replace(/\s+/g, '_'),
        integration_type: integration.category.toLowerCase(),
        credentials,
        settings: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-integrations']);
      toast.success(`${integration.name} חובר בהצלחה!`);
      setIsOpen(false);
      setApiKey('');
    },
    onError: (error) => {
      toast.error('שגיאה בחיבור האינטגרציה');
      console.error(error);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const connected = connectedIntegrations.find(
        i => i.integration_name === integration.name.toLowerCase().replace(/\s+/g, '_')
      );
      if (connected) {
        return base44.entities.WorkspaceIntegration.delete(connected.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-integrations']);
      toast.success(`${integration.name} נותק`);
    },
    onError: () => {
      toast.error('שגיאה בניתוק האינטגרציה');
    }
  });

  const handleConnect = async (e) => {
    e?.preventDefault?.();
    
    const oauthConfig = oauthMappings[integration.name];
    
    if (oauthConfig) {
      setIsOpen(false);
      setIsConnecting(true);
      
      try {
        // קבלת נתוני ההרשאה
        const response = await base44.functions.invoke('requestIntegrationAuth', {
          integration_type: oauthConfig.type,
          integration_name: integration.name
        });

        if (response.data?.success) {
          // יצירת URL להרשאת OAuth
          const authUrl = `https://app.base44.com/oauth/authorize?` + 
            `integration=${oauthConfig.type}&` +
            `reason=${encodeURIComponent(response.data.reason)}&` +
            `scopes=${encodeURIComponent(response.data.scopes.join(','))}&` +
            `redirect=${encodeURIComponent(window.location.href)}`;
          
          // ניתוב להרשאה
          window.location.href = authUrl;
        } else {
          throw new Error('Failed to get authorization data');
        }
      } catch (error) {
        console.error('Connection error:', error);
        toast.error('שגיאה בחיבור. נא לנסות שוב');
        setIsConnecting(false);
      }
      
      return;
    }

    // אינטגרציה עם API Key
    if (!apiKey) {
      toast.error('נא להזין API Key');
      return;
    }
    connectMutation.mutate({ api_key: apiKey });
  };

  const Icon = integration.icon;
  
  // בדוק אם זו אינטגרציית OAuth
  const isOAuthIntegration = !!oauthMappings[integration.name];

  return (
    <>
      <div
        className="group relative p-4 border rounded-xl transition-all border-gray-200 hover:border-gray-300 hover:shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">{integration.name}</h4>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  מחובר
                </Badge>
              ) : integration.status === 'available' ? (
                <Badge variant="outline" className="text-xs">זמין</Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                  בקרוב
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{integration.description}</p>
          </div>
        </div>
        
        {integration.status === 'available' && (
          <div className="mt-3 flex gap-2">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-1" />
                    נתק
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 bg-black hover:bg-gray-800"
                onClick={() => setIsOpen(true)}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  'חבר עכשיו'
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>חיבור {integration.name}</DialogTitle>
            <DialogDescription>
              {isOAuthIntegration 
                ? `חבר את ${integration.name} דרך העוזר האישי שלך`
                : `הזן את פרטי ההתחברות שלך כדי לחבר את ${integration.name} למרחב העבודה`
              }
            </DialogDescription>
          </DialogHeader>
          
          {isOAuthIntegration ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      חיבור דרך העוזר האישי
                    </p>
                    <p className="text-xs text-gray-600">
                      העוזר האישי של OpsBrain יעזור לך לחבר את {integration.name} באופן מאובטח דרך OAuth.
                    </p>
                  </div>
                </div>
                <ul className="text-xs text-gray-600 space-y-1 mr-7 list-disc">
                  <li>חיבור מאובטח עם הרשאות מדויקות</li>
                  <li>הסוכן מנחה אותך צעד אחר צעד</li>
                  <li>ניתן לנתק בכל עת מההגדרות</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={isConnecting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      פותח צ'אט...
                    </>
                  ) : (
                    <>
                      🤖
                      פתח עם העוזר
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="הזן את ה-API Key שלך"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  תוכל למצוא את ה-API Key בהגדרות החשבון שלך ב-{integration.name}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={connectMutation.isPending}
                  className="flex-1 bg-black hover:bg-gray-800"
                >
                  {connectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מחבר...
                    </>
                  ) : (
                    'חבר'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}