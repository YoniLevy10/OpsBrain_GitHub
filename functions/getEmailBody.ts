import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { email_id } = await req.json();

    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');
    } catch {
      return Response.json({ error: 'Gmail not connected', not_connected: true }, { status: 400 });
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email_id}?format=full`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) throw new Error('Failed to fetch email');

    const data = await response.json();

    // Extract body from parts
    const getBody = (payload) => {
      if (!payload) return '';
      if (payload.body?.data) {
        return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        }
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        }
        // Nested parts
        for (const part of payload.parts) {
          const nested = getBody(part);
          if (nested) return nested;
        }
      }
      return '';
    };

    const body = getBody(data.payload);
    const headers = data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    return Response.json({ success: true, subject, from, date, body, snippet: data.snippet });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});