import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import { Brain, Plus, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SmartDocumentImport from '../components/documents/SmartDocumentImport';

export default function Chat() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeWorkspace } = useWorkspace();
  const [conversationId, setConversationId] = useState(location.state?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['opsbrain-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: 'opsbrain' })
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;
    
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setIsLoading(data.messages?.some(m => 
        m.role === 'assistant' && m.tool_calls?.some(tc => 
          tc.status === 'running' || tc.status === 'in_progress'
        )
      ) || false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Load existing conversation or create new one
  useEffect(() => {
    const loadConversation = async () => {
      if (location.state?.conversationId) {
        // Load existing conversation from history
        const conv = await base44.agents.getConversation(location.state.conversationId);
        setConversationId(conv.id);
        setMessages(conv.messages || []);
        // Clear the state so refresh doesn't reload it
        window.history.replaceState({}, document.title);
      } else if (!conversationId && !isCreating) {
        // Create new conversation
        createNewConversation();
      }
    };
    loadConversation();
  }, []);

  const createNewConversation = async () => {
    setIsCreating(true);
    const today = new Date().toLocaleDateString();
    const workspaceId = activeWorkspace?.id;
    const conv = await base44.agents.createConversation({
      agent_name: 'opsbrain',
      metadata: {
        name: `${t('chat.subtitle')} - ${today}`,
        description: t('chat.subtitle'),
        workspace_id: workspaceId
      }
    });
    setConversationId(conv.id);
    setMessages([]);
    refetchConversations();
    setIsCreating(false);
  };

  const sendMessage = async (content, files = []) => {
    if (!conversationId) {
      await createNewConversation();
    }
    
    setIsLoading(true);
    
    const fileUrls = files.map(f => f.url);
    
    // Prefix with workspace_id so agent always knows the context
    const messageContent = activeWorkspace?.id
      ? `[workspace_id: ${activeWorkspace.id}]\n${content}`
      : content;

    // Optimistically add user message (show original, not prefixed)
    const userMessage = { role: 'user', content };
    if (fileUrls.length > 0) {
      userMessage.file_urls = fileUrls;
    }
    setMessages(prev => [...prev, userMessage]);
    
    const conv = await base44.agents.getConversation(conversationId);
    await base44.agents.addMessage(conv, {
      role: 'user',
      content: messageContent,
      ...(fileUrls.length > 0 && { file_urls: fileUrls })
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('chat.goodMorning');
    if (hour < 17) return t('chat.goodAfternoon');
    if (hour < 21) return t('chat.goodEvening');
    return t('chat.goodNight');
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-3 md:px-4 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{t('chat.title')}</h1>
            <p className="text-xs text-gray-500">{t('chat.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => navigate(createPageUrl('History'))}
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSmartImport(true)}
            className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4 ml-1" />
            <span className="hidden sm:inline">{t('clientsExtra.smartImportDoc')}</span>
            <span className="sm:hidden">AI</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={createNewConversation}
            disabled={isCreating}
            className="rounded-xl"
          >
            <Plus className="w-4 h-4 ml-1" />
            {t('chat.newConversation')}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getGreeting()}
            </h2>
            <p className="text-gray-500 max-w-md mb-8">
              {t('chat.welcomeMessage')}
              <br />
              {t('chat.welcomeSubMessage')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                t('chat.suggestions.busyDay'),
                t('chat.suggestions.weekSummary'),
                t('chat.suggestions.addTask'),
                t('chat.suggestions.reminder'),
                t('chat.suggestions.openTasks')
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <SmartDocumentImport
        open={showSmartImport}
        onClose={() => setShowSmartImport(false)}
        onSuccess={({ clientsCreated, projectsCreated }) => {
          // Send summary to chat
          sendMessage(`✅ ייבוא מסמך הושלם! נוצרו ${clientsCreated} לקוחות ו-${projectsCreated} פרויקטים חדשים במערכת.`);
        }}
      />

      {/* Input */}
      <div className="flex-shrink-0 p-3 md:p-6 bg-gradient-to-t from-[#FAFAFA] to-transparent">
        <div className="max-w-3xl mx-auto">
          <ChatInput 
            onSend={sendMessage} 
            isLoading={isLoading}
            placeholder={t('chat.placeholder')}
          />
        </div>
      </div>
    </div>
  );
}