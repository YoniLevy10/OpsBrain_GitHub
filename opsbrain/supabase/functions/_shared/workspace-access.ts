import { getSupabaseAuthClient, getSupabaseServiceClient } from './supabase.ts';

export async function requireWorkspaceAccess(req: Request, workspaceId: string) {
  const supabaseAuth = getSupabaseAuthClient(req);
  const { data: authData, error: authErr } = await supabaseAuth.auth.getUser();
  if (authErr || !authData?.user?.id) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  const userId = authData.user.id;
  const svc = getSupabaseServiceClient();
  const { data: member, error: memberErr } = await svc
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();
  if (memberErr) return { ok: false as const, status: 500, error: String(memberErr.message || memberErr) };
  if (!member?.id) return { ok: false as const, status: 403, error: 'Forbidden' };

  return { ok: true as const, userId, svc };
}

