import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function IntegrationManager({ integration, onConnected, onRequestAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  // בדוק אם האינטגרציה כבר מחוברת
  const { data: connectedIntegrations } = useQuery({
    queryKey: ['workspace-integrations', activeWorkspace?.id],
    queryFn: async () => {
      const result = await opsbrain.functions.invoke('getWorkspaceIntegrations');
      return result?.integrations || [];
    },
    enabled: !!activeWorkspace?.id
  });

  const isConnected = connectedIntegrations?.some(
    i => i.integration_name === integration.name.toLowerCase().replace(/\s+/g, '_')
  );

  const connectMutation = useMutation({
    mutationFn: async (credentials) => {
      return opsbrain.functions.invoke('connectIntegration', {
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
      if (onConnected) onConnected();
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
        return opsbrain.entities.WorkspaceIntegration.delete(connected.id);
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
    
    // מיפוי אינטגרציות ל-OAuth types
    const oauthMappings = {
      'Google Calendar': { type: 'googlecalendar', scopes: ['https://www.googleapis.com/auth/calendar'] },
      'Google Drive': { type: 'googledrive', scopes: ['https://www.googleapis.com/auth/drive.file'] },
      'Gmail': { type: 'gmail', scopes: ['https://www.googleapis.com/auth/gmail.modify'] },
      'Google Sheets': { type: 'googlesheets', scopes: ['https://www.googleapis.com/auth/spreadsheets'] },
      'Google Docs': { type: 'googledocs', scopes: ['https://www.googleapis.com/auth/documents'] },
      'Google Slides': { type: 'googleslides', scopes: ['https://www.googleapis.com/auth/presentations'] },
      'Slack': { type: 'slack', scopes: ['channels:read', 'chat:write', 'users:read'] },
      'Notion': { type: 'notion', scopes: ['read_content', 'update_content'] },
      'HubSpot': { type: 'hubspot', scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'] }
    };

    const oauthConfig = oauthMappings[integration.name];
    
    if (oauthConfig) {
      setIsOpen(false);
      // שימוש ב-request_oauth_authorization כדי לחבר ישירות
      toast.info('מתחבר...', { duration: 2000 });
      // הכלי request_oauth_authorization יפתח את חלון ההרשאה אוטומטית
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
  const isOAuthIntegration = ['Google Calendar', 'Google Drive', 'Gmail', 'Google Sheets', 
    'Google Docs', 'Google Slides', 'Slack', 'Notion', 'HubSpot'].includes(integration.name);

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
              >
                חבר עכשיו
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
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3 mb-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      חיבור מאובטח דרך OAuth
                    </p>
                    <p className="text-xs text-gray-600">
                      תתבקש לאשר גישה ל-{integration.name} באופן מאובטח דרך חלון הרשאות של {integration.name}.
                    </p>
                  </div>
                </div>
                <ul className="text-xs text-gray-600 space-y-1 mr-7 list-disc">
                  <li>חיבור מאובטח ללא צורך ב-API Keys</li>
                  <li>ניתן לנתק בכל עת</li>
                  <li>הרשאות מוגבלות בלבד</li>
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
                  onClick={() => {
                    setIsOpen(false);
                    if (onRequestAuth) {
                      const oauthMappings = {
                        'Google Calendar': { type: 'googlecalendar', scopes: ['https://www.googleapis.com/auth/calendar'] },
                        'Google Drive': { type: 'googledrive', scopes: ['https://www.googleapis.com/auth/drive.file'] },
                        'Gmail': { type: 'gmail', scopes: ['https://www.googleapis.com/auth/gmail.modify'] },
                        'Google Sheets': { type: 'googlesheets', scopes: ['https://www.googleapis.com/auth/spreadsheets'] },
                        'Google Docs': { type: 'googledocs', scopes: ['https://www.googleapis.com/auth/documents'] },
                        'Google Slides': { type: 'googleslides', scopes: ['https://www.googleapis.com/auth/presentations'] },
                        'Slack': { type: 'slack', scopes: ['channels:read', 'chat:write', 'users:read'] },
                        'Notion': { type: 'notion', scopes: ['read_content', 'update_content'] },
                        'HubSpot': { type: 'hubspot', scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'] }
                      };
                      const config = oauthMappings[integration.name];
                      if (config) {
                        onRequestAuth(config.type, config.scopes, integration.name);
                      }
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  חבר עכשיו
                </Button>
              </div>
            </div>
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