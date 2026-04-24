import { corsHeaders, withCors } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { getGoogleAccessToken } from '../_shared/google-tokens.ts';

type AutomationRow = { id: string; workspace_id: string; data: Record<string, unknown> | null };

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

async function calFetch<T>(accessToken: string, url: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = (await res.json()) as T;
  if (!res.ok) throw new Error(`Calendar API error: ${JSON.stringify(json)}`);
  return json;
}

async function listUpcomingEvents(accessToken: string, maxResults = 10) {
  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    timeMin,
    maxResults: String(maxResults),
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  const data = await calFetch<{
    items?: Array<{ id: string; summary?: string; start?: { dateTime?: string; date?: string } }>;
  }>(accessToken, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`);
  return (data.items || [])
    .filter((e) => e?.id && (e.start?.dateTime || e.start?.date))
    .map((e) => ({
      id: e.id,
      title: e.summary || '(no title)',
      start: e.start?.dateTime || e.start?.date!,
    }));
}

async function ensureTaskForEvent(svc: ReturnType<typeof getSupabaseServiceClient>, workspaceId: string, event: any) {
  const { data: existing, error } = await svc
    .from('tasks')
    .select('id')
    .eq('workspace_id', workspaceId)
    .filter('data->>module_ref', 'eq', 'calendar')
    .filter('data->>module_ref_id', 'eq', String(event.id))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing?.id) return { created: false };

  const { error: insErr } = await svc.from('tasks').insert({
    workspace_id: workspaceId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data: {
      title: `פגישה: ${event.title}`,
      status: 'todo',
      priority: 'medium',
      due_date: event.start,
      module_ref: 'calendar',
      module_ref_id: String(event.id),
      source: 'automation',
    },
  });
  if (insErr) throw insErr;
  return { created: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));
  try {
    const cronSecret = Deno.env.get('AUTOMATIONS_CRON_SECRET') || '';
    const provided = req.headers.get('x-opsbrain-cron') || '';
    if (!cronSecret || provided !== cronSecret) {
      return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const svc = getSupabaseServiceClient();

    // Find active automations that create tasks from calendar events (MVP)
    const { data: automations, error } = await svc
      .from('automations')
      .select('id, workspace_id, data')
      .filter('data->>is_active', 'eq', 'true')
      .filter('data->>trigger_type', 'eq', 'on_calendar_event')
      .filter('data->>action_type', 'eq', 'create_task')
      .limit(50);
    if (error) throw error;

    const rows = (automations || []) as AutomationRow[];
    const results = [];

    for (const row of rows) {
      const workspaceId = row.workspace_id;
      const tokenRes = await getGoogleAccessToken(workspaceId, 'calendar');
      if (!tokenRes.ok) {
        await svc.from('sync_logs').insert({
          workspace_id: workspaceId,
          data: {
            kind: 'automation_run',
            automation_id: row.id,
            status: 'error',
            error: tokenRes.error,
          },
        });
        results.push({ automation_id: row.id, ok: false, error: tokenRes.error });
        continue;
      }

      const accessToken = tokenRes.accessToken;
      const events = await listUpcomingEvents(accessToken, 10);
      let createdCount = 0;
      for (const ev of events) {
        const r = await ensureTaskForEvent(svc, workspaceId, ev);
        if (r.created) createdCount += 1;
      }

      await svc.from('sync_logs').insert({
        workspace_id: workspaceId,
        data: {
          kind: 'automation_run',
          automation_id: row.id,
          status: 'success',
          records_synced: events.length,
          tasks_created: createdCount,
          trigger_type: asString(row.data?.trigger_type),
          action_type: asString(row.data?.action_type),
        },
      });

      results.push({ automation_id: row.id, ok: true, tasks_created: createdCount, events: events.length });
    }

    return withCors(Response.json({ ok: true, processed: results.length, results }));
  } catch (e) {
    console.error('[runAutomations]', e);
    return withCors(Response.json({ error: String(e?.message || e) }, { status: 500 }));
  }
});

