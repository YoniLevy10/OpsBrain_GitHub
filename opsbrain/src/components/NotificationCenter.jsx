import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function NotificationCenter() {
  const { user, workspaceId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const channelRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
  }, [user?.id]);

  useEffect(() => {
    if (workspaceId && user?.id) loadNotifications();
  }, [workspaceId, user?.id, loadNotifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!workspaceId || !user?.id) return;
    // Prevent duplicate subscriptions (HMR / strict-mode / remounts)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`user-notifications:${user.id}`);
    channelRef.current = channel;

    // IMPORTANT: add callbacks BEFORE subscribe()
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        setNotifications((p) => [payload.new, ...p]);
      }
    );

    channel.subscribe((status) => {
      // Optional: refresh on successful subscribe
      if (status === 'SUBSCRIBED') {
        void loadNotifications();
      }
    });
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, user?.id, loadNotifications]);

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        aria-label="התראות"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute start-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-100 shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span className="font-semibold text-gray-700">התראות</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-[#6C63FF] hover:underline">
                סמן הכל כנקרא
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-300 text-sm">אין התראות</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markRead(n.id)}
                  onKeyDown={(e) => e.key === 'Enter' && markRead(n.id)}
                  className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-purple-50' : ''}`}
                >
                  <div className="flex gap-2">
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-[#6C63FF] rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.title || 'התראה'}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                      <p className="text-xs text-gray-300 mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString('he-IL') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
