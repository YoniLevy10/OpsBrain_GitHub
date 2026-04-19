import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, action, event, event_id } = await req.json();

    // קבלת access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    switch (action) {
      case 'create': {
        // יצירת אירוע ב-Google Calendar
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: event.title,
              description: event.description || '',
              start: {
                dateTime: new Date(event.start).toISOString(),
                timeZone: 'Asia/Jerusalem'
              },
              end: {
                dateTime: new Date(new Date(event.start).getTime() + 60 * 60 * 1000).toISOString(),
                timeZone: 'Asia/Jerusalem'
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create event');
        }

        const newEvent = await response.json();

        return Response.json({
          success: true,
          event: newEvent
        });
      }

      case 'delete': {
        // מחיקת אירוע
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete event');
        }

        return Response.json({
          success: true,
          message: 'Event deleted'
        });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});