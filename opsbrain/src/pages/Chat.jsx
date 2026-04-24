import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Paperclip, Smile } from 'lucide-react';
import { useChannelMessages } from '@/hooks/useMessages';

export default function Chat() {
  const { user, workspaceId } = useAuth();
  const [channels, setChannels] = useState([]);
  const [dms, setDms] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const bottomRef = useRef(null);
  const { messages } = useChannelMessages(activeChannel);

  const activeName = useMemo(() => {
    const all = [...channels, ...dms];
    return all.find((c) => c.id === activeChannel)?.name || '';
  }, [activeChannel, channels, dms]);

  useEffect(() => {
    if (workspaceId && user) void bootstrap();
    else if (workspaceId && !user) setLoading(false);
     
  }, [workspaceId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const bootstrap = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: ch } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      const list = ch ?? [];
      const chOnly = list.filter((c) => (c.type ?? 'channel') === 'channel');
      const dmOnly = list.filter((c) => c.type === 'dm');
      setChannels(chOnly);
      setDms(dmOnly);

      if (chOnly.length === 0) {
        const { data: created, error } = await supabase
          .from('channels')
          .insert({ workspace_id: workspaceId, name: 'general', type: 'channel', created_by: user.id })
          .select()
          .single();
        if (!error && created) {
          setChannels([created]);
          setActiveChannel(created.id);
        }
      } else {
        setActiveChannel((prev) => prev ?? chOnly[0]?.id ?? dmOnly[0]?.id ?? null);
      }

      const { data: mems } = await supabase
        .from('workspace_members')
        .select('user_id, profiles(full_name)')
        .eq('workspace_id', workspaceId)
        .neq('user_id', user.id);
      setMembers(mems ?? []);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בטעינת צ׳אט');
    } finally {
      setLoading(false);
    }
  };

  const uploadPendingFiles = async () => {
    const uploaded = [];
    for (const f of pendingFiles) {
      const path = `chat/${workspaceId}/${crypto.randomUUID()}-${f.name}`;
      const { error } = await supabase.storage.from('documents').upload(path, f, { upsert: false });
      if (error) throw error;
      uploaded.push({ name: f.name, path });
    }
    return uploaded;
  };

  const send = async () => {
    if (!input.trim() || !activeChannel || !user) return;
    setSending(true);
    try {
      const attachments = pendingFiles.length ? await uploadPendingFiles() : [];
      const { error } = await supabase.from('messages').insert({
        workspace_id: workspaceId,
        channel_id: activeChannel,
        sender_id: user.id,
        content: input.trim(),
        attachments,
      });
      if (error) throw error;
      setInput('');
      setPendingFiles([]);
      setShowEmoji(false);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בשליחת הודעה (בדוק Storage bucket `documents`)');
    } finally {
      setSending(false);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !user?.id) return;
    const { data, error } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspaceId,
        name: newChannelName.trim(),
        type: 'channel',
        created_by: user.id,
      })
      .select()
      .single();
    if (error) {
      toast.error('שגיאה ביצירת ערוץ');
      return;
    }
    setChannels((p) => [...p, data]);
    setActiveChannel(data.id);
    setNewChannelName('');
    setShowNewChannel(false);
  };

  const openOrCreateDm = async (peerId) => {
    if (!user?.id) return;
    const existing = dms.find((c) => c.dm_peer_id === peerId);
    if (existing) {
      setActiveChannel(existing.id);
      return;
    }
    const peerProfile = members.find((m) => m.user_id === peerId)?.profiles?.full_name || 'DM';
    const { data, error } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspaceId,
        name: peerProfile,
        type: 'dm',
        dm_peer_id: peerId,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) {
      toast.error('שגיאה ביצירת DM');
      return;
    }
    setDms((p) => [...p, data]);
    setActiveChannel(data.id);
  };

  if (loading) return <PageLoader />;

  return (
    <div dir="rtl" className="flex h-[calc(100vh-120px)] lg:h-[calc(100vh-104px)] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="w-64 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">צ׳אט צוות</span>
          <button onClick={() => setShowNewChannel(true)} className="text-indigo-600 text-lg font-bold hover:text-indigo-700">
            +
          </button>
        </div>

        {showNewChannel && (
          <div className="p-2 border-b border-slate-200">
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createChannel()}
              placeholder="שם ערוץ"
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={createChannel} className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg hover:bg-indigo-700">
                צור
              </button>
              <button onClick={() => setShowNewChannel(false)} className="flex-1 border border-slate-200 text-xs py-2 rounded-lg text-slate-600 hover:bg-slate-100">
                ביטול
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-slate-500">ערוצים</div>
          <div className="px-2 pb-2 space-y-1">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full text-right px-3 py-2 rounded-xl text-sm ${
                  activeChannel === ch.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                # {ch.name}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 text-xs text-slate-500">הודעות ישירות</div>
          <div className="px-2 pb-3 space-y-1">
            {members.map((m) => (
              <button
                key={m.user_id}
                onClick={() => openOrCreateDm(m.user_id)}
                className="w-full text-right px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100"
              >
                {m.profiles?.full_name || 'משתמש'}
              </button>
            ))}
            {dms.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full text-right px-3 py-2 rounded-xl text-sm ${
                  activeChannel === ch.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {ch.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-slate-200 bg-slate-50/80">
          <span className="font-semibold text-slate-900">{activeName ? `# ${activeName}` : 'בחר ערוץ'}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-16 text-sm">תחילת השיחה — שלח הודעה ראשונה!</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                  {msg.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="text-xs text-slate-500 mb-1">
                    {!isMe && <span className="ml-2">{msg.profiles?.full_name || 'משתמש'}</span>}
                    {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      isMe ? 'bg-indigo-600 text-white rounded-tl-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tr-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((a) => (
                        <div key={a.path} className="text-xs text-slate-500">
                          קובץ: {a.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-slate-200 bg-white">
          {showEmoji && (
            <div className="mb-2 relative">
              <div className="absolute bottom-14 left-0 z-20">
                <Picker
                  data={data}
                  theme="light"
                  onEmojiSelect={(e) => {
                    setInput((p) => p + (e.native || ''));
                    setShowEmoji(false);
                  }}
                />
              </div>
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="mb-2 text-xs text-slate-500">
              קבצים מצורפים: {pendingFiles.map((f) => f.name).join(', ')}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                aria-label="אימוג׳י"
              >
                <Smile className="w-4 h-4" />
              </button>
              <label className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-100">
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                />
              </label>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="הקלד הודעה… (Enter לשליחה, Shift+Enter לשורה חדשה)"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 resize-none shadow-sm"
            />
            <button
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 h-[84px]"
            >
              שלח
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
