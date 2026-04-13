import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Hash, 
  Plus, 
  Search,
  Paperclip,
  Smile,
  MoreVertical,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function TeamChat() {
  const { activeWorkspace } = useWorkspace();
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch chats for workspace
  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['workspace-chats', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace || !user) return [];
      const result = await base44.entities.WorkspaceChat.filter({
        workspace_id: activeWorkspace.id,
        is_archived: false
      });
      return result.sort((a, b) => 
        new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date)
      );
    },
    enabled: !!activeWorkspace && !!user,
    refetchInterval: 5000
  });

  // Fetch messages for selected chat
  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat) return [];
      return await base44.entities.TeamMessage.filter(
        { chat_id: selectedChat.id },
        'created_date',
        1000
      );
    },
    enabled: !!selectedChat,
    refetchInterval: 3000
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const newMsg = await base44.entities.TeamMessage.create({
        chat_id: selectedChat.id,
        workspace_id: activeWorkspace.id,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        message: messageData.message,
        message_type: 'text',
        read_by: [user.email]
      });

      // Update chat's last_message_at
      await base44.entities.WorkspaceChat.update(selectedChat.id, {
        last_message_at: new Date().toISOString()
      });

      return newMsg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages', selectedChat?.id]);
      queryClient.invalidateQueries(['workspace-chats']);
      setNewMessage('');
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    sendMessageMutation.mutate({ message: newMessage });
  };

  // Create general chat if none exists
  useEffect(() => {
    if (activeWorkspace && user && chats.length === 0 && !chatsLoading) {
      base44.entities.WorkspaceChat.create({
        workspace_id: activeWorkspace.id,
        name: language === 'he' ? 'כללי' : 'General',
        type: 'general',
        members: [user.email],
        description: language === 'he' ? 'צ\'אט כללי של הצוות' : 'General team chat'
      }).then(() => {
        queryClient.invalidateQueries(['workspace-chats']);
      });
    }
  }, [activeWorkspace, user, chats, chatsLoading]);

  // Select first chat by default
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  if (!activeWorkspace || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">
            {language === 'he' ? 'טוען...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'he' ? 'צ\'אט צוות' : 'Team Chat'}
            </h2>
            <Button size="icon" variant="ghost">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder={language === 'he' ? 'חפש שיחות...' : 'Search chats...'}
              className="pr-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full p-3 rounded-lg text-right transition-colors",
                  selectedChat?.id === chat.id
                    ? "bg-gray-100"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {chat.type === 'direct' ? (
                      <Users className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Hash className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-medium text-gray-900 truncate">
                      {chat.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {chat.members?.length || 0} {language === 'he' ? 'חברים' : 'members'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedChat.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChat.members?.length || 0} {language === 'he' ? 'חברים' : 'members'}
                    </p>
                  </div>
                </div>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_email === user.email;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        isOwn ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {msg.sender_name?.[0] || '?'}
                        </div>
                      </Avatar>
                      <div className={cn("flex-1 max-w-lg", isOwn && "text-left")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {isOwn ? (language === 'he' ? 'אני' : 'Me') : msg.sender_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(msg.created_date), 'HH:mm')}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "p-3 rounded-2xl",
                            isOwn
                              ? "bg-gray-900 text-white"
                              : "bg-white border border-gray-200"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={language === 'he' ? 'הקלד הודעה...' : 'Type a message...'}
                    className="pr-10"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {language === 'he' ? 'בחר צ\'אט כדי להתחיל' : 'Select a chat to start'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}