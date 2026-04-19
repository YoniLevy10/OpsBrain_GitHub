import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace_id, time_min, time_max } = await req.json();

    // קבלת access token מ-Google Calendar OAuth
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    // ברירת מחדל: אירועים מהיום ו-7 ימים קדימה
    const startTime = time_min || new Date().toISOString();
    const endTime = time_max || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // שליפת אירועים
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startTime}&timeMax=${endTime}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    const events = (data.items || []).map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees?.map(a => a.email) || []
    }));

    // אוטומציה: יצירת משימות הכנה לפגישות חשובות (עם יותר ממשתתף אחד)
    const now = Date.now();
    for (const event of events) {
      const eventTime = new Date(event.start).getTime();
      const hoursUntil = (eventTime - now) / (1000 * 60 * 60);

      // אם הפגישה תוך 24 שעות ויש משתתפים
      if (hoursUntil > 0 && hoursUntil < 24 && event.attendees.length > 0) {
        try {
          await base44.asServiceRole.entities.Task.create({
            workspace_id,
            title: `הכנה לפגישה: ${event.title}`,
            description: `פגישה ב-${new Date(event.start).toLocaleString('he-IL')}\nמשתתפים: ${event.attendees.join(', ')}`,
            status: 'pending',
            priority: 'high',
            due_date: new Date(eventTime - 2 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 שעות לפני
            source: 'calendar',
            metadata: {
              event_id: event.id,
              event_start: event.start
            }
          });
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      }
    }

    return Response.json({
      success: true,
      events,
      upcoming_count: events.length,
      tasks_created: events.filter(e => {
        const eventTime = new Date(e.start).getTime();
        const hoursUntil = (eventTime - now) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil < 24 && e.attendees.length > 0;
      }).length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});