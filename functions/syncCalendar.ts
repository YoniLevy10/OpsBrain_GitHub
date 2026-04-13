import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── In-memory cache (per isolate) ───────────────────────────────────────────
const cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── In-memory throttle tracker ──────────────────────────────────────────────
const lastCallMap = new Map(); // key → timestamp
const MIN_INTERVAL_MS = 60 * 1000; // max once per minute per user

// ─── Retry with Exponential Backoff ──────────────────────────────────────────
async function fetchWithRetry(url, options, maxRetries = 4) {
  let delay = 500; // start at 500ms
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 503) {
      if (attempt === maxRetries) throw new Error(`Rate limited after ${maxRetries} retries`);
      const retryAfter = parseInt(res.headers.get('Retry-After') || '0') * 1000;
      const wait = retryAfter > 0 ? retryAfter : delay;
      console.warn(`[syncCalendar] 429 rate limit, retrying in ${wait}ms (attempt ${attempt + 1})`);
      await new Promise(r => setTimeout(r, wait));
      delay = Math.min(delay * 2, 16000); // exponential backoff, cap at 16s
      continue;
    }
    return res;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, time_min, time_max } = await req.json();

    // ─── Throttle check ────────────────────────────────────────────────────
    const throttleKey = `cal_${user.email}`;
    const lastCall = lastCallMap.get(throttleKey) || 0;
    const sinceLastCall = Date.now() - lastCall;
    if (sinceLastCall < MIN_INTERVAL_MS) {
      const waitSec = Math.ceil((MIN_INTERVAL_MS - sinceLastCall) / 1000);
      console.log(`[syncCalendar] Throttled for ${user.email}, next call in ${waitSec}s`);
      // Return cached data if available instead of error
      const cacheKey = `cal_data_${user.email}`;
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() < cached.expiresAt) {
          return Response.json({ ...cached.data, from_cache: true });
        }
      }
      return Response.json({ error: `Too many requests. Please wait ${waitSec} seconds.`, throttled: true }, { status: 429 });
    }

    // ─── Cache check ───────────────────────────────────────────────────────
    const cacheKey = `cal_data_${user.email}_${time_min || 'default'}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        console.log(`[syncCalendar] Cache hit for ${user.email}`);
        return Response.json({ ...cached.data, from_cache: true });
      }
      cache.delete(cacheKey);
    }

    // ─── Mark call time ────────────────────────────────────────────────────
    lastCallMap.set(throttleKey, Date.now());

    // ─── Get access token ──────────────────────────────────────────────────
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Google Calendar not connected.', not_connected: true }, { status: 400 });
    }

    const startTime = time_min || new Date().toISOString();
    const endTime = time_max || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // ─── Fetch events with retry ───────────────────────────────────────────
    const response = await fetchWithRetry(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startTime}&timeMax=${endTime}&singleEvents=true&orderBy=startTime`,
      { headers }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Calendar API error ${response.status}: ${errText}`);
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

    // ─── Auto-create prep tasks (with duplicate check) ─────────────────────
    const now = Date.now();
    let tasksCreated = 0;
    for (const event of events) {
      const eventTime = new Date(event.start).getTime();
      const hoursUntil = (eventTime - now) / (1000 * 60 * 60);
      if (hoursUntil > 0 && hoursUntil < 24 && event.attendees.length > 0) {
        try {
          const existing = await base44.asServiceRole.entities.Task.filter({
            workspace_id,
            title: `הכנה לפגישה: ${event.title}`
          });
          if (existing.length > 0) continue;
          await base44.asServiceRole.entities.Task.create({
            workspace_id,
            title: `הכנה לפגישה: ${event.title}`,
            description: `פגישה ב-${new Date(event.start).toLocaleString('he-IL')}\nמשתתפים: ${event.attendees.join(', ')}`,
            status: 'open',
            priority: 'high',
            due_date: new Date(eventTime - 2 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
          tasksCreated++;
        } catch (err) {
          console.error('[syncCalendar] Failed to create task:', err.message);
        }
      }
    }

    const result = { success: true, events, upcoming_count: events.length, tasks_created: tasksCreated };

    // ─── Store in cache ────────────────────────────────────────────────────
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    return Response.json(result);

  } catch (error) {
    console.error('[syncCalendar] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});