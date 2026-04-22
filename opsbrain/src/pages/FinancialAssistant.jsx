import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { opsbrain } from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Bot } from 'lucide-react';

const AGENT_NAME = 'financial_assistant';

export default function FinancialAssistantPage() {
  const { activeWorkspace } = useWorkspace();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const seededPromptRef = useRef(false);

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

  useEffect(() => {
    const q = searchParams.get('q');
    if (!conversation || !q) return;
    if (seededPromptRef.current) return;
    seededPromptRef.current = true;
    void handleSendMessage(q);
  }, [conversation, searchParams]);

  if (!activeWorkspace || isLoading) {
    return <LoadingSpinner text="טוען את העוזר הפיננסי..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] rounded-2xl border border-[#2A2A45] bg-[#1E1E35] overflow-hidden">
        <header className="border-b border-[#2A2A45] p-4 flex items-center gap-3 bg-[#0F0F1A]/40">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center ring-1 ring-white/10">
                <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white">העוזר הפיננסי</h1>
                <p className="text-sm text-[#A0A0C0]">שאל שאלות על חשבוניות, לקוחות, תקציבים ועוד</p>
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