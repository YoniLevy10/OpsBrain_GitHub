import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Trash2, Reply } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function CommentsSection({ entityType, entityId, entityName }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  React.useEffect(() => {
    opsbrain.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Comment.filter({
        workspace_id: activeWorkspace.id,
        entity_type: entityType,
        entity_id: entityId
      }, '-created_date');
    },
    enabled: !!activeWorkspace && !!entityType && !!entityId,
    refetchInterval: 5000
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      // יצירת תגובה
      const comment = await opsbrain.entities.Comment.create({
        workspace_id: activeWorkspace.id,
        entity_type: entityType,
        entity_id: entityId,
        author_email: user.email,
        author_name: user.full_name || user.email,
        ...commentData
      });

      // יצירת פעילות
      await opsbrain.entities.ActivityFeed.create({
        workspace_id: activeWorkspace.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        action_type: 'commented',
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description: `${language === 'he' ? 'הגיב על' : 'commented on'} ${entityName}`,
        color: 'text-blue-600 bg-blue-50'
      });

      // שליחת התראות למשתמשים שתויגו
      if (commentData.mentions?.length > 0) {
        await Promise.all(commentData.mentions.map(mentionEmail =>
          opsbrain.entities.Notification.create({
            workspace_id: activeWorkspace.id,
            user_email: mentionEmail,
            type: 'mention',
            title: language === 'he' ? 'תויגת בתגובה' : 'You were mentioned',
            message: `${user.full_name || user.email} ${language === 'he' ? 'תייג אותך ב' : 'mentioned you in'} ${entityName}`,
            priority: 'medium',
            related_entity_type: entityType,
            related_entity_id: entityId
          })
        ));
      }

      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments']);
      queryClient.invalidateQueries(['activity-feed']);
      setNewComment('');
      setReplyingTo(null);
      toast.success(language === 'he' ? 'תגובה נוספה' : 'Comment added');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => opsbrain.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments']);
      toast.success(language === 'he' ? 'תגובה נמחקה' : 'Comment deleted');
    }
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    // זיהוי תיוגים (@username)
    const mentions = (newComment.match(/@(\S+)/g) || []).map(m => m.slice(1));

    createCommentMutation.mutate({
      content: newComment,
      mentions,
      parent_comment_id: replyingTo
    });
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          {language === 'he' ? `תגובות (${comments.length})` : `Comments (${comments.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* טופס תגובה חדשה */}
        <div className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Reply className="w-4 h-4" />
              {language === 'he' ? 'משיב ל:' : 'Replying to:'} 
              <Badge variant="outline">
                {comments.find(c => c.id === replyingTo)?.author_name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                ביטול
              </Button>
            </div>
          )}
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={language === 'he' ? 'כתוב תגובה... (השתמש @ לתיוג)' : 'Write a comment... (use @ to mention)'}
            className="min-h-20"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {language === 'he' ? 'השתמש @ לתיוג משתמשים' : 'Use @ to mention users'}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4 ml-2" />
              {language === 'he' ? 'שלח' : 'Send'}
            </Button>
          </div>
        </div>

        {/* רשימת תגובות */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {topLevelComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {language === 'he' ? 'אין תגובות עדיין' : 'No comments yet'}
              </p>
            </div>
          ) : (
            topLevelComments.map((comment) => {
              const replies = comments.filter(c => c.parent_comment_id === comment.id);
              
              return (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-indigo-600">
                        {comment.author_name?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-medium text-sm text-gray-900">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-gray-500 mx-2">•</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.created_date), 'PPp', { 
                              locale: language === 'he' ? he : undefined 
                            })}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setReplyingTo(comment.id)}
                          >
                            <Reply className="w-3 h-3" />
                          </Button>
                          {user?.email === comment.author_email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600"
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>

                  {/* תגובות משנה */}
                  {replies.length > 0 && (
                    <div className="mr-11 space-y-2">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-600">
                              {reply.author_name?.[0] || '?'}
                            </span>
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <span className="font-medium text-sm text-gray-900">
                                  {reply.author_name}
                                </span>
                                <span className="text-xs text-gray-500 mx-2">•</span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(reply.created_date), 'PPp', { 
                                    locale: language === 'he' ? he : undefined 
                                  })}
                                </span>
                              </div>
                              {user?.email === reply.author_email && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-600"
                                  onClick={() => deleteCommentMutation.mutate(reply.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}