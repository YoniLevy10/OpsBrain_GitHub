import { getSupabaseServiceClient } from './supabase.ts';

type WorkspaceIntegrationRow = {
  id: string;
  data: Record<string, unknown> | null;
};

function asString(v: unknown) {
  return typeof v === 'string' ? v : null;
}

function isExpired(expiresAtIso: string | null) {
  if (!expiresAtIso) return true;
  const expiresAt = Date.parse(expiresAtIso);
  if (Number.isNaN(expiresAt)) return true;
  // refresh ~60s before expiry
  return Date.now() > expiresAt - 60_000;
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google token refresh failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; expires_in: number; token_type: string; scope?: string };
}

export async function getGoogleAccessToken(workspaceId: string, product: 'gmail' | 'calendar') {
  const svc = getSupabaseServiceClient();

  const { data: row, error } = await svc
    .from('workspace_integrations')
    .select('id, data')
    .eq('workspace_id', workspaceId)
    .filter('data->>provider', 'eq', 'google')
    .filter('data->>product', 'eq', product)
    .maybeSingle<WorkspaceIntegrationRow>();
  if (error) throw error;
  if (!row?.id) return { ok: false as const, status: 409, error: `Google ${product} not connected` };

  const data = (row.data && typeof row.data === 'object' ? row.data : {}) as Record<string, unknown>;
  const accessToken = asString(data.access_token);
  const refreshToken = asString(data.refresh_token);
  const expiresAt = asString(data.expires_at);

  if (accessToken && !isExpired(expiresAt)) return { ok: true as const, accessToken };
  if (!refreshToken) return { ok: false as const, status: 409, error: 'Missing refresh_token (reconnect Google)' };

  const refreshed = await refreshAccessToken(refreshToken);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const merged = {
    ...data,
    access_token: refreshed.access_token,
    expires_at: newExpiresAt,
    token_type: refreshed.token_type,
    updated_at: new Date().toISOString(),
  };

  const { error: upErr } = await svc
    .from('workspace_integrations')
    .update({ data: merged, updated_at: new Date().toISOString() })
    .eq('id', row.id);
  if (upErr) throw upErr;

  return { ok: true as const, accessToken: refreshed.access_token };
}

