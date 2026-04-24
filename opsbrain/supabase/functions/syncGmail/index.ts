import { corsHeaders, withCors } from '../_shared/cors.ts';
import { requireWorkspaceAccess } from '../_shared/workspace-access.ts';
import { getGoogleAccessToken } from '../_shared/google-tokens.ts';

type Body = {
  workspace_id: string;
  max_results?: number;
};

async function gmailFetch<T>(accessToken: string, path: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as T;
  if (!res.ok) throw new Error(`Gmail API error: ${JSON.stringify(json)}`);
  return json;
}

function headerValue(headers: Array<{ name: string; value: string }>, name: string) {
  const h = headers.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));
  try {
    if (req.method !== 'POST') return withCors(new Response('Method not allowed', { status: 405 }));
    const body = (await req.json()) as Body;
    const workspaceId = body?.workspace_id;
    const maxResults = Math.min(Math.max(Number(body?.max_results || 5), 1), 10);
    if (!workspaceId) return withCors(Response.json({ error: 'Missing workspace_id' }, { status: 400 }));

    const access = await requireWorkspaceAccess(req, workspaceId);
    if (!access.ok) return withCors(Response.json({ error: access.error }, { status: access.status }));

    const tokenRes = await getGoogleAccessToken(workspaceId, 'gmail');
    if (!tokenRes.ok) return withCors(Response.json({ error: tokenRes.error }, { status: tokenRes.status }));
    const accessToken = tokenRes.accessToken;

    // unread count
    const unreadLabel = await gmailFetch<{ messagesTotal?: number }>(accessToken, 'users/me/labels/UNREAD');
    const unreadCount = Number(unreadLabel?.messagesTotal || 0);

    // list latest unread messages
    const list = await gmailFetch<{ messages?: Array<{ id: string }> }>(
      accessToken,
      `users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent('is:unread')}`
    );
    const ids = (list.messages || []).map((m) => m.id).filter(Boolean);

    const emails = [];
    for (const id of ids) {
      const msg = await gmailFetch<{
        id: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      }>(accessToken, `users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`);
      const headers = msg.payload?.headers || [];
      emails.push({
        id: msg.id,
        subject: headerValue(headers, 'Subject') || '(no subject)',
        from: headerValue(headers, 'From') || '',
        hasInvoice: false,
      });
    }

    return withCors(
      Response.json({
        unread_count: unreadCount,
        invoices_found: 0,
        emails,
      })
    );
  } catch (e) {
    console.error('[syncGmail]', e);
    return withCors(Response.json({ error: String(e?.message || e) }, { status: 500 }));
  }
});

