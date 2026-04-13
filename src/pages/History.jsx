import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Clock, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function History() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ['opsbrain-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'opsbrain' })
  });

  const handleOpenConversation = async (convId) => {
    // Navigate to chat and load this conversation
    navigate(createPageUrl('Chat'), { state: { conversationId: convId } });
  };

  const handleDelete = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm(language === 'he' ? 'למחוק שיחה?' : 'Delete conversation?')) return;
    
    try {
      // Delete conversation via API
      await base44.agents.deleteConversation(convId);
      toast.success(language === 'he' ? 'השיחה נמחקה' : 'Conversation deleted');
      refetch();
    } catch (error) {
      toast.error(language === 'he' ? 'שגיאה במחיקת השיחה' : 'Error deleting conversation');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'he' ? 'היסטוריית שיחות' : 'Chat History'}
          </h1>
          <p className="text-gray-600">
            {language === 'he' 
              ? 'כל השיחות שלך עם העוזר האישי' 
              : 'All your conversations with your assistant'}
          </p>
        </div>

        {/* Conversations List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </CardContent>
          </Card>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {language === 'he' ? 'אין שיחות עדיין' : 'No conversations yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {language === 'he' 
                  ? 'התחל שיחה חדשה עם העוזר האישי שלך'
                  : 'Start a new conversation with your assistant'}
              </p>
              <Button onClick={() => navigate(createPageUrl('Chat'))}>
                {language === 'he' ? 'התחל שיחה' : 'Start Chat'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations
              .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
              .map((conv) => {
                const messageCount = conv.messages?.length || 0;
                const lastMessage = conv.messages?.[conv.messages.length - 1];
                const preview = lastMessage?.content?.substring(0, 100) || 
                  (language === 'he' ? 'שיחה ריקה' : 'Empty conversation');
                
                return (
                  <Card 
                    key={conv.id} 
                    className="hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleOpenConversation(conv.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold mb-1">
                            {conv.metadata?.name || (language === 'he' ? 'שיחה ללא שם' : 'Untitled Conversation')}
                          </CardTitle>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {moment(conv.updated_date).fromNow()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {messageCount} {language === 'he' ? 'הודעות' : 'messages'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(conv.id, e)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {preview}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}