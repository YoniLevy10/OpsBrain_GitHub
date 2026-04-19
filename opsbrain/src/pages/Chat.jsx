// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Send, Hash, X } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newChannelName, setNewChannelName] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { if (user) initWorkspace(); }, [user]);

  const initWorkspace = async () => {
    const { data } = await supabase
      .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).single();
    const wsId = data?.workspace_id;
    setWorkspaceId(wsId);
    if (wsId) fetchChannels(wsId);
    else setLoading(false);
  };

  const fetchChannels = async (wsId) => {
    setLoading(true);
    const { data } = await supabase.from('channels').select('*').eq('workspace_id', wsId).order('name');
    const list = data || [];

    if (list.length === 0) {
      // Create default channel
      const { data: created } = await supabase.from('channels').insert({ workspace_id: wsId, name: 'כללי', created_by: user.id }).select().single();
      if (created) {
        setChannels([created]);
        setActiveChannel(created);
        setLoading(false);
        return;
      }
    }

    setChannels(list);
    setActiveChannel(list[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!activeChannel) return;
    fetchMessages(activeChannel.id);

    const sub = supabase.channel(`room-${activeChannel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeChannel]);

  const fetchMessages = async (channelId) => {
    const { data } = await supabase
      .from('messages').select('*, profiles(full_name)').eq('channel_id', channelId).order('created_at');
    setMessages(data || []);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChannel || sending) return;
    setSending(true);
    await supabase.from('messages').insert({
      channel_id: activeChannel.id,
      workspace_id: workspaceId,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    setNewMsg('');
    setSending(false);
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !workspaceId) return;
    const { data } = await supabase.from('channels').insert({
      workspace_id: workspaceId,
      name: newChannelName.trim(),
      created_by: user.id,
    }).select().single();
    if (data) {
      setChannels(prev => [...prev, data]);
      setActiveChannel(data);
      setNewChannelName('');
      setShowNewChannel(false);
    }
  };

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'אתה';

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen" dir="rtl">
      {/* Channels sidebar */}
      <div className="w-56 bg-[#1A1A2E] flex flex-col border-l border-white/10 shrink-0">
        <div className="p-4 border-b border-white/10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ערוצים</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeChannel?.id === ch.id ? 'bg-[#6C63FF] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/10">
          {showNewChannel ? (
            <div className="space-y-2">
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createChannel()}
                placeholder="שם ערוץ..."
                className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6C63FF] placeholder-gray-500"
                autoFocus
              />
              <div className="flex gap-1">
                <button onClick={createChannel} className="flex-1 bg-[#6C63FF] text-white text-xs py-1.5 rounded-lg">צור</button>
                <button onClick={() => setShowNewChannel(false)} className="px-2 text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewChannel(true)} className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors px-2 py-1.5">
              <Plus className="w-4 h-4" />
              ערוץ חדש
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-[#F8F9FA]">
        {activeChannel ? (
          <>
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-800">{activeChannel.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-3 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 py-10">אין הודעות עדיין. שלח את ההודעה הראשונה!</div>
              ) : messages.map(msg => {
                const isMe = msg.sender_id === user.id;
                const senderName = msg.profiles?.full_name || (isMe ? fullName : 'משתמש');
                const time = new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isMe ? 'bg-[#6C63FF]' : 'bg-[#00D4AA]'}`}>
                      {senderName[0]?.toUpperCase()}
                    </div>
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className="text-xs text-gray-400 mb-0.5">{senderName} · {time}</span>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-[#6C63FF] text-white rounded-tl-md' : 'bg-white text-gray-800 rounded-tr-md border border-gray-100'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`הודעה ל-#${activeChannel.name}...`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMsg.trim() || sending}
                  className="bg-[#6C63FF] text-white p-2.5 rounded-xl hover:bg-[#5a52e0] disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            בחר ערוץ להתחלת שיחה
          </div>
        )}
      </div>
    </div>
  );
}
