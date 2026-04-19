import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

export default function CalendarWidget({ size = 'medium' }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
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
        return response.data;
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
      const response = await opsbrain.functions.invoke('manageCalendarEvent', {
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

  if (!data) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <CardContent className="py-8 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm opacity-70 mb-3">
            {language === 'he' ? 'חבר Google Calendar' : 'Connect Google Calendar'}
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30"
          >
            <RefreshCw className="w-3 h-3 inline ml-1" />
            {language === 'he' ? 'נסה שוב' : 'Try again'}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 text-white overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {language === 'he' ? 'היומן שלי' : 'My Calendar'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.upcoming_count}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-white/20"
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
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {language === 'he' ? 'אין אירועים קרובים' : 'No upcoming events'}
            </p>
          ) : (
            events.map((event, idx) => (
              <div
                key={idx}
                className={`${event.color} rounded-lg p-3 text-sm group hover:bg-opacity-80 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate flex-1">{event.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-white/20"
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
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{language === 'he' ? 'אירוע חדש' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder={language === 'he' ? 'כותרת' : 'Title'}
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Input
                type="datetime-local"
                value={newEvent.start}
                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                className="bg-gray-800 border-gray-700"
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