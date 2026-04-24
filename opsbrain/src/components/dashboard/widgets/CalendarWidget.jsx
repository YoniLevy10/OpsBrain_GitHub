import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, RefreshCw, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CalendarWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    description: ''
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return null;
      try {
        const response = await opsbrain.functions.invoke('syncCalendar', {
          workspace_id: activeWorkspace.id
        });
        return response;
      } catch (error) {
        console.error('Calendar sync error:', error);
        return null;
      }
    },
    enabled: !!activeWorkspace,
    refetchInterval: 5 * 60 * 1000 // רענון כל 5 דקות
  });

  const events = data?.events?.slice(0, 3).map(e => ({
    id: e.id,
    time: format(new Date(e.start), 'HH:mm'),
    title: e.title,
    start: e.start,
    color: 'bg-blue-500'
  })) || [];

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const response = await opsbrain.functions.invoke('manageCalendarEvent', {
        workspace_id: activeWorkspace.id,
        action: 'create',
        event: eventData
      });
      return response;
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
      const response = await opsbrain.functions.invoke('manageCalendarEvent', {
        workspace_id: activeWorkspace.id,
        action: 'delete',
        event_id: eventId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      toast.success(language === 'he' ? 'אירוע נמחק' : 'Event deleted');
    }
  });

  if (isLoading) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
            <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
              <Calendar className="w-4 h-4 text-sky-700" />
            </div>
            {language === 'he' ? 'יומן' : 'Calendar'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            {language === 'he' ? 'עדיין לא מחובר. חבר Google Calendar כדי להציג אירועים.' : 'Not connected yet.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 ml-2" />
              {language === 'he' ? 'נסה שוב' : 'Retry'}
            </Button>
            <Button size="sm" onClick={() => navigate('/app/Integrations')}>
              {language === 'he' ? 'נהל אינטגרציות' : 'Manage integrations'}
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
              <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
                <Calendar className="w-4 h-4 text-sky-700" />
              </div>
              {language === 'he' ? 'היומן שלי' : 'My Calendar'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{data.upcoming_count}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {language === 'he' ? 'אירועים קרובים' : 'Upcoming events'}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {language === 'he' ? 'אין אירועים קרובים' : 'No upcoming events'}
            </p>
          ) : (
            events.map((event, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3 text-sm group border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate flex-1 text-slate-900">{event.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === 'he' ? 'אירוע חדש' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder={language === 'he' ? 'כותרת' : 'Title'}
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="bg-white"
              />
            </div>
            <div>
              <Input
                type="datetime-local"
                value={newEvent.start}
                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                className="bg-white"
              />
            </div>
            <Button
              onClick={() => createEventMutation.mutate(newEvent)}
              disabled={!newEvent.title || !newEvent.start || createEventMutation.isPending}
              className="w-full"
            >
              {createEventMutation.isPending 
                ? (language === 'he' ? 'יוצר...' : 'Creating...') 
                : (language === 'he' ? 'צור אירוע' : 'Create Event')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}