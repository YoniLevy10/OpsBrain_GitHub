import { googleAuthConfig, encodeState } from '../_shared/google.ts';
import { getSupabaseAuthClient } from '../_shared/supabase.ts';

type Body = {
  workspace_id: string;
  product: 'gmail' | 'calendar' | string;
  redirect_uri: string;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = (await req.json()) as Body;
    const workspaceId = body?.workspace_id;
    const redirectUri = body?.redirect_uri;
    const { product, scopes } = googleAuthConfig(body?.product);

    if (!workspaceId || !redirectUri) {
      return Response.json({ error: 'Missing workspace_id or redirect_uri' }, { status: 400 });
    }

    // Validate user is authenticated
    const supabaseAuth = getSupabaseAuthClient(req);
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !authData?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Include workspace_id/product in state so callback can complete.
    const state = encodeState({
      workspace_id: workspaceId,
      product,
      v: 1,
    });

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    if (!clientId) return Response.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      scope: scopes.join(' '),
      state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return Response.json({ url });
  } catch (e) {
    console.error('[google-oauth-start]', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});

