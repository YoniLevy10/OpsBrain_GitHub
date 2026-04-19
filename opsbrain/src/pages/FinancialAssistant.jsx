import React, { useState, useEffect, useRef } from 'react';
import { opsbrain } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DollarSign, Bot } from 'lucide-react';

const AGENT_NAME = 'financial_assistant';

export default function FinancialAssistantPage() {
  const { activeWorkspace } = useWorkspace();
  const { t } = useLanguage();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeWorkspace) {
      const getOrCreateConversation = async () => {
        setIsLoading(true);
        try {
          const conversations = await opsbrain.agents.listConversations({ 
            agent_name: AGENT_NAME,
            metadata: { workspace_id: activeWorkspace.id }
          });
          
          let conv;
          if (conversations.length > 0) {
            conv = await opsbrain.agents.getConversation(conversations[0].id);
          } else {
            conv = await opsbrain.agents.createConversation({
              agent_name: AGENT_NAME,
              metadata: { 
                name: `Financial Assistant - ${activeWorkspace.name}`,
                workspace_id: activeWorkspace.id 
              }
            });
          }
          setConversation(conv);
          setMessages(conv.messages);
        } catch (error) {
          console.error("Error fetching or creating conversation:", error);
        }
        setIsLoading(false);
      };
      getOrCreateConversation();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (conversation) {
      const unsubscribe = opsbrain.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages);
      });
      return () => unsubscribe();
    }
  }, [conversation]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = async (messageContent) => {
    if (!conversation) return;

    const userMessage = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);

    await opsbrain.agents.addMessage(conversation, userMessage);
  };

  if (!activeWorkspace || isLoading) {
    return <LoadingSpinner text="טוען את העוזר הפיננסי..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold">העוזר הפיננסי</h1>
                <p className="text-sm text-gray-500">שאל שאלות על חשבוניות, לקוחות, תקציבים ועוד</p>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </main>
        <ChatInput onSendMessage={handleSendMessage} isLoading={messages[messages.length - 1]?.role !== 'user' && messages.length > 0} />
    </div>
  );
}