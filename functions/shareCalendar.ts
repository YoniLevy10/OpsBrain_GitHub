import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, role = 'reader' } = await req.json();
    // role: 'reader' (view only) or 'writer' (edit)

    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
    } catch {
      return Response.json({ error: 'Google Calendar not connected', not_connected: true }, { status: 400 });
    }

    // Add ACL rule to share primary calendar
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/acl',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          scope: {
            type: 'user',
            value: email
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Calendar ACL error:', err);
      throw new Error('Failed to share calendar: ' + err);
    }

    const result = await response.json();
    return Response.json({ success: true, rule: result, message: `יומן שותף עם ${email}` });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});