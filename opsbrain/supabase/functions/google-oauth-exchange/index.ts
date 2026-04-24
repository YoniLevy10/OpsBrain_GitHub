import { getSupabaseAuthClient, getSupabaseServiceClient } from '../_shared/supabase.ts';
import { googleAuthConfig } from '../_shared/google.ts';

type Body = {
  workspace_id: string;
  product: 'gmail' | 'calendar' | string;
  code: string;
  redirect_uri: string;
};

async function exchangeCode(params: URLSearchParams) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`);
  }
  return json as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
    id_token?: string;
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const body = (await req.json()) as Body;
    const workspaceId = body?.workspace_id;
    const redirectUri = body?.redirect_uri;
    const code = body?.code;
    const { product, scopes } = googleAuthConfig(body?.product);

    if (!workspaceId || !redirectUri || !code) {
      return Response.json({ error: 'Missing workspace_id / redirect_uri / code' }, { status: 400 });
    }

    // Validate caller is authenticated
    const supabaseAuth = getSupabaseAuthClient(req);
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !authData?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authData.user.id;

    // Validate membership in workspace (multi-tenant safety)
    const svc = getSupabaseServiceClient();
    const { data: member, error: memberErr } = await svc
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();
    if (memberErr) throw memberErr;
    if (!member?.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return Response.json({ error: 'Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET' }, { status: 500 });
    }

    const token = await exchangeCode(
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
      })
    );

    const now = Date.now();
    const expiresAt = new Date(now + token.expires_in * 1000).toISOString();

    // Persist connection (MVP: stored in workspace_integrations.data)
    // NOTE: refresh_token may only be returned on first consent; keep existing if missing.
    const { data: existing } = await svc
      .from('workspace_integrations')
      .select('id, data')
      .eq('workspace_id', workspaceId)
      .filter(`data->>provider`, 'eq', 'google')
      .filter(`data->>product`, 'eq', product)
      .maybeSingle();

    const existingData = existing?.data && typeof existing.data === 'object' ? existing.data : {};
    const merged = {
      ...existingData,
      provider: 'google',
      product,
      scopes,
      access_token: token.access_token,
      refresh_token: token.refresh_token || existingData.refresh_token || null,
      expires_at: expiresAt,
      token_type: token.token_type,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error: upErr } = await svc
        .from('workspace_integrations')
        .update({ data: merged, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (upErr) throw upErr;
    } else {
      const { error: insErr } = await svc.from('workspace_integrations').insert({
        workspace_id: workspaceId,
        created_at: new Date().toISOString(),
        data: merged,
      });
      if (insErr) throw insErr;
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('[google-oauth-exchange]', e);
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
});

