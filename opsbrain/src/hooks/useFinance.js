import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useFinance() {
  const { workspaceId } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('finance_records')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false });
    if (err) {
      setError(err);
      setRecords([]);
      setLoading(false);
      return;
    }
    setRecords(data ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addRecord = useCallback(
    async (payload) => {
      if (!workspaceId) throw new Error('Missing workspace');
      const { data, error: err } = await supabase
        .from('finance_records')
        .insert({ ...payload, workspace_id: workspaceId })
        .select()
        .single();
      if (err) throw err;
      setRecords((prev) => [data, ...prev]);
      return data;
    },
    [workspaceId]
  );

  const deleteRecord = useCallback(async (id) => {
    const { error: err } = await supabase.from('finance_records').delete().eq('id', id);
    if (err) throw err;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const totals = useMemo(() => {
    const totalIncome = records
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalExpense = records
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
  }, [records]);

  return { records, loading, error, refresh, addRecord, deleteRecord, totals };
}

