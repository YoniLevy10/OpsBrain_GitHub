import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useTasks() {
  const { workspaceId, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err);
      setTasks([]);
      setLoading(false);
      return;
    }
    setTasks(data ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (payload) => {
      if (!workspaceId) throw new Error('Missing workspace');
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error: err } = await supabase
        .from('tasks')
        .insert({
          workspace_id: workspaceId,
          created_by: user.id,
          ...payload,
        })
        .select()
        .single();
      if (err) throw err;
      setTasks((prev) => [data, ...prev]);
      return data;
    },
    [user?.id, workspaceId]
  );

  const updateTask = useCallback(async (id, updates) => {
    const { error: err } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw err;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTask = useCallback(async (id) => {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) throw err;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const byStatus = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const k = t.status || 'todo';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(t);
    }
    return map;
  }, [tasks]);

  return { tasks, byStatus, loading, error, refresh, addTask, updateTask, deleteTask };
}

