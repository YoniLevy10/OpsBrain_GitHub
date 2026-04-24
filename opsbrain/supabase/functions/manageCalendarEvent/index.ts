import { corsHeaders, withCors } from '../_shared/cors.ts';
import { requireWorkspaceAccess } from '../_shared/workspace-access.ts';
import { getGoogleAccessToken } from '../_shared/google-tokens.ts';

type Body =
  | {
      workspace_id: string;
      action: 'create';
      event: { title: string; start: string; description?: string };
    }
  | {
      workspace_id: string;
      action: 'delete';
      event_id: string;
    };

async function calReq<T>(accessToken: string, method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) throw new Error(`Calendar API error: ${text}`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));
  try {
    if (req.method !== 'POST') return withCors(new Response('Method not allowed', { status: 405 }));
    const body = (await req.json()) as Body;
    const workspaceId = (body as any)?.workspace_id;
    const action = (body as any)?.action;
    if (!workspaceId || !action) {
      return withCors(Response.json({ error: 'Missing workspace_id/action' }, { status: 400 }));
    }

    const access = await requireWorkspaceAccess(req, workspaceId);
    if (!access.ok) return withCors(Response.json({ error: access.error }, { status: access.status }));

    const tokenRes = await getGoogleAccessToken(workspaceId, 'calendar');
    if (!tokenRes.ok) return withCors(Response.json({ error: tokenRes.error }, { status: tokenRes.status }));
    const accessToken = tokenRes.accessToken;

    if (action === 'create') {
      const event = (body as any).event;
      if (!event?.title || !event?.start) {
        return withCors(Response.json({ error: 'Missing event.title/event.start' }, { status: 400 }));
      }
      const created = await calReq<{ id: string }>(
        accessToken,
        'POST',
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          summary: event.title,
          description: event.description || '',
          start: { dateTime: new Date(event.start).toISOString() },
          end: { dateTime: new Date(new Date(event.start).getTime() + 30 * 60 * 1000).toISOString() },
        }
      );
      return withCors(Response.json({ ok: true, id: created.id }));
    }

    if (action === 'delete') {
      const eventId = (body as any).event_id;
      if (!eventId) return withCors(Response.json({ error: 'Missing event_id' }, { status: 400 }));
      await calReq(accessToken, 'DELETE', `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`);
      return withCors(Response.json({ ok: true }));
    }

    return withCors(Response.json({ error: 'Unsupported action' }, { status: 400 }));
  } catch (e) {
    console.error('[manageCalendarEvent]', e);
    return withCors(Response.json({ error: String(e?.message || e) }, { status: 500 }));
  }
});

