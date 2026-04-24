import { corsHeaders, withCors } from '../_shared/cors.ts';
import { requireWorkspaceAccess } from '../_shared/workspace-access.ts';
import { getGoogleAccessToken } from '../_shared/google-tokens.ts';

type Body = {
  workspace_id: string;
  max_results?: number;
};

async function calFetch<T>(accessToken: string, url: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as T;
  if (!res.ok) throw new Error(`Calendar API error: ${JSON.stringify(json)}`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));
  try {
    if (req.method !== 'POST') return withCors(new Response('Method not allowed', { status: 405 }));
    const body = (await req.json()) as Body;
    const workspaceId = body?.workspace_id;
    const maxResults = Math.min(Math.max(Number(body?.max_results || 10), 1), 25);
    if (!workspaceId) return withCors(Response.json({ error: 'Missing workspace_id' }, { status: 400 }));

    const access = await requireWorkspaceAccess(req, workspaceId);
    if (!access.ok) return withCors(Response.json({ error: access.error }, { status: access.status }));

    const tokenRes = await getGoogleAccessToken(workspaceId, 'calendar');
    if (!tokenRes.ok) return withCors(Response.json({ error: tokenRes.error }, { status: tokenRes.status }));
    const accessToken = tokenRes.accessToken;

    const timeMin = new Date().toISOString();
    const params = new URLSearchParams({
      timeMin,
      maxResults: String(maxResults),
      singleEvents: 'true',
      orderBy: 'startTime',
    });
    const data = await calFetch<{
      items?: Array<{
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    }>(accessToken, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`);

    const items = data.items || [];
    const events = items
      .filter((e) => e?.id && (e.start?.dateTime || e.start?.date))
      .map((e) => ({
        id: e.id,
        title: e.summary || '(no title)',
        start: e.start?.dateTime || e.start?.date,
      }));

    return withCors(
      Response.json({
        upcoming_count: events.length,
        events,
      })
    );
  } catch (e) {
    console.error('[syncCalendar]', e);
    return withCors(Response.json({ error: String(e?.message || e) }, { status: 500 }));
  }
});

