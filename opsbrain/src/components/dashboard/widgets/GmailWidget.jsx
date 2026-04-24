import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Circle, Loader2, RefreshCw, FileText, Archive, CheckCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function GmailWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gmail-emails', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      try {
        const response = await opsbrain.functions.invoke('syncGmail', {
          workspace_id: activeWorkspace.id,
          max_results: 5
        });
        return response;
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
      return response;
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
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gmail-emails']);
      toast.success(language === 'he' ? 'הועבר לארכיון' : 'Archived');
    }
  });

  if (isLoading) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
              <Mail className="w-4 h-4 text-rose-700" />
            </div>
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            {language === 'he' ? 'עדיין לא מחובר. חבר Gmail כדי להציג הודעות חדשות.' : 'Not connected yet.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 ml-2" />
              {language === 'he' ? 'נסה שוב' : 'Retry'}
            </Button>
            <Button size="sm" onClick={() => navigate('/app/Integrations')}>
              {language === 'he' ? 'נהל אינטגרציות' : 'Manage integrations'}
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
              <Mail className="w-4 h-4 text-rose-700" />
            </div>
            Gmail
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">{data.unread_count}</span>
            {data.invoices_found > 0 && (
              <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs border border-amber-200">
                <FileText className="w-3 h-3" />
                {data.invoices_found}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            {language === 'he' ? 'אין הודעות חדשות' : 'No new messages'}
          </p>
        ) : (
          emails.slice(0, 3).map((email, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm group hover:bg-slate-50 p-2 rounded-lg transition-all">
              <div className="flex items-center gap-2 mt-1">
                <Circle className="w-2 h-2 fill-slate-900 text-slate-900" />
                {email.hasInvoice && <FileText className="w-3 h-3 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-slate-900">{email.subject}</p>
                <p className="text-xs text-slate-500 truncate">{email.from}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => markAsReadMutation.mutate(email.id)}
                  title={language === 'he' ? 'סמן כנקרא' : 'Mark as read'}
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
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
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-amber-700">
              {data.invoices_found} {language === 'he' ? 'חשבוניות זוהו' : 'invoices detected'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}