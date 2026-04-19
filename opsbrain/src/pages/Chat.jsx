import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/Spinner';

export default function Chat() {
  const { user, workspaceId } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (workspaceId && user) fetchChannels();
    else if (workspaceId && !user) setLoading(false);
  }, [workspaceId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeChannel) return;
    fetchMessages(activeChannel);

    const sub = supabase
      .channel(`room-${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel}`,
        },
        async (payload) => {
          const { data: msg } = await supabase
            .from('messages')
            .select('*, profiles!messages_sender_id_fkey(full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();
          if (msg) setMessages((prev) => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [activeChannel]);

  const fetchChannels = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('channels').select('*').eq('workspace_id', workspaceId).order('created_at');
    if (data && data.length === 0) {
      const { data: general } = await supabase
        .from('channels')
        .insert({ workspace_id: workspaceId, name: 'כללי', created_by: user.id })
        .select()
        .single();
      if (general) {
        setChannels([general]);
        setActiveChannel(general.id);
      }
    } else {
      setChannels(data ?? []);
      if (data?.[0]) setActiveChannel(data[0].id);
    }
    setLoading(false);
  };

  const fetchMessages = async (channelId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at')
      .limit(100);
    if (error) {
      const { data: plain } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at')
        .limit(100);
      setMessages(plain ?? []);
      return;
    }
    setMessages(data ?? []);
  };

  const send = async () => {
    if (!input.trim() || !activeChannel || !user) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      workspace_id: workspaceId,
      channel_id: activeChannel,
      sender_id: user.id,
      content: input.trim(),
    });
    if (!error) setInput('');
    setSending(false);
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !user?.id) return;
    const { data } = await supabase
      .from('channels')
      .insert({ workspace_id: workspaceId, name: newChannelName.trim(), created_by: user.id })
      .select()
      .single();
    if (data) {
      setChannels((p) => [...p, data]);
      setActiveChannel(data.id);
    }
    setNewChannelName('');
    setShowNewChannel(false);
  };

  if (loading) return <PageLoader />;

  return (
    <div
      dir="rtl"
      className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] bg-white rounded-xl border border-gray-100 overflow-hidden"
    >
      <div className="w-56 bg-gray-50 border-l border-gray-100 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">ערוצים</span>
          <button onClick={() => setShowNewChannel(true)} className="text-[#6C63FF] text-lg font-bold">
            +
          </button>
        </div>
        {showNewChannel && (
          <div className="p-2 border-b border-gray-100">
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createChannel()}
              placeholder="שם ערוץ"
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm mb-1"
              autoFocus
            />
            <div className="flex gap-1">
              <button onClick={createChannel} className="flex-1 bg-[#6C63FF] text-white text-xs py-1 rounded">
                צור
              </button>
              <button onClick={() => setShowNewChannel(false)} className="flex-1 border text-xs py-1 rounded">
                ביטול
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${activeChannel === ch.id ? 'bg-[#6C63FF] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              # {ch.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-gray-100 bg-white">
          <span className="font-semibold text-gray-700">
            # {channels.find((c) => c.id === activeChannel)?.name || ''}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-300 py-16 text-sm">תחילת השיחה — שלח הודעה ראשונה!</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                  {msg.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="text-xs text-gray-400 mb-1">
                    {!isMe && <span className="ml-2">{msg.profiles?.full_name || 'משתמש'}</span>}
                    {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-[#6C63FF] text-white rounded-tl-sm' : 'bg-gray-100 text-gray-800 rounded-tr-sm'}`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="כתוב הודעה... (Enter לשליחה)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="bg-[#6C63FF] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
            >
              שלח
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
