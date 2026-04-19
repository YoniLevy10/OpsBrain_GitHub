/**
 * זיהוי דפוסים והזנת תובנות ל-ai_insights (פעם ביום לכל workspace).
 */
export async function detectPatterns(workspaceId, supabase) {
  if (!workspaceId || !supabase) return;

  const dayKey = `opsbrain_ai_patterns_${workspaceId}_${new Date().toISOString().slice(0, 10)}`;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dayKey)) return;
  } catch {
    /* ignore */
  }

  const insights = [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, created_at')
    .eq('workspace_id', workspaceId);

  const blockedTasks = tasks?.filter((t) => t.status === 'blocked') || [];
  if (blockedTasks.length > 2) {
    insights.push({
      workspace_id: workspaceId,
      type: 'alert',
      content: `יש ${blockedTasks.length} משימות חסומות — ייתכן שיש חסם ארגוני שצריך לטפל בו`,
      source_module: 'tasks',
      severity: 'warning',
    });
  }

  const { data: finance } = await supabase
    .from('finance_records')
    .select('type, amount')
    .eq('workspace_id', workspaceId)
    .eq('type', 'expense');

  const totalExpense = (finance || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  if (totalExpense > 50000) {
    insights.push({
      workspace_id: workspaceId,
      type: 'pattern',
      content: `ההוצאות הכוללות עברו ₪${totalExpense.toLocaleString()} — בדוק תקציב`,
      source_module: 'finance',
      severity: 'info',
    });
  }

  if (insights.length > 0) {
    await supabase.from('ai_insights').insert(insights);
  }

  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(dayKey, '1');
  } catch {
    /* ignore */
  }
}
