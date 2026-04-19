import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Brain, Users, Loader2, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MessagesWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['recent-comments', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      // שליפת 5 תגובות אחרונות מכל הישויות
      return await base44.entities.Comment.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date', 5);
    },
    enabled: !!activeWorkspace
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

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white h-[320px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            {language === 'he' ? 'הודעות אחרונות' : 'Recent Messages'}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs hover:bg-white/20"
            onClick={() => navigate(createPageUrl('Chat'))}
          >
            <ExternalLink className="w-3 h-3 ml-1" />
            {language === 'he' ? 'לצ\'אט' : 'Go to Chat'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-400">
              {language === 'he' ? 'אין הודעות חדשות' : 'No new messages'}
            </p>
            <Button
              size="sm"
              className="mt-3 bg-purple-500 hover:bg-purple-600"
              onClick={() => navigate(createPageUrl('Chat'))}
            >
              {language === 'he' ? 'התחל שיחה' : 'Start Chat'}
            </Button>
          </div>
        ) : (
          comments.map((comment, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm group hover:bg-white/5 p-2 rounded-lg transition-all cursor-pointer"
              onClick={() => navigate(createPageUrl('Chat'))}
            >
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                {comment.author_email === 'ai' ? (
                  <Brain className="w-4 h-4 text-purple-400" />
                ) : (
                  <Users className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-xs">
                    {comment.author_name || comment.author_email}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_date), {
                      addSuffix: true,
                      locale: language === 'he' ? he : undefined
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}