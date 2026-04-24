import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export function useContacts() {
  const { workspaceId } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setContacts([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err);
      setContacts([]);
      setLoading(false);
      return;
    }
    setContacts(data ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upsertContact = useCallback(
    async ({ id, ...payload }) => {
      if (!workspaceId) throw new Error('Missing workspace');
      if (id) {
        const { data, error: err } = await supabase
          .from('contacts')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (err) throw err;
        setContacts((prev) => prev.map((c) => (c.id === id ? data : c)));
        return data;
      }

      const { data, error: err } = await supabase
        .from('contacts')
        .insert({ ...payload, workspace_id: workspaceId })
        .select()
        .single();
      if (err) throw err;
      setContacts((prev) => [data, ...prev]);
      return data;
    },
    [workspaceId]
  );

  const deleteContact = useCallback(async (id) => {
    const { error: err } = await supabase.from('contacts').delete().eq('id', id);
    if (err) throw err;
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { contacts, loading, error, refresh, upsertContact, deleteContact };
}

