import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Circle, Loader2, RefreshCw, FileText, Archive, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';

export default function GmailWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gmail-emails', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      try {
        const response = await opsbrain.functions.invoke('syncGmail', {
          workspace_id: activeWorkspace.id,
          max_results: 5
        });
        return response.data;
      } catch (error) {
        console.error('Gmail sync error:', error);
        return null;
      }
    },
    enabled: !!activeWorkspace,
    refetchInterval: 2 * 60 * 1000 // רענון כל 2 דקות
  });

  const emails = data?.emails || [];

  const markAsReadMutation = useMutation({
    mutationFn: async (emailId) => {
      const response = await opsbrain.functions.invoke('manageGmail', {
        workspace_id: activeWorkspace.id,
        action: 'mark_read',
        email_id: emailId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gmail-emails']);
      toast.success(language === 'he' ? 'סומן כנקרא' : 'Marked as read');
    }
  });

  const archiveEmailMutation = useMutation({
    mutationFn: async (emailId) => {
      const response = await opsbrain.functions.invoke('manageGmail', {
        workspace_id: activeWorkspace.id,
        action: 'archive',
        email_id: emailId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gmail-emails']);
      toast.success(language === 'he' ? 'הועבר לארכיון' : 'Archived');
    }
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardContent className="py-8 text-center">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm opacity-70 mb-3">
            {language === 'he' ? 'חבר Gmail' : 'Connect Gmail'}
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30"
          >
            <RefreshCw className="w-3 h-3 inline ml-1" />
            {language === 'he' ? 'נסה שוב' : 'Try again'}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            Gmail
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{data.unread_count}</span>
            {data.invoices_found > 0 && (
              <div className="flex items-center gap-1 bg-orange-500 px-2 py-0.5 rounded-full text-xs">
                <FileText className="w-3 h-3" />
                {data.invoices_found}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {language === 'he' ? 'אין הודעות חדשות' : 'No new messages'}
          </p>
        ) : (
          emails.slice(0, 3).map((email, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm group hover:bg-white/5 p-2 rounded-lg transition-all">
              <div className="flex items-center gap-2 mt-1">
                <Circle className="w-2 h-2 fill-white" />
                {email.hasInvoice && <FileText className="w-3 h-3 text-orange-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{email.subject}</p>
                <p className="text-xs text-gray-400 truncate">{email.from}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/20"
                  onClick={() => markAsReadMutation.mutate(email.id)}
                  title={language === 'he' ? 'סמן כנקרא' : 'Mark as read'}
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/20"
                  onClick={() => archiveEmailMutation.mutate(email.id)}
                  title={language === 'he' ? 'ארכיון' : 'Archive'}
                >
                  <Archive className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
        {data.invoices_found > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-orange-400">
              ✨ {data.invoices_found} {language === 'he' ? 'חשבוניות זוהו ונוצרו משימות אוטומטית' : 'invoices detected, tasks created automatically'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}