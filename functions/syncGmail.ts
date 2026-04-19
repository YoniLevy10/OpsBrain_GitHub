import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── In-memory cache (per isolate) ───────────────────────────────────────────
const cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── In-memory throttle tracker ──────────────────────────────────────────────
const lastCallMap = new Map(); // key → timestamp
const MIN_INTERVAL_MS = 60 * 1000; // max once per minute per user

// ─── Retry with Exponential Backoff ──────────────────────────────────────────
async function fetchWithRetry(url, options, maxRetries = 4) {
  let delay = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 503) {
      if (attempt === maxRetries) throw new Error(`Rate limited after ${maxRetries} retries`);
      const retryAfter = parseInt(res.headers.get('Retry-After') || '0') * 1000;
      const wait = retryAfter > 0 ? retryAfter : delay;
      console.warn(`[syncGmail] 429 rate limit, retrying in ${wait}ms (attempt ${attempt + 1})`);
      await new Promise(r => setTimeout(r, wait));
      delay = Math.min(delay * 2, 16000); // exponential backoff, cap at 16s
      continue;
    }
    return res;
  }
}

// ─── Sequential fetch for individual messages (avoids parallel 429s) ─────────
async function fetchEmailsSequentially(messageIds, accessToken) {
  const results = [];
  for (const id of messageIds) {
    const res = await fetchWithRetry(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const detail = await res.json();
    const hdrs = detail.payload?.headers || [];
    const subject = hdrs.find(h => h.name === 'Subject')?.value || '';
    const from = hdrs.find(h => h.name === 'From')?.value || '';
    const date = hdrs.find(h => h.name === 'Date')?.value || '';
    const hasInvoice = /invoice|חשבונית|receipt|קבלה/i.test(subject);
    results.push({ id, subject, from, date, snippet: detail.snippet || '', hasInvoice, threadId: detail.threadId });

    // Small delay between requests to be gentle on rate limits
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, max_results = 5 } = await req.json();

    // ─── Throttle check ────────────────────────────────────────────────────
    const throttleKey = `gmail_${user.email}`;
    const lastCall = lastCallMap.get(throttleKey) || 0;
    const sinceLastCall = Date.now() - lastCall;
    if (sinceLastCall < MIN_INTERVAL_MS) {
      const waitSec = Math.ceil((MIN_INTERVAL_MS - sinceLastCall) / 1000);
      console.log(`[syncGmail] Throttled for ${user.email}, next call in ${waitSec}s`);
      const cacheKey = `gmail_data_${user.email}`;
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() < cached.expiresAt) {
          return Response.json({ ...cached.data, from_cache: true });
        }
      }
      return Response.json({ error: `Too many requests. Please wait ${waitSec} seconds.`, throttled: true }, { status: 429 });
    }

    // ─── Cache check ───────────────────────────────────────────────────────
    const cacheKey = `gmail_data_${user.email}_${max_results}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() < cached.expiresAt) {
        console.log(`[syncGmail] Cache hit for ${user.email}`);
        return Response.json({ ...cached.data, from_cache: true });
      }
      cache.delete(cacheKey);
    }

    // ─── Mark call time ────────────────────────────────────────────────────
    lastCallMap.set(throttleKey, Date.now());

    // ─── Get access token ──────────────────────────────────────────────────
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Gmail not connected', not_connected: true }, { status: 400 });
    }

    // ─── Fetch message list with retry ─────────────────────────────────────
    const listRes = await fetchWithRetry(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max_results}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`Gmail API error ${listRes.status}: ${errText}`);
    }

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).slice(0, max_results).map(m => m.id);

    // ─── Fetch individual emails sequentially (rate-limit safe) ───────────
    const emailDetails = await fetchEmailsSequentially(messageIds, accessToken);

    // ─── Auto-create tasks for invoices (with duplicate check) ─────────────
    for (const email of emailDetails.filter(e => e.hasInvoice)) {
      try {
        const existing = await base44.asServiceRole.entities.Task.filter({
          workspace_id,
          title: `עיבוד חשבונית: ${email.subject}`
        });
        if (existing.length > 0) continue;
        await base44.asServiceRole.entities.Task.create({
          workspace_id,
          title: `עיבוד חשבונית: ${email.subject}`,
          description: `התקבלה חשבונית במייל מ-${email.from}`,
          status: 'open',
          priority: 'high'
        });
      } catch (err) {
        console.error('[syncGmail] Failed to create task:', err.message);
      }
    }

    const result = {
      success: true,
      emails: emailDetails,
      unread_count: emailDetails.length,
      invoices_found: emailDetails.filter(e => e.hasInvoice).length
    };

    // ─── Store in cache ────────────────────────────────────────────────────
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    return Response.json(result);

  } catch (error) {
    console.error('[syncGmail] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});