import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);

export default function FullCalendar() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    description: '',
    attendees: ''
  });

  // שליפת אירועים מ-Google Calendar
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      
      try {
        const response = await base44.functions.invoke('syncCalendar', {
          workspace_id: activeWorkspace.id
        });
        
        // המרת אירועים לפורמט של react-big-calendar
        return response.data.map(event => ({
          id: event.id,
          title: event.summary || event.title,
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
          description: event.description,
          attendees: event.attendees?.map(a => a.email).join(', ') || ''
        }));
      } catch (error) {
        console.error('Error syncing calendar:', error);
        toast.error(language === 'he' ? 'שגיאה בסנכרון יומן' : 'Error syncing calendar');
        return [];
      }
    },
    enabled: !!activeWorkspace,
    refetchInterval: 5 * 60 * 1000 // רענון כל 5 דקות
  });

  // יצירת אירוע חדש
  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const response = await base44.functions.invoke('manageCalendarEvent', {
        action: 'create',
        title: eventData.title,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        description: eventData.description,
        attendees: eventData.attendees ? eventData.attendees.split(',').map(e => e.trim()) : [],
        workspace_id: activeWorkspace.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      toast.success(language === 'he' ? 'אירוע נוצר בהצלחה' : 'Event created successfully');
      setShowEventDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(language === 'he' ? 'שגיאה ביצירת אירוע' : 'Error creating event');
      console.error(error);
    }
  });

  // עדכון אירוע
  const updateEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const response = await base44.functions.invoke('manageCalendarEvent', {
        action: 'update',
        event_id: eventData.id,
        title: eventData.title,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        description: eventData.description,
        attendees: eventData.attendees ? eventData.attendees.split(',').map(e => e.trim()) : [],
        workspace_id: activeWorkspace.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      toast.success(language === 'he' ? 'אירוע עודכן בהצלחה' : 'Event updated successfully');
      setShowEventDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(language === 'he' ? 'שגיאה בעדכון אירוע' : 'Error updating event');
      console.error(error);
    }
  });

  // מחיקת אירוע
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const response = await base44.functions.invoke('manageCalendarEvent', {
        action: 'delete',
        event_id: eventId,
        workspace_id: activeWorkspace.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      toast.success(language === 'he' ? 'אירוע נמחק בהצלחה' : 'Event deleted successfully');
      setShowEventDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(language === 'he' ? 'שגיאה במחיקת אירוע' : 'Error deleting event');
      console.error(error);
    }
  });

  const resetForm = () => {
    setEventForm({
      title: '',
      start: new Date(),
      end: new Date(),
      description: '',
      attendees: ''
    });
    setSelectedEvent(null);
  };

  // לחיצה על אירוע קיים
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      description: event.description || '',
      attendees: event.attendees || ''
    });
    setShowEventDialog(true);
  }, []);

  // לחיצה על סלוט ריק ביומן (יצירת אירוע חדש)
  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedEvent(null);
    setEventForm({
      title: '',
      start,
      end,
      description: '',
      attendees: ''
    });
    setShowEventDialog(true);
  }, []);

  const handleSave = () => {
    if (!eventForm.title) {
      toast.error(language === 'he' ? 'נא להזין שם לאירוע' : 'Please enter event title');
      return;
    }

    if (selectedEvent) {
      updateEventMutation.mutate({ ...eventForm, id: selectedEvent.id });
    } else {
      createEventMutation.mutate(eventForm);
    }
  };

  const handleDelete = () => {
    if (selectedEvent && window.confirm(language === 'he' ? 'למחוק אירוע?' : 'Delete event?')) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const messages = language === 'he' ? {
    allDay: 'כל היום',
    previous: 'קודם',
    next: 'הבא',
    today: 'היום',
    month: 'חודש',
    week: 'שבוע',
    day: 'יום',
    agenda: 'סדר יום',
    date: 'תאריך',
    time: 'שעה',
    event: 'אירוע',
    noEventsInRange: 'אין אירועים בתקופה זו',
    showMore: (total) => `+${total} נוספים`
  } : {
    allDay: 'All Day',
    previous: 'Previous',
    next: 'Next',
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Time',
    event: 'Event',
    noEventsInRange: 'No events in this range',
    showMore: (total) => `+${total} more`
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* כפתורי פעולה */}
      <div className="flex gap-2 justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {language === 'he' ? 'רענן' : 'Refresh'}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowEventDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {language === 'he' ? 'אירוע חדש' : 'New Event'}
        </Button>
      </div>

      {/* היומן */}
      <div className="bg-white rounded-lg shadow-sm p-4" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          messages={messages}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          style={{ height: '100%' }}
          rtl={language === 'he'}
        />
      </div>

      {/* דיאלוג יצירה/עריכת אירוע */}
      <Dialog open={showEventDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEventDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent 
                ? (language === 'he' ? 'עריכת אירוע' : 'Edit Event')
                : (language === 'he' ? 'אירוע חדש' : 'New Event')
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'he' ? 'שם האירוע' : 'Event Title'}</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder={language === 'he' ? 'פגישה עם לקוח' : 'Meeting with client'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'he' ? 'התחלה' : 'Start'}</Label>
                <Input
                  type="datetime-local"
                  value={moment(eventForm.start).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setEventForm({ ...eventForm, start: new Date(e.target.value) })}
                />
              </div>
              <div>
                <Label>{language === 'he' ? 'סיום' : 'End'}</Label>
                <Input
                  type="datetime-local"
                  value={moment(eventForm.end).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setEventForm({ ...eventForm, end: new Date(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'he' ? 'תיאור' : 'Description'}</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder={language === 'he' ? 'פרטים נוספים על האירוע' : 'Additional event details'}
                rows={3}
              />
            </div>

            <div>
              <Label>{language === 'he' ? 'משתתפים (אימיילים מופרדים בפסיק)' : 'Attendees (comma-separated emails)'}</Label>
              <Input
                value={eventForm.attendees}
                onChange={(e) => setEventForm({ ...eventForm, attendees: e.target.value })}
                placeholder="email@example.com, other@example.com"
              />
            </div>

            <div className="flex gap-2 justify-between">
              {selectedEvent && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteEventMutation.isPending}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {language === 'he' ? 'מחק' : 'Delete'}
                </Button>
              )}
              <div className="flex gap-2 mr-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEventDialog(false);
                    resetForm();
                  }}
                >
                  {language === 'he' ? 'ביטול' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {(createEventMutation.isPending || updateEventMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    language === 'he' ? 'שמור' : 'Save'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}