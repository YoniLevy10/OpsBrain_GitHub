import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Loads messages for a channel and keeps them updated via Supabase Realtime.
 * Falls back to a plain select if the join to profiles fails (older schemas).
 */
export function useChannelMessages(channelId) {
  const [messages, setMessages] = useState([]);

  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      return;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at')
      .limit(200);
    if (error) {
      const { data: plain } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at')
        .limit(200);
      setMessages(plain ?? []);
      return;
    }
    setMessages(data ?? []);
  }, [channelId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!channelId) return;

    const sub = supabase
      .channel(`room-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
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
  }, [channelId]);

  return { messages, setMessages, fetchMessages };
}
