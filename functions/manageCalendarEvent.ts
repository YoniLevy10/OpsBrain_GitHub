import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, action, summary, description, start, end, event_id } = await req.json();

    // קבלת access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    switch (action) {
      case 'create': {
        // יצירת אירוע ב-Google Calendar
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);

        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: summary || 'פגישה',
              description: description || '',
              start: {
                dateTime: startDate.toISOString(),
                timeZone: 'Asia/Jerusalem'
              },
              end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Asia/Jerusalem'
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Calendar API error:', errorText);
          throw new Error('Failed to create event: ' + errorText);
        }

        const newEvent = await response.json();

        return Response.json({
          success: true,
          message: `נוצרה פגישה: ${summary} ב-${startDate.toLocaleString('he-IL')}`,
          event: newEvent
        });
      }
      
      case 'list': {
        // רשימת אירועים
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to list events');
        }

        const data = await response.json();
        return Response.json({
          success: true,
          events: data.items || []
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