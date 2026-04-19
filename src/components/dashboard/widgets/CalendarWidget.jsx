import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, Plus, Trash2, Share2, Users } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';

const EVENT_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500'
];

function getRelativeDate(dateStr, language) {
  const d = new Date(dateStr);
  if (isToday(d)) return language === 'he' ? 'היום' : 'Today';
  if (isTomorrow(d)) return language === 'he' ? 'מחר' : 'Tomorrow';
  return format(d, 'EEE d/M', { locale: language === 'he' ? he : undefined });
}

function ShareCalendarDialog({ open, onClose, language }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reader');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('shareCalendar', { email: email.trim(), role });
      if (res.data?.success) {
        toast.success(language === 'he' ? `יומן שותף עם ${email}` : `Calendar shared with ${email}`);
        setEmail('');
        onClose();
      } else {
        throw new Error(res.data?.error || 'Failed');
      }
    } catch (e) {
      toast.error(language === 'he' ? 'שגיאה בשיתוף היומן' : 'Error sharing calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            {language === 'he' ? 'שתף יומן' : 'Share Calendar'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            {language === 'he' ? 'הזמן חבר צוות או בן/בת זוג לראות את היומן שלך' : 'Invite a team member or partner to view your calendar'}
          </p>
          <div className="space-y-2">
            <Label className="text-gray-300">{language === 'he' ? 'כתובת מייל' : 'Email address'}</Label>
            <Input
              type="email"
              placeholder="partner@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              onKeyDown={e => e.key === 'Enter' && handleShare()}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">{language === 'he' ? 'הרשאה' : 'Permission'}</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setRole('reader')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${role === 'reader' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {language === 'he' ? '👁️ צפייה בלבד' : '👁️ View only'}
              </button>
              <button
                onClick={() => setRole('writer')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${role === 'writer' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {language === 'he' ? '✏️ עריכה' : '✏️ Edit'}
              </button>
            </div>
          </div>
          <Button
            onClick={handleShare}
            disabled={!email.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
            {language === 'he' ? 'שתף יומן' : 'Share Calendar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-events', activeWorkspace?.id, user?.email],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      try {
        const response = await base44.functions.invoke('syncCalendar', {
          workspace_id: activeWorkspace.id
        });
        return response.data;
      } catch (error) {
        if (error?.response?.data?.error?.includes('not connected')) {
          return { events: [], upcoming_count: 0, not_connected: true };
        }
        return null;
      }
    },
    enabled: !!activeWorkspace && !!user,
    refetchInterval: 15 * 60 * 1000
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const response = await base44.functions.invoke('manageCalendarEvent', {
        workspace_id: activeWorkspace.id,
        action: 'create',
        event: eventData
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      toast.success(language === 'he' ? 'אירוע נוצר!' : 'Event created!');
      setShowAddDialog(false);
      setNewEvent({ title: '', start: '', description: '' });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const response = await base44.functions.invoke('manageCalendarEvent', {
        workspace_id: activeWorkspace.id,
        action: 'delete',
        event_id: eventId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      toast.success(language === 'he' ? 'אירוע נמחק' : 'Event deleted');
    }
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.not_connected) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardContent className="py-8 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm opacity-70 mb-3">
            {language === 'he' ? 'חבר את Google Calendar בהגדרות' : 'Connect Google Calendar in Settings'}
          </p>
          <Button size="sm" className="bg-white/20 hover:bg-white/30"
            onClick={() => window.location.href = '/Settings'}>
            {language === 'he' ? 'לך להגדרות' : 'Go to Settings'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const events = (data?.events || []).slice(0, 4).map((e, idx) => ({
    ...e,
    time: e.start?.includes('T') ? format(new Date(e.start), 'HH:mm') : null,
    relDate: getRelativeDate(e.start, language),
    color: EVENT_COLORS[idx % EVENT_COLORS.length]
  }));

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white overflow-hidden h-[320px] flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              {language === 'he' ? 'היומן שלי' : 'My Calendar'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-blue-300">{data.upcoming_count}</span>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 hover:bg-white/20"
                onClick={() => setShowShareDialog(true)}
                title={language === 'he' ? 'שתף יומן' : 'Share calendar'}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 hover:bg-white/20"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {language === 'he' ? 'אירועים קרובים' : 'Upcoming events'}
          </p>
        </CardHeader>

        <CardContent className="space-y-2 flex-1 overflow-y-auto px-4">
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {language === 'he' ? 'אין אירועים קרובים' : 'No upcoming events'}
            </p>
          ) : (
            events.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 group hover:bg-white/5 p-2 rounded-lg transition-all"
              >
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${event.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{event.relDate}</span>
                    {event.time && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      </>
                    )}
                    {event.attendees?.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.attendees.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  size="sm" variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-white/20 flex-shrink-0"
                  onClick={() => deleteEventMutation.mutate(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{language === 'he' ? 'אירוע חדש' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={language === 'he' ? 'כותרת האירוע' : 'Event title'}
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              className="bg-gray-800 border-gray-700"
            />
            <Input
              type="datetime-local"
              value={newEvent.start}
              onChange={e => setNewEvent({ ...newEvent, start: e.target.value })}
              className="bg-gray-800 border-gray-700"
            />
            <Input
              placeholder={language === 'he' ? 'תיאור (אופציונלי)' : 'Description (optional)'}
              value={newEvent.description}
              onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              className="bg-gray-800 border-gray-700"
            />
            <Button
              onClick={() => createEventMutation.mutate(newEvent)}
              disabled={!newEvent.title || !newEvent.start || createEventMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {createEventMutation.isPending
                ? (language === 'he' ? 'יוצר...' : 'Creating...')
                : (language === 'he' ? 'צור אירוע' : 'Create Event')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Calendar Dialog */}
      <ShareCalendarDialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        language={language}
      />
    </>
  );
}