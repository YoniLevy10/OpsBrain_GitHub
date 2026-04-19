import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Circle, Loader2, Archive, CheckCircle, FileText, X, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';

function EmailViewDialog({ email, open, onClose, workspaceId, language, onMarkRead, onArchive }) {
  const { data: bodyData, isLoading } = useQuery({
    queryKey: ['email-body', email?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEmailBody', { email_id: email.id });
      return res.data;
    },
    enabled: open && !!email?.id,
    staleTime: 5 * 60 * 1000
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white">
        <DialogHeader className="border-b pb-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold line-clamp-2">{email?.subject}</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">{email?.from}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => { onMarkRead(email.id); onClose(); }} className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              {language === 'he' ? 'סמן כנקרא' : 'Mark read'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onArchive(email.id); onClose(); }} className="text-xs">
              <Archive className="w-3 h-3 mr-1" />
              {language === 'he' ? 'ארכיון' : 'Archive'}
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {bodyData?.body || bodyData?.snippet || (language === 'he' ? 'לא ניתן לטעון את המייל' : 'Could not load email')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GmailWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const [selectedEmail, setSelectedEmail] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['gmail-emails', activeWorkspace?.id, user?.email],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      try {
        const response = await base44.functions.invoke('syncGmail', {
          workspace_id: activeWorkspace.id,
          max_results: 7
        });
        return response.data;
      } catch (error) {
        if (error?.response?.data?.error?.includes('not connected')) {
          return { emails: [], unread_count: 0, not_connected: true };
        }
        return null;
      }
    },
    enabled: !!activeWorkspace && !!user,
    refetchInterval: 10 * 60 * 1000
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (emailId) => {
      const response = await base44.functions.invoke('manageGmail', {
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
      const response = await base44.functions.invoke('manageGmail', {
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

  if (!data || data.not_connected) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-pink-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-8 h-8" />
          </div>
          <p className="text-sm opacity-90 mb-1 font-medium">
            {language === 'he' ? 'Gmail לא מחובר' : 'Gmail not connected'}
          </p>
          <p className="text-xs opacity-75 mb-4">
            {language === 'he' ? 'פתח צ\'אט והקלד "חבר Gmail"' : 'Open chat and type "Connect Gmail"'}
          </p>
          <Button
            size="sm"
            className="bg-white text-red-600 hover:bg-white/90"
            onClick={() => window.location.href = createPageUrl('Chat') + '?prefill=' + encodeURIComponent('חבר Gmail')}
          >
            {language === 'he' ? '💬 פתח צ\'אט' : '💬 Open Chat'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const emails = data?.emails || [];

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white h-[320px] flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
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

        <CardContent className="space-y-1 flex-1 overflow-y-auto px-4">
          {emails.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {language === 'he' ? 'אין הודעות' : 'No messages'}
            </p>
          ) : (
            emails.slice(0, 5).map((email, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEmail(email)}
                className="flex items-start gap-2 text-sm group hover:bg-white/10 p-2 rounded-lg transition-all cursor-pointer"
              >
                <Circle className="w-2 h-2 fill-white mt-2 flex-shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{email.subject}</p>
                  <p className="text-xs text-gray-400 truncate">{email.from}</p>
                </div>
                {email.hasInvoice && <FileText className="w-3 h-3 text-orange-400 flex-shrink-0 mt-1" />}
                <ChevronLeft className="w-3 h-3 text-gray-500 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
              </div>
            ))
          )}
          {data.invoices_found > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-orange-400">
                ✨ {data.invoices_found} {language === 'he' ? 'חשבוניות זוהו' : 'invoices detected'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmail && (
        <EmailViewDialog
          email={selectedEmail}
          open={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
          workspaceId={activeWorkspace?.id}
          language={language}
          onMarkRead={(id) => markAsReadMutation.mutate(id)}
          onArchive={(id) => archiveEmailMutation.mutate(id)}
        />
      )}
    </>
  );
}