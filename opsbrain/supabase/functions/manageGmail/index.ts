import { corsHeaders, withCors } from '../_shared/cors.ts';
import { requireWorkspaceAccess } from '../_shared/workspace-access.ts';
import { getGoogleAccessToken } from '../_shared/google-tokens.ts';

type Body = {
  workspace_id: string;
  action: 'mark_read' | 'archive';
  email_id: string;
};

async function gmailPost<T>(accessToken: string, path: string, body: unknown) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T;
  if (!res.ok) throw new Error(`Gmail API error: ${JSON.stringify(json)}`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(new Response('ok', { headers: corsHeaders }));
  try {
    if (req.method !== 'POST') return withCors(new Response('Method not allowed', { status: 405 }));
    const body = (await req.json()) as Body;
    const workspaceId = body?.workspace_id;
    const action = body?.action;
    const emailId = body?.email_id;
    if (!workspaceId || !action || !emailId) {
      return withCors(Response.json({ error: 'Missing workspace_id/action/email_id' }, { status: 400 }));
    }

    const access = await requireWorkspaceAccess(req, workspaceId);
    if (!access.ok) return withCors(Response.json({ error: access.error }, { status: access.status }));

    const tokenRes = await getGoogleAccessToken(workspaceId, 'gmail');
    if (!tokenRes.ok) return withCors(Response.json({ error: tokenRes.error }, { status: tokenRes.status }));
    const accessToken = tokenRes.accessToken;

    if (action === 'mark_read') {
      await gmailPost(accessToken, `users/me/messages/${emailId}/modify`, {
        removeLabelIds: ['UNREAD'],
      });
      return withCors(Response.json({ ok: true }));
    }

    if (action === 'archive') {
      await gmailPost(accessToken, `users/me/messages/${emailId}/modify`, {
        removeLabelIds: ['INBOX'],
      });
      return withCors(Response.json({ ok: true }));
    }

    return withCors(Response.json({ error: 'Unsupported action' }, { status: 400 }));
  } catch (e) {
    console.error('[manageGmail]', e);
    return withCors(Response.json({ error: String(e?.message || e) }, { status: 500 }));
  }
});

